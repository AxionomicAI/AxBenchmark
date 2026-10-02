# AxBenchmark — General Product Specification

Status: proposed product requirements. This document describes the application to build; it does not claim that the functionality is already implemented.

## 1. Purpose and scope

AxBenchmark is a Python terminal application for comparing coding-agent harnesses on representative, multi-step software work. Users choose a reusable benchmark template or create one from a project prompt, run selected harness/model configurations, collect measurements, obtain independent LLM quality reviews, and produce an interactive report. Results from other machines can join a comparison when their benchmark template's SHA-256 matches.

The intended users are developers and teams choosing coding agents for their everyday work. This specification gives future implementers the agreed product behavior, defaults, and acceptance criteria. Beyond separating a headless engine from its interfaces, it does not prescribe the internal architecture; [modules/ARCHITECTURE.md](modules/ARCHITECTURE.md) records that implementation decision.

The product extends the methodology and presentation in the repository's README: measured cost and time, a separate quality assessment, and rankings that help users compare different priorities. Results describe complete harness/model/environment configurations, not isolated model capability.

### Initial scope

- Support macOS and Linux.
- Detect Claude Code, Codex, Grok CLI, and Pi installed on the local machine.
- Support frontend, backend, and fullstack tasks, either building a new project or modifying a snapshot of an existing local Git repository.
- Provide a benchmark library with the existing inventory application as the default template, plus user-created and imported templates.
- Save harness/model/effort selections per benchmark and exchange templates and results between machines using ZIP packages.
- Allow configured cloud providers and local model endpoints through supported harnesses.
- Use a TUI as the primary interface. Tmux is not required or used by the product.
- Keep all benchmark logic and state in a headless engine. The TUI and the CLI are interchangeable clients of it, and a later MCP server can be another; no behavior depends on which interface started it or whether one is attached.
- Run every planner, competitor, and judge invocation in headless mode.
- Collect local CPU/GPU measurements when compatible tools, hardware, and permissions are available.
- Export a standalone HTML report that opens by double-clicking the file.

Remote machine orchestration, hardware provisioning, and native Windows support are outside the initial scope. Running the application independently on another machine and exchanging ZIP packages is supported. Historical benchmark applications, results, and reviews remain preserved.

The dependency-free requirement applies to the exported report. The Python application may use dependencies, and generated projects may use the technologies agreed in their task specification.

## 2. Benchmark library and user workflow

### Templates and run configurations

A **benchmark template** is the reusable definition of the work: specification, ordered tasks, starting files, acceptance checks, execution protocol, and grading rubric. A **run configuration** selects the harnesses, providers, models, efforts, environment settings, judge, and scoring weights to use with that template. A **result** is the recorded outcome of one configuration trial on one machine, linked to the exact template revision it ran.

Every launch has an immutable globally unique UUID (`RunUid`), preserved through import and re-export, and a separate human-readable date/suffix label (`RunLabel`). Group configurations and trials by the run UID, never by the label or configuration identifier alone. Different machines may use the same label; views and commands must distinguish those runs using their origins and UIDs.

Show built-in, user-created, and imported templates in the library, including their name, description, project type, task count, template revision/SHA-256, saved configurations, and available results. Users can select an existing template, create a new one, duplicate/edit a template into a new revision, or import/export it. Running an approved template does not invoke the planner or regenerate its tasks. A duplicate or revision whose SHA-256 equals an existing revision cannot be approved as a new revision.

Save run configurations per benchmark template revision, not as one global harness selection. Users can add or change configurations before a new run without changing the template or overwriting previous results. Imported templates remain usable with the harnesses available on the destination machine; another machine's executable paths, credentials, and hardware are not template requirements.

### Default inventory benchmark

Ship the existing inventory website specification and task prompts as the default built-in template. It requires HTML5 and vanilla JavaScript, no frameworks or runtime libraries, localStorage persistence, and direct opening of the application's HTML file in a browser. Start from an empty project, not one of the historical generated applications.

| Task | Deliverable |
|---|---|
| T1 | Initialize Git, scaffold the project, write a README, and commit. |
| T2 | Add products, stock, persistent storage, and first-run sample data; commit. |
| T3 | Add inventory viewing and product creation, editing, and deletion; commit. |
| T4 | Add inventory lookup; commit. |
| T5 | Add a persistent cart with quantity changes, removal, and totals; commit. |
| T6 | Complete checkout, update stock, preserve order history, and update the README; commit. |
| T7 | Test in a real browser, fix defects, and commit. |

Preserve the existing task prompt text. Bundle versioned acceptance checks and the web grading rubric with the template so it is ready to run without LLM planning. Editing tasks, checks, baseline files, or rubric creates a new template revision. A six-task variant is a different template, not the default seven-task benchmark. Historical runs must not be assigned a verified matching hash based only on their names or reported task counts.

When an application upgrade ships a newer built-in inventory revision, an installation with no results on its current default revision moves the default to the newest built-in revision. An installation with such results keeps its current default, and the library offers the newer revision with what changed, a note that results from the two revisions cannot be compared, and an action to make it the default. All built-in revisions remain available.

### Workflow

1. **Open the library and inspect the environment.** Show the inventory benchmark as the default choice and detect harnesses, model information, authentication readiness, runtimes, browser support, and hardware collectors. With no supported harness installed, show an actionable error and prevent local planning/execution; library browsing, ZIP exchange, and saved-result reporting remain available.
2. **Choose or create a template.** Select an approved built-in/imported/custom template to reuse its frozen tasks. To create a new template, enter a multiline project prompt, select frontend/backend/fullstack, and choose an empty project or an existing repository revision.
3. **Plan custom work when needed.** Select a planner harness/model/effort with a valid previous choice preselected; otherwise use the first usable harness in display order: Claude Code, Codex, Grok, Pi, with discovered model/effort defaults. A harness whose readiness is undetermined is never preselected or run for planning. If no harness is usable, show an error with a verification action that, with the user's consent, makes one minimal headless call per harness to confirm login and headless operation, records the outcome, and then preselects the first usable harness. Preselect the harness's own default model when the catalog knows it; otherwise the user must choose one, because the planner never runs without an explicit model. Generate the specification, tasks, acceptance checks, and setup/start/stop instructions. Default to seven tasks including final verification/fixes; review, edit, or regenerate before approving and saving the template. Choosing an existing template skips this step.
4. **Configure this benchmark.** Load its saved configurations or select harnesses and provider/model/effort combinations. Allow multiple entries per harness. Every configuration names an explicit model. Default to clean settings, with current settings available. Show the full run setup before execution.
5. **Configure judging and weights.** Independently select the judge harness/model/effort. Preselect a valid saved selection, then the planner configuration if one was used, otherwise the first selected usable configuration. Use the template's rubric, choose quality and ranking weights, and complete these choices before launch.
6. **Execute and observe.** Run the configurations against the pinned template revision, show progress and measurements, preserve evidence, and execute its approved checks.
7. **Judge and compare.** Review each delivered artifact and view accumulated results for the same template, including compatible imports from other machines. Generate/open the HTML report.
8. **Exchange work.** Export the template as a ZIP for another machine. Import that machine's result ZIP into the matching benchmark only after template and package integrity checks pass.

Selection defaults are conveniences, not recommendations about model quality. The same approved task suite and grading profile apply to every configuration within a comparison.

## 3. TUI and execution interaction

The TUI is the central place for setup, observation, and results. It provides keyboard navigation, visible shortcuts, mouse interaction, clear validation messages, and layouts that adapt to terminal size.

| View | Required behavior |
|---|---|
| Home/library | Choose the default inventory benchmark, create or import templates, manage revisions and saved configurations, reconnect to active runs, and inspect accumulated results. |
| Environment | Show discovered capabilities, unavailable prerequisites, installation/setup guidance, and a recheck action. |
| Setup | Edit a template's run configurations and judge/weight selections; create or revise task templates separately. |
| Execution | Show harness panels, queued/running/completed states, current tasks, elapsed time, logs, and available measurements, plus a live view of one configuration's current task. |
| Results | Inspect local/imported results, machine and judge filters, evidence, rankings, alternative weights, and ZIP/HTML export actions. |

When all four harnesses are selected, show four live panels in a 2×2 arrangement on sufficiently large terminals. Use a list/detail layout on smaller terminals. Logs must be scrollable and searchable; selecting a configuration reveals its task-level details. A live view of a selected configuration shows its current task with the model and effort, the code being written in its workspace, the reasoning the harness exposes, output tokens per second, and context use, each labelled with its source; anything the harness does not expose is shown as unavailable rather than estimated. Live rates and context use help observation only: they are not retained measurements and do not affect cost, time, or rankings. Watching never sends input to the harness.

Default scheduling runs one configuration per selected harness concurrently, up to four. Additional configurations within a harness queue sequentially, and tasks within a configuration always execute sequentially. Provide a sequential mode through `--jobs 1` and the equivalent TUI setting. Record scheduling and concurrency in the results.

Execution must continue independently of the TUI. Closing or detaching the interface leaves the benchmark running. Reconnecting observes existing work without restarting tasks. Stopping a configuration or the whole benchmark is a separate explicit action that also cleans up its child processes and application services.

During execution, users may inspect, detach, reconnect, and stop work. They cannot alter the frozen prompts, selected models, original weights, or inject implementation hints into an active comparison.

### Command-line access

| Command | Purpose |
|---|---|
| `axbenchmark` | Open the TUI. |
| `axbenchmark --attach RUN_REF` | Reconnect to a running benchmark. |
| `axbenchmark run --config benchmark.yaml --no-tui` | Run a fully specified benchmark with plain terminal progress. |
| `axbenchmark status RUN_REF` | Show persisted status. |
| `axbenchmark stop RUN_REF` | Stop the run and its child processes. |
| `axbenchmark models refresh` | Refresh model and effort discovery. |
| `axbenchmark doctor` | Inspect prerequisites and display setup guidance. |
| `axbenchmark report RUN_DIR` | Regenerate a report from saved results without model calls. |
| `axbenchmark templates export TEMPLATE_SHA --output template.zip` | Export an exact template revision as a portable ZIP. |
| `axbenchmark templates import template.zip` | Validate and add a template to the library. |
| `axbenchmark results export RUN_REF --output results.zip` | Export a run's results and the exact template they reference. |
| `axbenchmark results import results.zip --template TEMPLATE_SHA` | Validate and add results only to the matching local template revision. |

`RUN_REF` accepts a run UID or a label that identifies exactly one visible run. An ambiguous label produces an error listing the candidate UIDs and origins; it never silently chooses a run. The unattended mode requires complete configuration rather than pausing for interactive questions. A disconnected interface must not be treated as an interrupted benchmark; an actual execution failure must remain visible in saved state.

## 4. Models and configuration

Provide a versioned YAML catalog of models and their supported efforts, organized by harness and provider. Model availability and effort support depend on the installed harness, provider, and account; a model's name alone is not sufficient evidence of compatibility.

Each catalog entry identifies the model, display name, supported effort values, known default effort, relevant capabilities such as image input, and optional pricing. Record the metadata source, retrieval date, and applicable harness version. Distinguish known support, unsupported settings, and unknown capability information.

Catalog refresh also records each provider's published prices and each harness's own default model per provider and account, read from the harness's configuration or status output without a model call, with their source and retrieval date under the same precedence. Prices are collected only during an explicit catalog refresh, never during a run. A failed refresh keeps the last valid prices, offline operation uses cached or bundled prices, and the prices in effect are recorded with the run at launch.

Catalog refresh also collects exchange rates to USD for the currencies in which prices are published, recording each rate's source URL and retrieval date. All editable and stored rates use currency units per 1 USD and must be positive; for example, a rate of 4000 COP per USD converts 4000 COP to 1 USD by division, and 1 USD to 4000 COP by multiplication. Rates follow the same rules as prices: they are collected only during an explicit catalog refresh, never during a run; a failed refresh keeps the last valid rates; offline operation uses cached rates; and user-supplied rates override collected ones and are labeled as user-supplied.

Record each account's billing kind as API, subscription, local, or unknown, read from the harness's status output without a model call. Users can declare an account's billing kind as a user override, labeled as declared by the user; a declaration takes priority over the discovered value, and an account with neither is unknown. The billing kind in effect is recorded with the run at launch, and wherever a cost basis is shown, a declared billing kind is labeled as declared.

On first launch, attempt automatic discovery through available harness/provider interfaces. Use a cached catalog thereafter, refreshing when the installed harness version changes or the user explicitly requests it. A failed refresh must preserve the last valid data. Offline operation may use cached or bundled entries with their source and age visible.

Maintain a bundled baseline, a discovered cache, and separate user overrides. Apply precedence in that order, with explicit user overrides taking priority. Refreshes must not overwrite overrides.

Only offer known supported efforts. For unknown effort support, offer a harness-default option and omit an explicit effort argument. Do not guess effort lists or silently substitute a different model after a failure. Record requested settings and effective settings when the harness exposes them; do not claim a requested effort was verified when it was not.

Persist reusable run configurations per benchmark template revision and scoring presets in YAML. A run configuration pins its template SHA-256. Saved result records include that hash, the resolved configuration, machine identity/details, and catalog metadata used at launch. Credentials must not appear in exported settings, logs, or reports.

## 5. Benchmark methodology and measurements

### Reproducible inputs and environments

Freeze the approved specification, task prompts, acceptance checks, grading rubric, execution protocol, and starting snapshot as an immutable template revision. Recompute its SHA-256 before execution and bind each result to that identity. Separately freeze the run configuration and original scoring weights before launch. Template inputs must not change during the run; a detected change invalidates its claim to that template rather than silently relabeling the result.

The first detected template change, including one detected after the last task, during final verification or during judging, halts the whole run with the same cleanup as an explicit stop and cancels active judging. Append a run invalidation containing the approved and computed SHA-256 and changed paths; every associated result then has an effective interrupted/non-comparable status. Preserve original bindings, sealed execution facts, completed reviews and evidence. Invalidation excludes even already sealed results without rewriting them and survives export/import. Store approved revision files read-only. Deleting a template through the application restores write permission only to remove it, and `doctor` reports revision folders whose permissions were changed. When a user duplicates or revises a revision that an active run is using, warn that this creates a new revision, that the active run continues on the existing one, and that its results will not be comparable with the new revision.

Every configuration starts from its own copy of the same baseline. When creating a template from an existing repository, snapshot the selected committed revision, defaulting to `HEAD`, clearly explain that uncommitted changes are excluded, and leave the source repository untouched. Later runs and imports use the template's packaged baseline; they never resolve a moving branch or `HEAD` again. Preserve each baseline file's executable intent in the hashed definition and restore it in working copies, independently of read-only template storage or ZIP permissions.

Each task starts a fresh headless process and conversation with the shared specification and task prompt. Files carry state between tasks. All configurations receive the same task sequence, including final QA when included; local and cloud configurations do not receive different opportunities to fix their work.

**Clean mode**, the default, retains required authentication/provider access while disabling personal instructions, memories, plugins, hooks, and MCP integrations through supported controls. Keep native harness behavior and record managed settings or isolation limitations. If clean mode cannot be established, explain the limitation rather than silently using current mode.

**Current mode** uses the user's existing harness configuration, subject to explicit benchmark model/effort choices. Record a sanitized description or fingerprint of relevant settings so the result is understood as that configured harness.

Give configurations independent workspaces, service ports, test data, and browser contexts. Configure headless permission behavior before execution so blocked actions produce explicit outcomes instead of unanswered prompts.

### Verification and evidence

Task success comes from the benchmark's executable acceptance checks, not from the agent claiming completion or returning exit code zero. Checks assess observable requirements without forcing unnecessary implementation structure. Each frozen check declares its task/phase, observable obligation, evidence and failure classification; inventory checks do not impose an unapproved DOM or storage schema. Inventory T2 checks assess data and persistence; they must not require the management UI introduced at T3. Check commit advancement for every task that requires a commit; a missing required commit fails that requirement.

Run checks against disposable copies of task snapshots. Keep verification tooling outside competitor source, and do not manually fix generated application code. Run a final regression check against the delivered artifact.

Use Python Playwright for browser verification, including meaningful workflows, keyboard behavior, browser errors, and desktop/mobile screenshots at 1440×1000 and 390×844. Backend checks exercise the approved interface contract. The judge receives the resulting evidence separately from the measured execution statistics.

Record process outcomes and verification outcomes independently. Distinguish passed, failed, and unverified checks, including missing prerequisites or broken verification infrastructure. Keep task-level evidence, snapshots, logs, and available commit identities.

Default to one trial per configuration and a three-hour task timeout; users may request more trials, with no upper limit. Do not automatically rerun failed tasks to improve results. Continue later tasks from the resulting workspace after ordinary task failure or timeout; authentication/configuration failures stop that configuration while others continue. Preserve interrupted outcomes and observable harness-internal retries.

Run a configuration's trials one after another, each from a fresh copy of the baseline, and record each trial as a separate globally identified result linked to its run UID, configuration and 1-based trial index. Keep task logs, checks, screenshots, measurements and evidence distinct for every trial; historical views resolve the selected result's trial even while another trial is running. Judge each trial separately. Results show every trial plus the mean cost, elapsed time, and quality with their min–max range. Rankings use the means, and a configuration is eligible for a ranking only when every one of its trials is eligible.

Setup and the launch review show the total task runs (configurations × trials × tasks) and judge sessions before launch. When a launch requests more than five trials for any configuration that is not on a local model endpoint, launch validation warns with those totals, and the TUI asks for confirmation in a dialog stating clearly that the extra trials will consume budget and subscription usage. The dialog is not shown when every such configuration is on a local endpoint. Unattended runs print the warning and continue without prompting.

### Measured statistics

Collect per-task and aggregate wall time, available input/cached/output/reasoning tokens, cost, task verification results, and execution status. Avoid double-counting cumulative events or overlapping token categories.

Benchmark elapsed time is the sum of task process durations, including the harness's tool work. Exclude queueing, planning, external verification, and independent judging from that metric, and report those phases and total experiment duration separately.

Prefer reported costs; otherwise, including under subscription billing, calculate an explicitly labeled API-equivalent estimate from known usage and the provider prices recorded at launch, naming their source and date. A subscription or missing price is not a zero-cost run. Treat cost as a verified $0 only when the provider or harness reports $0, usage coverage is complete for every task, and the account's billing kind is known and not a subscription; an unknown billing kind never yields a verified $0. Unknown billing still retains any valid positive reported cost or estimate, with the billing limitation visible. Incomplete measurements remain partial or unknown, with their source and coverage visible.

Display costs in the run configuration's display currency, USD by default. At launch, freeze the exchange rates for every currency the run's prices use and for the display currency beside the run's prices. Convert each value from its price currency to USD and then to the display currency with those frozen rates; a missing rate makes the converted value unknown rather than guessed. Rankings are computed in USD. A comparison or report spanning runs with different display currencies displays in USD and says so. Do not reuse the historical README exchange rate as current data. Keep cost bases and estimates visible wherever rankings could otherwise imply equivalent accounting.

## 6. Quality grading and configurable weights

Use one fresh headless judge session per delivered artifact, reviewing configurations sequentially. Apply the same chosen judge configuration and template rubric throughout a local comparison. For imported results, preserve the original judge configuration and review evidence. Group grades from different judge configurations separately; cross-judge quality and combined rankings are not presented as one equivalent assessment. Users may explicitly request a fresh review of imported artifacts with the selected judge, retaining the original review and recording the additional judging cost separately.

Provide the judge with the approved specification, source, acceptance results, the screenshots captured by the final regression check at both viewports, and relevant evidence. Per-task screenshots remain in evidence, results, and reports but are not judge input. Use anonymous configuration labels where practical; exclude cost, speed, and other competitors' reviews from its input. The judge must not repair the application. UI judging requires a configuration capable of inspecting screenshots.

Require category grades from 1–5 in half-point increments, evidence references, limitations, and comments on code quality, usability/developer experience, and specification adherence. A score of 1 means missing or largely broken, 3 means usable with material gaps, and 5 means excellent for the defined scope. Malformed or incomplete reviews remain ungraded rather than receiving invented scores.

### Quality profiles

The web profile preserves the README categories and default weights. Backend-only projects use a profile appropriate to their deliverable. The same profile applies to every configuration in a comparison.

| Frontend/fullstack category | Default weight | Backend category | Default weight |
|---|---:|---|---:|
| UX | 25% | Developer experience | 25% |
| Visual quality | 15% | API/interface design | 15% |
| Code quality | 20% | Code quality | 20% |
| Business rules/specification | 25% | Business rules/specification | 25% |
| Robustness | 10% | Robustness | 10% |
| Accessibility | 5% | Operability/documentation | 5% |

### Editable weights

Expose two independent weight sets in the TUI and YAML:

- **Quality-category weights** determine the overall application grade.
- **Cost/time/quality ranking weights** determine the combined decision score, defaulting to equal weights.

Allow named presets, restoring defaults, and previewing normalized percentages. Accept finite nonnegative weights with a positive total and normalize each set independently. Reject unknown categories, negative/nonfinite values, and all-zero sets. Zero weight removes a contribution while retaining the raw category grade for later analysis.

The application computes totals from the judge's raw grades. Freeze original weights before execution and retain raw grades separately. Alternative weighting in the results view or HTML report recalculates totals without rerunning the judge or overwriting original results. Clearly label alternatives, provide reset, and allow exporting the alternative configuration/report.

The quality grade is the weighted mean of category grades. The combined ranking is:

`100 × (cost_weight × cost_factor + time_weight × time_factor + quality_weight × quality_grade / 5)`

Weights in this formula are normalized to sum to one. The cost factor is minimum eligible cost divided by configuration cost; the time factor is minimum eligible elapsed time divided by configuration elapsed time. Compute reference minima from the configurations eligible for that ranking, preserve precision, and round only for display.

Default shortlist eligibility requires completed execution, verified required checks, valid required grades, and a business rules/specification grade of at least 4/5. Entries missing a positively weighted measurement are excluded from the affected ranking with an explanation; do not silently redistribute their weights. A partial measurement counts as missing: partial cost excludes an entry from the lowest-cost ranking and from combined rankings with a positive cost weight, and partial elapsed time does the same for time. Such entries stay in the tables with their partial value, coverage, and an explanation. Zero-weight components do not require that measurement. Failed, incomplete, and excluded configurations remain in the full tables.

**New edge-case policy (F08):** retain a numeric zero that does not meet the verified-zero conditions as an observation with its original basis, including zero API or energy estimates. Exclude it from lowest-cost rankings and combined rankings with a positive cost weight, explaining `cost_zero_unverified`; never use it as a denominator or relabel it as a verified charge. A zero cost weight permits eligibility subject to the other gates.

If a verified minimum cost is zero, eligible verified-zero entries receive the maximum cost contribution and positive-cost entries receive zero for that component. Never turn unavailable cost into zero. Report fewer than five entries when fewer qualify, and explain when no ranking can be computed.

## 7. Optional CPU/GPU monitoring

Hardware monitoring defaults to automatic detection and may be disabled. Collect available CPU/GPU utilization, memory, power, energy, and temperature information without making any particular sensor a prerequisite for benchmarking.

The Environment view and `doctor` distinguish missing tools, insufficient permissions, missing drivers/kernel interfaces, unsupported hardware, and collector failures. On macOS and Linux, suggest appropriate installation or setup steps with supporting documentation and a recheck action. Do not automatically install tools or change system permissions. Users can continue with unavailable metrics clearly identified.

Candidate collectors include process/host telemetry through psutil, macmon or powermetrics on compatible Macs, powercap/RAPL counters on Linux, and NVIDIA or AMD vendor tools on supported GPUs. Probe actual capabilities and versions before enabling metrics; installing a utility cannot make unsupported hardware expose a sensor.

For Apple Silicon, the [macmon documentation](https://github.com/vladkens/macmon) provides installation instructions and JSON telemetry support. Linux setup guidance should reference the relevant [powercap documentation](https://cdn.kernel.org/doc/html/latest/power/powercap/powercap.html), [NVIDIA SMI documentation](https://docs.nvidia.com/deploy/nvidia-smi/), or [AMD SMI documentation](https://rocm.docs.amd.com/projects/amdsmi/en/latest/how-to/amdsmi-cli-tool.html). Use verified platform-specific instructions rather than assuming one package command works across distributions.

Collect host telemetry once per experiment. The sampling interval is a run-configuration setting from 0.5 to 10 seconds, defaulting to one second and frozen at launch; reject invalid values. A collector that cannot sample that fast uses its own minimum, and each collector's actual interval is recorded and shown rather than presented as the requested one. Preserve timestamps, device/domain identity, units, source, scope, and coverage. Sampling or collector failures must not stop the benchmark.

### Attribution and limits

- Attribute process-tree CPU time and memory where observable. Do not assume a separately running model server belongs to the harness process tree.
- Label host-wide, CPU-package, GPU, and SoC readings by their actual scope.
- Keep parallel execution as the default. Shared-device energy belongs to the experiment; do not divide it arbitrarily among concurrent harnesses.
- In sequential mode, show energy observed during each configuration's execution windows, explicitly including background activity rather than claiming exclusive attribution.
- For cloud models, local telemetry describes the client machine, not the provider's inference hardware.
- Prefer energy-counter deltas where available; otherwise integrate sampled power and label the result as an estimate. Distinguish wraps from resets using collector continuity/reset evidence, timestamps and plausible bounds; a known counter range alone does not establish a wrap. Ambiguous decreases and missing samples leave uncovered intervals and partial coverage.
- Choose one source for duplicate observations of the same physical domain before avoiding overlaps among package, subdomain and SoC measurements. Preserve the source choice, metric definitions and uncertainty; power estimates are not wall-socket measurements.

An optional electricity tariff can produce a clearly labeled energy-cost estimate. Set the tariff per kWh, with its currency, in the run configuration before launch, where it is frozen with the run. It can also be entered or changed later in results as an analysis setting that recalculates the estimate as a labeled alternative without changing the original record. Do not claim whole-system electricity cost from CPU-package or GPU-only readings, and do not add overlapping energy charges to reported provider costs.

In sequential runs, a configuration on a local model endpoint without API cost uses its energy-cost estimate, the energy measured during its execution windows multiplied by the tariff, as its cost for rankings. Label it as an energy estimate with its measurement scope, such as GPU and CPU package rather than whole system. Shared experiment energy from parallel runs stays separate from per-configuration rankings, so such a configuration's cost remains unknown there. Without a tariff or an energy measurement, its cost is also unknown.

## 8. ZIP exchange and template identity

### Portable packages

A **template ZIP** contains a versioned manifest and the complete frozen benchmark definition: project specification, ordered task prompts, starting files/fixtures, acceptance checks, setup/start/stop instructions, execution rules, and grading rubric. Existing-repository templates include the actual starting snapshot, not a path that only exists on the originating machine. Required runtime dependencies are declared; installed dependency directories and credentials are not included.

A **result ZIP** contains the exact template plus the selected run's result records, configuration, prices and exchange rates frozen at launch, machine label and hardware/OS details, harness versions, timestamps, task outcomes, measurements and their coverage, original weights, judge metadata/grades, generated artifact snapshots, and supporting evidence. Include a file-integrity manifest covering the result payload. Do not export raw credentials or unrelated files from the machine. Preserve source run UIDs, result identifiers, trial associations, invalidations and provenance across subsequent exports.

Importing a package is a data operation: it must not run its scripts, install dependencies, invoke a model, or modify an existing result. Executing an imported benchmark or rejudging an artifact is a separate explicit action. Validate archive paths, reject escaping paths and links, and enforce bounded extraction before accepting contents. Reject corrupt, incomplete, or unsupported-format packages with an actionable explanation and without partially adding them to the library. Import visibility is all-or-nothing across templates and results, including during concurrent reads and crash recovery: another client can act on the prior collection or the complete import, never a staged half-import. Failed imports and retries preserve pre-existing records.

### SHA-256 matching

Compute the template SHA-256 from a canonical manifest of its benchmark-defining metadata and payload files, including normalized relative paths and each file's content digest. Define one versioned, deterministic serialization so identical templates produce the same hash on macOS and Linux. ZIP compression, entry order, timestamps, local absolute paths, machine identity, and display-only naming do not determine template identity.

Task order, prompt content, checks, required baseline files and their executable intent, execution protocol, and rubric definitions are covered by the hash. Changing any of these creates a new template revision. Harness/model/effort selections, clean/current run settings, concurrency, trial count, hardware sampling interval, judge selection, pricing, exchange rates, display currency, electricity tariff, and adjustable scoring weights belong to run or analysis configuration and do not change the template hash. They remain recorded and visible as comparison differences.

On template import, recompute the digest from the extracted definition and verify it against the manifest before registering it. On result import, recompute the digest from the embedded template and verify it against both the package's declared template hash and the selected local template's recomputed hash. Also check payload digests, result-to-template references, and task identifiers against the validated template. A matching name, filename, or declared hash alone is insufficient.

If hashes differ, reject adding the results to the selected benchmark and show the expected and received template identities. The user may instead import the embedded template as a separate library revision and associate the results with that matching revision. Never force-merge mismatched templates or overwrite a template to make an import appear compatible.

Reimporting the same template or identical result is idempotent. Keep distinct runs of the same configuration even when their human labels collide; reject a reused run UID with a conflicting immutable launch binding or a conflicting payload reusing an existing result identifier. Result data from different template hashes never enter the same comparison or ranking.

### Comparability and provenance

A matching SHA-256 establishes that the packaged benchmark definition is identical. It does not independently prove that a third party executed that definition faithfully or that submitted measurements are authentic. Label results as locally produced or imported, retain execution evidence, and describe validation as template/payload integrity verification rather than execution certification.

Within a matching template, display and filter by originating machine, harness/model/effort, environment policy, concurrency, and judge configuration. Machine differences are intentional comparison inputs, not hash mismatches. Apply a common selected weight set when calculating a combined report, retaining each result's original weights and grades. When every result froze the same original weights, use them as the original ranking weights; otherwise use the grading profile's default weights, labeled as profile defaults because the original weights differ across results. Each result's original weights remain visible and selectable as alternative weights, and quality uses the same category weights for every entry in a combined ranking. Preserve cost bases, telemetry limitations, and judge grouping so hash compatibility does not imply identical measurement conditions.

## 9. Reports, retained results, and acceptance criteria

Generate one standalone HTML report using HTML5, vanilla JavaScript, CSS, and embedded chart/data assets. It must work offline when opened by double-click, with no server, CDN, external fonts, framework, or runtime data fetch. Embed screenshots needed to understand the review so moving the HTML alone preserves the report.

### Required presentation

| Element | Contents |
|---|---|
| Measured comparison table | Configuration/artifact, model and effort, originating machine, local/imported provenance, execution environment, verified tasks, elapsed time, output tokens, and cost with its basis. Hardware details are available where collected. |
| Quality table | Raw rubric-category grades, weighted overall grade, judge identity, review evidence, and limitations. |
| Direct top-five chart group | Lowest cost, shortest elapsed time, and highest quality rankings. |
| Cost/time/quality scatterplot | Logarithmic cost axis, elapsed time, quality color, and an environment legend appropriate to the actual configurations. |
| Combined ranking chart | Stacked cost, time, and quality contributions using the selected ranking weights. |

Use the README's presentation as the starting point. Identify the benchmark template and full SHA-256 in every report. The measured table defaults to highest known cost first, unknowns last; the quality table defaults to descending unrounded quality within judge groups. Allow sorting, machine/configuration/judge filtering, and inspection of task details and evidence. Break exact ranking ties deterministically using a stable result identifier so separate runs of the same configuration remain distinguishable.

Show original weights and controls for exploring both alternative weight sets. Update dependent tables, rankings, chart colors, and contributions consistently. Exclude zero costs from the logarithmic plot with an explanation, while retaining them in applicable tables and rankings. Missing data and insufficient eligible entries must produce useful explanations rather than broken charts.

Include optional hardware timelines, measurement scopes, coverage, and setup limitations when relevant. Keep essential tables readable without JavaScript. Safely render generated text and embedded data so prompts, logs, or reviews cannot inject executable HTML.

Persist the approved template and SHA-256, baseline identity, run UID/label, resolved configuration, originating machine/provenance, original weights, raw grades, normalized measurements, task evidence, logs, snapshots, and hardware samples. Before sealing execution facts, finish checks, drain accepted measurement work, close hardware collection, and durably retain final cost/energy values with their evidence and coverage for every trial. Stop/interruption follows the same rule for partial data; storage failures remain visible and cannot claim completion. Sealed execution facts are immutable; reviews and run invalidations are append-only additions. Generate the completion report after the original judging batch finishes. Immediate reports/exports and later imports must agree with retained facts, without relying on unfinished writes. Reporting, ZIP exchange, and alternative weighting must be possible from retained results without new model calls. At completion, attempt to open the report and always display its location.

### Acceptance criteria

- A user can complete setup, approve tasks, observe all selected harnesses, inspect results, and export the report through the TUI.
- The library includes the existing seven-task inventory benchmark as the default, runnable without generating new tasks. Users can create, duplicate, revise, and import other templates and save different run configurations for each.
- When no supported harness is installed, the application shows an actionable error and prevents local planning/execution while retaining library, import/export, and saved-result access. Discovery, offline fallback, unsupported settings, and authentication failures are represented honestly.
- All model work runs headlessly. Multiple configurations per harness, parallel defaults, sequential mode, unattended execution, and reconnecting behave as specified.
- Detaching or closing the interface does not stop execution; stopping a run cleans up its processes. Interruptions and failures remain recorded.
- Every competitor receives identical approved inputs and an independent baseline. Executable and regular baseline files retain their distinct behavior in local and imported runs while approved storage stays read-only. Existing repositories and historical benchmark artifacts remain untouched. Template changes detected during the last task, final regression or judging halt the run and exclude all its results, including sealed ones, without rewriting original facts.
- Template ZIP export/import preserves its SHA-256 across operating systems and ZIP repackaging. Modifying benchmark-defining content changes the digest; choosing different harnesses or machines does not.
- Results from another machine join a benchmark only after recomputed template hashes and result payload integrity match. Mismatches, corruption, conflicting identifiers, and unsafe archives are rejected without partial imports, including under concurrent access or crash recovery; identical repeated imports create no duplicates and preserve prior records. Two machines' same-label/same-configuration runs retain separate trials, means, report scopes and exports.
- Imported results retain their machine/configuration/judge details and evidence. Reports combine only matching templates and distinguish judge groups, measurement conditions, and imported provenance.
- Frozen acceptance checks determine task success. Failed checks, unverified checks, process failures, and judge grades remain distinct. Different conforming inventory implementations pass without a prescribed DOM/storage schema; valid T2 data without T3 UI does not fail prematurely, and missing required commits fail. Two trials with different task outcomes retain separate logs, screenshots and check totals during execution and after ZIP exchange.
- Both weight sets are editable, validated, saved, and reproducible. Alternative weighting preserves the original grades and results. Zero price/energy estimates, unknown billing with positive cost and verified zero follow their distinct eligibility rules and yield finite deterministic rankings. A rate fixture of 4000 COP per USD survives editing, freezing and ZIP exchange, converting 4000 COP to 1 USD and back; missing rates remain unknown.
- Available hardware measurements appear with correct scope. Missing tools produce macOS/Linux guidance; unavailable sensors or permission failures do not prevent a benchmark.
- Parallel runs do not receive fabricated per-harness allocations of shared-device energy. Real wraps, resets with or without a known range, gaps and duplicate sensor sources produce the stated coverage without fabricated energy. Missing and partial measurements are never presented as complete or zero. Delayed accounting and a completed sequential local-energy run produce matching retained, immediate export/report and imported values, with no measurement writes after sealing.
- The exported HTML works through direct-file opening with networking disabled, includes both tables and the three chart groups, and supports alternative weighting without external dependencies.
- Frontend and backend workflows, including an existing-repository baseline, can be exercised end to end. TUI navigation/resizing, failure states, and score calculations have verifiable behavior.
