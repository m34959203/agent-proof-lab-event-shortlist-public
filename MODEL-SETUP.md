# Local model prerequisite

The recorded code accepts this specific profile:

| Setting | Recorded value |
|---|---|
| Ollama version | `0.34.0` |
| Model name | `bge-m3:latest` |
| Digest | `7907646426070047a77226ac3e684fbbe8410524f7b4a74d02837e43f2146bab` |
| Dimensions | 1024 |
| Options | `num_gpu=0`, `num_thread=2`, `truncate=false` |
| Default service | `http://127.0.0.1:11434` |

This is the profile used in the recorded controller checks. An independent
product review exercised the exported source against an already-installed
matching service. On September 28, 2026, a separate author check downloaded the
model into an empty, isolated store, verified the manifest and every blob,
and ran the unchanged app against it. The check reused an existing local
runtime image reporting version 0.34.0. It was not a new operating-system or
runtime installation, and does not validate every platform's installation.

No model weights or Ollama installer are included here. Start with the
[official Ollama release](https://github.com/ollama/ollama/releases/tag/v0.34.0)
and [runtime documentation](https://docs.ollama.com/docker) appropriate to your
machine. Read the applicable software and model terms before downloading.

## Obtain and verify the model

The [official model page](https://ollama.com/library/bge-m3) documents:

```sh
ollama pull bge-m3:latest
```

The author check used the runtime's `/api/pull` endpoint, not the CLI command
above. The configuration, weights and license blobs totaled 1,157,672,605
bytes, plus a separate 563-byte manifest; allow additional space for the runtime and its temporary
files. This is a local-model path, not a paid model API. Your own machine or
hosting costs are separate.

The tag is mutable: a future pull may not match the recorded version. On the
running local service, inspect `/api/version` for version `0.34.0` and
`/api/tags` for the **full** `bge-m3:latest` digest in the table. Do not rely on
the shortened digest printed by some interfaces. The app itself also rejects
a mismatched profile. Stop if yours differs; do not silently loosen the pin
or claim that a different version reproduces this recording.

The September 28 public-manifest bytes matched the digest above. For retained
files, the weights blob SHA-256 was
`daec91ffb5dd0c27411bd71f29932917c49cf529a641d0168496c3a501e3062c`.
The digest-addressed registry manifest URL returned 404 during the check;
this guide therefore does not promise that a `model@digest` pull works.

If you already have the matching service, copy `source/.env.example` to
`source/.env` only when you need to change the local service address or app port.
The app accepts a loopback model-service origin and binds its own server to
loopback. Do not expose it publicly as a hosted service on the strength of
these tests.

The app checks the reported service version/model digest before and after
inference and before cached results. A mismatch or invalid vector produces
an error and no recommendation cards. These metadata observations are not
cryptographic proof of the weights used during inference.

## What the additional check established

Two genuine 1,024-dimensional embeddings were returned by the freshly acquired
model. A first author harness then failed because it looked for the wrong
response field, not because the app returned an error. Its evidence was kept.
The corrected harness read the documented `cards` field, reused those same
verified files without another download, and passed all four app paths:
October 17 gives three cards; October 18 gives one; October 17 at $825.00 gives
one; $824.99 gives none. All 24 source tests also passed, with none skipped.

This is an acquisition-and-app-path check on the existing runtime, not a full
fresh-machine certification, an audit of model terms, or a claim that every
future `latest` pull is reproducible. Fixture tests alone are not live-model
verification. When a matching runtime is ready, follow the app steps in
[README.md](README.md).
