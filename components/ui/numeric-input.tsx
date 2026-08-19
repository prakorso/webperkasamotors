"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface NumericInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  /** Raw number, or null for empty. Never a formatted string — the caller
   *  never sees commas, only this component does. */
  value: number | null;
  onChange: (value: number | null) => void;
}

function formatDigits(digits: string): string {
  if (!digits) return "";
  // Digits-only input, so this is always a valid non-negative integer —
  // no decimal point, no minus sign to reformat around.
  return new Intl.NumberFormat("en-US").format(Number(digits));
}

/**
 * Thousands-separator numeric input (1,500,000) for integer vehicle
 * fields (price, mileage, capacity CC) — display formatting only, the
 * value the caller stores/sends to the database is always a plain
 * number (or null when empty), never a formatted string.
 *
 * Digits-only editing: every keystroke/paste strips everything but 0-9
 * before it's re-formatted, so there's never a decimal point or minus
 * sign to fight with — matches every field this is used for (price,
 * mileage_km, capacity_cc are all non-negative integer columns). Focus
 * selects the whole value, so a default 0 (or any existing value) can be
 * cleared and retyped immediately without a separate delete step.
 *
 * Cursor position is preserved across reformatting by counting digits to
 * the left of the caret before the format pass and restoring that same
 * digit count after — otherwise every keystroke would bounce the caret
 * to the end of the field.
 */
export const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ value, onChange, className, onFocus, ...props }, forwardedRef) => {
    const [display, setDisplay] = React.useState(() =>
      value === null || value === undefined ? "" : formatDigits(String(value))
    );
    const innerRef = React.useRef<HTMLInputElement>(null);
    const pendingCaretDigits = React.useRef<number | null>(null);

    // Keep the displayed text in sync when `value` changes from outside
    // this component (e.g. a different vehicle loaded into the same
    // mounted form) — but not while the user is actively typing (that
    // path already sets `display` itself, via handleChange below).
    React.useEffect(() => {
      const currentDigits = display.replace(/\D/g, "");
      const nextDigits = value === null || value === undefined ? "" : String(value);
      if (currentDigits !== nextDigits) {
        setDisplay(formatDigits(nextDigits));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    React.useLayoutEffect(() => {
      const target = pendingCaretDigits.current;
      if (target === null) return;
      pendingCaretDigits.current = null;
      const el = innerRef.current;
      if (!el) return;

      let pos = display.length;
      if (target === 0) {
        pos = 0;
      } else {
        let seen = 0;
        for (let i = 0; i < display.length; i++) {
          if (/[0-9]/.test(display[i])) seen++;
          if (seen === target) {
            pos = i + 1;
            break;
          }
        }
      }
      el.setSelectionRange(pos, pos);
    }, [display]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const input = e.target;
      const raw = input.value;
      const caret = input.selectionStart ?? raw.length;
      const digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, "").length;
      const digits = raw.replace(/\D/g, "");

      pendingCaretDigits.current = digitsBeforeCaret;
      setDisplay(formatDigits(digits));
      onChange(digits ? Number(digits) : null);
    }

    return (
      <input
        ref={(node) => {
          innerRef.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={display}
        onChange={handleChange}
        onFocus={(e) => {
          e.target.select();
          onFocus?.(e);
        }}
        className={cn(
          "h-11 w-full border border-border bg-surface px-3 font-body text-body text-ink placeholder:text-muted-2",
          "focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
NumericInput.displayName = "NumericInput";
