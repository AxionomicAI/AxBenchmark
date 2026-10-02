# M09 — Default seven-task inventory benchmark

Status: proposed feature contract derived from [SPEC.md](../SPEC.md). This module enables engineers to package and validate the default benchmark. It does not claim that the benchmark runner or its acceptance checks are implemented.

## Purpose and scope

Ship the existing inventory website specification and all seven task prompts as the default built-in benchmark in the library, alongside user-created and imported templates. Selecting it must provide an approved, reusable benchmark that runs without generating tasks or invoking an LLM planner. Creating, duplicating, revising, importing, and independently configuring other templates remain available through the linked modules. **[R008, R020, R136]**

The inventory website is the artifact competitors must build; its shopping and stock behaviors are not features of the AxBenchmark terminal application. The preserved [project prompt](../../benchmark/tasks/00-project.md) and task prompts below remain the authoritative legacy inputs. Package their existing text unchanged; do not replace them with these explanatory contracts or rewrite historical artifacts. **[R020, R028]**

## Frozen template contract

| Element | Required contract |
|---|---|
| Starting project | An empty project for each competitor, never a historical generated inventory application. Git initialization belongs to T1. **[R020, R021]** |
| Artifact technology | HTML5 and vanilla JavaScript, with no frameworks or runtime libraries. The website works by directly opening its HTML entry file in a browser; the preserved project prompt names that file `index.html`. **[R020]** |
| Persistence | Browser localStorage persists the application's data, including inventory, cart, and order history. **[R020, R022, R025, R026]** |
| Work definition | The shared project specification plus exactly T1–T7, in the order below, with each task requiring a commit. Each task begins a new session; files are the state carried between sessions, as required by the preserved project prompt. **[R020–R027]** |
| Validation and grading | Versioned acceptance checks and the web grading rubric are bundled with the template, making the suite runnable without LLM planning. **[R028]** |
| Revision identity | Changing tasks, checks, baseline files, or rubric creates a new immutable template revision. The identity mechanism is defined in M01. **[R028]** |

The bundled web rubric follows the product specification's frontend/fullstack profile: UX 25%, visual quality 15%, code quality 20%, business rules/specification 25%, robustness 10%, and accessibility 5%. M12 defines judging behavior and M06 defines adjustable weights; changing run weights is distinct from editing the rubric definition. **[R028]**

## Ordered task and operation contracts

| Task and preserved prompt | Required delivered behavior and observable contract |
|---|---|
| T1 — [Repository and scaffold](../../benchmark/tasks/T1-scaffold.md) | Initialize a Git repository, create a basic inventory website structure and README, and commit the work. The starting empty project becomes the scaffold used by subsequent tasks. **[R021]** |
| T2 — [Inventory data and persistence](../../benchmark/tasks/T2-data.md) | Establish products with their stock, persist inventory in localStorage, provide sample data on first run, and commit. Inventory data must survive reopening the application; first-run samples establish the initial user-visible inventory. **[R022]** |
| T3 — [Inventory management](../../benchmark/tasks/T3-management.md) | Let the user view inventory and create, edit, and delete products; commit. These operations affect the inventory data established in T2 and remain subject to its persistence requirement. **[R023]** |
| T4 — [Inventory lookup](../../benchmark/tasks/T4-lookup.md) | Let the user quickly find products in inventory; commit. The operation exposes matching inventory products through the website. The prompt does not prescribe search fields, matching algorithms, or a quantitative speed threshold. **[R024]** |
| T5 — [Shopping cart](../../benchmark/tasks/T5-cart.md) | Let the user add products from inventory, change quantities, remove cart items, and see the total; persist the cart and commit. Quantity changes and removals must be reflected in the displayed total, and reopening must retain the cart. **[R025]** |
| T6 — [Checkout](../../benchmark/tasks/T6-checkout.md) | Completing a purchase updates inventory stock and preserves order history. Update the README and commit. Checkout connects cart contents, stock, and purchase records under the shared localStorage requirement. **[R026]** |
| T7 — [Test and fix](../../benchmark/tasks/T7-qa.md) | Thoroughly exercise the website as a user would in a real browser, fix every discovered bug, and commit. The preserved prompt allows installing and using needed testing tools; that permission does not relax the delivered website's runtime restrictions. **[R027, R020]** |

These are conceptual operations and observable outcomes, not prescribed storage schemas or internal APIs. The sources leave product attributes, lookup matching, currency, stock-conflict policies, deletion effects on carts, checkout validation details, and order-record structure unspecified. Bundled checks must assess approved requirements without silently introducing those choices as additional obligations. **[R020–R028]**

## Invariants and boundary failures

The default always contains seven tasks, including final browser testing and fixes. A six-task suite is a different template, even if its name resembles the default. Missing tasks, changed prompts, missing bundled checks/rubric, or a nonempty historical application baseline do not satisfy this module's default-template contract. **[R020, R028, R136]**

Editing a benchmark-defining component must leave the original revision available under its original identity. Historical runs must never receive a verified matching hash solely because their names or reported task counts resemble this benchmark. Historical provenance requires the integrity and evidence contracts in M02 and M17. **[R028]**

## Dependencies and integration

- [M01 — Template library and identity](01-template-library-identity.md) registers the default and manages immutable revisions. **[R008, R028, R136]**
- [M16 — Custom planning](16-custom-template-planning.md) and [M07 — Run configuration](07-run-configuration.md) support other templates and per-template configurations; selecting this default skips planning. **[R136]**
- [M05 — Execution](05-harness-execution-isolation.md) supplies independent empty baselines and the ordered prompts. [M08 — Verification](08-verification-evidence.md) consumes the frozen acceptance checks. **[R020–R028]**
- [M12 — Judging](12-quality-judging.md), [M06 — Scoring](06-scoring-rankings.md), [M02 — Retention](02-retained-results-comparability.md), and [M17 — Exchange](17-zip-exchange.md) consume the rubric and exact template identity. **[R028]**

## Acceptance criteria

1. The library's default is the inventory benchmark with seven ordered tasks; launching it makes no planner call and generates no replacement tasks. Other template types and separate saved configurations remain usable. **[R008, R136]**
2. The packaged project/task text matches the preserved inputs, and its versioned checks and web rubric are present. Each competitor begins with an empty project. **[R020, R028]**
3. Artifact checks cover every task contract above, including all seven requested commits, README creation/update, persistent inventory/cart/history, lookup, checkout stock updates, and real-browser QA/fixes. The artifact uses the specified technologies and opens directly in a browser. **[R020, R021, R022, R023, R024, R025, R026, R027]**
4. Editing tasks, checks, baseline files, or rubric produces a different revision while preserving the original. A six-task variant is never identified as the default seven-task template. **[R028]**
5. A historical run with only a matching name or reported task count receives no verified matching template hash. **[R028]**
