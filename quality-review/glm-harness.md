# glm-harness — support infrastructure

Reviewed both supplied Python files (168 lines total). This folder is an agent runner and terminal log viewer, not an inventory application; keep it outside the application ranking.

| Category | Grade / 5 | Comment |
|---|---:|---|
| Code quality | 2 | Small, readable tool dispatch and clear exact-match editing, but missing packaged inputs, incomplete process/error boundaries, and misleading confinement claims materially weaken the implementation. |
| Operator UX | 2 | CLI options, progress messages and a colored live feed are useful; setup is undocumented, the default viewer path is machine-specific, and failures can still culminate in `ALL_DONE`. |
| Reliability / reproducibility | 1.5 | Syntax is valid, but required task files are absent, runs reuse evidence paths, timeout limits are incomplete, and the viewer can mishandle Unicode offsets. |
| Shared benchmark protocol adherence | 1 | Preserving the entire conversation directly conflicts with the shared benchmark's fresh-session rule. Logs and task ordering partially support the workflow, but this is a different generation protocol. |
| Product visual design | N/A | No inventory interface exists; terminal presentation is assessed under operator UX. |
| Product accessibility | N/A | No browser interface exists; no terminal accessibility audit was performed. |
| Inventory business rules / T1–T6 feature delivery | N/A | This infrastructure generates applications; it does not implement their stock, cart or checkout rules. |

**Code quality:** The four explicit tools and single-match edit guard are easy to understand, but the code should not be treated as a confined or reproducible execution environment.

**UX:** The progress feed gives operators useful task, token and tool feedback; missing local inputs and weak failure signaling prevent a dependable out-of-box workflow.

**Business rules/spec adherence:** Inventory business rules are not applicable. Against the shared generation specification, the same-conversation design is a material deviation, even though that choice is explicitly advertised in this runner's docstring.

## Evidence and impact

Paths below are relative to the comparison workspace. Findings are from source inspection unless explicitly identified as validation.

| Severity | Evidence | Finding |
|---|---|---|
| High | `glm-harness/glm-harness.py:83`, `glm-harness/glm-harness.py:84` | The runner reads `tasks/00-project.md` and task files beneath its own folder. That directory is absent in the supplied artifact; only the two Python files are present. As packaged, it cannot reach the request loop without provisioning or changing that path. |
| High | `glm-harness/glm-harness.py:82`, `glm-harness/glm-harness.py:89`, `glm-harness/glm-harness.py:108`; `benchmark/tasks/00-project.md:5`; `benchmark/RUN-BENCHMARK.md:16` | One message history carries across all six tasks, while the shared rules require a new session with only filesystem state carried forward. This changes context exposure and benchmark comparability. The runner's own documentation is candid about its same-context behavior (`glm-harness.py:6`), so this is a protocol mismatch rather than an undisclosed implementation accident. |
| High | `glm-harness/glm-harness.py:8`, `glm-harness/glm-harness.py:33`, `glm-harness/glm-harness.py:43` | The claim that all tools are confined to WORKDIR is false. A shell working directory does not restrict absolute paths, parent traversal, network access or inherited environment access. The file helper checks lexical `abspath` without resolving symlinks, so an in-directory symlink can point outside the directory. This matters when running generated commands on an operator's machine. |
| Medium | `glm-harness/glm-harness.py:80`, `glm-harness/glm-harness.py:94`, `glm-harness/glm-harness.py:111` | The task deadline is checked only before an API call. A request can then block for up to two hours, followed by multiple tool calls without another deadline check. Shell commands have individual timeouts, but there is no process-group lifecycle management for descendants. The configured task limit is not a strict wall-clock ceiling. |
| Medium | `glm-harness/glm-harness.py:90`, `glm-harness/glm-harness.py:100`, `glm-harness/glm-harness.py:109`, `glm-harness/glm-harness.py:121`, `glm-harness/glm-harness.py:127` | Any response without tool calls ends with default status `done`, without checking truncation or validating task completion. Malformed response shapes can crash outside the request exception handler. Request failures allow later tasks to continue; snapshot exit codes are ignored; final `ALL_DONE` and normal process termination do not reliably mean success. |
| Medium | `glm-harness/glm-harness.py:24`, `glm-harness/glm-harness.py:31`, `glm-harness/glm-harness.py:91`, `glm-harness/glm-harness.py:102`, `glm-harness/glm-harness.py:119`, `glm-harness/glm-harness.py:124` | Reusing a work directory appends summary logs while overwriting task transcripts and snapshots. The docstring promises every request/response, but the transcript records response messages and truncated tool results, not complete outbound requests. No complete environment/config manifest or enforced clean run is supplied. These gaps limit replay and evidence integrity. |
| Medium | `glm-harness/watch-agent.py:18`, `glm-harness/watch-agent.py:21`, `glm-harness/watch-agent.py:40` | The viewer stores `len(line)` character counts and later passes them to text-file `seek`, whose offsets are not arbitrary character counts. Non-ASCII model output can cause duplicated/garbled reading or a decoding error on later polls. File truncation/rotation is also not handled. This is a static reliability finding, not a live-monitor reproduction. |
| Low | `glm-harness/glm-harness.py:73`, `glm-harness/watch-agent.py:4` | The system prompt always claims Linux, and the viewer defaults to a specific `/workspace/bench/runs/` path. These assumptions need operator adaptation on other machines. |

Strengths: Python standard library only; explicit CLI controls; fixed T1–T6 ordering; the original conversation's tool results are preserved in memory; exact-once text replacement rejects ambiguous edits (`glm-harness.py:54`); ordinary tool exceptions become feedback for the agent (`glm-harness.py:113`); task timing, output-token totals, snapshots and a readable viewer provide useful observability on fresh, correctly configured runs. T7 is not required of this local T1–T6 harness.

Validation: both files passed `ast.parse` and in-memory `compile`; confirmed the required `glm-harness/tasks` path is absent. Read the shared project specification and operator runbook. No supplied automated tests exist in this folder. No harness, watcher, model requests, network monitoring, SSH or paid inference was executed, and no source files or CI/CD were changed. API compatibility, actual timeout behavior, snapshot success and live log rendering therefore remain unverified.

```json
{"folder":"glm-harness","type":"support-infrastructure","scores":{"code":2,"operator_ux":2,"reliability":1.5,"protocol_adherence":1,"visual":null,"accessibility":null,"inventory_business_rules":null},"tasks":{"T1":"N/A","T2":"N/A","T3":"N/A","T4":"N/A","T5":"N/A","T6":"N/A"},"validation":{"python_ast_parse":"pass: 2 files","python_compile_in_memory":"pass: 2 files","required_tasks_directory":"absent","runtime":"not run"}}
```
