"use client";

import { useMemo, useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { formatIDR } from "@/lib/utils/format";

const TENORS = [12, 24, 36, 48, 60];

/**
 * WORKING — this is real client-side arithmetic, not mock data. It needs
 * no backend, so it's fully functional in Phase 1 unlike the other forms
 * on this site.
 */
export function FinancingCalculator() {
  const [price, setPrice] = useState(500_000_000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [tenor, setTenor] = useState(36);
  const [rate, setRate] = useState(6.5);

  const { downPayment, principal, monthlyPayment, totalPayment } = useMemo(() => {
    const dp = Math.round((price * downPaymentPct) / 100);
    const loanPrincipal = price - dp;
    const monthlyRate = rate / 100 / 12;
    const payment =
      monthlyRate === 0
        ? loanPrincipal / tenor
        : (loanPrincipal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -tenor));
    return {
      downPayment: dp,
      principal: loanPrincipal,
      monthlyPayment: Math.round(payment),
      totalPayment: Math.round(payment * tenor + dp),
    };
  }, [price, downPaymentPct, tenor, rate]);

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
      <div className="flex flex-col gap-6 lg:col-span-6">
        <div>
          <Label htmlFor="fin-price">Harga Kendaraan</Label>
          <Input
            id="fin-price"
            type="number"
            min={0}
            step={10_000_000}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value) || 0)}
          />
        </div>
        <div>
          <Label htmlFor="fin-dp">Uang Muka (%)</Label>
          <input
            id="fin-dp"
            type="range"
            min={10}
            max={70}
            value={downPaymentPct}
            onChange={(e) => setDownPaymentPct(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <p className="mt-1 font-body text-[13px] text-muted">
            {downPaymentPct}% — {formatIDR(downPayment)}
          </p>
        </div>
        <div>
          <Label htmlFor="fin-tenor">Tenor</Label>
          <div className="flex flex-wrap gap-2">
            {TENORS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTenor(t)}
                aria-pressed={tenor === t}
                className={
                  "h-10 border px-4 font-body text-[13px] transition-colors " +
                  (tenor === t
                    ? "border-ink bg-ink text-paper"
                    : "border-border bg-surface text-ink hover:border-ink")
                }
              >
                {t} bln
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="fin-rate">Suku Bunga (% / tahun)</Label>
          <Input
            id="fin-rate"
            type="number"
            min={0}
            step={0.1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="flex flex-col justify-between border border-border bg-surface p-8 lg:col-span-6">
        <div>
          <p className="font-body text-label uppercase tracking-[0.1em] text-muted">
            Estimasi Cicilan / Bulan
          </p>
          <p className="mt-3 font-display text-display-sm text-primary">
            {formatIDR(monthlyPayment)}
          </p>
        </div>
        <dl className="mt-8 divide-y divide-border border-t border-border">
          <div className="flex justify-between py-3">
            <dt className="font-body text-[13px] text-muted">Pokok Pinjaman</dt>
            <dd className="font-body text-[13px] font-medium text-ink">
              {formatIDR(principal)}
            </dd>
          </div>
          <div className="flex justify-between py-3">
            <dt className="font-body text-[13px] text-muted">Uang Muka</dt>
            <dd className="font-body text-[13px] font-medium text-ink">
              {formatIDR(downPayment)}
            </dd>
          </div>
          <div className="flex justify-between py-3">
            <dt className="font-body text-[13px] text-muted">Estimasi Total Pembayaran</dt>
            <dd className="font-body text-[13px] font-medium text-ink">
              {formatIDR(totalPayment)}
            </dd>
          </div>
        </dl>
        <p className="mt-6 font-body text-[12px] text-muted-2">
          Estimasi ini bersifat indikatif dan dihitung sepenuhnya di
          browser Anda — belum terhubung ke pengajuan kredit sungguhan.
        </p>
      </div>
    </div>
  );
}
