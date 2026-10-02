# M06 — Weighting, eligibility, and rankings

Authority: [the product specification](../SPEC.md). This module defines required analysis behavior without prescribing internal architecture.

This proposed contract defines application-computed scores and rankings, extending the repository README's separate measured cost/time and quality assessments. Rankings compare priorities across complete harness/model/environment configurations; they do not establish isolated model capability. These are required behaviors, not claims of existing implementation. [R004]

## Inputs, outputs, and boundaries

Analysis consumes matching-template results: stable result identifiers, execution status, required-check outcomes, raw rubric grades and validity, judge configuration, cost and elapsed-time measurements with availability and provenance, original weights, and current filters. It produces normalized weights, weighted quality, ranking eligibility and exclusion explanations, eligible reference minima, component contributions, and deterministic ordered results. Original records remain separately inspectable. [R096, R097, R098, R099, R100, R124, R131]

[M07](07-run-configuration.md) completes setup before launch: independently select judge harness/model/effort, preselecting a valid saved choice, then the planner configuration when used, otherwise the first selected usable configuration. Use the template rubric and finish both weight choices before execution. [M12](12-quality-judging.md) supplies validated raw grades; [M08](08-verification-evidence.md) supplies required-check outcomes; [M10](10-measurements-cost.md) supplies measurements; [M02](02-retained-results-comparability.md) preserves originals and provenance. M06 computes totals rather than accepting judge-calculated totals as authoritative. [R033, R096, R100]

## Weight operations and validation

Expose two independently editable weight sets in the TUI and YAML. Quality-category weights determine the overall application grade; cost/time/quality weights determine the combined decision score and default to equal thirds. Neither set changes the other's normalization. [R092, R093, R094]

Quality defaults follow the template profile: frontend/fullstack uses UX 25%, visual quality 15%, code quality 20%, business rules/specification 25%, robustness 10%, and accessibility 5%. Backend substitutes developer experience, API/interface design, and operability/documentation in the corresponding positions. M12 defines these profiles; use the same template profile throughout a comparison. [R033, R093, R095]

Support editing, named preset saving/loading, restoring defaults, and previewing normalized percentages. Every supplied weight must be finite and nonnegative, and each set must have a positive total. Divide each weight by its own set's total. Reject unknown categories/components, negative or nonfinite values, and all-zero sets with an explanation identifying the invalid input. Zero removes that component's contribution while retaining raw category grades for later analysis. Both sets must remain saved and reproducible. The source does not specify how omitted weight keys are handled; this contract does not invent a default-fill policy. [R095, R145]

Freeze original weights before execution and retain raw grades separately. Exploring either alternative set in results or HTML recomputes totals without judge calls or overwriting original results. Label alternatives, provide reset to the original analysis, and permit alternative configuration/report export. Restoring product/profile defaults and resetting an alternative to frozen originals are distinct operations. [R096, R145]

## Calculations

For valid raw category grades gᵢ on the 1–5 scale and normalized category weights aᵢ, quality Q = Σ(aᵢ × gᵢ). Equivalently, multiply each grade by its original category weight, sum those products, and divide by the original category-weight total. The application performs this weighted mean from retained grades. [R096, R097]

For normalized ranking weights w꜀, wₜ, wᵩ summing to one, the combined score is exactly 100 × (w꜀ × minEligibleCost / cost + wₜ × minEligibleTime / time + wᵩ × Q / 5), subject to the zero-weight and verified-zero-cost rules below. The three displayed contributions are the corresponding terms multiplied by 100. [R098, R099]

Compute each minimum from configurations eligible for that particular ranking, after applicable filters and judge grouping; recompute when that eligible population changes. Preserve numerical precision throughout normalization, quality, minima, contributions, scoring, and comparison; round only for display. A displayed tie is not an exact numerical tie. Exact ties use a stable result identifier deterministically, keeping separate runs of one configuration distinct. [R099, R124, R131]

## Eligibility and exceptional data

Default shortlists require completed execution, verified required checks, valid required grades, and a raw business rules/specification grade of at least 4/5. Failed or unverified required checks cannot satisfy verification. A high weighted quality score cannot bypass these gates. [R100]

Exclude an entry missing a positively weighted measurement from the affected ranking and explain why; never redistribute its weights across available components. A zero-weight component contributes nothing and requires no measurement for that component. This does not waive the separate required-grade and business-grade eligibility gates. Keep failed, incomplete, and excluded entries in full tables with their status visible. Direct lowest-cost, shortest-time, and highest-quality shortlists apply the eligibility and measurement requirements relevant to their ranking. [R100]

When a verified eligible minimum cost is zero, every verified zero-cost entry receives its full cost contribution, 100 × w꜀; positive-cost entries receive zero cost contribution. Unknown cost never becomes zero. If fewer than five qualify, show only that number; if none qualify or no ranking can be computed, explain the cause. The source gives no corresponding zero-elapsed-time convention; treat that as an unresolved calculation case rather than inventing a ratio or copying the cost exception. [R101]

## Comparison and presentation contract

Within a matching template, display and filter by originating machine, harness/model/effort, environment policy, concurrency, and judge configuration. Machine differences are intentional inputs, not hash mismatches. Apply common selected weights to a combined report while retaining each result's original weights and grades. Keep quality and combined rankings separate by judge configuration. Expose local/imported provenance, cost bases, and telemetry limitations so template compatibility never implies identical measurement conditions; the source does not mandate automatic exclusion solely for differing cost bases. [R124]

[M13](13-standalone-html-report.md) uses the README presentation as its starting point and identifies the template and full SHA-256 in every report. Measured tables default to highest known cost first, unknowns last; quality tables default to descending unrounded quality within judge groups. Support sorting, machine/configuration/judge filtering, and task-detail/evidence inspection. [M15](15-terminal-interface.md) and M13 consume the same scoring contracts. [R131]

## Acceptance scenarios

- Save and reload both sets through YAML/TUI. Ranking inputs 2:1:1 preview 50%:25%:25%, independently of category weights. Reject negative, nonfinite, unknown-category, and all-zero inputs. With web grades UX 4 and all others 5, default quality is 4.75; zero UX weight yields 5 while retaining raw UX 4. Exercise defaults, alternatives, reset, and export without judge calls or original-record changes. [R092, R093, R094, R095, R096, R097, R145]
- Two eligible same-judge entries A/B have costs 2/4, times 20/10, and quality 4/5. Equal ranking weights produce A = 76⅔ and B = 83⅓. Filtering out A recomputes B's score to 100. Verify unrounded comparisons and deterministic exact ties across repeated calculations. [R098, R099, R124, R131]
- With weights ½:¼:¼, verified zero cost receives 50 cost points and positive cost receives zero. Unknown cost excludes an entry; selecting zero cost weight removes that measurement requirement. Business grade 3.5 still fails eligibility. Retain all entries in tables, show two when only two qualify, and explain an empty shortlist. [R100, R101]
- Exercise frontend and backend workflows, including an existing-repository baseline, through setup, verification, scoring, and report inspection. Verify calculations and failure explanations, TUI navigation/resizing, common-weight imported comparisons, preserved originals, and separated judge groups. [R124, R145, R149]
