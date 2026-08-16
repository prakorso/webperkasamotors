"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import type { VehicleMedia } from "@/lib/types";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

/**
 * Fullscreen photo viewer — opened from VehicleGallery (clicking the main
 * photo or a thumbnail). Reuses the exact same VehicleMedia[] the gallery
 * already has; no separate fetch, no new storage/upload concern at all,
 * this is a pure presentational overlay.
 *
 * No dialog/modal library existed anywhere in this codebase, and none was
 * added — this is a plain fixed-position overlay, consistent with how
 * HeroSlideshow was built (no new dependency for a self-contained
 * interactive piece).
 *
 * Zoom/pan is implemented with the Pointer Events API directly rather
 * than a gesture library: one pointer down while zoomed pans by drag,
 * two simultaneous pointers pinch-zoom by tracking the distance between
 * them. This is the same unified API for mouse and touch, so desktop
 * (click to zoom, drag to pan) and mobile (pinch to zoom, drag to pan)
 * share one implementation rather than separate mouse/touch handlers.
 */
export function VehicleLightbox({
  media,
  initialIndex,
  onClose,
}: {
  media: VehicleMedia[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartZoom = useRef(1);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const panStart = useRef({ x: 0, y: 0 });

  const active = media[index];

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const goTo = useCallback(
    (newIndex: number) => {
      setIndex((newIndex + media.length) % media.length);
      resetZoom();
    },
    [media.length, resetZoom]
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goTo(index - 1);
      else if (e.key === "ArrowRight") goTo(index + 1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, goTo, onClose]);

  // Prevent the page behind the lightbox from scrolling while it's open.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setIsInteracting(true);

    if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      pinchStartDist.current = distance(pts[0], pts[1]);
      pinchStartZoom.current = zoom;
    } else if (pointers.current.size === 1 && zoom > 1) {
      dragStart.current = { x: e.clientX, y: e.clientY };
      panStart.current = pan;
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStartDist.current) {
      const pts = Array.from(pointers.current.values());
      const newDist = distance(pts[0], pts[1]);
      const nextZoom = pinchStartZoom.current * (newDist / pinchStartDist.current);
      setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom)));
    } else if (pointers.current.size === 1 && dragStart.current && zoom > 1) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStartDist.current = null;
    if (pointers.current.size === 0) {
      dragStart.current = null;
      setIsInteracting(false);
      if (zoom < 1.05) resetZoom();
    }
  }

  function toggleZoom() {
    if (zoom > 1) resetZoom();
    else setZoom(2);
  }

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-ink/95"
      role="dialog"
      aria-modal="true"
      aria-label="Vehicle photo viewer"
    >
      <div className="flex items-center justify-between px-4 py-3 text-paper">
        <span className="font-body text-[13px] tabular-nums">
          {index + 1} / {media.length}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleZoom}
            aria-label={zoom > 1 ? "Zoom out" : "Zoom in"}
            className="flex h-10 w-10 items-center justify-center text-paper hover:text-primary"
          >
            {zoom > 1 ? <ZoomOut size={20} aria-hidden /> : <ZoomIn size={20} aria-hidden />}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center text-paper hover:text-primary"
          >
            <X size={22} aria-hidden />
          </button>
        </div>
      </div>

      <div
        className="relative flex-1 touch-none overflow-hidden select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={toggleZoom}
      >
        <div
          className="relative h-full w-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isInteracting ? "none" : "transform 200ms ease-out",
            cursor: zoom > 1 ? "grab" : "zoom-in",
          }}
        >
          <Image
            src={active.url}
            alt={active.altText}
            fill
            sizes="100vw"
            className="object-contain"
            draggable={false}
            priority
          />
        </div>
      </div>

      {media.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-ink/50 text-paper transition-colors hover:bg-ink/80 md:left-4"
          >
            <ChevronLeft size={24} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-ink/50 text-paper transition-colors hover:bg-ink/80 md:right-4"
          >
            <ChevronRight size={24} aria-hidden />
          </button>
        </>
      )}
    </div>
  );
}
