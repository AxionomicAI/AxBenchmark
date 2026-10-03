# M05.6 — pi-adapter

Parent: [M05 adapter contract](../reference/modules/05-harness-execution-isolation.md#1-engine-component). Requirements: R010, R012, R044, R047, R061, R065, R069–R072, R137, R138. Findings: F06 scoped records and the recommendation’s explicit unsupported-setting/observation gate for Pi.

Outcome: Pi implements the same harness contract while preserving provider-specific unknowns and limitations. Proposed work; no current distribution, CLI syntax or provider capability is assumed.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M05.1](01-process-runtime.md) and [M05.2](02-isolation-observation.md).

**Bootstrap-published contracts, allowed as injected fixtures:** M03 version/account inventory, M04 catalog/effort evidence, M07 frozen entries and M12/M16 role payloads. Full feature services are later integration gates.

Identify executable/package provenance and exact installed version first. Open the selected Pi distribution’s current official documentation/maintainer repository for headless mode, provider/model/effort selection, permissions, settings/integrations, output and non-model discovery. Record official source URLs/date and version applicability; never infer capabilities from another product named Pi.

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

Prove permission behavior is headless before launch; unsupported prompting restrictions remain explicit. Verification must deny all file/tool actions and omit model/effort, or return diagnostic failure without launching.

Implement inspection/model/default readings only through documented non-model sources. Unsupported discovery stays unsupported and missing auth/account/billing facts remain unknown; a model call must never fill inspection gaps.

Parse actions, reasoning/summaries, usage, context, rates and settings only when exposed. Preserve provider-specific cumulative/final markers and raw sanitized evidence; never estimate tokens from characters or cost from a provider name.

All durable output uses M05.1 scopes/ids, including explicit competitor/judge result/trial and diagnostic `JobId`/`VerificationScope`. Adapter output cannot change that binding.

Preserve `UsageReported.cost` as exact decimal text plus raw sanitized observation, explicit harness currency or version-documented adapter currency contract and evidence reference. Missing currency provenance remains unknown; never infer USD. Apply the parent judge-root permissions through the same launch adapter: protected artifact/input roots, writable scratch/engine records only, or block before launch.

## Acceptance and faults

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
