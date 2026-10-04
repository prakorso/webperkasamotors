"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { formatCount } from "@/lib/analytics/format";
import { formatIsoDate } from "@/lib/analytics/ranges";
import type { TrendPoint } from "@/lib/analytics/metrics";

type Metric = "sessions" | "whatsappClicks";
const METRICS: Array<{ key: Metric; label: string; line: string }> = [
  { key: "sessions", label: "Sesi", line: "text-ink" },
  { key: "whatsappClicks", label: "Klik WhatsApp", line: "text-primary" },
];

/** Smallest "round" axis maximum (1, 2, 5 × 10^n) that fits the data. */
function niceMax(max: number): number {
  if (max <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 2, 5, 10]) if (max <= m * pow) return m * pow;
  return max;
}

const H = 200;
const PAD = { left: 44, right: 12, top: 12, bottom: 28 };

/**
 * One trend chart with a metric toggle (the two series have very different
 * scales, so they are shown one at a time instead of on a misleading dual
 * axis). Plain SVG: no chart dependency.
 */
export function TrendChart({ points }: { points: TrendPoint[] }) {
  const [metric, setMetric] = useState<Metric>("sessions");
  // Draw at true pixel size (1 SVG unit = 1px) so text and markers never scale with the container.
  const frame = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(800);
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setW(Math.max(320, Math.round(entry.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const active = METRICS.find((m) => m.key === metric)!;
  const values = points.map((p) => p[metric]);
  const total = values.reduce((a, b) => a + b, 0);
  const top = niceMax(Math.max(0, ...values));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / top) * innerH;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p[metric]).toFixed(1)}`).join(" ");
  const ticks = [0, 1, 2, 3, 4].map((i) => (top / 4) * i);
  const labelAt = [0, Math.floor((points.length - 1) / 2), points.length - 1].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <section className="border border-border bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Tren harian</h3>
          <p className="mt-1 font-body text-[13px] text-ink">
            {active.label}: <span className="font-semibold tabular-nums">{formatCount(total)}</span> pada periode ini
          </p>
        </div>
        <div role="group" aria-label="Pilih metrik tren" className="flex gap-1">
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              aria-pressed={metric === m.key}
              onClick={() => setMetric(m.key)}
              className={cn(
                "border px-3 py-1.5 font-body text-[12px] font-medium transition-colors",
                metric === m.key ? "border-ink bg-ink text-paper" : "border-border text-muted hover:border-ink hover:text-ink"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div ref={frame} className="w-full">
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Grafik ${active.label} harian, total ${formatCount(total)}`}
        className={cn("block max-w-full", active.line)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="stroke-border" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="fill-muted" fontSize={11}>
              {formatCount(t)}
            </text>
          </g>
        ))}
        <path d={path} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {points.length <= 31 &&
          points.map((p, i) => (
            <circle key={p.date} cx={x(i)} cy={y(p[metric])} r={2.5} fill="currentColor">
              <title>{`${formatIsoDate(p.date)}: ${formatCount(p[metric])}`}</title>
            </circle>
          ))}
        {labelAt.map((i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"} className="fill-muted" fontSize={11}>
            {formatIsoDate(points[i].date)}
          </text>
        ))}
      </svg>
      </div>
    </section>
  );
}
