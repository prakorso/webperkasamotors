"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Hero, type HeroContent } from "./hero";

const SLIDE_DURATION_MS = 3000;

/**
 * Renders 1–3 resolved Hero slides. app/(public)/page.tsx is the only
 * caller — it already filtered out inactive/empty slides and falls back
 * to DEFAULT_HERO entirely when zero remain, so this component only ever
 * has to handle "here are 1, 2, or 3 real slides to show."
 *
 * - 1 slide: renders a single static Hero — no timer, no indicators, no
 *   Previous/Next, no crossfade machinery at all (matches the current/
 *   original single-hero behavior exactly).
 * - 2–3 slides: all slides mount simultaneously, stacked; only the active
 *   one is visible (opacity + absolute positioning on the rest), which is
 *   what makes a crossfade possible without a carousel library — the
 *   outgoing and incoming slide are both already in the DOM when the
 *   transition starts. Since every Hero has the same fixed viewport-unit
 *   height, swapping which slide is "in flow" vs. "absolute" never causes
 *   layout shift.
 *
 * Only the first slide gets priority (eager) image loading — the rest
 * load at whatever priority the browser would normally give an
 * already-in-viewport-but-hidden image, so the LCP candidate is always
 * exactly one image, not up to three.
 *
 * Autoplay pauses on hover/focus anywhere in the Hero (mouse or
 * keyboard) and resumes when the pointer/focus leaves — gives a reader
 * time with the content and the CTA without the slide changing under
 * them. No swipe/touch gesture handling was added — touch devices don't
 * fire hover, so autoplay simply continues there, and tapping Previous/
 * Next/indicators/the CTA all work exactly as they already did (nothing
 * intercepts touch events).
 */
export function HeroSlideshow({ slides }: { slides: HeroContent[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (slides.length <= 1 || prefersReducedMotion || isPaused) return;

    timerRef.current = setTimeout(() => {
      setActiveIndex((i) => (i + 1) % slides.length);
    }, SLIDE_DURATION_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // Re-armed on every activeIndex change (manual Previous/Next, an
    // indicator click, or the previous timer firing) so the timer always
    // restarts from a full 3s — this is what makes "manual navigation
    // resets the timer" work, with no separate reset logic needed.
    // Also re-armed on pause/resume and on slide count / motion-
    // preference changes. Cleanup above prevents both duplicate timers
    // and a leak on unmount.
  }, [activeIndex, slides.length, prefersReducedMotion, isPaused]);

  // Clamp in case a manual click landed on an index that no longer exists
  // (defensive only — slides is static per page render in practice).
  const safeIndex = Math.min(activeIndex, slides.length - 1);

  if (slides.length <= 1) {
    return <Hero {...slides[0]} />;
  }

  function goToNext() {
    setActiveIndex((i) => (i + 1) % slides.length);
  }
  function goToPrevious() {
    setActiveIndex((i) => (i - 1 + slides.length) % slides.length);
  }

  // Reduced motion: slides still switch (on click, or the disabled-above
  // auto-timer), but instantly rather than crossfading.
  const transitionClass = prefersReducedMotion ? "" : "transition-opacity duration-700 ease-in-out";

  // PHASE 1.5 fix: the background image/section above crossfades over the
  // full 700ms, which is right for a smooth image transition but is wrong
  // for the text — two headlines both mid-fade are both readable at once
  // (confirmed on screen at 768px). Text now has its own, faster,
  // offset timing, independent of the image: the outgoing slide's text
  // drops to 0 quickly with no delay, the incoming slide's text waits
  // until the outgoing one is guaranteed fully gone before it starts
  // fading in. 200ms out + a 300ms delay before 500ms in leaves a
  // ~100ms gap where neither is visible — text exits, a beat of just the
  // image, then the new text enters, while the image keeps crossfading
  // underneath the whole time. Reduced motion still swaps instantly.
  const textOutClass = prefersReducedMotion ? "opacity-0" : "opacity-0 transition-opacity duration-200 ease-in";
  const textInClass = prefersReducedMotion
    ? "opacity-100"
    : "opacity-100 transition-opacity duration-500 delay-300 ease-out";

  return (
    <div
      // Explicit height on the wrapper itself (matching Hero's own h-[..vh]
      // scale) — every slide below is `absolute inset-0`, including the
      // active one, so sizing never depends on which single slide happens
      // to be "in flow". Previously only the active slide was in normal
      // flow and the rest were absolute; at the moment the active index
      // changed, the outgoing slide switched to absolute while the
      // incoming one switched out of it in the same render, and both were
      // still mid-opacity-transition — a real window where two slides
      // could render fully stacked and visible together (observed at
      // 768px). Every slide now uses the same absolute/inset-0 box at all
      // times, so only opacity (never layout) ever changes between them.
      className="relative h-[68vh] w-full overflow-hidden md:h-[70vh] lg:h-[80vh]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {slides.map((slide, i) => (
        <div
          key={i}
          aria-hidden={i !== safeIndex}
          className={
            i === safeIndex
              ? `absolute inset-0 z-10 opacity-100 ${transitionClass}`
              : `pointer-events-none absolute inset-0 z-0 opacity-0 ${transitionClass}`
          }
        >
          <Hero
            {...slide}
            priority={i === 0}
            textClassName={i === safeIndex ? textInClass : textOutClass}
          />
        </div>
      ))}

      <div className="absolute inset-x-0 bottom-6 z-20 flex items-center justify-center gap-4 md:bottom-8">
        <button
          type="button"
          onClick={goToPrevious}
          aria-label="Previous slide"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-paper/30 text-paper transition-colors hover:border-paper hover:bg-paper/10"
        >
          <ChevronLeft size={18} aria-hidden />
        </button>

        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Show slide ${i + 1} of ${slides.length}`}
              aria-current={i === safeIndex}
              className={
                i === safeIndex
                  ? "h-2 w-6 rounded-full bg-primary transition-all"
                  : "h-2 w-2 rounded-full bg-paper/50 transition-all hover:bg-paper/80"
              }
            />
          ))}
        </div>

        <button
          type="button"
          onClick={goToNext}
          aria-label="Next slide"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-paper/30 text-paper transition-colors hover:border-paper hover:bg-paper/10"
        >
          <ChevronRight size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(callback: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** SSR has no window/matchMedia — assume motion is fine server-side, corrected on the client immediately after hydration via useSyncExternalStore itself (no separate effect, no hydration-mismatch flash). */
function getReducedMotionServerSnapshot() {
  return false;
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );
}
