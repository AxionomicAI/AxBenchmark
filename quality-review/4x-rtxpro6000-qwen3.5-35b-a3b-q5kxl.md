# Quality review: 4x-rtxpro6000-qwen3.5-35b-a3b-q5kxl

Reviewed 2026-10-01 by a fresh sequential reviewer. Read all 1,169 implementation lines (HTML, JS, CSS), README, historical RESULTS and common T1–T7 specification. Findings below are independently verified against the supplied final artifact. No application source was changed.

| Category | Score (1–5) | Comments |
|---|---:|---|
| Business rules/spec | 3 | Direct-file vanilla/localStorage operation, seeded inventory, CRUD, lookup and persistent cart are present. Checkout normally decrements stock and stores orders, but reloaded history is unusable, order totals can disagree with line items, and an intentionally empty inventory is reseeded. |
| UX | 2.5 | Plain labels and visible row actions make basic CRUD and purchases discoverable. A large always-open creation form precedes the inventory; cart feedback is far below the clicked item, editing does not focus the form, active search silently stops filtering after edits, and historical purchases become inaccessible after reload. |
| Code quality | 2.5 | Named functions and separate HTML/CSS/JS are easy to navigate without dependencies. Global functions, inline event-code generation, repeated full-table rendering and duplicated cart/product data cause concrete injection, stale-price and focus defects. No validation or recovery boundary surrounds storage. |
| Visual design | 2 | Consistent system typography, spacing, pale section surfaces and colored actions provide a coherent desktop baseline. The form occupies most of the first screen, color use is busy, and mobile tables overflow the entire page rather than adapting or scrolling within a section. |
| Accessibility | 2 | Explicit form labels, headings, native buttons and normal form tab order are useful foundations. Cart quantities have no accessible labels, +/− names lack context, edit focus remains on the row, quantity rerenders discard focus, and mobile horizontal overflow impairs use. |
| Robustness | 1 | Reproduced executable input in an inline handler, inconsistent order amounts after repricing, partial checkout on a failed storage write, and a blank application after malformed stored JSON. Stock and missing-product checks do correctly prevent ordinary invalid checkout. |

Weighted overall: **47.5/100** using UX 25%, visual 15%, code 20%, business rules/spec 25%, robustness 10%, accessibility 5%. These are judgment scores, not test pass percentages. Added robustness and accessibility dimensions are useful quality comparisons, not additional requirements invented for the original tasks.

## Explicit specification compliance

| Requirement | Status | Evidence |
|---|---|---|
| Base: HTML5/vanilla JS, direct opening, localStorage | Pass | Opened actual `file://…/index.html` in isolated Chrome; no dependencies or server needed; normal state persists. |
| T1 scaffold, README, Git/commit | Artifact pass; Git history unverified | Supplied HTML/CSS/JS structure and README exist. No folder-local `.git` or original commit history was supplied; historical commit claims are not graded as a failure. |
| T2 stock, persistence, first-run seed | Partial | Eight products seed correctly and stock persists. Deleting all products then reloading restores all eight samples (`js/app.js:338`), confusing an empty saved inventory with first use. |
| T3 view/add/edit/delete | Pass with quality caveats | Created, renamed, repriced and deleted a product using UI controls. Normal updates persisted. Empty inventory retention is covered by T2. |
| T4 quick lookup | Partial | Trimmed, case-insensitive name lookup worked; code also covers category and quantity. After editing while filtered, all nine rows returned even though the search box still held its query. |
| T5 add/change/remove/total/persistent cart | Pass with quality caveats | Add, increment, typed quantity, removal, total and reload persistence verified. Invalid typed values and product edits expose issues documented below. |
| T6 checkout, stock, persistent history, README | Partial | Buying two at $2.50 reduced stock 10→8, created a $5 order and emptied cart. Details were available immediately. After reload stored history exists but has zero rendered rows, including after View All Orders. Repricing creates internally inconsistent orders. README documents checkout/history. |
| T7 real-browser QA | Not applicable | Local run only required T1–T6. This independent audit does not establish historical T7 performance. |

## Strongest positive

The entire normal purchase flow works from a local file without setup. Inventory row actions, reusable add/edit form, case-insensitive search, cart controls and a readable immediate order detail provide a usable desktop starting point. Checkout checks every requested product before writing stock, correctly rejecting an excessive quantity and a deleted product without committing a new order.

## Confirmed defects and exact source references

Paths below are relative to this application folder.

1. **High — retained orders disappear from the UI after reload.** Checkout calls `renderOrders()`, but initialization stops after cart/inventory rendering at `js/app.js:695`–`js/app.js:702`. `showOrders()` at `js/app.js:587` only exposes the empty table; it does not render its contents. Reproduction: purchase → reload → misleading “No orders yet” message; storage contains one order, DOM has zero order rows; View All Orders still shows no entries. This is inaccessible saved data, not deletion of stored history.
2. **High — order line amounts and order total diverge after price edits.** The cart captures price at `js/app.js:107`; editing inventory at `js/app.js:372` does not reconcile it. Checkout records the current inventory price/subtotal at `js/app.js:219`, but calculates the order total from stale cart prices at `js/app.js:247`. Reproduction: add $2.50 product, edit price to $7, checkout one unit → line subtotal $7 and order total $2.50. A consistent policy could use either a locked quote or current price; this implementation mixes both.
3. **High — a product name can execute script through Add to Cart.** `js/app.js:440` embeds JSON into an inline `onclick`, escaping quotes but leaving ampersands to be interpreted as HTML entities. An ordinary form entry of `&quot;+(window.__reviewMarker=1)+&quot;` followed by Add to Cart sets the harmless marker to 1 in the browser. `escapeHtml()` protects displayed text but not this executable context. This was reproduced, not merely inferred from `innerHTML` usage.
4. **High — failed checkout storage write leaves decremented stock without an order.** Stock is saved at `js/app.js:239` before the order write at `js/app.js:253`, with no rollback/error handling; cart clears later. A simulated `QuotaExceededError` on the order-history key left mouse stock 45→44, the same unit still in cart, and no saved order. Retrying could decrement it again. Error injection was isolated to the review browser, not a claim that the browser naturally ran out of storage.
5. **Medium — deleting all inventory does not persist the empty state.** `js/app.js:338` treats any zero-length list as an uninitialized store. Eight genuine Delete-button interactions emptied all remaining products; reload restored eight samples.
6. **Medium — mobile layout requires whole-page horizontal scrolling.** `css/styles.css:15`, `css/styles.css:41`, `css/styles.css:144` and `css/styles.css:171` combine nested padding, wide tables and nonwrapping action groups with no responsive breakpoint or overflow wrapper. At viewport 390×844 the document was 789px wide; inventory table extended from x=70 to x=789. Actions and much of the data are offscreen. Screenshot was captured and actually viewed.
7. **Medium — displayed quantity and effective purchase can disagree.** `js/app.js:328` silently ignores a nonpositive typed value: entering 0 leaves input displaying 0 while saved quantity remains 1 and total stays $7. A typed 1.7 silently truncates to 1. Quantity 999 is accepted into the cart but is correctly rejected at checkout. These numeric edits used DOM value plus real change-event dispatch; native form restrictions on inventory fields were not bypassed for the ordinary CRUD flow.
8. **Medium — search results reset after mutation without clearing the query.** `js/app.js:384` calls unfiltered `renderItems()`, whose default at `js/app.js:421` reloads all products instead of applying `currentSearchTerm`. Editing a single filtered product returned nine rows with the original query still visible. Checkout also exhibits this mismatch.
9. **Medium — storage corruption aborts initialization.** Unprotected JSON parsing at `js/app.js:74`, `js/app.js:85`, and `js/app.js:171` has no validation/recovery strategy. Injecting malformed JSON into `inventory_items` and reloading produced an uncaught SyntaxError and empty inventory/cart DOM. Schema-invalid data and cross-tab contention were not tested.
10. **Accessibility/UX — dynamic controls lose context or focus.** Cart quantity input at `js/app.js:292` has no label; +/− at `js/app.js:291`/`js/app.js:293` have only symbol names. Replacing the cart HTML at `js/app.js:283` leaves focus on BODY after clicking +. Editing scrolls to the form at `js/app.js:508` but leaves focus on Edit. Search at `index.html:45` has only placeholder text; no result/status live announcements are supplied. Keyboard form Tab from name to quantity worked. Screen-reader interaction was not tested.

## Browser evidence and tests

Executed `node quality-review/4x-rtxpro6000-qwen3.5-35b-a3b-q5kxl-probe.mjs` twice (second run refined the harmless injection marker and added order/focus evidence). Final exit 0. Probe used cached Puppeteer and installed Chrome, a new temporary browser profile, actual `file://` navigation, and `browser.close()` in `finally`. This is an observational audit script, not an application-supplied test suite or assertion pass count. The final run reported no page errors during normal workflows; its two uncaught errors were deliberately triggered failed-write/corrupt-JSON cases.

Verified: initial eight products; creation; rename/price edit; trimmed case-insensitive lookup; cart addition/increment/typed quantity/removal; cart reload; stock decrement; immediate order history/detail; broken history reload; inconsistent repriced order; invalid quantity handling; excess-stock checkout rejection; deleted-product checkout rejection; empty-inventory reload; executable-input marker; simulated failed order write; malformed inventory storage. Controls were clicked through Puppeteer, with ordinary keyboard typing for creation/search and an actual Tab check; numeric edge/edit values and fault injection were scripted in the DOM. No claim of a complete keyboard-only journey is made.

No supplied test files, package manifest or test runner were present. Original historical test counts in RESULTS were not treated as verification. Git generation commits, other browsers, assistive technology, cross-tab conflicts and performance at large catalog sizes remain unverified.

Screenshots captured at desktop 1440×1000 and mobile 390×844 with full-page content, then actually viewed:

- [Desktop](4x-rtxpro6000-qwen3.5-35b-a3b-q5kxl-desktop.png)
- [Mobile](4x-rtxpro6000-qwen3.5-35b-a3b-q5kxl-mobile.png)
- [Cart/form state](4x-rtxpro6000-qwen3.5-35b-a3b-q5kxl-cart.png)
- [Immediate order state](4x-rtxpro6000-qwen3.5-35b-a3b-q5kxl-order.png)
- [Raw probe results](4x-rtxpro6000-qwen3.5-35b-a3b-q5kxl-probe.json)

```json
{"folder":"4x-rtxpro6000-qwen3.5-35b-a3b-q5kxl","scores":{"ux":2.5,"visual":2,"code":2.5,"spec":3,"robustness":1,"accessibility":2},"overall_100":47.5,"tasks":{"base":"pass","T1":"artifact_pass_git_unverified","T2":"partial","T3":"pass_with_caveats","T4":"partial","T5":"pass_with_caveats","T6":"partial","T7":"not_applicable"},"comments":{"ux":"Discoverable desktop actions, but inaccessible reloaded history, stale search and scrolling burden harm everyday use.","code":"Readable named functions and simple structure; inline executable handlers, duplicated mutable data and missing storage boundaries cause serious defects.","business_rules":"Core flows exist; empty inventory persistence, history retrieval and consistent order pricing fail."},"supplied_tests":"none","browser_probe":"executed_exit_0","screenshots_viewed":true,"source_modified":false}
```
