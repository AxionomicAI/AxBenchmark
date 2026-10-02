# 4x-rtxpro6000-glm-5.3-flash-q4kxl — quality review

Review date: 2026-10-01. Source inspection, supplied tests, and an isolated Chrome `file://` workflow are complete. The browser probe was written by this reviewer and successfully executed by the parent after browser-launch permission constraints were removed. This reviewer read its JSON and actually viewed all five screenshots. No application source was changed.

| Category | Score / 5 | Judgment |
|---|---:|---|
| Spec | 4.5 | All requested application features work under ordinary direct-file use and survive reload; Git history unavailable, durable checkout fails on write errors. |
| Code | 4 | Clear modules, centralized validation, safe rendering, and coherent data relationships; persistence result handling and broad rerendering need improvement. |
| UX | 3.5 | Straightforward desktop management/search/cart workflow, clear validation and checkout feedback; mobile layout and keyboard recovery create material friction. |
| Visual | 3 | Coherent, readable desktop table and form styling; excessive whitespace and horizontal overflow spoil the mobile presentation. |
| Robustness | 2.5 | Useful numeric guards, stale-cart cleanup, and snapshots; reproduced stock loss without durable order history on a failed write. |
| Accessibility | 2.5 | Labels, table headings, dialog roles, status text, and visible focus styling; reproduced modal focus escape and missing restoration, unannounced form errors, small controls. |
| **Weighted overall** | **72.5 / 100** | Weights follow the shared review protocol. |

The application is a dependency-free, direct-file inventory site with separate storage, inventory, cart, order, and UI modules. Its strongest source-level feature is coherent cart state: lines refer to live product IDs, edits affect current prices, stock reductions clamp quantities, deleted products leave the cart, and historical orders preserve snapshots.

## Supplied tests executed

Commands ran from the application directory:

| Command | Current result |
|---|---|
| `node tests/data-layer.test.js` | 41 passed, 0 failed |
| `node tests/cart.test.js` | 61 passed, 0 failed |
| `node tests/orders.test.js` | 44 passed, 0 failed |
| `node tests/ui.test.js` | Skipped: `jsdom` absent; misleadingly exits 0 |

The 146 passing assertions exercise CRUD, validation, seed/persistence behavior, cart stock limits/synchronization, checkout, order snapshots, history numbering, and malformed-storage/memory-only fallback. The deliberate corruption scenarios print expected errors. UI test source was inspected; its simulated jsdom environment is not a real browser. No dependencies were installed. The skip-as-success branch is `tests/ui.test.js:18`–23.

## Main findings

- **High — failed order persistence still consumes stock and announces success (browser reproduced).** After injecting a `QuotaExceededError` only for `inventory.orders.v1`, checkout reduced mouse stock from 42 to 41, emptied the cart, displayed “Order #1002 placed,” and showed no warning. Reload preserved stock 41 and the empty cart, but only the earlier order remained. `js/storage.js:53` returns false on failed writes, while `js/data.js:211`, `js/cart.js:69`, and `js/orders.js:84` ignore that result. Checkout persists stock individually at `js/orders.js:242`, clears the cart at `js/orders.js:266`, then attempts order persistence and returns success at `js/orders.js:268`. The warning in `js/app.js:942` runs only during bootstrap. Fix by explicitly handling write failures and committing inventory/cart/orders consistently before announcing success.
- **Medium — mobile layout wastes most of the first screen and overflows (browser reproduced and visually inspected).** At a 390×844 viewport, document width is 637px; the inventory table is 811px inside a 340px scroll area. Search sits in a large blank region, Add product appears around y=584, and only the first inventory rows are visible before the fold. Most row actions are outside the initially visible table area. `.toolbar` becomes a column at `css/styles.css:744`, but `.toolbar-left` retains `flex: 1 1 340px` at `css/styles.css:182`, causing the large vertical space. Horizontal table scrolling is defined at `css/styles.css:353`; nowrap row actions at `css/styles.css:440` retain width. Reset the flex basis for mobile, address page overflow, and make product actions discoverable within the narrow viewport.
- **Medium — modal keyboard focus leaks to the page and is not restored (browser reproduced).** Opening the product form focuses the name field, but Shift+Tab moves outside the modal. Immediately after Escape, the active element remains the now-hidden name input; `/` does not focus search in that state. The modal has labels and dialog semantics (`index.html:148`, `js/app.js:426`) but no focus trap/background inertness, and close does not restore its trigger (`js/app.js:446`). Blank submission produces readable errors, but the container has no alert/live-region semantics or field associations (`index.html:150`, `js/app.js:390`).
- **Low — test setup can report an apparent success without executing the UI suite.** `tests/ui.test.js:18`–23 exits 0 when jsdom is absent; this occurred during this review. A documented optional skip is understandable, but verification output must distinguish it from a pass.

Code is clearly divided and consistently documented; safe `textContent`/DOM rendering is used throughout, including highlighted search matches (`js/app.js:121`). Repeated rounding helpers and a 984-line UI module are manageable but verbose. Every change reconstructs tables/history (`js/app.js:962`), which can discard row focus and expanded order state; this consequence was not separately tested. Getter arrays are shallow copies (`js/data.js:295`, `js/orders.js:181`), exposing internal objects to API consumers. Those are static design observations. Rounding to two decimals is explicit, although money is represented with floating-point numbers.

## Browser verification and visual assessment

The probe used actual Puppeteer click/keyboard actions for opening/submitting forms, editing, adding/removing cart lines, quantity increments, checkout, opening order details, deleting, and Escape/Tab behavior. Form values were assigned through DOM evaluation before clicking Save. Numeric edge checks invoked the public data API. The failed-write scenario patched `Storage.prototype.setItem` inside the isolated review page. It does not represent a naturally exhausted browser quota, but exercises the actual failure path.

Verified sequence: 10 seeded products; create a product with stock 5; search its SKU (one result); edit name and price to 15; add two cart units (total 30); reload with cart/name/price intact; remove the line; add two again; checkout reduces stock to 3, clears cart, records #1001 at 30; reload preserves stock/cart/history; stock edited to zero removes the cart line; delete persists while past order retains the purchased name. Zero, fractional, and excessive cart additions are rejected. A no-results state appears for unmatched search. No uncaught page errors were observed in this run.

Desktop uses a centered table, restrained blue primary actions, readable system typography, aligned numeric columns, clear stock badges, and consistent white panels on a gray background. Product names/locations and SKU styles establish hierarchy. The form has sensible spacing and a prominent error summary; completed orders expand to a concise item snapshot. The main desktop weaknesses are dense adjacent row buttons, tiny 24px stock controls (`css/styles.css:421`), and the distant below-table cart. Mobile retains readable text but has the substantial spacing/overflow failures above.

Screenshots saved and viewed: [desktop](4x-rtxpro6000-glm-5.3-flash-q4kxl-desktop.png), [mobile](4x-rtxpro6000-glm-5.3-flash-q4kxl-mobile.png), [form](4x-rtxpro6000-glm-5.3-flash-q4kxl-form.png), [cart](4x-rtxpro6000-glm-5.3-flash-q4kxl-cart.png), [expanded order](4x-rtxpro6000-glm-5.3-flash-q4kxl-orders.png). Landing screenshots are full-page captures at the specified desktop/mobile viewport sizes. Audit evidence: [probe](4x-rtxpro6000-glm-5.3-flash-q4kxl-probe.mjs), [results](4x-rtxpro6000-glm-5.3-flash-q4kxl-probe.json).

## Specification and provenance

The supplied scaffold, README, T1–T6 feature implementations, vanilla JavaScript/CSS, and localStorage persistence are present. No `.git` repository is included (`git -C 4x-rtxpro6000-glm-5.3-flash-q4kxl rev-parse --show-toplevel` fails), so historical commit claims cannot be verified. `RESULTS.md` is historical evidence only. T7 was not part of this local run and is not a requirement for its score.

| Requirement | Result |
|---|---|
| Base: vanilla, direct-file, localStorage | Verified |
| T1: structure and README | Present; Git initialization/commits unverified |
| T2: seeded inventory and persistence | Verified |
| T3: view/add/edit/delete | Verified |
| T4: quickly find products | Verified via live SKU search and no-results state; category filter inspected in source |
| T5: cart, quantities, removal, total, persistence | Verified |
| T6: stock-updating checkout, order history, README | Verified under normal storage; failed-write integrity defect above |

Limitations: one Chrome version, two viewport sizes, one focused workflow; no cross-tab concurrency, screen-reader, exhaustive contrast, large-data performance, or mobile touch interaction audit. Corrupt storage and disabled storage were covered by supplied Node tests, not newly reproduced in the browser. The browser was closed in the probe's `finally` block. No generation harness, CI/CD, or application modifications were run.

## Embedded generation tooling (excluded from application scores)

`glm-harness.py` is supporting provenance, not application runtime. It retains one conversation across T1–T6 (`glm-harness.py:82` onward), diverging from the common fresh-session task instruction; RESULTS.md discloses that difference. Its claim that tools are confined to the work directory is not enforced for `bash`: `subprocess.run(..., shell=True, cwd=WORK)` (`glm-harness.py:42`) is a working-directory setting, not a sandbox. File tools use lexical `abspath` containment (`glm-harness.py:33`), which does not resolve symlinks. It expects a sibling `tasks/` directory (`glm-harness.py:83`) that is absent in this artifact. The harness was inspected, not run, and these concerns do not lower the inventory application's quality score.

```json
{"folder":"4x-rtxpro6000-glm-5.3-flash-q4kxl","scores":{"ux":3.5,"visual":3,"code":4,"spec":4.5,"robustness":2.5,"accessibility":2.5},"overall_100":72.5,"tasks":{"T1":"scaffold/readme verified; git unverified","T2":"pass","T3":"pass","T4":"pass","T5":"pass","T6":"pass normal flow; failed-write integrity defect","T7":"not applicable"},"tests":{"data":41,"cart":61,"orders":44,"failed":0,"ui":"skipped: jsdom absent"},"browser_verified":true,"screenshots_viewed":5,"top_defects":["failed order write consumes stock and clears cart while reporting success","mobile whitespace and document overflow","modal focus escape and missing restoration"]}
```
