"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  OPEN_PRIVACY_SETTINGS_EVENT,
  getConsentStatus,
  getServerConsentStatus,
  setConsentStatus,
  subscribeToConsent,
  type ConsentStatus,
} from "@/lib/measurement/consent";

const STATUS_LABEL: Record<ConsentStatus, string> = {
  accepted: "Diterima",
  rejected: "Ditolak",
};

/**
 * Compact first-party consent bar, public site only (mounted from the
 * (public) layout, never /admin). Shown on the first visit until the
 * visitor chooses, and again whenever "Pengaturan Privasi" is used.
 * Terima and Tolak have equal weight. While open it publishes its height
 * as --consent-offset so the page (body padding) and the mobile sticky
 * vehicle CTA sit above it instead of underneath.
 */
export function ConsentBanner() {
  const status = useSyncExternalStore(subscribeToConsent, getConsentStatus, getServerConsentStatus);
  const [reopened, setReopened] = useState(false);
  const barRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const open = status === null || reopened;

  useEffect(() => {
    function onOpen() {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setReopened(true);
    }
    window.addEventListener(OPEN_PRIVACY_SETTINGS_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_PRIVACY_SETTINGS_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (reopened) titleRef.current?.focus();
  }, [reopened]);

  useEffect(() => {
    const bar = barRef.current;
    const root = document.documentElement;
    if (!open || !bar) return;
    const update = () => root.style.setProperty("--consent-offset", `${bar.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--consent-offset");
    };
  }, [open]);

  useEffect(() => {
    if (!reopened || status === null) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  function close() {
    setReopened(false);
    returnFocusRef.current?.focus();
    returnFocusRef.current = null;
  }

  function choose(next: ConsentStatus) {
    setConsentStatus(next);
    close();
  }

  if (status === undefined || !open) return null;

  return (
    <section
      ref={barRef}
      aria-labelledby="consent-title"
      className="fixed inset-x-0 bottom-0 z-[45] border-t border-border bg-surface/[0.98] shadow-[0_-12px_32px_rgba(17,19,21,0.1)] backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-container flex-col gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:flex-row md:items-center md:gap-8 md:px-8 md:py-4 lg:px-margin">
        <div className="min-w-0 flex-1 pr-8 md:pr-0">
          <p
            id="consent-title"
            ref={titleRef}
            tabIndex={-1}
            className="sr-only font-body text-[13px] font-semibold text-ink outline-none lg:not-sr-only"
          >
            Privasi Anda
          </p>
          <p className="font-body text-[13px] leading-relaxed text-muted lg:mt-1">
            Kami memakai cookie analitik dan iklan (Google dan Meta)
            <span className="hidden md:inline"> untuk memahami penggunaan situs dan mengukur iklan</span>{" "}
            hanya jika Anda memilih Terima.{" "}
            <Link href="/privacy" className="font-medium text-ink underline underline-offset-2 hover:text-primary">
              Kebijakan Privasi
            </Link>
          </p>
          {reopened && status && (
            <p className="mt-1 font-body text-[12px] text-muted">
              Pilihan saat ini: <span className="font-semibold text-ink">{STATUS_LABEL[status]}</span>
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" size="sm" className="flex-1 md:flex-none md:px-6" onClick={() => choose("rejected")}>
            Tolak
          </Button>
          <Button variant="secondary" size="sm" className="flex-1 md:flex-none md:px-6" onClick={() => choose("accepted")}>
            Terima
          </Button>
        </div>
        {reopened && status && (
          <button
            type="button"
            onClick={close}
            aria-label="Tutup pengaturan privasi"
            className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-[10px] text-muted transition-colors hover:bg-surface-muted hover:text-ink md:static md:shrink-0"
          >
            <X size={18} aria-hidden />
          </button>
        )}
      </div>
    </section>
  );
}
