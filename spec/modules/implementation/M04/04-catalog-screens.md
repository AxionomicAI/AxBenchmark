# M04.4 — catalog-screens

Parent: [M04 screens](../../04-model-catalog.md#4-screens). Requirements: R010, R061–R065, R081, R137, R152, R156, R157. Findings: F16 separate account billing, F19 rate units; consumes F04/F05 subscriptions, F07/F08 accounting ownership and F15 foundations.

Outcome: catalog browsing, selection and separate model/account/currency editors with one matching save command each. Proposed UI work; fake-client rendering is not real-provider acceptance.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M04.2](02-catalog-discovery.md), [M04.3](03-price-rate-sources.md), M15.1 `tui-foundation` and M15.2 `tui-shell` from the [foundation contract](../../ARCHITECTURE.md#executable-foundations-and-child-spec-boundaries). Reuse shared modal/widgets, focus, subscriptions and view lifecycle.

**Bootstrap-published contracts, allowed as injected fixtures:** M07 `configs.add_entry/update_entry` and Setup navigation; M03 Environment→Catalog entry; M16 planner selection consumer; M12 judge capability checks; M14 CLI parity cases. Their real screens/consumers are integration gates, not entry dependencies.

**Wireframe contract prerequisite:** navigation work resolves F16/F19: add CatalogBilling, remove billing from CatalogOverride, and correct CatalogRates to currency units per 1 USD with COP `4000`. The parent screen/API contract governs behavior while this source/artboard work is pending.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/tui/screens/catalog.py` (`CatalogScreen`, `OverrideScreen`, `BillingScreen`, `RatesScreen`); `axbenchmark/tui/screens/entry_picker.py` (`EntryPickerScreen`).
- `axbenchmark/tui/viewmodels/catalog.py`, `entry_picker.py`; `axbenchmark/tui/styles/catalog.tcss`, `entry_picker.tcss`.
- `tests/tui/test_catalog_viewmodels.py`, `test_catalog_screen.py`, `test_catalog_override.py`, `test_catalog_billing.py`, `test_catalog_rates.py`, `test_entry_picker.py`, `test_catalog_subscription.py`.
- `tests/tui/fixtures/catalog/overview.json`, `refresh_failed.json`, `entry_override.json`, `account_billing.json`, `rates.json`, `picker.json`, `picker_unknown.json`, `query_error.json`.

M07 owns Setup and its entry navigation/validation; it imports this picker through the shared navigation seam. M15 owns the shell and cross-module integration; M14 owns CLI commands. This child does not edit engine files, compute eligibility or duplicate another owner's screen.

Use only `EngineClient` and parent API models. `ActionState` controls bindings; typed errors keep message/field/remedy. View models display returned sources/age and billing labels verbatim. They do not resolve layers, calculate conversions, infer authentication, validate compatibility or classify zero costs.

| Exact board/state | View/action contract |
|---|---|
| Catalog (wide/compact) | Context tree/select, models/detail, default/source/age/billing/rate summary. `f5` refreshes selected context; `o` opens model override; `b` opens account billing; `x` opens rates; `y` opens read-only YAML. |
| CatalogRefreshFailed | Keep usable rows; show distinct failure and last-valid age with Retry. Failure is a banner over content, not an empty model table. |
| CatalogOverride | Model efforts/default/image/prices/currency only; modes inherit/value/unknown. Save emits only `catalog.save_override`; remove uses confirmation then only `catalog.remove_override`. |
| CatalogBilling (wide/compact) | Full account identity and all-model/all-version effect, inherited source and declaration mode. Save emits only `catalog.save_account_override(harness,target,account_id,billing)`. |
| CatalogRates (wide/compact) | Currency units per 1 USD, COP `4000`, source/as-of/retrieved labels and USD identity. Save emits only `catalog.save_rate_override`; no editable reciprocal. |
| ModelPicker | Explicit model selection, returned effort choices; label harness default without preselecting a competitor model. Save calls M07 add/update entry. |
| ModelPickerUnknown | Only returned `harness_default` effort with omit explanation. Missing capability/authentication is not upgraded to ready. |
| Other parent states | Loading, empty context/model list, query error/retry, unknown fields, invalid/malformed override, pending save, inline field error, cancelled refresh and no-harness selection block. Rates always retains USD identity; no collected rates is not a fabricated empty table. |

Billing loads `ContextDTO.billing_form` by the full account key and rates loads each `RateDTO.override_form`; never reconstruct modes from resolved data. Value widgets enable only for Value mode. Inherit/unknown preserve their exact wire literals. Account/price edits have no hidden second command.

Observe revisioned `catalog` plus the returned `job:<job_id>` through M15's `EventCursor` manager. Re-query visible detail/entries after relevant context/price/account changes and every snapshot replacement; rate changes reload rates. Changed topics use a fresh handoff. Cancel stale selection requests and unsubscribe on unmount without cancelling engine work.

## Acceptance and faults

Run:

```sh
pytest tests/tui/test_catalog_viewmodels.py tests/tui/test_catalog_screen.py tests/tui/test_catalog_override.py tests/tui/test_catalog_billing.py tests/tui/test_catalog_rates.py tests/tui/test_entry_picker.py tests/tui/test_catalog_subscription.py
```

Use pure view-model checks and Textual `App.run_test()`/Pilot at 120×40 and 80×24. Include keyboard/mouse, focus restoration, scrolling, Escape and dimmed unavailable actions via M15's harness.

1. Render every listed board/state with schema-valid fixtures. Unknown/source/date/default labels survive compact layout. Refresh failure retains rows and `f5`/Retry submits exactly once; disabled actions submit nothing.
2. Save billing Value, Unknown and Inherit. Assert one account command with exact harness/target/account id, account-wide explanation and declared label. Inline cloud-local rejection retains the form. Cancel submits nothing. A model save never contains billing or triggers an account call.
3. Save model efforts/prices with mixed modes and explicit currency. Echo typed values without calculating support; engine field errors remain inline. Remove decline/Escape sends nothing; confirmed removal sends once and returns focus correctly.
4. Enter COP `4000`, save/reopen and assert request/response/form all retain `4000`. No reciprocal calculation occurs. Cover EUR, missing rate, supplied unknown, read-only USD, invalid currency/as-of and source-failure banner with preserved rows.
5. Picker shows only returned choices; unknown effort sends `harness_default`. Selecting/editing a competitor calls exactly one M07 add/update request with explicit model. No-harness and unknown-image errors preserve remedies; no screen invents another model.
6. Delay detail A, select B, deliver A last; B remains visible. Reconnect with older replay/new epoch, change job topics and overflow: refreshed projection wins, forms avoid stale replacement, and no refresh/save is resubmitted. Unmount leaves the job running.

**Real-source/provider integration gate:** through real M04 services, edit account A with two models while account B remains unchanged; edit one model without changing billing; save/reopen rates; refresh/offline/failure transitions retain provenance. Compose actual M07 Setup, M03 Environment, M16/M12 consumers and M14 commands; verify matching scope/errors and M15.3 navigation. Real M07/M10/M02/M17 must prove the COP freeze/conversion/export round trip; the UI test does not compute it.

**Pending parent obligations:** current-source/harness verification and all downstream accounting/retention gates from M04.2–3; navigation's corrected/generated previews; M14 parity and M15.3 integrated workflows. Fake rendering alone cannot complete M04 or establish provider access.
