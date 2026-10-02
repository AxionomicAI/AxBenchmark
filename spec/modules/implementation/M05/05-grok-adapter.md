# M05.5 — grok-adapter

Parent: [M05 adapter contract](../../05-harness-execution-isolation.md#1-engine-component). Requirements: R010, R012, R044, R047, R061, R065, R069–R072, R137, R138. Findings: F06 scoped evidence and the recommendation’s requirement to expose unsupported Grok CLI controls.

Outcome: the selected Grok CLI distribution implements the common contract only where official documentation and installed evidence support it. Proposed work; the product name alone does not establish package identity or capabilities.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M05.1](01-process-runtime.md) and [M05.2](02-isolation-observation.md).

**Bootstrap-published contracts, allowed as injected fixtures:** M03 executable inventory, M04 provider/account catalog context, M07 frozen settings and M12/M16 role payloads. Their implementations are later integration gates.

First identify the actual executable/package/repository and version associated with the product’s Grok CLI entry. Open that distribution’s current official documentation or maintainer repository for headless invocation, permissions, configuration, model selection, output and inspection. Record exact provenance/source URLs/date; do not substitute a similarly named CLI or assert that provider API documentation describes this executable.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/engine/harness/adapters/harnesses/grok_cli.py` and `grok_cli_formats.py`.
- `tests/harness/adapters/test_grok_cli.py`, `test_grok_cli_installed.py`.
- `tests/harness/fixtures/grok_cli/` with sanitized help/config/status/output, expected signals and version/distribution/platform `evidence.json`.

Implement the complete `HarnessAdapter` Protocol with a registration factory. Unsupported capabilities are explicit return states; implementing the interface is not a claim that every feature exists.

Construct exact-model fresh headless requests from frozen selections. Explicit effort must have matching capability evidence; unknown support omits effort. Never translate an unrecognized effort into a guessed switch, select another model or resume a session.

Version-specific clean controls cover all five categories. If the documented distribution cannot disable a category, report `cannot_disable` and block clean; native capabilities remain available under supported controls. Absence requires evidence, not a missing parser field.

Read current settings without mutation and provide sanitized relevant fields for fingerprinting. Record provider/account/endpoint provenance; do not infer API billing solely from the harness name or successful authentication.

Permission handling must never wait on stdin. If the CLI lacks a supported noninteractive denial mechanism, return an explicit unsupported/config failure before benchmark launch. Verification additionally requires every tool/file action denied.

Non-model auth/model/default inspection is permitted only through evidenced interfaces. An unavailable command returns unknown/unsupported to M03/M04; no exploratory model prompt, automatic login or fabricated catalog is allowed.

Parse reported actions, blocked permissions, reasoning, tokens, context and effective settings separately. A plain text reply does not establish token counts, effort or cost. Preserve raw sanitized stderr/stdout on malformed or unknown output.

Attach M05.1-provided invocation/scope identities; no adapter-specific result ids or trial directories. A CLI’s observed retry is recorded without causing a second engine launch.

Preserve `UsageReported.cost` as exact decimal text plus raw sanitized observation, explicit harness currency or version-documented adapter currency contract and evidence reference. Missing currency provenance remains unknown; never infer USD. Apply the parent judge-root permissions through the same launch adapter: protected artifact/input roots, writable scratch/engine records only, or block before launch.

## Acceptance and faults

Run offline first:

```sh
pytest tests/harness/adapters/test_grok_cli.py
```

1. Golden requests cover exact provider/model, explicit/omitted effort, all roles and clean/current policy. Unsupported controls reject before launch; supported launches contain neither fallback nor conversation-resume arguments.
2. Distribution/version fixtures deliberately share a executable display name but differ in capabilities. Unsupported versions remain unsupported; never reuse a different distribution’s flags or output schema.
3. Transcript fixtures cover auth/model rejection, blocked prompt attempt, offline exit, unstructured response, reported usage, missing token/rate/context/cost, malformed record and partial stream. Absent numeric values stay unavailable, not zero.
4. Settings fixtures include missing integration controls and secret sentinels. Clean cannot be labelled established with any `cannot_disable`; current fingerprints contain no credential and user settings stay byte-identical.
5. Probe/list/default fixtures enforce zero model calls and classify unsupported interfaces distinctly. Verification denies tools, omits model/effort and uses only diagnostic identities, or fails before the single permitted spawn.

6. Cost fixtures cover explicit non-USD currency, documented adapter currency and absent provenance; raw amounts survive but no currency is guessed. Judge fixtures attempt artifact/input writes, repairs and traversal/symlink escapes; protection failure blocks before spawn while scratch writes remain allowed.

**Installed-version/platform gate:** run `tests/harness/adapters/test_grok_cli_installed.py` on macOS/Linux for the recorded distribution/version. Compare current official docs with help/status/config output, then exercise headless launch, actual permission behavior, clean/current limitations, fresh sessions, output parsing, deadline and child cleanup. Obtain explicit test consent for model calls; record missing platform/credentials as unverified.

Retain exact observed support and restrictions in the adapter’s version evidence. If complete headless execution cannot be established, the actionable readiness state is unsupported; fixture success must not promote it to usable.

Installed checks must also confirm documented cost-currency provenance and declared judge-root protection for that exact version/platform; a transcript-only permission assertion is insufficient.

**UI boundary:** no UI implementation. Supply honest Grok rows for EnvPolicy/CleanModeBlocked and RunConfig/TaskBlocked/ModelRejected/RunIsolation; M05.7 renders those DTOs.

**Pending parent obligations:** remaining adapters, M05.7 cross-platform integration, M03/M04 discovery, M07 selection and M11/M12/M16 actual callers. Unsupported control evidence is a valid result, not permission to claim clean support.
