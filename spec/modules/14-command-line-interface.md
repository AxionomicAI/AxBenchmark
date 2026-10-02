# M14 — Command-line and unattended access

Status: proposed requirements. [SPEC.md](../SPEC.md), especially Command-line access and the execution acceptance criteria, remains authoritative. This module defines the CLI contract for engineers implementing terminal entry points; it does not describe existing functionality.

## Purpose and command contracts

The CLI opens the primary TUI and exposes unattended execution, observation, discovery, reporting, and exchange. CLI and TUI actions delegate to the same underlying contracts. The signatures below are required interface contracts, not executable examples; their placeholders identify the requested run, retained directory, template revision, or package. [R048–R059, R138]

| Required signature | Input, outcome, and delegated validation |
|---|---|
| `axbenchmark` | Open [M15's TUI](15-terminal-interface.md), including library/setup access and readiness feedback. No subcommand is required to choose this default interface. [R048] |
| `axbenchmark --attach RUN_ID` | Select an existing running benchmark and observe its current work through M11. Reconnection does not launch another run or restart tasks. [R049; R046 dependency] |
| `axbenchmark run --config benchmark.yaml --no-tui` | Read the fully specified run configuration, apply M07 launch validation, and execute with plain terminal progress. Missing choices cannot cause interactive questions. [R050, R060] |
| `axbenchmark status RUN_ID` | Select a run and display its persisted status, including saved execution failures; status must not depend on an attached TUI. [R051, R060] |
| `axbenchmark stop RUN_ID` | Explicitly stop the identified run through M11, cleaning up its child processes and application services. Closing an interface is a separate action. [R052; R046 dependency] |
| `axbenchmark models refresh` | Request model and effort discovery through M04, preserving its last valid catalog on refresh failure and preserving user overrides. [R053; R063, R064 dependencies] |
| `axbenchmark doctor` | Inspect prerequisites through M03 and display actionable setup guidance, including distinct collector availability failures without making optional sensors mandatory. [R054; R103 dependency] |
| `axbenchmark report RUN_DIR` | Regenerate the report from the selected saved results through M02/M13, without model calls. The output is the standalone offline HTML report. [R055; R125, R134 dependencies] |
| `axbenchmark templates export TEMPLATE_SHA --output template.zip` | Select the exact template revision by SHA-256 and export its complete portable definition through M01/M17. [R056; R115 dependency] |
| `axbenchmark templates import template.zip` | Validate the package and recompute template identity before adding it to the library through M17; invalid packages produce no partial registration. [R057; R117, R120 dependencies] |
| `axbenchmark results export RUN_ID --output results.zip` | Export the selected run's records, required evidence, provenance, and exact referenced template through M02/M17. [R058; R116 dependency] |
| `axbenchmark results import results.zip --template TEMPLATE_SHA` | Select the local revision and add results only after M17 recomputes and validates both embedded and local template identities, declared identity, payload digests, references, and task identifiers. [R059; R120 dependency] |

## Unattended execution and lifecycle

[M07](07-run-configuration.md) supplies complete resolved launch settings: pinned template, competitor configurations, environment settings, judge, and both weight sets. Validate and freeze these using the same contracts as interactive launch. Incomplete or invalid unattended settings require a useful explanation instead of a prompt or execution with unresolved choices. [R050, R060; R033, R066, R067 dependencies]

[M05](05-harness-execution-isolation.md) runs every planner, competitor, and judge invocation headlessly. Multiple configurations per harness remain supported. [M11](11-run-orchestration.md) defaults to one configuration per selected harness concurrently, up to four; additional configurations within a harness queue sequentially, and tasks within each configuration always remain sequential. Expose the source option `--jobs 1` and its equivalent TUI setting through M11, with scheduling and concurrency retained in results. [R138; R012, R045 dependencies]

Execution outlives its observing interface. Closing, detaching, or disconnecting must not stop work or manufacture an interruption. Reattachment observes existing execution without replay; actual execution failures remain visible in saved state and subsequent status. Explicit stopping invokes lifecycle cleanup. These actions do not add automatic retry or resume behavior. [R049, R051, R052, R060, R138; R046, R077 dependencies]

## Shared validation and failure boundaries

[M03](03-environment-readiness.md) determines readiness: with no supported harness, block local planning/execution with actionable guidance while retaining library, package exchange, and saved-result reporting. [M04](04-model-catalog.md) owns discovery, supported efforts, offline catalog fallback, and refresh failures; the CLI must not invent compatibility or substitute models after failure. [R050, R053, R054, R055–R059; R029, R063–R065 dependencies]

[M01](01-template-library-identity.md) owns immutable identity and [M17](17-zip-exchange.md) owns package safety and atomic validation. Imports are data operations: no scripts, dependency installation, model calls, or modification of existing results. Reject unsafe, corrupt, incomplete, unsupported, mismatched, or conflicting packages without partial additions. Show expected and received identities on mismatch; identical reimports remain idempotent. [R057, R059; R117, R120–R122 dependencies]

[M02](02-retained-results-comparability.md) supplies preserved results and provenance for status, exports, and reporting. [M13](13-standalone-html-report.md) regenerates offline HTML from that evidence without fresh judging, attempts to open the report, and always displays its location. Preserve unknown measurements and original records rather than inventing missing results. [R051, R055, R058; R080, R116, R125, R134 dependencies]

## Acceptance criteria

- Exercise all twelve signatures: each selects its documented target and delegates to its named operation. Bare invocation opens the TUI; fully specified unattended invocation presents plain progress without interactive questions. Incomplete configuration receives validation feedback. [R048–R060]
- Run multiple configurations across harnesses, then use sequential mode: observe M11's concurrency, same-harness queues, sequential tasks, recorded scheduling, and headless model work in both interface paths. [R138; R045 dependency]
- Close and reconnect during execution without restarting tasks. Inspect persisted status after a real failure; distinguish it from disconnection. Explicitly stop a run and verify child-process and application-service cleanup. [R049, R051, R052, R060, R138]
- Refresh discovery with a failing provider and inspect prerequisites without a harness; verify retained catalog/overrides, actionable guidance, and continuing data-only access. [R053, R054; R029, R063, R064 dependencies]
- Export/import an exact template and its run results; validate recomputed identities and payloads, rejection without partial additions, idempotence, and absence of execution during import. Regenerate saved HTML without model calls and open it offline. [R055–R059; R117, R120–R122, R125 dependencies]
