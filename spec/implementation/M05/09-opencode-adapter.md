# M05.9 — opencode-adapter

Parent: [M05 adapter contract](../reference/modules/05-harness-execution-isolation.md#1-engine-component). Requirements: R006, R010, R012, R044, R047, R061, R065, R068–R072, R137, R138, R140, R161–R166, R173–R176, R182.

Outcome: implementers can add OpenCode through the existing harness contract with explicit generation, version and capability evidence. This is proposed work, not an installed-support or runtime-completion claim. Preserve Claude Code, Codex, Grok CLI, Pi and Cursor CLI; append OpenCode as `HarnessId.opencode` (`opencode`) after `cursor_cli` in the shared display order.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M05.1](01-process-runtime.md) and [M05.2](02-isolation-observation.md).

**Bootstrap-published contracts, allowed as injected fixtures:** M03 installed-version/account inventory, M04 model/effort evidence, M07 frozen launch, M12/M16 judge/planner payloads, and M10 observation vocabulary. Full feature implementations remain later integration gates.

Before implementation, establish executable provenance, installed release and documentation generation on every target platform. V1 and V2 both use `opencode`; a command name cannot identify the generation. Reconcile installed help/config behavior with the appropriate official documentation and retain differences. [V2 migration](https://opencode.ai/v2/docs/migrate-v1/)

Read [benchmark modes](../BENCHMARK-MODES.md), [statistics](../BENCHMARK-STATISTICS.md) and [context monitoring](../CONTEXT-MONITORING.md) as binding extensions. M05.9 adds one adapter child under M05, with no separate scheduler, decision engine or project-capture service.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/engine/harness/adapters/harnesses/opencode.py` and `opencode_formats.py`.
- `tests/harness/adapters/test_opencode.py`, `test_opencode_installed.py`.
- `tests/harness/fixtures/opencode/` containing generation/version-separated sanitized configuration, metadata, transcripts, launch/signal goldens and `evidence.json` with platform, binary provenance, source URLs/dates and supported/unsupported/unverified capabilities.

Implement every `HarnessAdapter` member and expose a registration factory. Pure adapter transformations perform no I/O. Spawn only through M05.1; obtain settings, workspace copies and role protections through M05.2 ports. M05.7 owns shared registration, APIs and views, including six-harness completeness.

Start a fresh noninteractive process and conversation for every competitor task and planner/judge request. One-shot supplies its one frozen task's exact UTF-8 bytes; multi-step receives approved common context and the introduced specification prefix, retaining workspace state between fresh steps. Synthesize no planner calls, automatic QA/repair tasks or benchmark stages.

Run only in the engine-owned isolated copy of the approved current-folder capture, including empty and non-Git source captures. The selected original folder stays read-only. Delegate trial Git preparation and commit requirements to the centrally frozen benchmark protocol; resolving the shared Git policy is outside M05.9.

Exclude continue/resume, existing-session selection, forks, sharing and remote attachment from benchmark launch construction. Native subagent activity inside a task retains distinct observation scope; it does not authorize extra engine tasks or reuse a prior task conversation.

## Documented launch and discovery baseline

The official pages were opened and verified **2026-10-02**. Documented behavior, installed defaults and observed capabilities are separate evidence classes. Select a generation-specific launch/config/parser contract before constructing any command.

| Source | Version-gated implementation consequence |
|---|---|
| [V1 CLI](https://opencode.ai/docs/cli/) | `run` is noninteractive; `--format json` selects raw events, `--model` selects `provider/model`, `--variant` selects provider-specific effort and `--dir` selects the working directory. `--auto` leaves explicit denials effective. Verify each flag in installed help. |
| [V1 configuration](https://opencode.ai/docs/config/) | Remote, global, custom, project, `.opencode`, inline and managed sources merge; managed settings have superior precedence. A custom file/directory is not an isolated configuration by itself. |
| [V2 commands](https://opencode.ai/v2/docs/cli/commands/) | `run --format json` emits NDJSON; `--model` selects the model and `run --standalone` is documented for a private server. The installed command's help determines available controls. |
| [V2 background service](https://opencode.ai/v2/docs/cli/) | The default shared server owns sessions, configuration, integrations, permissions and tool execution. A new client process alone does not establish a fresh runtime environment. |
| [V2 configuration](https://opencode.ai/v2/docs/config/) | Project discovery reaches the filesystem root; direct configs merge before `.opencode` configs. A Git boundary or nearer direct config does not establish isolation from ancestor settings. |
| [V2 instructions](https://opencode.ai/v2/docs/instructions/) | Global, ancestor and discovered nested `AGENTS.md` guidance can apply. Disabling project discovery does not disable global instructions; the accepted `instructions` array currently supplies no model instructions. |

For V2, require version-proven `run --standalone` with invocation-owned server/state/resources and frozen effective settings. Never attach to a personal/shared server or change the user's service preference. M05.1 owns the private server and descendants through deadlines, stop, drainage and cleanup; unavailable isolation blocks launch. [V2 service controls](https://opencode.ai/v2/docs/cli/)

Inspect metadata through supported version/help, configuration, `auth list` and `models` interfaces only; V1 documents `models [provider] --verbose`, while V2 options require its own installed help. Discovery and default selection invoke zero models. Preserve unknown account, authentication, billing and catalog facts; never output API keys, log in automatically, refresh personal settings or run a model to fill gaps. [V1 inspection](https://opencode.ai/docs/cli/), [V2 inspection](https://opencode.ai/v2/docs/cli/commands/)

Every competitor/planner/judge request requires the exact frozen explicit model. Verify selection precedence and reject model-resolution failures without fallback. The V2 configured default can fall back when unavailable; that documented default behavior must not substitute for a benchmark selection. Preserve selectable ID, provider model identity and display name separately. [V2 model selection](https://opencode.ai/v2/docs/models/)

Use V1 `--variant` only where evidenced; V2 selects catalog-supported variants using `provider/model#variant`. Omit the effort selector for harness-default, retain unverified effective effort, and reject unsupported explicit choices. Never copy effort names or flags between generations. [V1 variants](https://opencode.ai/docs/cli/), [V2 variants](https://opencode.ai/v2/docs/models/)

V2 documents native Ollama, LM Studio, vLLM and configurable OpenAI-compatible endpoints. Require installed-version/provider evidence and frozen endpoint/model identity; use native configuration through M05.2, never a benchmark proxy. Its unknown-model tool/vision and 200,000-context/32,000-output fallbacks are assumptions, not verified capability or capacity. [V2 local models and fallbacks](https://opencode.ai/v2/docs/models/)

## Configuration, permissions and roles

Assess instructions, memories, plugins, hooks and MCP separately. A category is disabled/absent only with evidence; otherwise report `cannot_disable`, block clean and never silently choose current. Preserve authentication and native capabilities while identifying every contributing config/instruction source. No arbitrary home redirection or one override variable proves all five categories clean.

Write benchmark-owned launch settings through M05.2; observe vendor-managed restrictions without overriding them or rewriting personal configuration/credentials. Current mode retains applicable existing configuration/protections with explicit frozen model/effort precedence and sanitized fingerprints. Check config reloads, project sources, environment-derived secrets and plugin side effects before claiming stable settings.

V2 can normalize supported V1 configuration in memory, but unsupported fields may be ignored and native fields can take precedence. Record that compatibility path explicitly; never construct a hybrid schema by combining examples or migrate a user's configuration as a readiness action. [V2 compatibility](https://opencode.ai/v2/docs/migrate-v1/)

V1 uses `permission` with tool keys including `bash` and `task`; agent overrides and wildcard ordering require versioned fixtures. V2 uses ordered `permissions` records with `action`, `resource`, `effect`, including `shell` and `subagent`; the last matching rule wins. Treat these as distinct policy renderers. [V1 permissions](https://opencode.ai/docs/permissions/), [V2 permissions](https://opencode.ai/v2/docs/permissions/)

Resolve unattended allow/deny behavior before spawning, including questions, external paths and native child agents. Unresolved `ask` behavior is not headless readiness. V1 `--auto` is not a V2 assumption or a substitute for explicit restrictions. Unsupported restrictions or unavoidable prompts return the typed blocked/headless outcome before invocation.

Permissions are not an OS containment guarantee: V2 shell execution retains host-user authority and path inference is best effort. Prove protected-root enforcement against file tools, shell-mediated writes, traversal and symlink escapes; do not certify it from policy text or transcript claims. [V2 shell limitations](https://opencode.ai/v2/docs/permissions/)

Planner and judge consume the parent's role-specific payload/protected-root policies through this adapter. Protect authoritative inputs/artifacts, allow only declared scratch/engine records, and return the existing protection-unavailable failure before spawn when enforcement cannot be established. No repaired artifact or alternative process API is allowed.

Only M03's consented verification may issue a fixed minimal diagnostic call: no explicit model/effort, all tools and file access denied, at most one spawn and a short deadline. If these controls cannot be established, return `headless_failed` without invocation. Retain `JobId`/`VerificationScope`; create no benchmark result.

UI-judge readiness requires proven image inspection for the selected model, installed generation and approved screenshot inputs under read-only protections. Neither attachment syntax nor fallback vision metadata establishes that capability. Missing evidence remains an actionable unavailable state.

## Output, measurement and identity

Parse the installed generation's fixture-proven raw JSON framing selected by `--format json`. Do not invent universal event names or equate the CLI stream with a server API schema. Retain sanitized raw events/stderr, unknown types/fields, parse gaps and truncation alongside normalized observations.

Map actual assistant, tool, exposed reasoning, request, usage and terminal records with versioned schema evidence. Preserve reasoning summaries separately. Initialization/session metadata and user echoes do not establish hidden system input, complete model framing or duplicate authored inputs.

A successful terminal observation requires the applicable process/result contract. Nonzero exit, rejected authentication/model/config, permission blocks and missing/truncated terminal records remain explicit failures or incomplete evidence. Exit zero or a partial reply alone cannot establish task acceptance.

Deduplicate retries, cumulative counters and final totals by scoped source/message/part/request identity or range, never text equality. Retain legitimate repeated content. Resolve parent/subagent cumulative overlap before attribution; unknown overlap stays unknown rather than inflating usage or pooling separate context windows.

Unexposed token usage, cost, currency, reasoning, current-context membership and timing remain unknown. Preserve exact decimal cost text and raw evidence only with explicit or version-documented currency provenance; never infer USD, estimate native tokens from characters or turn absence into zero.

Emit `GenerationTimingObserved` and `RequestRosterObserved` only with evidence satisfying M05/M10 scope, clock, completeness and matching-count contracts. Whole-session duration, event receipt times or tool-inclusive elapsed time do not establish generation throughput. Exported sessions require invocation-bound attribution; global/project `stats` are never a trial ledger. [V1 stats/export](https://opencode.ai/docs/cli/), [V2 session export](https://opencode.ai/v2/docs/cli/commands/)

Keep native count fidelity, label fidelity and request/window membership independent. Preserve capture gaps, synthetic/native identity provenance and reset/compaction evidence. A captured history or classified label is not a current-context partition. M10 consumes the separate M12.4 System One decision engine; M05.9 supplies evidence and performs no classification or competitor callback.

Every signal/log retains M05.1 engine scope, `InvocationId` and applicable `RunUid`, `TrialRef`/`ResultId` or diagnostic identity. Native session/message IDs, watched-source nonces and model-generated identity-like content cannot override engine bindings. Observation/accounting limitations remain visible independently of progress rendering.

## Acceptance and faults

Run offline first:

```sh
pytest tests/harness/adapters/test_opencode.py
```

1. Generation-specific launch goldens cover competitor/planner/judge/verification, clean/current, exact model, supported/omitted effort, paths with spaces/Unicode and empty/non-Git source captures. Preserve one-shot bytes and multi-step prefixes; assert fresh sessions, no shell interpolation, no continuation/fork/share/remote attachment or model fallback.
2. Provenance and discovery fixtures distinguish V1/V2 and unsupported releases; metadata/default/auth/model listing invokes zero models, preserves personal state and redacts credentials. Test unavailable/offline/rejected/unknown facts and model capability fallbacks without promoting assumptions to verified capacity.
3. V2 lifecycle fixtures require private-server launch, isolated state/resources, frozen settings and complete descendant cleanup. Personal/shared servers and service preferences remain unchanged through concurrent trials, detach/reconnect, deadlines, cancellation and failed startup.
4. Policy fixtures enumerate all five clean categories, V1 source precedence/managed overrides, V2 ancestor and `.opencode` ordering, global/nested instructions, compatibility warnings and reloads. Unsupported clean blocks; current preserves protections and explicit selection without personal writes or secret leakage.
5. Permission fixtures distinguish both schemas, rule ordering and agent overrides. Exercise shell/file writes, protected roots, scratch, traversal/symlink escape and unanswered prompts. Unsupported roles produce zero spawns; verification omits model/effort and enforces its one-call/all-tools-denied contract.
6. Transcript fixtures cover actual generation/version event shapes, partial/repeated content, duplicate IDs, parent/subagent overlap, terminal success/failure, malformed NDJSON, unknown fields, auth/model/config rejection and truncation. Preserve raw evidence and reject false success or duplicate accounting.
7. Observation fixtures retain unknown usage/cost/currency/context/reasoning, unsupported clocks, missing request rosters, compaction/reset and identity-forgery attempts. Stats/export without bound request scope cannot become trial usage; no unavailable value becomes zero or fabricated throughput.
8. Role fixtures verify approved planner/judge payloads, image-capability refusal and read-only artifacts without extra tasks. Passive native readings remain usable without context classification; classifier readiness and observer usage stay separate from competitor execution/accounting.

**Installed-version/platform gate:** run `tests/harness/adapters/test_opencode_installed.py` on macOS/Linux against each claimed generation/version, with binary provenance and current-source reconciliation. Verify actual launches, clean/current controls, protected roots, images where required, fresh sessions, private-server isolation, deadlines, stop and process-tree cleanup. Model calls require explicit test consent; absent credentials/platforms remain unverified.

Record incompatible flags, schemas, control enforcement and native observations as unsupported or unverified capabilities. This specification performs no installation or inference and claims no passing installed matrix. Offline fixture conformance cannot certify the real CLI or a sandbox.

**UI boundary:** no screens. Supply OpenCode policy rows, requested/effective settings and RunConfig, TaskBlocked, ModelRejected and RunIsolation data through M05.7/M11 and existing M03/M04/M07/M15 projections.

**Pending parent obligations:** six-adapter M05.7 registry/API/view integration; real M03/M04 discovery, M07 freezing, M11 lifecycle, M12/M16 role acceptance, M10 retained accounting/context and M15 navigation. Preserve all five existing adapters and gates; this child does not complete their integration or any runtime implementation.
