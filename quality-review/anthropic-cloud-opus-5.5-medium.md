# anthropic-cloud-opus-5.5-medium

Reviewed 2026-10-01 by a fresh sequential subagent against `benchmark/tasks/00-project.md` and T1–T7. Application source unchanged. Actual `file://` Chrome session used an isolated temporary profile, closed in `finally`.

| Category | Grade /5 | Finding |
|---|---:|---|
| Code quality | 4.5 | Cohesive storage, inventory, cart and order modules, defensive copies, consistent result contracts, safe DOM construction and meaningful tests. Checkout rollback and object-as-set edge cases remain. |
| Business rules/spec | 4.5 | All required ordinary workflows verified, including stock depletion, cart persistence, immutable order snapshots, direct-file launch and Git task commits. Persistent failure during checkout can leave inconsistent state. |
| UX | 4 | Complete, discoverable desktop flows; helpful stock warnings, search shortcuts, confirmations and specific validation. Mobile inventory actions require sideways scrolling, and corrected fields retain stale errors until submit. |
| Accessibility | 4 | Native dialogs, linked labels/errors, live status messages, descriptive action names, visible focus and useful keyboard behavior. Mobile table navigation and small row controls limit usability; this was a spot check. |
| Visual | 3.5 | Clear blue/white hierarchy, consistent typography, restrained panels and readable desktop tables. Plain but coherent; mobile filters consume considerable vertical space and the wide table hides stock/actions. |
| Robustness | 3.5 | Validates quantities, rejects excess stock, backs up corrupt JSON and protects single writes. Checkout spans three keys and rollback can itself fail while the error claims nothing changed. |

Weighted overall: **82/100** using the common protocol. Scores are judgments of the supplied artifact, not model benchmark percentages.

**Code quality:** Well-separated vanilla JavaScript modules with explicit invariants and useful failure-path tests; harden multi-key checkout recovery and replace plain-object category sets.

**UX:** Efficient and clear on desktop, with strong validation, search and checkout feedback; mobile users must scroll sideways to reach essential row actions.

**Business rules/spec adherence:** Implements and passes the full normal T1–T6 flow, including persisted carts and stock/history checkout; the principal exception is inconsistent checkout state after sustained storage failure.

## Specification evidence

| Task | Status | Evidence |
|---|---|---|
| T1 scaffold/README/Git | Pass | HTML/CSS/JS structure and detailed README present. Actual folder Git history includes `f8ef7f6 Scaffold inventory website`. |
| T2 products/stock/persistence/seed | Pass | Eight products seeded and persisted on fresh direct-file launch; edited product survived reload. |
| T3 view/add/edit/delete | Pass | Created QA-001, edited name/price/stock, searched it, deleted it with confirmation. |
| T4 quick lookup | Pass | SKU search reduced table to one row; Enter opened that product. Filters and multiword lookup covered by supplied tests. Category edge defect below. |
| T5 cart | Pass | Added from product row, incremented/decremented, rejected invalid quantities, removed with quantity 0, showed $20.50 for two $10.25 units; cart survived reload. |
| T6 checkout/history/README | Pass with integrity caveat | Checked out one $10.25 unit, stock went 1→0, cart cleared and order persisted after reload. Deleting product left historical name/price intact. Failure injection found rollback defect below. |
| T7 cloud browser QA | Historical evidence; current QA performed | Git includes `b3653af Fix bugs found in browser testing`. Commit title alone does not prove historical thoroughness; this review independently exercised the browser. |

The seven task commits are present in local Git, ending in `b3653af`. No server, framework, runtime library or build step is required; classic script tags explicitly support direct-file loading (`index.html:169`).

## Browser verification and visual inspection

Reproducible [probe](anthropic-cloud-opus-5.5-medium-probe.mjs) and [captured results](anthropic-cloud-opus-5.5-medium-probe.json). Run: `node quality-review/anthropic-cloud-opus-5.5-medium-probe.mjs` from the comparison root.

- Fresh `file://` load: 8 seed products in memory and localStorage; no unhandled page errors.
- Ordinary workflow used actual browser button clicks, reloads and keyboard keys, with field values assigned through DOM input/change events. Created `Review <b>Product</b>`; HTML-like text rendered literally with no injected `<b>` element. Edited it to `Review Product Edited` at $10.25, added two units, verified $20.50 and persistence, and removed via quantity 0.
- Quantity 1.5 and 999 were refused without modifying the two-unit cart. Reduced product stock below the cart quantity: warning appeared and Checkout disabled; minus control reduced to available stock and checkout succeeded.
- Checkout note and order snapshot persisted. Stock reached zero; cart emptied. Deleted product while its completed order remained intact.
- Keyboard `/` focused search; Enter opened the unique SKU match; initial product-dialog focus was SKU; invalid submit focused SKU and displayed field errors; deletion initially focused Cancel; Escape closed the mobile dialog and restored Add product focus.
- Corrupt JSON was injected through browser evaluation: inventory became empty and the original `{broken` string was backed up under `.corrupt`. This validates recovery behavior, not user-facing recovery messaging.
- Category and persistent-write edge checks invoked the actual application APIs inside the browser; these were fault-injection/data-layer probes, not normal manual UI input or a naturally occurring quota failure.

Actually opened and visually inspected all five images:

- [Desktop, 1440×1000 viewport, full-page capture](anthropic-cloud-opus-5.5-medium-desktop.png): centered 960px content with clean section headings, clear search tools and legible rows. Some header wrapping and unused wide-screen space; cart/history are below inventory with header anchor links.
- [Mobile, 390×844 viewport, full-page capture](anthropic-cloud-opus-5.5-medium-mobile.png): no whole-document horizontal overflow, but 747px product table inside a 308px scrolling region; actions begin at x≈549, outside the screen. Filters stack with generous gaps and push inventory down the page.
- [Desktop form](anthropic-cloud-opus-5.5-medium-form.png): orderly labels and field layout; screenshot records errors persisting after corrected values were entered.
- [Checkout](anthropic-cloud-opus-5.5-medium-checkout.png): clear line total, note field, purchase consequence and primary action.
- [Mobile form](anthropic-cloud-opus-5.5-medium-mobile-form.png): fits viewport, strong focus ring, readable labels and accessible Cancel/Add actions.

## Most important findings

1. **Medium — persistent storage failure can leave checkout inconsistent and return a false assurance.** Confirmed by replacing `Storage.prototype.setItem` to fail from the third checkout write onward. Order history and stock writes succeeded; cart clearing and both rollback attempts failed. Stock remained 118 instead of 120, two units remained in cart, persisted orders increased from one to two while in-memory history stayed at one. The result still said “Nothing was changed.” See `js/orders.js:260` (three-step writes), `js/orders.js:278` (rollback), `js/orders.js:158` (rollback failures logged only), and `js/orders.js:96` (misleading message). This injected sustained failure is a corner case; normal checkout and the supplied isolated per-key failure tests passed. A single persisted state envelope or explicit recoverable transaction record would eliminate this inconsistency within localStorage constraints.
2. **Medium UX/visual — mobile stock and actions are hidden beyond the table viewport.** Confirmed at 390px. Responsive handling is only horizontal scrolling (`css/styles.css:462`, especially `:467`), while product actions remain at the end of the wide table (`js/app.js:145`). The page remains usable by scrolling, but common edit/add-to-cart actions are not visible with the product identity. A compact mobile row layout or more discoverable pinned actions would improve it.
3. **Low — valid category names matching Object.prototype properties vanish from category filters.** Browser API probe added category `constructor` successfully; `Inventory.getCategories()` omitted it. `js/inventory.js:404` uses `{}` as a set and `:407` checks inherited property truthiness. Use `Set` or a null-prototype dictionary. Ordinary category text and free-text search work.
4. **Low — stale validation remains after correction until resubmit.** Confirmed in the desktop form image: populated SKU/name/price retain “required”/invalid messages. Errors clear only when the modal opens or submits (`js/app.js:741`, `:757`); no field-change revalidation exists. This is confusing feedback, though valid submission succeeds.

Strongest positive: the separation of product/cart/order responsibilities is unusually coherent for a small direct-file app. Stock validation, history snapshots, safe text rendering, explicit error returns and defensive copies are consistently implemented rather than scattered across click handlers.

## Supplied tests

Executed from the application directory:

```text
node test/inventory.test.js    19/19 passed
node test/cart.test.js         13/13 passed
node test/orders.test.js       16/16 passed
Total                         48/48 passed
```

Tests use Node VM contexts and a fake localStorage with no dependencies. They meaningfully cover initialization, CRUD validation, search, quantity limits, defensive copies, cart pruning, persisted state, order snapshots, corrupt JSON, stock batch atomicity and individual checkout-write failures. They do not cover DOM behavior, responsive layout, actual cross-tab concurrency or rollback writes failing after an earlier successful checkout write.

Limitations: one Chromium browser and two viewports; no screen reader or formal contrast audit, no actual touch-device interaction, cross-tab events/races not exercised, no crash during checkout, no natural quota exhaustion. Additional malformed records and enormous money totals were read as code/test considerations rather than independently reproduced. Normal user browser state was untouched; only isolated review profile storage changed.

```json
{"folder":"anthropic-cloud-opus-5.5-medium","scores":{"ux":4,"visual":3.5,"code":4.5,"spec":4.5,"robustness":3.5,"accessibility":4},"overall100":82,"tasks":{"T1":"pass","T2":"pass","T3":"pass","T4":"pass","T5":"pass","T6":"pass_with_storage_integrity_caveat","T7":"historical_commit_plus_current_browser_review"},"tests":{"passed":48,"failed":0,"kind":"Node VM data-layer tests"},"browser":{"directFile":true,"desktop":"1440x1000","mobile":"390x844","screenshotsViewed":5,"normalWorkflowPassed":true,"pageErrors":0},"comments":{"code":"Cohesive modules, explicit invariants, safe rendering and meaningful tests; checkout rollback and object-as-set edges need hardening.","ux":"Efficient desktop flows and feedback; mobile users must scroll sideways to reach row actions.","businessRules":"Full ordinary T1–T6 flow verified; sustained storage failure can leave deducted stock and a recorded order with an uncleared cart."},"topDefects":["Persistent checkout failure can defeat rollback while claiming nothing changed","Mobile table hides stock and actions horizontally","Prototype-named categories omitted","Corrected inputs retain stale validation errors"],"limitations":["Single Chromium browser","No actual cross-tab race test","Storage failure injected, not natural quota exhaustion","Accessibility spot check only"]}
```
