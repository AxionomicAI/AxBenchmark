# M02.1 — retained-records

Parent: [M02](../../02-retained-results-comparability.md#1-engine-component). Requirements: R066, R067, R076–R082, R114, R116, R122–R124, R134, R143, R153–R155. Findings: F02, F03, F06, F09; preserve F07/F08 accounting fields.

Outcome: serializable immutable execution facts, portable run/result/trial bindings and append-only review/invalidation semantics. This is proposed implementation work, not evidence that the runtime exists.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap package/test layout, shared ID/value objects, deterministic fixture builders and import-boundary check; [M01.1](../M01/01-canonical-definition.md) canonical definition/identity implementation.

**Bootstrap-published contracts, allowed as injected fixtures:** M08 check/evidence schemas; M10 measurement/cost/coverage/rate schemas; M12 rubric/raw-grade/review schema; M07 complete credential-free frozen launch. These must validate published fields and scopes. Real verification, accounting and judging services are later integration gates, not entry dependencies.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/engine/results/domain/records.py`, `bindings.py`, `facts.py`, `reviews.py`, `invalidation.py`, `comparison.py`, `errors.py`.
- `axbenchmark/engine/results/serialization/record_codec.py`, `canonical_digest.py`; `axbenchmark/engine/results/schemas/retained-result-v1.schema.json`, `run-binding-v1.schema.json`, `run-invalidation-v1.schema.json`.
- `tests/results/test_record_codec.py`, `test_bindings.py`, `test_immutable_facts.py`, `test_review_append.py`, `test_invalidation_overlay.py`, `test_trial_grouping.py`; fixtures in `tests/results/golden/` (`run-binding.json`, `result-trial-1.json`, `result-trial-2.json`, `invalidation.json`, `digests.json`).

Use shared `RunUid`, `RunLabel`, `TrialRef` and `ResultId`; do not create alternative IDs. The parent defines exact fields, cardinalities, digest boundaries and errors. Export domain constructors and pure operations for `RunBinding`, `RetainedResult`, `EffectiveResult`, `TrialGroup`, `ComparisonScope`, `RunInvalidation`, review append, and import classification. No filesystem, daemon, provider calls or UI belong here.

`ResultId ↔ TrialRef` is one-to-one. Run binding covers the complete frozen launch even when a package selects only some results. Execution seal freezes `facts_digest`; reviews and invalidation change a later snapshot `payload_digest` without modifying that seal. Review IDs retry identically or conflict; an additional review cannot replace the original. A run invalidation overlays every trial, including ones loaded later.

## Acceptance and faults

Run `pytest tests/results/test_record_codec.py tests/results/test_bindings.py tests/results/test_immutable_facts.py tests/results/test_review_append.py tests/results/test_invalidation_overlay.py tests/results/test_trial_grouping.py`:

1. Same label/configuration on two machine-generated UIDs yields separate ordered trial groups. Rebinding one UID to another frozen launch, one result ID to another trial, or one trial to another result ID returns the named conflict with both bindings.
2. Two trials contain different T1 outcomes/log refs. Every serialization round trip preserves result ID, full TrialRef, task and phase. Mismatched body scope fails; `trial_index=0` and an index beyond frozen count fail.
3. Sealed measurement/evidence mutation fails. Identical original review retry is a no-op; a different second original fails; additional review cost stays separate. Review changes affect snapshot digest but leave facts digest unchanged. Import timestamp, local path and relay changes affect neither portable digest.
4. Invalidate an already sealed run with completed reviews. Both trials retain facts/reviews and original statuses while effective statuses become non-comparable. Repeat the detection without replacing first evidence; conflicting reuse of invalidation ID fails. Invalidation survives codec round trip.
5. Preserve unknown/partial values, numeric zero with its original cost basis, declared billing, frozen `per_usd` units and missing-rate reasons. M18 hardware envelopes retain explicit TrialRef while shared host series remains experiment-scoped; no codec attributes host energy to a competitor, substitutes zero, calculates rates or decides scoring eligibility. Credential values are structurally absent.

**Wireframes:** no rendering ownership. Fixtures provide the distinct rows/states for ResultsTrials, ResultsHalted, ResultOrigin, ResultOutcomes and ResultReviews.

**Real integration gate:** M08/M10/M12 producers serialize real outputs through these schemas; M17 archive round trips preserve the exact portable digests/bindings; M06 rejects the effective invalidated scope. Producer fixtures alone do not satisfy this gate.

**Pending parent obligations:** durable storage/finalization/publication/API (M02.2), clients (M02.3), and real cross-module integration.
