# Event Shortlist — source and prompt companion

Build a local shortlist of fictional event vendors, with hard requirements
checked before AI text-similarity ranking. The demo covers Austin and Chicago;
it does not make bookings, take payments or verify real vendor availability.
Sample starting prices are not final quotes. The sample calendar is fixed to
September 23–December 31, 2026.

## Start here

Choose one path:

- **Run the finished app:** [START-HERE.md](START-HERE.md) covers prerequisites,
  PowerShell commands, a separate local model, checks, examples and common errors.
- **Build your own version:** [BUILD-ALONG.md](BUILD-ALONG.md) creates a separate
  exercise with the brief, fictional catalog and disclosed prompt adaptation,
  without copying the finished app.

These guides were added after filming to fill gaps in the walkthrough. They
are not a claim that every setup command appeared on screen. Running the source
and building a new version from prompts are different checks.

The `source/` directory remains the recorded correction checkpoint
`268ce402655fd9a142d63fc13bb74178c568d904`. This is a provenance identifier, not
a commit that necessarily exists in this companion repository. Starting the
page without configuring the exact model is not a working recommendation.
See [MODEL-SETUP.md](MODEL-SETUP.md) for the model profile and limitations.

## Follow the development

- [PROMPTS.md](PROMPTS.md): the two actual coding prompts, checkpoints, observed
  failures, corrections and reproduction limits.
- [VERIFICATION.md](VERIFICATION.md): what was checked after the coding sessions
  and what has not been established.
- [REPAIR-VERIFICATION.md](REPAIR-VERIFICATION.md): the later setup repair,
  fresh-seed reconstruction, observed failures and exact limits of those checks.
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
readiness or third-party endorsement. File hashes identify this snapshot;
publishing source code is not a certification of production readiness.
