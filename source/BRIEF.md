# Event Shortlist — US product brief v1

Specification date: September 26, 2026. This is the target specification, not a claim that the US version is already implemented or tested.

## Product

Build a local web app that helps an event organizer compare up to three vendors using a clear brief. The viewer should be able to build it, run it with the supplied demo catalog, and understand why each option appears.

Start with Austin, TX, and offer Chicago, IL, as a second sample city. Include event hosts/MCs, photographers, event venues, videographers, florists, event decorators, wedding officiants, musicians, photo booths, live bands, performers, and event favors. These are demo categories, not a claim that all services are interchangeable or available in every city.

The main story is a practical problem: find options that fit the event's requirements, then identify what still needs confirmation. Do not frame the product around a contest, organizer, country of origin, or purported real client.

## Main demo scenario

An organizer is planning a small business conference in Austin, TX, on October 17, 2026. They need an English-speaking event host/MC for four hours, with a maximum starting-price budget of $2,000. Their brief asks for calm pacing and clear presentations, without party games.

The app returns at most three eligible fictional profiles, their illustrative starting prices, relevant catalog facts, and unconfirmed wishes. Changing only the date to October 18 should demonstrate a real difference in the supplied demo calendar, not a hardcoded answer. The exact returned profiles and scores must be recorded after implementation; they are not specified here as an already observed result.

## Data and localization

- Create a new original catalog, versioned `us-synthetic-v1`, with 66 fictional profiles. Do not relabel source records, copy real business names/contact details, convert old prices, or describe sample prices as researched US market rates.
- Use stable location IDs `austin-tx` and `chicago-il`, displayed as `Austin, TX` and `Chicago, IL`. Keep city/state separate in data. Both configured event time zones are `America/Chicago`; no travel-distance or nearby-city matching is promised.
- Use American English for UI, descriptions, prompts, narration and errors. Optional service-language values are English and Spanish; catalog membership is not verified real-world language ability.
- Event types: Conference, Corporate event, Wedding, Birthday and Anniversary. Do not carry over unexplained local event terms.
- Currency is USD throughout. API fields use integer cents: `budgetUsdCents`, `priceFromUsdCents`, and cents-based comparison/headroom fields. Maximum demo budget: 100,000,000 cents ($1,000,000); minimum one cent. Reject nonfinite, fractional-cent, missing and out-of-range amounts.
- UI accepts dollar amounts with at most two decimal places and converts them explicitly to integer cents. Never interpret a legacy currency field as USD. Display amounts consistently, e.g. `$1,250` or `$1,250.50`, with USD stated beside the budget and price context.
- Starting prices are illustrative minimums, not final quotes or all-in budgets. Taxes, travel, overtime, deposits and other fees are not calculated. No checkout or payment exists.
- Dates are ISO date-only strings in the API and calendars. Present human-readable US dates, e.g. `Oct 17, 2026`, and a clear input hint. The chosen event date must not shift with the viewer's browser time zone or a DST boundary.
- Preserve the fixed reproducible demo calendar window September 23–December 31, 2026. It is a sample dataset window, not a live availability feed; a later run must not silently rewrite dates or use the computer's current date as a new result.
- Every profile is marked fictional/synthetic. If a field is deliberately imputed for a demonstration, label it separately; a synthetic price is not automatically a measured estimate of a real price.

## Inputs and behavior

Required: location, event date, event type, service category and budget. Optional: service language, on-site duration and a free-text style brief.

1. Select the location/category pool; apply busy-date, starting-price, event-type, requested-language and duration rules before AI ranking. Venues use the same availability rules as other profiles.
2. Null maximum hours means the service is not based on on-site attendance, not unlimited attendance. State that distinction when relevant.
3. Pass only eligible descriptions and the event/style query to the existing configured embedding service. Similarity orders eligible options; it does not verify availability, vendor quality or every wish in the brief.
4. Show at most three cards. Each includes name, service, city/state, USD starting price, specific explanation, source text and useful questions about unconfirmed wishes. Shared descriptions do not imply a higher price buys better suitability.
5. Keep three explicit outcomes: options found; no such category in the selected city's demo catalog; profiles exist but none meet all requirements. Do not silently widen the city, exceed budget or include busy profiles to fill three cards.
6. Identical input, source catalog, model identity and configuration must produce repeatable ordering in checked runs; stable ID resolves equal scores. Do not promise identical results across other models or versions.
7. Changing inputs while a request is pending discards the outdated response. Only show results for the currently submitted brief.
8. Model identity mismatch, unavailable service or invalid embeddings produces an explicit error, not fabricated similarity or a fallback described as AI.

## UI copy

- Heading: **Find options for your event**
- Disclosure: **Demo data · Fictional vendors and sample USD starting prices · No booking**
- Card detail control: **See the source and what still needs confirmation**
- No eligible result: **No options meet all your requirements. Review the exclusions, then change a requirement if your event allows it.**

Use a compact, readable demo disclosure; do not make a large disclaimer the visual hero. Keep material limitations accessible. If footage is recorded after the build, label it as a walkthrough/replay in the video. Localization does not turn it into original live development footage.

## Acceptance for the US version

| ID | Required check |
| --- | --- |
| US01 | Austin/Chicago names, state labels, stable IDs and US copy are consistent across UI, responses, explanations and examples. |
| US02 | Correct USD values and cent arithmetic; exact-budget equality; one-cent boundaries; no inherited currency symbols/fields or silent conversions. |
| US03 | ISO date validation, fixed window and readable US display; no date shift in differing browser time zones or near DST changes. |
| US04 | Required/optional fields, numeric boundaries and long text work through both API and UI. |
| US05 | Busy people and venues excluded; budget, event type, language and duration enforced before model ranking. |
| US06 | Normal dense category, rare category, fewer than three, no category and no eligible cases shown on the new dataset with inspected outcomes. |
| US07 | Same request on two dates changes the eligible set and explains the actual calendar difference; no preset cards. |
| US08 | Repeated ordering, real embeddings, cache cold/warm paths and actual configured model identity checked on the new dataset. |
| US09 | Explanations offer distinct inspectable facts, USD comparisons and honest unknowns; meaningful semantic tests, not string replacements of old expected scores. |
| US10 | Field changes and example selection during a pending response still discard it; no stale cards. |
| US11 | Controlled model-unavailable/identity errors are explicit; distinguish injected failure from a real incident. |
| US12 | Fictional data and starting-price limits remain visible; no real business contact information, secrets or private paths. |
| US13 | 390/768/desktop views, keyboard flow, long descriptions and readable real 1440p capture checked. |
| US14 | Clean source installation/start/checks, new data/source fingerprints, model requirements and actual prompt/change history documented. |

All checks need new evidence for the new source/data version. Prior reviews are historical evidence for the earlier version, not acceptance of this adaptation. Measure request latency and disclose the environment; the working target remains under ten seconds, not a general performance promise.

## Boundaries and video deliverables

Recommendation-only local demo: no accounts, bookings, outreach, payments, live vendor scraping, maps, travel estimates, tax calculation or production-hosting promise. Do not add paid tools, model downloads or cloud billing without separate authorization.

Show the working result first, then the important build decisions, actual prompts, code, errors, checks and final product. Use one coherent episode or two justified parts, without padding. Provide reviewed code, setup, safe configuration examples, the new synthetic catalog, tests, actual prompt records and a change log. Do not claim a real US customer, market validation or production readiness.

Before publication: exact-version technical, editorial and media reviews; genuine human voice listening; approved public package and verified destination. Previous masters containing different cities, currencies or data cannot be relabelled as this US implementation.
