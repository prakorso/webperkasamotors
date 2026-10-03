/**
 * First-party privacy consent store (browser only). The visitor's choice is
 * kept in localStorage under CONSENT_STORAGE_KEY as
 * { status, version, updatedAt } and nothing else: no identity, no
 * profile. No cookie is written and nothing is sent to a server.
 *
 * Measurement (GTM / GA4 / Meta, R1B onward) must read the choice through
 * this module and must treat "no choice yet" exactly like "rejected":
 * googleConsentState() is the Google Consent Mode v2 mapping the future
 * loader passes to gtag('consent', 'default' | 'update', ...).
 */

export const CONSENT_STORAGE_KEY = "perkasa_cookie_consent";
export const CONSENT_VERSION = 1;
export const OPEN_PRIVACY_SETTINGS_EVENT = "perkasa:open-privacy-settings";

export type ConsentStatus = "accepted" | "rejected";

interface StoredConsent {
  status: ConsentStatus;
  version: number;
  updatedAt: string;
}

const listeners = new Set<() => void>();
// Used when storage is unavailable (private mode, blocked site data): the
// choice still applies for this page session instead of throwing.
let memoryStatus: ConsentStatus | null = null;

function readStatus(): ConsentStatus | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return memoryStatus;
    const parsed = JSON.parse(raw) as Partial<StoredConsent>;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed.status === "accepted" || parsed.status === "rejected" ? parsed.status : null;
  } catch {
    return memoryStatus;
  }
}

export function getConsentStatus(): ConsentStatus | null {
  return readStatus();
}

/** Server render has no storage; consumers render nothing consent-dependent until hydrated. */
export function getServerConsentStatus(): undefined {
  return undefined;
}

export function setConsentStatus(status: ConsentStatus): void {
  memoryStatus = status;
  try {
    const value: StoredConsent = { status, version: CONSENT_VERSION, updatedAt: new Date().toISOString() };
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Storage blocked: memoryStatus keeps the choice for this session.
  }
  listeners.forEach((listener) => listener());
}

export function subscribeToConsent(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === CONSENT_STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function openPrivacySettings(): void {
  window.dispatchEvent(new Event(OPEN_PRIVACY_SETTINGS_EVENT));
}

export type GoogleConsentValue = "granted" | "denied";

/** Google Consent Mode v2 state. Everything is denied unless the visitor explicitly accepted. */
export function googleConsentState(status: ConsentStatus | null | undefined): Record<
  "analytics_storage" | "ad_storage" | "ad_user_data" | "ad_personalization",
  GoogleConsentValue
> {
  const value: GoogleConsentValue = status === "accepted" ? "granted" : "denied";
  return {
    analytics_storage: value,
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
  };
}
