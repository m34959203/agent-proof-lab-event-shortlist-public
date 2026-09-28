# Actual prompts and development checkpoints

These are the requests actually used, not newly written ideal prompts.
Read them with the adapted brief and synthetic catalog. The full prompt text
is preserved in the linked source files; no raw agent dialogue, hidden
reasoning, credentials or private recording launcher is included.

## PROMPT-01 — implement the product

- Date: September 27, 2026.
- Tool: Codex CLI 0.153.4; observed model: `gpt-6-astra`.
- Starting checkpoint: `743881daa8b01c8a6a5645520c45acae27e78256`.
- Context: `source/BRIEF.md`, `source/data/catalog.mjs`, and a private recording
  launcher. No prebuilt application was supplied. The launcher is excluded
  from this export and is not required to run the completed product.
- Actual request: [source/PROMPT-01.md](source/PROMPT-01.md).
- Result checkpoint: `542640cc4bb672a63665ef97a6c4e6f9d974fff7`.

The agent implemented the API, validation, filtering, ranking adapter, UI and
tests. Real failures included sandbox loopback `EPERM` and an unsupported Node
test-runner flag. The flag was corrected; a socket-specific environment skip
was disclosed. The subsequent unrestricted controller run passed 16 tests
with no skips. These fixture tests were not proof of a live embedding service.

## PROMPT-02 — repair independently reproduced defects

- Date: September 27, 2026.
- Tool: Codex CLI in the same recorded workflow. Do not infer a new model
  selection or a tool comparison from this continuation.
- Starting application checkpoint: `542640cc4bb672a63665ef97a6c4e6f9d974fff7`,
  supplemented by the independent regression file and this correction prompt.
- Context: the brief, existing application, four reproduced regressions and
  `source/test/independent-regression.test.mjs`.
- Actual request: [source/PROMPT-02.md](source/PROMPT-02.md).
- Result checkpoint: `268ce402655fd9a142d63fc13bb74178c568d904`.

The correction added post-inference identity checks and invalidated suspect
cache state. It preserved current response vectors independently of bounded
cache eviction, and corrected singular/plural UI text. Four regressions passed
after the repair. The controller then ran 24 tests with no skips. The source
CHANGELOG separately preserves the coding sandbox's 23-pass/one-socket-skip
result; these are different runs, not contradictory counts.

## Repeating the work

Run the exported completed application to inspect the result. To try the
development exercise yourself, start a separate workspace with the brief and
synthetic catalog; do not ask an agent to rebuild on top of this completed
source while describing it as a from-scratch attempt. PROMPT-02 depends on the
initial result and supplied regression tests, not an empty directory.

The historical prompts refer to recording launchers and sandbox restrictions.
They are preserved as context, not turnkey commands for your machine. Record
any changes you make to those constraints, tools, model or environment.
AI output is nondeterministic: an identical prompt need not produce identical
code. The companion does not include a fabricated complete dialogue or claim
that every controller action was an AI prompt.
