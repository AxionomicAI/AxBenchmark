# M09 — Default seven-task inventory benchmark

Status: proposed feature contract derived from [SPEC.md](../SPEC.md). This module enables engineers to package and validate the default benchmark. It does not claim that the benchmark runner or its acceptance checks are implemented. The default ships inside the headless engine and is registered through M01's `templates.*` API; the TUI and CLI reach it only through that API, as fixed by [the architecture decision](ARCHITECTURE.md) and applied in the Implementation section.

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

## Implementation

This section applies [the architecture decision](ARCHITECTURE.md). Everything below is an implementation choice; the product behavior above stays authoritative. M09 owns no API namespace: the default is a packaged template that M01 registers and serves through `templates.*`. M09 owns the package content, the rules that decide whether that content still is the default seven-task benchmark, and four screens.

### 1. Engine component

Package `axbenchmark.engine.library.builtin`, a subpackage of M01's `engine.library`. It follows the four layers of every engine module and adds a read-only data directory. It never writes to `~/.axbenchmark/`.

**Package data** (`engine/library/builtin/data/inventory_web_r1/`, shipped as package data and read through `importlib.resources`):

| Path | Content | In the identity manifest |
|---|---|---|
| `template.yaml` | Name `Inventory web app`, description, project type `frontend`, revision label `r1`, source `builtin`, task order `T1`…`T7` with titles and prompt paths, artifact entry `index.html`, rubric and check-suite paths. | Benchmark-defining fields only (task order, prompt paths, entry, protocol, rubric and suite references); name, description and label are display-only. **[R020, R028]** |
| `spec/00-project.md` | The preserved project prompt. | yes |
| `tasks/T1-scaffold.md` … `tasks/T7-qa.md` | The seven preserved task prompts. | yes |
| `protocol.yaml` | Execution protocol: one new session per task, the project text placed before every task prompt, one commit per task, files as the only carried state. Consumed by M05. **[R020–R027]** | yes |
| `baseline/` | Empty. The manifest records a baseline with zero files; Git initialization belongs to T1. **[R020, R021]** | yes |
| `checks/acceptance.v1.json` and the check sources it references | The 21 acceptance checks (`T1.1` … `T7.1`, kinds `repo`, `browser`, `keyboard`) in M08's suite format. | yes |
| `rubric/web.v1.yaml` | The web rubric in M12's rubric format, profile `frontend`, with UX 25, visual quality 15, code quality 20, business rules/specification 25, robustness 10, accessibility 5. **[R028]** | yes |
| `about.yaml` | Display material for the screens: the frozen-contract rows, the list of choices the prompts leave open, the requirement each task covers, and the "also checked" statements. | no (display-only) |

The prompt files are not maintained by hand. The build maps the repository's `benchmark/tasks/*.md` byte for byte into `spec/` and `tasks/` (hatchling `force-include` in `pyproject.toml`), so the packaged text cannot drift from the preserved inputs. **[R020, R028]**

The directory of a released revision is never edited. A change to tasks, checks, baseline or rubric ships as a new directory with a new revision; `inventory_web_r1/` stays in every later release so r1 keeps its identity. **[R028]**

**Domain** (`engine/library/builtin/domain/`, frozen dataclasses and pure functions):

| Type or rule | Content |
|---|---|
| `BuiltinKey` | Stable package key, e.g. `inventory_web_r1`. Not an identity; identity is the SHA-256. |
| `DefaultPin` | `key`, `expected_sha256`, `task_ids = ("T1", …, "T7")`, `preserved_digests: Mapping[str, str]` (SHA-256 of `00-project.md` and each task prompt as preserved in `benchmark/tasks/`), `rubric_weights` (the six percentages above). Constants in `domain/pins.py`; kept outside the package data so the pin is not part of what it pins. |
| `PackageContents` | Parsed `template.yaml`, `protocol.yaml`, prompt bytes per path, baseline file list, check-suite summary (`check_id`, `task_id`, `title`, `kind`), rubric summary (category, weight). |
| `ContractViolation` | Enum with message: `TASK_COUNT`, `TASK_ORDER`, `PROMPT_CHANGED`, `PROMPT_MISSING`, `BASELINE_NOT_EMPTY`, `CHECKS_MISSING`, `TASK_UNCOVERED`, `RUBRIC_MISSING`, `RUBRIC_WEIGHTS`, `COMMIT_RULE_MISSING`, `IDENTITY_MISMATCH`. |
| `check_default_contract(contents, pin)` | Returns every violation, never stops at the first: exactly seven tasks in order T1–T7; each prompt digest equals the preserved digest; empty baseline; a check suite with at least one check per task; a web rubric with the pinned weights; a commit required after each task. **[R020–R028, R136]** |
| `is_default(sha256, violations, pin)` | True only when `sha256 == pin.expected_sha256` and there are no violations. Name, display label and task count never enter this decision. **[R028, R136]** |
| `default_relation(summary, default_sha, lineage)` | `DEFAULT`, `LOOKALIKE` or `NONE` for a library entry. `LOOKALIKE` when the entry is not the default and was duplicated or revised from it, or shares its display name. Used only to explain why an entry is not the default; it never confers or withholds identity. **[R136]** |
| `FrozenContract` | Rows for `#contract` (element, contract text), `left_open: tuple[str, ...]`, `check_count`, `suite_path`, `rubric_label`, `planning_required = False`. Built from `about.yaml` and the parsed package. |
| `CheckCoverage` | Per task: task id, title, covered requirement id, and its checks (id, title, kind); plus `also_checked` and `left_open`. Built by `coverage(contents, about)`; a task with no checks is a `TASK_UNCOVERED` violation, not an empty row. **[R021–R027]** |

The identity hash itself is M01's: `check_default_contract` receives the SHA-256 that M01's `TemplateIdentity.compute` returned for the package. `builtin.domain` may import `library.domain` because it is part of the same engine package.

**Ports** (`engine/library/builtin/ports.py`):

```python
class PackageResources(Protocol):
    def keys(self) -> Sequence[BuiltinKey]: ...
    def read(self, key: BuiltinKey, path: str) -> bytes: ...
    def list_files(self, key: BuiltinKey) -> Sequence[str]: ...   # relative, normalized

class IdentityCalculator(Protocol):        # satisfied by M01's application interface
    def identity_of(self, key: BuiltinKey, files: Mapping[str, bytes]) -> str: ...
```

**Application** (`engine/library/builtin/application/`). These use cases are not RPC endpoints; M01 calls them in-engine through the Protocols it declares (`BuiltinCatalog`, `ContractDescriber`), and M01's `adapters/rpc.py` maps their results to `templates.*` DTOs.

| Use case | Called by | Behavior |
|---|---|---|
| `LoadBuiltins` | M01 `RegisterBuiltins` at daemon start | For each key: read files through `PackageResources`, parse, compute identity through `IdentityCalculator`, run `check_default_contract`, return `BuiltinRegistration(key, sha256, contents, violations, is_default)`. A package with violations is still returned, with `is_default=False`, so M01 can report it instead of hiding it. |
| `DescribeContract(sha256)` | M01 for `templates.contract` | `FrozenContract` for a built-in revision; `None` for any other revision. |
| `DescribeCoverage(sha256)` | M01 for `templates.coverage` | `CheckCoverage` from the package's suite and `about.yaml`. |
| `RelationToDefault(entries)` | M01 for `templates.list` and `templates.lookalike` | Applies `default_relation` to library entries using M01's lineage records. |

**Adapters** (`engine/library/builtin/adapters/`):

| Adapter | Implements | Notes |
|---|---|---|
| `importlib_resources.py` | `PackageResources` | `importlib.resources.files("axbenchmark.engine.library.builtin.data")`; rejects absolute paths and `..`; returns bytes, never decoded text, so line endings and encoding stay exactly as packaged. |
| `yaml_parsers.py` | — | Parses `template.yaml`, `protocol.yaml`, `about.yaml` with `yaml.safe_load` into domain types; delegates suite parsing to M08's suite reader and rubric parsing to M12's rubric reader, so the formats have one owner each. |

M09 has no `rpc.py`: no DTO is defined here. Wiring in `engine/daemon/composition.py`: `LoadBuiltins(resources=ImportlibResources(), identity=library_identity)` is passed to M01's `RegisterBuiltins`; `DescribeContract`, `DescribeCoverage` and `RelationToDefault` are passed to M01's query use cases.

**Persisted state:** none. The package directory is read-only; whether M01 also records the built-in revision in its library index is M01's storage decision. **Owned processes:** none. Executing the default (M05, M11), running its checks (M08) and judging it (M12) consume the registered revision like any other template.

### 2. API surface

M09 defines no methods, jobs or events. Its data reaches clients through `templates.*` (M01). The methods and fields M09's screens and rules need are listed in section 3 so M01 can reconcile them. Reason codes that originate in M09 rules travel in M01's namespace: `templates.builtin_invalid` (with the `ContractViolation` names in `data.violations`) and `templates.no_contract`.

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `BuiltinCatalog`, `ContractDescriber` (application Protocols declared in `engine.library`) and `RegisterBuiltins` at daemon start | M01 | Register `LoadBuiltins` results; mark the default only when `is_default`; keep a package with violations visible as built-in but not default, with `templates.builtin_invalid`. **[R008, R136]** |
| `TemplateIdentity.compute` (application interface; the manifest's `digest()` is the SHA-256), behind M09's `IdentityCalculator` port | M01 | Canonical manifest and SHA-256 of the packaged files; M09 never hashes on its own. **[R028, R118]** |
| `templates.list` with `TemplateRow.is_default`, `source="builtin"`, `default_relation` (`default`, `lookalike`, `none`), `capabilities.can_about` | M01 | Library ★ marker, the `?` binding on the default and look-alike rows. **[R008, R136]** |
| `templates.contract(revision_sha)` → `TemplateContractDTO` (request, response, errors and capability flags in M01 part 2) | M01 | `InventoryAboutScreen`. **[R020–R028]** |
| `templates.prompts(revision_sha)` → `PromptsDTO` (request, response, errors and capability flags in M01 part 2) | M01 | `PromptsScreen`; works for any template revision. **[R020, R028]** |
| `templates.coverage(revision_sha)` → `CoverageDTO` (request, response, errors and capability flags in M01 part 2) | M01 | `CoverageScreen`. **[R021–R028]** |
| `templates.file(revision_sha, path)` → `FileDTO` (request, response, errors and capability flags in M01 part 2) | M01 | `o` on `CoverageScreen` shows the suite file without the client reading `~/.axbenchmark/` or the installed package. |
| `templates.lookalike(revision_sha)` → `LookalikeDTO` (request, response, errors and capability flags in M01 part 2) | M01 | `VariantScreen`. **[R028, R136]** |
| In-engine port for historical results that claim a template by name or task count without a verified SHA-256 | M02 | Fills `unlinked_historical`; these results stay unlinked. **[R028]** |
| `CheckFormat.parse` / `.validate` for `checks/acceptance.v1.json` (`CheckSuite` domain type) | M08 | M09 authors the 21 checks in M08's format and validates them with M08's reader in tests; M08 runs them on disposable copies. **[R028, R074]** |
| `RubricSource.parse`; `frontend` profile with the six categories | M12 (profiles consumed by M06) | `rubric/web.v1.yaml`. Run weights stay M06/M07 data; editing them never touches the rubric. **[R028, R033]** |
| `protocol.yaml` semantics (new session per task, project text before each prompt, commit per task) and the empty-baseline copy | M05 | Execution of the default like any other revision. **[R020–R027, R068]** |
| `SetupScreen(revision_sha)` | M07 | Target of `enter` / `#configure`; it loads its own data. Launching an approved revision makes no planner call. **[R136]** |
| `TemplateScreen(revision_sha)` | M01 | Target of "Open 6-task template" on `VariantScreen`. |
| `?` binding (`about`) on `LibraryScreen` that pushes `InventoryAboutScreen` for `default_relation="default"` and `VariantScreen` for `"lookalike"`, enabled by `capabilities.can_about` | M01 | Entry to the M09 screens; not yet in the wireframe's `LIB_KEYS` or M01's binding table. |
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
    rows: list[tuple[str, str, str, str, str]]   # task (first row only), check, title, kind, covers
    also_checked: list[str]; left_open: str
    can_open_suite: bool; suite_path: str

@dataclass(frozen=True)
class LookalikeVM:
    heading: str
    rows: list[tuple[str, str, str]]  # #variant-compare
    notice: tuple[str, str] | None    # .notice.-warning title, body from unlinked_historical
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
| `enter` / Button `#configure` | `configure` | none; dismisses and pushes M07's `SetupScreen(revision_sha)`, which loads itself. No planning screen is involved. |

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

**`CoverageScreen(Screen)`** — artboard InventoryChecks; `tui/screens/template.py`. `Static #checks-bar`, `DataTable #coverage .bordered` (Task, Check, What it observes, Kind, Covers), `Static #also-checked .pane`, `Static #not-checked .pane`.

| Aspect | Specification |
|---|---|
| Load | `templates.coverage(revision_sha)` → `build_coverage_vm`. Switcher `#coverage` / `#coverage-loading` / `#coverage-error`; `templates.no_checks` shows `#coverage-empty` with the message verbatim. |
| Content | Task title and covered requirement on the first row of each task group, as delivered. `#not-checked` shows `left_open` and the statement that checks add no obligation the prompts do not state. |
| `check_action` | `open` from `capabilities.can_open_suite`. |

| Binding | Action | API call |
|---|---|---|
| `esc` | `app.pop_screen` | none |
| `tab` | focus next | none |
| `p` | `prompts` | none; switches to `PromptsScreen(revision_sha)` |
| `o` | `open` | `templates.file(revision_sha, suite_path)`; pushes M15's `FileViewScreen` with the text, or shows the typed error |

**`VariantScreen(ModalScreen[None])`** — artboard InventoryVariant; `tui/screens/library.py`. Dialog `Vertical #variant .dialog` with `DataTable #variant-compare`, `Static .notice.-warning`, `Horizontal .dialog-actions` (Buttons `#open-other`, `#close .-primary`).

| Aspect | Specification |
|---|---|
| Load | `templates.lookalike(revision_sha)` of the selected look-alike → `build_lookalike_vm`. Switcher `#variant-compare` / `#variant-compare-loading` / `#variant-compare-error`. |
| Content | Rows (Source, Tasks, SHA-256, Default, Results) as returned; `emphasis` marks "no · a different template". The warning notice appears only when `unlinked_historical` is non-empty and names those results as kept and unlinked. **[R028, R136]** |
| `check_action` | `open_other` from `capabilities.can_open_other`. |

| Binding | Action | API call |
|---|---|---|
| `esc` / Button `#close` | `dismiss(None)` | none |
| Button `#open-other` | `open_other` | none; dismisses and pushes M01's `TemplateScreen(other_sha)` |

**Consumers elsewhere:** `LibraryScreen` (M01) shows the ★ default from `is_default` and preselects it; `TemplateScreen` (M01) task tab lists the same 21 checks from `templates.coverage`; M08 verification screens and M13 reports show check titles from the run's frozen suite, not from this package.

### 5. CLI

The CLI reaches the default only through M01's `templates.*` commands, generated from the registry (M14); M01 part 5 lists them.

| Command | API |
|---|---|
| `axbenchmark templates list` | `templates.list`; prints ★ on the entry with `is_default` and the built-in source. |
| `axbenchmark templates contract TEMPLATE_SHA` | `templates.contract`; prints the contract rows and the left-open list. Exit 1 with `templates.no_contract` for templates without a contract summary. |
| `axbenchmark templates prompts TEMPLATE_SHA [--file PATH]` | `templates.prompts`; prints the files in run order, or one file, byte for byte. |
| `axbenchmark templates checks TEMPLATE_SHA` | `templates.coverage`. |
| `axbenchmark templates export TEMPLATE_SHA --output template.zip` | Existing M14 command; exporting the default packages r1 like any revision (M17). |
| `axbenchmark run --config …` | A configuration pinned to the default's SHA-256 launches without a planner call (M07, M11). |

### 6. Headless verification

| Level | Tests |
|---|---|
| Package | Every file under `spec/` and `tasks/` is byte-identical to `benchmark/tasks/`; `DefaultPin.preserved_digests` match those files; the computed SHA-256 of `inventory_web_r1` equals `DefaultPin.expected_sha256` (a failing test, not a silent update, when content changes); `acceptance.v1.json` parses with M08's reader and has 21 checks with at least one per task; `rubric/web.v1.yaml` parses with M12's reader with the six pinned weights; `baseline/` is empty; `about.yaml` is excluded from the manifest. **[R020, R028]** |
| Domain | `check_default_contract` reports each violation separately: six tasks, swapped T5/T6, one changed prompt byte, missing prompt, a file in the baseline, missing suite, a task without checks, missing rubric, changed rubric weight, missing commit rule. `is_default` is false for a renamed copy with changed content and true only for the pinned SHA-256; a six-task package named `Inventory web app` is `LOOKALIKE`, never `DEFAULT`. **[R028, R136]** |
| Use cases (fake ports) | `LoadBuiltins` with an in-memory `PackageResources`: valid package → `is_default`; tampered prompt → `PROMPT_CHANGED` and `is_default=False` while the entry is still returned; `IdentityCalculator` fake confirms M09 never hashes on its own. `DescribeContract` returns `None` for a non-built-in revision. `RelationToDefault` marks a duplicate of r1 `LOOKALIKE`. The resources adapter rejects `..` and absolute paths and returns bytes unchanged (CRLF fixture). |
| API (`InProcessClient`, no interface) | Against the real package: `templates.list` has exactly one `is_default` entry with seven tasks; `templates.contract`, `templates.prompts` (text equal to `benchmark/tasks/`), `templates.coverage` (21 checks across T1–T7) and `templates.file` succeed; a launch of the default through M07/M11 with a fake planner records zero planner calls; a duplicated six-task revision gets a different SHA-256, `default_relation="lookalike"`, and r1 is unchanged; a historical result with only a matching name appears in `unlinked_historical` and has no verified template SHA-256. These tests also run with no harness installed. **[R008, R028, R136]** |
| Screens (fake client, `Pilot`) | One test per artboard against fixtures of the DTOs: rendered `#contract`, `#prompt-files`, `#prompt-text`, `#coverage`, `#variant-compare` match the fixture; `#prompt-text` shows the fixture text unchanged; `p`, `c`, `enter`, `esc` and `#open-other` issue no API call and push the named screen; `o` issues exactly `templates.file`; `configure` is dimmed when `can_configure` is false; loading and error switcher states show the typed error verbatim. View-model builders are unit-tested without Textual. |
