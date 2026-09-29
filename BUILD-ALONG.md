# Build it yourself, without the finished source

This is a **new, portable exercise**, added after the recorded walkthrough.
Do not copy the finished application's code into the exercise folder.

## Prepare the inputs

From this companion's root:

```powershell
node tools/prepare-exercise.mjs ../event-shortlist-exercise
cd ../event-shortlist-exercise
```

The destination must not exist. The tool copies only the product brief, fictional
catalog, unchanged historical first prompt, a disclosed adaptation and an input
manifest. It does not copy the implementation, completed tests or private launcher.

## Give your coding tool the same task

Open your coding tool in the **exercise folder**, not the companion root. For
Codex CLI, use your existing authorized login. Do not add a paid API key to follow
this guide. If you do not have tool access, that is a prerequisite, not a hidden
step completed by this repository.

```powershell
codex
```

Submit: `Read VIEWER-BUILD.md and follow it. Work only in this exercise folder.`

Record the tool/model/version, your actual prompt, manual changes and outputs.
Keep the original PROMPT-01.md unchanged. The portable wrapper removes the
assumption of a private recording launcher and distinguishes fixture tests from
live-model checks. It must not be presented as the original recorded request.

The finished source's historical commit IDs are provenance; those commits are
not included as checkout targets in the distribution repository's history.

## Check your implementation

1. Read the generated README; record any instruction you have to guess.
2. Run its checks. Do not remove failing tests merely to make them green.
3. Start the documented model profile using START-HERE.md in the companion.
4. Start the new app and execute the four browser examples in that guide.
5. Check invalid dates and fractional-cent budgets; inspect source details and
   pending-request changes. Requirements US01–US14 in BRIEF.md remain the contract.

The companion's `tools/check-demo.mjs` assumes the **recorded app's** API field
names and `cards` response. A new implementation can have a different API shape.
If you adapt an external test, document that mapping; do not mistake a response
schema difference for a product bug or weaken the required behavior.

## Correct only defects you actually reproduce

PROMPT-02.md describes failures in the historical implementation. A new model
run may not produce them. Do not manufacture those defects to imitate the film.
Create a failing test for your own observed defect, preserve it, and ask the
coding tool to fix the behavior without weakening the requirements.

A completed exercise means the intended product works under the stated checks.
It does not mean identical code, identical ranking on other model versions,
independent audit approval or a production-ready service.
