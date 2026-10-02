# M14.1 — registry-cli

Parent: [M14 CLI implementation](../../14-command-line-interface.md#implementation). Requirements: R048, R054, R060, R134, R137, R138, R150, R156, R157. Findings: F02, F04, F06, F15, F18, F19; consume F03/F13 owner contracts.

Outcome: an executable CLI composition and registry surface with generated help/JSON, typed errors, destructive consent and a shared job follower. Curated lifecycle behavior belongs to M14.2.

## Entry conditions

**Completed implementation prerequisites:** [M11.1 engine-client-api](../M11/01-engine-client-api.md) and [M11.2 events-jobs-lifecycle](../M11/02-events-jobs-lifecycle.md), including real socket/in-process clients, registry, jobs and snapshot/replay.

**Bootstrap-published contracts, injectable as fakes:** shared RunUid/TrialRef/DTO/error/cursor definitions, module method/CLI hints, TuiLauncher, feature use cases and report-owner status recovery. Follow the [foundation boundary](../../ARCHITECTURE.md#executable-foundations-and-child-spec-boundaries); loading a contract cannot instantiate feature adapters.

No completed scheduler, TUI feature screen, catalog provider or report renderer is required here. Fixture registrations exercise real dispatch/transport; their success does not establish those feature integrations.

## Exact proposed ownership

- `axbenchmark/cli/app.py`, `registry_commands.py`, `output.py`, `consent.py`, `interrupts.py`, `ports.py`; `axbenchmark/launcher.py` injection/composition seam and console entry registration.
- `axbenchmark/cli/interactions/call_method.py`, `engine.py`, `streams.py`: generic call/job follower and pure subscription reducer; M14.2 adds run/stop/report-specific following in the same streams file.
- `axbenchmark/cli/presenters/generic.py`, `engine.py`; `axbenchmark/cli/commands/api.py`, `engine.py` and generated namespace composition.
- `axbenchmark/cli/json_models.py`: client output wrappers referencing shared API DTOs; do not redefine EngineError, EventEnvelope, Subscription or feature schemas.
- `tests/cli/test_registry.py`, `test_help.py`, `test_inputs.py`, `test_output.py`, `test_errors.py`, `test_streams.py`, `test_launcher.py`, `test_imports.py`.
- `tests/integration/test_cli_registry_socket.py`; `tests/cli/fixtures/registry.py`, `tests/cli/fixtures/help/` and schema-valid event/error fixtures.

Coordinate additive registry metadata requests with each API owner. Do not edit engine use cases, persistence, safety rules, shared transport or TUI navigation in this child.

## Public and internal interfaces

Use M11 `connect(autostart=True)`, EngineClient.call/subscribe/close and the published local registry. Engine status alone uses autostart=False. Engine major/protocol mismatch and transport failure exit 3; keep ProtocolError separate from EngineError.

Implement parent Output/Line, Interrupts, Consent and TuiLauncher.__call__(*, attach: RunUid | None) -> int, matching M15 main(*, attach: RunUid | None) -> int. Launcher alone imports both CLI/TUI; a fake launcher proves dispatch here. Nonterminal bare/attach invocation exits 2 before any call, naming run --no-tui and status.

Application wire errors have numeric outer -32000 and stable namespaced data.code. Socket and in-process decode identical code/message/field/remedy/details. Render these fields verbatim; no substring/prose classification. Protocol errors preserve their numeric rpc_code in the separate protocol_error JSON wrapper.

Root/generated help derives descriptions, positional hints, safety and schemas from the API registry. Curated paths reserve precedence; every method still works through api call METHOD. api list filters namespaces; api schema prints request/response schemas.

Scalar/enum/path/boolean fields become typed options; owner positional/cli_name hints define aliases. Complex unions and owner-specific flat syntax require published mappings or whole-request --params JSON/--params-file PATH, never guessed defaults or private method aliases.

Whole-request modes are mutually exclusive with one another and field inputs. Malformed input, missing required arguments, unknown options and locally invalid request shape exit 2 before connection. --params-file is the explicit client JSON-file read exception; private engine-state access remains forbidden.

Every generated or api call destructive method requires --yes; absent acknowledgement exits 2 with zero requests, without prompting. The later curated stop RUN_REF is the explicit-consent exception; jobs.cancel retains its published write safety without a new --yes guard. Generic verification must still supply the API's consent field; a safety flag cannot invent model-call consent.

Queries/commands print their response DTO. Jobs use shared follow_job; deliver optional JobStatus.initial_progress to the command interaction before settling an already-finished snapshot. Preserve this write-once preparation separately from latest progress; jobs.get/job snapshots retain it after finish/cache expiry/restart. JSON lines expose full EventEnvelope/Subscription including epoch+seq, generation and revision operations, followed by result/error; publish wrapper schemas and validate every emitted line.

Human output pairs glyphs with words and disables color for non-TTY/NO_COLOR. JSON stdout never contains human progress. Only doctor verification may prompt on stderr/read stdin; this child supplies the port/adapter, not the command policy.

## Streams and scope

Subscribe with EventCursor {epoch, seq}; save the last fully processed cursor even for skipped old object revisions. Apply newer keyed revisions/tombstones and stable append-entry IDs. A snapshot/resync replaces projection/dedup state and subscription generation; replay retains them. Ignore obsolete deliveries.

Reconnect once on a dropped socket with the unchanged topic set and retained projection; second failure exits 3. New epoch, compaction, overflow or changed topics replaces state through M11 snapshots. Never resend the job/command because a stream reconnects.

Event-only topic resync re-queries its owner. The follower exposes a typed owner-recovery seam for report status when generic job cache expires; M14.2 supplies reports.status behavior. Unknown generic jobs surface their typed error rather than waiting forever.

SIGINT sets detach, unsubscribes and exits 0 with ID-based follow-up commands; SIGTERM/SIGHUP close without output. No signal path calls runs.stop/jobs.cancel. SIGKILL relies on engine-owned lifetime, not cleanup code in the client.

Feature inputs retain RunUid/ResultId/TrialRef types. This child does not resolve labels or invent a current historical trial; M14.2 wraps M02 resolution for curated commands. Rates say currency units per 1 USD; billing and model override request schemas stay distinct.

No retained-analysis display-currency/rate option is generated. A typed alternative TariffDTO includes both per_kwh and currency; this currency names the tariff amount, not a display override. M14.2 maps the curated paired flags.

## Exact artboards and states

| Board/state | Child responsibility |
|---|---|
| CliHelp | Twelve product signatures first, registry/API access and exits 0–3; generated help/schema inspection is deterministic. |
| Shared command output | Human/JSON, loading/progress/finished/error, empty result, no color, invalid params, destructive refusal, disconnected/version/protocol failure. |
| Shared stream states | Finished-before-subscribe, replay, replacement snapshot, old epoch/lower seq, overflow/compaction, detached, expired generic job. |
| CliRun/CliInvalid/CliStatusStop/CliDoctor/CliExchange | Only shared output/error/follower plumbing here; exact feature lines and all wide/compact golden fixtures are M14.2. |

Validate help/output at 120×40 and 80×24; preserve readable UID/error/field/remedy data without requiring color. CLI boards are plain terminal output, not Textual screens.

## Acceptance and faults

```sh
pytest tests/cli/test_registry.py tests/cli/test_help.py tests/cli/test_inputs.py tests/cli/test_output.py tests/cli/test_errors.py tests/cli/test_streams.py tests/cli/test_launcher.py tests/cli/test_imports.py tests/integration/test_cli_registry_socket.py
```

1. Every fixture method is callable by registry/generated path or canonical api call, with correct precedence and schema; unknown/malformed input and missing --yes make zero engine requests.
2. Over a real Unix socket and InProcessClient, compare typed application error fields and protocol errors; namespaced code never appears as outer JSON-RPC code. Validate every response/wrapper against exported schemas.
3. Inject an event between topic snapshots and replay an older update/tombstone. Restart at lower seq, compact and overflow; projection/cursor stays correct and obsolete generations cannot regress it.
4. Finish a launch job before subscription and recover its distinct initial_progress through jobs.get/snapshots after cache expiry/restart; race detach with completion; drop a socket twice; no duplicate command, launch, cancel or stop occurs. Autostart/status-no-autostart and major mismatch match exits 0–3.
5. Golden-test help and human/JSON errors at both widths. Verify exact trial fields, COP 4000 units, separate account/model request models and no retained display-currency/rate switches.
6. Prove import boundaries and no private-store reads; only launcher can import both clients. --params-file reads only its explicit JSON input; it never implements retained-record lookup.

## Real integration and pending parent work

Gate this child on real registry/Unix-socket/client execution with injected feature services, not fake EngineClient alone. M14.2 must reuse this substrate and add real engine feature/process tests before M14 is complete.

**Pending parent obligations:** all curated commands, doctor consent, UID/ambiguity resolution, warning dedup, real stop/report persistence, M15 launcher binding and wireframe corrections. Provider CLI hints must be schema-backed; flag missing mappings to their owner rather than add compatibility aliases.
