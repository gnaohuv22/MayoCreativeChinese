# Security remediation evidence — 2026-10-29

Local implementation only. No deployment, push, live migration, browser access, new account, or external application write was performed. The original chat owns independent review and the staging release gate.

## Findings and evidence

| Finding | Local change | Verification |
| --- | --- | --- |
| F1 | The unused Sheets API writer is retired with HTTP 410. The supported Apps Script validates types, lengths, control characters, phone/year/email formats and enum values; every user-controlled text cell is apostrophe-prefixed for literal `setValues` writes. | Actual handler VM tests: `=`, `+`, `-`, `@` payloads remain literal; malformed/oversized inputs never write. Retired handler never imports credentials or Sheets code. No real Sheets evaluation claimed. |
| F2 | New `035-exam-integrity.sql` derives totals, counts, section scores and ownership from stored questions and caller identity. Rejects foreign question IDs and non-string/oversized answers. Revokes raw key-column SELECT from PUBLIC/anon/authenticated and direct attempt writes. Answer RPC requires current visibility plus `content.read` or the caller's own `server-v1` submission. Old attempts retain `legacy-client`. UI persists before requesting keys; editor loads keys through the RPC. | Actual migration applied twice to isolated PGlite PostgreSQL with real roles/privilege checks. SQL tests cover forged aggregates/identity, raw-column reads, direct inserts, missing/partial/all-correct answers, all seven question types, alternatives, numeric/circled/full-sentence ordering, another learner, staff review, access revocation and invalid inputs. Actual UI submit method is transpiled and tested for ordering and failure behavior. |
| F3 | Angular runtime/compiler 21.2.25, CDK 21.2.14, CLI/build 21.2.29; compatible transitive upgrades. SheetJS 0.18.5 replaced by official vendored 0.20.3. Removed obsolete `google-auth-library`. No forced audit fix or peer-dependency bypass. | `npm audit` and `npm audit --omit=dev`: **0 advisories**; saved JSON alongside this file. Real XLSX and BIFF8/XLS round-trip import tests retain Unicode, numeric levels and multiline examples. |
| F4 | Both production paths reject absent/blank CAPTCHA secrets. No runtime bypass switch. | Missing config/token, failed verification and wrong action/hostname tests cannot reach a write. Local tests inject mock services only; the local dev proxy rejects signup RPCs. |
| F5 | `/api/register` is a 410 tombstone without imports, Google credentials, writes, wildcard CORS or detailed errors. Frontend already uses Apps Script. | Actual handler called with formula, malformed and missing bodies; always 410 and no writer available. |
| F6 | Shared canonical REST path validator permits one resource or RPC identifier plus query. Rejects traversal, nested encoding, encoded separators/backslashes, malformed encodings, controls and fragments; final URL pathname must match. Production fetch uses manual redirects and rejects all 3xx. Local proxy uses same validator, aborts rejected requests, blocks signup and strips redirect Location with 502. | Encoded and mixed-case signup still require CAPTCHA; encoded valid signup is checked then forwarded canonically. Valid query retained; redirect, local rejection and traversal tests pass. No remote forwarding performed. |

## Validation

- `npm run test:security`: 11 tests pass, including the substantive SQL assertions in `scripts/db/tests/035-exam-integrity.test.sql`.
- `npm test -- --watch=false`: 97 tests pass in 15 files, including 2 XLSX/XLS compatibility tests and 3 ordering parity regressions. Initial sandboxed execution hit Windows EPERM on Vitest temp-file rename; the normal command passed outside that sandbox.
- `npm run build`: production build passes (initial bundle approximately 485 kB).
- Full and production npm audit snapshots contain zero advisories. Registry audits do not establish exploit absence or independently review vendor source.

## Policy and release constraints

This preserves a repeatable **practice** workflow: one server-graded submission unlocks the current key for that learner while they retain exam access. A blank submission can unlock review; later practice attempts may use that knowledge. This is intentional for practice and is NOT a one-shot closed-book assessment. A future assessment policy needs explicit product decisions about sessions, start/deadline enforcement, retries and answer release. `time_spent_secs` remains bounded client-reported metadata, not trusted timing. Essay/short-answer grading retains the existing exact/accepted-alternative matching behavior, not semantic human grading. Ordering normalizes marks/numbers to token sentences; identical duplicate words are interchangeable.

Local result details remain a browser practice view; persisted account scores are server-derived. Legacy client-scored history is retained, labelled `legacy-client` in the DB and does not unlock keys; do not treat old results as newly verified assessments. Future content edits may change the current review key. An answer-fetch failure after a successful insert can produce an additional practice attempt on retry; no exactly-once/session protocol is claimed.

PGlite uses isolated identity/visibility helpers and a schema fixture; it validates actual migration SQL and SQL privileges but is **not proof of deployed Supabase helpers, RLS, PostgREST schema cache, roles or grants**. Review and rollback-only tests against an authorized staging DB remain a release gate. The isolated fixture/test file must never be applied to production.

The new migration and frontend must be released together under the original chat's gate. Before release, independently verify actual grants (including direct key-column denial), privileged editor load/save, learner submit/review, denied/expired learners, legacy attempts, deployed CAPTCHA configuration, exact Apps Script version, and both registration paths. Missing secrets now deliberately prevent registration. No live checks were attempted because staging SSO and browser origin denials were already established; they were respected.

The Apps Script source was previously ignored by Git. Only `scripts/google-apps-script/register.gs` is added for a reviewable implementation; other ignored files remain untouched. Its public `securityKey` is a routing/compatibility marker, not authentication; CAPTCHA is the bot check. Source changes do not alter its live deployment. The retired endpoint no longer needs Google service-account environment credentials; reviewing/removing any deployed obsolete credentials is an operator follow-up, not performed here.

Local signup through `ng serve` now fails closed; use offline mocks (`npm run test:security`). No production-access bypass is provided for development.

## Primary dependency sources

- Angular advisory: https://github.com/angular/angular/security/advisories/GHSA-hh8m-fm6v-7cvg
- Official SheetJS install/distribution: https://docs.sheetjs.com/docs/getting-started/installation/nodejs/
- Vendor archive provenance/checksum: `vendor/README.md`


## Independent review correction

The initial commit's server grading treated identical duplicate word chips as interchangeable, while the client still compared chip identities. For `① 我 ② 我 ③ 学习`, user `①②③` and key `②①③` could therefore show different page/account scores. Client grading now compares normalized assembled sentences, matching the server; editing/display conversion retains chip identity.

`grading-parity.mjs` executes the actual TypeScript matcher used by `gradeExam` against the actual migration functions for **5,543 deterministic cases**, including independently expected duplicate/unique/prefix-sharing words, numeric/circled/full-sentence forms, alternate keys, punctuation, Unicode whitespace, out-of-range and oversized numeric fields, and the other six supported question types. It additionally calls the actual `gradeExam` method and persists RPC attempts in an isolated transaction, comparing total score, correct count and section score for five duplicate-word answers (including an incorrect order).

This comparison also exposed normalization gaps: SQL separated numeric input now uses the same token-count bounds as compact input and safely rejects oversized integers; empty/punctuation-only grading keys never earn credit; SQL whitespace normalization explicitly matches ECMAScript whitespace rather than relying on locale-sensitive PostgreSQL classes. These changes are in the still-unapplied migration 035. No historical applied migration was edited. The corpus is regression evidence, not proof of equivalence for every possible Unicode string or of deployed RLS.
