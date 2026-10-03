"use client";

import { useId, useRef, useState, useSyncExternalStore } from "react";
import { WhatsappIcon } from "@/components/icons/social-icons";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { trackWhatsAppClick } from "@/lib/measurement/events";
import {
  EMPTY_SELL_VALUES,
  MONTHS_ID,
  SELL_LIMITS,
  cleanText,
  digitsOnly,
  groupDigits,
  sellVehicleWhatsAppUrl,
  taxYearOptions,
  validateSellVehicle,
  type SellField,
  type SellVehicleValues,
} from "@/lib/utils/sell-vehicle";

interface SellVehicleFormProps {
  /** website_settings.whatsapp — the same official number every other CTA uses. */
  whatsappNumber: string | null;
  companyName: string;
}

const subscribeNever = () => () => {};
/** Current year on the client only (null while rendering on the server), so a statically built page never freezes the year bounds and never mismatches on hydration. */
function useCurrentYear(): number | null {
  return useSyncExternalStore(subscribeNever, () => new Date().getFullYear(), () => null);
}

const selectClass =
  "h-11 w-full rounded-[12px] border border-border bg-surface px-3 font-body text-body text-ink shadow-[0_1px_0_rgba(17,19,21,0.02)] transition-[border-color,box-shadow] duration-200 focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function FieldLabel({ htmlFor, children, optional }: { htmlFor: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block font-body text-[13px] font-semibold text-ink">
      {children}
      {optional && <span className="ml-1 font-normal text-muted">(opsional)</span>}
    </label>
  );
}

function FieldMessage({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error) {
    return (
      <p id={id} className="mt-2 font-body text-[13px] leading-snug text-accent-deep">
        {error}
      </p>
    );
  }
  return hint ? (
    <p id={id} className="mt-2 font-body text-[13px] leading-snug text-muted">
      {hint}
    </p>
  ) : null;
}

export function SellVehicleForm({ whatsappNumber, companyName }: SellVehicleFormProps) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const currentYear = useCurrentYear();
  const formRef = useRef<HTMLFormElement>(null);

  const [values, setValues] = useState<SellVehicleValues>(EMPTY_SELL_VALUES);
  const [touched, setTouched] = useState<Partial<Record<SellField, boolean>>>({});

  // Year bounds need the client clock; until it is known the form is simply not submittable.
  const errors = currentYear === null ? null : validateSellVehicle(values, currentYear);
  const isValid = errors !== null && Object.keys(errors).length === 0;
  const hasDestination = Boolean(whatsappNumber);
  const canSubmit = isValid && hasDestination;

  const set = <K extends keyof SellVehicleValues>(key: K, value: SellVehicleValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));
  const touch = (field: SellField) => setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  const errorFor = (field: SellField) => (touched[field] ? errors?.[field] : undefined);

  const taxYears = currentYear === null ? [] : taxYearOptions(currentYear);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Re-validate here: the disabled button is only a visual affordance, a keyboard submit must hit the same gate.
    if (currentYear === null) return;
    const result = validateSellVehicle(values, currentYear);
    if (Object.keys(result).length > 0) {
      setTouched({
        vehicleType: true, brand: true, model: true, year: true, mileage: true,
        stnk: true, plate: true, price: true, notes: true,
      });
      formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }
    const url = sellVehicleWhatsAppUrl(values, whatsappNumber, companyName);
    if (!url) return;

    // One whatsapp_click through the existing measurement contract. Only the CTA identity is sent — never form values, the message or the URL.
    trackWhatsAppClick({ waLocation: "sell_form", waContext: "sell_vehicle" }, "sell_form", window.location.pathname);
    // window.open (not an <a href>) so the message never sits in a clickable link that automatic outbound-link measurement could read.
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      aria-label="Formulir penawaran kendaraan"
      className="space-y-6 rounded-[20px] border border-border bg-surface p-5 shadow-[0_18px_50px_rgba(17,19,21,0.06)] md:p-8"
    >
      <fieldset aria-describedby={errorFor("vehicleType") ? id("type-msg") : undefined}>
        <legend className="mb-2 font-body text-[13px] font-semibold text-ink">Jenis Kendaraan</legend>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["CAR", "Mobil"],
              ["MOTORCYCLE", "Motor"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="block cursor-pointer">
              <input
                type="radio"
                name="vehicleType"
                value={value}
                checked={values.vehicleType === value}
                onChange={() => {
                  set("vehicleType", value);
                  touch("vehicleType");
                }}
                className="peer sr-only"
              />
              <span className="flex h-11 items-center justify-center rounded-[12px] border border-border bg-surface font-body text-body font-medium text-ink transition-colors duration-200 hover:border-ink peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">
                {label}
              </span>
            </label>
          ))}
        </div>
        <FieldMessage id={id("type-msg")} error={errorFor("vehicleType")} />
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor={id("brand")}>Merek</FieldLabel>
          <Input
            id={id("brand")}
            name="brand"
            value={values.brand}
            maxLength={SELL_LIMITS.maxBrandLength}
            autoComplete="off"
            placeholder="Contoh: Toyota"
            onChange={(e) => set("brand", e.target.value)}
            onBlur={() => touch("brand")}
            aria-invalid={errorFor("brand") ? true : undefined}
            aria-describedby={errorFor("brand") ? id("brand-msg") : undefined}
          />
          <FieldMessage id={id("brand-msg")} error={errorFor("brand")} />
        </div>
        <div>
          <FieldLabel htmlFor={id("model")}>Model / Tipe</FieldLabel>
          <Input
            id={id("model")}
            name="model"
            value={values.model}
            maxLength={SELL_LIMITS.maxModelLength}
            autoComplete="off"
            placeholder="Contoh: Avanza G"
            onChange={(e) => set("model", e.target.value)}
            onBlur={() => touch("model")}
            aria-invalid={errorFor("model") ? true : undefined}
            aria-describedby={errorFor("model") ? id("model-msg") : undefined}
          />
          <FieldMessage id={id("model-msg")} error={errorFor("model")} />
        </div>
        <div>
          <FieldLabel htmlFor={id("year")}>Tahun</FieldLabel>
          <Input
            id={id("year")}
            name="year"
            value={values.year}
            inputMode="numeric"
            maxLength={4}
            autoComplete="off"
            placeholder="Contoh: 2021"
            onChange={(e) => set("year", digitsOnly(e.target.value).slice(0, 4))}
            onBlur={() => touch("year")}
            aria-invalid={errorFor("year") ? true : undefined}
            aria-describedby={errorFor("year") ? id("year-msg") : undefined}
          />
          <FieldMessage id={id("year-msg")} error={errorFor("year")} />
        </div>
        <div>
          <FieldLabel htmlFor={id("mileage")}>Kilometer</FieldLabel>
          <div className="relative">
            <Input
              id={id("mileage")}
              name="mileage"
              value={groupDigits(values.mileage)}
              inputMode="numeric"
              autoComplete="off"
              placeholder="Contoh: 42.000"
              className="pr-12"
              onChange={(e) => set("mileage", digitsOnly(e.target.value).replace(/^0+(?=\d)/, "").slice(0, 7))}
              onBlur={() => touch("mileage")}
              aria-invalid={errorFor("mileage") ? true : undefined}
              aria-describedby={errorFor("mileage") ? id("mileage-msg") : undefined}
            />
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-body text-body text-muted">
              km
            </span>
          </div>
          <FieldMessage id={id("mileage-msg")} error={errorFor("mileage")} />
        </div>
      </div>

      {(
        [
          ["stnk", "Pajak STNK Berlaku Sampai", "stnkMonth", "stnkYear"],
          ["plate", "Pajak 5 Tahunan / Plat Berlaku Sampai", "plateMonth", "plateYear"],
        ] as const
      ).map(([field, label, monthKey, yearKey]) => (
        <fieldset key={field} aria-describedby={errorFor(field) ? id(`${field}-msg`) : undefined}>
          <legend className="mb-2 font-body text-[13px] font-semibold text-ink">{label}</legend>
          <div className="grid grid-cols-2 gap-3">
            <select
              aria-label={`${label}: bulan`}
              name={monthKey}
              value={values[monthKey]}
              onChange={(e) => set(monthKey, e.target.value)}
              onBlur={() => touch(field)}
              aria-invalid={errorFor(field) ? true : undefined}
              className={selectClass}
            >
              <option value="">Bulan</option>
              {MONTHS_ID.map((month, i) => (
                <option key={month} value={String(i + 1)}>
                  {month}
                </option>
              ))}
            </select>
            <select
              aria-label={`${label}: tahun`}
              name={yearKey}
              value={values[yearKey]}
              onChange={(e) => set(yearKey, e.target.value)}
              onBlur={() => touch(field)}
              aria-invalid={errorFor(field) ? true : undefined}
              className={selectClass}
            >
              <option value="">Tahun</option>
              {taxYears.map((year) => (
                <option key={year} value={String(year)}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <FieldMessage id={id(`${field}-msg`)} error={errorFor(field)} />
        </fieldset>
      ))}

      <div>
        <FieldLabel htmlFor={id("price")}>Harga yang Diharapkan</FieldLabel>
        <div className="relative">
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-body text-body text-muted">
            Rp
          </span>
          <Input
            id={id("price")}
            name="price"
            value={groupDigits(values.price)}
            inputMode="numeric"
            autoComplete="off"
            placeholder="Contoh: 185.000.000"
            className="pl-11"
            onChange={(e) => set("price", digitsOnly(e.target.value).replace(/^0+(?=\d)/, "").slice(0, 12))}
            onBlur={() => touch("price")}
            aria-invalid={errorFor("price") ? true : undefined}
            aria-describedby={id("price-msg")}
          />
        </div>
        <FieldMessage
          id={id("price-msg")}
          error={errorFor("price")}
          hint="Masukkan harga yang Anda harapkan. Nilai ini masih dapat didiskusikan lebih lanjut."
        />
      </div>

      <div>
        <FieldLabel htmlFor={id("notes")} optional>
          Catatan Kondisi Unit
        </FieldLabel>
        <Textarea
          id={id("notes")}
          name="notes"
          rows={4}
          value={values.notes}
          maxLength={SELL_LIMITS.maxNotesLength}
          placeholder="Contoh: kondisi terawat, ada lecet ringan di bumper belakang."
          onChange={(e) => set("notes", e.target.value)}
          onBlur={() => touch("notes")}
          aria-invalid={errorFor("notes") ? true : undefined}
          aria-describedby={`${id("notes-msg")} ${id("notes-count")}`}
        />
        <div className="flex items-start justify-between gap-4">
          <FieldMessage
            id={id("notes-msg")}
            error={errorFor("notes")}
            hint="Tuliskan kondisi tambahan atau minus kendaraan jika ada, misalnya lecet, bekas perbaikan, modifikasi, kondisi interior, atau hal lain yang perlu diketahui."
          />
          <p id={id("notes-count")} className="mt-2 shrink-0 font-body text-[13px] tabular-nums text-muted">
            {cleanText(values.notes).length}/{SELL_LIMITS.maxNotesLength}
          </p>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <Button type="submit" size="lg" className="h-auto min-h-[3.25rem] w-full whitespace-normal px-5 py-3 text-center sm:w-auto sm:whitespace-nowrap sm:px-8" disabled={!canSubmit} aria-describedby={id("cta-hint")}>
          <WhatsappIcon size={16} aria-hidden="true" />
          Tawarkan Kendaraan via WhatsApp
        </Button>
        <p id={id("cta-hint")} className="mt-3 font-body text-[13px] leading-snug text-muted">
          {!hasDestination
            ? "Nomor WhatsApp belum tersedia saat ini. Silakan coba lagi nanti."
            : canSubmit
              ? "WhatsApp akan terbuka dengan pesan yang sudah terisi. Pesan baru terkirim jika Anda menekan kirim."
              : "Lengkapi semua kolom wajib untuk mengaktifkan tombol."}
        </p>
      </div>
    </form>
  );
}
