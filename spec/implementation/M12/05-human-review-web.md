# M12.5 — human-review-web

Parent: [M12 independent quality judging](../reference/modules/12-quality-judging.md). Requirements: R033, R035, R046, R077, R082–R091, R134, R139, R144, R150, R153–R154, R184–R189. Findings: F02–F06, F09, F13, F15, F18.

Outcome: a person can select Human as the quality judge before launch and, after benchmark execution and verification finish, review each delivered trial in an automatically opened local web form. This is an implementation specification, not an implemented service or a new software-domain profile.

## Entry conditions and ownership boundaries

**Completed implementation prerequisites, exactly four:** [Bootstrap](../BOOTSTRAP.md), [M12.1 review-contract](01-review-contract.md), [M11.1 engine-client-api](../M11/01-engine-client-api.md), and [M11.2 events-jobs-lifecycle](../M11/02-events-jobs-lifecycle.md).

Publish application Protocols and deterministic fixtures for M01 frozen rubric/identity reads, M02 retained artifact/evidence readers, M12.2 submission/settlement, M11 lifecycle admission and the existing browser-opener seam. Their real implementations are later integration gates, not entry dependencies. M12.2 depends on this child; this child must not require M12.2, M02, M07 or M13 at implementation entry.

M12.1 owns pure tagged selection, reviewer/form-policy identity, projection and review validity; M12.2 owns backend dispatch, M02 append orchestration and original/additional settlement. This child owns human sessions, drafts, durable submission intent, the loopback gateway and trusted form/evidence viewer. It calls the same validator and use cases; no forked rubric, scoring engine or browser-only validity rule.

M07 owns the prelaunch picker; M12.3/M11/M14 own progress, reopen, detach and stop entry points. M08 owns pre-seal checks and capture; M02 owns committed review storage; M06 alone computes quality/rankings. [M13.1](../M13/01-offline-report-artifact.md) remains a portable, offline `file://` report, not this active review controller.

## Exact proposed ownership

- `axbenchmark/engine/judging/domain/human_sessions.py`, `human_drafts.py`: immutable case/draft/state/intent types using existing ResultId, TrialRef, ReviewId and rubric types.
- `axbenchmark/engine/judging/application/human_sessions.py`, `human_drafts.py`, `human_submissions.py`, `human_recovery.py`, `human_queries.py`: admission, compare-and-save, explicit submit/skip, reconciliation and safe projections.
- Add `HumanReviewHost`, `HumanSessionStore`, `HumanEvidenceSource`, `HumanSubmissionSink`, `HumanLifecycleGate` and `BrowserOpener` consumption to `judging/ports.py` and `application/interfaces.py`, coordinating existing declarations rather than copying types.
- `axbenchmark/engine/judging/adapters/human_http.py`, `human_rpc.py`, `fs_human_sessions.py`, `human_credentials.py`; `adapters/human_web/index.html`, `form.css`, `form.js`, `evidence.js` contain trusted shipped assets only.
- `axbenchmark/api/judging_human.py`, `api/schemas/judging-human-v1.openapi.yaml`; additive `judging.human.*` method/event registrations and injected startup/shutdown/activity hooks through M11's registry/composition seam.
- `tests/engine/judging/test_human_domain.py`, `test_human_sessions.py`, `test_human_drafts.py`, `test_human_submissions.py`, `test_human_recovery.py`; `tests/api/test_human_http.py`, `test_human_rpc.py`.
- `tests/browser/judging/test_human_form.py`, `test_human_evidence.py`, `test_human_security.py`; `tests/integration/test_human_judging_lifecycle.py`; `tests/fixtures/judging/human/` contains all six profiles, hostile evidence, journals and controllable append/stop barriers.

No private process/model transport, scoring implementation, generic RPC proxy, arbitrary filesystem server, remote collaboration service or production web deployment belongs here. Dependency installation and artifact execution are outside this feature.

## Selection, launch and anonymous inputs

M12.1's tagged `JudgeSelection` gains `human_review {reviewer_ref, form_policy_ref}` beside `harness_review` and `decision_rubric`. Freeze reviewer/profile version/digest and form-policy version/digest at launch; harness defaults and legacy decoding remain unchanged. A saved explicit Human choice is restored without substituting a model.

Human availability requires the local review host and supported evidence renderer, not a decision model, judge harness, API key, model effort or confidence threshold. Competitor execution still needs its selected harness. Capability checks describe readable required modalities and missing evidence honestly; they do not invent a human `image_input` model capability receipt.

An engine-created stable opaque reviewer UUID identifies the local reviewer profile; an optional label is self-declared. This is neither SSO nor proof of a person's real identity. Freeze one reviewer profile across the local comparison; profile edits affect future selections only. Another reviewer requires explicit additional rejudging and a distinct JudgeGroup, never automatic averaging.

The human group binds backend, reviewer/profile and form-policy versions/digests, approved rubric/profile/category signature, evidence-plan/projection policy and scope. RawReview commentary provenance is `human_authored`; model identity, effort, confidence, InvocationId, DecisionCallId and PID are absent, not fabricated placeholders.

Create one form case for each expected ResultId/TrialRef, not each coding task. The engine retains native bindings; the browser receives opaque case/evidence IDs and anonymous labels A, B, … or ordinals. Queue order is a frozen anonymous permutation independent of configuration/trial display order; expose no alias map, native IDs, harness/model identity or “which trial” label.

Use M12.1's immutable anonymous projection of approved specifications/tasks, final source/tests/documentation, rubric anchors, M08 outcomes and admitted final-artifact evidence. Recursively withhold prices/costs, tokens, elapsed/check/process times, Gen tok/s, measured Files / LOC or document size, hardware, weights, rankings, builder/creator identity and other reviews, including nested metadata and filenames carrying provenance.

Retain legitimate artifact API/framework/product-model names, functional target settings and declared constants needed to interpret behavior. Projection redaction does not rewrite original retained bytes. Hiding measurements and identity in this UI cannot erase the reviewer's prior knowledge, memory or inferences; record that limitation without claiming perfect blinding.

The form uses the same frozen `profileVersion`, rubric digest and six ordered categories for [web/backend](../reference/modules/12-quality-judging.md#quality-profiles), [backend/2](../quality-judges/BACKEND.md), [mobile](../quality-judges/MOBILE.md), [DevOps](../quality-judges/DEVOPS.md), [agentic](../quality-judges/AGENTIC.md) and [specification](../quality-judges/SPECIFICATION.md). Retained versions keep their recorded meaning; no latest-default substitution.

Display requirement/criterion coverage and evidence deficiencies without default-weight values. Web shows actual final captures at 1440×1000 and 390×844 per approved scope; mobile shows actual images for its frozen native target/state matrix. Other domains use their approved textual/behavioral evidence and any explicitly required images, never a new screenshot prerequisite.

Source, delivered tests, behavioral reports, product-agent evaluation traces and supplied/candidate specification documents are read-only evidence. Distinguish authority from candidate claims and simulated/replayed/live outcomes. No execution, live preview of the candidate app, device action, deployment, repairs, extra test/validator, remote evidence fetch or benchmark/profile/weight edit is offered.

**Frozen domain contract.** The trusted form/evidence renderer consumes frozen ProfileDTO.comment_axes and DomainEvidencePlan/ObservationContext coverage, with six ordered exact grade controls regardless of zero weights. Backend API/data/recovery, native build/matrix/lifecycle, DevOps plan/dry-run/applied/rehearsal, product-agent per-boundary modes and supplied-brief versus candidate-document roles are labelled explicitly. Evidence or renderer gaps remain deficiencies; no screenshot requirement is inferred for text domains and no file/spec count or measured metric is a quality proxy. Existing pending/draft/submit/skip lifecycle and shared validator remain unchanged.

The HTTP case/form/evidence DTOs and rendered DOM use M12.1's recursive anonymous allowlist: withhold competitor base/fine-tune/quant/adapter/merge lineage, creator-role/date-kind/source claims, manifests/hashes, requested/effective proof and annotations even in nested labels, download names or URLs. Opaque case/evidence IDs never encode variant or subject IDs. Queue order cannot sort by these withheld facets. Keep legitimate product-model terms/approved artifact semantics and original retained bytes unchanged; the form has no variant filter/detail endpoint or invented human model identity.

## Integrated requirements

R191 — [authoritative SQLite results and analyses](../RESULTS-DATABASE.md).
R190 — [model variants, lineage and comparison](../MODEL-VARIANTS.md).

R189 — [human review](../M12/05-human-review-web.md).

R184, R185, R186, R187, R188 — frozen domain profile/evidence contracts: [R184](../quality-judges/BACKEND.md); [R185](../quality-judges/MOBILE.md); [R186](../quality-judges/DEVOPS.md); [R187](../quality-judges/AGENTIC.md); [R188](../quality-judges/SPECIFICATION.md).

## Post-execution lifecycle and resource release

M11 admits original human judging only after **all** expected competitor trials finish or are stopped as applicable, verification and accounting are durably finalized, results are sealed, identity is current and normal original-judging admission succeeds. Stopping the whole run closes admission and settles unfinished originals; it must not open a new form afterward.

M12.2 creates/returns the unique original batch and calls `HumanReviewHost.prepare`. Persist the batch/case roster and pending state before scheduling one automatic browser-open attempt for that batch. It opens the review queue, not a tab per trial; incomplete/missing-artifact cases remain explicit roster entries with deficiencies or durable NOT_JUDGED dispositions.

Automatic opening is enabled for an explicitly selected Human judge. Record `auto_open_attempted` durably before invoking the opener; repeated events, reconnects and restart never issue another automatic attempt. A crash between that record and OS dispatch leaves manual reopen available. An explicit reopen may make another attempt.

The run stays in its existing nonterminal `judging` phase with typed `wait_reason=human_input` and UI status “Awaiting human review” (`awaiting_human_review`); do not introduce a new top-level RunState that bypasses existing stop/report gates. Sealed execution facts/digests never change. `RunJudging.wait` legitimately waits for human input, with visible pending counts/status/actions; this is not a broken infinite-poll condition. Distinguish deliberate human waiting from typed persistence/recovery failures.

Pending human cases release the global **automated** FIFO slot, run locks, worker resources and every model/resource lease. Preparing a bounded case projection may use a short admission critical section; no lock spans a person reading/editing. Other benchmark runs, machine judging and independent human batches continue. No inference is dispatched for this backend.

Final quality-complete status, `finish_run_retention`, export readiness and automatic completion-report handling await durable submit/ungraded/skip/cancel dispositions for every original case. A draft, tab close, disconnect, timeout or opener failure cannot count as a grade or settlement. There is no silent timeout-to-grade or timeout-to-NOT_JUDGED policy.

Do not automatically open the statistics/report alongside a pending form. Once original settlement and M02 retention barriers pass, normal M13 report policy may run. Explicit inspection outside the form does not make a blinding guarantee; the form itself still excludes measurements and prior reviews.

`--no-tui`, SSH and browser failures print the local URL, durable human batch/review reference and explicit reopen/attach/stop actions. Explicit Human selection authorizes this waiting phase; clients may detach while engine-owned review remains pending. Never enable remote sharing or bind a public interface as an opener fallback.

An active pending human host counts as M11.2 activity even with no browser/client connected; the daemon's idle exit cannot discard it. Normal `engine.stop` retains its active-work busy refusal. Process/system shutdown checkpoints drafts and revokes credentials without fabricating a human disposition. A run-stop operation is distinct: it durably settles unfinished originals before terminal retention.

Crash/restart recovers human AWAITING/DRAFT state and sealed execution facts without repeating execution, inference or automatic browser opening. This narrowly scoped human-only recovery does not resume interrupted competitors and does not change model-backend unfinished-work recovery to NOT_JUDGED(engine_lost).

Startup reconciles SUBMITTING intents against real append acknowledgements before admitting affected mutations; expose typed persistence-pending failures. Bind a fresh loopback port and rotate web credentials; provide explicit reopen. Recovery must return control after restoring a pending human host, not await human input inside the global startup hook.

Run stop/invalidation and submit serialize through M11's lifecycle gate. If revocation wins, reject submit and retain partial draft/deficiencies, settling NOT_JUDGED(stopped/identity_invalidated). If a complete submission intent wins, drain its exact append before stop settlement; preserve the committed review. Invalidation still overlays every affected result/review as non-comparable.

Skip settles only its case. Closing a tab or detaching settles nothing. Explicit rejudge creates a new additional human review/group as selected, leaves the original untouched and never reopens execution or original retention; cancelling that additional work affects only its job.

## Human form and assessment contract

**Domain acceptance:** Extend existing all-six-profile form fixtures with native wrong-build/matrix gaps, plan-only deployment claims, mixed live/mocked agent boundaries and specification injected commands/authority overrides. Submitted evidence refs must resolve within the frozen case; incomplete grades/comments stay invalid and no candidate content executes.

The desktop form places anonymous queue/coverage beside evidence and six rubric sections; a narrow mobile viewport stacks the same controls without hiding requirements or submission state. Page title, queue, evidence panels and browser metadata use only anonymous labels.

Each category presents its frozen label and anchors, a required half-point selector with exactly `1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5`, **no preselected grade**, a substantive rationale field and admitted-evidence picker. Evidence selections bind alias plus digest and optional admitted range/criterion support; free-form paths/URLs cannot become references.

Require `code_quality`, `developer_experience` (usability/DX) and `specification` comments plus an explicit limitations list, including a deliberate “No additional limitations” choice for `[]`. Specification-profile labels describe technical-design maintainability and implementation readiness, not implemented code.

Show observed failures separately from unavailable evidence. An evidenced defect or omission can justify a low anchor; an unknown/missing capture cannot become 1, 0 or N/A. Human `unable_to_assess` retains its reason as the shared M12.1 `human_unable_to_assess` deficiency, never a numeric substitute or redistributed weights.

Offer Save draft and debounced autosave with visible Unsaved / Saving / Saved(version) / Save failed / Conflict state. A “Saved” indication requires durable server acknowledgement; local typing and unload handlers are not persistence. Allow partial/null unanswered fields in drafts only; leave their deficiency list visible.

“Submit review” explicitly submits the displayed payload in graded mode; missing/invalid required data returns field errors and remains editable. “Submit as ungraded / unable to assess” requires an explicit reason and preserves partial answers/deficiencies. “Skip this case” requires a reason, preserves its draft and records NOT_JUDGED rather than creating a review.

Submission freezes that case. Display a durable receipt only after M02 acknowledgement, with opaque receipt/review reference, digest and actual graded/ungraded outcome. While pending show “Submitting — awaiting durable storage”; no success banner on HTTP acceptance alone. Submitted cases are read-only; corrections use explicit additional review.

Opening the next case clears previous fields, selections and evidence state; never prefill a previous review. Saved content may populate only its exact case/version. Earlier reviews are not accessible in the active anonymous queue; the current submitted case may show its own receipt/answers without leaking another case's review.

Use semantic labels/fieldsets, keyboard access, visible focus, linked inline errors and an error summary focused after failed submit. Announce save/submission status without stealing focus; controls remain usable with zoom and at narrow width. Evidence text is escaped and image descriptions identify the approved capture, without inventing image contents.

## Durable cases, drafts and submission interfaces

`HumanCase` binds opaque case ID internally to batch, reviewer, ResultId/TrialRef, ReviewId reservation, immutable artifact/rubric/scope/evidence digests and original/additional purpose. These native bindings never cross the web projection. Persist draft `version`, parts, deficiencies, state, operation log and auto-open marker under `~/.axbenchmark/judging/human/<batch_id>/` with private directories/files (0700/0600). These are M12 working checkpoints, not a second committed review repository; M02 SQLite alone owns authoritative reviews, grades and dispositions.

`AWAITING` (empty) and `DRAFT` are editable; saving increments version. `SUBMITTING` is immutable while an accepted submit/skip/cancel intent is being appended. Terminal `SUBMITTED`, `SKIPPED`, `CANCELLED` and `INVALIDATED` are read-only. A previously SUBMITTED review stays submitted under a separate invalidation overlay; never rewrite it into an unfinished state.

Store atomic durable journal/checkpoint updates using fsync and rename, not browser local storage. M02 appends review/grade/disposition/receipt rows atomically in SQLite after durable evidence; M12 working checkpoints acknowledge that receipt rather than independently publishing a review. Never hold a database transaction while waiting for a person or an opener. Preserve partial drafts as explicitly uncommitted local diagnostics after skip/cancel; they are not exported as quality. Submitted ungraded content is committed review evidence and carries its deficiencies. Credential material is separate from drafts/artifacts/exports and logs.

Published ports, implemented initially with fakes:

```python
class HumanReviewHost(Protocol):
    async def prepare(self, plan: HumanBatchPlan) -> HumanBatchRef: ...
    async def status(self, batch: HumanBatchRef) -> HumanBatchStatus: ...
    async def reopen(self, batch: HumanBatchRef) -> HumanOpenAttempt: ...
class HumanEvidenceSource(Protocol):  # M02/M01 application readers
    async def manifest(self, binding: HumanCaseBinding) -> AdmittedManifest: ...
    async def read(self, binding: HumanCaseBinding, ref: AdmittedRef) -> bytes: ...
class HumanSubmissionSink(Protocol):  # M12.2 -> M02 append/settlement
    async def commit(self, intent: HumanSubmissionIntent) -> HumanCommitReceipt: ...
class BrowserOpener(Protocol):  # narrow URL view of extended SystemOpener
    async def open_review_url(self, url: LocalReviewUrl) -> OpenAttempt: ...
```

`HumanSessionStore` offers durable create/load/list-pending, compare-and-save(version), prepare-intent and acknowledge-receipt; `HumanLifecycleGate` atomically admits an intent or records revocation against M11 stop/invalidation. Reuse M13's existing `SystemOpener`/`adapters/system_opener.py` at integration with a typed loopback URL target alongside its file-path operation; do not import reports adapters from judging application code. Invoke the OS opener with a bounded, validated URL argv value, never shell interpolation.

Submission first authenticates scope and checks a known idempotency record, then validates version/frozen digests/current lifecycle and uses M12.1 to produce the exact review or deficiencies. Graded mode cannot bypass deficiencies. Ungraded mode preserves the shared typed abstention reason. M12.2 remains the authoritative dispatcher/settler and calls the same validity contract before M02 append.

Under the lifecycle gate, atomically persist immutable intent bytes/digest, stable ReviewId for submitted reviews, operation kind, exact request digest and idempotency key before acknowledging SUBMITTING. `HumanSubmissionSink.commit` acknowledges only M02's real durable append/disposition receipt; its failure leaves discoverable pending state, never false quality completion.

Retry/recovery replays that exact intent with the same ReviewId/digest; it must not reread a mutable draft as a new review. Lost append acknowledgement may retry the idempotent M02 operation. Publish terminal case state, original disposition and `judging.human.case.changed` only after the sink's barrier; M12.2 includes it in full-roster settlement.

Identical operation-key/payload replay returns the original operation/receipt **even if its base_version is now old**. Reusing the key with different bytes/semantics returns conflict. Deduplication survives restart for the lifetime of the case; it is not a short HTTP cache. Replays cannot bypass revoked authentication or mutate another scope.

**SQL acknowledgement projection.** `HumanCommitReceipt.receipt_ref` resolves the real M02 operation receipt/publication containing review/grades/finalization and original or additional disposition. The fs_human_sessions acknowledgement is a recoverable local projection only; lost acknowledgement replays the immutable admitted intent. HumanRecoveryPending keeps drafts/session intent journals outside analytical review tables, and neither database backup nor M17/report export implies inclusion of these private working files.

## Local HTTP and engine API

The engine owns one bounded loopback listener at an OS-assigned random port, bound to `127.0.0.1` (a separately tested exact `::1` origin may be supported). Generate and validate the exact scheme/host/port; never listen on `0.0.0.0`, accept wildcard hosts, trust forwarded headers or expose the Unix engine RPC through HTTP.

V1 serves shipped assets at `/review/` and these resource endpoints; all data responses are JSON except bounded evidence bytes. Require bearer authentication after bootstrap; authorization applies again in the application service. Unknown/foreign case/evidence IDs return 404 without revealing their existence.

| Endpoint | Request | Success response |
|---|---|---|
| `POST /api/v1/sessions` | `Authorization: Bearer <bootstrap>`, JSON `{}`; exact Origin | 201 `{session_id, access_token, batch_ref, expires_at}`; `Location` points to this session |
| `GET /api/v1/sessions/{session_id}` | Current scoped bearer | 200 `{batch_ref, state, pending_count, capabilities}` |
| `GET /api/v1/cases?cursor=…&limit=…` | Session scope; optional opaque cursor | 200 `{items:[{case_id,label,state,version}], next_cursor}` |
| `GET /api/v1/cases/{case_id}` | Current scoped bearer | 200 `CaseView {case_id,label,state,version,profileVersion,rubric_digest,artifact_digest,scope_digest,categories,coverage,draft,deficiencies,capabilities}` + ETag |
| `GET /api/v1/cases/{case_id}/evidence?cursor=…&limit=…` | Optional scoped cursor | 200 `{items:[{evidence_id,digest,kind,label,coverage}], next_cursor}` |
| `GET /api/v1/cases/{case_id}/evidence/{evidence_id}?digest=…&offset=…&length=…` | Exact admitted digest; text-only nonnegative byte offset/length | 200 safe text/image bytes with fixed MIME, digest and bounded-range metadata; images require whole-object read |
| `PUT /api/v1/cases/{case_id}/draft` | `If-Match`, `{base_version,rubric_digest,artifact_digest,scope_digest,parts}` | 200 `{version,draft,deficiencies,persisted:true}` + new ETag |
| `POST /api/v1/cases/{case_id}/submissions` | `Idempotency-Key`, `{base_version,rubric_digest,artifact_digest,scope_digest,mode:graded\|ungraded,parts,reason?}` | 202 `{operation_id,state:submitting}` + `Location` until durable; exact completed retry returns 200 receipt |
| `POST /api/v1/cases/{case_id}/skips` | `Idempotency-Key`, `{base_version,rubric_digest,artifact_digest,scope_digest,reason}` | 202 operation; completed retry returns 200 durable NOT_JUDGED receipt |
| `GET /api/v1/operations/{operation_id}` | Same case/batch scope | 200 `{state:submitting\|committed,pending_error?,receipt?}`; receipt only when durable |

`parts` uses the shared RawReview field structure for categories, grades, rationale/evidence support, three comments and limitations; drafts additionally allow absent answers. Wire grade values are exact strings from the nine choices. `ungraded` requires nonempty `reason`; graded mode requires the complete shared contract. Reject unknown binding/authority fields rather than silently accepting client-supplied reviewer/result IDs.

`HumanCommitReceipt` projects `{receipt_ref,case_id,operation_id,outcome:graded|ungraded|not_judged,review_ref?,review_digest?,disposition_digest,committed_at,deficiencies}`; native IDs remain engine-side. CaseView uses its own saved draft/receipt only; categories include exact keys, labels and anchors, with required evidence/criterion coverage. Web batch/session/operation references are random opaque aliases, not encoded native IDs.

Cursor lists default to 25, maximum 100; cursor binds session/batch, list kind and snapshot revision, with invalid/stale cursor errors and a fresh-list remedy. Evidence access streams bounded chunks (text maximum 64 KiB/request; verified images maximum 20 MiB and 64 megapixels). Text responses identify complete byte length, returned offset and next offset; preserve UTF-8 decoding across chunks and mark incomplete views. Never silently truncate a required image or claim incomplete text is complete.

JSON mutations have a 256 KiB body limit, 16 KiB per commentary/rationale field, 1,000 evidence references and 100 limitations maximum; frozen form policy records these bounds before launch. Oversize required review/evidence yields an explicit limitation/remedy, not dropped text or automatic summarization. Limit connections/concurrency and parser depth; use bounded request/read deadlines, not a deadline on human decision time.

ETag is a quoted case/draft version token. If-Match and base_version must agree for draft updates; concurrent tab edits return 409 `judging.human.version_conflict` with the current version and reload/compare remedy, never overwrite silently. A submission compares its explicit base_version after checking exact idempotent replay; frozen digest mismatch returns 409 `judging.human.binding_changed`.

All failures use `{error:{code,message,field?,remedy?,details?,request_id}}`. Use 400 malformed JSON/cursor, 401 missing/expired credential, 403 rejected Origin/Host or forbidden action, 404 inaccessible resource, 409 state/version/digest/idempotency conflict, 413 body too large, 415 non-JSON mutation, 422 invalid/incomplete review, 429 bounded rate limit and 503 unavailable storage/host with Retry-After. Unexpected 500 errors are sanitized; no stack traces, private paths or secrets.

GET/HEAD never mutate drafts, rotate credentials, launch browsers or submit reviews. Use `Cache-Control: no-store`; successful save is read-your-writes. OpenAPI defines all fields, enum states and named errors; v1 evolves additively, incompatible meanings require v2. A validation response cannot masquerade as 200 graded success.

Register `judging.human.status(batch_ref)`, `.reopen(batch_ref)`, `.case(case_ref)`, `.save_draft(input)`, `.submit(input)` and `.skip(input)` on the existing engine namespace with the same application methods and shared DTO semantics. Native trusted clients may resolve run/result bindings; web credentials cannot invoke this registry or submit arbitrary RPC names.

`judging.human.case.changed` and `judging.human.batch.changed` are revisioned updates routed through the existing `judging` topic, with durable snapshot providers and M11 EventCursor semantics. Events contain status/opaque references, never web credentials. M12.3 progress and M14 CLI consume status/reopen; they own no private HTTP business rules.

## Browser and evidence security

Create a cryptographically random credential with at least 256 bits of entropy, a five-minute bootstrap lifetime and one-use exchange, scoped to one human batch/reviewer. The opener URL puts it only in the fragment: `/review/#bootstrap=…`. The trusted page immediately calls `history.replaceState` to remove it, then exchanges it via Authorization for an eight-hour session bearer kept only in page memory; refresh/reopen can obtain a fresh credential through the local engine client. Credential expiry affects access only, never case disposition or durable drafts.

No query-string tokens, local/session storage, cookies, credential logging, telemetry, referrer leakage or exported secrets. Redact full opener arguments and authorization headers from engine diagnostics. Bootstrap response loss requires explicit reopen; no background credential resurrection. Reopen can mint another short-lived bootstrap for the same scope without changing drafts; stop/invalidation/shutdown/restart revoke scoped sessions and tokens.

This v1 bearer choice avoids depending on Secure-cookie behavior over plain HTTP. If a future cookie variant is selected, require a host-only HttpOnly/SameSite cookie plus independent CSRF protection; set Secure only under a transport/localhost policy verified on supported browser versions. MDN documents HTTPS restrictions and localhost exceptions, not a blanket guarantee for every HTTP loopback/browser combination. [MDN Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)

Every request validates the literal Host against the bound origin, rejecting DNS-rebinding names and forwarded-host overrides. Every mutation requires exact Origin and Authorization, JSON Content-Type and a trusted fixed route; reject missing/null/foreign Origin. For reads, authenticate and reject foreign/null Origin if supplied; same-origin GET may omit it. MDN defines Origin using scheme/host/port and documents omitted/null cases. [MDN Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Origin)

Do not enable CORS; reject cross-origin preflight and simple-form mutation content types. Check Fetch Metadata as defense in depth where present; never depend on SameSite alone or treat browser-origin headers as protection from a malicious local process that already has the secret. These are project controls informed by OWASP's layered CSRF guidance. [OWASP CSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

Serve a nonce-based strict CSP: `default-src 'none'; script-src 'nonce-<response-random>'; style-src 'self'; connect-src 'self'; img-src blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'`. Trusted static scripts alone receive the nonce; no inline handlers/eval, CDN, remote assets, frames or service worker. Also send `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff` and same-origin resource policy. CSP restricts loaded/executed resources; it supplements safe rendering, not validation. [MDN CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)

Fetch admitted images with Authorization and display verified raster MIME bytes using short-lived blob URLs, revoked on case change. Show source/HTML/SVG/scripts as escaped text only; Markdown uses a trusted sanitizer with raw HTML, embedded media, active URLs and remote links disabled. Never render candidate HTML/SVG in the controller origin, create executable downloads, follow candidate links or use artifact text as DOM/route code.

Resolve evidence only by the case's allowlisted ID/digest through M02/M01 readers; enforce protected-root containment, canonical paths, no traversal/symlink escape and immutable snapshot/identity checks. Read approved sanitized projections, not private store paths, credentials, builder logs or arbitrary files. Digest/identity mismatch blocks access/submission and routes M11 invalidation through its established coordinator.

The gateway maps DTOs/auth/errors and delegates to shared use cases; it contains no alternate grade, evidence-admission or settlement logic. Browser asset rendering never executes artifact commands. Saving an offline report or this page's HTML cannot create a reusable controller with embedded credentials; M13 output contains only committed review facts and inert evidence.

## Accounting, consumer integration and acceptance

**SQLite acceptance:** After M02 commit but before working acknowledgement, raw SQL already exposes exactly one complete review/disposition; replay returns the same receipt. Before commit, both raw SQL and quality readers expose no half-review. Backup/ZIP/HTML omit draft parts and bearer credentials.

**Variant acceptance:** Seed unique variant/creator/date/provenance sentinels at every nested input/manifest/label/URL layer across all six rubric families and all three backends; assert absent from automated requests and human case JSON/DOM/evidence metadata while legitimate artifact model terms remain readable. Automated judge identity stays role-separated and human schemas reject model fields.

Human `AssessmentTotals` has one case per result and inference-call budget **0**. API inference charge is **not applicable**, not a fabricated zero-price model receipt; human labor cost is unmeasured unless separately modeled later. Record waiting/editing/submission wall time as human-review lifecycle data with honest observation limits, separate from competitor elapsed time, resource windows and costs.

M06 consumes only server-validated committed reviews and existing JudgeGroup rules. Drafts, skipped cases and ungraded submissions produce no Q; valid raw grades keep the existing formulas and business-category threshold. M13/M17 retain `human_authored`, reviewer/group/form-policy identity and committed limitations offline, never tokens or local drafts; reading/importing creates no new review session or inference.

Proposed runnable checks after implementation:

```sh
pytest tests/engine/judging/test_human_domain.py tests/engine/judging/test_human_sessions.py tests/engine/judging/test_human_drafts.py tests/engine/judging/test_human_submissions.py tests/engine/judging/test_human_recovery.py tests/api/test_human_http.py tests/api/test_human_rpc.py
pytest tests/browser/judging tests/integration/test_human_judging_lifecycle.py
lint-imports
```

1. Run all six frozen rubrics with multiple configurations/trials. The form opens automatically once only after every trial/evidence/accounting seal and admission; one case maps to each ResultId/TrialRef, not each task. No concurrent statistics tab appears; stopped-before-admission runs open none.
2. Walk all browser responses, DOM, asset URLs and nested evidence for forbidden identity/measurements/weights/other reviews. Verify actual web/native images, coverage matrices, text-domain evidence and specification comment labels; instrument model/harness/lease ports and assert zero human grading calls or synthetic receipts.
3. Exercise all nine grades and rejection of booleans, off-grid/range values, duplicate/unknown categories, missing comments/rationale/limitations and foreign evidence. Drafts remain partial; explicit graded submit fails incomplete data; unable-to-assess commits ungraded; skip keeps partial diagnostics; close/detach never completes a grade.
4. Test keyboard-only and screen-reader labels/error focus at desktop and narrow widths, durable save feedback, failed autosave and fresh next-case fields. Read malicious source, Markdown, HTML, SVG and image fixtures without script/network execution, unsafe links or arbitrary path access.
5. Race duplicate POST, response loss, stale tabs, conflicting operation keys and stale digest/version submissions. An exact accepted replay with an old base_version returns the same operation; fail/delay M02 append and crash after each intent/append/ack boundary: no duplicate review, false receipt or premature original settlement.
6. Race submit against stop/invalidation and additional-review cancellation; completed reviews survive, unfinished cases settle with reasons, overlays exclude invalidated results and unaffected work continues. Human waiting holds no automated FIFO slot/run lock/model lease; delayed original review still blocks only that run's final quality/retention/report barrier.
7. Restart editable and SUBMITTING cases with no clients: drafts recover, immutable intent alone replays, ports/tokens rotate, old credentials fail, no execution/inference/automatic browser reopen occurs. Pending host prevents idle exit; explicit shutdown checkpoints safely; model-backend recovery keeps its separate NOT_JUDGED rule.
8. Attack Origin/null-Origin, simple forms, preflight/CORS, wrong Host/DNS rebinding, forwarded headers, cross-case tickets, private paths/symlinks, oversized JSON/images and credential logging/referrers/exports. Assert exact status/error schemas, bounded lists and no secret/stack/path disclosure.
9. Fail the browser opener and run headless/SSH: retain pending state, print local URL and durable reference, explicitly reopen through CLI/TUI, detach/attach and submit successfully. Full real M02/M11/M12.2 integration must prove durable dispositions, then standalone M13 report works offline without a host, unsafe controller or automatic regrade.

**Real integration gate:** compose M01/M02 readers, M12.2 sink/settlement, M07 selection, M11 lifecycle/activity, M12.3/M14 progress/reopen, the extended existing platform opener, and M06/M13/M17 consumers. Prove macOS/Linux opener and supported-browser behavior with recorded versions. Fixture success establishes the local contract only; parent completion still requires these real providers and lifecycle/report portability checks.
