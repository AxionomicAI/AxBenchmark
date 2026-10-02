# M12.1 — review-contract

Parent: [M12 review rules](../../12-quality-judging.md#1-engine-component). Requirements: R004, R033, R035, R037, R077, R082–R091, R144, R154, R158. Findings: F06, F09; shared F02/F15/F18 contracts.

Outcome: publish and implement exact grading/profile, capability, anonymous input and strict review-validity rules. This is a proposed implementation assignment, not evidence of a working judge.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap shared RunUid/TrialRef/ResultId/ReviewId, DTO/error models, contract package/test layout, deterministic fixtures and import-boundary checks. This pure contract slice does not require the full M01/M04/M08 providers or scheduler.

**Bootstrap-published contracts, allowed as injected fixtures:** M01 canonical rubric references/read lease, M04 capability/selection provenance, M03 readiness, M08 JudgeEvidence/behavioral projection and M02 review/TerminalRetention schemas. Publish this child's profile/rubric/requirements types before M01/M06/M07/M09/M16 implementations need them; no adapter import cycle.

## Exact proposed ownership

- `axbenchmark/engine/judging/domain/profiles.py`, `rubric.py`, `grades.py`, `requirements.py`, `inputs.py`, `reviews.py`, `errors.py`, `__init__.py`.
- `axbenchmark/engine/judging/application/interfaces.py`: Bootstrap `JudgeRequirements`, `ProfileCatalog`, `RubricIndex`, `RubricSource` declarations; M12.2 adds worker implementations.
- `axbenchmark/engine/judging/adapters/prompts/review.schema.json`, `review.txt`, `rubrics/web.json`, `rubrics/backend.json`; `adapters/response_reader.py` reads final messages; the strict parser lives in `domain/reviews.py`.
- `tests/engine/judging/test_profiles.py`, `test_rubric.py`, `test_grades.py`, `test_review_validation.py`, `test_input_projection.py`, `test_judge_requirements.py`.
- `tests/fixtures/judging/reviews/`, `rubrics/`, `evidence/`: schema-valid complete fixtures plus malformed JSON, duplicate keys, nested forbidden metadata and foreign-reference cases.

Do not own M06 weights/scoring, M07 preselection, M08 screenshot capture, M02 serialization/storage, M05 process behavior or screen code. Coordinate schema definitions with owners; do not create alternative shared IDs/evidence types.

## Interfaces and rules

`WEB_PROFILE` and `BACKEND_PROFILE` preserve the parent's exact six ordered categories and defaults. Profile applicability follows project type; unknown/mismatching rubric categories are `RubricInvalid` before any invocation.

`RubricSource.for_project_type(project_type) -> RubricRef` and `.parse(document: bytes) -> RubricDefinition` validate M01's frozen reference. `RubricIndex.summary` and `ProfileCatalog.get` expose the same data; display renames cannot change defining rubric bytes.

`Grade.parse(raw) -> Grade | GradeDeficiency` uses exact Fraction values. Accept finite numeric strings/numbers at 1, 1.5, …, 5; reject booleans, null, non-finite values, nonnumbers, out-of-range and off-grid values. Never round or supply a fallback.

Anchors remain 1 missing/largely broken, 3 usable/material gaps, 5 excellent for the scope. A grader cannot change the rubric to compensate for a competitor failure or introduce a repair opportunity.

`parse_raw_review(bytes) -> RawReview | Unparseable` expects exactly one JSON object matching the schema. Reject prose wrappers, trailing material, duplicate object keys, truncated JSON and incorrect field types; retain the entire original response as inert evidence through M12.2.

`validate_review(raw, rubric, admitted_refs)` requires each category once, valid grade, nonempty rationale and an evidence reference resolving within admitted artifact evidence. Require code quality, usability/developer experience and specification comments plus an explicit limitations list, which may be empty.

Return `GradedReview` or `UngradedReview(deficiencies, kept)`. Distinguish missing/duplicate/unknown category, range/step failure, missing/invalid reference, missing rationale/comment and malformed response. Preserve all returned parts and limitations; never use mean/zero/check/process success to fill a hole.

`requirement_for(rubric)` requires screenshot inspection for web. `JudgeCheck.combine` uses M04 supported/unsupported/unknown with source and M03 readiness; unknown never means supported and a model name is not capability evidence.

`JudgeRequirements.check(template, judge)` exposes profile ID/default weights, requirements, capability/readiness and reasons. `session_count(configurations, trials)` returns their exact product after M07's integer validation, without invoking a judge or applying a trial cap.

`admit(evidence: JudgeEvidence)` consumes M08's phase-separated behavioral projection. Resolve ResultId to explicit TrialRef/final artifact outside the prompt; validate all refs against that binding before anonymous aliasing.

Recursively exclude durations, process timing, cost/prices/tokens/hardware, other reviews and every per-task/historical-snapshot screenshot reference, including nested evidence/log metadata. Preserve relevant task/final outcomes, observations, keyboard steps and browser errors.

Admit only final-regression screenshots of the delivered artifact, at 1440×1000 and 390×844 for each included capture. Missing captures remain an explicit limitation/input failure; never substitute a task screenshot or fabricate an image.

Prompt paths/evidence aliases expose no RunUid/TrialRef/result/configuration identity. `redact` removes known harness/model/provider/configuration/machine terms from excerpts; label mapping stays engine-side. Do not rewrite delivered source bytes to simulate anonymity or claim all identifying content can be erased.

`JudgeSessionContract` states one fresh headless session, one artifact, no earlier review/conversation and no repairs. Raw grades remain M12 output; M06 computes Q and decision scores without another session.

Identity exceptions stay typed and fatal. M12.2 supplies run context/coordinator; this slice never maps M01 IdentityMismatch to malformed review, missing evidence or unusable judge.

## Boards and supplied states

No screen ownership. Supply exact fixture data for Judging/JudgingTrials input panels; RubricProfiles web/backend; JudgeCapability unsupported/unknown/readiness failure; ReviewDetail complete; ReviewUngraded with missing Accessibility, Robustness 3.7, missing visual evidence and specification comment.

Include empty limitations, unknown raw response, nested excluded evidence and foreign-reference variants. M12.3 renders supplied deficiencies and actions; no wireframe source edits belong here.

## Acceptance and faults

```sh
pytest tests/engine/judging/test_profiles.py tests/engine/judging/test_rubric.py tests/engine/judging/test_grades.py tests/engine/judging/test_review_validation.py tests/engine/judging/test_input_projection.py tests/engine/judging/test_judge_requirements.py
```

1. Compare every profile key/order/default and anchor with the parent table; frozen rubric mismatch/duplicate categories fail before session admission.
2. Exercise every allowed half-point and reject 0.5, 5.5, 3.7, boolean, NaN/infinity and nonnumeric strings without coercion or rounding.
3. Complete review grades; missing/duplicate/unknown category, blank comment/rationale, wrong type, absent/foreign ref, missing limitations and malformed/duplicate-key JSON remain ungraded. Assert all original parts remain inspectable.
4. Walk every nested projected field/ref; excluded duration/cost/token/hardware/per-task screenshot data is absent while failed behavioral observation, keyboard steps and console errors remain. Final capture dimensions/snapshot bindings are exact.
5. Two trials with different T1 evidence cannot cross-reference. Same-label different RunUids keep distinct mappings, both withheld from anonymous paths/prompt; one review cannot reference another trial's image.
6. Unknown image capability and failed readiness block; backend applicability follows its rubric, never a model name. Session totals of four configurations × six trials equal 24; no model port is called.
7. Pass IdentityMismatch through rubric/evidence fixtures unchanged. Verify frozen source/template bytes and original measurement/check data are untouched by projection/validation.

## Real integration gate

Use real M01 canonical rubric reader, M04 capability provenance, M08 final-regression handoff and M12.2 parser/prompt path. Compare complete input payload trees against admitted refs; run M06 reweighting without altering raw grades or verification outcomes.

**Pending parent obligations:** M12.2 invocation/protection/retention/cancellation and M12.3 screens; M11 invalidation/terminal settlement; real M13/M17 grouping/evidence portability. Domain fixtures alone establish neither screenshot-capable harness support nor successful judging.
