# M01.1 — canonical-definition

Parent: [M01](../../01-template-library-identity.md#canonical-definition-contract--axbenchmark-definition1). Requirements: R067, R068, R115, R118–R120, R140, R141. Findings: F01, F10.

Outcome: an implementer can produce and validate one portable definition without a library store, daemon or interface. This is proposed work; no implementation exists by virtue of this document.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap's importable package/test layout, shared path/hash/id vocabulary, schema fixture builders and import-boundary check. No other M01 child, scheduler or real producer is required.

**Bootstrap-published contracts, allowed as injected fixtures:** M08 `CheckFormat`/suite reference schema; M12 `RubricSource.parse`/profile schema; M05/M08 execution/service/dependency reference schema. Fixture parsers must enforce these published shapes and return reference summaries; they cannot accept every byte string. Real parser integration remains a parent gate.

## Ownership and contracts

All paths below are proposed repository-relative implementation paths. Own:

- `axbenchmark/engine/library/domain/paths.py`, `definition.py`, `manifest.py`, `errors.py`: `RelPath`, `PayloadRole`, `PayloadFile`, `DefinitionInput`, `TemplateDefinition`, `BaselineFile`, `CanonicalPayload`, `ManifestEntry`, `CanonicalManifest`, canonical validation errors.
- `axbenchmark/engine/library/application/definition_codec.py`: `DefinitionCodec.write/read` and injected reference validation; `axbenchmark/engine/library/schemas/definition-v1.schema.json` and `manifest-v1.schema.json`: closed structural schemas, backed by semantic validation.
- `tests/library/test_definition_codec.py`, `test_manifest.py`, `test_path_validation.py`, `test_reference_closure.py`; fixtures `tests/library/golden/definition-v1.json`, `manifest-v1.json`, `identity-v1.sha256`, and `payload/` containing all bytes referenced by those vectors.

Extend only M01's Bootstrap declarations in `axbenchmark/engine/library/ports.py`; do not edit other owners' parsers or install private substitutes. Domain code remains I/O-free; `DefinitionCodec` application code injects schema readers. Public/internal contracts and the complete serialized shapes are normative in the parent canonical-definition section. There is no RPC, persistence, event or display-title field in the descriptor.

The writer accepts authored paths, normalizes NFC, detects collisions, generates `metadata.json`, validates closure and returns `CanonicalPayload`. The reader preserves bytes and rejects noncanonical descriptors/manifests; it never repairs an import. Template identity is SHA-256 of canonical manifest bytes, covering the descriptor. `BaselineFile.executable` is semantic identity input; physical permissions are excluded.

## Acceptance and fault checks

Run `pytest tests/library/test_definition_codec.py tests/library/test_manifest.py tests/library/test_path_validation.py tests/library/test_reference_closure.py` against the following cases:

1. Three fixture authoring routes representing M09, M16 and M17 yield the same full descriptor/manifest bytes and 64-character digest. Real producers are not claimed by this fixture test. Reordering supplied files or changing display name/description/task title has no effect; task/check order, defining text, rubric and executable-flag edits each change identity.
2. Empty baseline is exactly `{kind: empty, files: []}`. Missing `baseline`, missing `executable`, unknown version/field, duplicate JSON key, role mismatch, orphan file, missing prompt and dangling check/profile reference fail with a field/path-specific error. A suite entry path cannot escape declared support files.
3. Fixed payload bytes with CRLF, LF and non-ASCII content are preserved; canonical writer bytes match the checked-in vectors. NFD authored paths normalize; a canonical import with NFD, unsorted set arrays, pretty-printed metadata or noncanonical manifest is rejected. Absolute/traversal/backslash/drive-like paths, normalized/case-fold collisions and a file used as a parent directory fail before materialization.
4. An executable and regular baseline file with equal bytes yield equal file digests and distinct descriptor flags. Flipping only one flag changes the template hash. Two ZIP entry orders/compression/mode fixtures unpack to identical validated bytes; no archive library is implemented by this child.
5. Run the same golden-vector command on macOS and Linux; record OS and digest. Run the Bootstrap import-boundary check to prove no adapters/UI dependencies entered the domain.

**Wireframes:** no UI ownership. Golden outputs feed `TemplateIdentity`, `ReviseIdentical` and `LaunchMismatch`; formatting those boards belongs to M01.4.

**Real integration gate:** M09.1 and M16.3 must call this writer, M17.1 must reject malformed canonical imports, and actual M08/M12 parsers must validate equal references. M05.2/M08.1 must restore executable behavior from the descriptor on macOS/Linux. These are later integration checks, not entry dependencies.

**Pending parent obligations:** durable registration/restore/delete (M01.2), APIs/defaults/approval (M01.3), screens (M01.4), and the real producer/workspace/exchange checks above.
