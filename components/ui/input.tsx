import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-11 w-full border border-border bg-surface px-3 font-body text-body text-ink placeholder:text-muted-2",
        "focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full border border-border bg-surface px-3 py-2 font-body text-body text-ink placeholder:text-muted-2",
        "focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-2 block font-body text-label font-bold uppercase tracking-[0.08em] text-muted",
        className
      )}
      {...props}
    />
  );
}
