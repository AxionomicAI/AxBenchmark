# M05.8 — cursor-adapter

Parent: [M05 adapter contract](../reference/modules/05-harness-execution-isolation.md#1-engine-component). Requirements: R006, R010, R012, R044, R047, R061, R065, R069–R072, R137, R138, R161–R166, R173–R176, R181.

Outcome: implementers can add Cursor CLI through the existing harness contract, with explicit version/capability limits. This is proposed work, not an installed-support or runtime-completion claim. Preserve Claude Code, Codex, Grok CLI and Pi; append Cursor CLI as `cursor_cli` after Pi in the shared display order.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M05.1](01-process-runtime.md) and [M05.2](02-isolation-observation.md).

**Bootstrap-published contracts, allowed as injected fixtures:** M03 installed-version/account inventory, M04 model/effort evidence, M07 frozen launch, M12/M16 judge/planner payloads, and M10 observation vocabulary. Full feature implementations remain later integration gates.

Before implementation, verify executable provenance and the exact installed release on each target platform. Reopen the official sources below and reconcile installed help/status with them. Never identify an arbitrary executable named `agent` as Cursor. Accept a legacy `cursor-agent` alias only with vendor/version evidence.

Read [benchmark modes](../BENCHMARK-MODES.md), [statistics](../BENCHMARK-STATISTICS.md) and [context monitoring](../CONTEXT-MONITORING.md) as binding extensions. M05.8 adds one child under M05, with no separate scheduler, decision engine or project-capture service.

Extend this adapter's versioned parser fixtures to emit M05.2 `ContextObservation` records for available native roles, request/phase IDs, session/agent/window boundaries, compaction/reset/truncation signals and native counters. Preserve exposure/coverage limits and stable source ranges; synthetic IDs never prove membership. Keep source-role classification, token count/method/fidelity/basis and current-input membership independent. Exposed reasoning summaries are not hidden reasoning; absent categories/counts/membership remain null/unknown. Route sanitized capture through the shared durable sink, with no classifier transport or decision feedback into the harness.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/engine/harness/adapters/harnesses/cursor.py` and `cursor_formats.py`.
- `tests/harness/adapters/test_cursor.py`, `test_cursor_installed.py`.
- `tests/harness/fixtures/cursor/` containing sanitized status/config/transcripts, launch and signal goldens, and `evidence.json` with platform, binary provenance, version, source URLs/dates and supported/unsupported/unverified capabilities.

Implement every `HarnessAdapter` member and expose a registration factory. Pure adapter transformations perform no I/O. Spawn only through M05.1; obtain settings, workspace copies and role protections through M05.2 ports. M05.7 owns shared registration, APIs and views.

Build a fresh noninteractive process/conversation for each competitor task and each planner/judge request. One-shot consumes its one frozen task unchanged; multi-step receives common context and the introduced specification prefix, with workspace state retained between fresh steps. Do not rewrite primary prompt bytes or add planner calls, repair tasks or benchmark stages; the separate approved execution-protocol instruction accompanies the task.

Use the engine-owned isolated copy of the approved current-folder capture, including empty and non-Git baselines. Never run in the selected original directory. Cursor worktrees are not this capture mechanism; omit `--worktree`, resume/continue controls and cloud handoff from benchmark launch construction.

## Documented launch and discovery baseline

The official pages were opened and verified **2026-10-02**. These are documented facts, not installed defaults or measured behavior; retain those three evidence classes separately.

| Source | Version-gated implementation consequence |
|---|---|
| [CLI parameters](https://cursor.com/docs/cli/reference/parameters) | Current executable is `agent`; `--version`, `--print`/`-p`, `--workspace`, `--model`, `--output-format`, `--stream-partial-output`, `--trust`, `--sandbox`, `--list-models` and `models` provide documented surfaces. Inspect the installed release before using them. |
| [Headless execution](https://cursor.com/docs/cli/headless) | Print mode is noninteractive; writable scripts use `--force`. Text is the documented default output; select structured output explicitly. Image paths are consumed through tools, so image-readiness requires model and permission evidence. |
| [Authentication](https://cursor.com/docs/cli/reference/authentication) | `CURSOR_API_KEY` is supported. Keep credentials out of argv/logs; use the engine credential boundary. Browser login remains a user action, never an automated readiness probe. |
| [Configuration](https://cursor.com/docs/cli/reference/configuration) | Global `~/.cursor/cli-config.json`, project `.cursor/cli.json` permissions and `CURSOR_CONFIG_DIR` are documented. The override alone proves no personal-integration category disabled; automatic config repair also makes personal-state mutation a verification concern. |
| [Permissions](https://cursor.com/docs/cli/reference/permissions) | `Shell`, `Read`, `Write`, `WebFetch` and `Mcp` rules have distinct match semantics; deny rules take precedence. Permission syntax and enforcement require installed-version fixtures. |
| [Using CLI](https://cursor.com/docs/cli/using) | Rules and project instructions can load from `.cursor/rules`, `AGENTS.md` and `CLAUDE.md`; MCP configuration can be discovered automatically. Clean assessment must enumerate active sources. |
| [Output format](https://cursor.com/docs/cli/reference/output-format) | JSON/stream JSON expose documented message/result envelopes. Parse the selected format and release explicitly; terminal duration and initialization metadata do not establish token usage or complete model inputs. |

Read inspection/model/default facts only from documented non-model interfaces such as installed version/help, `status`/`whoami`/`about`, configuration and model listing, as actually supported. These operations make zero model calls; missing auth, billing, model/default or catalog facts remain unknown/unsupported. Never invoke a model to fill discovery gaps.

Competitor, planner and judge launches require the exact frozen explicit model. Reject Auto/dynamic routing and unsupported selection; never substitute a fallback. Retain the reported model display name separately from a verified exact model identifier. Do not infer model identity or capability from a logo or friendly label.

Only use an effort control documented and proven for that installed model context. Otherwise offer harness-default by omitting an effort argument; explicit unsupported effort fails. No guessed `--effort` flag or startup-based effective-effort claim is allowed.

The reviewed parameters do not establish a generic OpenAI-compatible base-URL selector. Local endpoint selection is unsupported unless the installed release supplies an evidenced native control; do not create a proxy or reinterpret a model name to simulate support.

## Configuration, permissions and roles

Assess instructions, memories, plugins, hooks and MCP separately. `CURSOR_CONFIG_DIR`, `--approve-mcps` and `--plugin-dir` do not establish that all categories are disabled. Never invent disable-rules/hooks/memory/MCP flags. A category without established disablement is `cannot_disable`; unestablishable clean blocks launch without silently selecting current.

Preserve required authentication without copying all personal state. Establish supported managed settings through M05.2; account for project and managed sources and config self-repair. No probe or invocation may rewrite personal configuration. Current mode preserves existing configuration, including applicable rules and core protections, while explicit benchmark model/effort wins; retain sanitized fingerprints and limitations.

Map documented command-base/optional-argument shell patterns, path globs, domains and server/tool MCP rules to versioned fixtures. `--force` permits actions except explicit denials; it is not OS containment. The headless guide's no-force behavior and ask mode are not sufficient read-only security guarantees.

Configure unattended trust/permission behavior before spawning. Verify native sandbox controls against the role and platform instead of assuming their labels establish protection. If prompts cannot be eliminated or required restrictions cannot be enforced, return the typed unsupported/headless failure before launch.

Planner and judge use the parent role-specific input/protected-root policies through the same native adapter. Protect authoritative artifact and input roots, allow only declared scratch/engine records, and test writes through shell commands as well as file tools. Traversal/symlink escape attempts must fail; a transcript permission assertion alone is insufficient.

M03 default-model authentication verification may perform its consented, fixed minimal diagnostic call: no explicit model/effort, all tools/file access denied, one spawn at most and a short deadline. If those restrictions cannot be established, return `headless_failed` before invocation. Keep `JobId`/`VerificationScope`; produce no benchmark result.

Before UI-judge readiness, prove image inspection for the selected model and installed CLI with the approved screenshot inputs and read-only protections. Documented image-path handling does not establish vision support for every model. Missing capability/evidence remains an actionable unavailable state.

## Output, measurement and identity

Use newline-delimited `stream-json` for progress when supported. Retain sanitized raw records and stderr with schema/version evidence, including unrecognized fields/types and truncation. Without partial streaming, assistant messages are message-level observations.

With `--stream-partial-output`, the reviewed headless contract distinguishes new assistant deltas by `timestamp_ms` present and `model_call_id` absent. A buffered pre-tool flush carrying both fields and a final flush carrying neither repeat content. Exclude those flushes from incremental accumulation while retaining raw evidence; select this rule by mode/version, never deduplicate legitimate repetition by text equality. [Headless streaming](https://cursor.com/docs/cli/headless)

Map actual fixture-proven `tool_call` started/completed variants to actions and preserve assistant/result records. `system`/`init` fields such as session, cwd, model display name, API-key source and permission mode are metadata, not the hidden model system prompt. A user-message echo is neither a second authored input nor proof of full context membership. [Output schema](https://cursor.com/docs/cli/reference/output-format)

Recognize a successful terminal result only with the applicable process/result contract. Failure can instead be nonzero exit, stderr or an incomplete/missing terminal record. Never infer success from an exit code alone, a partial assistant reply or a parse failure.

The documented `duration_api_ms` currently equals `duration_ms`; neither establishes generation-output stream duration. Stream timestamps and `model_call_id` alone cannot establish request completeness or the required generation clock/count scope. Emit `GenerationTimingObserved`/`RequestRosterObserved` only with evidence meeting the parent/M10 contracts. [Duration fields](https://cursor.com/docs/cli/reference/output-format)

The reviewed output does not establish exact native token usage, cost, reasoning or current-context counts. Unexposed values remain unknown, never character-derived tokens or zero cost. If a later proven schema reports cost, preserve exact decimal text, sanitized raw evidence and explicit/version-documented currency provenance; do not infer USD.

Keep count fidelity, label fidelity and request/window membership independent. Preserve actual scope, native or synthetic identity provenance, capture gaps and reset/compaction evidence; do not turn captured history into a current-context partition. Apply the context-model readiness gate through its existing owner; M05.8 neither runs classification nor adds a decision engine.

Every signal/log retains M05.1 engine scope, `InvocationId`, and applicable `RunUid`, `TrialRef`/`ResultId` or diagnostic identity. Watched-source nonces, native session/model-call IDs and model-generated identity-like text remain untrusted evidence; none can override engine bindings. Progress rendering and cost/accounting retain separate unknown states.

Extend `parse(record) -> Sequence[HarnessSignal]` and the owned format/golden fixtures with M10.1's `GenerationTimingObserved` and `RequestRosterObserved`; reuse the parent's declarations rather than an adapter-specific shape. Request-scoped `UsageReported` carries `request_key` and `token_policy_ref`, with explicit parent/detail inclusion and cumulative/delta/final overlap provenance. Timing points to acknowledged usage entry IDs for that exact request and token policy, preserving source clock/epoch/resolution and native-decode/proxy/measured-window basis. Emit complete roster evidence only for an evidenced terminal list covering the invocation and descendants. These are conditional parser contracts, not new vendor-capability claims; unsupported timing, request identity or detail categories remain unavailable. Native process duration, receipt arrival times and live-rate estimates cannot fill them.

Consume frozen `RequestedSettings.model_variant_ref`/resolved artifact/control evidence without changing the native model selector. Extend the existing version-specific formats/parser and exposure fixtures with `VariantObserved(VariantEvidenceV1)`: requested/ref linkage, reported or confirmed effective artifact/composition, proof coverage, source/version/time, full engine invocation/TrialRef/request scope and limitations. An alias echo is reported only; content, ancestry and creator claims remain independent. Unsupported native introspection yields unverified/unavailable, never a synthesized digest or model-response-based identification. Known conflict uses M05.1–2 `harness.model_rejected(reason=variant_mismatch)` and its stop/drain contract. Discovery/inspection cannot invoke inference, download/load weights or manage a model server.

**Route, comparison and profile interfaces.** Extend this adapter’s owned launch/parser/exposure/golden fixtures for **unverified custom-route gate**. Consume the M04 ResolvedAccessPlanV1 and ResolvedExistingAgentPlanV1 through managed_config/launch_spec, emitting only adapter-allowlisted structured fields; never evaluate an alias. Keep arbitrary OpenRouter/LiteLLM endpoint injection blocked/unverified until an exact installed supported interface passes qualification. Native model selection/editor API-key settings and other adapters cannot supply this evidence. Never emulate another harness behind Cursor’s cell. Implement the separate `route_qualification_spec(plan, workspace, managed_dir)` contract with the fixed fixture tool, exact model/effort, bounded disposable session and correlated streamed continuation, or return typed unsupported before spawn. Existing `verification_spec` remains default-model auth smoke with every tool denied and model/effort omitted. Emit RouteObserved with per-main/helper/request/attempt requested/resolved/effective states and evidence gaps; link variant evidence to the same sanitized source fact. Strict requires all_competitor_inference coverage, while primary_model_only is exploratory with helper usage still counted. Named existing profiles preserve optional inherited declarations unless explicit reviewed overrides change them; required role/isolation controls remain mandatory.

## Integrated requirements

R192, R193, R194 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R190 — [model variants, lineage and comparison](../MODEL-VARIANTS.md).

R173, R176 — [benchmark statistics](../BENCHMARK-STATISTICS.md).

R161, R162 — [context monitoring](../CONTEXT-MONITORING.md) and [decision engines](../DECISION-ENGINES.md).

R181, R183 — [benchmark modes](../BENCHMARK-MODES.md); [Cursor](../M05/08-cursor-adapter.md) and [OpenCode](../M05/09-opencode-adapter.md) registry contracts.

Register through M05.7's six-entry registry, and consume M05.2's `CompetitorInputs` and `TaskCommitProtocolRef` without changing authored bytes. Supply the separately frozen mandatory commit instruction for every attempted competitor task; trial setup and history capture stay in M05.2, compliance in M08. No adapter auto-commit, missing-commit repair invocation or extra benchmark stage is permitted. Add fixture launches for unborn/empty and synthetic-baseline/populated trials, one-shot T1 and multi-step prefix continuation, preserving common instruction bytes and invocation-scoped repository evidence. Keep M09's original provisioning/check branch and all vendor-version capability limitations.

## Acceptance and faults

**Route/profile acceptance:** Offline vectors cover separate default-auth/targeted-route launches, wrong protocol, dropped effort, helper drift, partial roster, conflicting response echoes, stale source/profile, synthetic secret redaction and unchanged originals. Route qualification success alone does not confirm hidden effective identity. Runtime mismatch drains durable evidence and uses configuration-scoped stop with original expected trials; no model/effort fallback or second retry loop. Installed/provider tests remain separate explicitly consented gates.

**Variant acceptance:** Add offline transcript/launch cases for no identity field, alias-only report, supported invocation-bound proof, changed adapter/runtime composition and mismatch before/during dispatch; retain exact version/distribution limitations and safe evidence. The shared M05 fixture runtime asserts no substitute/retry and correct affected TrialRefs. Fixture support is conditional; existing installed-version gates remain required.

Extend this adapter's existing offline parser suite with duplicate final/cumulative receipts, nested parent/subagent overlap, cached/reasoning inclusion, same source across distinct trials and unsupported timing/roster fixtures. An available timing fixture must bind its usage IDs and source clock exactly; missing output, mismatched clock/policy or undiscovered requests cannot produce complete Gen tok/s. Retain source/version proof or explicit unverified status in `evidence.json`; no installed or model call is required by these fixture additions.

Context fixtures must cover native-only capture, quoted role names, partial/truncated records, repeated source ranges versus repeated text at different positions, unavailable membership and compaction where the installed format exposes it. Unknown/version-unproven signals remain explicit gaps or unknowns; no new provider capability is inferred.

Run offline first:

```sh
pytest tests/harness/adapters/test_cursor.py
```

1. Launch goldens cover competitor/planner/judge/verification, clean/current, exact model and supported/omitted effort; paths with spaces/Unicode, empty/non-Git baselines, one-shot byte preservation and multi-step prefix inputs. Assert fresh sessions and absence of resume/continue/worktree/cloud/fallback controls or shell interpolation.
2. Provenance fixtures distinguish Cursor `agent`, proven legacy aliases and unrelated executables. Metadata/default/model-list/auth probes invoke no model, preserve personal config and distinguish missing, unsupported, offline, rejected and unknown facts; never leak API keys.
3. Policy fixtures enumerate all five personal-integration categories, project/managed precedence, auto-repaired config and secret sentinels. Missing controls block clean; explicit current retains rules/protections and frozen selection precedence without personal writes.
4. Permission fixtures cover denied file actions, shell-mediated writes, protected artifacts/inputs, scratch, traversal and symlink escapes. Unsupported headless/protected roles produce zero spawns. Verification omits model/effort and enforces its one-call/all-tools-denied contract.
5. Transcript fixtures cover message and partial modes, delta/pre-tool/final flush distinctions, legitimate repeated text, actual tool variants, auth/model/config rejection, permission blocks, malformed NDJSON, unknown fields, nonzero exit and missing/truncated terminal results. Preserve raw evidence without duplicate counting or false success.
6. Observation fixtures retain model display name separately, unknown usage/cost/context/reasoning, missing timing/request-roster evidence and currency provenance. Init metadata/user echoes cannot become hidden inputs or duplicate membership. Native IDs/nonces cannot rebind engine identities; no unavailable fact becomes zero.
7. Role fixtures exercise image-capability refusal, read-only judge inputs and planner payloads without extra tasks. Basic native observations stay usable when context classification/model readiness is unavailable; downstream analysis retains explicit gaps.

**Installed-version/platform gate:** run `tests/harness/adapters/test_cursor_installed.py` on macOS/Linux with exact binary/version/provenance. Reconcile current docs with installed help/status, then verify real role launches, clean/current controls, images where required, protected roots, fresh sessions, detach, deadlines, stop and process-tree cleanup. Actual model calls require explicit test consent; absent credentials/platforms remain unverified.

Record launch/output/config differences as unsupported or unverified capabilities, not silent adaptations. This specification performs no installation or inference and claims no passing installed matrix. Fixture conformance cannot certify the real CLI or its sandbox.

**UI boundary:** no screens. Supply Cursor policy rows, requested/effective settings and RunConfig, TaskBlocked, ModelRejected and RunIsolation data to M05.7/M11; append the harness consistently through shared M03/M04/M07/M15 projections.

**Pending parent obligations:** M05.7 registration/API/view integration; real M03/M04 discovery, M07 freezing, M11 lifecycle, M12/M16 role acceptance, M10 retained accounting/context and M15 navigation. Preserve the original four adapters and their gates; adding this child does not complete their integration or any runtime implementation.
