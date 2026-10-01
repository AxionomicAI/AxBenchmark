# ryzen7-8745hs-qwen36-35b quality review

Reviewed 2026-10-01 by a fresh sequential reviewer. Read all 2,519 implementation lines (HTML, CSS, JavaScript), README, Git history/status, and RESULTS.md. Historical results are not used as proof: the current artifact independently reproduces working inventory management and broken purchasing. Application source was not modified.

| Category | Grade /5 | Assessment |
|---|---:|---|
| UX | 2 | CRUD and lookup are approachable, but cart controls fail silently and Orders opens the wrong form. |
| Visual | 2.5 | Coherent blue/gray desktop cards and readable stock badges; mobile clips product actions and stock filter styling is inconsistent. |
| Code quality | 2 | Named functions and clear sections help navigation, but major mismatches between function contracts, DOM IDs, event handlers and CSS show incomplete integration. |
| Business rules/spec | 2.5 | Direct-file vanilla/localStorage inventory, CRUD and search work; required cart and checkout/history are unusable. |
| Robustness | 1.5 | Startup exception, broken checkout, empty-inventory resurrection and inconsistent persistence validation. |
| Accessibility | 2.5 | Labels and dialog semantics exist; keyboard focus escapes modal, cart ignores Escape, and mobile controls fall outside viewport. |

Weighted overall: **43.5/100** using the shared protocol. Scores judge the supplied application, not its model or hardware.

**Code quality:** Reasonably readable inventory functions sit inside one large IIFE, but unfinished feature integration breaks DOM references, argument types and return-value assumptions. No supplied tests catch those errors.

**UX:** Adding, editing and finding stock is straightforward with clear fields and stock labels. Shopping has no usable feedback or path to completion, Orders is misleading, and mobile action rows require horizontal scrolling.

**Business rules/spec adherence:** T1–T4 functionality substantially exists. T5/T6 are present as code and README claims, but neither shopping-cart management nor a completed purchase/history is reachable through the UI; empty inventory does not persist correctly.

## Task status

| Task | Result | Evidence |
|---|---|---|
| T1 scaffold/repository | Pass | README plus separated HTML/CSS/JS; real `.git`, initial scaffold commit `a13dc2a`. |
| T2 seed/persistence | Partial | Fresh isolated file:// run creates ten products; CRUD changes survive reload. Stored `[]` is replaced with all ten samples on reload. |
| T3 management | Pass (functionality) | Created Review Widget, edited to Review Edited and quantity 3, reloaded, then deleted through UI. |
| T4 lookup | Pass (functionality) | Typed search shows exactly the edited item with highlighting. Category, stock filters, suggestions and six sorting modes inspected statically. |
| T5 cart | Fail | Both inventory and quick-view Add to Cart leave storage empty; cart opens as an empty white panel with no explanation or controls. |
| T6 checkout/history | Fail | Orders opens Edit Item with name `undefined`; no successful normal checkout. Injected-cart diagnostic also crashes before stock/order changes. README claims these features anyway. |
| T7 browser QA | Not applicable | Not required for this local run. No supplied test files or runner. |

The three supplied commits are `a13dc2a`, `ec070a8` and `14fe2d0`. README, HTML, CSS and JS already have uncommitted changes; RESULTS.md is untracked. Later per-task commit requirements are not fully met. Review tested the working-tree artifact, without changing it.

## Browser verification and visuals

Ran `node quality-review/ryzen7-8745hs-qwen36-35b-probe.mjs` in Chrome using a unique temporary Puppeteer profile; process exited 0 and browser closed in `finally`. This is an audit probe, not a supplied passing application test. Raw results: [probe JSON](ryzen7-8745hs-qwen36-35b-probe.json), [probe source](ryzen7-8745hs-qwen36-35b-probe.mjs).

Actual pointer clicks/type/keyboard covered open-file initialization, create, edit, search, both add-to-cart buttons, cart open/close, Orders, reload and delete. Existing edit field values were set through DOM evaluation before clicking Save. Quantity `1.5` was rejected by the native form (`stepMismatch=true`). Edited name and quantity persisted across reload. Deleting the sole search result left the stale count “1 item” beside “No items match”.

A separate explicitly injected localStorage cart tested downstream behavior only: it persisted across reload but rendered no cart rows or quantity/removal controls. Programmatically clicking the hidden checkout button raised `Cannot read properties of undefined (reading 'findIndex')`; stock stayed at 42, cart stayed present, no order was written. This is not claimed as a successful user checkout or cart persistence flow.

Screenshots were saved **and actually viewed**:

- [Desktop 1440×1000](ryzen7-8745hs-qwen36-35b-desktop.png): legible headings, generous white cards, useful colored stock badges. Narrow centered list shows four products in a tall viewport; each card has a dense run of similarly weighted actions. Stock-status select uses an unstyled native rectangle, unlike rounded neighboring filters. Large unused gap follows desktop search.
- [Mobile 390×844](ryzen7-8745hs-qwen36-35b-mobile.png): header and filters stack, but cards exceed viewport; document width is 490px and Delete's right edge is ~469.5px. Cart action and Delete are clipped. Long metadata also runs offscreen.
- [Mobile item form](ryzen7-8745hs-qwen36-35b-mobile-form.png): comfortable labeled fields and full-width Cancel/Add controls fit at the tested height.
- [Blank cart](ryzen7-8745hs-qwen36-35b-cart.png): white empty area with only title/close, no useful empty-state message. No successful order state exists to inspect normally.

Strongest positive: inventory entry and retrieval are usable immediately, with seeded varied stock levels, live search highlighting, labeled forms, and persistent edits.

## Defects with exact source evidence

Paths below are relative to `ryzen7-8745hs-qwen36-35b/`.

1. **Blocking: cart fails at startup and on every reload.** `js/app.js:52` and `js/app.js:53` query `cartEmptyMsg` and `cartItemsList`, absent from `index.html:122` (only an empty `cartContent` exists). `js/app.js:573` immediately dereferences the missing element. Browser reproduced `Cannot read properties of null (reading 'style')`; rendering inventory happens earlier so CRUD still works. Injected nonempty cart fails at `js/app.js:577` as well.
2. **Blocking: both Add to Cart handlers pass the wrong argument.** `addToCart(itemId)` compares IDs at `js/app.js:284`–286, but `js/app.js:872` and `js/app.js:1092` pass the whole item object. Both click paths were reproduced leaving cart storage null without user feedback.
3. **Blocking: checkout has an independent return-value error.** `js/app.js:483` assigns `const items = loadItems()` although `loadItems` at `js/app.js:189` mutates outer state and returns nothing. `js/app.js:485` calls `findIndex` on undefined. Injected-cart diagnostic reproduced this exact exception without stock/order changes.
4. **Major: Orders launches item editor.** `js/app.js:1178` invokes `openModal(orderHistoryModal)`; the item-only `openModal` at `js/app.js:887` treats the DOM element as a product. Browser displayed Edit Item, name `undefined`, with actual Orders dialog still hidden. Close handlers at `js/app.js:1185` and `js/app.js:1193` also target the item-modal function.
5. **Major: mobile actions overflow.** Fixed-content action groups (`css/styles.css:302`, `css/styles.css:307`, `css/styles.css:414`) remain in one row despite the outer column adjustment at `css/styles.css:1078`. Reproduced 490px document width on a 390px viewport; Delete extends beyond visible screen.
6. **Moderate: empty inventory is not durable.** `js/app.js:1224` uses `!hasItems()` to seed, conflating deliberate empty inventory with first run. A valid stored `[]` reproduced ten products after reload. `js/app.js:784` only updates result count in the nonempty branch, causing stale empty-search count.
7. **Moderate: price editor is unreachable and inconsistent.** `openPriceModal` at `js/app.js:613` has no caller. JS expects `priceInput`, `priceItemName` and `closePriceBtn` (`js/app.js:70`, `js/app.js:73`, `js/app.js:74`); HTML instead supplies `itemPrice` and `closePriceModalBtn` (`index.html:143`, `index.html:149`) and no item name target. Newly created products omit price at `js/app.js:913`; they show $0.00 with no usable way to set a price. This compounds T5's broken totals/purchasing path.
8. **Accessibility: modal focus is not contained or restored.** `js/app.js:903` focuses the name input, but no trap/inert background exists. Two Shift+Tab presses moved focus outside the visible item dialog. Escape handling (`js/app.js:982`) only handles item/quick-view dialogs; tested cart stays open after Escape. Inputs/selects and dialog headings are appropriately labeled; these positives do not repair focus behavior.
9. **Static safety and maintainability risks.** Order item names interpolate into `innerHTML` unescaped at `js/app.js:424` and `js/app.js:529`, although inventory text uses an escape helper; these currently unreachable order paths were not exploited. Persistence catches some item/cart errors (`js/app.js:204`, `js/app.js:228`) but not orders (`js/app.js:351`, `js/app.js:356`), and saved shape is not validated. CSS has a stray declaration/brace at `css/styles.css:353` and undefined variables in later order styles (e.g. `css/styles.css:890`). These are static findings, not additional claimed browser repros.

## Limits

Only Chrome direct-file operation was exercised. No cross-tab synchronization, storage-quota failure, malicious payload, full screen-reader audit, browser matrix or large dataset testing. Quantity changes/removal and successful order history could not be exercised normally because upstream controls are broken. Missing features were not repaired or patched to manufacture passes. No application tests are supplied; the review probe is separate audit evidence. No CI/CD was configured.

```json
{"folder":"ryzen7-8745hs-qwen36-35b","scores":{"ux":2,"visual":2.5,"code":2,"spec":2.5,"robustness":1.5,"accessibility":2.5},"weighted_overall_100":43.5,"tasks":{"T1":"pass","T2":"partial","T3":"pass_functionality","T4":"pass_functionality","T5":"fail","T6":"fail","T7":"not_applicable"},"comments":{"code":"Readable inventory functions, but DOM/argument/return-value mismatches leave major features unintegrated; no supplied tests.","ux":"CRUD and live search work; cart silently does nothing, Orders opens the wrong form, and mobile actions are clipped.","business":"Direct-file vanilla/localStorage inventory is usable, but required cart, checkout and history are broken and empty inventory reseeds."},"supplied_tests":"none","browser_verified":true,"screenshots_viewed":true}
```
