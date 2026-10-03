# M05.4 — codex-adapter

Parent: [M05 adapter contract](../reference/modules/05-harness-execution-isolation.md#1-engine-component). Requirements: R010, R012, R044, R047, R061, R065, R069–R072, R137, R138. Findings: F06 scoped records and the recommendation’s explicit current-official-documentation gate for Codex.

Outcome: Codex implements the complete adapter contract without assuming that a CLI flag or personal setting is available in every release. Proposed work; no current OpenAI recommendation, switch or support matrix is asserted here.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M05.1](01-process-runtime.md) and [M05.2](02-isolation-observation.md).

**Bootstrap-published contracts, allowed as injected fixtures:** M03 installed-version/account schema, M04 selection/effort evidence, M07 frozen launch, M12/M16 judge/planner payloads. Full feature implementations remain later integration gates.

Before implementing or changing controls, inspect installed executable provenance/version and open current official OpenAI Codex documentation. Verify noninteractive execution, configuration precedence, permission/sandbox controls, model/effort selection, structured output, auth inspection and model/default discovery. Retain exact source URLs/date and applicability; distinguish documented controls from observed installed behavior.

Extend this adapter's versioned parser fixtures to emit M05.2 `ContextObservation` records for available native roles, request/phase IDs, session/agent/window boundaries, compaction/reset/truncation signals and native counters. Preserve exposure/coverage limits and stable source ranges; synthetic IDs never prove membership. Keep source-role classification, token count/method/fidelity/basis and current-input membership independent. Exposed reasoning summaries are not hidden reasoning; absent categories/counts/membership remain null/unknown. Route sanitized capture through the shared durable sink, with no classifier transport or decision feedback into the harness.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/engine/harness/adapters/harnesses/codex.py` and `codex_formats.py`.
- `tests/harness/adapters/test_codex.py`, `test_codex_installed.py`.
- `tests/harness/fixtures/codex/` with sanitized configuration/status/transcripts, expected launch/signals and version/platform/source `evidence.json`.

Implement every `HarnessAdapter` member and expose a registration factory. Use M05.1 process ownership and M05.2 settings/workspace ports; never execute shell commands or read user files inside pure adapter methods.

Build a fresh noninteractive invocation for every role/task, using exactly the explicit model/provider and M04-frozen effort argument. No model-default shortcut for benchmark roles, no fallback setting and no resume/replay path is allowed.

Assess instructions, memories, plugins, hooks and MCP independently against the exact installed release. A separate config directory alone is not evidence that every category is disabled. Document supported controls and managed-policy limitations; missing controls yield `cannot_disable`.

Current mode preserves user configuration while explicit benchmark model/effort wins. Clean mode retains required auth/provider access and records precisely which configuration sources remain active. Neither mode rewrites personal configuration.

Translate permission outcomes from verified controls. If headless prompting cannot be disabled, launch is unsupported; if default-model authentication verification cannot deny every tool/file action, that diagnostic fails before spawn. Do not claim OS containment solely from a CLI label.

Inspection/default-model reads must use documented non-model configuration/status interfaces. If a version exposes no model-list interface, return unsupported to M04 rather than probe with a model call or infer a list from another version.

Parse only evidenced output schemas. Effective model/effort is observed only when actually reported; startup success never verifies effort. Keep reasoning summaries labelled, unavailable context/rate explicit, usage cumulative/final markers intact and provider cost as reported.

Use M05.1’s request scope on every signal/log. Any model-generated identity-like text remains untrusted output, never a run/trial/result or diagnostic job key.

Preserve `UsageReported.cost` as exact decimal text plus raw sanitized observation, explicit harness currency or version-documented adapter currency contract and evidence reference. Missing currency provenance remains unknown; never infer USD. Apply the parent judge-root permissions through the same launch adapter: protected artifact/input roots, writable scratch/engine records only, or block before launch.

Extend `parse(record) -> Sequence[HarnessSignal]` and the owned format/golden fixtures with M10.1's `GenerationTimingObserved` and `RequestRosterObserved`; reuse the parent's declarations rather than an adapter-specific shape. Request-scoped `UsageReported` carries `request_key` and `token_policy_ref`, with explicit parent/detail inclusion and cumulative/delta/final overlap provenance. Timing points to acknowledged usage entry IDs for that exact request and token policy, preserving source clock/epoch/resolution and native-decode/proxy/measured-window basis. Emit complete roster evidence only for an evidenced terminal list covering the invocation and descendants. These are conditional parser contracts, not new vendor-capability claims; unsupported timing, request identity or detail categories remain unavailable. Native process duration, receipt arrival times and live-rate estimates cannot fill them.

Consume frozen `RequestedSettings.model_variant_ref`/resolved artifact/control evidence without changing the native model selector. Extend the existing version-specific formats/parser and exposure fixtures with `VariantObserved(VariantEvidenceV1)`: requested/ref linkage, reported or confirmed effective artifact/composition, proof coverage, source/version/time, full engine invocation/TrialRef/request scope and limitations. An alias echo is reported only; content, ancestry and creator claims remain independent. Unsupported native introspection yields unverified/unavailable, never a synthesized digest or model-response-based identification. Known conflict uses M05.1–2 `harness.model_rejected(reason=variant_mismatch)` and its stop/drain contract. Discovery/inspection cannot invoke inference, download/load weights or manage a model server.

**Route, comparison and profile interfaces.** Extend this adapter’s owned launch/parser/exposure/golden fixtures for **Responses mapping**. Consume the M04 ResolvedAccessPlanV1 and ResolvedExistingAgentPlanV1 through managed_config/launch_spec, emitting only adapter-allowlisted structured fields; never evaluate an alias. Require the frozen exact Responses stream/tool/continuation mapping and isolated user-layer provider/catalog configuration. A Chat Completions route cannot qualify this adapter. Requested alias metadata never creates backend support; unknown context/effort remains unknown. Implement the separate `route_qualification_spec(plan, workspace, managed_dir)` contract with the fixed fixture tool, exact model/effort, bounded disposable session and correlated streamed continuation, or return typed unsupported before spawn. Existing `verification_spec` remains default-model auth smoke with every tool denied and model/effort omitted. Emit RouteObserved with per-main/helper/request/attempt requested/resolved/effective states and evidence gaps; link variant evidence to the same sanitized source fact. Strict requires all_competitor_inference coverage, while primary_model_only is exploratory with helper usage still counted. Named existing profiles preserve optional inherited declarations unless explicit reviewed overrides change them; required role/isolation controls remain mandatory.

**Codex through OpenRouter or LiteLLM — R192–R193.**

Implement [CROSS-HARNESS-COMPARISON.md](../CROSS-HARNESS-COMPARISON.md) using documented custom-provider configuration in an isolated benchmark-owned user layer, such as an independently scoped `CODEX_HOME`. Project-local provider/auth routing keys do not establish an override. Pin provider ID, base URL, credential environment reference, exact client model alias and supported model-native effort; never modify the operator's configuration. Current official configuration documents `wire_api="responses"`; qualify complete Responses streaming, replayed continuation, tool calls/results and errors, not only Chat Completions, Messages or model listing. [Configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference), [custom providers](https://learn.chatgpt.com/docs/config-file/config-advanced#custom-model-providers), [gateway compatibility](https://learn.chatgpt.com/docs/enterprise/gateway-compatibility).

A custom alias may require a version-matched model catalog with truthful instructions, context, reasoning and tool metadata; it must align with the route and never enable unsupported capabilities or implicit model upgrades. Retain that catalog's provenance/digest as part of the harness treatment, since it can change behavior even for the same upstream model. Validate the actual installed release and gateway/model combination before advertising support. [Official gateway deployment guide](https://learn.chatgpt.com/docs/enterprise/roll-out-a-gateway#use-a-model-catalog-for-custom-names). Add fixtures for provider-layer precedence, alias metadata, ignored effort, protocol mismatch, expired credentials, helper-model drift and preserved personal configuration. Targeted qualification is separate from this child's default-model smoke test.

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
pytest tests/harness/adapters/test_codex.py
```

1. Launch goldens cover planner/competitor/judge, clean/current, explicit and omitted effort, paths with spaces and supported cloud/local provider selections. Assert fresh session, exact model, no fallback and no accidental shell interpolation.
2. Configuration precedence fixtures include user/project/managed sources, each personal integration category, unavailable controls and managed restrictions. Prove clean failures stay explicit and current benchmark overrides do not mutate user files.
3. Output fixtures include auth/model/config rejection, permission block, normal/partial usage, absent reasoning/context/effort, schema drift, malformed JSON and truncated records. Missing facts remain unavailable; no parser fallback upgrades support.
4. Non-model probe/list/default fixtures assert zero model invocations, distinguish offline/auth/unknown, and avoid treating cached selection evidence as proof of installed compatibility.
5. Verification fixtures require no explicit model/effort, denied tools, one spawn at most, diagnostic scope and cleanup; unsupported restrictions yield `headless_failed` before invocation.

6. Cost fixtures cover explicit non-USD currency, documented adapter currency and absent provenance; raw amounts survive but no currency is guessed. Judge fixtures attempt artifact/input writes, repairs and traversal/symlink escapes; protection failure blocks before spawn while scratch writes remain allowed.

**Installed-version/platform gate:** run `tests/harness/adapters/test_codex_installed.py` on macOS/Linux with exact binary/version evidence. Reconcile current official docs with installed help/config/status, then test real role launches, clean/current controls, requested/effective values, blocked actions, detach, timeout and process-tree cleanup. Include real protected-root judge checks. Model-call checks require explicit test consent; absence of credentials or a platform is recorded as unverified.

Keep documentation, installed defaults and measured behavior in separate evidence fields. Any mismatch blocks the relevant support claim and produces a limitation; never silently adapt to a different model or effort.

Installed checks must also confirm documented cost-currency provenance and declared judge-root protection for that exact version/platform; a transcript-only permission assertion is insufficient.

**UI boundary:** no screens. Supply Codex policy rows and RunConfig, TaskBlocked, ModelRejected and RunIsolation data; M05.7 owns their presentation and M11 owns live screens.

**Pending parent obligations:** M05.3/M05.5/M05.6/M05.8/M05.9, M05.7 real integration, M03/M04 inspection, M11 lifecycle and M12/M16 role acceptance. Neither official documentation alone nor transcript tests complete installed-version verification.
