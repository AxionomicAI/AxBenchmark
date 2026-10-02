# M09 — Default seven-task inventory benchmark

Status: proposed feature contract derived from [SPEC.md](../SPEC.md). This module enables engineers to package and validate the default benchmark. It does not claim that the benchmark runner or its acceptance checks are implemented. The default ships inside the headless engine and is registered through M01's `templates.*` API; the TUI and CLI reach it only through that API, as fixed by [the architecture decision](ARCHITECTURE.md) and applied in the Implementation section.

## Implementation work packages

Implement these bounded children in order. Their entry conditions distinguish completed providers from [Bootstrap-published contracts](ARCHITECTURE.md#executable-foundations-and-child-spec-boundaries); all real integration gates remain required for parent acceptance.

| Child | Owned result | Completed prerequisites |
|---|---|---|
| [M09.1 — inventory-package](implementation/M09/01-inventory-package.md) | Preserved inputs, canonical package, pins, registration and contract projections | M01.1–3; Bootstrap M08/M12 schemas |
| [M09.2 — inventory-repository-checks](implementation/M09/02-inventory-repository-checks.md) | Repository, per-task commits, README, runtime and direct-file checks | M09.1; M08.1–2 |
| [M09.3 — inventory-behavior-checks](implementation/M09/03-inventory-behavior-checks.md) | Fair data/CRUD/lookup/cart/checkout and historical QA observations | M09.2; M08.2 |
| [M09.4 — inventory-screens](implementation/M09/04-inventory-screens.md) | About/prompts/coverage/look-alike and upgrade entry states | M09.3; M15.1–2 |

These specifications resolve **F01/F11** and consume M01's **F10** baseline semantics. They do not mark proposed code, checks, browser fixtures or screens as implemented.

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
| T2 — [Inventory data and persistence](../../benchmark/tasks/T2-data.md) | Establish products with their stock, persist inventory in localStorage, provide sample data on first run, and commit. Observe the data layer and reopening behavior; inventory viewing and management are introduced by T3 and are not T2 prerequisites. **[R022]** |
| T3 — [Inventory management](../../benchmark/tasks/T3-management.md) | Let the user view inventory and create, edit, and delete products; commit. These operations affect the inventory data established in T2 and remain subject to its persistence requirement. **[R023]** |
| T4 — [Inventory lookup](../../benchmark/tasks/T4-lookup.md) | Let the user quickly find products in inventory; commit. The operation exposes matching inventory products through the website. The prompt does not prescribe search fields, matching algorithms, or a quantitative speed threshold. **[R024]** |
| T5 — [Shopping cart](../../benchmark/tasks/T5-cart.md) | Let the user add products from inventory, change quantities, remove cart items, and see the total; persist the cart and commit. Quantity changes and removals must be reflected in the displayed total, and reopening must retain the cart. **[R025]** |
| T6 — [Checkout](../../benchmark/tasks/T6-checkout.md) | Completing a purchase updates inventory stock and preserves order history. Update the README and commit. Checkout connects cart contents, stock, and purchase records under the shared localStorage requirement. **[R026]** |
| T7 — [Test and fix](../../benchmark/tasks/T7-qa.md) | Thoroughly exercise the website as a user would in a real browser, fix every discovered bug, and commit. The preserved prompt allows installing and using needed testing tools; that permission does not relax the delivered website's runtime restrictions. **[R027, R020]** |

These are conceptual operations and observable outcomes, not prescribed storage schemas or internal APIs. The sources leave product attributes, lookup matching, currency, stock-conflict policies, deletion effects on carts, checkout validation details, and order-record structure unspecified. Bundled checks must assess approved requirements without silently introducing those choices as additional obligations. **[R020–R028]**

## Invariants and boundary failures

The default always contains seven tasks, including final browser testing and fixes. A six-task suite is a different template, even if its name resembles the default. Missing tasks, changed prompts, missing bundled checks/rubric, or a nonempty historical application baseline do not satisfy this module's default-template contract. **[R020, R028, R136]**

Editing a benchmark-defining component must leave the original revision available under its original identity. Historical README runs stay in the repository untouched and are not shown in the app; a result is associated with this benchmark only through its verified template SHA-256, never because its name or reported task count resembles it. Provenance of results from other machines requires the integrity and evidence contracts in M02 and M17. **[R028]**

A later release may ship a new built-in revision of this benchmark (for example r2); it is a different identity, and earlier built-in revisions stay available. Which revision is the library's default after an upgrade follows M01: an installation with no results on its current default moves to the newest built-in revision; an installation with results keeps its current default and the library offers the newer one through a notice with "what changed", the statement that results from the two revisions can't be compared, and "make default". **[R028, R136, R151]**

## Dependencies and integration

- [M01 — Template library and identity](01-template-library-identity.md) registers the default and manages immutable revisions. **[R008, R028, R136]**
- [M16 — Custom planning](16-custom-template-planning.md) and [M07 — Run configuration](07-run-configuration.md) support other templates and per-template configurations; selecting this default skips planning. **[R136]**
- [M05 — Execution](05-harness-execution-isolation.md) supplies independent empty baselines and the ordered prompts. [M08 — Verification](08-verification-evidence.md) consumes the frozen acceptance checks. **[R020–R028]**
- [M12 — Judging](12-quality-judging.md), [M06 — Scoring](06-scoring-rankings.md), [M02 — Retention](02-retained-results-comparability.md), and [M17 — Exchange](17-zip-exchange.md) consume the rubric and exact template identity. **[R028]**

## Acceptance criteria

1. The library's default is the inventory benchmark with seven ordered tasks; launching it makes no planner call and generates no replacement tasks. Other template types and separate saved configurations remain usable. **[R008, R136]**
2. The packaged project/task text matches the preserved inputs, and its versioned checks and web rubric are present. Each competitor begins with an empty project. **[R020, R028]**
3. The 30-check catalog below covers all seven requested commits, README creation/update, persistent inventory/cart/history, lookup, checkout stock updates, approved technology/direct-file operation, and observable T7 browser QA/fixes. Historical actions require historical evidence; a working final app does not prove its author performed QA. Unsupported observation is unverified, never fabricated success or application failure. **[R020–R028, R073–R076]**
4. Editing tasks, checks, baseline files, or rubric produces a different revision while preserving the original. A six-task variant is never identified as the default seven-task template. **[R028]**
5. Historical README runs are not shown in the app, and no result is associated with this benchmark by a matching name or reported task count. **[R028]**
6. With built-in r1 and r2 packaged, a new installation defaults to r2; an installation with results on r1 keeps r1, shows the notice and moves to r2 only through "make default"; r1 stays available and its SHA-256 is unchanged. **[R028, R136, R151]**

## Implementation

This section applies [the architecture decision](ARCHITECTURE.md). Everything below is an implementation choice; the product behavior above stays authoritative. M09 owns no API namespace: the default is a packaged template that M01 registers and serves through `templates.*`. M09 owns the package content, the rules that decide whether that content still is the default seven-task benchmark, and four screens.

### 1. Engine component

Package `axbenchmark.engine.library.builtin`, a subpackage of M01's `engine.library`. It follows the four layers of every engine module and adds a read-only data directory. It never writes to `~/.axbenchmark/`.

**Package data** (`engine/library/builtin/data/inventory_web_r1/`, shipped as package data and read through `importlib.resources`):

| Path | Content | In the identity manifest |
|---|---|---|
| `template.yaml` | Authoring input only: definition fields, task titles, name `Inventory web app`, description and revision label `r1`. Split into M01 `DefinitionInput` and separate `DisplayMetadata` before conversion. | **no**; never hash a selected subset of YAML fields or include the authoring file in an exported defining payload. **[F01]** |
| `metadata.json` | Complete `axbenchmark-definition/1` emitted by M01 `DefinitionCodec.write`; the sole serialized definition. | yes, entire canonical file |
| `spec/00-project.md` | The preserved project prompt. | yes |
| `tasks/T1-scaffold.md` … `tasks/T7-qa.md` | The seven preserved task prompts. | yes |
| `protocol.yaml` | Execution protocol: one new session per task, the project text placed before every task prompt, one commit per task, files as the only carried state. Consumed by M05. **[R020–R027]** | yes |
| `services.yaml`, `dependencies.yaml` | Explicit empty service instructions and application dependency declaration in M05/M08's published formats. Direct-file browsing needs no app server. Verification tooling is declared by check prerequisites, never a competitor runtime dependency. | yes, roles `services` and `dependencies` |
| `baseline/` | No files and no directory entry in the manifest. `metadata.json` contains `baseline: {kind: "empty", files: []}`; Git initialization belongs to T1. **[R020, R021, F10]** | explicit hashed descriptor declaration |
| `checks/acceptance.v1.json` and declared support files | The exact 30 definitions below in M08's `acceptance.v1` schema; executable entries and every imported helper are included in `support_paths`. | yes, role `acceptance_checks` |
| `rubric/web.v1.yaml` | M12 rubric with `profile_id: web`, applicable to `project_type: frontend`: UX 25, visual quality 15, code quality 20, business rules/specification 25, robustness 10, accessibility 5. **[R028]** | yes |
| `about.yaml` | Display-only explanatory text and left-open choices. Requirements, counts, phases and observable coverage come from the frozen suite, not claims in this file. | no |

The prompt files are not maintained by hand. The build maps the repository's `benchmark/tasks/*.md` byte for byte into `spec/` and `tasks/` (hatchling `force-include` in `pyproject.toml`), so the packaged text cannot drift from the preserved inputs. **[R020, R028]**

The packaging step calls `DefinitionCodec.write(input, payload_files)` before `TemplateIdentity.compute`. Supply all required fields: `format`, `project_type: frontend`, `specification: spec/00-project.md`, seven ordered `tasks` with exact prompt paths and catalog `check_ids`, `acceptance_checks: {suite_path: checks/acceptance.v1.json, support_paths: [...]}`, `execution_protocol: protocol.yaml`, `services: services.yaml`, `rubric: {path: rubric/web.v1.yaml, profile_id: web}`, `dependencies: dependencies.yaml`, and `baseline: {kind: empty, files: []}`. `index.html` is a typed future workspace output in the protocol, not a missing package file. The writer validates reference closure and returns only canonical payload files; M01 hashes their complete bytes. **[F01/F10]**

The build freezes the generated descriptor with its payload. Runtime registration uses `DefinitionCodec.read` and verifies the released pin; it does not regenerate or silently repair a released descriptor. M16 given the same defining bytes must produce the same descriptor/manifest; M17 exports/imports those exact canonical bytes and rejects noncanonical metadata. Display edits never alter them. The full support set is `checks/repository.py`, `runtime.py`, `data.py`, `behavior.py`, `qa.py`, `observers.py`, `observation_rules.v1.json` (all under `checks/`); test apps are external verification fixtures, not shipped dependencies. Changes to rules, strategies or suite bytes require a new revision/pin.

The directory of a released revision is never edited. A change to tasks, checks, baseline or rubric ships as a new directory with a new revision (`inventory_web_r2/`, …) and its own pin; `inventory_web_r1/` stays in every later release so r1 keeps its identity. M09 reports every valid revision as a default candidate in revision order; M01's `choose_default` decides which one is the default on a given installation. **[R028, R136]**

**Domain** (`engine/library/builtin/domain/`, frozen dataclasses and pure functions):

| Type or rule | Content |
|---|---|
| `BuiltinKey` | Stable package key, e.g. `inventory_web_r1`. Not an identity; identity is the SHA-256. |
| `DefaultPin` | `key`, `revision_order: int` (1 for r1), `expected_sha256`, `task_ids = ("T1", …, "T7")`, `preserved_digests: Mapping[str, str]` (eight original prompt digests), `catalog_signature` (ordered tuples of check/task/requirement/phase-target ids), `rubric_weights` (six percentages above). One pin per released revision in `domain/pins.py`; outside defining payload so it is not part of what it pins. |
| `PackageContents` | M01 `CanonicalPayload`/parsed `TemplateDefinition`, separate `DisplayMetadata`/about text, protocol, prompt bytes, exact M08 `CheckDefinition` catalog and M12 rubric summary. No parallel definition parsed from YAML at runtime. |
| `ContractViolation` | Enum with message/path: `DEFINITION_INVALID`, `TASK_COUNT`, `TASK_ORDER`, `PROMPT_CHANGED`, `PROMPT_MISSING`, `BASELINE_NOT_EMPTY`, `CHECKS_MISSING`, `CHECK_CATALOG_MISMATCH`, `TASK_UNCOVERED`, `RUBRIC_MISSING`, `RUBRIC_WEIGHTS`, `COMMIT_RULE_MISSING`, `IDENTITY_MISMATCH`. |
| `check_default_contract(contents, pin)` | Report every inspectable violation: seven ordered tasks, preserved prompt digests, explicit empty baseline, exact pinned catalog/phase/reference mapping below, web rubric weights and seven commit obligations. Schema-invalid packages retain diagnostics and cannot register as runnable candidates. **[R020–R028, R136]** |
| `is_default_candidate(sha256, violations, pin)` | True only when `sha256 == pin.expected_sha256` and there are no violations. Name, display label and task count never enter this decision. Which candidate is the default is M01's `DefaultPointer`. **[R028, R136]** |
| `default_relation(summary, default_sha, candidates, lineage)` | `DEFAULT`, `LOOKALIKE` or `NONE` for a library entry. `DEFAULT` for the entry M01 reports as the default. A built-in default candidate that is not the default (for example r1 after the default moved to r2) is `NONE`, never `LOOKALIKE`. `LOOKALIKE` when another entry was duplicated or revised from a built-in revision, or shares its display name. Used only to explain why an entry is not the default; it never confers or withholds identity. **[R136]** |
| `FrozenContract` | Rows for `#contract` (element, contract text), `left_open: tuple[str, ...]`, `check_count`, `suite_path`, `rubric_label`, `planning_required = False`. Built from `about.yaml` and the parsed package. |
| `CheckCoverage` | Per task: id/title and checks with id/title/kind, requirement, phases, expected observation and evidence kinds; counts `{unique: 30, at_task: 30, final_regression: 30, final_artifact: 19, final_history: 11}`. Built from the suite; `left_open` is display text, legacy `also_checked` is empty. **[R021–R028, F11]** |

The identity hash itself is M01's: `is_default_candidate` receives the SHA-256 that M01's `TemplateIdentity.compute` returned for the canonical payload, separately from semantic contract violations. `builtin.domain` may import `library.domain` because it is part of the same engine package.

**Ports** (`engine/library/builtin/ports.py`):

```python
class PackageResources(Protocol):
    def keys(self) -> Sequence[BuiltinKey]: ...
    def read(self, key: BuiltinKey, path: str) -> bytes: ...
    def list_files(self, key: BuiltinKey) -> Sequence[str]: ...   # relative, normalized

class IdentityCalculator(Protocol):        # satisfied by M01's application interface
    def identity_of(self, payload: CanonicalPayload) -> str: ...
```

**Application** (`engine/library/builtin/application/`). These use cases are not RPC endpoints; M01 calls them in-engine through the Protocols it declares (`BuiltinCatalog`, `ContractDescriber`), and M01's `adapters/rpc.py` maps their results to `templates.*` DTOs.

| Use case | Called by | Behavior |
|---|---|---|
| `LoadBuiltins` | M01 `RegisterBuiltins` at daemon start | Read packaged canonical files, use M01 codec/readers, compute identity through `IdentityCalculator`, check pin/catalog, return `BuiltinRegistration(key, sha256, revision_order, contents, violations, default_candidate)`. Invalid packages return a diagnostic registration with unavailable identity/contents where parsing failed, never an invented hash or runnable revision. M01 reports `templates.builtin_invalid` and chooses only valid candidates. |
| `DescribeContract(sha256)` | M01 for `templates.contract` | `FrozenContract` for a built-in revision; `None` for any other revision. |
| `DescribeCoverage(sha256)` | M01 for `templates.coverage` | `CheckCoverage` from the package's suite and `about.yaml`. |
| `RelationToDefault(entries)` | M01 for `templates.list` and `templates.lookalike` | Applies `default_relation` to library entries using M01's lineage records. |

**Adapters** (`engine/library/builtin/adapters/`):

| Adapter | Implements | Notes |
|---|---|---|
| `importlib_resources.py` | `PackageResources` | `importlib.resources.files("axbenchmark.engine.library.builtin.data")`; rejects absolute paths and `..`; returns bytes, never decoded text, so line endings and encoding stay exactly as packaged. |
| `authoring.py` | — | Build-only YAML input → `DefinitionInput` plus role-tagged bytes → M01 `DefinitionCodec.write`; display material remains separate. Schema validation follows safe YAML parsing. |
| `package_reader.py` | — | Runtime M01 `DefinitionCodec.read` plus M05/M08 protocol/service/dependency readers, M08 suite reader and M12 rubric reader; load about/display bytes separately. No independent descriptor serializer. |

M09 has no `rpc.py`: no DTO is defined here. Wiring in `engine/daemon/composition.py`: `LoadBuiltins(resources=ImportlibResources(), identity=library_identity)` is passed to M01's `RegisterBuiltins`; `DescribeContract`, `DescribeCoverage` and `RelationToDefault` are passed to M01's query use cases.

**Persisted state:** none. The package directory is read-only; the default pointer and whether M01 also records the built-in revision in its library index are M01's storage decisions. **Owned processes:** none. Executing the default (M05, M11), running its checks (M08) and judging it (M12) consume the registered revision like any other template.

#### Versioned inventory observation catalog

This is the normative catalog for `inventory_web_r1/checks/acceptance.v1.json`, using M08's [frozen observation contract](08-verification-evidence.md#frozen-observation-contract-acceptancev1). Identifiers use M01's underscore-safe `Id` grammar; legacy dotted wireframe ids are replaced. All 30 are `required: true`. Each row supplies `check_id`, `title`, `requirement.id`, expected observation and the explicit `failure_rule.mismatch_description`. `failure_rule.expectation_id` equals `check_id`. Requirement source is the defining task's exact `prompt_path`; R020 rows reference `spec/00-project.md`. Requirements sharing an ID retain distinct check ids/statements.

Phase code **B** expands to `at_task/task_snapshot` and `final_regression/delivered_artifact`; **H** expands to `at_task/task_history` and `final_regression/task_history`. For each expansion, `prerequisite_task_ids` is the ordered T1…defining-task prefix, never a later task. H resolves that task's captured start/end snapshots, repository history and scoped invocation evidence; final H re-observes the same historical facts, never substitutes T7's HEAD or an engine-generated QA run. B final targets the delivered snapshot, preserving the defining task id in the outcome. Final validation of an interrupted trial leaves absent required targets unverified/not-run, not passed.

Entry/strategy codes: **R** = `checks/repository.py`, **V** = `checks/runtime.py`, **D** = `checks/data.py`, **U** = `checks/behavior.py`, **Q** = `checks/qa.py`. `strategy_ref` is `<entry>:<check_id>` except commits use `checks/repository.py:commit_advancement`. Frozen `observation.inputs` is `{task_id, operation: check_id, seed: "ax-inventory-v1", rules_ref: "checks/observation_rules.v1.json"}`; `expected` is `{predicate: check_id, satisfied: true}`, whose predicate is exactly the row's stated condition, not a free-form instruction. Resolved snapshots arrive separately through M08 `CheckTarget`, never as run-specific values in the frozen suite. Set `on_unobservable: "unverified/verifier_error"`. No private selector/key/schema or fixture identity is supplied. Every entry declares `support_refs: [checks/observers.py, checks/observation_rules.v1.json]`; Q additionally declares `checks/behavior.py` for replay. Validate these closed input/expected shapes before execution.

Evidence codes expand to M08 kinds: **r** = repository; **d** = data; **b** = browser, console, screenshot (and keyboard where a keyboard action is exercised); **l** = log. R/Q checks have kind `repo`; V/D/U have kind `browser`. R needs Git and readable snapshots; Q needs retained invocation evidence and Python Playwright for declared reproductions; V/D/U need Python Playwright/browser. Check deadlines are 60 s for R, 120 s for V/D/U and 180 s for Q; deadline exhaustion is verifier error, never an application speed requirement. Missing installed prerequisites use M03 reasons. Capture both 1440×1000 and 390×844 at declared browser observation steps; console/keyboard evidence is diagnostic unless a row's requirement is actually contradicted.

| Check id / title | Requirement | Phase / strategy / evidence | Expected observable; observed contradiction that fails |
|---|---|---|---|
| `T1_repository` — Repository initialized | R021 | H / R / r | T1 starts empty and ends with a readable Git repository; readable end tree has no repository. |
| `T1_readme` — Project README exists | R021 | B / R / r | A discoverable README describes this project; no README or only empty content. No root-only path requirement. |
| `T1_scaffold` — HTML5 scaffold exists | R020 | B / V / r,b | `index.html` is an HTML5 document with a basic document body; missing entry or an observed non-HTML scaffold. No folder layout or visual design prescribed. |
| `T1_runtime` — Vanilla runtime | R020 | B / V / r,b,l | Resolved runtime dependency closure contains only application HTML/CSS/vanilla JS and browser APIs; identified framework/library runtime is loaded or required. Testing/dev tools outside the delivered runtime are allowed. |
| `T1_direct_file` — Direct-file entry works | R020 | B / V / b,l | Opening the actual `file:` entry loads the scaffold/app without an app server; demonstrated reliance on a server prevents the required entry from working. |
| `T1_commit` — T1 committed | R021 | H / R / r,l | New task commit satisfies advancement below; readable before/after history proves none. |
| `T2_products` — Products carry stock | R022 | B / D / d,r | Initialized data contains identifiable products and their stock; proven initialized model lacks products or stock. No mandatory product field names. |
| `T2_samples` — First-run sample data | R022 | B / D / d,b | Fresh storage initializes nonempty sample products; completed initialization leaves no sample products. No T3 view required. |
| `T2_persistence` — Inventory survives reopening | R022 | B / D / d,b | Product/stock state persisted in localStorage is read back on close/reopen with the same origin/profile; observed data loss/reset or an alternative-only persistence mechanism. |
| `T2_commit` — T2 committed | R022 | H / R / r,l | New T2 commit; readable task history proves no advancement. |
| `T3_view` — Inventory can be viewed | R023 | B / U / d,b | A user can inspect inventory products; resolved complete inventory view omits products known to exist. |
| `T3_create` — Product can be added | R023 | B / U / d,b | Valid values for the app's own fields create a distinguishable product retained after reopening; valid completed action loses/does not create it. |
| `T3_edit` — Product can be edited | R023 | B / U / d,b | Change an app-supported product value and reopen; completed edit is absent or lost. No mandated editable field list. |
| `T3_delete` — Product can be deleted | R023 | B / U / d,b | Delete an unused product, accept any offered confirmation, reopen; selected product remains/reappears. |
| `T3_commit` — T3 committed | R023 | H / R / r,l | New T3 commit; readable task history proves no advancement. |
| `T4_lookup` — Current product can be found | R024 | B / U / d,b | Use the app's offered lookup/filter on an existing distinguishing value, then repeat after a supported edit; the matching current product is not findable. No fixed fields, substring policy, latency or ranking. |
| `T4_commit` — T4 committed | R024 | H / R / r,l | New T4 commit; readable task history proves no advancement. |
| `T5_add` — Inventory item enters cart | R025 | B / U / d,b | Add an available inventory product; resolved cart does not contain the selected product. |
| `T5_quantity` — Cart quantity changes | R025 | B / U / d,b | Change between two valid positive quantities within observed stock; resolved cart quantity is unchanged/wrong. |
| `T5_remove` — Cart item can be removed | R025 | B / U / d,b | Remove an added line; line remains or returns on reopening. |
| `T5_total` — Cart total reflects contents | R025 | B / U / d,b | A displayed total agrees with the app's exposed price/amount rules after add/change/remove; observed numeric inconsistency. Currency/rounding/tax policy is not invented. |
| `T5_persistence` — Cart survives reopening | R025 | B / U / d,b | Nonempty cart products/quantities survive close/reopen through localStorage; observed loss/reset or another-only store. |
| `T5_commit` — T5 committed | R025 | H / R / r,l | New T5 commit; readable task history proves no advancement. |
| `T6_stock` — Purchase updates stock | R026 | B / U / d,b | Complete a valid within-stock purchase; stock decreases by purchased quantities and persists; demonstrated unchanged/wrong stock or lost update. |
| `T6_history` — Purchase history persists | R026 | B / U / d,b | Completed purchase is retained in order history through localStorage and reopening; observed missing/lost record. No fixed order schema or extra history UI is required. |
| `T6_readme` — README updated in T6 | R026 | H / R / r,l | T6 start/end README content differs and is included in the task's new commit; readable history shows no README update or no committed update. No prescribed section wording. |
| `T6_commit` — T6 committed | R026 | H / R / r,l | New T6 commit; readable task history proves no advancement. |
| `T7_browser_qa` — Author exercised a real browser | R027 | H / Q / l,b | Corroborated T7 browser actions exercise the available inventory/cart/checkout workflows with observed results; a complete observed action record demonstrates no real-browser exercise or an asserted QA run contains no product interaction. A success claim alone is insufficient. |
| `T7_fixes` — Observed discovered defects resolved | R027 | H / Q / l,r,b | Replay supported requirement-grounded defects actually discovered during T7 against its end snapshot; a discovered defect demonstrably remains. With complete observed QA and no discovered defects, pass as “no observed unresolved defect”; do not require an arbitrary source edit. |
| `T7_commit` — T7 committed | R027 | H / R / r,l | New T7 commit, including a legitimate empty commit when QA needs no edits; readable history proves no advancement. |

**Counts are phase-specific.** Unique checks: **30**, grouped T1–T7 as **6, 4, 5, 2, 6, 4, 3**. At-task total: **30**. Final-regression total: **30 = 19 delivered-artifact + 11 task-history**. A complete trial may retain 60 outcomes; never display 60 as the suite size, add the two phase denominators together, or imply the 11 historical checks ran against T7. Browser capture count is not check count. Summaries and M06 eligibility use M08's separate phase outcomes.

**Per-task commit advancement.** Read each invocation's captured start/end repository states through M05, independently of `SnapshotRef.commit` display metadata. T1 requires a new reachable commit from an initially absent repository; T2–T7 require at least one reachable end commit absent from the start history, with a different end HEAD and the task's delivered changes represented by that commit tree. Compare trees as well as ids; a later commit cannot repair an earlier missing commit. Do not require a fixed message, timestamp, single commit, linear history or nonempty T7 diff. A readable repository with no new commit is `failed/application_failure`, even if the retained display identity says unavailable. Inaccessible history or missing capture is unverified with its actual cause. Valid new history can establish a pass while display metadata remains unavailable. A repository rewritten so that timing/advancement cannot be established is unobservable, not guessed.

#### Deterministic observation and fair limitations

The frozen `observers.py` plus `observation_rules.v1.json` define a bounded discovery state machine, operation vocabulary, supported data decoders and traversal order; no LLM or operator chooses locators during a check. The rule file has version `inventory-observation/1`, `max_states: 64`, `max_actions: 128`, ordered operation aliases, ordered codec ids and semantic-binding rules. Exhausting discovery bounds/deadline is unobservable, not an app complexity/speed failure. Emit `discovery.json` with candidates, rejected alternatives, selected bindings and source/runtime evidence. Rule changes change identity. Checks start with fresh browser profiles; steps within one workflow preserve storage. Reopening uses the same absolute copied entry path and profile so a changed origin cannot masquerade as an app failure.

1. Resolve direct-file entry and its runtime resource closure from HTML/script/module references and observed loads; distinguish generated application code, known runtime dependency provenance and test-only files. A package manifest or filename alone proves no forbidden runtime. An unresolved dynamic/obfuscated dependency is unobservable; an identified loaded/required framework is a requirement failure. Do not enforce an arbitrary layout, script count or forbid authored CSS.
2. Discover controls from browser role/name/label/value and visible text, using frozen synonyms for operations (add/create/new, edit/update, delete/remove, find/search/filter, cart/basket, checkout/purchase). Traverse DOM order and navigation/dialog states in recorded breadth-first order on disposable profiles. Prefer unique semantic candidates; qualify row actions by the selected product's observed identity. If semantics remain ambiguous, use read-only source event-binding inspection and structural relationships; never add selectors, test ids, labels or APIs to the app. Remaining ambiguity is unverified, not “missing feature.” A demonstrably complete resolved workflow with no required action or a wrong resulting state is failure.
3. Observe all localStorage reads/writes externally and inspect source bindings/runtime scopes read-only. Supported codecs derive product/stock/cart/order meaning from the app's actual initializer, consumers and encoders, not a required key or JSON shape. Supported array, keyed-map and nested-record codecs may use JSON or delimiter encodings; undecodable/custom formats remain unverified. Never pick a numeric field merely because it looks like stock or infer a purchase from an unrelated write.
4. T2 runs its actual initialization without any management/view control. Establish sample product/stock mapping from data-layer code and observed storage values; after closing/reopening, verify the same state is consumed. For overwrite detection, mutate a supported product/stock value in test storage using the observed encoder, then verify the app reads it back. This is test data in the disposable profile, not a source patch or invented app API. If mapping/round-trip cannot be established, report unverified. A valid data-only T2 must pass supported observations without T3 UI.
5. From T3, choose valid inputs using the app's own constraints/options, preserve a uniquely identifiable test product, and assert changes through resolved behavior plus correlated data. Quantity and checkout tests stay within available stock; lookup uses an offered criterion; totals use only exposed monetary rules. Hidden stock or history may use the same supported data observer; do not add a required stock column/history screen. Capture workflow checkpoints at both M08 viewports without requiring a new responsive layout policy.
6. T7 uses scoped execution logs and actual browser/tool action evidence, never the verifier's later actions as proof of competitor QA. A complete evidence record must establish covered workflows and discovered defects before a pass. Missing/partial harness visibility, ambiguous discovery reports or unreplayable bugs yield `unverified/verifier_error` with the limitation. A complete observed trace of no testing can establish failure; a claimed skip requires corroborating action evidence. Absence of logs alone cannot.

All catalog contradictions use M08 `CheckContext.expect(check_id, observation)` with expected/observed/evidence. Unobservable evidence, unsupported codecs/locators, crashes and timeouts are `unverified/verifier_error`; missing installed prerequisites are `unverified/missing_prerequisite`; absent target snapshots are `unverified/not_run`. Arbitrary nonzero exits, console errors and screenshots alone prove neither a failed requirement nor a pass. Identity, retention and acknowledgement failures retain M08's fatal/unfinished handling. This limitation must appear in coverage/evidence screens; it is not permission to relabel an unsupported conforming app as failed.

### 2. API surface

M09 defines no methods, jobs or events. Its data reaches clients through `templates.*` (M01). The methods and fields M09's screens and rules need are listed in section 3 so M01 can reconcile them. Reason codes that originate in M09 rules travel in M01's namespace: `templates.builtin_invalid` (with the `ContractViolation` names in `data.violations`) and `templates.no_contract`.

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `BuiltinCatalog`, `ContractDescriber` (application Protocols declared in `engine.library`) and `RegisterBuiltins` at daemon start | M01 | Register `LoadBuiltins` results; choose the default among `default_candidate` revisions with `choose_default` and the `DefaultPointer`; keep a package with violations visible as built-in but never default, with `templates.builtin_invalid`. **[R008, R136]** |
| `templates.list` `default_notice`, `templates.set_default(sha256)`, event `templates.default.changed` | M01 | The r2 notice ("what changed", non-comparability, "make default") on the Library after an upgrade. **[R028, R136]** |
| `DefinitionCodec.write/read`, `TemplateIdentity.compute` behind `IdentityCalculator` | M01 | Build-only authoring conversion, runtime canonical reading, full manifest identity; same built-in/planner/imported bytes. Empty baseline remains explicit. **[R028, R118, F01/F10]** |
| `templates.list` with `TemplateRow.is_default`, `source="builtin"`, `default_relation` (`default`, `lookalike`, `none`), `capabilities.can_about`, `capabilities.can_compare_default` | M01 | Library ★ marker, the `a` binding on built-in inventory rows, `#why-not-default` on look-alike rows. **[R008, R136]** |
| `templates.contract(revision_sha)` → `TemplateContractDTO` (request, response, errors and capability flags in M01 part 2) | M01 | `InventoryAboutScreen`. **[R020–R028]** |
| `templates.prompts(revision_sha)` → `PromptsDTO` (request, response, errors and capability flags in M01 part 2) | M01 | `PromptsScreen`; works for any template revision. **[R020, R028]** |
| `templates.coverage(revision_sha)` → `CoverageDTO` | M01 | Publish the existing DTO plus `phase_counts: {unique, at_task, final_regression, final_artifact, final_history}` and each `CheckRowDTO`'s `requirement`, `phases`, `observation_summary`, `evidence_kinds`; read from M08 definitions. Preserve `also_checked: []` for compatibility. This is a required M01 schema handoff, not a client-only/private field. **[R021–R028, F11]** |
| `templates.file(revision_sha, path)` → `FileDTO` (request, response, errors and capability flags in M01 part 2) | M01 | `o` on `CoverageScreen` shows the suite file without the client reading `~/.axbenchmark/` or the installed package. |
| `templates.lookalike(revision_sha)` → `LookalikeDTO` (request, response, errors and capability flags in M01 part 2) | M01 | `VariantScreen`. **[R028, R136]** |
| `CheckFormat.parse` / `.validate`, `CheckContext.expect`, `ObservationRecord`, `CheckTarget` | M08 | Exact 30-check catalog, phase targets and support closure; assertions and unobservable errors remain distinct. Shared schemas are published in Bootstrap; real readers/runners are later gates. **[R028, R074, F11]** |
| Captured start/end snapshots, readable repository history, scoped invocation/browser action evidence | M05 through M08 | Historical checks observe the original task boundary, with `ResultId`/`TrialRef`; unavailable capture cannot be substituted with current workspace state. **[R076]** |
| `RubricSource.parse`; `web` profile (used by frontend templates) with the six categories | M12 (profiles consumed by M06) | `rubric/web.v1.yaml`. Run weights stay M06/M07 data; editing them never touches the rubric. **[R028, R033]** |
| `protocol.yaml` semantics (new session per task, project text before each prompt, commit per task) and the empty-baseline copy | M05 | Execution of the default like any other revision. **[R020–R027, R068]** |
| `SetupScreen(template_sha256=revision_sha)` | M07 | Target of `enter` / `#configure`; it loads its own data. Launching an approved revision makes no planner call. **[R136]** |
| `TemplateScreen(revision_sha)` | M01 | Target of "Open 6-task template" on `VariantScreen`. |
| `a` binding (`about`) on `LibraryScreen` that pushes `InventoryAboutScreen(sha256)`, shown in the Footer and enabled by `capabilities.can_about` only on a built-in inventory row, dimmed otherwise; `#why-not-default` in the Library detail pane that pushes `VariantScreen(sha256)`, enabled by `capabilities.can_compare_default` on a look-alike row. `?` stays the app-wide Help key (M15). | M01 | Entries to the M09 screens; in M01's binding table and the wireframe's `LIB_KEYS`. |
| Shared read-only file viewer (`FileViewScreen`, `TextArea read_only=True`) | M15 | Shows the result of `templates.file`. |
| `engine.hello`, `events.subscribe` | M11 | Version negotiation; `templates` topic for library changes. |

### 4. Screens

All four screens are pure views over the `templates.*` responses above. Glyphs (★ built-in, ◆ custom) are a presentation mapping of `source` and `is_default`; whether an entry is the default, look-alike, configurable or covered is always read from the DTO. View models live in `axbenchmark/tui/viewmodels/inventory.py`:

```python
@dataclass(frozen=True)
class ContractVM:
    heading: str                      # "★ Inventory web app · r1 · built-in · sha256 …"
    rows: list[tuple[str, str]]       # #contract
    left_open: str                    # #left-open, joined with " · "
    notes: list[str]
    can_configure: bool; configure_reason: str | None

@dataclass(frozen=True)
class PromptsVM:
    bar: str                          # #prompts-bar
    tree: list[TreeNodeVM]            # #prompt-files, groups then files in run order
    texts: dict[str, str]             # path -> verbatim markdown for #prompt-text
    selected: str

@dataclass(frozen=True)
class CoverageVM:
    bar: str                          # #checks-bar
    rows: list[tuple[str, str, str, str, str]]   # task, check, title, kind, requirement
    detail_by_check: dict[str, str]             # phase/target, observation, evidence, limitation
    phase_counts: str; left_open: str
    can_open_suite: bool; suite_path: str

@dataclass(frozen=True)
class LookalikeVM:
    heading: str
    rows: list[tuple[str, str, str]]  # #variant-compare
    can_open_other: bool; other_sha: str

def build_contract_vm(dto: TemplateContractDTO) -> ContractVM: ...
def build_prompts_vm(dto: PromptsDTO, selected: str | None = None) -> PromptsVM: ...
def build_coverage_vm(dto: CoverageDTO) -> CoverageVM: ...
def build_lookalike_vm(dto: LookalikeDTO) -> LookalikeVM: ...
```

The builders copy and format; they shorten hashes for display (`first8…last8`) and never re-derive a contract fact. Each screen takes `revision_sha` in its constructor, loads in a Textual worker, and wraps its data widget in a `ContentSwitcher` with the design-system states `#<id>`, `#<id>-loading`, `#<id>-error` (typed error message verbatim, Retry button). None of these screens subscribes to events: the revision they show is immutable. A typed error on load shows the error state; it never falls back to cached text.

**`InventoryAboutScreen(ModalScreen[None])`** — artboard InventoryAbout; `tui/screens/library.py`; dialog `Vertical #inventory-about .dialog` with `DataTable #contract`, `Static #left-open`, `Horizontal .dialog-actions` (Buttons `#prompts`, `#checks`, `#configure .-primary`).

| Aspect | Specification |
|---|---|
| Load | `templates.contract(revision_sha)` → `build_contract_vm`. Switcher `#contract` / `#contract-loading` / `#contract-error`. |
| Content | `#contract` rows and `#left-open` exactly as returned; the notes (the website is the competitors' artifact; edits create a new revision) from `notes`. |
| `check_action` | `configure` from `capabilities.can_configure`, with `reason` as the dimmed tooltip; `prompts`, `checks` from their flags. |

| Binding | Action | API call |
|---|---|---|
| `esc` | `dismiss(None)` | none |
| `tab` / `shift+tab` | `focus_next` / `focus_previous` | none |
| `p` / Button `#prompts` | `prompts` | none; pushes `PromptsScreen(revision_sha)`, which loads itself |
| `c` / Button `#checks` | `checks` | none; pushes `CoverageScreen(revision_sha)` |
| `enter` / Button `#configure` | `configure` | none; dismisses and pushes M07's `SetupScreen(template_sha256=revision_sha)`, which loads itself. No planning screen is involved. |

**`PromptsScreen(Screen)`** — artboard InventoryPrompts; `tui/screens/template.py`; read-only. `Static #prompts-bar`, `Tree #prompt-files` in a `Vertical .pane` (groups `spec/`, `tasks/`, files in run order), `MarkdownViewer #prompt-text` with `show_table_of_contents=False`.

| Aspect | Specification |
|---|---|
| Load | `templates.prompts(revision_sha)` → `build_prompts_vm`; all files arrive in one response. Switcher `#prompt-text` / `#prompt-text-loading` / `#prompt-text-error`. |
| Content | `#prompt-text` renders `texts[selected]` unchanged; the screen never edits, trims or reflows the source. Selecting a tree node swaps the document without another call. |
| Generic | The screen works for any revision; the M09 artboard is its built-in instance. Editing is offered only through M01's revise flow, never here. **[R028]** |

| Binding | Action | API call |
|---|---|---|
| `esc` | `app.pop_screen` | none |
| `↑` `↓` | scroll | none |
| `tab` | next pane | none |
| `c` | `checks` | none; switches to `CoverageScreen(revision_sha)` |
| `y` | `copy` | none; `app.copy_to_clipboard(texts[selected])` |

**`CoverageScreen(Screen)`** — artboard InventoryChecks; `tui/screens/template.py`. `Static #checks-bar`, scrolling `DataTable #coverage .bordered` (Task, Check, What it observes, Kind, Requirement), `Static #check-detail .pane`, `Static #not-checked .pane`. At 80×24 use Task/Check/Title columns and show the remaining values in selected-row detail; no clipped ids or missing rows.

| Aspect | Specification |
|---|---|
| Load | `templates.coverage(revision_sha)` → `build_coverage_vm`. Switcher `#coverage` / `#coverage-loading` / `#coverage-error`; `templates.no_checks` shows `#coverage-empty` with the message verbatim. |
| Content | All 30 rows, exact per-row requirement (T1 includes R020 and R021), and selectable phase/target/expected/evidence detail. Bar labels “30 checks · 30 at task · 30 final (19 artifact, 11 history)”; compact splits this into two lines. Replace the former “Also checked” claims with selected `#check-detail`. `#not-checked` shows left-open choices and the explicit unobservable ≠ failed rule. Counts come from the DTO. |
| `check_action` | `open` from `capabilities.can_open_suite`. |

| Binding | Action | API call |
|---|---|---|
| `esc` | `app.pop_screen` | none |
| `tab` | focus next | none |
| `p` | `prompts` | none; switches to `PromptsScreen(revision_sha)` |
| `o` | `open` | `templates.file(revision_sha, suite_path)`; pushes M15's `FileViewScreen` with the text, or shows the typed error |

**`VariantScreen(ModalScreen[None])`** — artboard InventoryVariant; `tui/screens/library.py`; pushed by `#why-not-default` on a look-alike row. Dialog `Vertical #variant .dialog` with `DataTable #variant-compare`, `Horizontal .dialog-actions` (Buttons `#open-other`, `#close .-primary`).

| Aspect | Specification |
|---|---|
| Load | `templates.lookalike(revision_sha)` of the selected look-alike → `build_lookalike_vm`. Switcher `#variant-compare` / `#variant-compare-loading` / `#variant-compare-error`. |
| Content | Rows (Source, Tasks, SHA-256, Default, Results) as returned; `emphasis` marks "no · a different template". Results are counted only by verified SHA-256; the screen shows no historical README runs. **[R028, R136]** |
| `check_action` | `open_other` from `capabilities.can_open_other`. |

| Binding | Action | API call |
|---|---|---|
| `esc` / Button `#close` | `dismiss(None)` | none |
| Button `#open-other` | `open_other` | none; dismisses and pushes M01's `TemplateScreen(other_sha)` |

**Consumers elsewhere:** `LibraryScreen` (M01) shows the ★ default, `a` and look-alike capabilities from the DTO and the upgrade notice from `default_notice`. Its `DefaultChanges` dialog shows real suite changes; never describe T2 as waiting for inventory UI. `TemplateScreen` lists the same 30 checks. M08/M10/M13 consumers use the run's frozen ids/titles and separate phase totals, including the artifact/history distinction, never a hard-coded 21 or a count of screenshots.

**Required design-fixture handoff:** update `design/wireframe-tui/src/checks-data.mjs` to the exact catalog/phase map, then inventory/library/verification/result/measurement/report renderers and navigation labels. Synthetic Pi fixtures map at-task failures to `T5_remove`, `T5_persistence`, `T6_history`, and final failures to `T4_lookup`, `T5_remove`, `T6_history`: 27/30 in each phase, one fix and one regression. Per-task at-task counts are 6/4/5/2/6/4/3. Add a separate missing-T4-commit fixture that stays failed at final history despite a T7 commit, and unavailable-history/T2-no-UI fixtures. A missing-browser example should name a browser check such as `T5_persistence`, not the historical `T7_browser_qa`. Replace old dotted ids in logs/evidence paths and every `id.split('.')` assumption; use explicit `task_id`. Regenerate wide/compact previews after those source changes; preserve historical benchmark apps/results and prompt bytes. These design changes belong to the navigation/design owner, not this documentation edit.

### 5. CLI

The CLI reaches the default only through M01's `templates.*` commands, generated from the registry (M14); M01 part 5 lists them.

| Command | API |
|---|---|
| `axbenchmark templates list` | `templates.list`; prints ★ on the entry with `is_default` and the built-in source, and the `default_notice` text when set. |
| `axbenchmark templates set-default TEMPLATE_SHA` | `templates.set_default`; moves the default to another built-in revision (M01). |
| `axbenchmark templates contract TEMPLATE_SHA` | `templates.contract`; prints the contract rows and the left-open list. Exit 1 with `templates.no_contract` for templates without a contract summary. |
| `axbenchmark templates prompts TEMPLATE_SHA [--file PATH]` | `templates.prompts`; prints the files in run order, or one file, byte for byte. |
| `axbenchmark templates checks TEMPLATE_SHA` | `templates.coverage`. |
| `axbenchmark templates export TEMPLATE_SHA --output template.zip` | Existing M14 command; exporting the default packages r1 like any revision (M17). |
| `axbenchmark run --config …` | A configuration pinned to the default's SHA-256 launches without a planner call (M07, M11). |

### 6. Headless verification

| Level | Tests |
|---|---|
| Package | Byte-exact preserved prompts/pins; M01-generated canonical descriptor with all required references/roles and explicit empty baseline; exact 30 ids and 30/30 phase counts with 19 artifact/11 historical final targets; M08/M12 readers validate real suites/rubric; `template.yaml`, `about.yaml` and display metadata excluded. Golden digest changes fail rather than silently repin. Built-in/planned/imported bytes converge; rename is stable; protocol/order/support/rubric changes rehash. **[R020, R028, F01/F10/F11]** |
| Domain | `check_default_contract` reports each violation separately: six tasks, swapped T5/T6, one changed prompt byte, missing prompt, a file in the baseline, missing suite, a task without checks, missing rubric, changed rubric weight, missing commit rule. `is_default_candidate` is false for a renamed copy with changed content and true only for the pinned SHA-256; a six-task package named `Inventory web app` is `LOOKALIKE`, never `DEFAULT`; a valid built-in r1 that is not the default is `NONE`, never `LOOKALIKE`. **[R028, R136]** |
| Use cases (fake ports) | Valid canonical package → candidate; tampered prompt/malformed descriptor/catalog mismatch → visible diagnostic, never default/runnable; two valid pins preserve order; spies require M01 writer before hashing at build and reader before runtime registration. CRLF preserved; unsafe resources rejected. Authoring/display bytes cannot enter `identity_of`. Non-built-in contract is absent; same-name/lineage copies are only look-alikes. |
| Executable catalog | Two new materially different conforming fixture apps (table/forms + array storage; cards/dialogs + keyed/nested storage), each with data-only T2, pass all supported checks through real M08. Inject missing T2/T4/T7 commits, missing README/update, forbidden loaded runtime, server-only entry, persistence overwrite, broken CRUD/lookup/cart/checkout, corroborated skipped QA and unfixed discovered defect. Each fails its declared predicate. Ambiguous controls/custom codec/partial QA logs are unverified; unavailable display commit metadata does not determine commit-check status. Source trees stay byte-identical after verification. |
| API (`InProcessClient`, no interface) | Real package gives exactly one default, seven tasks, 30 checks and correct phase targets; prompt responses match preserved bytes. A launch via M07/M11 records zero planner calls. Six-task duplicate rehashes and is a look-alike; no historical README result field. With r2 fixture, fresh home selects r2; results on r1 keep r1/notice until `set_default`; r1 stays immutable. Browse with no harness. Required CoverageDTO additions round-trip through in-process and socket clients. **[R008, R028, R136]** |
| Screens (fake client, `Pilot`) | One test per artboard against fixtures of the DTOs: rendered `#contract`, `#prompt-files`, `#prompt-text`, `#coverage`, `#variant-compare` match the fixture; `#prompt-text` shows the fixture text unchanged; `p`, `c`, `enter`, `esc` and `#open-other` issue no API call and push the named screen; on `LibraryScreen` (fixture rows) `a` pushes `InventoryAboutScreen` on the built-in row and is dimmed on a custom row, and `#why-not-default` pushes `VariantScreen` on a look-alike row; `#variant-compare` has no historical notice; `o` issues exactly `templates.file`; `configure` is dimmed when `can_configure` is false; loading and error switcher states show the typed error verbatim. View-model builders are unit-tested without Textual. |

**Parent completion gate:** real M01 registration, M05 snapshots, M08 Python Playwright/historical checks, M10 phase summaries, M11 planner-free launch and M02 retention must agree for two trials; then M17 export/import and M13 report preserve canonical bytes, outcomes and target provenance on macOS/Linux. Exercise M15 keyboard/mouse/resize paths. Child fake-port tests and the design previews cannot establish this gate. No historical source/prompt/result is edited to manufacture a passing fixture.
