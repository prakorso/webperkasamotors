import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

/**
 * "Jual Kendaraan" (/sell) — pure validation, formatting and WhatsApp
 * message building. Frontend-only: nothing here (or on the page) posts to
 * a backend; the only output is a wa.me URL the visitor chooses to send.
 * Pure module (no React, no server-only imports) so the form component
 * and any test can share it.
 */

export type SellVehicleType = "CAR" | "MOTORCYCLE";

/** Raw form state: everything is a string exactly as the visitor typed or selected it. */
export interface SellVehicleValues {
  vehicleType: SellVehicleType | "";
  brand: string;
  model: string;
  year: string;
  /** Digits only (the input shows grouped digits, state never holds punctuation). */
  mileage: string;
  stnkMonth: string;
  stnkYear: string;
  plateMonth: string;
  plateYear: string;
  /** Digits only. */
  price: string;
  notes: string;
}

export const EMPTY_SELL_VALUES: SellVehicleValues = {
  vehicleType: "",
  brand: "",
  model: "",
  year: "",
  mileage: "",
  stnkMonth: "",
  stnkYear: "",
  plateMonth: "",
  plateYear: "",
  price: "",
  notes: "",
};

export const SELL_LIMITS = {
  minVehicleYear: 1980,
  /** Highest model year accepted = current year + this. */
  vehicleYearAhead: 1,
  maxMileageKm: 1_000_000,
  minPriceIdr: 500_000,
  maxPriceIdr: 10_000_000_000,
  maxBrandLength: 40,
  maxModelLength: 60,
  maxNotesLength: 500,
  /** Tax / plate expiry year choices: from `taxYearsBack` before the current year to `taxYearsAhead` after. */
  taxYearsBack: 3,
  taxYearsAhead: 7,
} as const;

export const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

export type SellField =
  | "vehicleType"
  | "brand"
  | "model"
  | "year"
  | "mileage"
  | "stnk"
  | "plate"
  | "price"
  | "notes";

export type SellErrors = Partial<Record<SellField, string>>;

/** Trim and collapse any run of whitespace (including newlines) to one space, so a free-text value always stays on one WhatsApp line. */
export function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Indonesian thousands grouping: 185000000 -> "185.000.000". Digits in, digits out; "" stays "". */
export function groupDigits(digits: string): string {
  const clean = digitsOnly(digits).replace(/^0+(?=\d)/, "");
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatKilometers(km: number): string {
  return `${groupDigits(String(km))} km`;
}

/** "Rp185.000.000" — no space, as in the locked message format. */
export function formatRupiah(amount: number): string {
  return `Rp${groupDigits(String(amount))}`;
}

export function formatMonthYear(month: string, year: string): string {
  return `${MONTHS_ID[Number(month) - 1]} ${year}`;
}

export function vehicleTypeLabel(type: SellVehicleType): string {
  return type === "CAR" ? "Mobil" : "Motor";
}

/** Years offered in the tax / plate expiry selects, ascending. */
export function taxYearOptions(currentYear: number): number[] {
  const first = currentYear - SELL_LIMITS.taxYearsBack;
  const count = SELL_LIMITS.taxYearsBack + SELL_LIMITS.taxYearsAhead + 1;
  return Array.from({ length: count }, (_, i) => first + i);
}

function isMonth(value: string): boolean {
  return /^(?:[1-9]|1[0-2])$/.test(value);
}

function isTaxYear(value: string, currentYear: number): boolean {
  return taxYearOptions(currentYear).some((y) => String(y) === value);
}

/**
 * The single validation source — used by the UI (inline errors, CTA
 * disabled state) AND by the submit handler, so a keyboard submit can
 * never get past an invalid state. `currentYear` is injected so the year
 * bounds are dynamic without this module reading the clock.
 */
export function validateSellVehicle(values: SellVehicleValues, currentYear: number): SellErrors {
  const errors: SellErrors = {};

  if (values.vehicleType !== "CAR" && values.vehicleType !== "MOTORCYCLE") {
    errors.vehicleType = "Pilih jenis kendaraan.";
  }

  const brand = cleanText(values.brand);
  if (!brand) errors.brand = "Isi merek kendaraan.";
  else if (brand.length > SELL_LIMITS.maxBrandLength) errors.brand = `Maksimal ${SELL_LIMITS.maxBrandLength} karakter.`;

  const model = cleanText(values.model);
  if (!model) errors.model = "Isi model atau tipe kendaraan.";
  else if (model.length > SELL_LIMITS.maxModelLength) errors.model = `Maksimal ${SELL_LIMITS.maxModelLength} karakter.`;

  const maxYear = currentYear + SELL_LIMITS.vehicleYearAhead;
  if (!values.year) {
    errors.year = "Isi tahun kendaraan.";
  } else if (!/^\d{4}$/.test(values.year) || Number(values.year) < SELL_LIMITS.minVehicleYear || Number(values.year) > maxYear) {
    errors.year = `Masukkan tahun antara ${SELL_LIMITS.minVehicleYear} dan ${maxYear}.`;
  }

  if (!values.mileage) {
    errors.mileage = "Isi kilometer kendaraan.";
  } else if (!/^\d+$/.test(values.mileage) || Number(values.mileage) > SELL_LIMITS.maxMileageKm) {
    errors.mileage = `Masukkan kilometer antara 0 dan ${groupDigits(String(SELL_LIMITS.maxMileageKm))}.`;
  }

  if (!isMonth(values.stnkMonth) || !isTaxYear(values.stnkYear, currentYear)) {
    errors.stnk = "Pilih bulan dan tahun pajak STNK.";
  }
  if (!isMonth(values.plateMonth) || !isTaxYear(values.plateYear, currentYear)) {
    errors.plate = "Pilih bulan dan tahun pajak 5 tahunan / plat.";
  }

  if (!values.price) {
    errors.price = "Isi harga yang Anda harapkan.";
  } else if (
    !/^\d+$/.test(values.price) ||
    Number(values.price) < SELL_LIMITS.minPriceIdr ||
    Number(values.price) > SELL_LIMITS.maxPriceIdr
  ) {
    errors.price = `Masukkan harga antara ${formatRupiah(SELL_LIMITS.minPriceIdr)} dan ${formatRupiah(SELL_LIMITS.maxPriceIdr)}.`;
  }

  if (cleanText(values.notes).length > SELL_LIMITS.maxNotesLength) {
    errors.notes = `Maksimal ${SELL_LIMITS.maxNotesLength} karakter.`;
  }

  return errors;
}

export function isSellVehicleValid(values: SellVehicleValues, currentYear: number): boolean {
  return Object.keys(validateSellVehicle(values, currentYear)).length === 0;
}

/**
 * The locked WhatsApp message. Only call with values that passed
 * validateSellVehicle. The notes row is omitted entirely when empty.
 * Makes no claim of price acceptance, inspection or a deal.
 */
export function buildSellVehicleMessage(values: SellVehicleValues, companyName: string): string {
  const rows = [
    `Jenis Kendaraan: ${vehicleTypeLabel(values.vehicleType as SellVehicleType)}`,
    `Merek: ${cleanText(values.brand)}`,
    `Model / Tipe: ${cleanText(values.model)}`,
    `Tahun: ${values.year}`,
    `Kilometer: ${formatKilometers(Number(values.mileage))}`,
    `Pajak STNK Berlaku Sampai: ${formatMonthYear(values.stnkMonth, values.stnkYear)}`,
    `Pajak 5 Tahunan / Plat Berlaku Sampai: ${formatMonthYear(values.plateMonth, values.plateYear)}`,
    `Harga yang Diharapkan: ${formatRupiah(Number(values.price))}`,
  ];
  const notes = cleanText(values.notes);
  if (notes) rows.push(`Catatan Kondisi Unit: ${notes}`);

  return [
    `Halo ${companyName}, saya ingin menawarkan kendaraan berikut:`,
    "",
    ...rows,
    "",
    "Mohon dibantu review penawaran kendaraan saya. Saya terbuka untuk diskusi lebih lanjut terkait harga dan proses selanjutnya. Terima kasih.",
  ].join("\n");
}

/** wa.me URL for the same official number every other CTA uses (website_settings.whatsapp), or null when none is configured. */
export function sellVehicleWhatsAppUrl(
  values: SellVehicleValues,
  whatsappNumber: string | null,
  companyName: string
): string | null {
  return buildWhatsAppUrl(whatsappNumber, buildSellVehicleMessage(values, companyName));
}
