import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon: LucideIcon;
  emphasis?: boolean;
}

export function StatCard({ label, value, sublabel, icon: Icon, emphasis }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between border p-5",
        emphasis
          ? "border-primary bg-primary text-primary-ink"
          : "border-border bg-surface text-ink"
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "font-body text-[11px] uppercase tracking-[0.08em]",
            emphasis ? "text-primary-ink/80" : "text-muted"
          )}
        >
          {label}
        </span>
        <Icon size={18} aria-hidden />
      </div>
      <div className="mt-6">
        <p className="font-display text-headline-lg">{value}</p>
        {sublabel && (
          <p
            className={cn(
              "mt-1 font-body text-[12px]",
              emphasis ? "text-primary-ink/80" : "text-muted"
            )}
          >
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}
