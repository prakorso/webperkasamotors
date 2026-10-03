# Perkasa Motors — Sell Responsive Refinement: Production Release Report

Deployed code commit: `38a55af` on `main` (base `f67d5ef`). Scope: visual / responsive only on `/sell`, plus the CTA copy. Verdict: **PASS**, with the caveat in section 3.

## 1. What changed (2 files)
- `components/public/sell-vehicle-form.tsx`
- `app/(public)/sell/page.tsx` (one class: `text-balance` on the H1)

Nothing else: no change to fields, validation, message generation, tracking, consent, GTM/GA4/Meta, or any data layer.

1. **CTA copy** is now exactly "Tawarkan Kendaraan" (same WhatsApp icon, same submit/disabled behavior). Because the label is short, the earlier wrapping workaround on the button was removed; it is a normal full-width button on mobile and auto-width from `sm`.
2. **Select chevrons**: the month/year `<select>`s now use `appearance-none` with a chevron drawn inside each select's own wrapper (`lucide-react` `ChevronDown`, `pointer-events-none`), and every two-column control grid is `minmax(0,1fr)`. The arrow can no longer sit outside its control or push a grid cell past the card, whichever browser draws the control.
3. **Mobile card**: padding `p-4` on phones (`sm:p-6`, `md:p-8`) so fields get more width; H1 balanced (no orphaned last word); the notes helper text and the `0/500` counter stack on phones instead of sharing a cramped row.

## 2. Visual audit (screenshots reviewed)
The browser window cannot be resized, so each width was rendered as a same-origin iframe of that exact width and the resulting screenshots were looked at (not just measured). Before the change (local build of the previous commit) and after (local build, then production):

| Width | Hero | Form | CTA | Process | Arrows/connectors | Disclaimer | Footer | Consent open | Horizontal overflow |
|---|---|---|---|---|---|---|---|---|---|
| 1440 | clean | clean, centered column | clean | clean | none exist | clean | clean | clean | none |
| 1024 | clean | clean, 2-col pairs | clean | clean | none exist | clean | clean (production viewed) | clean | none |
| 768 | clean | clean, single card, 2-col pairs | clean, compact | clean | none exist | clean | clean | clean | none |
| 430 | heading balanced | clean | clean | clean | none exist | clean | clean | clean | none |
| 390 | heading balanced | clean (local and production viewed) | one line, full width | clean (5 numbered steps, no connectors) | none exist | clean | clean | clean, footer reachable above banner | none |
| 360 | clean | clean, selects side by side | one line | clean | none exist | clean | clean | clean, footer reachable | none |
| 320 | clean | clean, selects side by side | one line | clean | none exist | clean | clean | clean, footer reachable | none |

The error state (all required fields flagged) was also viewed at 390: messages sit under their fields and do not break the layout.

## 3. Honest findings about the Owner's report
- **Process arrows:** `/sell` has no arrows or connectors anywhere. The "Cara Kerjanya" section is five numbered steps in a plain vertical list at every width. The horizontal connector pattern only exists in the homepage "Cara Pembelian" section, which is unchanged.
- **Arrows that escape:** I could not reproduce any arrow crossing a container in Chrome at any width, before or after. The only arrow-like elements on `/sell` are the browser-drawn chevrons of the native selects; those are what I hardened (section 1.2), since native select arrows are the one thing that renders differently on real phones. I did not test on a real iPhone/iPad or Safari, so I cannot confirm the Owner's exact symptom is gone on their device. If something still looks wrong there, a screenshot from the device would pinpoint it.
- "Messy" mobile/tablet: the visible improvements are the narrower card padding, balanced heading, one-line CTA and stacked helper/counter. Tablet keeps one centered column (hero, card and steps share one width); it already read cleanly, so no separate tablet composition was added.

## 4. Consent interaction
With the banner open at 390, 360 and 320 the last footer control ends above the banner (reachable), the page content is not permanently covered, and no fixed positioning was added to the Sell CTA. Consent code is unchanged.

## 5. Regression checks
- **Form / WhatsApp (local build and production):** empty form → CTA disabled and a forced submit opens nothing; missing price → blocked; valid → enabled; the generated message is byte-identical to the approved structure; notes line appears once when filled; destination `wa.me/6285111307044`; `window.open(_blank, noopener,noreferrer)`; no form `action`, no tracked anchor, no backend/database/storage code.
- **Tracking (production, consent accepted):** one GA4 `page_view`; one `whatsapp_click` with `cta_location=sell_form`, `cta_context=sell_vehicle`, `page_type=sell_vehicle`; Meta `PageView` and one `Contact` (`cta_location`, `cta_context` only) even with two clicks 400ms apart (one tab opened); no form value, message or WhatsApp URL found in the dataLayer, `fbq` calls or the GA4/Meta/GTM request URLs.

## 6. Technical QA
`npm run lint` clean, `npx tsc --noEmit` clean, `npm run build` clean, `npm audit --omit=dev`: 0 vulnerabilities. No `npm audit fix`.

## 7. Release
`fix/sell-responsive-refinement` pushed; main had not moved (`f67d5ef`), fast-forward merge, no rebase/squash/force push. Production serves the new CTA copy and the refined layout (viewed at 390, 768 and 1024).

## 8. Verdict
**PASS.** Limits: viewport rendering is by same-origin iframe rather than a resized window or real device; Safari/iOS not tested.
