# Claude Fable 5.1 high — quality review

Reviewed 2026-10-01 against `benchmark/tasks/00-project.md` and T1–T7. This reviews the supplied artifact, not the model's historical performance. Application source was left unchanged.

## Scores

| Category | Score / 5 | Assessment |
|---|---:|---|
| UX | **4.5** | Clear management and purchasing flows, specific validation, useful feedback, and careful focus restoration. Long mobile inventory and small row controls are the principal everyday friction. |
| Visual | **4.0** | Coherent, restrained table-and-card design with readable typography, aligned numbers, distinct actions and stock badges. Mobile layouts work, although the hierarchy is utilitarian and vertically expensive. |
| Code quality | **4.5** | Strong separation of storage, inventory, cart, orders, formatting and search; safe text rendering and explicit result contracts. The 934-line UI module and repeated persistence scaffolding add maintenance weight. |
| Business rules/spec adherence | **4.5** | All requested functional deliverables work on the normal direct-file path, including persistent stock and historical order snapshots. Checkout can leave an invalid history entry under a compound write failure. Git history was not supplied. |
| Robustness | **3.5** | Good validation, integer-cent money, damaged-data backup and ordinary failed-save behavior; two confirmed storage-failure boundaries remain. |
| Accessibility | **4.5** | Labels, native dialogs, semantic table headings, descriptive row actions, status regions, visible focus and deliberate post-action focus are strong. Mobile controls are only 31px high; assistive-technology behavior was not exhaustively tested. |
| **Weighted overall** | **86.5 / 100** | UX 25%, visual 15%, code 20%, business rules/spec 25%, robustness 10%, accessibility 5%. |

**Code quality:** Well-defined domain APIs, isolated persistence, exact cent conversion and dependency-free tests make this easy to reason about. The principal correctness weakness is checkout state split across three storage keys without recoverable transaction state.

**UX:** A straightforward, consistently labeled interface supports the complete workflow with helpful error messages and sensible focus destinations. Mobile retains all actions, but twelve expanded product cards make browsing and reaching the cart laborious without the header shortcut.

**Business rules/spec adherence:** The requested vanilla JavaScript, direct-file, localStorage inventory/cart/checkout/history behavior is present and verified. Ordinary stock constraints and historical snapshots are correct; the failure findings concern exceptional persistence conditions, not a broken normal purchase flow.

## Specification status

| Task | Status | Evidence |
|---|---|---|
| T1 — scaffold, README, Git | **Scaffold/README pass; Git unverified** | HTML/CSS/JS structure and detailed README supplied. No `.git` directory; `git rev-parse --show-toplevel` exits 128. Historical initialization and commits cannot be verified. |
| T2 — sample inventory and persistence | **Pass** | Fresh `file://` load seeded 12 products; changes persisted through reload. |
| T3 — view/add/edit/delete | **Pass** | Created, edited and deleted a product through visible controls; deletion persisted. Required-field errors and first-invalid-field focus verified. |
| T4 — quick lookup | **Pass** | Typing `cafe qafable` found `Café Review Widget`, SKU `QA-FABLE`, through accent/punctuation-insensitive search. Category/status filters are implemented and covered by supplied search tests. |
| T5 — persistent cart | **Pass** | Add, +/−, typed quantity, remove, totals and reload persistence verified. Invalid zero, fractional and excess quantities were rejected without changing the cart. |
| T6 — checkout, stock, history, README | **Pass on normal flow; failure-handling caveat** | Three units at $12.34 produced $37.02, stock changed 5→2, cart emptied, history persisted and retained original product details after later edit/deletion. README documents checkout. Compound failure can leave a phantom order. |
| T7 — cloud browser QA | **Historical claims not independently verifiable** | `RESULTS.md` reports prior browser QA and fixes. This review independently exercised Chrome; supplied Node tests do not prove the historical T7 process or commits occurred. |

No penalty is assigned for absent authentication, server, payment integration, framework, export, advanced reporting or deployment; none were requested.

## Visual and interaction assessment

At **1440×1000**, a centered inventory table uses a strong page title, clear Products heading, prominent Add product button, full-width search/filter row, monospace SKUs and right-aligned prices/quantities. Green, amber and red stock badges include text, and destructive actions use red labels. The presentation is polished for a small utility, although the initial inventory fills the viewport and cart/history sit below it.

At **390×844**, the table becomes labeled product cards and the form reflows its fields. The viewport and document widths both measured **390px**, with all Add to cart/Edit/Delete controls visible. Cart totals, checkout and expanded history remain readable. The tradeoff is density: the first card measured **260.5px**, the seeded cart section begins at **y=3,750px**, and row controls measured **31px** tall. The header Cart link provides a jump but scrolls away with the page.

Saved and actually viewed screenshots: [desktop](anthropic-cloud-fable-5.1-high-desktop.png), [mobile](anthropic-cloud-fable-5.1-high-mobile.png), [desktop form](anthropic-cloud-fable-5.1-high-desktop-form.png), [mobile form](anthropic-cloud-fable-5.1-high-mobile-form.png), [desktop cart](anthropic-cloud-fable-5.1-high-desktop-cart.png), [mobile cart](anthropic-cloud-fable-5.1-high-mobile-cart.png), [checkout confirmation](anthropic-cloud-fable-5.1-high-checkout.png), [desktop order history](anthropic-cloud-fable-5.1-high-desktop-history.png), [mobile order history](anthropic-cloud-fable-5.1-high-mobile-history.png).

## Strongest positive

The implementation preserves the meaning of a purchase across the full product lifecycle. The cart follows current product prices and stock, checkout blocks insufficient stock, and order history retains independent name/SKU/price snapshots after products change or disappear. The browser flow verified all three behaviors. The supporting design is explicit in `js/cart.js:66`, `js/orders.js:168` and `js/orders.js:207`; safe DOM construction uses `textContent` in `js/app.js:99`, and cent parsing avoids decimal multiplication in `js/format.js:60`.

## Confirmed defects and limitations

Paths below are relative to `anthropic-cloud-fable-5.1-high/`.

1. **Medium — failed checkout can leave a phantom order if rollback also fails.** `js/orders.js:221` saves the order before `js/orders.js:225` removes stock. If stock saving fails, `js/orders.js:230` attempts rollback, but `js/orders.js:231` only logs a second failure. Browser fault injection allowed the first order write and rejected the subsequent stock and rollback writes. `Orders.checkout()` returned `ok:false`, stock stayed **140**, and the cart still held **1** unit, while history increased from **1 to 2 orders** and remained at 2 after reload. This is a compound failure reproduction, not a normal-flow failure. A single persisted state commit or recoverable transaction record would close the gap.

2. **Medium — readable saved data disappears from the interface when writes are unavailable at startup.** The write-based availability test at `js/storage.js:12` controls whether inventory is even read (`js/inventory.js:34`, `js/inventory.js:186`), and the equivalent gate suppresses order reads (`js/orders.js:21`, `js/orders.js:96`). When `setItem` was fault-injected to throw before scripts loaded while `getItem` remained functional, storage still contained **13 products and 1 order**, but the UI showed **12 fresh sample products and 0 orders**. The unavailable-storage warning was visible, so this is not a silent claim of persistence; nevertheless, readable history is unnecessarily hidden and apparent stock is replaced by samples. Stored data was not erased. Separate read access from write capability and preserve saved data in read-only mode.

3. **Low — mobile browsing is lengthy and row targets remain compact.** The card transformation at `css/styles.css:424`, `css/styles.css:432` and `css/styles.css:453` repeats every column vertically; the small-button rule at `css/styles.css:137` remains active on mobile. Measured card/target dimensions and cart position are above. This is a usability/polish limitation, not a functional failure or a claim of WCAG nonconformance.

Static maintenance observations: `js/app.js` centralizes all UI responsibilities in 934 lines, although it is divided into clear sections. Inventory/cart/orders repeat cache, validation, subscription and storage-result plumbing. Product rendering rebuilds the table after changes, while cart/order rendering deliberately preserves live controls and disclosure state (`js/app.js:651`, `js/app.js:850`). These are tradeoffs rather than demonstrated performance defects.

## Executed browser checks

Command from the comparison directory:

```sh
node quality-review/anthropic-cloud-fable-5.1-high-probe.mjs
```

Used **Chrome 154.0.8037.58**, a new isolated context and temporary profile, opening the actual `file:///Users/mike-axionomic/Downloads/comparison/anthropic-cloud-fable-5.1-high/index.html`. Browser/profile were closed and cleaned in `finally`.

The normal path used Puppeteer clicks and keyboard input, including actual Enter, Tab and Escape; DOM/API reads inspected outcomes. It did not call domain mutation APIs to substitute for normal create/edit/cart/checkout/delete actions. The completed probe passed **25 assertions**, with **zero page errors**. It verified:

- Seed creation; required-field validation and first-invalid-field focus; add-dialog autofocus and Escape returning to Add product.
- Product creation at 1,999 cents, edit to 1,234 cents, accent/punctuation search, cart +/− and quantity typing (Enter and blur both worked).
- Zero, fractional and excess quantities reverted to the accepted value with specific feedback. Clicking checkout immediately after invalid quantity entry did not open a misleading confirmation.
- Cart persistence; checkout cancel; confirmed $37.02 purchase; stock deduction; empty cart; focus moved to the new expanded order; history persistence.
- Lowering stock below cart quantity displayed an explicit stock warning and blocked checkout; changing the current product price updated cart totals without rewriting history.
- Removal of the last cart item moved focus to the Cart heading. Deleting a product warned that its cart line would also be removed, and preserved its historical order snapshot.

Separate browser **API/fault-injection** checks verified literal rendering of an HTML-looking product name (no injected image/execution), backup and warning for malformed product JSON, unchanged storage after an ordinary failed product save, and the two exceptional failure defects above. Expected console errors came only from injected write failures.

The reverse-Tab probe recorded an empty active-element ID; it is not treated as proof of a keyboard trap or a focus defect. No screen-reader audit or automated accessibility certification was performed.

Reproducible [probe](anthropic-cloud-fable-5.1-high-probe.mjs) and [results](anthropic-cloud-fable-5.1-high-probe-results.json) are retained. Two preliminary probe attempts required automation corrections (unsupported chord notation and input-selection behavior); these were tooling issues, not application failures. The final corrected probe completed successfully.

## Supplied automated tests

Executed each supplied command from the application directory, with exit code **0** for every suite:

| Command | Result |
|---|---:|
| `node tests/inventory.test.js` | 36/36 passed |
| `node tests/cart.test.js` | 24/24 passed |
| `node tests/orders.test.js` | 29/29 passed |
| `node tests/search.test.js` | 18/18 passed |
| `node tests/format.test.js` | 11/11 passed |
| **Total** | **118/118 passed** |

[Execution log](anthropic-cloud-fable-5.1-high-tests.txt). Coverage is substantive: validation, immutable returned values, stock boundaries, cent conversion, persistence, malformed records, ordinary write failures, order snapshots and simulated sequential multi-page changes. The suites use Node `vm` with a fake browser/storage harness; they do not exercise `js/app.js`, native DOM/focus, screenshots or real simultaneous browser tabs. Tests cover stock-write failure when rollback succeeds, but not the reproduced failed rollback; unavailable storage tests also do not cover preexisting readable data behind a failed startup write probe.

## Review limits

Chrome was the only browser independently used here; mobile checks used viewport emulation rather than a physical touch device or software keyboard. No actual concurrent-tab race, real quota exhaustion, long-history performance test or screen-reader session was run. Write failures were controlled injections. `RESULTS.md` remains historical evidence only, and unavailable Git history is unverified rather than failed. No application code, dependencies or CI/CD configuration were changed.

```json
{"folder":"anthropic-cloud-fable-5.1-high","scores":{"ux":4.5,"visual":4,"code":4.5,"spec":4.5,"robustness":3.5,"accessibility":4.5},"weightedScore":86.5,"tasks":{"T1":"scaffold_readme_pass_git_unverified","T2":"pass","T3":"pass","T4":"pass","T5":"pass","T6":"pass_with_storage_failure_caveat","T7":"historical_unverified_current_chrome_review_pass"},"tests":{"passed":118,"total":118,"browserAssertions":25,"pageErrors":0}}
```
