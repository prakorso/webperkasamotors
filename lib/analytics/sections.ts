/**
 * Source-isolated section state (pure). Every dashboard section resolves to
 * one of these, never throws to the page, so one failing Google source can
 * not blank the rest of the module.
 *
 *  ok          data present
 *  empty       the source answered but there is nothing in the period
 *  processing  the source answered but Google has not produced the data yet
 *              (new custom dimension, new Search Console property)
 *  error       the source failed (message is already user-safe)
 */
export type SectionState<T> =
  | { state: "ok"; data: T; fetchedAt: string }
  | { state: "empty"; fetchedAt: string }
  | { state: "processing"; reason: string; fetchedAt: string; data?: T }
  | { state: "error"; message: string; code: AnalyticsErrorCode };

export type AnalyticsErrorCode = "NOT_CONFIGURED" | "AUTH" | "QUOTA" | "TIMEOUT" | "API" | "UNKNOWN";

/** Error whose message is safe to show to staff (no credentials, no raw upstream text). */
export class AnalyticsError extends Error {
  readonly code: AnalyticsErrorCode;
  constructor(code: AnalyticsErrorCode, message: string) {
    super(message);
    this.name = "AnalyticsError";
    this.code = code;
  }
}

const GENERIC_MESSAGE = "Data tidak dapat dimuat saat ini. Coba lagi beberapa saat lagi.";

/**
 * Runs `load` and converts any failure into an error state. Unknown errors
 * (anything that is not an AnalyticsError) are reduced to a generic message
 * so raw upstream text can never reach the page.
 */
export async function settle<T>(load: () => Promise<SectionState<T>>): Promise<SectionState<T>> {
  try {
    return await load();
  } catch (e) {
    if (e instanceof AnalyticsError) return { state: "error", message: e.message, code: e.code };
    return { state: "error", message: GENERIC_MESSAGE, code: "UNKNOWN" };
  }
}
