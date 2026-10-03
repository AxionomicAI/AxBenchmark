# Implementation reference contracts

These files support the current implementation plan; the parent contracts and product requirements remain authoritative.

- [SPEC.md](SPEC.md): product requirements.
- [modules/](modules/): the 18 parent ownership and interface contracts consumed by the child specs.
- [decisions/](decisions/): preserved answers and their applied-clause metadata.
- [design/wireframe-tui/navigation.md](design/wireframe-tui/navigation.md): interaction contracts, [ownership ledger](design/wireframe-tui/ownership-ledger.md), and [preview](design/wireframe-tui/index.html).
- [recommendations.md](recommendations.md): the historical review; current dispositions are in [FINDINGS-RESOLUTION.md](../FINDINGS-RESOLUTION.md).

Start implementation from [the spec guide](../../README.md) and [Bootstrap](../BOOTSTRAP.md). Proposed application paths resolve from the repository’s `solution/` directory. Original benchmark inputs and results are preserved under [legacy/](../../../legacy/README.md).

- [Retained context monitoring](../CONTEXT-MONITORING.md): active cross-module capture, TypeSafe classification, retention and presentation contract, extending existing children.

- [Decision engines](../DECISION-ENGINES.md): shared System One runtime, selectable profiles and grading backends.
- [Benchmark statistics](../BENCHMARK-STATISTICS.md): retained throughput/token/artifact metrics and configurable ranking factors.

- [Benchmark modes](../BENCHMARK-MODES.md): one-shot prompts, ordered step specifications and current-folder captures.
- [Benchmark design handoff](../BENCHMARK-DESIGN-SPEC.md): screen additions/updates for modes, targets, required commits, Cursor CLI and OpenCode.

- Domain quality judges: [backend](../quality-judges/BACKEND.md), [mobile](../quality-judges/MOBILE.md), [DevOps](../quality-judges/DEVOPS.md), [agentic software](../quality-judges/AGENTIC.md), and [specification design/decomposition](../quality-judges/SPECIFICATION.md).

- [Human quality review](../M12/05-human-review-web.md): selectable human backend, post-execution browser form, saved drafts and explicit submission.

- [Model variants and provenance](../MODEL-VARIANTS.md): base/fine-tune/quant lineage, creator/date attribution and controlled same-benchmark comparison.

- [Normalized results database](../RESULTS-DATABASE.md): SQLite structure, exact scores, reproducible analysis snapshots, safe read-only queries and migrations.

- [Cross-harness comparison and API access](../CROSS-HARNESS-COMPARISON.md): one model/effort across the six-harness matrix, OpenRouter/LiteLLM routes, versioned capability evidence and queryable provenance.

- [Existing agent aliases](../CROSS-HARNESS-COMPARISON.md#existing-agent-aliases-and-launcher-profiles): static profile registration, an illustrative named-profile example, isolated execution and declared/effective-setting provenance.

- [Supplement integration](../SUPPLEMENT-INTEGRATION.md): feature-to-owner inventory, preserved boundaries and reproducible specification checks.
