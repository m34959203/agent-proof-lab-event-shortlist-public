# Run Event Shortlist on your computer

Start with the finished app. Then try rebuilding it in a separate folder.
These are different exercises. Running the finished source does not prove that
you can regenerate it from a prompt.

This guide was added after the film. It fills in setup steps that the recorded
walkthrough assumed. It does not claim that these steps appeared in the video.
Use fictional data only. This app does not book vendors or accept payments.

## 1. Get the files

You need Git, Node **22.22.1**, and Docker with Linux containers running. The
application has no npm dependencies. Node and Docker themselves are prerequisites,
not files included in this repository.

- [Node 22.22.1 downloads](https://nodejs.org/en/download/archive/v22.22.1)
- [Docker setup](https://docs.docker.com/get-started/get-docker/)
- [Ollama's Docker documentation](https://docs.ollama.com/docker)

In PowerShell, choose a folder for your projects, then run:

```powershell
git clone https://github.com/m34959203/agent-proof-lab-event-shortlist-public.git
cd agent-proof-lab-event-shortlist-public
node --version
docker version
```

Expect `v22.22.1` and both Docker client and server information. If the repository
returns 404 or asks for access, stop: the download is not available to you. Do not
paste tokens into a prompt or assume that you caused the error. Repository
access can change; a previous successful download does not replace checking
that you can obtain the files now.

## 2. Start a separate local model service

The recorded app accepts Ollama **0.34.0** and a particular BGE-M3 model digest.
It deliberately rejects other profiles. Do not use an unpinned `latest` runtime.
The model download is about 1.16 GB; allow extra disk space for Docker and the
runtime. This uses local CPU inference, not a paid model API.

Use the following single-line commands in PowerShell. Port 11438 avoids the
usual Ollama port. If the container name or port is already in use, stop and
choose an unused name/port consistently; do not stop another project's service.

```powershell
docker pull ollama/ollama:0.34.0
docker run -d --name event-shortlist-viewer --cpus=2 --memory=4g -p 127.0.0.1:11438:11434 -v event-shortlist-viewer-models:/root/.ollama ollama/ollama:0.34.0
docker exec event-shortlist-viewer ollama pull bge-m3:latest
node tools/verify-model.mjs http://127.0.0.1:11438
```

**Wait for `ollama pull` to finish successfully before the last command.**
The final command checks the service version, full digest and two real
1,024-dimensional embeddings. Expect JSON with `passed: true`. It also warms
the model before the app's shorter request timeout. The check allows up to two
minutes for first inference; a slow machine can still fail this check.

The Docker volume persists across container restarts. It is empty only on its
first use. No claim of a new download is valid if you reused an existing store.
See [MODEL-SETUP.md](MODEL-SETUP.md) for the exact digest and limitations.

## 3. Check and start the app

From the repository folder, in the same PowerShell window:

```powershell
cd source
npm.cmd ci --offline --ignore-scripts --no-audit --no-fund
npm.cmd run check
$env:OLLAMA_BASE_URL = 'http://127.0.0.1:11438'
$env:PORT = '3000'
npm.cmd start
```

Expect **24 passing tests, no failures and no skips** for the recorded source.
These tests use fixtures, not live model inference. Keep this terminal open
while using the app. Open **http://127.0.0.1:3000** in your browser. If port 3000
is occupied, set an unused `PORT` and use that same port in the browser and test.
On Linux/macOS use `npm` and `export OLLAMA_BASE_URL=http://127.0.0.1:11438`
and `export PORT=3000` instead of PowerShell's `$env:` commands.

## 4. Check the result, not just the page

Use Austin, Conference, Event host/MC, English, four hours, and the default
style brief. Submit after each change:

| Date | Maximum starting price | Expected cards |
| --- | ---: | ---: |
| October 17, 2026 | $2,000.00 | 3 |
| October 18, 2026 | $2,000.00 | 1 |
| October 17, 2026 | $825.00 | 1 |
| October 17, 2026 | $824.99 | 0 |

Open a card's source details. The wishes should remain unverified, not be
presented as confirmed vendor qualities. Dates and prices are fixed sample data.

In a **second** terminal, return to the repository folder and run:

```powershell
node tools/check-demo.mjs http://127.0.0.1:3000
```

Expect `passed: true` for eight API cases, including invalid inputs. This does
not replace the browser actions above or prove production readiness.

## If it does not work

| Result | Next check |
| --- | --- |
| GitHub 404 | Repository access, not Node or your prompt. |
| Docker server unavailable | Start Docker; ensure Linux containers are enabled. |
| Model missing | Finish the model pull; inspect its actual error if it failed. |
| Version/digest mismatch | Stop. Do not remove the check or silently change the model. |
| Page loads but recommendations fail | Run `verify-model.mjs`; check the model address and app terminal. |
| First request times out | Warm the model with `verify-model.mjs`, then retry. Record repeated failures. |
| npm.ps1 execution-policy error | Use the shown `npm.cmd`; do not disable PowerShell security policy. |
| Node flag is unsupported | Check Node is the documented 22.22.1, not another major version. |

## Stop your own demo

Press Ctrl+C in the app terminal. Stop only the container created above:

```powershell
docker stop event-shortlist-viewer
```

The model volume remains for reuse. Nothing in these instructions deletes it.

For a later session, start that existing container instead of repeating
`docker run`. From the repository folder:

```powershell
docker start event-shortlist-viewer
node tools/verify-model.mjs http://127.0.0.1:11438
```

Then repeat step 3, including its environment variables in the new terminal.

## Rebuild rather than download the answer

See [BUILD-ALONG.md](BUILD-ALONG.md). The film's two historical prompts remain
unchanged in PROMPTS.md and source/. New portable instructions are labelled as
adaptations. They do not guarantee identical AI-generated code or bugs.
