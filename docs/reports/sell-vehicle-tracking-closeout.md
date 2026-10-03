# Perkasa Motors — Sell Vehicle Tracking Closeout

Verification only. No application code changed. Verdict: **PASS**, with two platform-visibility items reported as PARTIAL for tool reasons (sections J and L).

## A. Executive summary
The `/sell` flow is represented correctly in GA4 and Meta on production: one automatic `page_view` per hard load or soft navigation, one `whatsapp_click` per valid submit (same existing key event), one Meta `Contact` per valid submit after accepted consent, no duplicates, and no form data on any surface that could be inspected. Consent behaves per the R1 design in all three states. Only the docs needed a small correction.

## B. Current production SHA
`origin/main` = `b9e874f` at the start (docs only on top of code `38a55af`, which is what production serves). This closeout adds a docs-only commit after it.

## C. /sell page_view verification (consent accepted)
- Hard load of `/sell`: exactly one GA4 `page_view` (path `/sell`) and exactly one Meta `PageView`.
- Soft navigation home → `/sell` (header link): exactly one GA4 `page_view` (path `/sell`, referrer `/`) and exactly one Meta `PageView` (History Change tag). The GA4 hit left the browser about 9 seconds after the navigation, so a short wait can look like it is missing.
- DebugView (debug session): one `page_view` for home and one for `/sell`.
No manual `page_view` exists in the app.

## D. whatsapp_click verification
A valid submit pushes one `whatsapp_click` with `cta_location=sell_form`, `cta_context=sell_vehicle`, `page_type=sell_vehicle`. Verified by the dataLayer, the GA4 `/g/collect` request (`en=whatsapp_click`, `ep.cta_location`, `ep.cta_context`, `ep.page_type`, nothing else), Tag Assistant (tags fired on that event: `GA4 - Event - whatsapp_click` and `Meta - Contact` only), and one real trusted click that opened WhatsApp for the official number. `vehicle_category` is not currently passed and was not added (it would need a GTM mapping).

## E. GA4 key event continuity
GA4 Realtime (last 30 minutes) shows `whatsapp_click` under both "Event count by event name" and "Key events by event name" (the same count). DebugView flags the `/sell` `whatsapp_click` with the key-event marker. No new event or key event was created.

## F. Meta Contact verification
On accepted consent: `fbq('track','Contact',{cta_location:'sell_form', cta_context:'sell_vehicle'})` once per valid submit, and one matching `facebook.com/tr` `Contact` request carrying only `cd[cta_location]` and `cd[cta_context]`. No Lead, Purchase, SubmitApplication, CompleteRegistration or InitiateCheckout request or `fbq` call was seen; the only Meta events in the dataset are PageView, Contact and View content.

## G. Consent behavior (production)
| State | Meta | Google | whatsapp_click |
|---|---|---|---|
| NO CHOICE | not loaded (`fbq` undefined, no `fbevents.js`, no requests); no Contact | cookieless pings only (`gcs=G100`, `npa=1`): `page_view` and `whatsapp_click` with the three parameters | recorded in the dataLayer |
| REJECT | no `fbq`, no request; no Contact | cookieless ping (`gcs=G100`) with the three parameters | recorded in the dataLayer; WhatsApp still opens |
| ACCEPT | `PageView` and one `Contact` per valid submit | full consent (`gcs=G111`) | recorded |
This is the R1 design (Google Consent Mode signals without cookies when denied, Meta only after consent). Consent code untouched.

## H. Rapid-click dedupe (production, accepted)
| Pattern | dataLayer | fbq Contact | GA4 hits | Meta Contact requests | WhatsApp tabs |
|---|---|---|---|---|---|
| single click | 1 | 1 | 1 | 1 | 1 |
| two clicks 300 ms apart | 1 | 1 | 1 | 1 | 1 |
| two clicks 1.3 s apart | 2 | 2 | 2 | 2 | 2 |
Navigation behavior unaffected.

## I. Payload privacy audit
Distinctive values were entered for brand, model, year, mileage, STNK and plate months, price and notes. Searched for them, the prefilled message text, `wa.me`, `api.whatsapp.com`, the WhatsApp number and the price in: the dataLayer, every `fbq` call, the query strings of all GA4, Meta and GTM requests, Tag Assistant's data layer and Variables views, and GTM's abstract data model. Result: **none found** (a naive `text=` substring matched only inside `ep.cta_context=`, a false positive). GTM Variables for the `whatsapp_click` event held only `cta_context`, `cta_location` and `page_type`; every other variable (item_*, value, currency, vehicle_status, list_context, items, hero_slide_index) was undefined. A real trusted click produced no automatic outbound-click or button-click event in GA4 or Meta. Not claimed: request bodies are not readable with this tool, so POST bodies were not inspected; every other observable surface was.

## J. GA4 observed parameters
`ep.cta_location=sell_form`, `ep.cta_context=sell_vehicle`, `ep.page_type=sell_vehicle` on the `/g/collect` request for `whatsapp_click`; no other `ep.*` or `epn.*` keys. DebugView showed the events, counts and key-event flag, but I could not get its event-parameter panel to open through browser automation, so parameter visibility in DebugView itself is **PARTIAL** (the same values were confirmed in the network request and in Tag Assistant). No GA4 custom dimension was registered.

## K. Meta observed parameters
`cd[cta_location]=sell_form`, `cd[cta_context]=sell_vehicle` only. `PageView` carries no custom data.

## L. Events Manager evidence
Overview now lists PageView 33 (was 21), Contact 10 (was 7), View content 6 (unchanged), all Active via the Meta pixel, with no other event types. Contact was still catching up with my recent tests (last received about 45 minutes before the check) and the Overview cannot separate `/sell` Contact from other Contact events or show CTA locations. So Events Manager evidence is **PARTIAL**: receipt of the event type is confirmed, per-location attribution is not available there; the `/sell` mapping is evidenced by the `fbq` call and the `facebook.com/tr` request instead.

## M. Tool limitations
Browser window cannot be resized; request bodies not readable; query strings partly redacted in printed output (parameters were read by parsing URLs); DebugView parameter panel did not open via automation; keyboard input does not reach the page in this session (no key-press tests); Events Manager Overview has no CTA-level breakdown. Production tests generated real test events (about a dozen `whatsapp_click`/Contact), so treat today's GA4/Meta counts as test traffic.

## N. Docs consistency
Code and docs already agreed on `page_type=sell_vehicle`, `cta_location=sell_form`, `cta_context=sell_vehicle`. Stale spots fixed (docs only): `event-taxonomy.md` still said "10 canonical locations" (now 11) and showed the old CTA label "Tawarkan Kendaraan via WhatsApp" (now "Tawarkan Kendaraan"); `measurement-architecture.md` listed 10 locations without `sell_form` (now 11, noting `sell_form` fires from the submit handler).

## O. Code changes
None to the application. Docs only: the two files above plus this report and its TXT mirror. No database, CMS, GTM, GA4, Meta, consent or form change.

## P. Final verdict
**PASS.** Contract verified on production at every observable surface. Remaining PARTIALs are limits of what GA4 DebugView and Meta's Overview expose through this tooling, not tracking defects.
