# zai-cloud-glm-5.3-flash quality review

Reviewed 2026-10-01 against `benchmark/tasks/00-project.md` and T1–T7. All 3,595 implementation/test lines, README, RESULTS.md and Git history inspected. RESULTS.md is historical evidence, not a substitute for the checks below. No application files changed; no CI/CD created.

| Category | Grade /5 | Finding |
|---|---:|---|
| Business rules/spec | 4 | Direct-file operation, CRUD, search, persistent cart and stock-decrementing checkout/history all work normally. A cart refresh defect obstructs repeat additions; write failures can break order-history integrity. |
| Code quality | 3.5 | Separate store/UI, safe text rendering, structured validation and meaningful dependency-free tests; ignored persistence outcomes and incomplete render dependencies cause real defects. |
| Accessibility | 3.5 | Labels, scoped table headers, descriptive row controls, status region and native dialogs help; cart rerenders lose keyboard focus and dialogs have no accessible names. |
| UX | 3 | Clear desktop CRUD, search, validation and checkout; stale cart button state, distant feedback and mobile horizontal scrolling hinder recovery and efficiency. |
| Visual design | 3 | Consistent typography, restrained blue actions, aligned numbers and legible stock badges; narrow desktop column and table-only mobile layout limit polish. |
| Robustness | 2.5 | Good normal validation, live cart reconciliation and order snapshots, but mid-session storage failures are silently accepted and checkout writes are not atomic. |

Weighted overall: **66.5/100** using the common protocol; individual grades are the primary judgment.

**Code quality:** Clear store/UI separation and 71 meaningful passing checks make this maintainable for its scope. However, boolean save results are ignored, and cart-only rerenders fail to update dependent inventory controls or preserve focus.

**UX:** Core desktop actions are straightforward, with specific field errors and confirmation dialogs. A disabled Add-to-cart button can stay disabled after removing its cart item; mobile users must scroll horizontally to reach core inventory actions.

**Business rules/spec adherence:** All requested T1–T6 features are present and the normal flow is verified. Stock limits, repricing, deletion reconciliation and frozen order lines work, while a failed order-history save can still consume stock and announce success.

Strongest positive: the data layer reconciles cart contents against current stock/prices and keeps historical order snapshots independent of later catalogue edits (`js/store.js:463`, `js/store.js:766`), with useful validation and coverage.

## Task status

| Task | Status | Evidence |
|---|---|---|
| T1 scaffold/Git/README | Pass | Vanilla scripts and CSS; useful README; seven commits from scaffold `b078fe5` through QA fix `6dbcd68`. |
| T2 seed/persistence | Pass with failure caveat | Ten seeded products, normal changes/reloads persist. Mid-session failed writes are falsely reported as successful. |
| T3 view/add/edit/delete | Pass | Created, edited, searched and deleted review product via browser controls; inline required-name validation verified. |
| T4 lookup | Pass | Typed multiword search returns the intended row; category behavior covered by supplied tests. |
| T5 persistent cart | Pass with defect | Add, increment, typed quantities, removal, zero-removal and reload work; inventory Add-to-cart state remains stale after cart-only mutations. |
| T6 checkout/history | Pass with integrity caveat | Normal checkout decrements stock to zero, empties cart, stores history and survives reload; selective history-write failure loses the new order. |
| T7 browser QA | Historical evidence; current check performed | Git QA-fix commit and RESULTS.md claim previous browser QA. Supplied Node UI tests use a DOM stub; current review independently ran Chrome. |

## Confirmed defects and precise source references

1. **High: partial checkout falsely succeeds.** With only `inventory.orders.v1` writes throwing `QuotaExceededError`, checkout #1002 reduced mouse stock from 42 to 41 and cleared the cart, announced “Order #1002 placed”, but history still contained only #1001 after reload. `js/store.js:789` performs three independent writes, ignores their results and returns success at `js/store.js:792`; `saveOrders` returns false on failure at `js/store.js:732`. This is a browser-reproduced injected failure, not an observed environmental quota issue.
2. **High: failed product creation reports success and immediately disappears.** After initial storage availability was established, blocking subsequent writes produced “Added ‘Lost Widget’” without a product in the UI/store, even before reload, and no warning. `js/store.js:241` saves a memory fallback but `js/store.js:215` continues preferring old persistent data; `js/store.js:307` ignores the failed write and returns `ok: true`. The warning is only decided at startup (`js/app.js:815`).
3. **Medium: removing a full cart line leaves inventory Add-to-cart disabled.** Fill the review item's cart to its five-unit stock limit, refresh the inventory rendering, then Remove. The cart empties but the inventory button stays disabled with “Every unit is already in the cart”; typing a search refreshes it. `js/app.js:666` and `js/app.js:677` call only `renderCart`; stock-limit button state is computed in `buildRow` at `js/app.js:347`. Quantity changes use the same partial refresh (`js/app.js:636`, `js/app.js:650`).
4. **Medium: cart keyboard focus is destroyed.** Focus the increment button and press Enter: quantity changes from 1 to 2, then `document.activeElement` becomes BODY. `js/app.js:687` replaces the complete cart body without restoring focus. This makes repeated keyboard adjustments cumbersome. Product-table rerendering has the same architectural risk (`js/app.js:405`), but the cart case was directly reproduced.
5. **Medium visual/UX: mobile hides principal controls and values.** At 390×844, the 732-pixel inventory table sits in a 356-pixel scroll container. Names wrap over multiple lines while prices/actions are initially offscreen; the cart Remove action is also offscreen. The page itself stays 390 pixels wide, so content is reachable through table scrolling. `css/styles.css:150` only enables overflow; the mobile rule at `css/styles.css:440` only reduces cell padding. No persistent horizontal-scroll cue or mobile row presentation is provided.
6. **Small accessibility gap: unnamed dialogs.** Form, delete and checkout dialogs are created without `aria-labelledby` or `aria-label` (`js/app.js:119`, `js/app.js:210`, `js/app.js:704`). The native modal focuses the Name input and Escape correctly closes it and restores Add-product focus, but the heading is not linked to the dialog's accessible name.

## Browser observations and verification

Actual `file://.../zai-cloud-glm-5.3-flash/index.html` in cached Puppeteer/Chrome with a unique `/tmp/quality-cloud-glm-*` profile; browser closed in `finally`. Probe: [script](zai-cloud-glm-5.3-flash-probe.mjs), [raw results](zai-cloud-glm-5.3-flash-probe.json).

- Normal flow verified: ten seeds → create Review Widget (5 × $12.50) → type search → edit name/price to $15 → add/increment cart → reject fractional 1.5 and preserve 2 → clamp excessive 999 to 5 → remove → re-add → edit stock to 1 and price to $20 → cart reconciles to 1 × $20 → reload preserves cart → confirm checkout → stock 0, empty cart, order #1001 for $20 → reload preserves history → delete product while history remains.
- Additional browser checks: Name error has `aria-invalid` and receives focus; real Escape returns focus to Add product; real Enter activates cart increment but loses focus; zero quantity removes a line; deleting a product currently in the cart removes its cart line. No uncaught page errors recorded.
- Field filling and quantity change dispatch are scripted DOM interactions; buttons use Puppeteer clicks, search uses typed input, and Escape/Enter use genuine browser keyboard events. Failed writes were injected by temporarily overriding `Storage.prototype.setItem` in the isolated profile.
- Desktop has clear product/cart/history grouping, consistent blue primary buttons, restrained borders, legible totals and stock badges. Cart/history require scrolling below the ten-product table; feedback appears above the inventory, distant from lower-page actions. Modal spacing and input readability are good.
- Screenshots saved **and actually viewed**: [desktop 1440×1000](zai-cloud-glm-5.3-flash-desktop.png), [mobile 390×844](zai-cloud-glm-5.3-flash-mobile.png), [form](zai-cloud-glm-5.3-flash-form.png), [checkout](zai-cloud-glm-5.3-flash-checkout.png), [history](zai-cloud-glm-5.3-flash-history.png), [cart](zai-cloud-glm-5.3-flash-cart.png), [mobile cart](zai-cloud-glm-5.3-flash-mobile-cart.png). Full-page screenshots retain the specified viewport widths.

## Supplied tests and limits

`node test/store.test.js`: **44/44 pass**, exit 0. `node test/app.test.js`: **27/27 pass**, exit 0. Store coverage includes validation, cart normalization, order snapshots, corrupt-record reset and storage blocked at startup. UI coverage includes CRUD, search/category regressions, cart, checkout and history. The minimal DOM stub has no real focus or layout and misses the browser defects above; blocked-at-startup tests do not cover a save failing after a successful availability probe. Safe `textContent` rendering is used (`js/app.js:22`); no application framework/runtime dependency is present.

No screen-reader session, exhaustive contrast audit, alternate-browser check, large-data performance benchmark or cross-tab race test performed. Corrupt-storage behavior was inspected and exercised by supplied tests, not separately injected into this browser session. Automated checks are evidence of their actual covered cases, not a certification. Application working tree remains unchanged (the pre-existing untracked RESULTS.md remains).

```json
{"folder":"zai-cloud-glm-5.3-flash","scores":{"ux":3,"visual":3,"code":3.5,"spec":4,"robustness":2.5,"accessibility":3.5},"overall100":66.5,"comments":{"code":"Clear store/UI separation, safe rendering and 71 passing tests; ignored persistence outcomes and incomplete render dependencies cause defects.","ux":"Straightforward desktop flows, but stale disabled cart actions, lost keyboard focus and mobile horizontal scrolling hinder use.","business":"All requested features work normally; stock/cart reconciliation is sound, but failed history writes can consume stock without retaining the order."},"tasks":{"T1":"pass","T2":"pass_with_persistence_failure_caveat","T3":"pass","T4":"pass","T5":"pass_with_stale_button_defect","T6":"pass_with_write_failure_integrity_caveat","T7":"historical_evidence_and_current_browser_check"},"tests":{"store":{"passed":44,"failed":0},"app":{"passed":27,"failed":0},"browser":"normal_flow_and_targeted_failure_probes_executed","screenshotsViewed":true},"limits":["No screen reader or exhaustive contrast audit","No cross-tab concurrency or large-data benchmark","Single Chromium browser","Corrupt storage covered by supplied tests, not browser injection"]}
```
