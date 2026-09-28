# Event Shortlist

A local recommendation demo for fictional event vendors in Austin, TX, and
Chicago, IL. Built from the supplied brief and untouched `us-synthetic-v1`
catalog. No accounts, bookings, payments or live availability feed.

## Source setup

Use Node **22.22.1** (the version used for these checks), or a compatible Node
22 release with `--experimental-test-isolation=none`. There are no dependencies,
build steps, external fonts or browser packages. From this source directory:

```sh
node --version
npm run check
npm start
```

Open `http://127.0.0.1:3000`. No installation is needed. `package-lock.json` is a
matching zero-dependency lockfile. On a separate clean machine, an optional
`npm ci --offline --ignore-scripts --no-audit --no-fund` can verify the lockfile;
that installation command was **not run in this session**.

To configure, copy `.env.example` to `.env` and adjust `PORT` (1–65535) or
`OLLAMA_BASE_URL`. The server binds only `127.0.0.1`; the model URL must be a
loopback HTTP(S) origin with no credentials, query or path. Defaults are port
3000 and `http://127.0.0.1:11434`. No secrets are needed. The app never starts,
installs or pulls a model automatically.

The sandbox used for development denied loopback listening with `EPERM`.
Direct HTTP-handler tests ran; the real socket test skips only that specific
restriction. Run the same suite on the controller's machine to exercise sockets.

## Required model, pending acquisition and live verification

The only permitted profile is:

- Ollama `0.34.0`
- Model `bge-m3:latest`
- Digest `7907646426070047a77226ac3e684fbbe8410524f7b4a74d02837e43f2146bab`
- 1024 dimensions; `num_gpu=0`, `num_thread=2`; `truncate=false`

No model service was contacted and no software or model was downloaded here.
The controller must separately provision the permitted version/model and verify
the digest. The adapter checks `/api/version`, then `/api/tags`, before and after
each `/api/embed` call. These checks also run before warm-cache responses.
These service metadata checks are not cryptographic proof of inference weights
and cannot detect an identity change hidden between observations. A mismatch,
unavailable service or invalid vector produces an explicit error and no cards.
There is no AI fallback. The request deadline is eight seconds; this is a timeout
configuration, not a measured latency claim.

Embeddings are normalized before cosine ranking. Exact ties use stable profile
IDs. The process-local cache uses full model/configuration identity plus exact
text, deduplicates equal descriptions, and retains up to 512 entries. It resets
on server restart. Errors clear the cache and invalidate overlapping requests;
those requests must retry rather than restore suspect vectors. Current response
vectors are held separately, so eviction cannot remove a needed vector, even
for batches larger than capacity. Repeatability across different models or versions is not
promised. Similarity cannot prove quality, availability or free-text wishes.

## API and rules

`GET /api/catalog` returns configuration, limits and all 66 original profiles.
`POST /api/recommend` accepts JSON, for example:

```json
{
  "locationId": "austin-tx",
  "date": "2026-10-17",
  "eventType": "Conference",
  "category": "Event host/MC",
  "budgetUsdCents": 200000,
  "language": "English",
  "hours": 4,
  "style": "Calm pacing and clear presentations, without party games."
}
```

Required fields are location, ISO date, event type, category and integer USD
cents. Optional fields must be omitted if unused: language is English/Spanish;
hours is a finite number greater than zero and at most 24; style is text up to
4,000 JavaScript string characters. Unknown fields, including legacy budget
fields, are rejected. Budget is 1–100,000,000 cents. JSON bodies are limited to
32 KiB. UI dollar parsing is explicit and accepts up to two decimal places.

Dates are real date-only values in Sep 23–Dec 31, 2026. Display formatting uses
UTC explicitly; event locations retain the catalog's America/Chicago zone.
The computer's current date never advances the sample calendar.

City/category selection and all busy-date, starting-price, event-type, language
and attendance-duration filters run before ranking. A null maximum duration
means a service is not based on on-site attendance: that filter does not reject
it, and the card explicitly says attendance duration is unverified and asks
about delivery/setup. It never describes null as unlimited attendance.

Responses distinguish `options`, `no-category`, and `no-eligible`. The last two
do not contact the model. Responses include exclusions and their individual
reasons. At most three cards contain exact source descriptions, cents-based
price headroom, catalog facts, unverified wishes and confirmation questions.
Illustrative starting prices exclude uncalculated taxes, travel, overtime,
deposits and other fees; they are not quotes.

## Demo and verification

The form defaults to the requested Austin conference on Oct 17. The Oct 18
example resets the same brief with only its date changed. Submit either example
to obtain a shortlist. Changes clear old cards and invalidate pending requests
using a revision guard, in addition to aborting fetch.

Observed eligible catalog IDs (independent of embeddings):

| Date | Eligible host IDs | Starting USD prices |
| --- | --- | --- |
| Oct 17 | us-v1-01-01, us-v1-01-04, us-v1-01-07 | $825; $1,237.50; $1,650 |
| Oct 18 | us-v1-01-04 | $1,237.50 |

The other two are marked busy on Oct 18 in the supplied calendar. Deterministic
test vectors give all three a score of 1 and order Oct 17 by the IDs above;
these are **fixture scores, not observed live model scores**. Genuine returned
ordering and scores must be recorded after live integration.

`npm run check` runs syntax checks and substantive `node:test` cases. The suite
uses labelled deterministic transport and minimal DOM fixtures, without network
calls to Ollama. See `IMPLEMENTATION-REPORT.md` for outcomes, real failures,
US01–US14 coverage and pending checks. `FINGERPRINTS.sha256` identifies the
supplied inputs and implemented code; run `sha256sum -c FINGERPRINTS.sha256`.
Regenerate with the same SHA-256 method:

```sh
sha256sum BRIEF.md PROMPT-01.md PROMPT-02.md data/catalog.mjs server.mjs lib/embeddings.mjs lib/recommend.mjs public/app.mjs public/index.html public/shared.mjs public/style.css package.json package-lock.json test/app.test.mjs test/embeddings-regression.test.mjs test/independent-regression.test.mjs > FINGERPRINTS.sha256
```

Before claiming acceptance, the controller should:

1. Verify the exact model version/digest and genuine embeddings. Run cold/warm
   requests for both dates; record returned names, IDs, scores and ordering.
2. Measure actual request latency with hardware, OS, Node/Ollama versions and
   cold/warm state disclosed. The brief's under-ten-second target is unmeasured.
3. Inspect 390px, 768px, desktop and real 2560×1440 views, keyboard flow, focus,
   screen-reader status, long text, details controls, and date display across
   time zones. Check pending-request edits and examples in a real browser.
4. Verify clean source startup and the socket test on an unrestricted loopback
   host. This session does not establish production readiness or release approval.

The actual first coding prompt is the supplied `PROMPT-01.md`. The recorded
correction is `PROMPT-02.md`; both prompt files remain unchanged. The correction
addresses identity validation, bounded cache responses and count grammar.
No earlier prompt history is invented. No video was produced. Any later walkthrough must
be labelled as a walkthrough/replay and still needs the brief's technical,
editorial, media, human voice and destination reviews before publication.
