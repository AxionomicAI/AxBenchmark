# Context-analysis design handoff

The next design pass adds the context-window analysis surfaces below. Read in this order; these contracts take precedence over the old illustrative fixtures.

| Read | Purpose |
|---|---|
| [CONTEXT-MONITORING.md](CONTEXT-MONITORING.md) | ContextDetail behavior, current-window versus stream history, exactness/classification/membership labels, scope selectors, pending/partial states and retained analysis. |
| [DECISION-ENGINES.md](DECISION-ENGINES.md) | Shared System One profiles, independent monitoring/grading choices, local deferral and disabled features when no compatible engine is configured and ready. |
| [M07 setup](reference/modules/07-run-configuration.md) | DecisionEnginesScreen/profile editor, setup entry routes, engine testing, role bindings and capability-based controls. |
| [M10 measurements](reference/modules/10-measurements-cost.md) and [M10.3 UI slice](M10/03-measurement-screens.md) | ContextDetail and Measurements entry point, engine DTOs, counts, status labels, keyboard behavior and owned presentation files. |
| [M11 live-run screens](M11/05-run-screens.md) and [M11 orchestration](reference/modules/11-run-orchestration.md) | HarnessLive entry point, selected trial/session/agent/window, live subscriptions and stale-response handling. |
| [BENCHMARK-STATISTICS.md](BENCHMARK-STATISTICS.md), [M06 rankings](reference/modules/06-scoring-rankings.md) and [M13 report](reference/modules/13-standalone-html-report.md) | Adjacent Gen tok/s, In/Out tok and Files/LOC columns, optional ranking weights/directions and offline presentation. These statistics are distinct from current-window occupancy and decision-model grading. |
| [navigation.md](reference/design/wireframe-tui/navigation.md) and [ownership-ledger.md](reference/design/wireframe-tui/ownership-ledger.md) | Existing interaction conventions, ownership, routes and the distinction between rendered boards and contract-only states. |

Existing prototype entry files are [screens-run.mjs](reference/design/wireframe-tui/src/screens-run.mjs) (`harnessLive`), [screens-measure.mjs](reference/design/wireframe-tui/src/screens-measure.mjs) (Measurements), and [screens-setup.mjs](reference/design/wireframe-tui/src/screens-setup.mjs) (Setup). Coordinate board registration and ownership through [boards.mjs](reference/design/wireframe-tui/src/boards.mjs), [ownership.mjs](reference/design/wireframe-tui/src/ownership.mjs) and their imported catalogs. Read [M15](reference/modules/15-terminal-interface.md) for shared shell, focus and disabled-action conventions.

Required design states: no engine configured; configured but unavailable/unverified; ready text-only versus vision-capable profile; independent role disabled/selected; local classification deferred; active/complete/partial/failed analysis; low-confidence/unclassified and unexposed content; compaction/reset; separate nested-agent windows; retained/imported history with inference disabled. The Configure decision engine action remains available when analysis/grading controls are disabled. Saved analyses remain readable, and basic native readings/statistical rankings remain available without a decision model.

Show native counts, inferred labels and context membership separately. Do not render unknown values as zero or force partial category shares to 100%. Keep capture/snapshot/analysis scope and cutoff visible; do not combine a current native total with classification from a different snapshot. Add both wide and 80×24 layouts with keyboard/focus/resize states. Use engine capability and calculation projections; widgets never implement readiness, score, token or percentage rules.

Rendered: the HarnessLive context-window sub-window (`HarnessLive`, `HarnessLiveLimited`, `HarnessLiveContextOff`), `ContextDetail` (wide and 80×24), `ContextDetailHistory`, `ContextDetailDeferred`, `ContextDetailFailed`, `ContextDetailReset`, `ContextDetailImported`, `ContextDetailRetained`, `DecisionEngines` (wide and 80×24), `DecisionEnginesEmpty`, `DecisionEnginesLocal`, `DecisionEnginesMissing`, `DecisionEngineEdit`, `DecisionEngineTest`, `DecisionEngineTested`, `SetupNoEngine`, `SetupGradingTextOnly` and the role lines in launch review, all in the animated walkthrough. Still contract-only: vision-image grading review screens (M12.3), loading/error variants of the decision-engine list and resize transitions; these static boards do not validate API behavior.

From `spec/`, run the existing documentation checks after changing the prototype:

```sh
node implementation/reference/design/wireframe-tui/src/build.mjs
node implementation/reference/design/wireframe-tui/src/animation.mjs
node implementation/reference/design/wireframe-tui/src/verify.mjs
```
