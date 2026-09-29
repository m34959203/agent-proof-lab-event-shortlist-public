# Post-film reproduction check — September 30, 2026 (UTC+05)

This report covers setup instructions added after filming. No new version of
the film is claimed. On September 29, 2026 at 21:20 UTC, anonymous access to the
original distribution was restored and all 29 downloaded files matched the
recorded commit below. That access check did not include these later additions.

## Recorded source

Before repair, 29 files matched the recorded distribution receipt for commit
`cbf4d2eae3f32c7fc712f610bab5db8947791b12`. The application source, catalog and
historical prompts were not modified. The root README, new guides and helper
scripts are post-film additions. FILES.sha256 describes this snapshot, not the
earlier public commit.

- Linux, Node 22.22.1: offline dependency check and all 24 tests passed, no skips.
- Windows PowerShell, portable official Node 22.22.1: the same 24 tests passed,
  no skips. The Node archive SHA-256 matched the official SHASUMS file.
- A separate Ollama 0.34.0 container used a new empty model directory. The
  bge-m3 model was pulled successfully, then version/digest and two real
  1,024-dimensional embeddings were checked. The Docker image layers were
  already cached; this was NOT a fresh operating-system or Docker installation.
- Eight live API cases passed on Linux. Main
  card counts were 3 / 1 / 1 / 0 for the documented date and cent boundaries.
  Invalid date, fractional-cent amount and unsupported language returned 400.
- On Windows, the model service ran on the Linux server through loopback SSH
  forwarding. A fully local Windows Docker/model installation was NOT tested.
- Browser interaction verified the October 17 result with three cards and
  expanded source/unverified-wish details. The full four-case browser matrix,
  mobile/tablet layout and accessibility were NOT revalidated in this repair.
- The initial seven helper tests passed on both systems. The exercise preparer copied
  only its five input files and refused to overwrite an existing directory.

The later documentation audit found two additional edge cases in the new model
helper: an overflowing vector norm and duplicate model identities after
inference. Both were corrected before publication. The expanded **11 helper
tests passed on Windows with Node 22.22.1**; these use transport fixtures, not
live model inference. The recorded application's 24 tests also passed again.
The application's implementation was not changed by these helper corrections.

An initial server check ran too early, before the model download completed;
that failed receipt is retained. The corrected guide explicitly waits for the
pull and verifies the model. A later Windows log-capture run lost its temporary
app/tunnel and correctly failed with `fetch failed`; it is not recorded as PASS.
The initial Windows live-smoke success was not retained as a complete receipt;
this report does not claim a reproducible Windows live-API PASS from that run.

## New implementation from input seeds

One Codex CLI 0.153.4 run received only the brief, fictional catalog, historical
first prompt and a disclosed portable wrapper. It used the existing subscription
without adding an API key. No specific model identity is asserted. The run hit
its 15-minute controller limit before completing its README/report; it was not
an uninterrupted recreation of the original film.

The generated app started and passed eight live API smoke cases. An external
fixture probe then found it did not reject a digest change during inference.
The controller repaired identity/cache handling, added three regression tests,
corrected a Windows file-URL issue, and wrote missing run instructions. The
exact transport-call assertion was updated to require post-inference checks,
not removed. Test discovery was narrowed to six explicit files to avoid counting
the helper's repeated suites twice.

After these disclosed interventions: **34 distinct tests passed on Linux and
Windows**, eight live API cases passed on Linux, and the identity-change probe
passed. Original input hashes remained unchanged. The new implementation is
kept as a separate experiment, not substituted for the recorded source here.
This demonstrates a working reconstruction with intervention, not identical
code from one prompt, complete US01–US14 acceptance, or a publication audit.

## What remains

- For a stronger tutorial claim, film the missing setup path or explicitly send
  viewers to START-HERE; do not claim those steps are in the existing video.
- A fresh viewer-machine install and full UI matrix remain separate checks.
- Access and download integrity must be rechecked against the exact published
  revision; the earlier download check applies only to the original snapshot.

No videos, channel settings, publication queue or original private repository
were modified in this repair.
