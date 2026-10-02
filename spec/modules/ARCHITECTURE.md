# Headless engine and interface architecture

Status: implementation contract, not a claim of implemented behavior. [SPEC.md](../SPEC.md) remains authoritative for product behavior; this document fixes how that behavior is structured in code. Every module's **Implementation** section and child implementation spec follows it. The shared contracts below resolve the cross-module findings in [recommendations.md](../recommendations.md); owners define their detailed schemas without changing these invariants.

## Decision

All benchmark logic and state live in a **headless engine**. The TUI and the CLI are clients of the engine's API and contain no domain logic; an MCP server is a planned third client and must need nothing beyond what the API already offers. A run, a planning session, an import or a report generation behaves identically whether it was started from the TUI, from the CLI, from an MCP tool call or by a script, and it keeps going when every client is gone.

Inside the engine, each module follows clean architecture adapted to Python: pure domain code at the centre, use cases around it, and every side effect (filesystem, subprocesses, harness CLIs, Playwright, sensors, the clock) behind a port that an adapter implements.

Consequences:

- No rule from a module contract is evaluated in an interface. Eligibility, validation, readiness, compatibility, scoring and lifecycle decisions come back from the engine as data; interfaces only present them.
- An interface never reads or writes `~/.axbenchmark/` directly. The engine is its only writer and reader.
- Anything a screen can do has an API method; anything the API exposes can be reached from the CLI.
- The standalone HTML report ([M13](13-standalone-html-report.md)) is an artifact the engine writes, not a client.

## Stack

| Concern | Choice |
|---|---|
| Language | Python ≥ 3.12, asyncio throughout the engine and clients. |
| API models | pydantic v2 models in `axbenchmark.api`; JSON Schema exported from them is the published contract. |
| Transport | JSON-RPC 2.0 over a Unix domain socket, newline-delimited JSON, at `~/.axbenchmark/run/engine.sock` (directory mode 0700, socket 0600). |
| Future MCP client | Official `mcp` Python SDK, stdio transport, tools generated from the API registry. |
| Engine process | `axbenchmarkd`, one per user, started on demand by any client (`axbenchmark.client.connect(autostart=True)`). |
| TUI | Textual, following the [wireframes](../design/wireframe-tui/navigation.md): screen classes, widget ids, TCSS and bindings named there are the target. |
| CLI | Typer. |
| Tests | pytest + pytest-asyncio; Textual `App.run_test()` / `Pilot` for screens; `import-linter` for layer rules. |

## Package layout

```
axbenchmark/
  api/             DTOs, method/event/topic registries, error codes. Depends on stdlib and pydantic only.
  engine/
    <module>/      one package per module (see Ownership), each with the four layers below.
    shared/        cross-module domain types (ids, SHA-256 identity, money, durations, clock port).
    daemon/        composition root, socket server, sessions, job and run supervision.
  client/          EngineClient (socket) and InProcessClient (tests, embedding). Same Protocol. Owned by M11.
  launcher.py      Client composition root: the `axbenchmark` console script; binds the CLI's TuiLauncher to tui (M14).
  tui/             Textual App, screens/, widgets/, viewmodels/.
  cli/             Typer app; one command module per command group.
  mcp/             (future) MCP server exposing registry methods as tools; a client like tui and cli.
```

### Layers inside an engine module

| Layer | Path | Contains | May import |
|---|---|---|---|
| Domain | `engine/<module>/domain/` | Entities and value objects as `@dataclass(frozen=True, slots=True)`, enums, pure rules and calculations, domain errors. No I/O, no asyncio, no pydantic. | stdlib, `engine/shared/domain`, another module's `domain` only for a vocabulary that module owns and the importing module's Implementation section names (for example M08's check outcome in M02, M18's collector cause in M03, M01's `RelPath` in M17) |
| Ports | `engine/<module>/ports.py` | `typing.Protocol` interfaces for every side effect: repositories, process runners, harness adapters, browsers, sensors, clock, id generator. | domain |
| Application | `engine/<module>/application/` | One use-case class per command, query or job (`LaunchRun`, `ListTemplates`), taking ports in `__init__`. Orchestrates domain rules; emits domain events through an `EventPublisher` port. | domain, ports, other modules' application *interfaces* (Protocols), never their adapters |
| Adapters | `engine/<module>/adapters/` | Port implementations: filesystem/YAML repositories, subprocess and harness CLIs, Playwright, psutil, vendor tools; plus `rpc.py`, which maps API DTOs to use-case inputs and domain results/errors back to DTOs. | everything above, third-party libraries, `api` |

Dependencies point inward only. Domain objects never cross the API; `adapters/rpc.py` is the only place DTOs and domain types meet. Wiring happens once, in `engine/daemon/composition.py`, by constructor injection (no service locator, no DI framework). Tests replace adapters with in-memory fakes of the same Protocols.

Layer rules, enforced by `import-linter` contracts checked in the test suite:

- `tui`, `cli` and `mcp` import only `api` and `client`. `client` imports only `api`. `api` imports nothing from the other packages. `launcher` imports `cli` and `tui` and nothing from `engine`.
- `engine` never imports `tui`, `cli`, `mcp` or `client`.
- In every engine module, `domain` → `ports` → `application` → `adapters` is a layered contract: no inner layer imports an outer one, and only `adapters` import third-party I/O libraries or `api`.
- Modules talk to each other through application-layer Protocols or events, never by reaching into another module's adapters or persisted files.

## Shared identity and addressing

These types are defined in `engine/shared/domain` with corresponding wire models in `api.common`; adapters perform the mapping. Field names have the same meaning in APIs, retained records, evidence paths, ZIPs and reports. **F02, F06**

| Type | Contract |
|---|---|
| `RunUid` | Immutable UUID generated once by the engine at launch, serialized as a lowercase hyphenated UUID string. Use UUID4 generation through `IdGenerator`. This is the primary run key and the directory key `runs/<run_uid>/`; import preserves it. It is independent of machine identity, launch date, display name and configuration id. |
| `RunLabel` | Human label `YYYY-MM-DD-<suffix>` allocated locally (`a`…`z`, then `aa`…). Retained as `run_label` with origin information, never a grouping or foreign key. A local CLI may resolve a label only when exactly one visible run matches; otherwise return `runs.ambiguous_run` with candidate UIDs and origins. API requests use `run_uid`. |
| `ConfigurationId` | Stable competitor entry id within a frozen run. A configuration subject or trial group is keyed by `(run_uid, configuration_id)`, never by the configuration id alone. |
| `TrialRef` | `{run_uid, configuration_id, trial_index}` with a 1-based `trial_index`. `trial_count` is carried by the frozen launch/result context and validates the index; it is not part of identity. One `ResultId` binds permanently to one `TrialRef`. |
| `ResultId` | Globally unique immutable result identifier generated at launch, preserved through import and re-export. Resolving it returns its explicit `TrialRef`; it never means the newest trial. |

Stored task/check/measurement records and telemetry windows carry `TrialRef`; task-specific records additionally carry `task_id` and, where relevant, the verification phase. Evidence allocation and historical logs require this full scope or a resolved `ResultId`. Only a live view may request the currently active trial; its response still returns the resolved `TrialRef`. Two imported runs with the same label and configuration ids remain distinct in means, filters, reports and exports. M02/M17 reject an incoming UID that conflicts with an existing run's immutable launch binding instead of silently combining runs. No wire field named `run_id` may ambiguously mean a label in one module and a UID in another.

## Canonical template boundary

[M01](01-template-library-identity.md) owns the versioned `metadata.json` schema (`axbenchmark-definition/1`), its canonical writer and reader, and the manifest writer. [M09](09-default-inventory-benchmark.md)'s authoring YAML and [M16](16-custom-template-planning.md)'s drafts are inputs to that writer; neither hashes or serializes a competing descriptor. [M17](17-zip-exchange.md) validates and preserves the resulting bytes. **F01, F10**

- The defining descriptor contains project type, ordered task ids with prompt/check references, specification, execution protocol, services, rubric, dependencies and an explicit baseline declaration. An empty baseline is represented as an empty list, not an omitted or inferred field. All referenced defining files must exist and have a declared payload role. M01 fixes the exact schema and reference validation.
- The writer emits UTF-8 JSON with sorted keys, compact separators, `ensure_ascii=False`, no non-finite numbers and one trailing LF; semantic arrays such as task order retain their order. Defining text files retain their supplied bytes. The manifest hashes every defining payload file, including `metadata.json`, and is sorted by normalized path bytes. There is no separately supplied definition allowed to disagree with the descriptor bytes. Imports reject a noncanonical descriptor or a descriptor/manifest mismatch rather than rewrite it under its declared hash.
- Display names, descriptions used only for navigation, lineage/revision labels and authoring-only files live outside the defining payload. Renaming changes no defining bytes. Task order, protocol or semantic baseline-mode changes do change the hash.
- Each baseline-file descriptor includes `path` and `executable: bool`; this semantic flag is hashed through `metadata.json`. Physical modes and ZIP permission bits remain excluded from the manifest. Approved storage uses files `0444` and directories `0555`, including executable baseline files; workspace restoration uses files `0644` or `0755` according to the semantic flag and directories `0755`. Neither ZIP extraction permissions nor approved-storage modes determine executable intent. Symlinks and unsupported file kinds are rejected by the baseline contract.

Required conformance fixtures cover the same built-in, planned and imported definition; display rename; task reorder; empty baseline; equal file bytes with different executable flags; and macOS/Linux ZIP round trips. All producers call M01's writer before calculating identity.

## API shape

Every method is named `<namespace>.<name>`, where the name is a snake_case verb or noun phrase, optionally qualified by its subject (`templates.list`, `harness.task.log`, `verification.regression.get`), and belongs to exactly one module (see Ownership). Modules also offer in-engine application interfaces (Protocols) to each other; those are not API methods and are listed in the owner's Implementation section. There are four kinds:

| Kind | Contract |
|---|---|
| Query | Read-only and idempotent. Returns a pydantic model. Example: `templates.list`, `runs.status`. |
| Command | Validates and mutates. Returns the resulting model or a typed error; never partially applies. Example: `configs.save`, `runs.stop`. |
| Job | A long operation (planning, import, report generation, model refresh, environment recheck). The call returns a `JobRef` at once; progress arrives as `job.progress` / `job.finished` events, and `jobs.get` / `jobs.cancel` work for any job. A job outlives the client that started it. |
| Subscription | `events.subscribe(topics, cursor?: EventCursor)` returns the snapshot/replay handoff defined below, then streams events. `EventCursor = {epoch: str, seq: int}` is indivisible; clients never resume with a bare sequence number. This is how attach, detach and reconnect work, for TUI and CLI alike. |

Event names and topic patterns are separate registries in `axbenchmark.api`, assembled and validated by M11. Names are exact registered strings, commonly `<namespace>.<noun>.<past-tense verb>` (for example `catalog.refresh.finished`), with registered shorter forms such as `job.progress` and `job.finished`. M11 uses singular event prefixes `run.`, `job.` and `engine.`. There are no `runs.*` or `jobs.*` events and no bare `job` topic. **F05**

Each event registration declares its owner, payload model, object revision/upsert semantics, allowed topic patterns and whether it is coalescible. Each topic registration declares its owner, key schema, snapshot model/provider and routed event names. M11 owns `run:<run_uid>`, `run:<run_uid>/<configuration_id>`, `live:<run_uid>/<configuration_id>`, `job:<job_id>`, `runs`, `jobs` and `engine`; other modules register their documented bare namespace topic. A bare topic without a snapshot is explicitly event-only: screens load its query projection and re-query on resync. Consumers declare names against this registry; startup/schema tests reject unknown publishers, routes and consumers. M10 consumes `run.phase.started`, `run.phase.finished` and `run.state.changed`; M16 planning progress subscribes to `planning` and `job:<job_id>`. Registering a method does not implicitly register a similarly spelled event or topic.

### Error envelope

The JSON-RPC outer `error.code` is an integer. Application failures use `-32000`, with the stable namespaced code in `error.data.code`; clients decode that into `EngineError(code, message, field, remedy, data)`. For example:

```json
{"jsonrpc":"2.0","id":7,"error":{"code":-32000,"message":"Ranking weights must have a positive total.","data":{"code":"scoring.invalid_weights","field":"ranking_weights","remedy":"Set at least one weight above zero and retry."}}}
```

Protocol failures retain their JSON-RPC codes (`-32700` parse, `-32600` invalid request, `-32601` method not found, `-32602` invalid parameters, `-32603` internal error). A protocol-level example is:

```json
{"jsonrpc":"2.0","id":null,"error":{"code":-32700,"message":"Parse error"}}
```

These integer codes and the optional `data` field follow the [JSON-RPC 2.0 error contract](https://www.jsonrpc.org/specification#error_object). `-32602` covers an undecodable request-model shape; a decoded request rejected by a domain rule uses its typed application error. Clients expose protocol failures separately as `ProtocolError(rpc_code, message, data)`. Both socket and in-process clients use the same request/response serialization, validation and application-error decoder. CLI and TUI show the same message, field and remedy without parsing prose; invalid input is never silently replaced. **F18**

### Subscription handoff and replay

M11 owns the following algorithm; all topic providers and both clients use it. A cursor is scoped to one engine epoch and one unchanged topic set. Each snapshot object and state-changing event carries a stable `object_key` plus a monotonically increasing `revision` within the epoch. Deletions carry revisioned tombstones. Append-only entries have stable entry ids and are deduplicated by those ids. An object exposed on several topics uses the same key/revision everywhere. **F04**

1. Under the shared state-publication boundary, register the subscriber queue and capture `S = EventCursor(current_epoch, current_seq)` atomically. Every committed projection change and its revisioned event enter this same boundary, so a snapshot cannot observe an unpublished version. Release the boundary before reading topic snapshots.
2. Read all snapshots after S. Each provider returns an atomic view of its own objects; different topics need not be read at one instant. Keep every queued event with `seq > S.seq`, even if a snapshot already contains its effects. Return the snapshots and **S**, not the sequence at the end of snapshot collection.
3. Deliver the queued events greater than S in sequence order, then continue live delivery. Clients apply an upsert/tombstone only when its revision is newer than the retained revision for that object; equal/older revisions cannot replace newer snapshot data. Advance the subscription cursor for every processed envelope even if its object update is skipped. Preserve tombstone revisions for that subscription generation.
4. A reconnect can replay only when the epoch matches, the topic set is unchanged, the client retained its projection, and the replay window fully covers the cursor. Otherwise perform steps 1–3 and return `mode: snapshot` with a reason (`initial`, `epoch_changed`, `compacted`, `overflow`, `topics_changed` or `invalid_cursor`). A future/out-of-range cursor also forces a snapshot. `mode: replay` keeps the client's projection and revision map. A snapshot or `events.subscription.resynced` replaces the topic projection and clears old deduplication/revision state before installing its objects, including on a same-epoch resync.
5. Overflow abandons the old subscription generation and performs the same handoff again. The replacement includes a new `subscription_id`; clients ignore old-generation deliveries. Control delivery is ordered so no new-generation event is applied before its replacement snapshot. No slow client blocks a publisher.

`Subscription` carries `{subscription_id, cursor: EventCursor, mode: snapshot | replay, reason?, snapshots}`; `EventEnvelope` carries `{subscription_id, cursor: EventCursor, at, name, topic_keys, changes, payload}` on the wire, where `changes` supplies the revisioned state operations described by the event registration. `events.subscription.resynced` carries a full replacement `Subscription`. Resume uses the last fully applied cursor, never a cursor taken from the newest object in a snapshot. Coalescing is allowed only for registered replaceable observations and retains the newest object revision; transitions, retained facts, logs and job outcomes are never coalesced. Gaps in global sequence numbers alone do not imply loss because subscriptions filter topics.

The UI subscription stream is observational. Required persistence/accounting consumers use awaited application calls or an acknowledged durable observation stream; they cannot depend on a lossy client queue. Verification must inject an event between two snapshots, replay a snapshot-covered older event, delete/recreate an object, restart at a lower sequence, compact the replay window and overflow a queue.

Capabilities: queries that back a screen return the actions currently allowed as fields named `can_<action>`, each an `ActionState {enabled, reason}` from `axbenchmark.api.common` where `reason` is an error or reason code (for example `can_launch: {enabled: false, reason: "environment.no_harness"}`). Interfaces dim or enable bindings from these flags and never compute them; in Textual, `check_action` returns `None` to dim a binding (`False` would hide it).

Registry metadata: each method is registered with its kind, request and response models, a one-line description, and a safety class (`read`, `write`, `destructive`, e.g. `runs.stop`). The CLI help, the JSON Schema export and the future MCP tool list are all generated from this registry, so adding a method never requires interface-specific plumbing beyond presentation.

`engine.hello` negotiates `api_version` (semver). A client refuses to talk to an engine with a different major version and tells the user how to restart the engine.

## Engine process lifecycle

- `axbenchmarkd` holds every active run, job and subscription. Runs execute in supervised child process groups owned by the engine ([M05](05-harness-execution-isolation.md), [M11](11-run-orchestration.md)); no run is a child of a client.
- Closing a client, killing a terminal or losing the socket only drops that client's subscriptions. Only explicit stop methods end work: `runs.stop` for runs (including their judging), `judging.stop` for a judging batch, `jobs.cancel` for a job.
- The engine exits on its own only when it has no active runs, jobs or clients for an idle period (default 10 minutes). `axbenchmark engine stop` refuses while runs are active unless they are stopped first.
- On start, the engine reconciles persisted run state ([M02](02-retained-results-comparability.md), [M11](11-run-orchestration.md)): a run whose engine died is recorded as actually interrupted, never resumed silently.
- `axbenchmark run --config … --no-tui` submits the run, streams events as plain progress, and on Ctrl-C detaches (printing the `--attach` and `stop` commands) rather than stopping.

### Finalization and immutable retention

M11 supervises this awaited barrier for each run. A completion event, result export or report must never race pending writes. M02 is the authoritative retained-fact store; M10's working state cannot be the only copy of measurements later used by a report or ZIP. **F03, F06**

1. Finish or cancel every task and verification operation, wait for process-output draining and evidence persistence, and finish the last task's identity check and final-regression identity check. Stop paths record not-run/interrupted outcomes without inventing measurements.
2. Await `MeasurementFinalizer.drain_run(run_uid)` (M10), which acknowledges all accepted usage, task, check and execution-phase observations. It must not depend on a future `run.state.changed(ended)` event.
3. Await `ExperimentTelemetry.close(run_uid)` (M18). Its idempotent close flushes samples, fixes the last covered instant and per-trial execution windows, retains hardware evidence through M02 and returns M18's exact published `TelemetryFinalizationReceipt`. A recovered run uses persisted samples/gaps only; gaps stay partial and collection never resumes for that run.
4. Await `MeasurementFinalizer.finalize_run(run_uid, telemetry_receipt, terminal_cause)` (M10). It drains any remaining accepted observations, computes each `TrialRef`'s final accounting, energy and coverage using frozen billing/pricing/rates, and appends all measurement and source evidence through M02, retaining M18's receipt unchanged in its energy evidence. Return M02's `MeasurementFinalizationReceipt` only after those writes are durable. The finalizer is idempotent for the same inputs; conflicting repeated finalization is an error, never an overwrite.
5. M02 seals each result only against that receipt and its completed evidence/hardware writes. Sealing freezes execution facts, including partial/unknown values and interrupted outcomes; there are no later measurement appends. Persist progress so recovery can finish a partially completed multi-result seal without repeating work or exposing unfinished results as exportable.
6. Check identity again before starting judging. Await M12's durable original-review settlement for every expected result, including failed, skipped or cancelled dispositions with reasons and separately appended judging costs. Record judging duration in append-only run lifecycle data, separate from sealed competitor execution measurements.
7. Await `ResultRecorder.finish_run_retention` (M02), which validates all execution seals/receipts and original-review dispositions before export readiness. Only then publish the run's terminal state and invoke M13 completion-report handling, including explicit skipped reasons for ineligible runs. Report settlement is separate from retained execution; a report failure cannot retract retention readiness or change the terminal run outcome, and a typed report-persistence error reaches waiters instead of hanging.

The same barrier applies to run stop, configuration stop once the remaining configurations finish, template invalidation, engine shutdown and startup recovery. It retains partial evidence before sealing and never marks absent data complete. Every retry preserves the original checkpoint's selected results, observation cutoff/input digest, telemetry receipt, operation IDs and terminal cause; a later stop/engine loss/invalidation is append-only lifecycle/terminal-retention evidence, not changed finalizer input. Already sealed results keep their existing finalization receipt and skip fact-writing/sealing steps. A stop during judging cancels the batch, retains completed reviews, records remaining reviews as not judged and ends the run as stopped only after settlement and `finish_run_retention`; it does not reopen sealed facts. A storage/finalization failure leaves the run `retention_pending` with a typed error and readiness false. Detach has no effect on this sequence.

Run-level `can_stop` is enabled after launch binding while active (including preparing/executing/verifying), `finalizing`, `retention_pending` or `judging`, and disabled once terminal; before binding, cancellation uses the launch job. A repeated pending stop returns its existing receipt. Configuration-level `can_stop` is enabled only for a queued, preparing, running or verifying configuration. A completed configuration cannot be separately stopped during run-level judging. M11 supplies these distinct gates to both interfaces. **F13**

### Identity invalidation after launch

M11 owns one `RunInvalidationCoordinator.invalidate(run_uid, identity_check, detected_at, source)` application operation. Any mismatch detected by M01, M05, M08 or M12 while serving a run propagates to it; callers must not turn `IdentityMismatch` into an ordinary failed/unverified check or an invalid judge response. It is checked before tasks, after the last task, around final verification, before finalization and before judging; a mismatch detected inside a later read takes the same route. **F09**

The coordinator durably registers M02's first `RunInvalidation` (run/record identities, approved and computed hashes, changed paths, detection time/source), closes further work admission and schedules independent supervisor cleanup. `invalidate` returns that durable registration; duplicate calls return the same record without erasing evidence or scheduling duplicate cleanup. The originating M08/M12 worker can then unwind before the supervisor joins it; the registration call never waits for its own caller's cleanup. The supervisor cancels remaining task/check/judge work, awaits cleanup and the partial-data barrier for unsealed results, settles original reviews and retention, and ends the run interrupted with reason `runs.template_identity_invalidated`. M11 serializes invalidation, stop, judge admission and terminal publication through its lifecycle lock.

Invalidation is an append-only run record applying to **every** associated result, including already sealed results and completed reviews. It leaves their original template binding and sealed execution facts intact; result queries expose the original status plus an effective interrupted/non-comparable status. All comparison entry points (M02, M06, M13) consult this record, so no trial from the invalidated run can remain eligible. M17 carries it on export/import and preserves its idempotent identity. Sealed results therefore accept append-only reviews and run-invalidation associations, but never rewritten execution facts. After a crash, recovery consults the persisted invalidation before admitting reads or resuming cleanup.

## Atomic publication across repositories

M17 coordinates imports spanning M01 and M02 through a shared `PublicationTransactions` port wired by the daemon; each repository owns its own data operations. M01 coordinates revision/duplicate approval, including M07 configuration copies when explicitly selected and M16 draft approval/provenance; M16 coordinates planned-template approval through the same public participant ports. Each command has one coordinator and one durable publication marker as its visibility boundary, not individual repository commits. The import sequence below also governs these approval transactions with their own participants. **F14**

1. Validate and stage the complete package, allocate `transaction_id`, and persist a journal listing the intended registrations and their immutable digests.
2. Under the shared mutation/publication write lock, reclassify collisions, then prepare each registration tagged with that transaction. Participants durably store exact registration tokens and `created: true | false` before returning. A same-transaction/same-intent retry returns its original tokens/created flags, including after a crash before the coordinator journaled them; prepared creations never become pre-existing records on retry, and changed intent fails. Every new registration/overlay remains invisible until publication; pre-existing records stay visible.
3. After every participant and the journal are durable, atomically publish the transaction marker. This is the single commit point. Only then emit change events and report success. A query captures one published-transaction view for all repositories it reads, so a response sees the previous collection or the entire published collection. Launch, export and delete use that same visibility rule and cannot act on staged records by a guessed id.
4. Startup recovery runs before API readers are admitted: an unpublished transaction rolls back only registrations/overlays it created, while a published one rolls forward remaining cleanup/events. A published transaction is never withdrawn because the client disconnected or lost its response. A new transaction retry reclassifies against published state and is idempotent; a retry within the same prepared transaction returns the original participant receipts from step 2. Failed rollback remains hidden and blocks recovery completion rather than exposing half an import.

Unpublished registration tokens protect pre-existing records from rollback and from concurrent destructive operations until the transaction resolves. Repository bypasses, an early M01 index publication, or checking visibility separately halfway through one cross-store query violate this contract. Owners expose prepare/commit-view/rollback ports; `commit_view` asserts participant readiness and never publishes independently. M17 owns import journal/recovery orchestration; M01/M16 own their approval coordination using the shared transaction service. No coordinator reads another owner's private adapter/store.

## Accounting and presentation ownership

[M10](10-measurements-cost.md) is the sole owner of usage folds, cost basis, frozen-rate conversions, energy pricing, trial cost/time means and presentation amounts. [M06](06-scoring-rankings.md) owns eligibility and exact scoring; M13's offline scorer must pass the same conformance vectors. These shared rules must be propagated through their detailed contracts rather than reimplemented in clients. **F07, F08, F12, F19**

- `per_usd` always means **currency units per 1 USD** and must be positive. For COP `4000`, 4000 COP converts to 1 USD by division and 1 USD to 4000 COP by multiplication. Catalog editors, CLI inputs, frozen DTOs and ZIPs use these units; a reciprocal is only an explicitly labelled read-only explanation.
- Ranking calculation amounts are USD. A run's display currency and rates are frozen at launch. Same-currency views use each source run's own frozen rate; a view spanning different frozen display currencies uses USD and an engine-produced notice. Missing rates remain unknown. Cost DTOs carry calculation amount, engine-produced display amount/currency, rate source/date, basis, coverage, limitations and declared-billing labels through ranking rows, breakdowns and shortlists. Clients neither convert nor infer a currency from `$`.
- Unknown billing preserves any valid positive reported/estimated aggregate with its limitation. A numeric zero estimate or other unverified zero remains an observation with its original basis; it is never relabelled `VERIFIED_ZERO`. M06 excludes it from positive-cost-weight and lowest-cost eligibility with `cost_zero_unverified`, and never divides by it. A zero-cost-weight ranking may admit it subject to the other gates. SPEC, M06 and M10 document this edge-case policy; existing verified-zero and guarded zero-time rules remain in force.
- M18 distinguishes counter resets from wraps using continuity/reset evidence, timestamps, collector semantics and plausible bounds. A known range alone cannot establish a wrap. Ambiguous decreases/gaps leave uncovered intervals. Duplicate sources for the same physical domain are resolved by M18's explicit source precedence before parent/subdomain overlap removal. M10 preserves the resulting coverage instead of fabricating complete energy.

## Executable foundations and child-spec boundaries

The [development sequence](DEVELOPMENT-SEQUENCE.md) orders implementation children, not whole parent modules. A published Protocol is available for fixtures before its producer is implemented; this does not satisfy real-provider integration. All parents retain their product ownership and final integration gate. **F15**

| Gate / child | Required deliverable before consumers proceed | Dependency |
|---|---|---|
| Bootstrap | Importable package/test layout; shared ids/value objects; DTOs and application Protocols for identity, checks, judging, measurements and retention; M11-owned `client/protocol.py` publishes `EngineClient`, and `api/events.py` publishes cursor/subscription/event contracts with the API registry contracts before runtime implementations; error envelope; deterministic fixture builders; enforced import boundaries. A smoke test imports the contract packages without launching an interface or a real provider. | Reconciled parent/shared contracts only. Bootstrap must not import feature adapters. |
| M11.1 `engine-client-api` | Runnable composition seam and method dispatch; handshake, Unix socket and permissions; socket and in-process clients; DTO/error round trips with injected fixture use cases. | Bootstrap. No scheduler, harness, telemetry or complete feature service is required. |
| M11.2 `events-jobs-lifecycle` | Registered events/topics, revisioned snapshot/replay/resync; job execution/cancellation; connection/autostart/idle lifecycle with fixture work. | M11.1. Run scheduling and real provider cleanup belong to later M11 children. |
| M15.1 `tui-foundation` | Shared widgets, theme, screen/modal bases, pure view-model helpers, presentation-only `RunListDetail`/VM, fake client implementing Bootstrap's exact M11 `EngineClient` Protocol and wide/compact test harness. | Bootstrap API/client contracts. No feature screen or runtime client is required. |
| M15.2 `tui-shell` | Connection/subscription manager using typed cursors, navigation, palette, focus, and loading/empty/error/content lifecycle using fixture screens. | M15.1 and M11.1–M11.2. |

An early M01/M03 service must be testable through the real `InProcessClient` once M11.1–M11.2 are complete; an early feature screen must use M15.1–M15.2 for fake-client tests. The feature owner implements its screens. M11.5 consumes M15.1's `RunListDetail` and maps its presentation messages into run actions; M15.3 later verifies that real composition and cross-module workflows, so M11.5 never depends on M15.3. Bootstrap and foundation acceptance do not claim any harness, collector or benchmark works.

Children live under `modules/implementation/MNN/NN-slug.md` and are linked from their parent. Each names requirements/finding resolutions, exact implementation ownership, interfaces, completed prerequisites, injected-but-not-yet-implemented provider contracts, wireframe states, runnable acceptance checks and parent obligations still pending. The dependency graph must remain acyclic: later services are injected through published Protocols until their separately named integration gate. Parent completion requires all children and the real-provider/integration gates, with unsupported hardware or unavailable provider verification stated explicitly.

## Interface rules

TUI screens:

- Each screen has a view model in `tui/viewmodels/`: a plain dataclass built by a pure function from API models. View models are unit-tested without Textual.
- Data loads in a Textual worker calling the client; results populate the screen's `ContentSwitcher` states (`#x`, `#x-loading`, `#x-empty`, `#x-error`) from the wireframe design system.
- Live data comes only from subscriptions. A screen subscribes on mount and unsubscribes on unmount; leaving a screen never sends a command.
- Every action handler issues exactly one API call (command or job) and renders its result or error.

CLI commands:

- Each command maps to one API method (or a job plus its event stream). Human output is the default; `--json` prints the API response or event stream as JSON lines.
- Exit codes: 0 success (including a followed run that completed with failed or unverified tasks; scripts read task outcomes from `status --json`), 1 operation failed (typed error, including a rejected package, an unknown id or an incomplete configuration, and a followed run that ended stopped or interrupted), 2 invalid usage, 3 engine unreachable or incompatible.

## Ownership of API namespaces

| Module | Engine package | API namespace | Interfaces |
|---|---|---|---|
| [M01](01-template-library-identity.md) | `engine.library` | `templates.*` | Library, Template screens |
| [M02](02-retained-results-comparability.md) | `engine.results` | `results.*` | Results screens |
| [M03](03-environment-readiness.md) | `engine.readiness` | `environment.*` | Environment screen, `doctor` |
| [M04](04-model-catalog.md) | `engine.catalog` | `catalog.*` | Catalog, model picker, `models refresh` |
| [M05](05-harness-execution-isolation.md) | `engine.harness` | `harness.*` (adapters, isolation, live task stream) | Run isolation, live view sources |
| [M06](06-scoring-rankings.md) | `engine.scoring` | `scoring.*` | Rankings, weights editor |
| [M07](07-run-configuration.md) | `engine.configs` | `configs.*` | Setup, launch review |
| [M08](08-verification-evidence.md) | `engine.verification` | `verification.*` | Checks, evidence, screenshots |
| [M09](09-default-inventory-benchmark.md) | `engine.library.builtin` | none (registered through `templates.*`) | Inventory screens |
| [M10](10-measurements-cost.md) | `engine.measurements` | `measurements.*` | Measurement panels |
| [M11](11-run-orchestration.md) | `engine.runs` + `engine.daemon`, and `client` | `runs.*`, `events.*`, `jobs.*`, `engine.*` (events `run.*`, `job.*`, `engine.*`) | Run overview, live view, stop, attach |
| [M12](12-quality-judging.md) | `engine.judging` | `judging.*` | Judging screens, rejudge |
| [M13](13-standalone-html-report.md) | `engine.reports` | `reports.*` | Report generation, `report` |
| [M14](14-command-line-interface.md) | `cli`, `launcher.py` | none (client) | All CLI commands |
| [M15](15-terminal-interface.md) | `tui` | none (client) | App shell, navigation, shared widgets, global palette and showcase |
| [M16](16-custom-template-planning.md) | `engine.planning` | `planning.*` | Planning screens |
| [M17](17-zip-exchange.md) | `engine.exchange` | `exchange.*` | All template/result ZIP dialogs, exchange view models/widgets and ZIP commands |
| [M18](18-hardware-monitoring.md) | `engine.telemetry` | `telemetry.*` | Telemetry panels |

A module that needs another module's data calls that module's namespace; it does not add methods to it. Missing methods are listed in the module's "Requires from other modules" table and reconciled in the owner's spec.

M17 owns the complete ZIP interaction in `tui/screens/exchange.py`, `tui/viewmodels/exchange.py` and its ZIP-picker/validation-order widgets. M01/M02 own only Library/Results entry actions through injected M17 factories, never duplicate dialog fragments or exchange view models. M15 owns the global command palette, Help and shared-widget showcase; feature owners contribute their registered actions and fixtures. Feature screen ownership remains with its module when another module opens it.

## Implementation section template

Each module spec ends with `## Implementation`, containing:

1. **Engine component**: package, and per layer: domain types and rules, ports, use cases, adapters; plus persisted state and the processes it owns.
2. **API surface**: tables of queries, commands, jobs and events in its namespace, giving request fields, response model, errors and capability flags.
3. **Requires from other modules**: the methods and events it consumes, by name.
4. **Screens**: for each wireframe artboard the module owns, the Textual screen class and file, its view model, the calls that load it, its subscriptions, and each binding with the API call it issues and the states it shows. Modules without screens say which screens consume them.
5. **CLI**: the commands that reach this module and their API methods.
6. **Headless verification**: domain unit tests, use-case tests with fake ports, API tests through `InProcessClient` with no interface attached, and screen tests against a fake client.
