# Implementation report

Implemented from the actual supplied `PROMPT-01.md` on September 27, 2026.
Node v22.22.1; no dependencies installed, network services used, model pulls,
credentials inspected, commits or external messages. Supplied catalog, brief,
prompt and recording launcher were not edited.

## Requirement mapping

Automated cases are in `test/app.test.mjs`, `test/embeddings-regression.test.mjs`
and the unchanged `test/independent-regression.test.mjs`. Passing fixture tests are not
evidence of live-model integration or independent acceptance.

| ID | Implementation and evidence | Remaining verification |
| --- | --- | --- |
| US01 | Catalog-derived choices, location IDs, city/state cards; `recommend.mjs`, UI and catalog tests | Visual copy review |
| US02 | Integer cents, strict dollar conversion, price headroom; min/max, equality and one-cent tests | None identified for arithmetic |
| US03 | Strict ISO round-trip and fixed window; UTC display tested in Honolulu, Tokyo and Chicago near DST | Actual browser date input presentation |
| US04 | Required and optional fields, range/text limits and UI form; boundary and 4,000-character tests | Real browser long-text interaction |
| US05 | `filterPool` applies every hard rule before embedding; actual busy people/venues and isolated-rule tests; null attendance semantics tested | None identified for filter rules |
| US06 | Actual catalog dense, rare Event favors, fewer-than-three, Chicago Florist absence and one-cent no-eligible cases tested | Visual inspection of each outcome |
| US07 | Real Oct 17/18 eligible-set difference inspected; actual calendar exclusion assertions and example handlers tested | Live model order/scores for both dates |
| US08 | Pinned model adapter, normalized cosine, stable ties, cold/warm cache and identity tests | Genuine embeddings, identity and repeatability runs |
| US09 | Exact descriptions, source provenance, factual eligibility, cents headroom, unknown wishes and specific questions; semantic assertions | Human editorial review |
| US10 | Revision token guards all completions; real UI module handlers tested with non-abortable deferred fetch and minimal DOM | Real browser interaction check |
| US11 | Explicit model errors with no fallback; injected outages, identity mismatch, bad JSON, HTTP failures and malformed vectors | Genuine service integration; injected failures are not real incidents |
| US12 | Visible required disclosure and price limitations; synthetic cards and source text; no contact features or secrets | Visual disclosure review |
| US13 | Responsive CSS, native labels/details, focus indicators, live status, wrapped descriptions | 390/768/desktop/1440p rendering, keyboard and accessibility inspection not performed |
| US14 | Matching zero-dependency manifests, README, env example, change log, prompt record and SHA-256 manifest | Clean-machine startup, actual model acquisition and integration; socket bind denied here |

## Actual checks and failures

1. `npm test` initially failed at the test-file level. Running
   `node test/app.test.mjs` exposed the actual failure: `listen EPERM` for
   `127.0.0.1`. Twelve tests passed and the socket test failed.
2. Added a specific EPERM skip to preserve the socket test for unrestricted
   hosts, and direct HTTP-handler tests that exercise request/response behavior
   here. Changed test isolation for readable in-process output. The first
   spelling, `--test-isolation=none`, failed with `bad option`; Node's own help
   identified `--experimental-test-isolation=none`, which fixed the command.
3. Final `npm run check`: syntax checks succeeded; **16 tests, 15 passed,
   0 failed, 1 skipped** (loopback socket binding). Direct-handler tests cover
   JSON errors, validation, UTF-8 chunk boundaries, request limits, static
   content, origin/host rejection and catalog/recommendation responses.
4. Actual browser-module logic ran against a minimal DOM fixture. Input/change
   events, example clicks and out-of-order submissions cleared or discarded
   stale responses even when fetch ignored abort. A stale rejection was also
   discarded. This is not a browser layout or accessibility test.

No test failure was deliberately introduced. No real model incident occurred.
No latency result is claimed; test-run durations are not model-request latency.

## Recorded correction — PROMPT-02

Continued the existing implementation using the supplied, unchanged PROMPT-02.
The initial local run of the saved reviewer regressions failed all four cases:
missing expected ModelError after a digest change during inference; one embed
instead of two after identity restoration; a missing response vector at capacity;
and a TypeError reading vector index 0 during changing-style recommendations.
These were product failures, separate from the socket permission restriction.

The adapter now validates version/name/digest before and after inference, checks
all vectors before committing, and clears its cache on errors. A generation
guard prevents overlapping calls from returning or recaching vectors after
invalidation, including when the permitted identity has since been restored.
Such overlapping calls fail explicitly and require a retry. The original model,
digest, CPU options, dimensions, timeout and no-fallback behavior remain.
Metadata observations are not cryptographic proof of inference weights and do
not detect changes concealed between checks.

Response vectors are retained in a request-local map independent of the bounded
512-entry cache. Duplicates and cached/missing mixtures preserve input ordering,
including batches larger than capacity. Temporary response storage scales with
the current batch; only the reusable cache is limited to 512 entries.
Focused deterministic tests cover these cases, actual eviction, finite unit
vectors, overlapping successful calls and identity invalidation during another
call. Additional identity cases cover changed version, name, duplicate model
entries and digest after inference.

Result copy now uses “1 option” and “1 eligible profile,” with plural forms for
other counts; exclusion counts also use singular when appropriate. The existing
minimal DOM test checks 1, 2 and 3 result counts and retains the style-uncertainty
sentence. The native date control and layout were not changed.

Actual commands after correction:

- `node --test --experimental-test-isolation=none test/independent-regression.test.mjs`:
  4 passed, 0 failed, 0 skipped in this local fixture run.
- `npm test`: 24 total, 23 passed, 0 failed, 1 skipped.
- `npm run check`: syntax checks succeeded; 24 total, 23 passed, 0 failed,
  1 skipped. The only skip remains the existing socket-only `listen EPERM`
  exception. Direct-handler coverage ran successfully.

No post-correction test failures occurred. SHA-256 checks confirm the brief,
catalog, both prompt files, private launchers and reviewer test are unchanged.
The source fingerprint manifest was regenerated using SHA-256 and now also
includes PROMPT-02 and both regression files. No installs, downloads, model or
external network calls, credentials, external messages, service changes or
commits were used. No independent acceptance, live-model verification, full
US01–US14 completion or public release is claimed; controller checks remain.

## Inspected demo outcome

The source calendar and hard rules give Oct 17 three eligible profiles:

- `us-v1-01-01`: Stillwater Demo Event host/MC 1 — $825 USD.
- `us-v1-01-04`: Northlight Demo Event host/MC 4 — $1,237.50 USD.
- `us-v1-01-07`: Stillwater Demo Event host/MC 7 — $1,650 USD.

Oct 18 retains only `us-v1-01-04`; the other two are marked busy that day.
The labelled equal-vector transport fixture returns the listed ID order with
score 1 for each card. These scores establish tie behavior only. Live returned
profiles/scores and cold/warm repeatability still need controller evidence.

## Remaining work requiring another environment

Acceptance remains partial: the sandbox denied socket binding and no browser automation tool was
available. There are no screenshots or real 1440p capture checks. The controller
must run the socket test, inspect the responsive UI and keyboard flow, provision
and verify the exact permitted model, capture genuine results and measure latency
with environment details. No live-model success, production readiness, public
release or independent PASS is asserted. Video/publication deliverables and
their human reviews were not performed.
