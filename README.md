# Event Shortlist — source and prompt companion

Build a local shortlist of fictional event vendors, with hard requirements
checked before AI text-similarity ranking. The demo covers Austin and Chicago;
it does not make bookings, take payments or verify real vendor availability.
Sample starting prices are not final quotes. The sample calendar is fixed to
September 23–December 31, 2026.

## Start here

The `source/` directory is the unchanged recorded correction checkpoint
`268ce402655fd9a142d63fc13bb74178c568d904`. With Node 22.22.1:

```sh
cd source
node --version
npm run check
npm start
```

Open `http://127.0.0.1:3000`. No application dependencies are installed by these
commands. A working recommendation additionally requires the exact local
Ollama/model profile in [MODEL-SETUP.md](MODEL-SETUP.md). Starting this app does
not download or configure that model. Without it, expect an explicit model
error, not working AI results. The model was subsequently downloaded into an
empty, separate store and checked with this source; the already-installed
runtime was reused. See MODEL-SETUP.md for the exact boundary of that check.

Try the October 17 example, then October 18. Return to October 17 and compare
a maximum starting price of $825.00 with $824.99. Inspect the source description,
eligibility facts, unverified wishes and questions to ask the vendor.

## Follow the development

- [PROMPTS.md](PROMPTS.md): the two actual coding prompts, checkpoints, observed
  failures, corrections and reproduction limits.
- [VERIFICATION.md](VERIFICATION.md): what was checked after the coding sessions
  and what has not been established.
- `source/BRIEF.md`: the adapted product contract, including US01–US14.
- `source/README.md`: API, exact model profile, configuration and source details.
- `source/CHANGELOG.md`: original and correction-session history.
- `FILES.sha256`: hashes of this companion's files.

The source's README and implementation report preserve what was known at the
end of the coding session. Their statements about pending controller checks
are historical; VERIFICATION.md describes subsequent checks without rewriting
those records. Successful checks do not imply public distribution approval
or production readiness.

The film is an explained build-and-repair walkthrough: initial coding,
subsequent source inspection, controlled tests and a post-build app demo are
distinguished. It is not an uninterrupted recording of typing every line.

## License

The publishing maintainer provides this project under the [MIT License](LICENSE)
to the extent they hold rights. See [license scope](LICENSE-SCOPE.md) for the
AI-assisted provenance and external prerequisites. This grants no production
readiness or third-party endorsement. The archive remains an unpublished review
candidate until its exact distribution and publication checks are recorded.
