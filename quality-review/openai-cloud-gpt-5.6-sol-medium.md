# openai-cloud-gpt-5.6-sol-medium quality review

Reviewed 2026-10-01 against `benchmark/tasks/00-project.md` and T1–T7. Fresh sequential reviewer; inspected the complete 974-line JavaScript, 647-line CSS, 152-line HTML, README, task commits, and historical RESULTS. Application source was not modified. Browser automation used the browser CLI skill's interaction principles and the protocol's cached Puppeteer with a unique temporary Chrome profile, actual `file://` URL, and browser closure in `finally`.

| Category | Grade / 5 | Assessment |
|---|---:|---|
| UX | 3.5 | Straightforward CRUD, live multi-term search, clear totals and forms. Quantity correction silently restores the previous value for sighted users; cart updates lose keyboard focus. Mobile checkout requires scrolling past all inventory. |
| Visual design | 4 | Consistent green/neutral palette, readable hierarchy, restrained borders and shadows, clear price/stock columns. Mobile cards and form fit cleanly; header and tall product rows use considerable vertical space. |
| Code quality | 4 | Cohesive InventoryStore/CartStore/OrderStore APIs, normalization, DOM-safe rendering and delegated events. One large script couples storage, domain operations and full DOM rendering; persisted inventory receives weaker validation than new products. |
| Business rules/spec | 4.5 | All T1–T6 core behavior verified, including current-price cart totals, stock reconciliation, immutable historical snapshots and direct-file persistence. Some data-integrity guarantees weaken with malformed stored data. |
| Robustness | 3.5 | Rejects invalid quantities, handles unavailable items, and successfully rolled stock back after an injected order-write failure. Read-time inventory schema validation and reliable recovery from corrupt data remain gaps. |
| Accessibility | 4 | Labeled controls, native modal, initial focus, Escape/return focus, product-specific action names and live announcements. Quantity changes remove the active control, and small row actions offer limited touch area. |

Weighted overall: **79/100**. Weights: UX 25%, visual 15%, code 20%, spec 25%, robustness 10%, accessibility 5%. Scores are artifact judgments, not model capability or benchmark pass percentages.

**Code quality:** Clear store boundaries, explicit normalization and safe `textContent` rendering make this maintainable for a small vanilla application. The main weaknesses are inconsistent validation on persisted reads and full cart replacement that disrupts focus.

**UX:** Efficient desktop inventory/cart layout and a clear modal support all normal tasks. Error feedback should also be visible, keyboard focus should survive quantity edits, and mobile users need a direct way to reach their cart.

**Business rules/spec adherence:** Meets the stated framework-free, direct-file, localStorage, inventory management, lookup, cart and checkout requirements. Stock, price and order history remained consistent through the exercised normal workflows and failed checkout save.

## Requirement verification

| Task | Status | Current evidence |
|---|---|---|
| T1 scaffold/README/Git | Pass | Project runs without dependencies; actual Git repository with scaffold commit `0ec1c78` and successive task commits. |
| T2 sample stock/persistence | Pass | First open seeded five products / 128 units; inventory persisted through reloads. |
| T3 view/add/edit/delete | Pass | Created Review Product, edited name/stock/price, deleted with confirmation; persistent source and UI agreed. |
| T4 lookup | Pass | Typing `rev edited` returned the one matching edited item; clear restored all results. Source supports name, SKU and category with all query terms required. |
| T5 persistent cart | Pass | Added two products, changed quantity to three, removed a line, verified $30.75 and cart persistence on reload. |
| T6 checkout/history | Pass | Price changed from $10.25 to $12 and stock from five to two; cart became two units/$24. Checkout deducted stock to zero, cleared cart and preserved $24 history after reload, later price edit and deletion. README describes checkout/storage accurately. |
| T7 cloud browser QA | Historical evidence, not independently proven | RESULTS claims Playwright/axe/html-validate and commit `0ee5d91` contains accessibility fixes. No saved runnable test suite/logs supplied. This review independently exercised the current site in Chrome. |

## Confirmed findings and source evidence

1. **Quantity editing loses focus, including genuine keyboard use.** Focusing the cart quantity and pressing ArrowUp changed quantity 1→2 but moved `document.activeElement` to BODY. The following Tab returned to the recreated quantity input. Scripted zero/excess/fractional changes also discarded focus. `js/app.js:616` removes every cart child; `js/app.js:907` and `js/app.js:916` invoke rerender after invalid and valid changes. This makes repeated keyboard adjustment and correcting mistakes unnecessarily difficult.
2. **Most status/error feedback is invisible to sighted users.** Entering 0, 99 or 1.5 for a stock-five product restored the prior quantity of three and placed the explanation only in `#app-status`. The element is explicitly visually hidden at `index.html:144` / `css/styles.css:581`; the message path is `js/app.js:907` and `js/app.js:755`. Reaching the stock limit also uses this hidden status (`js/app.js:868`). Checkout failures and product-form failures correctly have visible alerts, so the weakness is inconsistent feedback rather than a complete absence of error handling.
3. **Mobile cart requires substantial scrolling.** At 390×844 with five samples, the cart begins at document y≈1341px, below the complete inventory list; no cart shortcut or floating count is present. `index.html:54` places cart after inventory; `css/styles.css:639` converts to one column and disables stickiness. This is a workflow-efficiency issue, not horizontal overflow: measured document width was exactly 390px.
4. **Persisted inventory bypasses product schema validation.** `js/app.js:78` checks only that JSON is an array, and `js/app.js:84` largely copies each entry, whereas normal writes validate stock/price at `js/app.js:113`. Browser-injected string stocks `"5"` and `"6"` yielded the visible total **“056 units in stock”** because `js/app.js:480` concatenates them. This requires malformed/externally modified storage; normal UI writes produced valid data. Invalid JSON/order data similarly returns empty collections with console warnings (`js/app.js:99`, `js/app.js:380`); recovery has no visible explanation or backup (static finding).

Strongest positive: checkout and cart maintain meaningful domain consistency. `js/app.js:569` reconciles cart stock and removed products, `js/app.js:403` revalidates checkout, and `js/app.js:319`/`js/app.js:434` store historical snapshots. An injected order-save quota failure after the inventory write left all original inventory/cart/history intact and displayed a visible failure message. Rollback is best effort across three localStorage keys (`js/app.js:386`, `js/app.js:440`), not an atomic storage transaction; simultaneous tabs and rollback failures were not exercised.

## Executed checks and limitations

- `node quality-review/openai-cloud-gpt-5.6-sol-medium-probe.mjs` completed successfully, including the full direct-file flow above. No uncaught page errors. The probe was rerun once to capture focus immediately after a genuine ArrowUp keypress.
- UI clicks and real search typing exercised primary controls. Most form values and selected quantity changes used DOM assignments plus normal submit/change handlers; this was not an entirely manual mouse/keyboard walkthrough.
- Rejected zero, excess and fractional cart quantities; kept prior saved quantity. Lowering product stock clamped the cart, updating price recalculated totals, and deleting a cart product removed its line. Zero-stock checkout result disabled Add to cart.
- Native modal focused product name; Escape closed it and returned focus to Add product. Other focus tests are described above. No screen reader, comprehensive contrast audit or WCAG certification performed.
- Injected an `inventory.orders` setItem failure: inventory and cart unchanged, prior history preserved, visible “The purchase could not be saved. No stock was changed.” Tested ordinary rollback only; no cross-tab or all-writes-fail scenario.
- A product name containing `<img src=x onerror="window.auditXss=1">` rendered as literal text, created no image and executed no script. Confirmed `textContent` rendering at `js/app.js:520`, `js/app.js:637` and `js/app.js:718`.
- `node --check openai-cloud-gpt-5.6-sol-medium/js/app.js` passed. No supplied test files/package/test command found, so no existing automated suite was available to execute. Historical claimed QA was not counted as current execution.
- All source files were inspected. Git status contained only the already-untracked RESULTS.md; review did not edit application code or enable CI/CD. No other browser engines, large inventory stress tests or device touch hardware tested.

## Visual evidence

Actually viewed desktop, mobile, mobile modal, populated cart and completed-order screenshots. Desktop has a balanced two-column layout, aligned values/actions and legible typography. Mobile has no horizontal overflow and a well-fitted single-column modal; product rows become tall and Add product wraps to two lines. The order history preserves a readable product/quantity/total snapshot.

- [Desktop, 1440×1000 viewport](openai-cloud-gpt-5.6-sol-medium-desktop.png)
- [Mobile, 390×844 viewport](openai-cloud-gpt-5.6-sol-medium-mobile.png)
- [Mobile product form](openai-cloud-gpt-5.6-sol-medium-mobile-form.png)
- [Populated cart](openai-cloud-gpt-5.6-sol-medium-cart.png)
- [Completed order](openai-cloud-gpt-5.6-sol-medium-history.png)
- [Reproducible browser probe](openai-cloud-gpt-5.6-sol-medium-probe.mjs) and [captured results](openai-cloud-gpt-5.6-sol-medium-results.json)

```json
{"folder":"openai-cloud-gpt-5.6-sol-medium","scores":{"ux":3.5,"visual":4,"code":4,"spec":4.5,"robustness":3.5,"accessibility":4},"overall100":79,"tasks":{"T1":"pass","T2":"pass","T3":"pass","T4":"pass","T5":"pass","T6":"pass","T7":"historical_claim_and_fix_commit_only"},"supplied_tests":"none","browser_probe":"completed; core flows and ordinary failed-write rollback passed; focus, hidden-feedback and malformed-stock defects confirmed"}
```
