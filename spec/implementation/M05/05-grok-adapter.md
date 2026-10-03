# M05.5 — grok-adapter

Parent: [M05 adapter contract](../reference/modules/05-harness-execution-isolation.md#1-engine-component). Requirements: R010, R012, R044, R047, R061, R065, R069–R072, R137, R138. Findings: F06 scoped evidence and the recommendation’s requirement to expose unsupported Grok CLI controls.

Outcome: the selected Grok CLI distribution implements the common contract only where official documentation and installed evidence support it. Proposed work; the product name alone does not establish package identity or capabilities.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M05.1](01-process-runtime.md) and [M05.2](02-isolation-observation.md).

**Bootstrap-published contracts, allowed as injected fixtures:** M03 executable inventory, M04 provider/account catalog context, M07 frozen settings and M12/M16 role payloads. Their implementations are later integration gates.

First identify the actual executable/package/repository and version associated with the product’s Grok CLI entry. Open that distribution’s current official documentation or maintainer repository for headless invocation, permissions, configuration, model selection, output and inspection. Record exact provenance/source URLs/date; do not substitute a similarly named CLI or assert that provider API documentation describes this executable.

Extend this adapter's versioned parser fixtures to emit M05.2 `ContextObservation` records for available native roles, request/phase IDs, session/agent/window boundaries, compaction/reset/truncation signals and native counters. Preserve exposure/coverage limits and stable source ranges; synthetic IDs never prove membership. Keep source-role classification, token count/method/fidelity/basis and current-input membership independent. Exposed reasoning summaries are not hidden reasoning; absent categories/counts/membership remain null/unknown. Route sanitized capture through the shared durable sink, with no classifier transport or decision feedback into the harness.

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

Extend `parse(record) -> Sequence[HarnessSignal]` and the owned format/golden fixtures with M10.1's `GenerationTimingObserved` and `RequestRosterObserved`; reuse the parent's declarations rather than an adapter-specific shape. Request-scoped `UsageReported` carries `request_key` and `token_policy_ref`, with explicit parent/detail inclusion and cumulative/delta/final overlap provenance. Timing points to acknowledged usage entry IDs for that exact request and token policy, preserving source clock/epoch/resolution and native-decode/proxy/measured-window basis. Emit complete roster evidence only for an evidenced terminal list covering the invocation and descendants. These are conditional parser contracts, not new vendor-capability claims; unsupported timing, request identity or detail categories remain unavailable. Native process duration, receipt arrival times and live-rate estimates cannot fill them.

Consume frozen `RequestedSettings.model_variant_ref`/resolved artifact/control evidence without changing the native model selector. Extend the existing version-specific formats/parser and exposure fixtures with `VariantObserved(VariantEvidenceV1)`: requested/ref linkage, reported or confirmed effective artifact/composition, proof coverage, source/version/time, full engine invocation/TrialRef/request scope and limitations. An alias echo is reported only; content, ancestry and creator claims remain independent. Unsupported native introspection yields unverified/unavailable, never a synthesized digest or model-response-based identification. Known conflict uses M05.1–2 `harness.model_rejected(reason=variant_mismatch)` and its stop/drain contract. Discovery/inspection cannot invoke inference, download/load weights or manage a model server.

**Route, comparison and profile interfaces.** Extend this adapter’s owned launch/parser/exposure/golden fixtures for **distribution-bound mapping**. Consume the M04 ResolvedAccessPlanV1 and ResolvedExistingAgentPlanV1 through managed_config/launch_spec, emitting only adapter-allowlisted structured fields; never evaluate an alias. Identify the actual Grok distribution/release before accepting any endpoint/protocol/effort control. Different executables named grok never share switches or capability records. The documented xai-org example in the source is conditional evidence, not support for another distribution. Implement the separate `route_qualification_spec(plan, workspace, managed_dir)` contract with the fixed fixture tool, exact model/effort, bounded disposable session and correlated streamed continuation, or return typed unsupported before spawn. Existing `verification_spec` remains default-model auth smoke with every tool denied and model/effort omitted. Emit RouteObserved with per-main/helper/request/attempt requested/resolved/effective states and evidence gaps; link variant evidence to the same sanitized source fact. Strict requires all_competitor_inference coverage, while primary_model_only is exploratory with helper usage still counted. Named existing profiles preserve optional inherited declarations unless explicit reviewed overrides change them; required role/isolation controls remain mandatory.

## Integrated requirements

R192, R193, R194 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R190 — [model variants, lineage and comparison](../MODEL-VARIANTS.md).

R173, R176 — [benchmark statistics](../BENCHMARK-STATISTICS.md).

R161, R162 — [context monitoring](../CONTEXT-MONITORING.md) and [decision engines](../DECISION-ENGINES.md).

R177, R178, R179, R183 — [benchmark modes](../BENCHMARK-MODES.md).

Consume M05.2's frozen `CompetitorInputs` and `TaskCommitProtocolRef` through the existing adapter launch contract. One-shot delivers exact T1 once; multi-step delivers approved common files and only the introduced primary prefix, preserving order and bytes across fresh task processes. Append only the separately approved common execution instruction; do not synthesize planner/fix tasks or alter primary text. Trial Git setup/capture belongs to M05.2 and verdicts to M08: this adapter never auto-commits or invokes a repair for a missing milestone. Extend launch goldens for both modes×empty/populated targets, carried trial state, empty milestones and the unchanged M09 branch; these are common benchmark fixtures, not new vendor switches or support claims.

## Acceptance and faults

**Route/profile acceptance:** Offline vectors cover separate default-auth/targeted-route launches, wrong protocol, dropped effort, helper drift, partial roster, conflicting response echoes, stale source/profile, synthetic secret redaction and unchanged originals. Route qualification success alone does not confirm hidden effective identity. Runtime mismatch drains durable evidence and uses configuration-scoped stop with original expected trials; no model/effort fallback or second retry loop. Installed/provider tests remain separate explicitly consented gates.

**Variant acceptance:** Add offline transcript/launch cases for no identity field, alias-only report, supported invocation-bound proof, changed adapter/runtime composition and mismatch before/during dispatch; retain exact version/distribution limitations and safe evidence. The shared M05 fixture runtime asserts no substitute/retry and correct affected TrialRefs. Fixture support is conditional; existing installed-version gates remain required.

Extend this adapter's existing offline parser suite with duplicate final/cumulative receipts, nested parent/subagent overlap, cached/reasoning inclusion, same source across distinct trials and unsupported timing/roster fixtures. An available timing fixture must bind its usage IDs and source clock exactly; missing output, mismatched clock/policy or undiscovered requests cannot produce complete Gen tok/s. Retain source/version proof or explicit unverified status in `evidence.json`; no installed or model call is required by these fixture additions.

Context fixtures must cover native-only capture, quoted role names, partial/truncated records, repeated source ranges versus repeated text at different positions, unavailable membership and compaction where the installed format exposes it. Unknown/version-unproven signals remain explicit gaps or unknowns; no new provider capability is inferred.

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
