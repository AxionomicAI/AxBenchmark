# Task 7 test report

## Environment and method

Tested the actual `index.html` through `file://` in Google Chrome
154.0.8037.58 on macOS, using Playwright with isolated browser contexts.
Both headless and visible Chrome were exercised. The application was not served
through HTTP, and the first-run workflow also ran with the browser offline.
Tests interact through buttons, labeled inputs, native forms, and keyboard events.
Direct storage access is used for assertions and deliberately corrupt/failing data.

The reusable suites contain 14 browser tests and 17 storage tests. All 31 pass.
The browser suite checks for uncaught JavaScript errors and console errors.
See the README for installation and local test commands. Playwright is a
separate development tool; the application still has no dependencies or build step.

## Bugs reproduced and fixed

| Bug | Reproduction | Resolution |
| --- | --- | --- |
| Lost quantity drafts | Add a notebook, type quantity 5 without Update, then add a pen. The notebook field reverted to 1 and checkout could buy that saved quantity without a draft warning. | Keep unapplied drafts across cart rerenders, remove them after a successful update/removal, and continue requiring Update before checkout. Empty drafts and failed-save retries are covered. |
| Valid decimal price rejected | Create a product with price `.50`. The form rejected it despite representing a valid fifty-cent price. | Accept a decimal without its leading zero while retaining the two-decimal limit and price bounds. |
| Stale tabs overwrite saved changes | Open two tabs, change notebook stock from 24 to 30 in one, then edit the pen in the other. Notebook stock reverted to 24. The same path could restore stock after a purchase. | Inventory/cart saves from the UI compare their previously loaded snapshots with storage and reject stale changes with reload guidance. Checks cover legacy and consolidated storage. |
| Narrow page overflow | Add the maximum supported quantity at the maximum price, then view the cart at 320px. Its total widened the page to 415px. | Allow long panel text and totals to wrap. The page now remains 320px wide while tables scroll inside their panels. |

## Verified workflows

- First-run samples, zero-stock controls, offline assets, reload persistence,
  preserved empty inventory, and adding again after deleting every product.
- Product creation, editing, deletion, trimming, Cancel/Escape, duplicate SKUs,
  required fields, and invalid/boundary stock and prices.
- Case-insensitive name/SKU search, whitespace, empty results, clearing, and
  adding/editing/deleting with a filter active without losing hidden products.
- Repeated cart additions, exact cent totals, quantity updates with Enter,
  invalid quantities, stock limits, removal, draft retention, and reloads.
- Updated inventory names/prices in the cart; warnings and blocked checkout
  after reducing stock, setting it to zero, or deleting a cart product.
- Checkout stock deduction, cart clearing, free orders, double-click protection,
  receipt focus and keyboard expansion, immutable snapshots, and newest-first history.
- Failed product/cart writes; failed checkout before/after migration; successful
  retries; malformed inventory/cart/consolidated data; blocked storage reads.
- Stale product edits, stale cart changes, stale checkout, and protecting stock
  after a purchase in another tab.
- Markup displayed as text, maximum exact totals, keyboard-only product creation,
  forward/reverse dialog navigation, focus restoration, and mobile table access.
- Layout at 320, 375, 768, and 1280px; visual inspection of desktop inventory,
  narrow cart totals, and a scrollable product dialog.

## Scope limits

Browser execution was in Chrome; Safari and Firefox were not tested. Narrow
viewports simulate responsive layouts, not physical mobile devices. Storage
checks detect earlier changes but do not provide locking for simultaneous writes
from multiple tabs. No CI/CD was added or enabled.
