import "server-only";
import { createSign } from "node:crypto";
import { AnalyticsError } from "./sections";

/**
 * Service-account access tokens, server only. The credentials come from
 * Netlify production environment variables (no NEXT_PUBLIC_ prefix) and are
 * never logged, returned or sent to the browser. Signing uses node:crypto
 * (RS256 JWT) and a plain fetch, so no Google SDK dependency is needed.
 */

export const GA4_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
export const SEARCH_CONSOLE_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

interface Credentials {
  email: string;
  privateKey: string;
}

function readCredentials(): Credentials {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !rawKey) {
    throw new AnalyticsError("NOT_CONFIGURED", "Akses Google belum dikonfigurasi di server.");
  }
  // The key may be stored with real newlines or with literal "\n" sequences.
  const privateKey = rawKey.includes("\\n") ? rawKey.replace(/\\n/g, "\n") : rawKey;
  return { email, privateKey };
}

const b64url = (input: string | Buffer) => Buffer.from(input).toString("base64url");

/** Per-scope token cache (module memory; tokens live ~1h, refreshed 5 min early). */
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

export async function getAccessToken(scope: string): Promise<string> {
  const cached = tokenCache.get(scope);
  if (cached && cached.expiresAt - 300_000 > Date.now()) return cached.token;

  const { email, privateKey } = readCredentials();
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({ iss: email, scope, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })
  );

  let signature: string;
  try {
    signature = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(privateKey, "base64url");
  } catch {
    throw new AnalyticsError("AUTH", "Kredensial Google tidak valid.");
  }

  let res: Response;
  try {
    res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: `${header}.${claims}.${signature}`,
      }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
  } catch {
    throw new AnalyticsError("TIMEOUT", "Google tidak merespons. Coba lagi beberapa saat lagi.");
  }
  if (!res.ok) throw new AnalyticsError("AUTH", "Autentikasi ke Google gagal.");
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new AnalyticsError("AUTH", "Autentikasi ke Google gagal.");
  tokenCache.set(scope, { token: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 });
  return json.access_token;
}
