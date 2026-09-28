# Change log

## 2026-09-27 — Recorded correction from PROMPT-02

- Reproduced all four supplied regression failures locally before editing:
  digest changes during inference were accepted, mismatch retries reused cached
  vectors, eviction lost response vectors, and changing-style requests crashed.
- Recheck the pinned version/name/digest after inference. Clear the cache on
  errors and reject overlapping requests from an invalidated cache generation.
  Service metadata does not cryptographically attest inference weights.
- Keep response vectors separate from the cache, retaining the 512-entry limit.
  Added oversized mixed/duplicate batch, normalization, eviction and concurrency
  coverage, plus post-inference identity variants.
- Correct singular/plural result and exclusion copy. Preserve style uncertainty
  and the native date control; test result count copy in the existing DOM fixture.
- Local saved-regression run: 4 passed, 0 failed. `npm test` and `npm run check`:
  each 23 passed, 0 failed, 1 socket-only EPERM skip (24 total); syntax checks
  succeeded. These fixture outcomes do not establish independent acceptance.
- Updated documentation and regenerated source SHA-256 fingerprints. Preserved
  supplied brief, catalog, both prompts, private launchers and reviewer tests.
  Live-model, browser, latency and release checks remain pending.

## 2026-09-27 — Initial implementation from PROMPT-01

- Read the complete brief and supplied original synthetic catalog; preserved
  their bytes and the fixed dates. No previous implementation was consulted.
- Added a Node 22 loopback server, catalog/config endpoint, strict validation,
  hard eligibility filters, exclusion explanations and three explicit outcomes.
- Added the pinned Ollama transport contract, normalized cosine ranking,
  stable ID ties, exact-text identity cache and explicit model failures.
- Built the responsive brief form, source/confirmation cards, compact demo
  disclosure, Oct 17/18 examples and revision-protected result lifecycle.
- Added dependency-free tests, setup documentation, safe configuration example
  and implementation evidence. No model contact, downloads or installs occurred.
- Actual first test run failed on sandbox loopback `EPERM`; 12 other tests
  passed when run directly. Added direct-handler coverage and an explicit
  environment skip for the socket test. A subsequent check failed because
  `--test-isolation=none` is not a Node 22 flag; corrected it to
  `--experimental-test-isolation=none`. These were real failures, not staged bugs.
- Final check: 16 tests, 15 passed, one environment skip, zero failures.
  Live model, visual/browser and release reviews remain pending.
