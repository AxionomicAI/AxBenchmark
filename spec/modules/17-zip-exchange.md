# M17 — Portable ZIP exchange and validation

## Purpose and authority

This proposed contract defines portable template and result exchange for AxBenchmark. It specifies future behavior, not implemented functionality; [SPEC.md](../SPEC.md) remains authoritative. Users export approved work, run AxBenchmark independently on another machine, and import its outcomes only after template and package integrity checks pass. Harness/model/effort selections remain saved per benchmark through [M07](07-run-configuration.md). **R009, R036**

Exchange supports macOS and Linux and preserves historical benchmark applications, results, and reviews. Remote orchestration, hardware provisioning, and native Windows support are outside initial scope. Transferring a ZIP does not provision or control the destination machine. **R015, R141**

## Package contracts

These contents describe required information, not a serialized schema or directory layout.

| Package | Required contents |
|---|---|
| Template ZIP | A versioned manifest and the complete frozen definition: project specification, ordered task prompts, starting files/fixtures, acceptance checks, setup/start/stop instructions, execution rules/protocol, and grading rubric. Required runtime dependencies are declared; installed dependency directories and credentials are excluded. **R115** |
| Existing-repository baseline | The actual starting snapshot captured from the selected committed revision, carried within the template. An originating-machine path or a later lookup of a moving branch cannot substitute for the packaged baseline. [M16](16-custom-template-planning.md) owns capture. **R068, R115** |
| Result ZIP | The exact template plus the selected run's result records, configuration, machine label and hardware/OS details, harness versions, timestamps, task outcomes, measurements with coverage, original weights, judge metadata and grades, generated artifact snapshots, and supporting evidence. A file-integrity manifest covers the result payload. **R116** |

Export only the selected template/run and its required supporting contents. Raw credentials and unrelated machine files must never enter the package. Source result identifiers and provenance survive import and every subsequent export; relaying a result through another machine must not replace its origin with that machine. [M02](02-retained-results-comparability.md) supplies retained records and these provenance semantics. **R116**

## Operations and identity boundary

**Export template.** Select an exact library revision and package its complete definition and manifest. **Export results.** Select a retained run and package its required records, evidence, and the exact template they reference. These operations preserve existing templates, results, reviews, and historical applications. **R015, R036, R115, R116**

**Import template.** Validate the package, recompute identity from its extracted definition, and register only after the digest matches its manifest. **Import results.** Select a local template revision, validate the embedded definition and payload, and add compatible results atomically. Names, filenames, or a declared hash alone never establish compatibility. **R036, R120, R142**

[M01](01-template-library-identity.md) owns the versioned deterministic canonical manifest and SHA-256 computation, including normalized relative paths and content digests. M17 must use that same identity contract for exports and imports. Identical definitions retain their digest across macOS/Linux and ZIP repackaging, regardless of compression, entry order, timestamps, local absolute paths, machine identity, or display-only naming. Changing benchmark-defining content changes identity; selecting different harnesses or machines does not. **R118, R119, R141**

## Validation order and atomic registration

1. **Establish a safe package boundary.** Inspect archive paths and reject escaping paths and links. Enforce bounded extraction before accepting contents, keeping unvalidated material outside registered library state. Corrupt archives, missing required contents, and unsupported formats fail with actionable explanations. **R117, R142**
2. **Validate the definition.** Check completeness against the template contract, then recompute its canonical digest from extracted content. For a template ZIP, require equality with the manifest's declared identity before registration. **R115, R120**
3. **Validate result compatibility.** For a result ZIP, independently recompute the embedded template and selected local template. Require the embedded recomputation, package-declared template hash, and local recomputation to agree. Verify result-payload digests, result-to-template references, and task identifiers against the validated template. **R116, R120**
4. **Resolve existing identities.** An already registered identical template or result is an idempotent success with no duplicate. Preserve distinct runs of the same configuration. Reject different payloads reusing an existing result identifier; never overwrite the original. **R122, R142**
5. **Register the accepted collection.** Only after every check succeeds may the template or selected run's results become available. Any validation failure leaves library registration and existing results unchanged, with no partial additions. **R117, R142**

Throughout import, contents are data. Do not execute packaged scripts, install dependencies, invoke a model, or modify an existing result. Executing an imported benchmark or rejudging an artifact requires a separate explicit action. [M05](05-harness-execution-isolation.md) owns execution and [M12](12-quality-judging.md) owns judging; neither is implicitly triggered by exchange. **R117**

## Failure and comparison invariants

For a template mismatch, reject adding results to the selected benchmark and show the expected and received template identities. Offer the user the separate action of importing the embedded template as another library revision and associating results with that matching revision, subject to the same validation. Never force-merge different templates or overwrite a local template to manufacture compatibility. **R121**

Diagnostics identify the failed requirement and a useful next action: obtain a complete or uncorrupted export, use a supported package format, or select/import the matching revision. Rejection is atomic even when an earlier part of the package was valid. Data with different template hashes cannot enter one comparison or ranking; [M02](02-retained-results-comparability.md) enforces that retained-data boundary. **R117, R122, R142**

[M15](15-terminal-interface.md) and [M14](14-command-line-interface.md) expose exchange operations and their validation outcomes. The source leaves exact format versions, manifest serialization, extraction limits, storage layout, and atomic-registration mechanism to implementation design; this module invents none. **R036, R115, R117**

## Acceptance scenarios

- Export on macOS, repackage with different ZIP ordering/compression/timestamps, then import on Linux: identity is unchanged. A changed prompt, task order, check, baseline, protocol, or rubric changes it; different harnesses or machines do not. **R141**
- Export an existing-repository template and a selected run: the packages contain every required definition and result group, including the actual baseline, dependency declarations, and integrity manifest. The template excludes installed dependency directories; exports exclude credentials and unrelated files. **R115, R116**
- Import another machine's result ZIP: every required content group, source identifier, provenance, and payload digest is preserved. The result joins only the independently verified matching revision. **R116, R120, R142**
- Import scripts and dependency declarations: nothing executes or installs and no model is invoked. Corrupt, incomplete, unsupported, escaping-path, link, or extraction-bound violations leave no partial registration. **R117, R142**
- Present mismatched identities: show expected/received values, preserve the selected template, and allow a separately validated embedded revision with its matching results. **R121**
- Reimport identical packages twice: no duplicates. Import a distinct run: retain it. Reuse its result identifier with conflicting content: reject without mutation. Different template hashes remain separate in comparisons. **R122, R142**
