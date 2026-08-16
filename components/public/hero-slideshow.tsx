"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Hero, type HeroContent } from "./hero";

const SLIDE_DURATION_MS = 4000;

/**
 * Renders 1–3 resolved Hero slides. app/(public)/page.tsx is the only
 * caller — it already filtered out inactive/empty slides and falls back
 * to DEFAULT_HERO entirely when zero remain, so this component only ever
 * has to handle "here are 1, 2, or 3 real slides to show."
 *
 * - 1 slide: renders a single static Hero — no timer, no indicators, no
 *   crossfade machinery at all (matches the current/original single-hero
 *   behavior exactly).
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
 */
export function HeroSlideshow({ slides }: { slides: HeroContent[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (slides.length <= 1 || prefersReducedMotion) return;

    timerRef.current = setTimeout(() => {
      setActiveIndex((i) => (i + 1) % slides.length);
    }, SLIDE_DURATION_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // Re-armed on every activeIndex change (including manual indicator
    // clicks) so the timer always restarts from a full 4s, and on slide
    // count / motion-preference changes. Cleanup above prevents both
    // duplicate timers and a leak on unmount.
  }, [activeIndex, slides.length, prefersReducedMotion]);

  // Clamp in case a manual click landed on an index that no longer exists
  // (defensive only — slides is static per page render in practice).
  const safeIndex = Math.min(activeIndex, slides.length - 1);

  if (slides.length <= 1) {
    return <Hero {...slides[0]} />;
  }

  // Reduced motion: slides still switch (on click, or the disabled-above
  // auto-timer), but instantly rather than crossfading.
  const transitionClass = prefersReducedMotion ? "" : "transition-opacity duration-700 ease-in-out";

  return (
    <div className="relative">
      {slides.map((slide, i) => (
        <div
          key={i}
          aria-hidden={i !== safeIndex}
          className={
            i === safeIndex
              ? `opacity-100 ${transitionClass}`
              : `pointer-events-none absolute inset-0 opacity-0 ${transitionClass}`
          }
        >
          <Hero {...slide} priority={i === 0} />
        </div>
      ))}

      <div className="absolute inset-x-0 bottom-6 z-20 flex justify-center gap-2 md:bottom-8">
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
