import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-body text-label uppercase tracking-[0.1em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-ink hover:bg-primary-hover",
        secondary:
          "border border-ink bg-transparent text-ink hover:bg-ink hover:text-paper",
        ghost: "text-ink hover:bg-surface-muted",
        outline: "border border-border bg-transparent text-ink hover:border-ink",
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
