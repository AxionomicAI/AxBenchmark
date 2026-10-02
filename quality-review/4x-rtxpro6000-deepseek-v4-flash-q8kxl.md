# 4x-rtxpro6000-deepseek-v4-flash-q8kxl quality review

Reviewed 2026-10-01 against the common T1–T6 specification. All implementation files and README were inspected. Chrome DevTools opened the actual `file://` entry point in the isolated `quality-gpu-deepseek` context. No application source was changed.

| Category | Score / 5 | Assessment |
|---|---:|---|
| Spec alignment | 4.5 | Direct-file, dependency-free, localStorage implementation completes the required normal workflows. Git initialization/commits cannot be verified from the supplied folder. Reliability caveats below affect production confidence. |
| UX | 3 | Complete, discoverable desktop workflow with search, details, validation and feedback. The large permanent creation form precedes browsing; tiny icon actions and horizontal scrolling impede mobile work. Adding to cart also opens and scrolls to details unexpectedly. |
| Visual | 3 | Consistent navy header, white cards, restrained accents, aligned controls and readable desktop table. Mobile form adapts well, but table names wrap heavily and action columns require horizontal scrolling. Checkout loses primary-button emphasis. |
| Code | 2.5 | Straightforward, readable named functions and event delegation, but all state/DOM/persistence lives in one global script. Attribute escaping, derived-column sorting and persistence consistency are demonstrably faulty. |
| Accessibility | 2.5 | Explicit field labels, named sections, icon-button accessible names and working `/` search shortcut. Sorting and order expansion lack keyboard semantics; feedback has no live region. |
| Robustness | 1.5 | Checkout rejects excessive stock and deleted products, but unsafe attribute rendering executes entered event handlers, and a failed order write permanently reduces stock without recording the order. |
| **Weighted overall** | **62 / 100** | Weights: UX 25%, Visual 15%, Code 20%, Spec 25%, Robustness 10%, Accessibility 5%. |

## Specification checks

| Task | Status | Evidence |
|---|---|---|
| T1 scaffold/README/Git | Partial verification | HTML/CSS/JS and usable README present. No per-folder `.git` supplied; historical commits unverified, not scored as a failure. |
| T2 seeded persistent inventory | Pass | First isolated load contained 8 sample products; created/edited stock survived reload. |
| T3 view/add/edit/delete | Pass | Created QA Widget, edited its name, viewed details and deleted it with confirmation. |
| T4 quick lookup | Pass | Live description search returned the one matching edited item. Name/category matching and category filtering also implemented. Optional Value sort is broken. |
| T5 persistent cart | Pass with caveats | Added from inventory, incremented, directly changed quantity, removed, displayed correct total and reloaded persisted cart. Price edits leave cart snapshots stale. |
| T6 checkout/history/README | Pass with caveats | Three units at $12.50 produced a $37.50 order, stock 10→7, and empty cart; order/stock persisted after reload. README documents checkout/history. Failure recovery is unsafe. |

T7 was not required for this local run. Historical RESULTS.md claims are not treated as runtime verification.

## Confirmed findings

1. **High: product names can inject executable attributes.** `escHtml()` escapes text via a temporary div but leaves quotation marks unchanged (`app.js:502`). Its output is interpolated into quoted `aria-label` attributes (`app.js:493`, also cart buttons at `app.js:275`). Entering `QA" onmouseover="window.qaInjected=true` through the item form produced a real `onmouseover` attribute; dispatching mouseover set the harmless marker to true. This is stored DOM injection from normal form data, although the local-only app offers limited attacker distribution. Use DOM text/attribute APIs or context-correct escaping.
2. **High: checkout can lose stock without creating an order.** Separate uncaught saves run inventory→orders→cart (`app.js:242`; storage writers at `app.js:73`, `app.js:123`). In this isolated browser, a simulated `QuotaExceededError` only for `order_history` left USB-C Hub stock permanently 18→17, order count unchanged at 1 and the purchase still in the cart after reload. Retrying can deduct again. This was reproduced by temporarily overriding `Storage.prototype.setItem`; ordinary storage capacity was not exhausted.
3. **Medium: adding to cart opens an unrelated detail panel and moves the viewport.** The first inventory click handler finds the enclosing row's `data-view` before the separate cart handler executes (`app.js:612`, `app.js:635`). A genuine DevTools click on “Add QA Widget Edited to cart” both added the item and opened details. The inserted panel increases travel between stock and cart.
4. **Medium: mobile browsing/actions need substantial horizontal and vertical travel.** At 390×844, the creation form and search occupy nearly the first screen; stock rows wrap product names into several lines and the action column is outside the visible table area. The responsive rules stack the form but retain the dense six-column table (`styles.css:252`, `styles.css:579`). Actions are small icon buttons (`styles.css:184`). The page remains usable through the table's horizontal scroll.
5. **Medium: cart data does not reconcile product edits.** A cart item retained its $12.50 price after editing inventory price to $20 (`app.js:147`, `app.js:355`); checkout uses the saved cart price (`app.js:225`). There is no indication that the old price is intentionally locked. Product deletion leaves a cart entry, but checkout correctly blocks it and tells the user to remove it (`app.js:206`), so deletion does not silently deduct nonexistent stock.
6. **Medium: keyboard and announcement gaps.** Sortable `<th>` elements have no focusability, button, keyboard handling or `aria-sort` (`index.html:85`, `app.js:517`). Order expand is a click-only `<div>` with `tabIndex=-1` (`app.js:315`, `app.js:672`). Toasts have neither status/alert role nor live-region semantics (`app.js:57`); the browser DOM contained zero live regions. Field labels and button names are otherwise useful.
7. **Low: Value sort promises an operation it never performs.** Clicking ascending/descending produced identical, unsorted value sequences. `data-sort="value"` (`index.html:89`) indexes `a.value`/`b.value`, but value is only calculated during rendering (`app.js:452`, `app.js:485`).
8. **Low: checkout and clear-cart appear equally neutral.** `.btn-small` overwrites primary/danger colors because it is later in the stylesheet (`styles.css:173`; button composition at `index.html:118`). The visually important purchase action looks like secondary Export.

Other static risks: JSON is parsed without validating array/item shape (`app.js:77`, `app.js:109`, `app.js:127`); malformed-data recovery can replace inventory with sample data, and write errors are not surfaced. Monetary values use floating-point arithmetic (`app.js:227`), although the exercised total was correct. These malformed-data and currency boundary cases were not reproduced.

## Runtime evidence and tests

- **Normal flow:** first-load seed of 8; scripted form submission created QA Widget with stock 10 and price $12.50; scripted edit renamed it; description search returned 1 matching row. A genuine click added it; scripted increment changed 1→2 and input change set 3; total $37.50 and cart survived reload. Scripted checkout and order expansion showed stock 7, 1 order, $37.50 and empty cart. A second reload preserved all three. Scripted delete accepted the browser confirmation and removed the product.
- **Edges:** quantity 999 was accepted into cart but checkout rejected it with available/requested counts; stock/order counts stayed unchanged. Cart input `1.9` became 1 and `0` became 1 without explanatory feedback. Remove worked. Deleted-product checkout blocked with a useful message. Price-edit, attribute-injection and partial-write cases above were reproduced.
- **Keyboard:** a real `/` key press focused `search-input`. Keyboard semantics were also inspected in the accessibility tree/DOM; a full screen-reader or WCAG audit was not performed.
- **Supplied automated tests:** none; no package/test runner supplied. `node --check 4x-rtxpro6000-deepseek-v4-flash-q8kxl/app.js` passed (exit 0). This is syntax validation, not a functional test suite.
- **Screenshots captured and actually viewed:** [desktop 1440×1000](4x-rtxpro6000-deepseek-v4-flash-q8kxl-desktop.png), [mobile 390×844](4x-rtxpro6000-deepseek-v4-flash-q8kxl-mobile.png), [cart/details](4x-rtxpro6000-deepseek-v4-flash-q8kxl-cart.png), [expanded order](4x-rtxpro6000-deepseek-v4-flash-q8kxl-order.png). Landing screenshots are full-page captures at those viewport dimensions.

**Strongest positive:** the entire small inventory→purchase→history flow works directly from a file with no install, and the desktop presentation makes its structure easy to understand.

Limitations: one Chrome isolated context; mobile layout visually inspected, not a separate end-to-end touch run. Most functional interactions were DOM-dispatched in a real browser, with genuine pointer/keyboard checks explicitly identified above. No cross-tab, export-download, exhaustive malformed-storage or multi-browser tests. No historical Git evidence was supplied.

```json
{"folder":"4x-rtxpro6000-deepseek-v4-flash-q8kxl","scores":{"ux":3,"visual":3,"code":2.5,"spec":4.5,"robustness":1.5,"accessibility":2.5},"overall100":62,"tasks":{"T1":"scaffold_readme_pass_git_unverified","T2":"pass","T3":"pass","T4":"pass","T5":"pass_with_caveats","T6":"pass_with_caveats","T7":"not_required_local"},"tests":{"supplied":"none","syntax":"node --check app.js: pass","browser":"direct_file_isolated_chrome_normal_flow_pass"},"topDefects":["Product-name attribute injection","Partial checkout storage write loses stock without order","Cart-add also opens detail view","Mobile actions off-screen","Stale cart price after edit","Click-only sorting and order expansion"]}
```
