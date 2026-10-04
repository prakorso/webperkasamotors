/** Indonesian number formatting for the analytics dashboard (pure). */

const INT = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
const ONE_DECIMAL = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const DASH = "—";

/** 1250 -> "1.250" */
export function formatCount(value: number | null | undefined): string {
  return value === null || value === undefined || !Number.isFinite(value) ? DASH : INT.format(Math.round(value));
}

/** 0.125 -> "12,5%" (input is a 0–1 fraction) */
export function formatPercent(fraction: number | null | undefined): string {
  return fraction === null || fraction === undefined || !Number.isFinite(fraction)
    ? DASH
    : `${ONE_DECIMAL.format(fraction * 100)}%`;
}

/** Average position, one decimal: 7.34 -> "7,3" */
export function formatPosition(value: number | null | undefined): string {
  return value === null || value === undefined || !Number.isFinite(value) || value <= 0 ? DASH : ONE_DECIMAL.format(value);
}

/** Ratio such as clicks per view, one decimal: 0.25 -> "0,3" is misleading, so show as a percentage-like ratio "25,0%". */
export function formatRatio(fraction: number | null | undefined): string {
  return formatPercent(fraction);
}
