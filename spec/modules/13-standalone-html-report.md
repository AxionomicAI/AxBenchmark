# M13 — Standalone interactive HTML report

Authority: [the product specification](../SPEC.md). This proposed module defines report generation, offline presentation, and interactive analysis; it does not claim an existing implementation. Use the repository [README](../../README.md) presentation as the starting point for measured comparisons, separate quality assessment, and priority rankings. Users review delivered artifacts and accumulated results for one template, including compatible imports, then generate and open a report. [R035, R131]

## Inputs and integration boundaries

[M02](02-retained-results-comparability.md) retains the approved template and full SHA-256, baseline identity, resolved configuration, originating machine and provenance, original weights, raw grades, normalized measurements, task evidence, logs, snapshots, and hardware samples. M13 consumes these saved records so report regeneration and alternative weighting require no model calls; the same retained material supports ZIP exchange through [M17](17-zip-exchange.md). Report generation must not overwrite original measurements, grades, or weights. [R134]

[M08](08-verification-evidence.md) supplies task outcomes and evidence; [M10](10-measurements-cost.md) supplies measurements and cost bases; [M18](18-hardware-monitoring.md) supplies optional telemetry; [M12](12-quality-judging.md) supplies raw reviews and judge metadata. [M06](06-scoring-rankings.md) owns normalization, eligibility, scoring, and deterministic rankings. The [TUI](15-terminal-interface.md) and [CLI](14-command-line-interface.md) request generation from saved results and receive the report location. These boundaries preserve evidence and measurement meaning through presentation. [R126, R127, R133, R134]

Only results with matching template identities enter one comparison. Preserve imported machine, configuration, judge details, and evidence. Display local/imported provenance and measurement conditions, including environment policy, concurrency, cost basis, and telemetry limits. Keep quality and combined rankings separated by judge configuration; matching hashes do not establish equivalent judging or measurement conditions. [R143]

## Generation and output

Produce one standalone HTML5 file containing vanilla JavaScript, CSS, chart/data assets, and the screenshots needed to understand reviews. It must open by double-click and operate offline through direct-file loading, without a server, CDN, external fonts, framework, or runtime data fetch. Moving the HTML alone must preserve the report and its review evidence. Identify the benchmark template and full SHA-256 in every original or alternatively weighted report. [R014, R125, R131, R148]

The dependency restriction applies to the exported report. It does not prohibit Python application dependencies or technologies allowed by generated projects' task specifications. At benchmark completion, attempt to open the generated report and always display its location; inability to open a browser must not hide the saved file. Regeneration reads retained results without invoking a planner, competitor, or judge. [R016, R134]

## Required presentation and operations

Every report includes both tables and all three chart groups below. [R148]

| Element | Required contents |
|---|---|
| Measured comparison table | Configuration/artifact, model and effort, originating machine, local/imported provenance, execution environment, verified tasks, elapsed time, output tokens, and cost with its basis. Hardware details are available where collected. [R126] |
| Quality table | Raw rubric-category grades, weighted overall grade, judge identity, review evidence, and limitations. [R127] |
| Direct top-five chart group | Lowest cost, shortest elapsed time, and highest quality rankings. [R128] |
| Cost/time/quality scatterplot | Logarithmic cost axis, elapsed time, quality color, and an environment legend appropriate to the actual configurations. [R129] |
| Combined ranking chart | Stacked cost, time, and quality contributions using the selected ranking weights. [R130] |

Default the measured table to highest known cost first, with unknowns last. Default the quality table to descending unrounded quality within judge groups. Support sorting, machine/configuration/judge filtering, and inspection of task details and evidence. Break exact ranking ties deterministically with stable result identifiers, keeping separate runs of the same configuration distinguishable; displayed rounding must not create artificial ties. [R131]

Show frozen original weights and independent controls for alternative quality-category and cost/time/quality weights. Apply M06 validation: finite nonnegative values, a positive total per set, independent normalization, and rejection of unknown categories. Clearly label alternatives, provide reset to the original analysis, and allow export of the alternative configuration/report. Recalculate from retained raw grades and measurements without new model calls or original-record changes. [R132, R134; M06]

Use M06's weighted quality, normalized ranking contributions, eligible reference minima, missing-measurement rules, and judge grouping consistently. Changes to weights or applicable filters update dependent tables, rankings, quality colors, and stacked contributions together. No report-specific scoring formula may disagree with M06. Preserve original weights for imported results while applying common selected analysis weights within each comparison group. [R130, R132, R143; M06]

## Exceptional data, safety, and invariants

Exclude zero costs from the logarithmic plot and explain that omission. Retain verified zero-cost entries in applicable tables and rankings using M06's zero-cost rule. Never interpret unavailable cost as zero. Missing data, no eligible entries, or fewer than five eligible entries must produce useful explanations and appropriately limited rankings, rather than broken charts or fabricated values. Failed and excluded results remain inspectable in full tables under the selected filters. [R132; M06]

Include optional hardware timelines, actual measurement scopes, coverage, and setup limitations when relevant. Missing or partial telemetry remains labeled accordingly. Scope labels preserve the distinction between client-machine measurements and cloud inference hardware, and between shared experiment energy and configuration-attributable observations, following M18. Essential measured and quality tables remain readable without JavaScript. [R133]

Render all generated text and embedded data safely: prompts, logs, reviews, imported labels, and evidence must not become executable HTML. Displaying or inspecting competitor material must not execute its source or embedded instructions. Preserve sanitized reporting inputs and exclude credentials in accordance with M02. The export remains self-contained even when evidence contains hostile markup or strings resembling executable content. [R125, R133]

## Acceptance scenarios

- Generate from retained results with no model access, move only the HTML, disable networking, and open it directly. Verify both tables, all three chart groups, embedded review screenshots, full template identity, and alternative weighting. Disable JavaScript and confirm essential tables remain readable. [R014, R125, R133, R134, R148]
- Check every required table field and chart dimension, default cost/quality ordering, machine/configuration/judge filters, task evidence inspection, and deterministic exact ties between distinct result identifiers. [R126, R127, R128, R129, R130, R131]
- Change both weight sets, reject invalid inputs through M06, verify synchronized recalculation, reset, and export. Confirm original records remain unchanged; exercise zero cost, unknown measurements, empty rankings, and fewer than five eligible entries with explanations. [R132, R134]
- Combine same-template local/imported results while retaining evidence, provenance, measurement conditions, and separate judge groups; exclude mismatched templates. Inspect optional telemetry coverage and submit hostile generated text to confirm inert rendering. Verify the completion open attempt and visible report path even when browser opening fails. [R133, R134, R143]

The source does not prescribe chart layouts, colors, or a rendering algorithm. Those implementation choices must satisfy these contracts; unresolved calculation cases remain governed by M06 rather than invented in presentation.
