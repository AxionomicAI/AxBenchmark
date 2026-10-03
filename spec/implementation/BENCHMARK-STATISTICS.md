# Benchmark statistics and configurable ranking factors

Status: binding implementation supplement; proposed behavior and acceptance, not an implemented feature or validated harness capability. Requirements: R173–R176. Applies to the existing M05/M10/M06 and consumer children below; this supplement adds no child or graph node.

Reference provenance: the user-supplied Beauty shop benchmark `RESULTS.md` and companion `run_bench.py`, reviewed 2026-10-02. They establish the requested **Gen tok/s**, **In tok (cached)**, **Out tok (reasoning)** and **Files / LOC** presentation and the intent of summed request generation windows and final delivered files. The self-contained rules below require matched timing coverage, exact arithmetic and explicit text decoding; the example's implementation is not the accounting contract or a runtime dependency.

This extends [SPEC §6](reference/SPEC.md#6-quality-grading-and-configurable-weights), [M06](reference/modules/06-scoring-rankings.md) and [M10](reference/modules/10-measurements-cost.md). It adds retained generation throughput and artifact statistics and promotes existing input/output usage to primary table columns. Instantaneous live rates remain advisory. Raw quality grades, the six category weights, required-check gates and independent judge validity are unchanged.

## Metric identity, evidence and scope

| Stable key | Unit / primary label | Trial value | Configuration ranking value |
|---|---|---|---|
| `generation_rate` | output tokens/s / Gen tok/s | Exact matched output / summed matching request generation seconds | Pooled numerator / denominator across every trial |
| `input_tokens` | tokens / In tok (cached) | Normalized cumulative input across competitor requests | Arithmetic mean of trial totals |
| `output_tokens` | tokens / Out tok (reasoning) | Normalized cumulative output across competitor requests | Arithmetic mean of trial totals |
| `file_count` | files / Files | Included regular paths in final delivered snapshot | Arithmetic mean of trial counts |
| `loc` | physical text lines / LOC | Included text lines in that same snapshot | Arithmetic mean of trial counts |

Files / LOC is a grouped display of two independent metrics and ranking factors. More output, files or lines does not establish better quality; measurements describe the complete tested configuration, not isolated model capability.

1. Count only competitor execution, including its nested agent requests and own tool-driven work. Planning, grading, observer/classifier calls, readiness probes and external verification have separate accounts and contribute no entries to these statistics. Shared server/proxy totals require unambiguous competitor attribution; temporal coincidence is insufficient.
2. Token totals describe cumulative request traffic used for accounting, not current context-window occupancy or unique text. Repeated input across requests legitimately recurs. Cached input and reasoning output are native detail categories with their own known/partial/unknown coverage; normalization records whether each source category is included in or disjoint from its parent. Never add an overlapping detail twice.
3. Normalize native usage receipts through M10.1: stable request IDs, invocation IDs, full `TrialRef`, task/session/agent identity and source-account scope; deduplicate retries and terminal reports. Resolve nested request versus parent cumulative overlap using explicit source semantics. Unresolvable overlap is partial, never a guessed complete total.
4. Every metric carries `metric_policy_id`, version and digest; exact rational value or null; `known | partial | unknown`; coverage; units; source basis; contributing evidence references/digests; and typed limitations. `known` requires complete evidence for its declared scope. Counts are nonnegative integers before trial averaging. Missing native categories remain null, never inferred zero.
5. Usage/timing evidence identifies its full request/invocation/trial scope and token-normalization policy. Artifact evidence identifies its immutable snapshot and counting policy. Preserve observed values when ranking excludes them. No classifier, grading model or inferred text estimate supplies missing tokens, timing, file counts or LOC.

The additive metric contract must preserve these fields through local/remote API codecs and portable records:

| Field group | Required meaning |
|---|---|
| Identity | Stable key, full trial/result binding, optional task/invocation/request binding and explicit scope kind. |
| Value | Exact rational string or null, unit, known/partial/unknown state; rounded text is nonauthoritative. |
| Coverage | Expected/observed request or artifact roster, missing contributors and partial subset values; unknown denominator stays unknown. |
| Definition | Policy ID/version/digest, normalization semantics, timing basis or artifact counting/scope policy. |
| Evidence | Source receipts and content hashes, source clock information where applicable, safe retained references. |
| Limitations | Typed reasons and full affected identities; zero requires complete evidence, not a fallback default. |

Retain model/native-tokenizer provenance for interpretation, but do not require identical models or tokenizer IDs across competitors. Compatibility concerns the normalized input/output semantics and measurement policy. These benchmarks intentionally compare different models; native token counts need not represent identical amounts of text.

## Retained generation throughput

For matched requests `P`, retain `N = Σ output_tokens(request)` and `D = Σ generation_seconds(request)`, then compute `generation_rate = N / D`. Store exact per-request numerator/denominator as well as exact aggregate values. Parse source counts and timestamp decimals without binary floating-point conversion; divide and round only at presentation.

Each timing receipt binds request ID, source ID, full `TrialRef`, invocation/task/session/agent, start/end timestamps or native duration, clock identity/epoch/resolution, timing basis, token basis, evidence digest and normalization-policy digest. A native reported decode duration uses `native_decode`; proxy completion-start→end uses `proxy_stream_window`; an observed first/last stream window uses its explicitly versioned `measured_stream_window` basis. Record which emitted token categories the window covers.

Validate start/end against the same request and compatible clock domain; clocks need not be synchronized across independent requests to sum their valid durations. Nonfinite timestamps or duration values are invalid evidence. Keep original timestamp precision and any source uncertainty visible; exact arithmetic preserves reported precision without inventing measurement accuracy.

Native decode and proxy/observed streaming windows are distinct measurements. A window qualifies only when its paired normalized output count covers the same work, including reasoning if output includes it. If the source cannot establish that pairing, retain the observation and mark that coverage unavailable. A documented proxy-window basis may retain source overhead as a disclosed limitation; it cannot claim pure native decode speed.

- Sum request work intervals even when subagents run concurrently. Do not union overlapping intervals. Label the retained value **per-request generation throughput**; it is neither wall-clock throughput nor aggregate parallel service capacity.
- Never substitute whole task/run elapsed time, time to first token, tool time, response latency, inferred durations or a mean of instantaneous rates. Any separately displayed wall throughput has a different key and is outside these ranking factors.
- Include a request in `P` only when both normalized output and a matching strictly positive duration are known under compatible policies. Whole-scope throughput is known only when the complete request roster and output scope are covered by valid pairs.
- Missing start/end, zero/negative duration, clock mismatch, unpaired output or incomplete request discovery supplies a typed limitation. Never divide by zero or emit infinity. Known zero output with positive matching duration is valid throughput zero; no positive duration means unknown even when output is zero.
- With incomplete pairing, retain `matched_output_tokens`, `matched_generation_seconds`, matched rate and request/token coverage as a **partial matched subset**. Never divide all output by only some requests' durations. Missing total output makes the coverage ratio unknown, even if matched counts are known.
- Sum only compatible timing/token bases. A mixed-basis trial remains explicitly mixed/partial for a single throughput value; raw per-basis rows remain inspectable. Do not silently convert proxy windows to native decode timings.

One configuration trial covers every task and attributed competitor request. Preserve per-task/request detail where available. Across repeated trials, generation throughput is the exact pooled ratio `Σ N_trial / Σ D_trial`, labelled **pooled**; expose each trial's rate and the per-trial min–max separately, never label the pooled value an arithmetic mean.

Evidence of zero output still needs a closed, complete usage scope. An empty or undiscovered request roster does not prove zero work or establish a throughput denominator. Timing coverage and native token coverage are independently inspectable.

## Final delivered files and physical LOC

M10.2 counts the immutable final delivered artifact snapshot for each trial, through M02 snapshot-reader ports. Pin the artifact manifest digest, template/baseline identity, output scope and versioned counting policy before computing. Never scan a subsequently changing workspace or sum per-task snapshots. Optional per-task details cannot replace the final snapshot used for ranking.

`file_count` counts regular file paths once within the pinned delivered scope. Binary assets count as files. Do not follow symlinks or traverse external paths; retain link entries as excluded inventory with a reason. Distinct regular paths count separately even when contents share a digest. Unsafe or incomplete manifests cannot yield a complete count.

The count policy includes authored source, tests, documentation and text assets such as README, Python and SVG. Explicit versioned exclusions cover VCS metadata, engine evidence and declared dependency/cache paths, identically across the comparison population. Freeze the actual rules with the artifact manifest. Do not blindly exclude a valid build/delivery directory; the fixed delivered scope determines whether it is included. An excluded path may not hide an otherwise required deliverable.

`loc` means **physical text lines**, including blank lines, comments, documentation and text assets; it is not logical code complexity. The policy records a deterministic text/binary classification table, supported strict encodings and newline algorithm. Version 1 supports strict UTF-8 (optional BOM) and BOM-marked UTF-16 LE/BE; no lossy `errors=ignore` decoding is allowed. An unmarked encoding is not guessed.

After strict decoding and stripping only an encoding BOM, count LF, CRLF and lone CR as one line terminator each; CRLF is never two. Empty text has zero lines. Count each terminator plus one final line only if nonempty text remains after the last terminator. Thus `a\n` is one, `a\r\nb` is two, `\n` is one and an unterminated `a` is one. Other Unicode separators remain text under this version.

Known binary entries are excluded only from LOC with their classification reason; their file count remains included. Unreadable text, unsupported/unknown encoding, ambiguous classification or missing required bytes makes LOC partial/unknown, never zero. A decode failure alone does not prove binary. The policy's binary signatures/media rules and text rules are retained and tested; source and declared text assets must satisfy strict text decoding.

Retain included/excluded inventories with safe relative paths, kind, bytes, content digest, classification, encoding, count and reason; record inventory totals, snapshot scope and policy digest. Whole-project size includes surviving baseline files and must be labelled **final snapshot size (baseline included)**. Existing-repository baseline/delta detail may be shown descriptively when available; never label the entire final snapshot newly generated. No new baseline-diff feature is required here.

## Trial summaries and complete populations

M10 alone prepares summaries keyed by `ConfigurationSubject = (run_uid, configuration_id)` and the full frozen trial roster. Preserve per-trial values, contributor receipts, totals, arithmetic means where defined, min–max and missing indices. Do not combine runs that share a label or configuration name.

Input/output/file/LOC ranking values use exact arithmetic means over every trial; display the individual trial totals/counts plus means and ranges. Cross-trial token totals remain available and distinct from means. A cross-trial sum of file counts is only a sum of snapshot sizes, never a unique project file count. Generation uses the pooled ratio above, with retained summed numerator/denominator and per-trial range.

Summary metadata declares its aggregation operator (`sum`, `mean`, `pooled_ratio`, `min`, `max`) and original trial roster. Clients format the engine's projection; they do not recalculate means or reconstruct a different scope from displayed rows.

Any missing/unknown expected trial makes the corresponding full-roster summary unknown; any partial trial makes it partial unless an unknown already applies. Preserve observed subset values separately. Do not drop trials, shrink denominators, use partial min–max as full-roster ranges, or convert missing counts to zero. A single-trial subject is exactly its trial value.

## Eight ranking components and versioned weights

The complete component set is `cost`, `time`, `quality`, `generation_rate`, `input_tokens`, `output_tokens`, `file_count`, `loc`. Product defaults preserve equal cost/time/quality weights and assign zero to all five new factors. The independent six-category quality weights and quality formula are unchanged.

Use `RankingWeightsV2 {schema_version: 2, weights: {...}, directions: {...}}`. Both maps contain exactly the eight known component keys. Weight entries are finite nonnegative exact numbers with a positive grand total; reject missing keys, extras, negatives, nonfinite values and all-zero weights with field-specific errors. API, CLI/YAML export and editors emit complete maps.

Cost/time directions are fixed `lower`; quality is fixed `higher` with its existing absolute `/5` factor. Every new factor requires explicit `higher` or `lower` before its weight can become positive. At zero weight its direction may be null. Reject invalid direction values; do not invent preferences based on a metric's name. UI descriptions explain that direction reflects the user's priority and does not alter grades.

Normalize all eight ranking weights together, independently from category weights. Preserve originally supplied exact values and original schema provenance. Version 1 records with the exact legacy three-key ranking map migrate in memory to five explicit zero weights and null new directions, retaining original bytes/digest and version. Do not reinterpret malformed/incomplete legacy maps or rewrite sealed records. Version 2 omissions are errors, never legacy defaults.

Freeze originals through M07 before launch; retain them through M02. Presets, normalized preview, defaults, alternative weighting, reset-to-original and alternative configuration/report export all use the same versioned contract. Existing common-weight resolution across a judge group remains binding; differing originals use the extended product/profile defaults with the existing explanation.

For normalized weights `w_k`, the combined score and component contributions are:

```text
score = 100 × Σ(k in enabled components) w_k × factor_k
contribution_k = 100 × w_k × factor_k
quality factor = Q / 5
```

For any enabled new metric with complete compatible subject value `x`:

| Direction / reference | Exact factor |
|---|---|
| `lower`, eligible minimum `m > 0` | `m / x` |
| `lower`, eligible minimum `m = 0` | `1` for complete proven zero; `0` for positive values |
| `higher`, eligible maximum `M > 0` | `x / M` |
| `higher`, eligible maximum `M = 0` | `1` for every eligible complete zero value |

Zero is proven only by complete metric evidence for the full scope. These new-metric conventions do not modify the existing verified-zero-cost rule, USD cost arithmetic or guarded zero-elapsed-time state. Never generalize the new count/throughput zero rule to time. Quality continues to divide by 5, not population maximum quality.

Skip zero-weight components before measurement lookup, compatibility checks, extrema or division. Their unavailable values never exclude an otherwise eligible subject. Their raw columns stay visible. With all new weights zero, original three-component scores, eligibility, ordering and zero-cost/time behavior must remain exactly unchanged.

Expanded weights affect `COMBINED` rankings. Existing lowest-cost, shortest-time and highest-quality rankings retain their own required components and default quality/check gates; an enabled extra component in a combined plan does not impose its data requirement on an unrelated specialized ranking. Original-ranking agreement compares the effective normalized eight-key plan, enabled directions and selected metric policies after legacy normalization. Equal weights with conflicting enabled directions/policies are not a common original plan: use the existing labelled profile-default resolution with new components zero, or an explicit common alternative. Disabled-component policies do not create data requirements.

## Eligibility, compatibility and exact ordering

1. Resolve the pinned matching-template population, filters, invalidation overlays, judge group and common weights. Filters select whole subjects; selected reviews and every frozen trial index remain mandatory.
2. Apply the existing per-trial completed execution, verified required checks, valid required grades and raw business rules/specification `>= 4/5` gates. No metric direction or zero quality weight waives those gates.
3. Require every positively weighted metric to be complete, known and policy-compatible in every trial. Match token normalization, timing basis and artifact scope/counting policy as applicable. Select an explicit comparison policy/basis before forming the eligible population; if no common policy is selected for incompatible candidates, explain that the ranking is uncomputable rather than choose an advantageous subset silently.
4. Exclude incompatible/missing/partial subjects with typed `metric_unknown`, `metric_partial`, `metric_basis_incompatible`, `metric_policy_incompatible` or `metric_scope_incompatible` reasons, metric key and failing full TrialRefs. Existing missing-trial/grade/check and cost/time reasons remain intact. A compatible selected cohort may rank while excluded raw rows remain visible.
5. Only then compute each enabled metric's minimum/maximum from that **same eligible population**. Never take each component's reference from a different roster. Recompute references when filters, alternatives or overlays change; never renormalize weights per entry.
6. M06 uses exact rational arithmetic for normalization, references, factors, contributions, scores and ordering. Round only for display. Preserve the existing deterministic exact-tie key and separate runs; a displayed tie is not an exact tie.

M10 owns normalization and aggregation; M06 consumes prepared summaries and remains pure. Alternative weighting/direction changes and offline recomputation make no model calls, server probes or new measurement requests. None of these statistics enters M12 judge evidence or influences raw rubric grades.

Normal source/artifact evidence remains admitted to judging under M12's existing evidence contract. Excluding measured file/LOC totals and token/speed statistics does not exclude the delivered code, tests or documentation needed for a valid review.

## API, clients and immutable finalization

Extend existing `measurements.result`, `measurements.task` and `measurements.trials` DTOs with scoped metric observations and summary metadata. Task projections expose request statistics when available; final snapshot statistics are trial-scoped, not fabricated task counts. Existing retained input/output values may be normalized when their provenance supports it; historical unrecorded throughput/artifact counts remain null. No additional API is required merely to fill a column.

Scoring requests and responses add schema-2 weights/directions, selected metric comparison policies, enabled-component references and exact contribution/eligibility breakdowns. Registry schemas and both engine clients preserve unknown/partial states and exact rational strings. A policy selection cannot assert equivalence between incompatible native and proxy timing.

Results, measurement detail, rankings, TUI, CLI and standalone reports expose **Gen tok/s**, **In tok (cached)**, **Out tok (reasoning)** and **Files / LOC**, including units, pooled/mean labels, coverage, source flags and inspection links. Compact layouts may group or reveal columns in detail but cannot hide their availability or ranking effect. Cached/reasoning detail uses `?`/partial markers independently of parent totals. Sorting does not reinterpret null as zero.

Weights editors expose all eight factors and require a new metric's direction before enabling it. Breakdowns and stacked contribution charts use the enabled set; show explicit exclusions and reference values. Default charts/weights retain their current three-component behavior. Statistics never imply an accuracy claim or that producing more code improves quality.

Before M02 seals, M10's existing drain/finalization barrier awaits accepted request usage/timing receipts and captures/counts the pinned final artifact snapshot. Persist raw receipts, normalized metrics, coverage, counting inventories and policy/source digests with stable operation IDs, then obtain the existing measurement finalization receipt. Bind that receipt to the timing and artifact evidence digests as well as the full trial roster.

Missing or unsupported measurement evidence produces explicit partial/unknown fields and can settle finalization; a storage/receipt failure leaves finalization and report/export readiness pending. Stop/interruption/recovery follow the same barrier and retry rules. Changed bytes under an existing operation ID fail. No later classifier result or fresh workspace scan rewrites sealed metrics; already sealed historical nulls stay null.

M02/M17 retain a canonical portable metrics representation and safe relative artifact references, never absolute source-machine paths. The reference filenames above are provenance only. Exports/imports/reports preserve original weights, complete evidence/policy hashes, request pairing and immutable snapshot digests; offline viewing requires neither the original workspace nor model/server access.

## Ownership in existing children

All source/test paths below are proposed runtime files under `solution/`, not claims that tests already exist. Shared API/registry files require coordination with their current owners. Publish additive DTO/port fixtures through Bootstrap before consumer implementation; real integration remains required.

| Existing owner | Binding work / proposed additions |
|---|---|
| [M05.2](M05/02-isolation-observation.md), M05.3–M05.6 | Capture acknowledged usage/timing facts with request, clock, token and source basis through existing observation ports; extend adapter fixtures/tests. Unsupported native timing remains unavailable. |
| [M10.1](M10/01-task-accounting.md) | Own `axbenchmark/engine/measurements/domain/throughput.py`, additive usage/journal DTOs and `tests/engine/measurements/test_throughput.py`; deduplicate and pair accepted request facts. |
| [M10.2](M10/02-final-accounting.md) | Own `domain/artifact_stats.py`, `application/collect_artifact_stats.py` within measurements; snapshot-reader port consumption, trial summaries/finalization and `test_artifact_stats.py`, `test_statistics_trials.py`, `test_statistics_finalization.py`. |
| [M10.3](M10/03-measurement-screens.md) | Measurement columns/detail and source/coverage/pooled labels through existing API/view-model/screen tests. |
| [M06.1](M06/01-scoring-service.md) | Complete weight schema/migration, directions, population compatibility, references and factors; extend `test_weights.py`, `test_eligibility.py`, `test_rankings.py` and shared scoring vectors. |
| [M06.2](M06/02-rankings-screens.md) | Eight-factor editor, required direction controls, exact engine breakdowns, presets/reset/export and wide/compact states. |
| [M07](reference/modules/07-run-configuration.md) | Freeze complete schema-2 weights/directions and metric policies; migrate legacy configuration input without modifying its provenance. |
| [M02](reference/modules/02-retained-results-comparability.md) | Snapshot ports, safe manifest inventory, metric evidence storage/receipt binding and immutable retained projections. |
| [M13](reference/modules/13-standalone-html-report.md) | Primary columns, enabled-factor charts and actual offline BigInt/rational scorer; run the shared vectors without network/model access. |
| [M14](reference/modules/14-command-line-interface.md), [M17](reference/modules/17-zip-exchange.md) | CLI fields/schema validation and archive round trips of exact values, source policies, directions, receipts and inventories. |
| [M15.3](M15/03-tui-integration.md), [M12](reference/modules/12-quality-judging.md) | End-to-end client integration / explicit exclusion of these metrics from judge input and separate auxiliary accounting. |

## Concrete acceptance and integration gate

Retain reviewed fixture inputs and exact expected outputs in `tests/fixtures/measurements/statistics.json` and extend `tests/fixtures/scoring_vectors.json`; Python and production offline JavaScript must consume the same scoring oracle. These are planned acceptance tests, not implementation evidence.

1. Requests with output/duration `100/2` and `300/3` produce `400/5 = 80` tok/s even when their intervals overlap. Prove the denominator is summed request work, not union/wall time; a mean of rates would give 75 and must fail. Retain exact fractional seconds and test no premature rounding.
2. Add output 200 with missing timing: matched subset remains `400/5`, full output is 600 and throughput is partial; `600/5` must never appear. Test missing request discovery, token-window mismatch, zero/negative duration, clock mismatch, native/proxy separation and zero output with positive duration.
3. Cumulative/delta/final retries and nested parent totals reconcile once; cached/reasoning overlaps never inflate parent totals. Auxiliary classifier/grader/probe requests on the same server never enter competitor counts or throughput. Unknown detail stays null independently from known parent totals.
4. Snapshot fixtures include source, tests, README, SVG, binary asset, declared cache, symlink/external target and valid delivery directory. Verify regular-path counts, explicit exclusions, strict decode failures, empty/LF/CRLF/lone-CR/no-final-EOL lines and unchanged baseline files. Mutation after snapshot cannot change counts; broken inventory/digest prevents complete evidence.
5. Two trials with pairs `100/2` and `900/3` yield pooled `200` tok/s, per-trial rates 50 and 300 and min–max 50–300. Trial input counts 2 and 5 yield total 7 and mean `7/2`; file counts 3 and 4 yield mean `7/2`. Missing/partial trials retain the full roster and block complete ranking values.
6. With one new metric weighted 1, A/B values 2/4 score 100/50 for `lower` and 50/100 for `higher`. Values 0/4 score 100/0 for `lower` and 0/100 for `higher`; 0/0 gives both 100 for either direction only with complete zero evidence. Unknown zero is never eligible.
7. Legacy A/B costs 2/4, times 20/10 and quality 4/5 with equal original weights still score exactly `230/3` and `250/3` when all new weights are zero, including when every new metric is unknown. Test existing verified/unverified cost zero, guarded zero time and quality/check/business gates unchanged.
8. Set weights cost=1 and generation=1 (`higher`), others 0: A/B cost 2/4 and rate 40/80 both score 75. Exclude B for incomplete timing and recompute A's references from the remaining eligible roster: A scores 100. Never use excluded B's rate as the maximum.
9. Reject missing/extra v2 keys, invalid/nonfinite weights, all-zero sets and missing positive-factor direction. Migrate valid three-key v1 records without changing original bytes. Mixed native/proxy timing, LOC policies or artifact scopes yield explicit incompatibility until a coherent cohort is selected; reweight/reset/export preserves originals.
10. Delay timing acknowledgement, snapshot capture, metric append and finalization receipt separately; no seal/export/report may overtake durable work. Missing source data settles as partial; storage faults stay pending. Crash/retry deduplicates; late observations cannot rewrite sealed measurements.
11. Through real M05/M10/M02/M06/M07 composition, run repeated trials, immediately report/export after readiness, import through M17 and compare exact statistics, policies, receipts, roster, original weights and ranks. Exercise stop/interruption and same-label different-UID runs. Production M13 offline JavaScript and M14/M15 clients must agree with engine vectors with all network/model calls disabled.
12. Inspect both harness and decision-backend judge payloads: no metric/weight/rank additions; auxiliary observer/grader usage stays outside competitor statistics. Fixture success does not certify source timing accuracy, model capability or ranking quality; supported adapters require their existing owner verification.
