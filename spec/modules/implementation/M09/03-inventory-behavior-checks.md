# M09.3 — inventory-behavior-checks

Parent: [M09 catalog and fair observations](../../09-default-inventory-benchmark.md#versioned-inventory-observation-catalog). Requirements: R020, R022–R028, R073–R076, R083, R144, R149. Finding: F11; preserve F01 frozen support closure.

Outcome: a fresh implementer can observe data and public workflows across differing conforming apps, and record historical QA without treating unsupported discovery as an app defect. This is proposed work.

## Entry conditions

**Completed implementation prerequisites:** [M09.2](02-inventory-repository-checks.md), real [M08.2](../M08/02-verification-adapters.md), and their M01/M02/M05 prerequisites. Python Playwright/browser must be available for the required browser gate.

**Bootstrap-published contracts, allowed as injected fixtures:** M11 scheduler, M10 summary acknowledgement/finalizer, M12 judge input and M17 exchange. These providers can be fixture-injected during check development; parent integration requires actual implementations.

## Ownership

Own proposed package sources under `axbenchmark/engine/library/builtin/data/inventory_web_r1/checks/`:

- `data.py`, `behavior.py`, `qa.py`; extend `observers.py` and `observation_rules.v1.json` after M09.2.
- Complete the 17 owned suite entries with M09.1's catalog, then integrate/pin the complete real payload with M09.1.
- `tests/builtin/test_data_checks.py`, `test_behavior_checks.py`, `test_qa_checks.py`, `test_inventory_conformance.py`, `test_observation_limits.py`.
- New `tests/builtin/fixtures/inventory/table_arrays/`, `cards_maps/`, `faults/`, `qa_records/`; snapshot builders create independent T1–T7 trees/history from these fixtures.

Historical generated inventory apps/results and preserved task prompts stay untouched. New fixture apps are test code outside the frozen benchmark payload. No fixture-specific branch or hidden selector may enter production check modules.

## Concrete catalog

Implement `T2_products`, `T2_samples`, `T2_persistence`; `T3_view`, `T3_create`, `T3_edit`, `T3_delete`; `T4_lookup`; `T5_add`, `T5_quantity`, `T5_remove`, `T5_total`, `T5_persistence`; `T6_stock`, `T6_history`; `T7_browser_qa`, `T7_fixes`: **17** checks.

Use the parent's exact expected predicates, source requirements, phase expansion, evidence/deadline rules and `CheckContext.expect` ids. The 15 data/public-behavior checks target task snapshot then delivered artifact; both T7 checks target historical evidence in both phases.

`discover(context, operation) -> Binding | Unobservable(reason, evidence)` executes a frozen bounded state machine. Record candidate roles/names/labels/visible text, navigation states and selected source/event bindings in `discovery.json`. No LLM/manual choice is part of execution.

`observe_data(context, concept) -> DataBinding | Unobservable` maps actual initializer/consumer semantics to observed storage/runtime data, and carries its codec plus provenance. No preferred localStorage key, schema, product field list or application-provided test API is permitted.

Role/name/label discovery uses the parent's frozen operation vocabulary and breadth-first navigation order. Qualify repeated row actions with the resolved product identity; use source event-binding/structural inspection for fallback. Never select the first ambiguous control silently.

Supported codecs cover arrays and keyed/nested records using JSON or delimiter encodings. Identify product/stock/cart/order meanings through observed code/read/write correlation. Unknown/custom encoding, multiple plausible meanings or unresolved controls yield unverified with diagnostic evidence.

T2 opens the real initializer with no T3 controls. Verify sample records/stock in data, not visual cards/rows. Record localStorage writes and subsequent reads, preserving the same absolute file origin and browser profile across close/reopen.

To detect reseeding/overwrites, round-trip a supported product/stock change through the app's observed encoder in disposable test storage and confirm consumption after reopen. This changes test data only; do not patch source, expose globals or require a new API. Unsupported round-trip stays unverified.

T3 chooses valid values from the app's fields/constraints and uses distinguishable test products. Create/edit/delete observations include persistence; choose an unused product for deletion so undefined cart-reference policies are not imposed.

T4 exercises an offered lookup criterion against current data and repeats after a supported edit. No fixed product-name field, substring matching, latency threshold or full-text search obligation is added.

T5 changes between valid positive quantities within known stock, observes removal and evaluates displayed totals under the app's exposed price rules. Missing decodable price/rounding semantics is unobservable, not an invented currency policy.

T6 purchases within stock, correlates purchased quantities with persisted decrements and order-history writes/readback. History may be data-only; do not require an extra history screen, order schema, oversell policy or checkout form.

Capture meaningful workflow checkpoints at both M08 dimensions with one logical state. Use keyboard actions where the resolved workflow supports them; gather console/page errors as diagnostics. These observations do not create extra pass/fail keyboard or zero-console-error requirements.

T7 receives the original scoped invocation's complete/partial evidence status, browser interactions and discovered defect records. Engine verification screenshots cannot prove competitor browser QA. Success prose or an installed browser alone is insufficient.

Corroborated actions must exercise available inventory/cart/checkout workflows. A complete observed trace can prove omitted testing; a claimed skip alone cannot. Incomplete visibility is unverified. No particular testing tool, report file or naming scheme is required.

For fixes, replay each supported requirement-grounded defect actually discovered during T7 against its end snapshot. An unresolved discovered bug fails. Complete observed QA with no discovered defects passes as “no observed unresolved defect”; never require an unnecessary edit. Ambiguous/unreplayable evidence is unverified.

## Required conforming and fault fixtures

Fixture A uses a table, inline forms, explicit labels and JSON arrays under arbitrary storage keys. Fixture B uses cards/dialogs, differently named controls, keyed/nested records and a different storage codec. Both use ordinary vanilla code and direct-file entry.

Each has a valid T2 snapshot with sample products/stock/persistence but no inventory list or management UI. T3 supplies its own UI; T6 history may remain data-only. Fixture names/keys/DOM structure must never be visible to the discovery algorithm.

Create faults independently: no samples, no stock, overwrite on reopen, lost CRUD edit, stale lookup, wrong cart quantity/removal/total, lost cart, wrong stock decrement, lost order history, skipped browser QA and discovered-unfixed bug. Preserve a precise expected failing check set per fixture.

Add ambiguous duplicate controls, unknown codec, partial tool visibility, missing browser, timeout and malformed evidence. These prove limitations/classification, not conforming-app failure. Missing later commits remain M09.2 fault fixtures.

## Acceptance

Run `pytest tests/builtin/test_data_checks.py tests/builtin/test_behavior_checks.py tests/builtin/test_qa_checks.py tests/builtin/test_inventory_conformance.py tests/builtin/test_observation_limits.py` with mandatory browser cases.

1. Both full fixtures pass all 30 checks at-task/final; their T2 snapshots pass without T3 UI. Vary ids/storage keys/order/layout while retaining semantics to prove there is no fixture-specific selector or schema.
2. Each isolated defect fails only predicates whose resolved observations contradict requirements; unobservable cases remain unverified. No arbitrary exception, exit code, console line or absent screenshot becomes an application failure.
3. Preserve 30/30 phase denominators with 19 final-artifact/11 historical targets. Change T7 app behavior to create a regression while historical commits remain unchanged; retain both sides and original snapshot provenance.
4. Confirm paired screenshot dimensions/state, immutable source bytes, profile isolation across checks/trials, same-origin reopen within workflows, no surviving browser descendants and helper/reference closure.
5. Complete/incomplete T7 records prove pass/fail/unverified distinctions; an engine-run workflow cannot satisfy author QA. Judge input includes only final-regression delivered-artifact screenshots, not T7 historical browser traces.

## Real integration gate

Run the actual complete packaged suite through M01/M05/M08/M02 on both conforming fixtures and defects, using real browser and Git adapters. M09.1 now freezes the released pin; M10 queries agree on per-phase counts and evidence is durable before completion.

**Pending parent obligations:** M09.4 screens, real M11 planner-free multi-trial launch/finalization, M12 handoff, M17 round-trip/M13 report provenance and macOS/Linux execution. Browser fixture success does not establish production harness visibility for every T7 action.
