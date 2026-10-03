# M17.1 — archive-contract

Parent: [M17](../reference/modules/17-zip-exchange.md#1-engine-component). Requirements: R066, R068, R115–R120, R122, R134, R140–R142, R153–R154. Findings: F01, F02, F03, F06, F09, F10.

Outcome: a bounded archive reader/writer and validated immutable package model that preserves M01 definitions and M02 retained snapshots exactly. This is proposed implementation work; validation creates no library/result records and executes no package content.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M01.1 canonical-definition](../M01/01-canonical-definition.md), and [M02.1 retained-records](../M02/01-retained-records.md), including their canonical and portable-binding vectors.

**Bootstrap-published contracts, allowed as injected fixtures:** M01 payload/reference parsers for checks, services and rubrics; M02 `ImportRegistrar.read_incoming(staged_result_dir, staged_run_dir)` and immutable ExportBundle content; shared IDs/TrialRef, clock and typed errors. M01/M02 filesystem registration, M11 jobs and real collectors are not entry dependencies.

## Ownership

Own proposed files, without changing the owners' canonical codecs:

- `axbenchmark/engine/exchange/domain/package.py`, `boundary.py`, `validation.py`, `provenance.py`.
- `axbenchmark/engine/exchange/adapters/zip_reader.py`, `zip_writer.py`; archive-only sections of `axbenchmark/engine/exchange/ports.py`.
- `tests/exchange/builders.py`, `test_package_format.py`, `test_archive_boundary.py`, `test_package_integrity.py`, `test_portable_bindings.py`, `test_archive_modes.py`.
- `tests/exchange/fixtures/manifest-v1.json`, `same-label-runs.json`, `two-trials.json`; malicious archives are generated in temporary directories by builders.

M17.2 owns staging/publication/API adapters and extends the remaining ports; M17.3 owns presentation. Coordinate shared port edits and preserve other workers' additions.

Extend portable reference validation with context_capture/1 closure envelopes and the mandatory per-result axbenchmark-context-analysis-selection/1 descriptor, even when all captures are native-only. Every sorted capture selects its source digest and optional analysis ID/ledger cutoff/digest/status/files; selected files are confined beneath evidence/context/analyses/<analysis_id>/. Cover descriptor/files in package inventory and payload_digest; immutable source stays in facts_digest. Retain sanitized decision profiles/capabilities/calls/raw-answer/pack/group provenance without credential values. M02 validates source/analysis binding; unknown protocol versions are inspectable with unsupported re-execution, not inferred support.

## Concrete interfaces

Implement `PackageFormat.parse_manifest(bytes) -> PackageManifest`, `check_boundary(entries, bounds) -> BoundaryReport`, `check_listing(manifest, files) -> CompletenessReport`, and `check_references(batch, definition) -> list[ReferenceProblem]` from the parent.

`ArchiveReader.index(path) -> ArchiveIndex` reads the central directory; `read(path, name, limit) -> AsyncIterator[bytes]` enforces actual streaming limits. `ArchiveWriter.write(dest_tmp, entries) -> int` consumes explicit PackEntries; no traversal of arbitrary source directories.

Use exactly `TemplateIdentity.compute(payload: CanonicalPayload)` and `.parse_definition(payload)`. Preserve M01 `metadata.json` and manifest bytes, compare canonical reserialization and recomputed digests, and validate role/reference closure. Never generate a competing descriptor from package display metadata.

Result packages contain one RunUid, the complete immutable RunBinding/terminal evidence and explicit `selected_result_ids`; each ResultId binds to one TrialRef and every evidence/review scope agrees. Preserve frozen trial counts and missing slots. Human RunLabel never participates in grouping or collision resolution.

The envelope's `integrity_digest` covers canonical envelope bytes excluding that field; its file rows cover every payload file. M02's distinct per-result `payload_digest` covers the pinned retained snapshot, including reviews/invalidations. Do not confuse either with M01 template SHA-256.

Retain finalization receipts, original-review dispositions, frozen prices/billing/rates including missing values, origin/source IDs and append-only invalidation. Parse without current catalog/measurement lookups. No selected subset can rewrite the immutable full-run binding.

ZIP type metadata may reject links/special files, but executable flags come exclusively from hashed `baseline.files[].executable`. Preserve exact bytes and flags while staging/approved files remain non-writable and staging non-executable.

M02 owns decoding both the selected result directories and shared run directory; M17 assembles their validated inputs without a second retained-record codec. Manifest-only provenance is labelled declared until those records confirm it.

**SQLite interchange boundary.** Portable result/config/run JSON/YAML files are generated by pinned M02 codecs over normalized authoritative SQLite; raw evidence stays copied from allowlisted immutable artifacts. Keep current canonical package bytes/digest rules and exact numeric values. A database snapshot is an analytics/backup artifact, not an accepted ZIP result format: never attach/execute imported schema. Imported derived analyses require their full input/dependency/roster closure and owner validation, otherwise remain explicit inspection-only data without trusted current scores.

## Boundary and failure rules

Reject escaping/absolute/drive/control paths, non-NFC paths, duplicates after NFC/case-folding, file/directory-prefix collisions, links/special files, encrypted entries and unsupported methods. Optional directory entries must be ancestors of inventoried files.

Apply entry count, individual/total inflated-byte and compression-ratio bounds both to the index and actual stream. Check local-header agreement, CRC and truncation; never call extractall. Nothing writes before the boundary report is clean.

Missing/unexpected inventory entries, wrong role/task/trial references, corrupt bytes and unsupported formats produce typed errors with paths/requirements. Staging disposal and registration atomicity belong to M17.2.

Extend the M02-owned portable payload/reference closure with exact `M10Statistic`, `GenerationAggregate` pairings/N/D/rosters, `ArtifactStats` final manifest/inventories, retained policy bytes/version/digests, independent detail/metric availability and complete schema-2 original ranking maps/directions/policies. Transport exact canonical source bytes and evidence through pinned allowlisted openers; do not scan a workspace, recompute counts/means/rates, migrate installed state or reconstruct missing native receipts. A selected trial subset retains full frozen counts/missing slots. Measured artifact exclusion inventory is inert evidence, never an instruction to import active VCS/dependency state.

**Frozen domain contract.** Package models carry exact M01/M02 rubric/profile/version/digest/signature, category/comment/business metadata and domain plan/coverage/modality/reference closure. Validate native source/build/matrix refs, DevOps modes/target authority, agent case/per-boundary modes and verification auxiliary evidence, supplied brief/reference versus candidate documents. Missing declared files, unsafe refs or contradictory bindings reject; recorded collection gaps are retained facts. Preserve v1/golden bytes and known retained rubric versions with no current-default rewrite.

Extend validated M02 metadata/reference closure with immutable `ModelVariantV1`/refs, `ArtifactManifestV1` file descriptions, ordered DAG/adapters, creator/date/source claims, `VariantEvidenceV1`, frozen controls and append-only annotations/mandatory exclusions. An external model-artifact logical file/digest is explicitly a description, not a required ZIP payload or instruction to copy/download weights. Actual retained evidence sidecars remain inventoried/digest-checked; no model binaries are packaged.

M02 codec checks distinct variant ID/descriptor revision/digest, source content versus metadata digests and complete run/config/trial/request bindings. Add `VariantDescriptorConflict` and `VariantAnnotationConflict` to mapped import conflicts with both digests/paths. Preserve date precision/unknown/conflict and proof tiers; matching archive/content hashes establish integrity, not truthful creators/ancestry/effective serving.

**Route, comparison and profile interfaces.** Extend canonical package owner projections/codec closure with M02 sanitized access/hop/model/effort/capability snapshots, full frozen six-cell matrix/expected roster, profile/control/asset/treatment bindings, request-route source evidence and M06 comparison_analysis_link cutoff. Validate immutable ID/version/digest, disjoint competitor versus JudgeGroup scope, per-source variant links and exact numeric semantics. Partial selected-result packages still retain full declared comparison roster/missing-member coverage; no secret locator, raw shell source, executable activation instruction or personal session/auth state is admitted.

## Integrated requirements

R192, R193, R194 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R191 — [authoritative SQLite results and analyses](../RESULTS-DATABASE.md).
R190 — [model variants, lineage and comparison](../MODEL-VARIANTS.md).

R189 — [human review](../M12/05-human-review-web.md).

R184, R185, R186, R187, R188 — frozen domain profile/evidence contracts: [R184](../quality-judges/BACKEND.md); [R185](../quality-judges/MOBILE.md); [R186](../quality-judges/DEVOPS.md); [R187](../quality-judges/AGENTIC.md); [R188](../quality-judges/SPECIFICATION.md).

R174, R175, R176 — [benchmark statistics](../BENCHMARK-STATISTICS.md).

R164, R166, R171 — [context monitoring](../CONTEXT-MONITORING.md) and [decision engines](../DECISION-ENGINES.md).

R179, R180, R183 — [benchmark modes](../BENCHMARK-MODES.md).

Dispatch embedded definitions through M01's v1/v2 codec; preserve outer manifest/ZIP format, exact primary/shared/protocol/check bytes and baseline executable flags. Include format/mode/seven-domain/target/legacy projections and ordered stage refs without constructing another descriptor. Source paths are provenance only; source deletion cannot block imported execution. Archived v1/M09 hashes and outcomes remain unchanged, including one-task legacy labels and zero-file repository shapes.

Retain M02's scoped protocol/check identity and inert start/end commit/tree/history/ancestry/inventory/snapshot proofs, setup-versus-competitor origin and verdict causes. Never import active `.git` metadata/pointers/hooks/config/remotes/alternates, execute package checks or regenerate missing evidence. Reject malformed/cross-trial/missing declared proof references through owner schemas; historical unavailable fields stay not_recorded. Add both-mode empty/populated source-removed round trips with executable flags, empty milestones, missing/dirty/unreadable proofs and preserved original task-cutoff outcomes. New-launch compatibility remains M01/M07's revision gate, not an import rewrite.

**Human exchange contract and acceptance:** M02 supplies only committed human-authored reviews, self-declared reviewer/form-policy identity, exact rubric/evidence/group digests, raw grade parts/comments/limitations/deficiencies and original/additional disposition receipts. Pending original cases block finalized result export; a selected subset cannot bypass that full-run barrier. Exclude local drafts, human working journals, session tokens, loopback URLs and active controller assets. Inspect/import/round-trip graded/ungraded/skipped originals and additional groups without creating a host, automatic browser reopen, model call or new local verified identity. Display human groups and model cost not applicable; unresolved original waiting and actual persistence failure have distinct reasons. Reject forged machine fields or cross-case/result evidence through M02 codecs; retain six grades and exact score parity after offline reimport.

## Acceptance

**Route/profile acceptance:** Golden fixtures round-trip direct/OpenRouter/LiteLLM/chained route and unknown/blocked cells, same-harness profile treatments and route/variant shared facts without fan-out. Reject wrong-role/subject bindings, conflicting snapshot reuse, dangling evidence and secret/source-path leaks; imported snapshots confer no readiness.

**SQLite acceptance:** Export normalized rows to the existing package and reimport into a fresh DB without working journals; exact facts/payload/grades/score provenance survive. Reject SQLite replacement payloads, incomplete analytical dependencies and altered scoped plan/annotation refs without executing code.

**Variant acceptance:** Round-trip combined FT+QUANT, ordered multi-parent/adapter lineage, opaque proof, partial dates and corrections/mismatch with original facts/payload boundaries intact. Reject same-ID/revision different content, altered manifests, conflicting annotation IDs and foreign intervals before mutation. No weight binary, credential/private path or network/model action enters the package.

**Domain acceptance:** Round-trip all six families/all backends after source removal, with actual native images, plan-only evidence, mixed agent modes and inert document/AGENTS/SKILL text. No package content, candidate validator, model, cloud or device command executes; conflicting/missing refs fail before mutation.

Extend archive/roundtrip fixtures with complete and partial request timing, matched subset 400/5 with full output 600, pooled 200 and count mean 7/2, known files/unknown LOC, excluded/link/binary inventories, schema-2 directions/policies and preserved explicit v1 originals. Corrupt policy/receipt/inventory digests or cross-trial bindings and reject atomically; source deletion and ZIP reordering do not change statistics. Delayed metric/snapshot writes cannot pass finalization/export; Python/HTML rank parity survives reimport with network/model access disabled.

Extend existing fixtures for native-only and delayed/partial analysis, explicit local overlap/unknown attribution, distinct decision/harness/human fingerprints and offline or disabled-engine operation as applicable. Assert unchanged scope/digests, no fabricated values/calls, and no reclassification triggered by viewing, export/import or navigation.

Run `pytest tests/exchange/test_package_format.py tests/exchange/test_archive_boundary.py tests/exchange/test_package_integrity.py tests/exchange/test_portable_bindings.py tests/exchange/test_archive_modes.py`:

1. Round-trip built-in/planner canonical fixtures without rewriting metadata; display renames preserve identity, task order/protocol/executable-flag edits change it. Noncanonical JSON, duplicate keys and missing roles fail.
2. Exercise each path/kind/collision rule and each bound just below/above the limit. An index that underreports inflated bytes cannot bypass the running total or ratio guard. Corrupt CRC/header/truncated archives fail before registration.
3. Repack with reversed order, stored/deflate, timestamps and safe permission changes: exact canonical bytes/digest remain equal. Identical baseline bytes with opposite semantic flags stay distinct; archive permissions cannot override them.
4. Two machines' same-label/same-configuration different-UID runs stay separate. Two trials keep distinct T1 log/screenshot references. Reject cross-run results, occupied slots, duplicate selected IDs and mismatched frozen counts.
5. Corrupt each required file group and snapshot/envelope digest independently. Preserve unknown/partial measurements, frozen rates/billing sources and invalidation identity through serialization; no missing rate becomes a current lookup.
6. Export A → import B → export C preserves source origin/result ID and appends relay history without replacing the originating machine.

**Wireframes:** no UI; supplies ImportUnsafe, ImportIncomplete, ResultPackagePick/ResultPackage, ResultMismatch, ResultImportConflict and validation progress data for later children.

**Real integration gate:** M17.2 + real M01.2–3/M02.2 must import actual M09/M16 canonical packages on macOS and Linux. M05/M08 restore executable behavior from descriptor flags while approved revision modes remain 0444/0555. Record which OS checks were run.

**Pending parent obligations:** durable safe staging, pinned finalized export, atomic shared publication/recovery, API/jobs and no-execution guards (M17.2); all screens (M17.3); real finalization and cross-OS gates.

### Automated judge assessment storage binding

Include immutable judge-assessment identity, selected group/access/profile/effort closure, call assessment links, optional actual Review link, reserved identity and terminal dispositions in the M02 codec's package closure. Failed assessments may validly have billable calls/routes but no Review. Reject omitted selected snapshots, wrong assessment/group/result/purpose and identity collisions without inventing placeholder reviews or activating credentials.
