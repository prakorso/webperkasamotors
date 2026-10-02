# Perkasa Motors - Hero Responsive Fix R1: Tablet + Mobile Hero Composition

**Result: PASS.** Below 1280px the homepage hero is now image, then content, then CTAs, so nothing sits on top of the vehicle. From 1280px up the original overlay hero is unchanged (verified pixel-for-pixel visually and by measurement). Only two files changed. No CMS, database, copy, destination or other-section change. Nothing merged or deployed.

## A. Base verification
`git fetch origin --prune`: `origin/main` = `6e41cc42001edf5158b5bd0735ba3e4d1c7e7137` at start. Branch `fix/hero-responsive-tablet-mobile`, worktree `.claude/worktrees/hero-responsive-tablet-mobile`, created from exactly that SHA.

**Main moved during the task:** at the final fetch `origin/main` is `15f7512130651528b792759c1cebbb6775d21879` (Owner commit "fix(vehicle): restore mobile sticky handoff"), which changes only `components/public/mobile-vehicle-cta.tsx` (vehicle detail page). It does not touch the hero or either file changed here; a non-destructive merge simulation of this branch into that main is CLEAN. QA was run on the original base; since the two changes are in unrelated components, no hero re-test is needed, but a quick re-check at merge time is recommended.

## B. Current hero audit (before)
`components/public/hero.tsx` + `hero-slideshow.tsx`. The hero was one full-bleed overlay at every size: `h-[72svh] min-h-[540px]` (mobile), `md:h-[74svh]`, `lg:h-[82svh] lg:min-h-[680px]`; the photo `fill` + `object-cover object-center` with a dark gradient scrim; headline, description and BOTH CTAs absolutely layered over it in an `items-center` flex row; slideshow arrows/dots absolutely positioned at the bottom of the same box; slides stacked with `absolute inset-0` inside a fixed-height wrapper. Live slides (the two active ones): slide 1 `hero1Image` 1666x944 (16:9, white hatchback at roughly 33-78% of the width, low in frame), slide 2 `hero2Image` 1535x1024 (3:2, five motorcycles spanning almost the full width, low in frame); slide 3 is inactive.
Measured on production: at 390px the photo box was 390x608 (a portrait crop of a landscape photo), at 768px 753x625, and in every case both CTAs, the headline and the slide controls intersected the photo (`ctaOverImage = 2`, `controlsOverImage = 4`, `h1OverImage = true`).

## C. Root cause
Responsive layout, not button size: a single overlay composition with a viewport-unit height was used at all widths. On narrow screens the text block (headline + description + two large buttons) needs most of the height, so it covers the subject, while `object-cover` on a tall, narrow box crops a wide landscape photo down to a sliver. The slideshow's fixed-height wrapper meant the content could not simply grow below the image.

## D. Desktop behavior (>= 1280px): unchanged
The overlay layout is kept exactly (scrim, brightness/saturation filter, drop shadow, text on the photo, controls overlaid at the bottom). Verified at 2560, 1440 and 1280: hero height 738px (82svh of a 900px viewport, same as production), headline 68px, primary button 191x52 (156 on slide 2) and secondary 289x52, identical to production; before/after screenshots at 1280 are visually identical. The switch point is `xl` (1280px), the same breakpoint this repo's header already uses to switch to its desktop layout (its own comment records that 1024px is a tablet width that crowds the desktop composition).
One regression was caught and fixed during QA: wrapping the primary CTA's classes in `cn()` (twMerge) silently dropped the button's custom `text-label` size (12px -> 16px). The width classes are now appended by plain string concatenation, restoring the exact original button.

## E. Tablet behavior (768-1279px)
Image block first (`aspect 16:10` from 768, `2:1` from 1024), no scrim and no brightness filter, then a solid dark content block: headline (52px, 1-2 lines), short description, then the two CTAs side by side (primary solid red, secondary outlined). Controls sit in normal flow below the content, centered. Nothing overlaps the photo (0 intersections at 1024 and 768). The 2:1 frame at 1024 keeps the headline within the first screen of a 1024x768 tablet; both slide photos keep every vehicle inside that crop.

## F. Mobile behavior (< 768px)
Image block `aspect 3:2` (390px wide -> 390x260), then headline (36-37px, 1-2 lines), description, a full-width primary CTA, and the secondary "Tanya via WhatsApp" as a lighter text-style action (no border, 44px minimum touch height) beneath it, then the controls in flow. Hero height comes from content (about 620-670px at 390, vs a fixed 608 before) with no fixed pixel height.

## G. Image crop / focal point decisions
Reviewed both live photos. `object-cover` centered is correct for both because the chosen frames only crop the sides (or a little top/bottom): 3:2 on mobile crops slide 1 (16:9) horizontally to the central 84% (the car is at ~33-78%, fully visible) and leaves slide 2 (3:2) uncropped (all five motorcycles visible); 16:10 on tablet and 2:1 on small laptops keep both subjects whole. No per-slide focal values were hardcoded: the CMS lets the Owner replace images, so a value keyed to today's photos could later be wrong; a centered crop with these ratios is safe for typical landscape vehicle photos. `Image` stays `next/image` with `fill`, `sizes="100vw"` and `priority` on the first slide only; alt text unchanged.

## H. CTA hierarchy
Primary: the CMS label ("Lihat Semua Unit" / "Lihat Motor"), unchanged destinations. Secondary: "Tanya via WhatsApp", generic message, same destination. Mobile: full-width solid primary + borderless text-style secondary. Tablet: side by side, outlined secondary. Desktop: unchanged. The task's suggested label "Lihat Unit Tersedia" was not forced because hero copy is CMS-owned and the brief says not to change wording.

## I. Carousel behavior - preserved
Autoplay (3 s per slide with crossfade) verified at 390, 768, 1280 and 1440 (4 switches in 11 s each); hover/focus pauses it (desktop verified); `prefers-reduced-motion` disables autoplay; Previous/Next/dot controls work and `aria-current` follows; text-out/text-in timing unchanged. Implementation change: slides now share one grid cell instead of being absolutely stacked in a fixed-height box, so the wrapper height equals the tallest slide and stays constant (666/666/666 at 390, 775 at 768, 738 on desktop across every slide change); only opacity changes between slides, so there is no layout shift. Controls are overlaid on the photo only from 1280px; below that they are in flow under the content and never cover the vehicle. No swipe support existed and none was added.

## J. Accessibility
Hidden slides now also carry `inert` (in addition to `aria-hidden`), so their CTAs are no longer keyboard-focusable while invisible; keyboard order verified: primary CTA, WhatsApp CTA, Previous, dots, Next. Text is now on a solid dark block below the image (no reliance on a scrim for contrast on tablet/mobile); desktop keeps its scrim. Image alt, button labels (`Previous slide`, `Show slide n of N`, `Next slide`) and the single `h1` per slide are unchanged. No console errors at any width.

## K. Responsive QA - PASS
Production build, both live slides, widths 2560, 1440, 1280, 1024, 768, 430, 390, 375, 360 (18 hero states, plus before-state measurements at 1280/1024/768/390):
- No page-level horizontal overflow at any width; 0 console errors.
- Tablet and mobile (1024-360): 0 CTA/controls/headline intersections with the image; image block dimensions 1009x505, 753x471, 430x287, 390x260, 375x250, 360x240.
- Desktop (2560-1280): overlay retained, height 738px, metrics identical to production.
- Whole-page check at 1440 and 390: rendered text, headings (h1 and h2 order), link list and image count are identical to production, so nothing else on the homepage moved.

## L. Technical validation - PASS
`npm ci`; `npm run lint` 0; `npx next typegen` + `npx tsc --noEmit` 0; `npm run build` PASS (run after the final edit). No audit fix run.

## M. Changed files
`components/public/hero.tsx` (layout restructure, xl breakpoint, per-breakpoint image ratio/filters, CTA stack) and `components/public/hero-slideshow.tsx` (grid-cell stacking, `inert`, in-flow controls below xl). No CSS file or other component changed; no extra file was needed.

## N. Regression check
Desktop identical (see D); CMS data, copy, CTA destinations, WhatsApp destination, slide count, homepage section order and every other section unchanged (verified by full-page text/link comparison); slideshow behavior preserved; the single-slide and no-image (default hero) paths use the same component and remain valid.

## O. Release readiness
READY FOR OWNER REVIEW. The branch is 1 commit ahead of its base and 1 commit behind current main (unrelated file, merge clean). No migration, no data change, no dependency change. If approved it merges as a normal two-file change and deploys like any other commit.
