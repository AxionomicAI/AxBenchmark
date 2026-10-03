# M01.3 — library-service

Parent: [M01](../reference/modules/01-template-library-identity.md#2-api-surface-templates). Requirements: R015, R018, R019, R028, R030, R037, R067, R136, R151. Findings: F01, F14, F17; F15 foundation ordering.

Outcome: the real `InProcessClient` exposes the complete `templates.*` service, including transactional approval/deletion, while later providers can be injected through their published contracts.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M01.2](02-revision-storage.md), M11.1 `engine-client-api`, M11.2 `events-jobs-lifecycle`. M01.2 brings M01.1 transitively. Do not require all of M11 or any planner/harness runtime.

**Bootstrap-published contracts, allowed as injected fixtures:** M02 `RevisionResults`; M03 `ReadinessGate`; M07 `RevisionConfigs` with prepared copy/remove operations; M09 `BuiltinCatalog` and `ContractDescriber`; M16 `DraftStore.inspect -> DraftApprovalInput(version, frozen)` and transactional approval marker; M08 `CheckIndex`; M12 `RubricIndex`; M11 `ActiveRuns` returning `ActiveRunRef(run_uid, run_label, origin)`. Shared views/tokens must match M01.2. Fixture providers must model counts, refusal cases and preparation failure, not just return success.

## Ownership and contracts

Own proposed files:

- `axbenchmark/engine/library/domain/library_rules.py`: name validation, duplicate verdict, default selection and deletion-plan rules.
- `axbenchmark/engine/library/application/queries.py`, `revision_commands.py`, `lineage_commands.py`, `default_selection.py`, `builtin_registration.py`, `verify_identity_job.py`, `command_transactions.py`.
- `axbenchmark/engine/library/adapters/rpc.py`, `composition.py`; update M01-owned declarations in `axbenchmark/api/templates.py`, `axbenchmark/api/registrations/templates.py` and `engine/library/ports.py`.
- `tests/library/test_library_queries.py`, `test_approval_commands.py`, `test_delete_commands.py`, `test_default_selection.py`, `test_templates_api.py`, `test_library_command_transactions.py`, `test_templates_events.py`.

M11 owns global composition/registry dispatch; this child supplies a registration function through that hook. M09 owns the builtin content adapter. Do not implement either in library code.

The parent's API tables are the exhaustive public contract: queries return DTOs, commands return committed outcomes or typed errors, verify returns `JobRef`. Safety classes and the common error envelope must agree through real RPC serialization. Every query captures a single publication view for all count/detail providers. Events enter the durable outbox only after publication, with transaction ids for deduplication.

M01 revision/duplicate approval inspects under the write lock, requires `inspected.version == base_version`, and uses that frozen payload and version for identity validation, `prepare_approved` and publication recheck. Preview returns `version`; stale approval is `planning.draft_conflict`. M01 prepares revision/optional config copies/draft marker and publishes once. M16 coordinates planned `ApproveDraft`, including provenance, through the same public transaction ports; registry invariants stay in M01, without private-store access or a second commit point. Identical user approval is refused, while identical package registration remains idempotent. Deletion is driven by `templates.get`'s `delete_effect` and `delete_plan_id`; `templates.delete(sha256, delete_plan_id)` rechecks active runs/results, current plan and transaction reservations. Changed plan means refresh/reconfirm, not silently deleting a newly changed set of configurations. Built-in/active/result refusals take precedence and change nothing. `cleanup_pending` reports a committed logical deletion with deferred physical cleanup.

**Frozen domain contract.** Extend RubricIndex.summary and templates.get rubric_summary with exact ref/version/digest, ordered categories/defaults/business key, comment semantics and frozen evidence-plan/required-modalities/coverage obligations. Approval uses the inspected draft version and real M12/M08 validators for the whole reference closure; unsupported required scope is a field/path issue before publication. Library queries remain model/device/check free.

**SQLite discovery admission.** RegisterBuiltins/default selection remains an operational initialization hook. Pure packaged-byte loading may run during discovery, but `database.path/info` on absent storage must not write the default pointer or initialize the shared SQLite marker via this hook. Before the first library/run/mutating request, M11 completes ordinary recovery/initialization and invokes registration once. Extend default-selection/API fixtures to discovery→first library request, preserving r1/r2 policy and hashes.

## Integrated requirements

R191 — [authoritative SQLite results and analyses](../RESULTS-DATABASE.md).
R184, R185, R186, R187, R188 — frozen domain profile/evidence contracts: [R184](../quality-judges/BACKEND.md); [R185](../quality-judges/MOBILE.md); [R186](../quality-judges/DEVOPS.md); [R187](../quality-judges/AGENTIC.md); [R188](../quality-judges/SPECIFICATION.md).

R177, R178, R180, R183 — [benchmark modes](../BENCHMARK-MODES.md).

Extend `templates.list/get/tasks` projections in `application/queries.py` and `api/templates.py` with descriptor format, benchmark/project type, derived target mode, legacy marker, ordered primary refs/count, derived whole-definition specification view, baseline counts/exclusions/provenance and frozen task-commit policy/check references. Read these from the approved M01 definition/M16 capture binding; clients never infer mode from task count or filesystem state. Task detail exposes exact bytes/ref and the common protocol instruction separately.

Creation capabilities distinguish manual authoring from optional planner generation and local execution. M01 preview/approval uses M16's same versioned frozen payload, including mandatory commit closure; no installed harness or Git is needed to author/approve. New launches of incompatible legacy definitions require an explicitly reviewed revision, without changing archive read/import or stored outcomes. Test all seven domain projections, no-harness manual flow, stale capture/approval, empty authored suites with protocol checks and preserved v1 labels/bytes through both clients.

## Acceptance and fault checks

**Domain acceptance:** Exercise all family summaries through both clients and approval transactions; a stale native matrix, agent evaluation authority or supplied brief edit rejects the preview without publishing any partial revision.

Run `pytest tests/library/test_library_queries.py tests/library/test_approval_commands.py tests/library/test_delete_commands.py tests/library/test_default_selection.py tests/library/test_templates_api.py tests/library/test_library_command_transactions.py tests/library/test_templates_events.py`:

1. Through `InProcessClient`, list a built-in, custom/imported revisions and fixture drafts; no supported harness leaves manual create/edit/capture/approve and stored configuration editing available, while model-dependent planning/execution are disabled. Unreadable index still shows built-ins with a typed notice. Every API in the parent's tables has DTO round-trip/error/safety coverage. Coverage round-trips through in-process/socket clients with M09’s 30 unique checks (6/4/5/2/6/4/3), phase counts 30 at-task/30 final (19 artifact/11 history), requirement/phases/observation-summary/evidence fields and empty `also_checked`. Never report 60 as suite size; another template derives its own counts.
2. Upgrade fixtures r1→r2 with zero results move the default; with retained results keep r1 and return changes/make-default action. A pinned builtin mismatch is never re-pinned/defaulted. Renaming a lineage preserves payload/identity; tombstoned labels are never reused.
3. Approval preview blocks equal identity and returns the inspected version. Edit after preview and again before publication: reject stale `base_version` without partial publication, preserve the open draft and require a new approval; distinct approval copies configs only on request. Assert `prepare_approved` receives the same inspected version. Inject failure in each participant including draft approval marking: neither a row, configuration nor approved-draft state becomes visible before the one marker. Lost response after publication/retry creates no duplicate revision.
4. Delete built-in, active-run, result-bearing and reserved revision fixtures: exact refusal code, zero writes; active-run details preserve `run_uid`, `run_label` and `origin` without a local run-id substitute. Confirm a deletable revision with two configs: publish tombstone/removal together, expose deleted lineage node and `not_found{deleted:true}`, leave all other records intact. Add a result or configuration between preview and delete: refusal or `delete_plan_changed`, no partial removal.
5. Capture a library query view, publish a result import between index/count reads, and prove the response is wholly before or after. Verify progress uses M11's actual job/event foundation; no staged registration event appears. Cancel verify without corrupting stored facts.

**Wireframes served:** Library loading/empty/error/no-harness/drafts/upgrade, Template tabs, ReviseActiveRun/ReviseConfirm/ReviseIdentical/RevisionSaved, and deletion confirmation/refusals. This child owns DTO/capability data only, no Textual screens.

**Real integration gate:** run the same cases against M02.2, M03.1, M07.1, M09.1, M16.3 and M17.2 providers; M11.3 must serialize launch with deletion and bind the approved identity. Check real M14 commands and event refresh after reconnect. These are post-child integrations and do not add cyclic entry dependencies.

**Pending parent obligations:** M01.4 screens and navigation; actual default inventory execution without a planner; real authoring/exchange and macOS/Linux restoration; M03 mode finding and M11 run invalidation integration.
