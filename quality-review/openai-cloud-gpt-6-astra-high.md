# Quality review: openai-cloud-gpt-6-astra-high

Reviewed 2026-10-01 by a fresh subagent after the Fable reviewer completed, following the shared review protocol. Inspected all 1,034 application lines across HTML, CSS, UI JavaScript and storage JavaScript, the README, both supplied test suites, and historical reports. Independently opened the actual `file://` application in isolated Chrome and viewed eight screenshots. No application source or CI/CD changes. Historical Git commits cannot be verified because this supplied folder contains no `.git` directory.

| Category | Grade /5 | Finding |
|---|---:|---|
| UX | 4 | Clear CRUD dialogs, immediate search, stock-aware cart, useful validation, draft retention and good focus recovery. Mobile actions require horizontal discovery; the long stacked layout separates inventory from cart. |
| Visual | 3.5 | Coherent light palette, readable typography, consistent controls and restrained desktop panels. Mobile preserves legibility but exposes only part of each table, with unusually tall inventory rows and hidden actions. |
| Code quality | 4.5 | Cohesive validated storage API, exact cents/BigInt arithmetic, safe DOM rendering, immutable receipt snapshots and save-before-render discipline. UI rendering remains one large imperative module with repeated item lookup and complete row reconstruction. |
| Business rules / specification | 5 | All required application behavior verified: direct-file vanilla app, seeded persistent inventory, CRUD, lookup, persistent quantities/totals, stock deduction and historical receipts. README documents the delivered behavior. Git history remains unverified rather than failed. |
| Robustness | 4.5 | Failed writes preserve data; checkout commits stock/cart/history in one write. Corrupt state is preserved and blocked; stale edits and invalid quantities are rejected. Corruption recovery remains manual, and stale checks do not serialize simultaneous tabs. |
| Accessibility | 4.5 | Native dialogs, labels, contextual button names, live statuses, alerts, visible focus and deliberate focus restoration worked in keyboard checks. Horizontal mobile tables still impose navigation effort; no full assistive-technology audit was performed. |

Weighted overall: **4.35/5 (87/100)** using the common protocol. Scores judge this artifact within the requested small-app scope, not model capability or historical benchmark claims.

**Code quality:** The separate data layer validates every persisted structure, uses exact money calculations, and commits checkout as one state write. UI updates follow successful persistence, while text-only DOM rendering avoids treating product content as HTML. The main maintainability cost is the large imperative rendering module and repeated full-list rebuilding.

**UX:** Desktop operation is straightforward, with explicit actions, clear errors, preserved form/cart drafts and reliable keyboard focus. Mobile needs a better inventory/cart presentation: names, quantities and actions cannot be viewed together without horizontal scrolling, and stacked hidden buttons make the product list unnecessarily tall.

**Business rules/spec adherence:** The required workflows passed through the actual direct-file page. A four-unit purchase at $3.25 reduced stock from 8 to 4, saved a $13.00 receipt and emptied the cart; reload and later product deletion preserved that receipt. Stock reductions/deleted products block checkout with guidance, and failed checkout does not partially save an order.

## Specification evidence

| Task | Status | Evidence |
|---|---|---|
| T1 scaffold / Git / README | Application pass; Git unverified | HTML5, local CSS/classic scripts, vanilla JS and README present. Actual `index.html` opened directly. `index.html:1`, `index.html:8`, `README.md:6`. No supplied `.git` history to verify initialization/commits. |
| T2 seeded stock / persistence | Pass | First run seeded Notebook 24, Ballpoint pen 60, Document folder 8 and Packing tape 0. Changes persisted. Supplied tests also verified intentionally empty inventory stays empty. `js/storage.js:10`, `js/storage.js:79`. |
| T3 view / add / edit / delete | Pass | Created Audit lamp with keyboard entry, edited its name/price, canceled a deletion with Escape, then confirmed deletion. Supplied browser tests cover duplicate/blank fields, numeric boundaries and deleting all products. `js/app.js:290`, `js/app.js:342`, `js/app.js:372`. |
| T4 quick lookup | Pass | Trimmed mixed-case name lookup found the edited product; no-match state and Clear worked. Supplied tests cover SKU search and filtered CRUD preserving hidden items. `js/app.js:240`, `js/app.js:382`. |
| T5 persisted cart | Pass | Added from inventory, changed quantity with Enter, removed a second product, verified $9.75 for 3 × $3.25 and reloaded with the later quantity of 4 preserved. `js/app.js:59`, `js/app.js:125`, `js/storage.js:112`. |
| T6 checkout / order history / README | Pass | Four-unit purchase saved $13.00, reduced stock to 4 and cleared cart. Receipt survived reload, later repricing and deletion. Failed-write probe left all stored values unchanged. `js/storage.js:178`, `js/storage.js:207`, `js/app.js:213`, `README.md:78`. |
| T7 cloud browser QA | Current supplied suites pass; historical run unverified | Reran all 14 real-browser tests and all 17 storage tests successfully, and completed a separate independent browser probe. `tests/browser.test.cjs:9`, `tests/TEST_REPORT.md:12`. Supplied reports do not independently prove the original run or its commits. |

## Strongest positive

Persistence is unusually careful for a small local application. `js/storage.js:169` writes a validated consolidated state, and `js/storage.js:207` constructs stock deductions, empty cart and appended receipt before the single checkout write. The independently injected `QuotaExceededError` preserved every stored value and allowed a successful retry. This is atomicity against a failed storage write; it is **not** a locking guarantee across simultaneously writing tabs.

Other substantive strengths are historical receipt snapshots (`js/storage.js:193`), integer-cent/BigInt totals (`js/app.js:35`, `js/storage.js:195`), guarded stale saves (`js/storage.js:62`, `js/storage.js:112`) and preserved unapplied quantity drafts (`js/app.js:33`, `js/app.js:109`). The code restores focus after product/cart rerenders (`js/app.js:53`, `js/app.js:135`, `js/app.js:367`) and focuses the newly opened receipt after purchase (`js/app.js:232`). These behaviors were exercised rather than inferred from comments.

## Confirmed defects and material limitations

1. **Mobile row actions and quantity controls sit outside the visible table.** At 390px, the inventory scroll container is 324px wide but its table is 672px wide; the first Add to cart button starts at x≈540, entirely outside the viewport. The mobile landing screenshot shows only product/SKU/stock, with no in-app instruction that more actions are to the right. The cart capture similarly cuts off quantity controls and hides Update/Remove. Evidence: `css/styles.css:54`, `css/styles.css:99`, `css/styles.css:202`. Controls remain reachable through horizontal scrolling and keyboard focus, so this is friction/discoverability rather than a broken cart.
2. **The mobile layout wastes vertical space and separates related work.** The narrow breakpoint stacks three action buttons inside the hidden right-hand column, making each seed-product row about 170px high. Four products push Shopping cart to roughly y=1328; there is no cart shortcut near inventory. Desktop is also a long single column, though density is much better. Evidence: `css/styles.css:271`, `index.html:21`, `index.html:51`. The screenshot demonstrates the effect; larger inventories were not stress-tested.
3. **Corruption is protected but recovery is not available in the interface.** Malformed `inventory.state.v2` disables additions and checkout, keeps the invalid value, and asks the user to check browser storage/reload. Reload alone cannot repair malformed JSON. There is no export/restore or guided recovery action. Evidence: `js/storage.js:161`, `js/app.js:389`, `js/app.js:410`. This is a resilience/usability limitation beyond the original task, not an unmet T1–T6 feature.
4. **Initial samples are all free.** Sample objects omit price (`js/storage.js:10`); display and checkout treat omission as zero (`js/app.js:255`, `js/storage.js:192`). This is documented in the README and free orders work correctly, but a first-time user must edit prices before the demo illustrates a meaningful paid cart total. This is a minor onboarding weakness, not a specification violation.

Static scope limits: stale checks compare snapshots before writing and therefore cannot provide transaction isolation for genuinely simultaneous writes (`js/storage.js:62`, `js/storage.js:178`). A sequential other-page edit was tested and rejected successfully; no contention/race benchmark was run. Complete table rebuilding and repeated linear searches (`js/app.js:80`, `js/app.js:84`, `js/app.js:252`, `js/app.js:272`) are acceptable at sample scale but are a maintainability/scaling tradeoff, not a measured performance defect.

## Executed validation

- **Independent browser audit:** Chrome 154.0.8037.58, fresh temporary profile, actual `file:///Users/mike-axionomic/Downloads/comparison/openai-cloud-gpt-6-astra-high/index.html`; desktop 1440×1000 and mobile 390×844. Actual clicks, typed text, Tab, Meta key handling, Enter, Space and Escape were used for ordinary interactions. DOM/storage reads asserted results; storage APIs were used directly only for explicit stale/corrupt/failure probes. The probe records 15 observations/check groups, completed successfully, and captured no page errors.
- **Normal flow:** seed → keyboard product creation → edit → search/no match/clear → add/update/remove cart → cart reload → checkout → stock/history verification → history keyboard collapse/expand → reload → later product deletion. Confirmed draft blocking, receipt focus, deletion cancellation and immutable receipt history.
- **Edge checks:** zero, fractional and above-stock quantities left saved data unchanged; unapplied quantity blocked purchase and focused the field; failed checkout preserved all keys; reduced stock and deleted products blocked checkout; malformed consolidated storage was preserved; a stale other-page edit was rejected; a markup-looking product name created no image node.
- **Supplied storage suite:** from the app folder, `node --test tests/storage.test.cjs` — **17 passed, 0 failed, 0 skipped**, exit 0. Covers validation, exact large totals, corrupt state, migration, failed writes, stale snapshots and preserving empty inventory.
- **Supplied browser suite:** from the app folder, `NODE_PATH=/tmp/claude-501/-Users-mike-axionomic-AiSandbox/1c01ddfd-bbb0-4ae2-ac1d-bf9bec6d9924/scratchpad/verify/node_modules node --test tests/browser.test.cjs` — **14 passed, 0 failed, 0 skipped**, exit 0. Existing external Playwright was used without editing tests or adding application dependencies. Includes genuine browser CRUD/cart/checkout, offline file loading, failed/blocked storage, stale tabs, draft retention, keyboard behavior and 320–1280px layout assertions. Total supplied tests: **31/31**.
- The first independent probe attempt stopped on a harness-only unsupported Puppeteer `Meta+A` key string. Corrected the audit script to separate key-down/key-press/key-up and reran in a fresh profile. This was not an application failure.

Limitations: Chrome only; responsive viewports are not physical-device tests. No screen reader, full contrast audit, large-data load test or simultaneous-write contention test. Passing supplied tests demonstrates current assertions, not exhaustive correctness or historical T7 execution. Browsers/profiles were closed in `finally`; only review artifacts were written.

## Visual evidence actually viewed

All eight PNGs below were opened and inspected. Desktop uses a centered 1,024px column, consistent white panels, dark slate text and blue primary actions; labels, numbers and validation hints are legible. The product dialog fits desktop and the 390px viewport with clear focus treatment and accessible action spacing. Cart totals have useful emphasis. Receipts use a plain native disclosure with the full order ID, which wraps heavily on mobile but remains readable. The main visual weakness is the fixed-width mobile table treatment documented above.

- [Desktop landing](openai-cloud-gpt-6-astra-high-desktop.png)
- [Mobile landing](openai-cloud-gpt-6-astra-high-mobile.png)
- [Desktop product form](openai-cloud-gpt-6-astra-high-desktop-form.png)
- [Mobile product form](openai-cloud-gpt-6-astra-high-mobile-form.png)
- [Desktop populated cart](openai-cloud-gpt-6-astra-high-desktop-cart.png)
- [Mobile populated cart](openai-cloud-gpt-6-astra-high-mobile-cart.png)
- [Desktop purchase/history](openai-cloud-gpt-6-astra-high-desktop-history.png)
- [Mobile purchase/history](openai-cloud-gpt-6-astra-high-mobile-history.png)
- [Raw probe results](openai-cloud-gpt-6-astra-high-probe-results.json)
- [Reproducible review probe](openai-cloud-gpt-6-astra-high-probe.mjs)
- [Supplied-test execution log](openai-cloud-gpt-6-astra-high-tests.txt)

```json
{"folder":"openai-cloud-gpt-6-astra-high","scores":{"ux":4,"visual":3.5,"code":4.5,"spec":5,"robustness":4.5,"accessibility":4.5},"overall_5":4.35,"overall_100":87,"tasks":{"T1":"application pass; Git unverified","T2":"pass","T3":"pass","T4":"pass","T5":"pass","T6":"pass","T7":"31 supplied tests passed currently; historical execution unverified"},"supplied_tests":"31 passed: 17 storage + 14 browser; 0 failed; 0 skipped","browser_probe":"completed 15 observations/check groups; no page errors; normal flow and storage/focus probes passed; mobile table friction confirmed","screenshots_viewed":true}
```
