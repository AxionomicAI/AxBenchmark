# M05.6 — pi-adapter

Parent: [M05 adapter contract](../reference/modules/05-harness-execution-isolation.md#1-engine-component). Requirements: R010, R012, R044, R047, R061, R065, R069–R072, R137, R138. Findings: F06 scoped records and the recommendation’s explicit unsupported-setting/observation gate for Pi.

Outcome: Pi implements the same harness contract while preserving provider-specific unknowns and limitations. Proposed work; no current distribution, CLI syntax or provider capability is assumed.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M05.1](01-process-runtime.md) and [M05.2](02-isolation-observation.md).

**Bootstrap-published contracts, allowed as injected fixtures:** M03 version/account inventory, M04 catalog/effort evidence, M07 frozen entries and M12/M16 role payloads. Full feature services are later integration gates.

Identify executable/package provenance and exact installed version first. Open the selected Pi distribution’s current official documentation/maintainer repository for headless mode, provider/model/effort selection, permissions, settings/integrations, output and non-model discovery. Record official source URLs/date and version applicability; never infer capabilities from another product named Pi.

Extend this adapter's versioned parser fixtures to emit M05.2 `ContextObservation` records for available native roles, request/phase IDs, session/agent/window boundaries, compaction/reset/truncation signals and native counters. Preserve exposure/coverage limits and stable source ranges; synthetic IDs never prove membership. Keep source-role classification, token count/method/fidelity/basis and current-input membership independent. Exposed reasoning summaries are not hidden reasoning; absent categories/counts/membership remain null/unknown. Route sanitized capture through the shared durable sink, with no classifier transport or decision feedback into the harness.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/engine/harness/adapters/harnesses/pi.py` and `pi_formats.py`.
- `tests/harness/adapters/test_pi.py`, `test_pi_installed.py`.
- `tests/harness/fixtures/pi/` with sanitized per-context settings/status/transcripts, golden signals and distribution/version/platform `evidence.json`.

Implement every `HarnessAdapter` method and a registration factory using M05.1/M05.2 ports. Adapter transforms perform no I/O and introduce no alternative process runner or event bus.

Map a fully frozen provider/endpoint/account/model selection to a fresh headless launch for planner, competitor and judge. Preserve exact selection identities; two providers using the same model string cannot share evidence implicitly.

Use the frozen effort argument only when supported for that exact context. Unknown means omission; explicit unsupported input fails. Successful process startup cannot establish effective effort, and another provider’s support cannot fill the gap.

Assess clean instructions, memories, plugins, hooks and MCP with version-specific evidence. Disable supported personal integrations while retaining native harness behavior and required authentication. Any unsupported disablement blocks clean; never silently start current.

Current mode reads existing configuration but gives explicit benchmark selections precedence. Sanitization removes secret values before fingerprinting. A supported local endpoint is identified by its context, never guessed from a model name.

Prove permission behavior is headless before launch; unsupported prompting restrictions remain explicit. Default-model authentication verification must deny all file/tool actions and omit model/effort, or return diagnostic failure without launching.

Implement inspection/model/default readings only through documented non-model sources. Unsupported discovery stays unsupported and missing auth/account/billing facts remain unknown; a model call must never fill inspection gaps.

Parse actions, reasoning/summaries, usage, context, rates and settings only when exposed. Preserve provider-specific cumulative/final markers and raw sanitized evidence; never estimate tokens from characters or cost from a provider name.

All durable output uses M05.1 scopes/ids, including explicit competitor/judge result/trial and diagnostic `JobId`/`VerificationScope`. Adapter output cannot change that binding.

Preserve `UsageReported.cost` as exact decimal text plus raw sanitized observation, explicit harness currency or version-documented adapter currency contract and evidence reference. Missing currency provenance remains unknown; never infer USD. Apply the parent judge-root permissions through the same launch adapter: protected artifact/input roots, writable scratch/engine records only, or block before launch.

Extend `parse(record) -> Sequence[HarnessSignal]` and the owned format/golden fixtures with M10.1's `GenerationTimingObserved` and `RequestRosterObserved`; reuse the parent's declarations rather than an adapter-specific shape. Request-scoped `UsageReported` carries `request_key` and `token_policy_ref`, with explicit parent/detail inclusion and cumulative/delta/final overlap provenance. Timing points to acknowledged usage entry IDs for that exact request and token policy, preserving source clock/epoch/resolution and native-decode/proxy/measured-window basis. Emit complete roster evidence only for an evidenced terminal list covering the invocation and descendants. These are conditional parser contracts, not new vendor-capability claims; unsupported timing, request identity or detail categories remain unavailable. Native process duration, receipt arrival times and live-rate estimates cannot fill them.

Consume frozen `RequestedSettings.model_variant_ref`/resolved artifact/control evidence without changing the native model selector. Extend the existing version-specific formats/parser and exposure fixtures with `VariantObserved(VariantEvidenceV1)`: requested/ref linkage, reported or confirmed effective artifact/composition, proof coverage, source/version/time, full engine invocation/TrialRef/request scope and limitations. An alias echo is reported only; content, ancestry and creator claims remain independent. Unsupported native introspection yields unverified/unavailable, never a synthesized digest or model-response-based identification. Known conflict uses M05.1–2 `harness.model_rejected(reason=variant_mismatch)` and its stop/drain contract. Discovery/inspection cannot invoke inference, download/load weights or manage a model server.

**Route, comparison and profile interfaces.** Extend this adapter’s owned launch/parser/exposure/golden fixtures for **provider/model-bound mapping**. Consume the M04 ResolvedAccessPlanV1 and ResolvedExistingAgentPlanV1 through managed_config/launch_spec, emitting only adapter-allowlisted structured fields; never evaluate an alias. Materialize only the identified Pi distribution’s qualified provider/model configuration and native thinking mapping. A displayed thinking label cannot satisfy a different model’s effort contract; protocol and tool/stream qualification are per route/model/version. Implement the separate `route_qualification_spec(plan, workspace, managed_dir)` contract with the fixed fixture tool, exact model/effort, bounded disposable session and correlated streamed continuation, or return typed unsupported before spawn. Existing `verification_spec` remains default-model auth smoke with every tool denied and model/effort omitted. Emit RouteObserved with per-main/helper/request/attempt requested/resolved/effective states and evidence gaps; link variant evidence to the same sanitized source fact. Strict requires all_competitor_inference coverage, while primary_model_only is exploratory with helper usage still counted. Named existing profiles preserve optional inherited declarations unless explicit reviewed overrides change them; required role/isolation controls remain mandatory.

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
pytest tests/harness/adapters/test_pi.py
```

1. Per-context goldens cover all roles, exact provider/model/account, supported endpoint selection, explicit/omitted effort and clean/current. Assert no fallback, no resumed conversation and no support borrowed across contexts.
2. Use identical model strings with different effort/image/output capabilities. Unknown effort omits an argument; explicit unsupported effort errors; missing effective effort stays unverified even after a successful reply.
3. Transcript fixtures cover usage with/without final totals, absent reasoning/context/rate, auth/model/config failure, permission denial, built-in retry, malformed output and cancellation mid-record. Preserve unknowns and raw evidence without inventing measurement data.
4. Settings fixtures cover every integration category, unsupported disabling, precedence and secret sentinels. User config remains unchanged and clean support requires evidence for all categories.
5. Probe/list/default fixtures allow only non-model commands and distinguish unavailable interface from empty catalog. Verification fixtures enforce denied tools, no model/effort argument, at most one spawn and no benchmark identity.

6. Cost fixtures cover explicit non-USD currency, documented adapter currency and absent provenance; raw amounts survive but no currency is guessed. Judge fixtures attempt artifact/input writes, repairs and traversal/symlink escapes; protection failure blocks before spawn while scratch writes remain allowed.

**Installed-version/platform gate:** run `tests/harness/adapters/test_pi_installed.py` on macOS/Linux for exact recorded versions. Verify current official documentation against installed help/config/status, then exercise supported provider contexts, clean/current controls, fresh sessions, explicit setting behavior, blocked actions, detach, deadline and cleanup. Any actual model calls need explicit test consent; missing credentials/platforms remain unverified.

Do not expand the support matrix merely because one provider/context succeeds. Retain unsupported/unverified combinations and sources separately from observed capabilities.

Installed checks must also confirm documented cost-currency provenance and declared judge-root protection for that exact version/platform; a transcript-only permission assertion is insufficient.

**UI boundary:** no screens. Supply Pi policy, unavailable observation, TaskBlocked/ModelRejected, RunConfig and RunIsolation data for M05.7 and M11 live views.

**Pending parent obligations:** other adapters, M05.7 API/views, real M03/M04 account discovery, M07 freezing and M11/M12/M16 role lifecycle. Transcript conformance does not replace current official-source and installed-version evidence.
