# AxBenchmark

AxBenchmark is being developed as a headless benchmark engine with terminal and command-line clients. The current work is the implementation specification; application code will live in `solution/`.

| Directory | Contents |
|---|---|
| [spec/](spec/README.md) | Current implementation plan, architecture and traceability. |
| `solution/` | Empty coding root reserved for the application and its tests. Run `mkdir -p solution` after cloning because Git does not track empty directories. |
| [legacy/](legacy/README.md) | Original benchmark: 15 application runs, comparisons, review evidence, fixed prompts, charts and tools. |

Start with [Bootstrap](spec/implementation/BOOTSTRAP.md), then follow the [development sequence](spec/implementation/DEVELOPMENT-SEQUENCE.md). The [reference contracts and prototypes](spec/implementation/reference/README.md) remain linked from the implementation tasks.

The GitHub Pages workflow stays manual. Its staging script publishes the canonical archive/spec paths and compatibility copies of the original demo paths. No deployment is triggered by this reorganization.

[License](LICENSE)
