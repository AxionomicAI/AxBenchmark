# anthropic-cloud-sonnet-5.5-medium quality review

Reviewed 2026-10-01 against the common inventory specification. All source files and README were read. Direct-file browser checks used isolated headless Chrome/Puppeteer; application source was unchanged.

| Category | Grade /5 | Assessment |
|---|---:|---|
| UX | 3.5 | Clear desktop inventory, efficient ranked multi-term search, useful feedback and straightforward modal flows. Mobile operation requires horizontal panning to reach key information/actions; cart fractions are silently rounded. |
| Visual design | 3.5 | Consistent navy/white palette, readable system typography, orderly spacing and restrained forms. Desktop is coherent but basic; narrow table columns wrap heavily on mobile and the cart total starts partly offscreen. |
| Code quality | 3.5 | Small, readable storage/cart/orders/UI modules, shared DOM helpers, text-safe rendering, documented APIs and snapshot orders. Repeated storage wrappers have the same broken write-failure fallback; persisted record validation and checkout commit guarantees are weak. |
| Business rules/spec adherence | 4.5 | All required normal flows verified, including direct-file execution, persisted cart, stock deductions and immutable order snapshots. Git scaffold and subsequent feature commits are present. Failure handling undermines the README's stronger all-or-nothing claim. |
| Robustness/data integrity | 2.5 | Normal validation and safe rendering are good. A failed inventory write can leave a successful order with unchanged stock; malformed stored records can break rendering. |
| Accessibility | 3.5 | Native buttons/dialogs, labeled form controls, live status/error regions, search shortcuts and Escape dismissal work. Dialogs lack accessible names, repeated row actions lack product context, and small action targets/mobile overflow limit usability. |

Weighted overall: **73/100** (UX 25%, visual 15%, code 20%, spec 25%, robustness 10%, accessibility 5%). Grades are judgments of this artifact, not model performance statistics.

**Code quality:** The four modules keep business logic out of most DOM code, and textContent-based rendering protects user-entered names. Consolidating persistence and validating loaded records would address more risk than cosmetic refactoring.

**UX:** Desktop CRUD and checkout are quick to discover and use; search ranking, highlighting and filters are especially useful. Mobile users must pan tables to find stock/actions or read the full checkout total, and quantity rounding needs explicit feedback.

**Business rules/spec adherence:** Required inventory, cart, checkout and history behavior works in the ordinary file:// flow. Editing price updates the cart, deleting a product removes its cart line, and completed orders preserve purchase-time details. The app can nevertheless claim a successful purchase without decrementing persisted stock when an inventory write fails.

## Specification coverage

| Task | Status | Evidence |
|---|---|---|
| T1 structure/README/Git | Pass | HTML/CSS/four JS modules and run instructions present. Git log contains scaffold `c832c6e` and subsequent T2–T6 feature commits. |
| T2 seed/persistence | Pass | Fresh profile seeded ten products; changes and stock survived reload. |
| T3 view/add/edit/delete | Pass | Created a product, edited price/name, deleted with native confirmation, checked resulting state. |
| T4 quick lookup | Pass | Keyboard `/` focused search; `usb accessories` returned only the USB cable; Escape cleared the query. |
| T5 persistent cart | Pass | Add, quantity update, remove button, zero removal, exact total, reload persistence verified. |
| T6 checkout/history | Pass in normal operation; failure-integrity caveat | Two units at $12.25 yielded a $24.50 order, stock fell 5→3, cart emptied, history persisted after reload and later product edit/delete. |
| T7 browser QA | Fix commit present; historical execution unverified | RESULTS.md claims prior browser QA and Git includes `5de3174` fixing price/mobile/cross-tab behavior. No supplied executable tests or traces independently verify that prior run; the review described here was executed. |

## Strongest positive

The app combines ranked, highlighted AND-term search with category/low-stock filtering (`js/app.js:13`, `js/app.js:34`, `js/app.js:69`), while cart references stay current and order lines retain snapshots (`js/cart.js:40`, `js/orders.js:62`). This is a coherent small inventory workflow rather than disconnected screens.

## Confirmed defects and limitations

1. **High: successful checkout can fail to update stock.** `js/storage.js:21` swallows write exceptions and stores JSON in `memory`, but `js/storage.js:13` reads existing localStorage whenever reads succeed. `js/orders.js:89` records the order, attempts the stock write, then clears the cart with no persisted-state confirmation/rollback. Fault injection threw `QuotaExceededError` only on `inventory.items`: checkout displayed “Order o2 placed: $899.00.”, added an order and cleared the cart, while laptop stock remained 12. The supposedly recoverable memory fallback does not handle the common write-only failure. Similar swallowed failures exist at `js/cart.js:19` and `js/orders.js:19`.
2. **Medium: narrow-screen tables hide critical information behind horizontal scrolling.** `css/styles.css:57` switches tables to horizontal scroll, preserving the page width (390px document at 390px viewport) but producing a 725px inventory table in a 358px container. At initial scroll position stock/actions are offscreen; in the mobile cart, subtotal/total are clipped and Remove is offscreen. There is no visible scroll hint. Verified visually; content is scrollable, not permanently inaccessible.
3. **Medium: valid JSON with malformed records is not validated.** `js/storage.js:36` accepts any array. `[{}]` rendered a product with `$NaN`; `[null]` caused an uncaught “Cannot read properties of null (reading 'category')” from category processing (`js/app.js:134`). This was explicit storage-corruption fault injection, not a normal UI-created record. Orders likewise accept unvalidated arrays (`js/orders.js:28`); order corruption was not separately executed.
4. **Low: cart fractional quantities are silently truncated.** `js/cart.js:63` floors before checking validity. Entering `1.5` via the actual UI change handler changed two units to one with no error; product stock validation correctly rejected `1.5`. The cart should validate whole numbers consistently or explain normalization.
5. **Accessibility gaps (static markup review):** dialogs at `index.html:39`, `index.html:56`, `index.html:75` have headings but no `aria-labelledby`/`aria-label`. Generated row buttons at `js/app.js:107` repeat generic Edit/Delete names. Row buttons are small (`css/styles.css:39`), and low stock relies on red/bold quantities (`css/styles.css:40`). This is a spot check, not a full screen-reader/contrast audit.

Additional static maintainability observations: persistence wrappers are duplicated across three modules; `Cart.items()` reparses inventory separately per line and is repeatedly called during inventory rendering (`js/cart.js:44`, `js/app.js:99`), making larger inventories inefficient. No large-data performance benchmark was run. Cross-tab render hooks exist (`js/app.js:338`), but cross-tab checkout concurrency was not exercised.

## Executed verification

Command: `node quality-review/anthropic-cloud-sonnet-5.5-medium-probe.mjs` (completed successfully). Browser was closed in `finally`; a new temporary profile isolated data from user sessions. The probe was rerun once after adding validation/keyboard/corruption checks.

- Initial seed (10), add/edit/delete, multi-term search, cart add/change/remove, checkout total/stock/history, and reload persistence passed.
- Confirmed case-insensitive duplicate SKU rejection, blank SKU rejection, fractional inventory-stock rejection, excess cart quantity rejection, and zero quantity removal.
- User-controlled `<img ...>` name rendered literally, with zero injected image elements.
- Actual keyboard `/`, typed search, Escape-to-clear, modal focus on SKU, Escape dismissal/restoration to Add product, and ArrowUp/Tab cart quantity interaction worked. Modal trap cycling and a screen reader were not exhaustively tested.
- Cart totals reflected a later product-price edit; deleting its product cleared the active cart line and preserved the historic order snapshot.
- Tested normal browser clicks/keyboard for main controls; product fields, specific row actions and quantity edge values also used DOM assignments/dispatched events. These are scripted interaction checks, not all-human gestures.
- Storage-write fault and malformed-record faults reproduced the defects above. No normal-flow page errors were recorded; the `[null]` corruption produced the reported uncaught exception.
- **Supplied automated tests:** none found (no package manifest/test files). Historical RESULTS.md browser claims were not counted as current test execution.

## Screenshots inspected

Saved and actually viewed at desktop 1440×1000 and mobile 390×844, plus form/cart/history states:

- [Desktop inventory](anthropic-cloud-sonnet-5.5-medium-desktop.png)
- [Mobile inventory](anthropic-cloud-sonnet-5.5-medium-mobile.png)
- [Product form](anthropic-cloud-sonnet-5.5-medium-form.png)
- [Desktop cart](anthropic-cloud-sonnet-5.5-medium-cart.png)
- [Mobile cart](anthropic-cloud-sonnet-5.5-medium-mobile-cart.png)
- [Order history](anthropic-cloud-sonnet-5.5-medium-orders.png)
- [Probe and recorded outcomes](anthropic-cloud-sonnet-5.5-medium-probe.json)

Limitations: Chrome only; no exhaustive assistive-technology, contrast, large-data, concurrent-tab or crash-between-write audit. Git history inspected; historical T7 browser execution was not independently verified. Robustness faults used deliberate isolated storage manipulation; normal required flows passed.

```json
{"folder":"anthropic-cloud-sonnet-5.5-medium","scores":{"ux":3.5,"visual":3.5,"code":3.5,"spec":4.5,"robustness":2.5,"accessibility":3.5},"overall_100":73,"tasks":{"T1":"pass, including scaffold Git commit","T2":"pass","T3":"pass","T4":"pass","T5":"pass","T6":"normal-flow pass; storage-failure integrity defect","T7":"historical claim unverified; independent browser review executed"},"tests":"No supplied automated tests; isolated file:// Puppeteer probe passed normal flow and reproduced documented faults","comments":{"code_quality":"Readable module separation and safe DOM construction; duplicated persistence fallback and weak record validation need work.","ux":"Efficient desktop search and CRUD, but mobile tables hide stock/actions and cart total until panned.","business_rules":"All normal required flows pass; failed stock writes can still produce successful orders without stock deduction."}}
```
