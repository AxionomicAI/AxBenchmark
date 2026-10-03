# xai-cloud-grok-4.7-fast-500k-medium — quality review

Reviewed 2026-10-01 against `benchmark/tasks/00-project.md` and T1–T7. Read all 2,305 implementation lines (HTML/CSS/JS), README, RESULTS and repository history. Source was unchanged. Scores are judgments on the supplied artifact, on a 1–5 scale.

| Category | Grade | Finding |
|---|---:|---|
| Business rules/spec | 4.5 | Direct-file vanilla app; seeded data, CRUD/search, persistent cart, correct unit totals, stock validation, checkout and historical snapshots all verified. Git commits support T1–T7. Prices are absent: “total” explicitly means units. |
| Code quality | 4 | Clear inventory/cart/orders/storage boundaries, defensive parsing, safe DOM rendering and useful result objects. The 904-line UI module repeatedly redraws all sections, and checkout rollback cannot guarantee consistency. |
| UX | 3.5 | Discoverable CRUD, useful tokenized search, stock filter, explicit checkout confirmation and validation. Cart is below the whole catalog; add feedback can be offscreen, mobile cart clips the Remove edge, and keyboard add loses focus. |
| Visual design | 3.5 | Coherent restrained dark theme, readable typography, tidy aligned desktop table, consistent spacing and buttons. Mobile form is legible but product rows become tall and populated cart requires horizontal scrolling. |
| Robustness | 3.5 | Strong input validation and ordinary save-error handling; transient order-save failure restores stock. Persistent write failure during rollback leaves stock deducted without an order. |
| Accessibility | 3.5 | Labels, scoped headers, named row actions, live statuses, visible focus and native dialogs. Edit moves focus and Escape cancels checkout; adding by keyboard destroys focused row without restoring focus. |

Weighted overall: **77/100** (UX 25%, visual 15%, code 20%, business/spec 25%, robustness 10%, accessibility 5%).

**Code quality:** Domain modules are understandable and validate at their boundaries; text nodes prevent injected markup. Repeated storage reads and wholesale DOM replacement in the large UI module add complexity. Three storage keys and fallible compensating writes leave checkout vulnerable to partial persistence.

**UX:** Everyday operations work with good field labels and specific errors. The always-visible add form and full inventory precede the cart, so mobile shoppers scroll through a long page. Cart updates need closer visual feedback and consistent focus preservation.

**Business rules/spec adherence:** The literal required inventory/cart/order flow works, including stock caps, automatic cart reconciliation after edits/deletion and immutable historical names/SKUs. There is no price model, currency or monetary checkout total; the terse source task did not explicitly require those, so this is a disclosed interpretation rather than an unequivocal requirement failure. Repricing is not applicable.

## Requirements and evidence

| Task | Status | Evidence |
|---|---|---|
| T1 scaffold / README / Git | Pass | `index.html`, split `css/` and `js/`, accurate README; own `.git`; scaffold commit `9af2eb9` and seven task commits through `5a08eab`. |
| T2 seeded stock/persistence | Pass | Six seeded products, 210 units; created/edited inventory survived reload. Normalization and seed-on-missing-key at `js/inventory.js:68` and `js/inventory.js:96`. |
| T3 CRUD | Pass | Added literal markup product, renamed it, changed stock, confirmed deletion. |
| T4 lookup | Pass | `  auD   1  ` matched only Audit Product / AUD-1; case/whitespace-insensitive term matching. Filter implementation inspected (`js/app.js:106`). |
| T5 cart | Pass; units-only total | Keyboard add, typed quantity, plus/minus, explicit remove, zero removal, reload persistence and two-line unit total 2 verified. `js/cart.js:108` sums quantities. |
| T6 checkout / history / README | Pass, failure-recovery caveat | Purchase of 2 changed stock 5→3, cleared cart, saved order; reload preserved order; deletion preserved snapshot. Empty and stale overstock checkout rejected. README describes exact storage and workflow. |
| T7 browser QA (cloud) | Historical evidence + current independent verification | `5a08eab` records browser fixes; RESULTS claims Puppeteer desktop/phone QA. No original runnable tests/probe supplied. Current audit independently opened `file://` in Chrome. |

## Strongest positive

Business logic is unusually careful for a small static app: immutable copies, safe integer quantity checks, case-insensitive SKU uniqueness, stock-aware cart reconciliation, checkout validation and historical product snapshots. For example, reducing Audit Product stock from 3 to 1 clamped its cart from 3 to 1; deleting it removed the cart entry while order #1 still retained its original name, SKU and two units (`js/cart.js:74`, `js/orders.js:3`).

## Confirmed defects and material limitations

1. **Checkout can leave reduced stock without an order when rollback writes also fail.** Browser fault injection allowed the inventory write, then rejected subsequent writes. Checkout returned “Could not save orders in this browser”; stock was 42→41, cart still contained one unit, and no new order existed. `js/orders.js:199` commits stock before history; `js/orders.js:226` writes history; `js/orders.js:228` ignores the boolean from `restoreStock`, which can return false (`js/orders.js:156`). The cart-clear failure path similarly ignores rollback results at `js/orders.js:234`. A single-key state commit or explicit recovery design would be safer. This is a simulated continuing storage failure, not an ordinary happy-path defect or a quota exhaustion claim.
2. **Keyboard Add to cart loses focus to the document body.** Focused the Audit Product add button and pressed Enter; the cart updated but `document.activeElement` became BODY. `js/app.js:525` refreshes all sections; `js/app.js:195` removes product rows, without the focus restoration used for deferred quantity edits. Repeated keyboard additions require finding the button again. Removing a row also loses focus (`js/app.js:662`).
3. **Mobile cart horizontally clips its actions.** At 390×844, the cart table was 330.83px wide inside a 316px wrapper. The screenshot visibly truncates the Actions heading and right edge of Remove; users must scroll inside the table. The page itself stays 390px wide. `.table-wrap` uses overflow at `css/styles.css:191`; mobile styles shrink quantity fields but retain the four-column table (`css/styles.css:383`). Inventory action stacking also makes each product row about 145px tall.
4. **Cart feedback is remote from the triggering action.** Successful add only redraws the cart status (`js/app.js:510`, `js/app.js:317`), located after the entire catalog (`index.html:71`). On the mobile initial page the first product starts below the fold and the cart begins after all six products. There is no adjacent count/toast/jump-to-cart control. Live-region semantics help screen-reader feedback but do not solve visual discoverability.

Additional static risk: `js/storage.js:11` converts malformed JSON and read failures into empty arrays without exposing corruption; subsequent mutations may overwrite data. Not fault-injected in this audit. No cross-tab coordination was tested.

## Browser verification

Executed `node quality-review/xai-cloud-grok-4.7-fast-500k-medium-probe.mjs` with cached Puppeteer and installed Chrome, a fresh unique temporary profile and the actual `file:///…/index.html`. Browser closed in `finally`. Two successful focused runs; no uncaught page errors. This is audit evidence, not a supplied application test suite.

- UI clicks: create/edit/delete; add/remove; plus/minus; checkout/open/confirm. Fields/search used DOM value assignment plus input/change events, so the full typing flow was not simulated.
- Genuine keyboard: Enter activated focused Add to cart; edit focused product-name; checkout initially focused Cancel; Escape closed checkout.
- Persistence: quantity 2 survived reload; checkout stock 5→3, cleared cart and order #1 survived reload.
- Quantity boundaries: fraction 1.5 rejected while keeping 2; 99 clamped to stock 5 with specific message; 0 removed the line.
- Domain calls in page: duplicate `wid-001` rejected; negative/fractional/over-limit stock rejected; empty checkout rejected; stale cart quantity 4 against stock 1 rejected.
- Safe input: `<img src=x onerror=alert(1)>` rendered literally with zero image elements under inventory rows.
- Failed writes: inventory add returned failure without changing stored data; order-key-only failure restored stock/cart/history; persistent failure after initial checkout write reproduced partial state as above.
- Pricing/repricing: unavailable because model has no prices; quantity total was verified.

No supplied test files, package runner or test command were present. Historical QA claims are not treated as current test results. `git status --short` showed only pre-existing untracked RESULTS.md, with no modified application source.

## Screenshots inspected

Actually opened and visually inspected each PNG with the image viewer:

- [Desktop, 1440×1000](xai-cloud-grok-4.7-fast-500k-medium-desktop.png)
- [Mobile, 390×844 viewport / full-page capture](xai-cloud-grok-4.7-fast-500k-medium-mobile.png)
- [Checkout confirmation](xai-cloud-grok-4.7-fast-500k-medium-checkout.png)
- [Populated mobile cart and order history](xai-cloud-grok-4.7-fast-500k-medium-mobile-cart.png)

Visual inspection used the browser's dark preference. Light mode, actual screen-reader behavior, other browsers, cross-tab races and corrupted-storage recovery were not tested. Evidence: [probe](xai-cloud-grok-4.7-fast-500k-medium-probe.mjs), [structured browser output](xai-cloud-grok-4.7-fast-500k-medium-results.json).

```json
{"folder":"xai-cloud-grok-4.7-fast-500k-medium","scores":{"ux":3.5,"visual":3.5,"code":4,"spec":4.5,"robustness":3.5,"accessibility":3.5},"overall100":77,"tasks":{"T1":"pass","T2":"pass","T3":"pass","T4":"pass","T5":"pass_units_only_total_disclosed","T6":"pass_with_failed_rollback_caveat","T7":"historical_git_and_results_evidence_current_browser_verified"},"comments":{"code":"Clear domain modules, safe rendering and defensive normalization; large redraw-heavy UI and non-atomic checkout rollback.","ux":"Good CRUD/search/validation; distant cart feedback, keyboard focus loss and clipped mobile Remove control.","business":"Literal stock/cart/order requirements verified. Total means units; no prices. Continuing storage failure can deduct stock without saving an order."},"evidence":{"browser":"actual file URL, isolated Chrome profile, two successful probe runs","screenshotsViewed":4,"suppliedTests":"none","git":"own repository, seven task commits","topLines":["js/orders.js:199","js/orders.js:228","js/app.js:525","css/styles.css:383"]},"limitations":["No monetary pricing model; not expressly required","DOM-assigned fields with real clicks and selected keyboard interactions","No screen reader, light mode, cross-tab or malformed-storage runtime test","Persistent failure reproduced via fault injection"]}
```
