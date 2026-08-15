/**
 * Normalizes an Indonesian mobile number to the digits-only,
 * country-code-prefixed format WhatsApp's wa.me deep links require
 * (628xxxxxxxxxx — no "+", no leading "0"). Accepts common input shapes:
 * 08xxxxxxxxxx, +628xxxxxxxxxx, 628xxxxxxxxxx, 8xxxxxxxxxx, with or
 * without spaces/dashes. Returns null if the input doesn't look like a
 * real Indonesian mobile number, rather than silently producing a
 * malformed wa.me link.
 *
 * Example: "082233184122" -> "6282233184122"
 */
export function normalizeIndonesianPhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "").replace(/^\+/, "");

  let normalized: string;
  if (digits.startsWith("62")) {
    normalized = digits;
  } else if (digits.startsWith("0")) {
    normalized = `62${digits.slice(1)}`;
  } else if (digits.startsWith("8")) {
    normalized = `62${digits}`;
  } else {
    return null;
  }

  // Indonesian mobile numbers: 62 8[1-9] + 6-10 more digits.
  return /^628[1-9]\d{6,10}$/.test(normalized) ? normalized : null;
}
