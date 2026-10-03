# M05.3 — claude-adapter

Parent: [M05 adapter contract](../reference/modules/05-harness-execution-isolation.md#1-engine-component). Requirements: R010, R012, R044, R047, R061, R065, R069–R072, R137, R138. Findings: F06 scoped records and the recommendation’s per-version adapter evidence gate.

Outcome: Claude Code implements the complete `HarnessAdapter` contract with documented, installed-version evidence. Proposed work; this spec asserts no current CLI switch, output schema or supported version.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M05.1](01-process-runtime.md) and [M05.2](02-isolation-observation.md).

**Bootstrap-published contracts, allowed as injected fixtures:** M03 inventory/account observations, M04 catalog contexts/selection evidence, M07 frozen inputs, M12 judge payloads and M16 planner payloads. Full provider services are not adapter entry dependencies.

Before implementation, identify the executable/package provenance and exact version. Open current official Claude Code documentation for noninteractive invocation, configuration precedence, permissions, model/effort controls, output and auth/model inspection. Record URLs, retrieval date and applicable version range; unknown applicability is a blocker for that capability.

Extend this adapter's versioned parser fixtures to emit M05.2 `ContextObservation` records for available native roles, request/phase IDs, session/agent/window boundaries, compaction/reset/truncation signals and native counters. Preserve exposure/coverage limits and stable source ranges; synthetic IDs never prove membership. Keep source-role classification, token count/method/fidelity/basis and current-input membership independent. Exposed reasoning summaries are not hidden reasoning; absent categories/counts/membership remain null/unknown. Route sanitized capture through the shared durable sink, with no classifier transport or decision feedback into the harness.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/engine/harness/adapters/harnesses/claude_code.py` and `claude_code_formats.py`.
- `tests/harness/adapters/test_claude_code.py`, `test_claude_code_installed.py`.
- `tests/harness/fixtures/claude_code/` containing sanitized settings, stdout/stderr transcripts, expected signals and `evidence.json` with official sources/version/platform/command provenance.

Implement every parent `HarnessAdapter` member, including exposure, clean controls, settings sanitization input, managed configuration, launch, parse, exit classification, auth status, default-model reading and verification launch. Supply a registration factory; M11 owns global composition.

The adapter is pure transformation over supplied settings/output/version. Process execution and file reads stay in M05.1/M05.2. M04’s discovery bridge consumes M05 inspection, not this private adapter module.

Build fresh headless planner/competitor/judge launch specs with the exact requested model/provider and frozen effort choice. Omit effort when requested; never set a fallback model or resume identifier. Respect role payload boundaries, especially immutable judge evidence.

Map each personal instruction, memory, plugin, hook and MCP category separately for the verified version. Managed config retains approved auth/provider access; user config is never rewritten. Unsupported disablement blocks clean instead of silently selecting current.

Permission setup must prevent a pending prompt. Parse observable denied actions as blocked evidence without asserting that unobservable actions were prevented. Default-model authentication verification must deny every tool/file action or fail before spawn.

Default-model and auth inspection use only documented non-model paths. Missing supported inspection returns unknown/unsupported; no conversational prompt may discover an account, model or default.

Parse structured and unstructured outputs defensively, keeping raw sanitized evidence. Reasoning versus summaries, token deltas, cumulative/final usage, context and effective settings retain their declared source; absent fields never become invented zero or verified effort.

Scopes and ids come from M05.1; output text cannot override `InvocationId`, `TrialRef`, `ResultId` or diagnostic `JobId`. Built-in retries may be observed, but the adapter never starts an orchestrator retry.

Preserve `UsageReported.cost` as exact decimal text plus raw sanitized observation, explicit harness currency or version-documented adapter currency contract and evidence reference. Missing currency provenance remains unknown; never infer USD. Apply the parent judge-root permissions through the same launch adapter: protected artifact/input roots, writable scratch/engine records only, or block before launch.

Extend `parse(record) -> Sequence[HarnessSignal]` and the owned format/golden fixtures with M10.1's `GenerationTimingObserved` and `RequestRosterObserved`; reuse the parent's declarations rather than an adapter-specific shape. Request-scoped `UsageReported` carries `request_key` and `token_policy_ref`, with explicit parent/detail inclusion and cumulative/delta/final overlap provenance. Timing points to acknowledged usage entry IDs for that exact request and token policy, preserving source clock/epoch/resolution and native-decode/proxy/measured-window basis. Emit complete roster evidence only for an evidenced terminal list covering the invocation and descendants. These are conditional parser contracts, not new vendor-capability claims; unsupported timing, request identity or detail categories remain unavailable. Native process duration, receipt arrival times and live-rate estimates cannot fill them.

Consume frozen `RequestedSettings.model_variant_ref`/resolved artifact/control evidence without changing the native model selector. Extend the existing version-specific formats/parser and exposure fixtures with `VariantObserved(VariantEvidenceV1)`: requested/ref linkage, reported or confirmed effective artifact/composition, proof coverage, source/version/time, full engine invocation/TrialRef/request scope and limitations. An alias echo is reported only; content, ancestry and creator claims remain independent. Unsupported native introspection yields unverified/unavailable, never a synthesized digest or model-response-based identification. Known conflict uses M05.1–2 `harness.model_rejected(reason=variant_mismatch)` and its stop/drain contract. Discovery/inspection cannot invoke inference, download/load weights or manage a model server.

**Route, comparison and profile interfaces.** Extend this adapter’s owned launch/parser/exposure/golden fixtures for **Messages mapping**. Consume the M04 ResolvedAccessPlanV1 and ResolvedExistingAgentPlanV1 through managed_config/launch_spec, emitting only adapter-allowlisted structured fields; never evaluate an alias. Only exact-version qualified Messages endpoint/model/auth/effort controls may materialize; vendor support, experimental cross-family compatibility and observed upstream proof remain separate. All required helper/model slots are pinned or strict unavailable. The private example supplies no directory, endpoint, credential placement, capability or fixture value. Implement the separate `route_qualification_spec(plan, workspace, managed_dir)` contract with the fixed fixture tool, exact model/effort, bounded disposable session and correlated streamed continuation, or return typed unsupported before spawn. Existing `verification_spec` remains default-model auth smoke with every tool denied and model/effort omitted. Emit RouteObserved with per-main/helper/request/attempt requested/resolved/effective states and evidence gaps; link variant evidence to the same sanitized source fact. Strict requires all_competitor_inference coverage, while primary_model_only is exploratory with helper usage still counted. Named existing profiles preserve optional inherited declarations unless explicit reviewed overrides change them; required role/isolation controls remain mandatory.

**Claude Code through OpenRouter or LiteLLM — R192–R193.**

Follow the evidenced Claude route in [CROSS-HARNESS-COMPARISON.md](../CROSS-HARNESS-COMPARISON.md). Apply documented Messages-compatible endpoint/auth/model controls only in the isolated benchmark invocation. Pin every model slot/helper route required by the selected comparison policy; a primary model alias alone cannot prove all model work used that model. Preserve native effort/thinking semantics through any gateway translation, with request evidence or explicit uncertainty. Vendor-documented support, experimental installed compatibility and effective upstream proof remain separate. Do not advertise non-Claude upstream models as universally supported, overwrite personal settings, reuse unrelated cached authentication, or treat the generic default-model smoke test as exact-route qualification.

**Existing named profiles — R194.**

The [existing-profile contract](../CROSS-HARNESS-COMPARISON.md) accepts independently supplied, explicitly selected Claude Code declarations after static inspection; its illustrative name supplies no configuration directory or route values. Reproduce declarations through an isolated qualified configuration layer, not by sourcing the user's shell or reusing personal session stores. Preserve each explicitly configured auth placement until the dispatch resolver/installed transport establishes behavior; no private example supplies default placements. Record declared effort, thinking/output limits, assumed context and auto-compaction separately, including unknown applicability and any native clamping. A profile declaration never proves the provider's context capacity or that every helper model/effort is pinned. Ordinary CURRENT inheritance stays available; strict matching requires the existing exact-route evidence.

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
