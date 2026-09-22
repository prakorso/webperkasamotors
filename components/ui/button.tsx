import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] font-body text-label font-semibold uppercase tracking-[0.06em] transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
  {
    variants: {
      variant: {
        primary:
          "border border-primary bg-primary text-primary-ink shadow-[0_10px_24px_rgba(215,25,32,0.18)] hover:border-primary-hover hover:bg-primary-hover hover:shadow-[0_14px_32px_rgba(169,15,21,0.22)]",
        secondary:
          "border border-ink/80 bg-surface text-ink shadow-[0_8px_22px_rgba(17,19,21,0.06)] hover:border-ink hover:bg-ink hover:text-paper hover:shadow-[0_12px_30px_rgba(17,19,21,0.12)]",
        ghost: "text-ink hover:bg-surface-muted",
        outline: "border border-border bg-surface text-ink hover:border-ink hover:bg-paper",
      },
      size: {
        sm: "h-9 px-4 text-[11px]",
        md: "h-11 px-6",
        lg: "h-13 px-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}

/**
 * For a link that should look like a button (e.g. a hero CTA using
 * next/link), apply this to the Link directly instead of nesting a
 * <button> inside an <a> — nesting them is invalid markup.
 *
 *   <Link href="/cars" className={buttonVariants({ variant: "primary", size: "lg" })}>
 */
export { buttonVariants };
