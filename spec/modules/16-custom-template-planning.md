# M16 — Custom template planning and baseline capture

Status: proposed feature contract. [The product specification](../SPEC.md) remains authoritative. This module enables an engineer to implement and verify creation of reusable custom benchmark work without modifying the user's source project.

## Purpose and boundaries

Support frontend, backend, and fullstack benchmarks, each either building a new project or modifying a snapshot of an existing local Git repository. Planning produces work that users can review and approve before competitors receive it. Selecting an already approved built-in, imported, or custom template instead reuses its frozen tasks and skips planning entirely. **[R007, R030, R031]**

The surrounding library retains the existing seven-task inventory benchmark as its default, runnable without generating tasks. Users can create, duplicate, revise, and import other templates, with different saved run configurations for each. [Template library and immutable identity](01-template-library-identity.md) owns those library operations and revisions; [the inventory benchmark](09-default-inventory-benchmark.md) owns the built-in content; [run configuration](07-run-configuration.md) owns saved execution selections. Custom creation must integrate with these behaviors. **[R136]**

## Inputs, outputs, and operations

| Operation | Conceptual inputs | Required outcome |
|---|---|---|
| Choose existing work | An approved template revision | Reuse its frozen tasks without invoking the planner. **[R030, R031]** |
| Describe custom work | A multiline project prompt; frontend, backend, or fullstack type; empty project or existing repository revision | A custom planning request reflecting all three choices. **[R007, R030]** |
| Capture the starting point | Empty-project selection, or a local Git repository and selected committed revision | A baseline retained with the template; repository selection defaults to committed `HEAD`. **[R068]** |
| Select and invoke a planner | Harness, model, and effort selections using the precedence below | Generated specification, ordered tasks, acceptance checks, and setup/start/stop instructions. **[R031]** |
| Review and save | Generated content and user edits or regeneration requests | User approval followed by a saved reusable template containing the approved work. **[R031]** |

These are behavioral operations, not prescribed APIs or storage structures. Planner execution uses [headless harness execution](05-harness-execution-isolation.md); template identity and freezing use [M01](01-template-library-identity.md).

## Planner selection and review

Expose planner harness/model/effort selection. Preselect a valid previous choice. If no valid previous choice exists, preselect the first detected usable harness in the display order **Claude Code, Codex, Grok, Pi**, together with its discovered model and effort defaults. A detected but unusable harness does not win this fallback. [Environment readiness](03-environment-readiness.md) and [model discovery](04-model-catalog.md) supply availability, validity, and discovered defaults. These preselection rules are conveniences rather than model-quality recommendations. **[R031]**

Generate the project specification, tasks, acceptance checks, and setup/start/stop instructions for the chosen project type and starting point. Default to seven ordered tasks, with final verification and fixes included as the last task. Seven is a default for custom work; it must not be described as a mandatory count for every custom template. **[R007, R031]**

Let the user review, edit, or regenerate the proposed content before approving and saving it. Generation alone is not approval. The saved template supplies the approved inputs for future runs; choosing it later must not regenerate tasks or require a planner call. Revising or duplicating a template follows the library's revision behavior, while changing saved run configurations remains a separate operation. **[R030, R031, R136]**

## Baseline and approval invariants

For an existing repository, snapshot the selected committed revision, defaulting to `HEAD`. Clearly explain that uncommitted changes are excluded. Preserve the source repository untouched, including its uncommitted work; do not make source changes part of the snapshot merely because they are present locally. The retained baseline is the committed content selected during creation. **[R068, R140]**

Later runs and imports use the template's packaged baseline. They must never resolve a moving branch or `HEAD` again to recover starting files. Every configuration receives its own independent copy of that same baseline and identical approved inputs. Source repositories and historical benchmark artifacts remain untouched throughout the workflow. [Execution isolation](05-harness-execution-isolation.md), [portable exchange](17-zip-exchange.md), and [retained results](02-retained-results-comparability.md) consume this contract. **[R068, R140]**

An invalid previous planner choice falls through to the specified usable-harness selection. If readiness prevents local planning, follow the readiness module's failure behavior. A failed baseline capture or generation cannot stand in for the required captured baseline or approved generated content; failure states must be verifiable. Do not substitute the live working tree or silently regenerate approved work to bypass a failure. **[R031, R068, R149]**

## Acceptance criteria

1. Create frontend, backend, and fullstack templates from multiline prompts using both empty projects and committed local repository baselines; complete planning, review, approval, execution, and verification end to end. **[R007, R030, R149]**
2. With a valid previous planner selection, retain that preselection. Without one, vary detected usable harnesses and verify Claude Code → Codex → Grok → Pi precedence and discovered model/effort defaults. **[R031]**
3. Generated output includes the specification, acceptance checks, setup/start/stop instructions, and seven tasks by default, ending in verification/fixes. Review, edit, and regenerate actions are available before approval and saving. **[R031]**
4. Capture a repository with committed and uncommitted changes. Verify exclusion is clearly explained, only the selected committed content becomes the baseline, and the source is unchanged. Move `HEAD` afterward: later runs and imports still use the captured baseline. Competitors receive identical approved inputs and independent copies; historical artifacts remain unchanged. **[R068, R140]**
5. Run approved built-in, imported, and custom templates without planning. Confirm the seven-task inventory default and integration with creation, duplication, revision, import, and separate saved configurations. **[R030, R031, R136]**
6. In the end-to-end workflows, verify TUI navigation/resizing and failure states with [the TUI](15-terminal-interface.md), checks with [verification](08-verification-evidence.md), and score calculations with [scoring](06-scoring-rankings.md). **[R149]**
