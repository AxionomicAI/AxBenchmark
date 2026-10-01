# ryzen7-8745hs-qwen38-27b-iq3 — quality review

Reviewed 2026-10-01 against `benchmark/tasks/00-project.md` and T1–T6. Fresh isolated Chrome profile; actual `file://` launch; all 741 HTML/CSS/JavaScript lines plus README and Git history inspected. No application changes.

| Category | Grade /5 | Finding |
|---|---:|---|
| UX | 2.5 | Straightforward CRUD/search/cart, but the purchase journey stops because Checkout never becomes visible. |
| Visual design | 2.5 | Clear, readable desktop table with consistent spacing; basic styling, crowded row buttons and an overflowing mobile cart. |
| Code quality | 3 | Understandable data/UI functions and safe text rendering; missing UI-state wiring, repeated storage reads and incomplete state validation. |
| Business rules/spec adherence | 2.5 | T1–T5 behavior works, including persistence; T6 cannot be completed through the UI and its work is uncommitted. |
| Robustness | 2 | Normal persistence works, but malformed product records crash rendering and a failed order write leaves stock already deducted. |
| Accessibility | 3 | Native controls, labels, semantic sections/table headers and live cart count; keyboard quantity changes lose focus and mobile controls are cramped. |

Weighted overall: **51.5/100** using the common protocol. Scores describe this artifact, not model quality generally.

**Code quality:** Small, readable functions separate product/cart/order operations from rendering, and product names use `textContent`. Correctness is weakened by missing checkout visibility management, synchronous storage reads inside per-item joins, non-atomic checkout writes and only superficial validation of persisted records.

**UX:** Product creation, editing, live name search and cart totals are readily discoverable. Customers cannot find a checkout action, receive no advance warning when adding zero-stock/excess quantities, and encounter horizontal overflow in the mobile cart.

**Business rules/spec adherence:** Direct-file vanilla JavaScript, sample inventory, CRUD, search and persistent cart meet the main requirements. Checkout exists internally and preserves order snapshots when invoked programmatically, but is inaccessible to an ordinary user; that is a failed T6 deliverable, not a passing checkout flow.

## Requirement verification

| Task | Status | Evidence |
|---|---|---|
| T1 scaffold, README, Git commit | Pass | Three-file structure and README; Git commit `5df664c`. |
| T2 seeded persistent stock | Pass | Five seeded products including a zero-stock product; product changes survived reload; commit `12e0bd2`. |
| T3 view/add/edit/delete | Pass | Created a product, edited name/price, deleted it with confirmation; commit `6c9c49a`. |
| T4 quick lookup | Pass | Case-insensitive live search found `Review Widget` with `review WIDGET`; clear restores inventory; commit `b9f309e`. |
| T5 persistent cart | Pass | Add, quantity change, remove, total and reload verified; commit `4f065eb`. |
| T6 checkout/history, README and commit | Fail | Checkout remains `hidden`/`display:none` with a populated cart. Synthetic click succeeds internally, but ordinary UI cannot purchase. Checkout implementation/README/CSS/HTML remain modified after the last T5 commit. |
| T7 browser QA | Not required | Local run; no penalty for absent T7. This review's browser probe is separate evidence. |

## Confirmed defects and source evidence

1. **Purchase action is inaccessible.** `index.html:81` defines Checkout with `hidden`; `js/app.js:368`–`423` updates other cart visibility but never updates `checkoutButton.hidden`. Browser inspection with a populated cart returned `hidden:true`, `display:none`, and a zero-size rectangle. The checkout listener at `js/app.js:476` is unreachable through normal click/keyboard use.
2. **Checkout writes can partially commit.** `js/app.js:162` deducts stock before `js/app.js:182` saves the order and `js/app.js:183` clears the cart. With a deliberately injected `QuotaExceededError` only on the order key, synthetic checkout reduced Wireless Mouse stock **42 → 41**, retained the cart, and added no order. The exception is uncaught. This diagnoses internal code after explicitly bypassing defect 1; it is not an ordinary completed user flow.
3. **Malformed persisted product records crash initialization.** `js/app.js:35` checks only that storage contains an array; `js/app.js:22` assumes every item is a product object. Setting the product key to `[null]` and reloading produced `Cannot read properties of null (reading 'price')`, leaving misleading default empty sections. Invalid JSON fallback exists, but record validation does not.
4. **Cart accepts impossible quantities without immediate feedback.** `js/app.js:79`–`87` adds without stock validation; `js/app.js:91`–`100` rounds rather than bounds quantities, and `js/app.js:393`–`401` supplies no maximum. A zero-stock HDMI Adapter was added successfully; quantity 999 remained in a cart against stock 4. Synthetic checkout correctly refused and clamped to 4, but users cannot reach that feedback due to defect 1. Input 1.5 silently became 2; input 0 removed the line. README claims quantities are clamped during cart mutation (`README.md:63`–`64`), which is inaccurate.
5. **Mobile cart overflows and quantity updates lose keyboard focus.** At 390×844, document width became **429px**, with the cart extending past the viewport. Table/number sizing is fixed without an overflow wrapper or responsive treatment (`css/styles.css:8`, `css/styles.css:89`). Clicking the quantity field and pressing ArrowUp updated its quantity 2 → 3 but moved focus to `BODY`: the change handler rebuilds the cart (`js/app.js:378`, `js/app.js:399`). Repeated row actions also have generic accessible names and compact targets (`js/app.js:348`, `js/app.js:355`, `css/styles.css:81`).

Additional static observations: money uses floating-point multiplication/summation (`js/app.js:172`, `js/app.js:381`) with formatting only; no demonstrated monetary error in tested values. `getCartItems()` reloads/parses the entire product list for every item (`js/app.js:189`–`200`, `js/app.js:43`). README documents nonexistent `getCartTotal()` and omits the required price argument in `addProduct` (`README.md:54`, `README.md:65`). None of these observations is represented as an unexecuted browser failure.

## Executed checks and visual inspection

Normal user interactions used Puppeteer clicks/typing, with selected input values and change events set through DOM scripting. Verified first-run seed; create/edit/search/clear; add/remove; quantity 3 with **$46.50** total; product/cart persistence after reload; price edits reflected in cart; deleting a product cleaned its cart line and retained the existing historical order. Native form submission rejected fractional stock (`stepMismatch:true`). Keyboard Tab reached the labelled name input, Edit focused it, and genuine ArrowUp in the cart reproduced focus loss.

After confirming inaccessible checkout once, a **synthetic DOM `.click()` on the hidden button** verified the internal success path: stock 5 → 4, one $15.50 order, empty cart, and persisted stock/history after reload. The excess-stock, failed-write and order screenshot diagnostics use this same explicit bypass; they do not change the failed T6 judgment. No application source or CSS was patched.

Actually viewed all four screenshots:

- [Desktop seed state, 1440×1000](ryzen7-8745hs-qwen38-27b-iq3-desktop.png): readable centered 800px content, clear heading sizes and generous whitespace; buttons touch each other and the empty cart badge appears as a dark dash.
- [Desktop populated cart](ryzen7-8745hs-qwen38-27b-iq3-cart-desktop.png): aligned totals and quantity input, but only Clear cart is available at the purchase endpoint.
- [Mobile, 390×844 viewport](ryzen7-8745hs-qwen38-27b-iq3-mobile.png): form wraps sensibly; inventory actions stack tightly; six rows push the cart far down; cart extends horizontally outside the viewport. Full-page capture includes off-screen content.
- [Order history diagnostic](ryzen7-8745hs-qwen38-27b-iq3-orders-diagnostic.png): legible persisted order table, only reachable here by the synthetic checkout diagnostic.

Strongest positive: product/cart consistency is handled through current-product joins, safe text nodes and snapshot order lines (`js/app.js:166`, `js/app.js:187`, `js/app.js:337`); normal CRUD/cart behavior is concise and functional.

Supplied tests: **none found**. `node --check ryzen7-8745hs-qwen38-27b-iq3/js/app.js` passed. Audit probe command `node quality-review/ryzen7-8745hs-qwen38-27b-iq3-probe.mjs` completed; [source](ryzen7-8745hs-qwen38-27b-iq3-probe.mjs), [structured observations](ryzen7-8745hs-qwen38-27b-iq3-probe.json). Expected exceptions were captured only during deliberate storage fault injection. Browser closed in `finally`.

Limitations: Chrome only; accessibility spot checks, not assistive-technology certification; no cross-tab test, large-dataset performance measurement, exhaustive empty-state/delete-all test, or long-duration persistence test. The script was rerun once after adding a genuine keyboard focus check. Git history was read, not modified; the app's pre-existing working-tree changes were preserved.

```json
{"folder":"ryzen7-8745hs-qwen38-27b-iq3","scores":{"ux":2.5,"visual":2.5,"code":3,"spec":2.5,"robustness":2,"accessibility":3},"overall_100":51.5,"tasks":{"T1":"pass","T2":"pass","T3":"pass","T4":"pass","T5":"pass","T6":"fail","T7":"not_required"},"comments":{"code":"Readable data/UI functions and safe text rendering, but missing checkout visibility, weak storage validation and partial checkout writes.","ux":"CRUD/search/cart are straightforward; checkout is inaccessible and the mobile cart overflows.","business":"Direct-file vanilla/localStorage and T1–T5 work; hidden Checkout prevents ordinary T6 completion despite working internal order logic."},"supplied_tests":"none","browser_verified":true,"screenshots_viewed":true}
```
