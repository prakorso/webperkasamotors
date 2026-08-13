import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 border px-2.5 py-1 font-body text-[11px] font-semibold uppercase tracking-[0.08em]",
  {
    variants: {
      variant: {
        neutral: "border-border bg-surface-muted text-ink",
        primary: "border-primary bg-primary text-primary-ink",
        success: "border-success/30 bg-success-bg text-success",
        warning: "border-warning/30 bg-warning-bg text-warning",
        info: "border-info/30 bg-info-bg text-info",
        outline: "border-border bg-transparent text-muted",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
