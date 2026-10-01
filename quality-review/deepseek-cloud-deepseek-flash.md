# deepseek-cloud-deepseek-flash — quality review

Reviewed 2026-10-01 against `benchmark/tasks/00-project.md` and T1–T7. Source unchanged. A fresh, isolated Chrome profile opened the real `file://` entry point. Scores use the shared 1–5 rubric; the weighted overall is secondary.

| Category | Grade / 5 | Finding |
|---|---:|---|
| UX | 3.5 | Clear row actions, useful search/category controls, explicit destructive-action and checkout confirmations, actionable stock feedback. Cart is below the entire inventory, and the mobile product form clips the price field. |
| Visual design | 3.5 | Restrained and consistent dark appearance, clear type hierarchy, legible product metadata and orderly borders. Main list wraps neatly on mobile; the quantity/price form row does not. |
| Code quality | 4.5 | Cohesive storage/items/cart/orders modules, pure lookup/pricing/checkout planning, defensive normalization, copied state, safe DOM rendering, substantive tests. Whole-page rerenders and duplicated helpers add maintenance cost; persistence coordination remains imperfect. |
| Business rules / spec | 4.5 | All required normal workflows work directly from the file, including correct stock decrement and durable receipt snapshots. Partial storage failure can leave checkout data inconsistent. |
| Robustness | 3 | Defensive reads, bounded cart quantities and visible write failures are good. Multi-key checkout is not atomic, an unrelated successful save erases an unresolved failure warning, and corrupt data silently appears empty. |
| Accessibility | 4 | Native modal dialogs, labelled inputs, named row actions, skip link, visible focus and status announcements. Search shortcut, Escape and stock-limit focus behavior passed a keyboard spot check. Mobile form clipping remains a barrier. |
| Weighted overall | **78.5 / 100** | 25% UX, 15% visual, 20% code, 25% spec, 10% robustness, 5% accessibility. |

**Code quality:** Strong separation of domain state and UI, with pure calculation functions and a meaningful dependency-free regression suite; checkout persistence and global warning state need stronger coordination.

**UX:** Efficient, understandable desktop inventory work with sensible confirmations and useful empty/error states; mobile price entry and distant cart placement weaken the flow.

**Business rules/spec adherence:** The vanilla, localStorage, direct-file specification and T1–T6 normal behavior are implemented and verified, including immutable historical sale details; failed writes can break the stock-to-receipt relationship.

## Task status

| Task | Result | Evidence |
|---|---|---|
| T1 scaffold, README, Git/commit | Pass | Dedicated Git repository; scaffold commit `637ca34`, subsequent task commits through `26ad859`; README and conventional HTML/CSS/JS structure present. |
| T2 seeded persistent products | Pass | Eight samples on first run; edited stock persisted after reload. Supplied tests also verify intentionally empty storage is not reseeded. |
| T3 view/add/edit/delete | Pass | Created Audit Widget, edited name and price, removed it after a sale; changes and receipt independence verified. |
| T4 quick lookup | Pass | Keyboard `/` focuses search; `cable usb` finds USB-C Cable; Escape restores the view. Category rules and accent/token behavior covered by supplied tests. |
| T5 persistent cart/quantities/removal/total | Pass | Real row clicks, stepper changes, remove, accurate $6.50 total, reload with quantity 3 preserved. |
| T6 stock/history/README | Pass with reliability caveat | Checkout sold 2 units at $3.25, stock 5→3, cleared cart and kept receipt across reload/product deletion; README describes checkout. Partial-write fault breaks durable consistency. |
| T7 cloud browser QA/fixes | Evidence present, historical execution unverified | Final commit addresses focus/overflow and supplied tests cover regressions. This review ran actual Chrome; historical browser work is not established by a test file or commit message alone. |

## What was actually verified

Browser command: `node quality-review/deepseek-cloud-deepseek-flash-probe.mjs`. It used cached Puppeteer and installed Google Chrome, a unique `/tmp/quality-deepseek-cloud-*` profile, and closed the browser in `finally`. No page exceptions occurred. JSON evidence: [probe results](deepseek-cloud-deepseek-flash-probe.json).

Normal flow used genuine browser clicks for opening/submitting forms, editing, adding/removing cart lines, stepper changes, checkout/confirmation and deletion. Product form text/number values were partly assigned through DOM evaluation, with real submit clicks. Search used keyboard input. Reload verified product/cart/order persistence. The sold product's receipt remained after product deletion.

Additional probes used **scripted setup or DOM-dispatched input changes**, not manual typing: cart excess 99 capped to stock 2 with an explanation; zero reverted to 2; fractional 1.9 became 1 without explanatory feedback. Reducing stock below an existing cart quantity blocked checkout with an actionable message, as did deleting the product. A genuine Enter on the `+` button at the stock limit moved focus into its quantity input. Native Escape closed the add dialog.

**Fault injection, clearly separate from ordinary use:** overriding `Storage.prototype.setItem` to reject only `inventory.items` reproduced partial checkout. Inventory became 22 in memory but remained 24 on disk while the new receipt persisted and cart cleared. The app initially showed its failure banner; adding another product to the cart, which saved successfully, hid that warning without repairing stock. Reload restored stock 24 while keeping the receipt, with no warning. Replacing the inventory blob with `{oops` produced an empty inventory without throwing, preserved the malformed blob, and displayed no warning.

## Visual evidence

Screenshots were captured at desktop **1440×1000** and mobile **390×844** viewport sizes and **actually viewed**; full-page captures extend below those heights. The OS/browser selected the supported dark theme.

- [Desktop inventory](deepseek-cloud-deepseek-flash-desktop.png): centered 960px content, strong title and primary action, consistent neutral panels, clear names/categories/stock/prices. Eight sample rows already put the cart below the first viewport.
- [Desktop populated cart](deepseek-cloud-deepseek-flash-cart.png): readable controls and total, with checkout and clear actions grouped coherently.
- [Mobile inventory and receipt](deepseek-cloud-deepseek-flash-mobile.png): stacked filters, sensible wrapping, no document-wide horizontal overflow (390px content width). The receipt's subtotal wraps awkwardly to a separate left-side line; the inventory creates a long scroll to checkout/history.
- [Mobile add form](deepseek-cloud-deepseek-flash-mobile-form.png): focused name and clearly labelled fields, but unit price extends beyond the modal's right edge and is clipped. The dialog is 352px wide with 424px scroll width; the price field ends at x=444 on a 390px viewport.

## Strongest positive

The app models the distinction between a live cart and a historical receipt correctly: cart lines reference current inventory, receipts copy sale-time names/prices/quantities, and checkout blocks missing or insufficient stock. See `deepseek-cloud-deepseek-flash/js/cart.js:238`, `js/orders.js:80`, `js/orders.js:262`, and safe text rendering in `js/app.js:137`. The supplied suite tests these behaviors and the real-browser normal flow confirmed them.

## Main defects and evidence

1. **Partial checkout persists inconsistent records (confirmed fault injection).** `deepseek-cloud-deepseek-flash/js/orders.js:340` applies inventory, cart and receipt writes separately; `js/orders.js:362` proceeds to clear the cart after the stock mutation, and `js/orders.js:370` records the receipt even when an earlier write was rejected. It reports failure but has no transaction/recovery mechanism. A single state envelope or a recoverable pending transaction would preserve the relationship between sale and stock.
2. **Unrelated success clears an unresolved save failure (confirmed fault injection).** `deepseek-cloud-deepseek-flash/js/app.js:366` clears the warning whenever any store reports `saved:true`. After a failed inventory write, saving the cart hides the warning without persisting the unsaved inventory. Keep failure/dirty state per collection or retry all unsaved state before clearing it.
3. **Mobile unit-price input is clipped (confirmed visual and geometry evidence).** `deepseek-cloud-deepseek-flash/css/styles.css:632` keeps quantity/price side by side; `css/styles.css:637` lets each flex field retain its intrinsic minimum width. Add shrink constraints (`min-width:0`/input width) or stack the fields at narrow widths. Main page responsiveness otherwise passed the tested width.
4. **Corrupt stored data silently appears empty (confirmed injected malformed blob).** `deepseek-cloud-deepseek-flash/js/storage.js:46` reduces parse/read failures to null, and `js/storage.js:98` reduces that to an empty list without a status channel. The raw blob is preserved initially, which is good, but the user receives neither an explanation nor recovery guidance; a subsequent mutation can replace it.
5. **Cart reachability declines with catalog size (observed layout, static scalability concern).** `deepseek-cloud-deepseek-flash/index.html:57` places the full inventory before the cart at `index.html:72`; there is no jump link, sticky cart summary or separate view. Even the sample inventory places cart controls below the desktop fold and well down mobile. This is UX polish, not an unrequested specification feature.

Secondary maintenance observations: `js/app.js:341` rebuilds inventory and `js/app.js:362` rebuilds order history on every search/cart change; this is fine for the supplied small data set but scales poorly. Currency/quantity normalization is duplicated across stores. Monetary values are rounded with floating point rather than held in integer cents; normal prices passed, extreme/precision-limit amounts were not tested. No cross-tab synchronization probe was run.

## Supplied tests and limitations

`node deepseek-cloud-deepseek-flash/test/smoke.mjs` exited 0: **708 individual checks passed**, across **72 sections**. The suite uses `node:vm` and a bespoke DOM/localStorage stub; coverage includes wiring/assets, first-run/empty/corrupt/blocked storage, CRUD, search, focus bookkeeping, cart limits and persistence, sale snapshots and partial-write warning reporting. It is substantial behavior coverage but cannot establish layout, native focus, or genuine browser compatibility; the mobile form defect passed it.

Scope is one installed Chrome version, dark appearance, one desktop width and one mobile width. No Safari/Firefox, screen-reader session, systematic contrast audit, cross-tab conflict, large-catalog performance or light-theme screenshot review. Fault injection is not evidence that real quota failures are common; it demonstrates the application's behavior if a write fails. Source was read and task history inspected, but historical T7 browser activity was not independently reconstructed. App source, Git history, dependencies and CI/CD were not changed.

```json
{"folder":"deepseek-cloud-deepseek-flash","scores":{"ux":3.5,"visual":3.5,"code":4.5,"spec":4.5,"robustness":3,"accessibility":4},"overall100":78.5,"tasks":{"T1":"pass","T2":"pass","T3":"pass","T4":"pass","T5":"pass","T6":"pass_with_reliability_caveat","T7":"evidence_present_historical_browser_execution_unverified"},"tests":{"command":"node deepseek-cloud-deepseek-flash/test/smoke.mjs","passed":708,"failed":0,"sections":72,"kind":"node_vm_dom_stub"},"browser":{"directFile":true,"normalFlow":"passed","desktop":"1440x1000","mobile":"390x844","screenshotsViewed":true,"pageErrors":0},"comments":{"code":"Cohesive modules, pure domain functions, safe rendering and substantive regression coverage; persistence coordination remains imperfect.","ux":"Clear inventory actions and feedback; mobile price clipping and long scroll to cart weaken usability.","business":"Required direct-file CRUD/search/cart/checkout/history flows pass; rejected writes can leave receipt and stock inconsistent."}}
```
