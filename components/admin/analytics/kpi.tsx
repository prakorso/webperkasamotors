import { cn } from "@/lib/utils/cn";

/** Compact KPI tile for the analytics dashboard (denser than the dashboard StatCard). */
export function Kpi({ label, value, hint, emphasis }: { label: string; value: string; hint?: string; emphasis?: boolean }) {
  return (
    <div className={cn("border p-4", emphasis ? "border-ink bg-ink text-paper" : "border-border bg-surface text-ink")}>
      <p className={cn("font-body text-[11px] uppercase tracking-[0.08em]", emphasis ? "text-paper/70" : "text-muted")}>{label}</p>
      <p className="mt-2 font-display text-[28px] font-semibold leading-none tabular-nums">{value}</p>
      {hint && <p className={cn("mt-2 font-body text-[11px] leading-snug", emphasis ? "text-paper/70" : "text-muted-2")}>{hint}</p>}
    </div>
  );
}

export function InsightCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-border bg-surface p-4">
      <h3 className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}
