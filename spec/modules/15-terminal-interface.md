# M15 — Terminal user interface

Status: proposed requirements. [SPEC.md](../SPEC.md) is authoritative. This contract describes observable behavior, not an implemented interface or prescribed architecture.

## Purpose and interaction contract

The primary interface for AxBenchmark's Python terminal application is a TUI; the product neither requires nor uses tmux. It connects reusable or prompt-created benchmarks, selected harness/model configurations, measurements, independent LLM quality reviews, and interactive reporting. Other machines' results can join comparisons only against a matching template SHA-256. [R002, R011]

Users must be able to complete setup, approve custom tasks, observe every selected harness, inspect results, and export the report through the TUI. Provide keyboard navigation, visible shortcuts, mouse interaction, clear validation messages, and layouts that adapt to terminal size. Exact bindings, breakpoint dimensions, colors, and libraries are implementation choices. [R038, R135]

## Required views and actions

| View | Inputs, actions, and observable output |
|---|---|
| Home/library | Present the seven-task inventory benchmark as the default choice. Let users select templates, create or import them, manage revisions and revision-scoped saved configurations, reconnect to active runs, and inspect accumulated results. Use [M01](01-template-library-identity.md), [M09](09-default-inventory-benchmark.md), and [M17](17-zip-exchange.md) for these operations. [R029, R039] |
| Environment | Display discovered harnesses, model information, authentication readiness, runtimes, browser support, and hardware collectors. Identify unavailable prerequisites, provide installation/setup guidance, and expose recheck. Consume readiness from [M03](03-environment-readiness.md), catalog information from [M04](04-model-catalog.md), and collector availability from [M18](18-hardware-monitoring.md). [R029, R040] |
| Setup | Load and edit the selected template revision's run configurations and independent judge/weight selections. Keep task-template creation or revision separate from execution-setting edits, through [M16](16-custom-template-planning.md). [M07](07-run-configuration.md) supplies saved settings, launch validation, and freezing. [R041] |
| Execution | Show harness panels and queued, running, and completed configuration states, current tasks, elapsed time, logs, and available measurements, plus a live view of a selected configuration's current task. Run against the pinned template revision, execute its approved checks, and preserve evidence through the execution dependencies below. [R034, R042] |
| Results | Inspect local and imported results with machine and judge filters, task evidence, rankings, alternative weights, and ZIP/HTML export actions. Preserve template compatibility and judge grouping through [M02](02-retained-results-comparability.md); expose analysis through [M06](06-scoring-rankings.md). [R002, R043] |

## Setup and launch boundary

Selecting an already approved template reuses its frozen tasks without planner invocation or task regeneration. Custom authoring accepts the project prompt, project type, and empty-project or committed-repository baseline, then supports reviewing, editing, regenerating, approving, and saving tasks under M16. These are authoring actions, not edits to an active comparison. [R039, R041, R135]

Before launch, display the full setup from M07: pinned template identity, competitor harness/provider/model/effort entries, environment choices, independent judge, rubric, both weight sets, and execution settings. Complete validation and separately freeze the template and resolved launch configuration/original weights before execution. Multiple configurations per harness remain distinct. [R041, R034; M07 integration]

Expose the sequential setting corresponding to the CLI's `--jobs 1` through [M11](11-run-orchestration.md) and [M14](14-command-line-interface.md). M11 owns the default of one configuration per selected harness concurrently, up to four, same-harness queues, sequential tasks, and retained concurrency information. The TUI presents that policy consistently. [R042; R045 dependency]

## Live observation and lifecycle

When all four harnesses are selected and the terminal is sufficiently large, show four live panels in a 2×2 arrangement. On smaller terminals use a list/detail layout. Logs are scrollable and searchable; selecting a configuration reveals its task-level details. Resizing must leave those observation functions usable in the appropriate layout. [R038, R044]

From a selected configuration, in either layout, a live view shows its current task process: task, model, and effort as requested and as observed; the code being written in the configuration's workspace as it changes; the reasoning or reasoning summary the harness exposes, labelled as such; its actions; output tokens per second; and context use of the current conversation. Each value names its source: reported by the harness or endpoint, or measured from the output stream. Values the harness does not expose remain unavailable and are never estimated or filled in. Context use restarts with each task because every task is a new conversation. The live view is read-only: it sends no input, cannot pause or slow the process, and leaving it changes nothing in the run. Live rates and context use are observation aids, not retained [M10](10-measurements-cost.md) measurements. [R042, R044, R047]

Execution controls permit inspection, detachment, reconnection, and explicit stopping. They cannot change frozen prompts, selected models, or original weights, or inject implementation hints into an active comparison. Closing or detaching the TUI leaves execution running independently. Reconnecting observes existing work without restarting tasks; explicit stop targets a configuration or the whole benchmark and invokes M11 cleanup of child processes and application services. [R047; R046 dependency]

[M05](05-harness-execution-isolation.md) supplies headless harness execution; [M11](11-run-orchestration.md) supplies persisted lifecycle; [M08](08-verification-evidence.md) supplies approved-check outcomes and evidence; [M10](10-measurements-cost.md) and [M18](18-hardware-monitoring.md) supply measurements with scope and coverage. Present process outcomes, passed/failed/unverified checks, missing measurements, and [M12](12-quality-judging.md) grades distinctly. [R034, R042, R149]

## Validation, results, and failure behavior

With no supported harness installed, show an actionable error and block local planning/execution only. Library browsing, ZIP exchange, and saved-result reporting remain available. Environment recheck updates displayed readiness; unavailable collectors remain visible without becoming mandatory sensors. M03/M04 determine readiness and compatibility rather than the interface guessing support. [R029, R040]

Surface launch, authentication, verification, import-integrity, and scoring failures with the relevant dependency's explanation. Actual execution failures remain inspectable after reconnection; a disconnected interface alone is not an interruption. Invalid settings must not silently become valid substitutes. [R038, R042, R149]

Results consume retained records from M02. Both alternative weight sets use M06's validation, normalized preview, labeled alternatives, reset, and export behavior without replacing original weights or raw grades. ZIP actions invoke M17 validation; report generation/opening invokes [M13](13-standalone-html-report.md), displaying the report location. Reporting, exchange, and reweighting use retained data without additional model calls. [R043, R135; R096, R134 dependencies]

## Acceptance criteria

- Complete frontend and backend workflows, including an existing-repository baseline: author/approve when needed, configure, launch, observe all selected harnesses, inspect evidence/results, and export HTML. Reusing inventory or another approved template causes no planning call. [R002, R039, R041, R135, R149]
- Navigate all five views by keyboard with visible shortcuts and exercise mouse interaction. Resize a four-harness run between 2×2 and list/detail layouts; search and scroll logs and select task details in both. [R038, R040, R042, R043, R044]
- With no harness, verify the actionable block and continued library/exchange/saved-report access. Recheck after readiness changes; exercise invalid setup, authentication, failed/unverified checks, unavailable measurements, and rejected import states. [R029, R038, R040, R149]
- Open the live view of a running configuration in both layouts: the task header, code changes, exposed reasoning, actions, output tokens per second, and context use update while the task runs, each with its source. With a harness that reports no context or reasoning, those values show as unavailable. Leaving the view leaves the process, its timing, and its measurements unchanged. [R042, R044, R047]
- Detach, close, and reconnect without restarting tasks. Explicitly stop work and verify cleanup. Attempt prompt/model/original-weight edits and hint injection; none changes active inputs. [R034, R047]
- Filter matching local/imported results by machine and judge; verify displayed scores against M06 fixtures, alternative/reset behavior, preserved originals, and ZIP/HTML outputs without model calls. Verify primary operation requires no tmux. [R002, R011, R043, R135, R149]
