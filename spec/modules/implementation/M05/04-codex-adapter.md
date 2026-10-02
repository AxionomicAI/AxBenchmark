# M05.4 — codex-adapter

Parent: [M05 adapter contract](../../05-harness-execution-isolation.md#1-engine-component). Requirements: R010, R012, R044, R047, R061, R065, R069–R072, R137, R138. Findings: F06 scoped records and the recommendation’s explicit current-official-documentation gate for Codex.

Outcome: Codex implements the complete adapter contract without assuming that a CLI flag or personal setting is available in every release. Proposed work; no current OpenAI recommendation, switch or support matrix is asserted here.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M05.1](01-process-runtime.md) and [M05.2](02-isolation-observation.md).

**Bootstrap-published contracts, allowed as injected fixtures:** M03 installed-version/account schema, M04 selection/effort evidence, M07 frozen launch, M12/M16 judge/planner payloads. Full feature implementations remain later integration gates.

Before implementing or changing controls, inspect installed executable provenance/version and open current official OpenAI Codex documentation. Verify noninteractive execution, configuration precedence, permission/sandbox controls, model/effort selection, structured output, auth inspection and model/default discovery. Retain exact source URLs/date and applicability; distinguish documented controls from observed installed behavior.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/engine/harness/adapters/harnesses/codex.py` and `codex_formats.py`.
- `tests/harness/adapters/test_codex.py`, `test_codex_installed.py`.
- `tests/harness/fixtures/codex/` with sanitized configuration/status/transcripts, expected launch/signals and version/platform/source `evidence.json`.

Implement every `HarnessAdapter` member and expose a registration factory. Use M05.1 process ownership and M05.2 settings/workspace ports; never execute shell commands or read user files inside pure adapter methods.

Build a fresh noninteractive invocation for every role/task, using exactly the explicit model/provider and M04-frozen effort argument. No model-default shortcut for benchmark roles, no fallback setting and no resume/replay path is allowed.

Assess instructions, memories, plugins, hooks and MCP independently against the exact installed release. A separate config directory alone is not evidence that every category is disabled. Document supported controls and managed-policy limitations; missing controls yield `cannot_disable`.

Current mode preserves user configuration while explicit benchmark model/effort wins. Clean mode retains required auth/provider access and records precisely which configuration sources remain active. Neither mode rewrites personal configuration.

Translate permission outcomes from verified controls. If headless prompting cannot be disabled, launch is unsupported; if verification cannot deny every tool/file action, that diagnostic fails before spawn. Do not claim OS containment solely from a CLI label.

Inspection/default-model reads must use documented non-model configuration/status interfaces. If a version exposes no model-list interface, return unsupported to M04 rather than probe with a model call or infer a list from another version.

Parse only evidenced output schemas. Effective model/effort is observed only when actually reported; startup success never verifies effort. Keep reasoning summaries labelled, unavailable context/rate explicit, usage cumulative/final markers intact and provider cost as reported.

Use M05.1’s request scope on every signal/log. Any model-generated identity-like text remains untrusted output, never a run/trial/result or diagnostic job key.

Preserve `UsageReported.cost` as exact decimal text plus raw sanitized observation, explicit harness currency or version-documented adapter currency contract and evidence reference. Missing currency provenance remains unknown; never infer USD. Apply the parent judge-root permissions through the same launch adapter: protected artifact/input roots, writable scratch/engine records only, or block before launch.

## Acceptance and faults

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

**Pending parent obligations:** M05.3/M05.5/M05.6, M05.7 real integration, M03/M04 inspection, M11 lifecycle and M12/M16 role acceptance. Neither official documentation alone nor transcript tests complete installed-version verification.
