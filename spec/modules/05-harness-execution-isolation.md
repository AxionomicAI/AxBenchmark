# M05 — Headless harness execution and isolation

Status: proposed requirements derived from [SPEC.md](../SPEC.md), not a description of implemented behavior.

## Purpose and boundary

This module enables engineers to implement comparable, unattended planner, competitor, and judge invocations through supported locally installed harnesses. Every model invocation runs headlessly. Configured cloud providers and local model endpoints are usable through harnesses that support them; endpoint location does not change the execution protocol. These contracts prescribe observable behavior, not an internal architecture, harness switches, or supported version matrix. [R010, R012]

## Invocation behavior

Each competitor task starts a fresh process and conversation. Supply the shared approved specification and that task's prompt; do not resume or replay an earlier task's conversation. The configuration's workspace files carry state between tasks. Every configuration receives the same approved sequence, including final QA when present. Cloud and local configurations receive equal opportunities to implement, verify, and fix their work. [R069, R140]

Planner requests carry the planning inputs defined by [M16](16-custom-template-planning.md). Judge requests carry the artifact and evidence defined by [M12](12-quality-judging.md), including its fresh-session requirement. Their distinct payloads do not create exceptions to headless execution. [R012]

Honor the selected harness, provider, model, and effort. Explicit effort choices must be known supported choices supplied by [M04](04-model-catalog.md). Unknown effort support permits a harness-default choice: omit an explicit effort argument instead of guessing a value or supported list. Preserve requested settings separately from effective settings exposed by the harness. Unexposed effective effort remains unverified; successful process startup does not verify it. A failed request must not silently switch models. [R010, R065]

## Environment and baseline contract

Each configuration starts from an independent copy of the same packaged baseline. For existing-repository templates, M16 captures the selected committed revision, defaulting to HEAD, explains that uncommitted changes are excluded, and leaves the original repository untouched. Execution, including later runs and imported templates, consumes that packaged snapshot; it never resolves HEAD or another moving branch again. Existing sources and historical benchmark applications, results, and reviews remain untouched. [R068, R140]

Provide independent workspaces, service ports, test data, and browser contexts for configurations, including different configurations of the same harness. Configure headless permission handling before launch. A blocked action must produce an explicit outcome, never an unanswered prompt that hangs execution. Isolation applies during both parallel and sequential scheduling. [R072, R138]

Clean mode is the default. Retain required authentication and provider access while disabling personal instructions, memories, plugins, hooks, and MCP integrations through supported controls. Preserve native harness behavior; do not selectively block a harness's native capabilities as an undocumented comparison adjustment. Record managed settings and isolation limitations. When clean mode cannot be established, explain the limitation explicitly and never silently fall back to current mode or describe incomplete isolation as clean. [R070]

Current mode uses the user's existing harness configuration, with explicit benchmark model and effort selections taking precedence. Record a sanitized description or fingerprint of relevant settings so readers can identify the configured harness being measured without exposing credentials. Current mode must be an explicit selected policy. [R065, R071]

## Conceptual request and result contracts

These are information contracts, not required serialization formats or interfaces.

| Contract | Required information and behavior |
|---|---|
| Invocation request | Role; run/configuration and task or artifact identity; approved role-specific inputs; selected harness/provider/model/effort; environment policy; configuration workspace and runtime resources; preconfigured permission behavior. The caller supplies frozen selections from [M07](07-run-configuration.md). [R010, R012, R065, R069, R072] |
| Established environment | Packaged baseline identity, independent resources, selected clean/current policy, sanitized relevant settings, and managed or isolation limitations. State what was established rather than implying unsupported guarantees. [R068, R070, R071, R072] |
| Invocation result | Process outcome and diagnostic evidence, requested settings, observable effective settings, environment description, logs, and artifact/snapshot references. Keep unavailable effective settings explicit. Supply process ownership and lifecycle observations needed for cleanup and persistence. [R065, R137, R138] |

Process results are separate from executable acceptance outcomes owned by [M08](08-verification-evidence.md), measurements owned by [M10](10-measurements-cost.md), and quality reviews owned by M12. A zero exit status alone does not establish task success.

## Failures and lifecycle integration

[M03](03-environment-readiness.md) and M04 provide readiness and capability evidence. With no supported harness installed, prevent local planning/execution and surface an actionable error while retaining library browsing, import/export, and saved-result access. Preserve honest distinctions between discovery, cached or bundled offline information, unsupported settings, and authentication failures; discovery is not proof of successful authentication. [R137]

[M11](11-run-orchestration.md) schedules one configuration per selected harness concurrently by default, up to four; additional configurations within each harness and tasks within a configuration run sequentially. M05 must also support the sequential setting and fully specified unattended launches from [M14](14-command-line-interface.md). Interface detachment or closure does not terminate invocation processes, and reconnecting observes existing work without restarting tasks. Explicitly stopping a configuration or benchmark cleans up its child processes and application services. Report failures, interruption, and cleanup outcomes to persistent lifecycle state; apply M11's continuation and timeout rules. [R138]

## Acceptance criteria

- Planner, competitor, and judge invocations complete or fail without interactive sessions. Cloud and local endpoint configurations follow the same approved task and QA sequence. [R010, R012, R069, R138]
- Two successive tasks use distinct processes and conversations; the second receives shared specification, current prompt, and accumulated workspace files. Two configurations start from equivalent independent baseline copies. [R068, R069, R140]
- Unknown effort support produces no explicit effort argument. Requested and exposed effective values remain distinguishable, and failures never substitute another model. [R065]
- Clean mode disables all listed personal integration categories through supported controls, preserves authentication/native behavior, and reports limitations. Current mode honors explicit model/effort overrides and retains sanitized settings evidence. [R070, R071]
- Concurrent configurations cannot share application ports, mutable test data, or browser contexts. Blocked permissions return explicit outcomes without pending prompts. [R072]
- Parallel defaults, additional configurations, sequential mode, unattended execution, detach/reconnect, and explicit-stop cleanup satisfy M11/M14 integration behavior. Missing harnesses block execution while data-only functions remain available. [R137, R138]
- A later run uses the packaged baseline after the original branch advances; source repositories and historical artifacts remain unchanged. [R068, R140]
