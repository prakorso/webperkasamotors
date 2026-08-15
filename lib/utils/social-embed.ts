import "server-only";

/**
 * Platform detection + best-effort oEmbed lookup for the "paste a URL"
 * Social Content workflow (lib/actions/content.ts's addSocialContent).
 *
 * What's actually reliable here was verified live, not assumed, on
 * 2026-08-15:
 *
 * - YouTube: public oEmbed (youtube.com/oembed), no auth, returns a
 *   stable, non-expiring thumbnail_url (i.ytimg.com).
 * - TikTok: public oEmbed (tiktok.com/oembed), no auth, returns
 *   thumbnail_url — but it's a CDN-signed URL that expires in roughly
 *   48 hours (confirmed by decoding a real response's x-expires
 *   param). Never store or hotlink it directly — the caller must
 *   download the bytes immediately and mirror them into our own
 *   storage, which is exactly what addSocialContent does.
 * - Instagram: oEmbed via graph.facebook.com/instagram_oembed is
 *   tokenless as of a June 2026 Meta policy change (previously
 *   required an app access token from Oct 2020), but the response
 *   contains no thumbnail_url field at all — only an html embed
 *   widget meant for Instagram's own embed.js script. There is no
 *   plain image URL to extract this way. A real thumbnail would
 *   require the full Instagram Graph API with an OAuth-connected
 *   Business account — a separate integration, not a URL paste.
 * - Facebook: oEmbed requires a registered Meta app + access token
 *   (confirmed against Meta's own docs) — real setup cost, not
 *   available today.
 *
 * So fetchOEmbedPreview only ever attempts YouTube/TikTok. Instagram
 * and Facebook links save successfully with no thumbnail — the UI
 * shows a "Preview unavailable" state, never a substituted image.
 */

export type SocialPlatform = "YOUTUBE" | "TIKTOK" | "INSTAGRAM" | "FACEBOOK" | "OTHER";

export function detectSocialPlatform(url: string): SocialPlatform {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return "OTHER";
  }
  if (host.includes("youtube.com") || host.includes("youtu.be")) return "YOUTUBE";
  if (host.includes("tiktok.com")) return "TIKTOK";
  if (host.includes("instagram.com")) return "INSTAGRAM";
  if (host.includes("facebook.com") || host.includes("fb.watch")) return "FACEBOOK";
  return "OTHER";
}

const FETCH_TIMEOUT_MS = 6000;

/** Generic fetch with a hard timeout — never lets a slow/hanging external host stall a save. Returns null on any failure, never throws. */
export async function fetchWithTimeout(url: string): Promise<Response | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res.ok ? res : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export interface OEmbedPreview {
  thumbnailUrl: string | null;
  title: string | null;
}

const EMPTY_PREVIEW: OEmbedPreview = { thumbnailUrl: null, title: null };

/**
 * Best-effort — see the file header for exactly which platforms this
 * can succeed for and why. Never throws; a failed, timed-out, or
 * unsupported-platform lookup returns EMPTY_PREVIEW, which the caller
 * treats as "no preview available", not an error that blocks saving.
 */
export async function fetchOEmbedPreview(url: string, platform: SocialPlatform): Promise<OEmbedPreview> {
  if (platform !== "YOUTUBE" && platform !== "TIKTOK") return EMPTY_PREVIEW;

  const oembedUrl =
    platform === "YOUTUBE"
      ? `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
      : `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;

  const res = await fetchWithTimeout(oembedUrl);
  if (!res) return EMPTY_PREVIEW;

  try {
    const data = (await res.json()) as { thumbnail_url?: unknown; title?: unknown };
    return {
      thumbnailUrl: typeof data.thumbnail_url === "string" ? data.thumbnail_url : null,
      title: typeof data.title === "string" ? data.title : null,
    };
  } catch {
    return EMPTY_PREVIEW;
  }
}
