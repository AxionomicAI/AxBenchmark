# M11.1 — engine-client-api

Parent: [M11 engine and API](../../11-run-orchestration.md#1-engine-component). Requirements: R046, R049–R052, R060, R139, R150. Findings: F02, F06, F15, F18.

Outcome: an executable headless engine transport/composition seam and interchangeable socket/in-process clients. An early feature can run its real API tests without a scheduler, harness, collector or interface.

## Entry conditions

**Completed prerequisite:** [Bootstrap](../../ARCHITECTURE.md#executable-foundations-and-child-spec-boundaries) only: importable package/test layout, shared IDs/value objects, Protocol/DTO definitions, registry schemas, error envelope, deterministic fixtures and import boundaries.

**Published contracts injected with fixtures:** feature use cases, startup/recovery hooks, activity/readiness providers and future run services. Loading contracts must not instantiate or import feature adapters. No completed M01–M10/M12/M18 implementation is an entry requirement.

M11.2 supplies actual jobs/subscriptions/lifecycle later. Here registered fixture queries/commands prove the dispatch seam; declarations for job/subscription kinds may exist without claiming those implementations.

## Exact proposed ownership

- `axbenchmark/engine/daemon/domain/api_version.py`, `errors.py`.
- `axbenchmark/engine/daemon/ports.py`: socket transport, instance lock and feature registration/startup-hook contracts.
- `axbenchmark/engine/daemon/application/dispatch.py`, `hello.py`, `methods.py`.
- `axbenchmark/engine/daemon/adapters/unix_server.py`, `jsonrpc.py`, `instance.py`.
- `axbenchmark/engine/daemon/composition.py`: `build_engine(registrations, ports)` seam only; later children add registrations.
- `axbenchmark/api/registry.py`: executable MethodRegistry validation/dispatch metadata and API-only Dispatcher Protocol for the injected InProcessClient; `api/engine.py` DTOs; Bootstrap owns shared schemas.
- `axbenchmark/client/protocol.py`, `socket.py`, `in_process.py`, `errors.py`; subscription/lifecycle additions belong to M11.2.
- `tests/engine/daemon/test_dispatch.py`, `test_handshake.py`, `test_instance_lock.py`.
- `tests/client/test_roundtrip.py`, `test_socket_transport.py`, `test_error_parity.py`.
- `tests/contracts/test_method_registry.py`, `test_foundation_imports.py`; `tests/fixtures/daemon/fixture_feature.py`.

Do not implement feature business rules or duplicate their DTOs. Coordinate additive edits to shared registry/composition files with their owners. M14/M15 own CLI/TUI presentation, not this child.

## Interfaces and invariants

Implement `EngineClient.call(method, params)`, `.close()` and `connection_lost`, plus the InProcessClient equivalent. Both serialize/validate requests, responses and errors through the same codec; in-process calls cannot bypass DTO validation.

`engine.hello` negotiates API major version and returns instance/session IDs, started time and actual registered namespaces. `engine.methods` describes exact name, kind, safety, request/response models and one-line purpose. Duplicate/unknown method registrations fail deterministically.

Feature registrations inject use cases and application ports; only the later full composition selects concrete feature adapters. Keep pure domain, application, adapter and API/client import rules from ARCHITECTURE enforced.

Every run wire field is `run_uid: RunUid`, never a date label disguised as an ID. Shared TrialRef is `{run_uid, configuration_id, trial_index}` and validates 1-based index. Label resolution is M02/M14 integration, not private client parsing.

Application error wire form has numeric `error.code=-32000` and namespaced `error.data.code`; optional field/remedy/details survive as EngineError. Shape-invalid parameters use -32602; decoded domain rejections remain application errors.

Malformed JSON uses -32700; invalid requests, unknown methods and internal failures retain -32600, -32601 and -32603. Clients expose ProtocolError separately; never infer a typed failure by parsing message text.

Unix frames are newline-delimited JSON-RPC 2.0, bounded to 16 MiB. Concurrent responses correlate by request ID; a broken client cannot block another connection or take ownership of engine work.

Use the instance lock before touching socket/pid files. Directory 0700, socket 0600, peer UID verified using the supported platform mechanism. Only the lock holder may remove a stale socket. No API reader is admitted before injected recovery hooks finish.

## States and supplied boards

No screen or wireframe implementation. Supply handshake success, incompatible version/remedy, unreachable engine, invalid request and typed feature-failure fixtures for M14 command states and M15 startup/loading/error states.

The real run boards, launch progress and stop dialogs remain M11.3–5 work. Foundation tests must not start a benchmark to demonstrate transport.

## Acceptance and faults

Proposed runnable checks:

```sh
pytest tests/engine/daemon/test_dispatch.py tests/engine/daemon/test_handshake.py tests/engine/daemon/test_instance_lock.py tests/client tests/contracts/test_method_registry.py tests/contracts/test_foundation_imports.py
lint-imports
```

1. Register a tiny feature query and command; invoke through actual Unix socket and InProcessClient and compare JSON DTOs exactly. No scheduler/harness imports or process spawn occur.
2. Round-trip RunUid/RunLabel plus two different TrialRefs sharing task T1; scope survives unchanged. Reject invalid UUID/shape/index without coercing into another run/trial.
3. Inject application error with field/remedy and verify equal EngineError on both clients. Independently send malformed JSON, unknown method and invalid params and assert the precise numeric transport codes.
4. Race requests with responses returned out of order; match each ID and keep sessions isolated. Feed partial/oversized frames and verify bounded connection failure without corrupting another client.
5. Start two engines against the same directory; one owns the lock/socket. A stale socket is removed only after acquiring the lock. Check filesystem modes and peer authorization on macOS and Linux.
6. Block a startup recovery hook; no feature read becomes available. Fail the hook and surface a typed startup failure rather than serving unreconciled state.
7. Major-version mismatch refuses with remedy; compatible majors connect. Disconnect one client during fixture work and verify no injected engine-owned operation receives cancellation.
8. Import contracts and build the fixture engine with feature adapters deliberately unavailable. Generate registry metadata/schema and reject duplicate names, mismatched models and unknown safety/kind values.

## Real integration and pending parent work

M11.2 must extend these same clients/dispatcher for jobs and subscriptions. Then run real M01 library and M03 readiness APIs through this seam with their fixture infrastructure; they may not replace the client with a private shortcut.

Require macOS/Linux socket/lock permission evidence; one platform's tests do not certify the other. Verify M14 and M15 decode the same typed failure without prose parsing before parent completion.

**Pending parent obligations:** jobs/events/autostart, run scheduling, receipts/retention, stop/recovery/invalidation, feature screens and real provider/report/export workflows. Passing this foundation does not establish any working benchmark or provider.
