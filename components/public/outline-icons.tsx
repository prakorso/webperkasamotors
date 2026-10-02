import type { SVGProps } from "react";

/**
 * Monoline outline icons for the homepage process and payment sections.
 * One family: 48x48 grid, 1.5 stroke, round caps and joins, no fills,
 * currentColor. Inline SVG (no icon dependency). They are decorative -
 * every use sits next to a visible text title - so they are aria-hidden.
 */
function OutlineIcon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      width="48"
      height="48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Pilih Unit: vehicle outline. */
export function CarOutlineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <OutlineIcon {...props}>
      <path d="M10 31H7a1.5 1.5 0 0 1-1.5-1.5v-4a2.5 2.5 0 0 1 1.8-2.4L12 21.8l3.3-5.6a3 3 0 0 1 2.6-1.5h12.2a3 3 0 0 1 2.4 1.2l4.4 5.9 4.2 1.1a2.5 2.5 0 0 1 1.9 2.4v3.7a1.5 1.5 0 0 1-1.5 1.5H38" />
      <path d="M18 31h12" />
      <circle cx="14" cy="31" r="4" />
      <circle cx="34" cy="31" r="4" />
      <path d="M13 21.8h22.5M23.5 14.7v7" />
    </OutlineIcon>
  );
}

/** Hubungi Kami: generic chat bubble (not a brand mark). */
export function ChatOutlineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <OutlineIcon {...props}>
      <path d="M8 13a3 3 0 0 1 3-3h26a3 3 0 0 1 3 3v16a3 3 0 0 1-3 3H22l-8 7v-7h-3a3 3 0 0 1-3-3z" />
      <path d="M15 18.5h18M15 24h11" />
    </OutlineIcon>
  );
}

/** Cek & Sepakati: checklist on a clipboard. */
export function ChecklistOutlineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <OutlineIcon {...props}>
      <path d="M17 9h-4a2 2 0 0 0-2 2v29a2 2 0 0 0 2 2h22a2 2 0 0 0 2-2V11a2 2 0 0 0-2-2h-4" />
      <rect x="17" y="6" width="14" height="7" rx="2" />
      <path d="m17 26 4 4 9-9" />
    </OutlineIcon>
  );
}

/** Pembayaran & Serah Terima: key handover. */
export function KeyOutlineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <OutlineIcon {...props}>
      <circle cx="15" cy="24" r="7" />
      <circle cx="15" cy="24" r="2" />
      <path d="M22 24h20M36 24v6M41 24v4" />
    </OutlineIcon>
  );
}

/** Cash Keras: banknote. */
export function BanknoteOutlineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <OutlineIcon {...props}>
      <rect x="5" y="13" width="38" height="22" rx="2.5" />
      <circle cx="24" cy="24" r="5" />
      <path d="M11 19v.01M37 29v.01" />
    </OutlineIcon>
  );
}

/** Cash Tempo: calendar with a coin. */
export function CalendarCoinOutlineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <OutlineIcon {...props}>
      <rect x="6" y="10" width="36" height="32" rx="3" />
      <path d="M6 19h36M15 6v8M33 6v8" />
      <circle cx="24" cy="30.5" r="5.5" />
      <path d="M24 28v5" />
    </OutlineIcon>
  );
}

/** Cicilan / Kredit: document with lines. */
export function DocumentOutlineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <OutlineIcon {...props}>
      <path d="M12 6.5A1.5 1.5 0 0 1 13.5 5H29l9 9v28.5a1.5 1.5 0 0 1-1.5 1.5h-23a1.5 1.5 0 0 1-1.5-1.5z" />
      <path d="M29 5v9h9M18 24h14M18 30h14M18 36h8" />
    </OutlineIcon>
  );
}
