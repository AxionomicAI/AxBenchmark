# M05.3 — claude-adapter

Parent: [M05 adapter contract](../reference/modules/05-harness-execution-isolation.md#1-engine-component). Requirements: R010, R012, R044, R047, R061, R065, R069–R072, R137, R138. Findings: F06 scoped records and the recommendation’s per-version adapter evidence gate.

Outcome: Claude Code implements the complete `HarnessAdapter` contract with documented, installed-version evidence. Proposed work; this spec asserts no current CLI switch, output schema or supported version.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M05.1](01-process-runtime.md) and [M05.2](02-isolation-observation.md).

**Bootstrap-published contracts, allowed as injected fixtures:** M03 inventory/account observations, M04 catalog contexts/selection evidence, M07 frozen inputs, M12 judge payloads and M16 planner payloads. Full provider services are not adapter entry dependencies.

Before implementation, identify the executable/package provenance and exact version. Open current official Claude Code documentation for noninteractive invocation, configuration precedence, permissions, model/effort controls, output and auth/model inspection. Record URLs, retrieval date and applicable version range; unknown applicability is a blocker for that capability.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/engine/harness/adapters/harnesses/claude_code.py` and `claude_code_formats.py`.
- `tests/harness/adapters/test_claude_code.py`, `test_claude_code_installed.py`.
- `tests/harness/fixtures/claude_code/` containing sanitized settings, stdout/stderr transcripts, expected signals and `evidence.json` with official sources/version/platform/command provenance.

Implement every parent `HarnessAdapter` member, including exposure, clean controls, settings sanitization input, managed configuration, launch, parse, exit classification, auth status, default-model reading and verification launch. Supply a registration factory; M11 owns global composition.

The adapter is pure transformation over supplied settings/output/version. Process execution and file reads stay in M05.1/M05.2. M04’s discovery bridge consumes M05 inspection, not this private adapter module.

Build fresh headless planner/competitor/judge launch specs with the exact requested model/provider and frozen effort choice. Omit effort when requested; never set a fallback model or resume identifier. Respect role payload boundaries, especially immutable judge evidence.

Map each personal instruction, memory, plugin, hook and MCP category separately for the verified version. Managed config retains approved auth/provider access; user config is never rewritten. Unsupported disablement blocks clean instead of silently selecting current.

Permission setup must prevent a pending prompt. Parse observable denied actions as blocked evidence without asserting that unobservable actions were prevented. Diagnostic verification must deny every tool/file action or fail before spawn.

Default-model and auth inspection use only documented non-model paths. Missing supported inspection returns unknown/unsupported; no conversational prompt may discover an account, model or default.

Parse structured and unstructured outputs defensively, keeping raw sanitized evidence. Reasoning versus summaries, token deltas, cumulative/final usage, context and effective settings retain their declared source; absent fields never become invented zero or verified effort.

Scopes and ids come from M05.1; output text cannot override `InvocationId`, `TrialRef`, `ResultId` or diagnostic `JobId`. Built-in retries may be observed, but the adapter never starts an orchestrator retry.

Preserve `UsageReported.cost` as exact decimal text plus raw sanitized observation, explicit harness currency or version-documented adapter currency contract and evidence reference. Missing currency provenance remains unknown; never infer USD. Apply the parent judge-root permissions through the same launch adapter: protected artifact/input roots, writable scratch/engine records only, or block before launch.

## Acceptance and faults

Run offline first:

```sh
pytest tests/harness/adapters/test_claude_code.py
```

1. Golden launch fixtures cover all roles, clean/current, explicit effort and omitted effort, cloud/local selections when supported, and distinct task conversations. Assert exact requested model and absence of fallback/resume arguments.
2. Settings fixtures cover all five clean categories, managed policy restrictions, unsupported controls and current override precedence. Verify unchanged user files and redacted credential sentinels in every retained artifact.
3. Transcript fixtures cover successful reply, auth rejection, model rejection, blocked tool, missing effective effort/context/rate, cumulative/final usage, partial last line, malformed record and interrupted stream. Preserve raw evidence and classify unknown formats conservatively.
4. Inspection fixtures yield known/unknown default and account/auth states without a model call. A fake runner rejects any model launch from probe/list-models paths.
5. Verification fixtures enforce no model/effort argument, all tools denied, one spawn maximum and no run/trial identity. Unsupported restrictions return a pre-spawn diagnostic failure.

6. Cost fixtures cover explicit non-USD currency, documented adapter currency and absent provenance; raw amounts survive but no currency is guessed. Judge fixtures attempt artifact/input writes, repairs and traversal/symlink escapes; protection failure blocks before spawn while scratch writes remain allowed.

**Installed-version/platform gate:** run `tests/harness/adapters/test_claude_code_installed.py` on macOS and Linux against recorded exact installed versions. Compare help/status/config outputs and documented controls; exercise real clean/current setup, fresh sessions, blocked permissions, drainage, stop and child cleanup with explicit test consent for any model calls. Missing credentials/platforms remain unverified, never passing skips.

Preserve the dated evidence matrix per version/platform/provider and the test’s observed command/output schema. A documentation match without execution proves no installed behavior; a successful invocation without control evidence proves no clean isolation.

Installed checks must also confirm documented cost-currency provenance and declared judge-root protection for that exact version/platform; a transcript-only permission assertion is insufficient.

**UI boundary:** no UI files. Supply Claude rows for EnvPolicy/CleanModeBlocked and scoped RunConfig/TaskBlocked/ModelRejected/RunIsolation observations; M05.7 renders them.

**Pending parent obligations:** all other adapter children, M05.7 integration, real M03/M04 discovery, M07 freezing, M11 lifecycle, M12/M16 roles and M14 CLI. No passing transcript suite substitutes for the official-documentation and installed-version gate.
