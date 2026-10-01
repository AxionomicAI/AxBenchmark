# ryzen7-8745hs-gemma4-26b quality review

Reviewed 2026-10-01 by a fresh, sequential reviewer. All supplied HTML, JavaScript, CSS, README, RESULTS, ignore rules, and available Git history were read. Scores assess this artifact against the common inventory specification, independently of generation hardware and historical pass labels.

| Category | Grade /5 | Assessment |
|---|---:|---|
| UX | 2.5 | Straightforward normal operations, but searching discards drafts, cart additions lack visible nearby feedback, and stale cart states cannot be resolved normally. |
| Visual | 2.5 | Legible, consistent tables and section headings; basic styling, disconnected full-width header, substantial scrolling, and crowded mobile actions. |
| Code quality | 2 | Small understandable store classes, undermined by unsafe HTML templates, whole-page rendering, weak validation, and non-atomic checkout. |
| Business rules/spec adherence | 2.5 | Required features exist and the happy path works; failed purchases consume stock, deleted inventory returns, and cart deletion consistency fails. |
| Robustness | 1 | Confirmed unsafe name execution, corrupted-storage startup failure, and persistent stock loss on rejected checkout or failed history writes. |
| Accessibility | 2.5 | Native buttons, headings, table headers, and labeled product inputs; search lacks a persistent label, quantity controls lack product context, and rerenders lose keyboard focus. |

Weighted overall: **45/100** using the common protocol. This is a judgment of artifact quality, not a benchmark success percentage.

**Code quality:** Inventory, cart, and order stores make basic state ownership easy to follow, but their mutations have no validation or error boundary. The large `render()` string combines all screens and inserts unescaped data; checkout saves stock before proving the whole order can complete.

**UX:** Users can discover CRUD, search, cart, and checkout through clear text controls. The always-visible full-width product form pushes the cart far below inventory, and any search or cart rerender clears an in-progress form. Keyboard users repeatedly lose their position after cart actions.

**Business rules/spec adherence:** Opening `index.html` directly works without libraries, and the ordinary purchase correctly persists stock, cart, and an order snapshot. The purchase rule fails for mixed availability: an unsuccessful checkout changes stock without recording an order. First-run seeding also runs after a user deliberately deletes every product.

## Task evidence

| Requirement | Result | Evidence |
|---|---|---|
| Base: direct file, vanilla JS, localStorage | Pass | Executed `file://` in isolated Chrome; no external dependencies. |
| T1 scaffold, README, Git commit | Pass | Required files and initial commit `d842a63` exist. |
| T2 seeds, stock, persistence | Partial | Three seeds and normal persistence work; saved empty inventory is overwritten with seeds on reload. |
| T3 view/create/edit/delete | Partial | Normal operations pass, but deleting the final product does not persist an empty inventory. |
| T4 quick lookup | Pass | Case-insensitive name search returns the expected edited item; no-results UI exists in current source. |
| T5 persistent cart, quantities, removal, total | Partial | Ordinary add/increment/remove/reload passes; deleting a carted product leaves an invisible, unremovable cart key. |
| T6 checkout, stock, history, README | Partial | Successful checkout and historical snapshot persist; rejected multi-item checkout and a failed order write can consume stock without an order. |

Only the initial scaffold commit is in supplied Git history. Current README/CSS/HTML/JS are modified relative to it; the requested T2–T6 implementation commits are absent from this supplied repository. T7 was not required for this local run. Historical RESULTS claims were not treated as current proof.

## Confirmed defects with source evidence

1. **Failed checkout permanently deducts stock.** Apple ×1 plus Banana ×31 with stocks 50/30 produces “Not enough stock for Banana,” yet Apple becomes 49 in localStorage, the cart remains, and no order exists. The screen misleadingly still shows 50 until reload. Validation and inventory saves are interleaved in `ryzen7-8745hs-gemma4-26b/js/app.js:367`, `:371`, and `:382`. Validate the complete cart before applying mutations.
2. **Product names execute HTML.** Submitting a product named `<img src=x onerror="window.__qualityInjection=1">` created an image and executed its handler. Name interpolation occurs at `js/app.js:190`, also `:156` and `:264`, then enters the DOM at `:274`. This is verified unsafe local rendering; no remote attacker scenario was assumed.
3. **Persistence failures can break the app or purchase integrity.** A simulated exception when saving `order_history` left Apple stock 49 and the original cart persisted with no order after reload. Stock saves precede order writes at `js/app.js:382` and `:387`; storage writes are uncaught at `:25` and `:117`. Malformed inventory JSON caused an uncaught parse error and a blank main area; `:20`–`:21` parse without validation or recovery.
4. **Deleting all products resurrects seeds.** After confirmed deletion of Apple, Banana, and Cherry, localStorage contained `[]`; reload restored all three original products. `js/app.js:9` treats an intentionally empty list as a first run.
5. **Deleting a carted product leaves invisible cart state.** Delete Apple after adding it: the cart table becomes empty, the empty-cart message is absent, a $0 checkout stays available, and clicking it does nothing. Deletion does not reconcile the cart (`js/app.js:327`); rendering hides missing products (`:150`–`:151`) but checks raw keys for emptiness and checkout (`:243`, `:246`).
6. **Rendering destroys draft and keyboard state.** Typing a product draft then searching erased the draft. Enter activated Add to Cart and + successfully, but both left focus on `BODY`. `js/app.js:274` replaces the whole application; search and cart actions call it at `:344`, `:349`, and `:354`. Keyboard Edit changes the form title but leaves focus on the Edit button (`:324` only scrolls).
7. **Validation and availability feedback are weak.** Whitespace-only names save because the name is not trimmed (`js/app.js:298`). Cart quantity can exceed stock (`:70`, `:80`) and is rejected only at checkout. Native form validation correctly rejected fractional stock in the probe. Ordinary UI quantities use integer increments; externally corrupt fractional/negative cart data was not separately tested.

## Visual inspection and accessibility spot check

Actually viewed [desktop](ryzen7-8745hs-gemma4-26b-desktop.png), [mobile](ryzen7-8745hs-gemma4-26b-mobile.png), and [populated cart/form](ryzen7-8745hs-gemma4-26b-cart.png) screenshots. Desktop viewport was 1440×1000; mobile was 390×844. Files capture full-page content.

The centered white panel, dark headings, aligned table columns, and consistent red/blue/green actions are readable. The title and search stretch to the screen edge while the content is constrained to 800px (`css/style.css:20`). The product form consumes a large vertical block before the shopping cart. Mobile had no horizontal document overflow with seed data (390px measured width), but action buttons stack flush against one another at only 27px high; there is no responsive layout rule. The cart and order history require substantial scrolling. Longer mobile content was not stress-tested.

Native Tab navigation reached search, then Edit; Enter activated Edit, Add to Cart, and quantity +. Product form labels are associated with inputs (`js/app.js:210`, `:214`, `:218`). Search has only a placeholder (`index.html:13`); quantity labels are just “−”/“+” (`js/app.js:158`, `:160`). No live result/cart announcements or focus restoration are provided. This was a keyboard/semantics spot check, not a full contrast or assistive-technology audit.

## Executed checks and limitations

Command: `node quality-review/ryzen7-8745hs-gemma4-26b-probe.mjs` — exit 0. [Raw outcomes](ryzen7-8745hs-gemma4-26b-probe.json) and [keyboard outcomes](ryzen7-8745hs-gemma4-26b-keyboard.json) preserve evidence. Browser closed in `finally`; application source was unchanged.

Verified seed load; create; edit name/stock/price; mixed-case search; add cart item; quantity increase; remove another item; cart reload; checkout of two units at $3.25 ($6.50); stock 6→4; saved history and reload; deletion without damaging history; quantity decrement to zero removes item. A later price edit immediately recalculated the cart, and reducing its stock to zero blocked checkout. Product form filling and row targeting were partly scripted DOM actions; requestSubmit preserved native constraint validation. Search and selected cart interactions used Puppeteer click/keyboard input. The overstock quantity setup used the application's own quantity handler. Storage exceptions were deliberately injected, not an actual full disk.

No supplied automated tests or test runner were present. No cross-tab concurrency, Safari/Firefox, assistive technology, or large-data performance claims are made. Strongest positive: a tiny dependency-free implementation completes the ordinary CRUD-to-order workflow and preserves an order snapshot even after its product is deleted.

```json
{"folder":"ryzen7-8745hs-gemma4-26b","scores":{"ux":2.5,"visual":2.5,"code":2,"spec":2.5,"robustness":1,"accessibility":2.5},"weighted_overall_100":45,"tasks":{"T1":"pass","T2":"partial","T3":"partial","T4":"pass","T5":"partial","T6":"partial","T7":"not_required"},"comments":{"code":"Readable small stores, but unsafe HTML rendering, destructive full rerenders, and stock mutations before checkout validation.","ux":"Normal flows are discoverable; draft loss, distant cart feedback, lost keyboard focus, and invisible stale cart items impede recovery.","business_rules":"Happy-path stock/history persistence works; rejected checkout consumes stock, empty inventory reseeds, and deleting products leaves cart state inconsistent."},"evidence":{"probe":"quality-review/ryzen7-8745hs-gemma4-26b-probe.json","screenshots_viewed":["desktop","mobile","cart"],"supplied_tests":"none","git":"initial scaffold commit only; implementation files modified"},"limitations":["Chrome only","mixed DOM and click/keyboard interaction","storage write failure simulated","no cross-tab or large-data testing","accessibility spot check"]}
```
