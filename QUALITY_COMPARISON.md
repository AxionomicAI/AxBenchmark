# Inventory codebase quality comparison

Review date: October 1, 2026.

This report compares all **15 inventory applications**. Each application was reviewed by a fresh subagent, strictly one at a time, and the findings were consolidated using a shared rubric. This update reviewed Fable first, then started a new subagent for Astra after Fable finished; the previous 13 assessments are unchanged. Source-line references, browser probes and inspected screenshots are retained in [quality-review](quality-review/).

**Highest weighted grades: GPT-6 Astra, 4.35/5, and Fable 5.1, 4.33/5—effectively tied overall.** Fable has stronger UX and mobile presentation; Astra has stronger checkout integrity and spec adherence. Both earn 4.5/5 for code quality. **Strongest visual grades: Fable, GPT-5.6 Sol and GPT-6 Sol, all 4/5**, with readable, coherent layouts and mobile controls that fit. **Strongest GPU/local artifact: GPU GLM, 3.63/5**, although its mobile layout and failed-save behavior need work. These are judgments of the supplied implementations, not general rankings of the models.

**Fable versus Astra:** Both complete the required normal workflows and preserve historical purchase details. Fable keeps mobile actions visible and handles validation/focus carefully, but a compound checkout-write failure can leave an order recorded without stock deduction, and failed startup writes hide still-readable saved data. Astra commits stock, cart and history in one storage write and preserves them on failed checkout; its main weakness is mobile tables that hide essential controls until scrolled sideways. Neither supplied folder includes Git history, so historical commits and T7 execution remain unverified. Current tests and independent browser checks were executed for both.

Qwen 3.6 CPU has a broken cart/checkout, Qwen 3.8 CPU hides Checkout, and GPU Qwen fails to display saved history after reload. Gemma completes a simple purchase but can deduct stock during a rejected multi-item checkout. These are substantive workflow/business-rule failures, beyond visual polish.

Each category is graded **1–5**, with separate comments on **code quality**, **UX**, and **business rules/spec adherence** for every codebase. Half-points distinguish intermediate quality. The secondary weighted overall grade also uses **1–5**: UX 25%, visual 15%, code 20%, business rules/spec 25%, robustness 10%, and accessibility 5%. Test coverage is reported separately. Detailed reviewer notes also express that same weighted result on a /100 scale. See the [review protocol](quality-review/REVIEW_PROTOCOL.md).

**Scale:** 1 = missing or largely broken; 2 = major obstacles; 3 = usable with material gaps; 4 = strong with smaller defects; 5 = excellent for this small application scope. Scores are absolute judgments, not a curve: the best entry need not receive 5. Small overall differences are approximate ordering, not measured statistical superiority.

Business/spec grades assess the requirements in [the shared project specification](benchmark/tasks/00-project.md) and T1–T6, especially reachable cart operations, consistent stock/totals, durable checkout and history. Robustness grades separately emphasize failure recovery, malformed data and safe rendering. Accessibility covers labels, keyboard focus and announcements; visual grades cover hierarchy, legibility, spacing and desktop/mobile fit. Code quality includes maintainability and state/data boundaries.

Cloud artifacts include an additional T7 real-browser QA/fix opportunity; local artifacts stop at T6. The GLM GPU harness also uses a different generation protocol. Scores compare these delivered artifacts and should not be interpreted as a controlled ranking of underlying model capability. Generation speed, cost, and energy remain contextual figures in [COMPARISON.md](COMPARISON.md), not quality-score inputs.

**Specification ambiguity:** T5 asks users to “see the total” without specifying prices or currency. Grok implements a unit-count total and no pricing. It receives credit for that literal interpretation, but it does not support a monetary shopping workflow. In the other apps, contradictory prices/totals are still defects in their chosen implementation. Authentication, a backend, payments and advanced reporting were not required.

## Category grades — all 15 applications

Every category is graded **1–5**. Application names link to source references, observed behavior, test outcomes and screenshots. Full folder names are in the linked reports.

| Codebase | UX | Visual | Code | Business rules/spec | Robustness | Accessibility | Weighted overall /5 |
|---|---:|---:|---:|---:|---:|---:|---:|
| [GPT-6 Astra · cloud](quality-review/openai-cloud-gpt-6-astra-high.md) | 4 | 3.5 | 4.5 | 5 | 4.5 | 4.5 | 4.35 |
| [Fable 5.1 · cloud](quality-review/anthropic-cloud-fable-5.1-high.md) | 4.5 | 4 | 4.5 | 4.5 | 3.5 | 4.5 | 4.33 |
| [Opus 5.5 · cloud](quality-review/anthropic-cloud-opus-5.5-medium.md) | 4 | 3.5 | 4.5 | 4.5 | 3.5 | 4 | 4.10 |
| [GPT-5.6 Sol · cloud](quality-review/openai-cloud-gpt-5.6-sol-medium.md) | 3.5 | 4 | 4 | 4.5 | 3.5 | 4 | 3.95 |
| [DeepSeek Flash · cloud](quality-review/deepseek-cloud-deepseek-flash.md) | 3.5 | 3.5 | 4.5 | 4.5 | 3 | 4 | 3.93 |
| [GPT-6 Sol · cloud](quality-review/openai-cloud-gpt-6-sol-medium.md) | 3.5 | 4 | 4 | 4.5 | 3.5 | 3.5 | 3.93 |
| [Grok 4.7 Fast · cloud](quality-review/xai-cloud-grok-4.7-fast-500k-medium.md) | 3.5 | 3.5 | 4 | 4.5 | 3.5 | 3.5 | 3.85 |
| [Sonnet 5.5 · cloud](quality-review/anthropic-cloud-sonnet-5.5-medium.md) | 3.5 | 3.5 | 3.5 | 4.5 | 2.5 | 3.5 | 3.65 |
| [GLM 5.3 Flash · GPU](quality-review/4x-rtxpro6000-glm-5.3-flash-q4kxl.md) | 3.5 | 3 | 4 | 4.5 | 2.5 | 2.5 | 3.63 |
| [GLM 5.3 Flash · cloud](quality-review/zai-cloud-glm-5.3-flash.md) | 3 | 3 | 3.5 | 4 | 2.5 | 3.5 | 3.33 |
| [DeepSeek V4 Flash · GPU](quality-review/4x-rtxpro6000-deepseek-v4-flash-q8kxl.md) | 3 | 3 | 2.5 | 4.5 | 1.5 | 2.5 | 3.10 |
| [Qwen 3.8 27B · CPU](quality-review/ryzen7-8745hs-qwen38-27b-iq3.md) | 2.5 | 2.5 | 3 | 2.5 | 2 | 3 | 2.58 |
| [Qwen 3.5 35B · GPU](quality-review/4x-rtxpro6000-qwen3.5-35b-a3b-q5kxl.md) | 2.5 | 2 | 2.5 | 3 | 1 | 2 | 2.38 |
| [Gemma 4 26B · CPU](quality-review/ryzen7-8745hs-gemma4-26b.md) | 2.5 | 2.5 | 2 | 2.5 | 1 | 2.5 | 2.25 |
| [Qwen 3.6 35B · CPU](quality-review/ryzen7-8745hs-qwen36-35b.md) | 2 | 2.5 | 2 | 2.5 | 1.5 | 2.5 | 2.18 |

## Comments by codebase

| Codebase | Code quality | UX | Business rules/spec adherence |
|---|---|---|---|
| [GPT-6 Astra · cloud](quality-review/openai-cloud-gpt-6-astra-high.md) | Validated storage API, exact cents/BigInt totals, safe rendering and a single-write checkout preserve data integrity. A large imperative UI module and full-list rebuilding add maintenance cost. | Clear dialogs, validation, draft retention and focus recovery make desktop flows efficient. Mobile tables hide inventory actions and cart controls; tall rows and no cart shortcut add scrolling. | All required normal workflows pass. Failed checkout writes leave stock, cart and history unchanged, and receipts survive later product edits/deletion. Stale-save guards are useful but do not lock simultaneous tabs. |
| [Fable 5.1 · cloud](quality-review/anthropic-cloud-fable-5.1-high.md) | Cohesive domain APIs, isolated persistence, exact cent conversion, safe rendering and meaningful tests; multi-key checkout recovery remains incomplete. | Clear validation and careful focus restoration support complete flows. Mobile actions remain visible, but tall product cards and compact row controls reduce efficiency. | All ordinary direct-file inventory/cart/checkout/history requirements pass, with current cart prices and durable historical snapshots. A compound write failure can leave an order recorded without stock deduction; startup write failure hides still-readable saved data. |
| [Opus 5.5 · cloud](quality-review/anthropic-cloud-opus-5.5-medium.md) | Cohesive modules, explicit invariants, safe rendering and meaningful tests; checkout rollback and object-as-set edges need hardening. | Efficient desktop flows and feedback; mobile users must scroll sideways to reach row actions. | Full ordinary T1–T6 flow verified; sustained storage failure can leave deducted stock and a recorded order with an uncleared cart. |
| [GPT-5.6 Sol · cloud](quality-review/openai-cloud-gpt-5.6-sol-medium.md) | Clear store boundaries, explicit normalization and safe `textContent` rendering make this maintainable for a small vanilla application. The main weaknesses are inconsistent validation on persisted reads and full cart replacement that disrupts focus. | Efficient desktop inventory/cart layout and a clear modal support all normal tasks. Error feedback should also be visible, keyboard focus should survive quantity edits, and mobile users need a direct way to reach their cart. | Meets the stated framework-free, direct-file, localStorage, inventory management, lookup, cart and checkout requirements. Stock, price and order history remained consistent through the exercised normal workflows and failed checkout save. |
| [DeepSeek Flash · cloud](quality-review/deepseek-cloud-deepseek-flash.md) | Cohesive modules, pure domain functions, safe rendering and substantive regression coverage; persistence coordination remains imperfect. | Clear inventory actions and feedback; mobile price clipping and long scroll to cart weaken usability. | Required direct-file CRUD/search/cart/checkout/history flows pass; rejected writes can leave receipt and stock inconsistent. |
| [GPT-6 Sol · cloud](quality-review/openai-cloud-gpt-6-sol-medium.md) | A compact, understandable data/UI split with sound cents-based calculations and safe rendering. Error handling is uneven, and list rebuilding trades simplicity for focus loss and unnecessary repeated storage reads. | Easy to understand and operate on desktop or phone, with clear labels and totals. Add-to-cart and edit cancellation should retain useful focus; deletion needs an undo or confirmation, and failed saves need an actionable visible explanation. | All requested workflows function, persist and agree with stock and pricing in the tested normal flow. Cart quantities clamp to edited stock, product deletion removes related cart entries, and orders retain purchased names/prices after product deletion. |
| [Grok 4.7 Fast · cloud](quality-review/xai-cloud-grok-4.7-fast-500k-medium.md) | Clear domain modules, safe rendering and defensive normalization; large redraw-heavy UI and non-atomic checkout rollback. | Good CRUD/search/validation; distant cart feedback, keyboard focus loss and clipped mobile Remove control. | Literal stock/cart/order requirements verified. Total means units; no prices. Continuing storage failure can deduct stock without saving an order. |
| [Sonnet 5.5 · cloud](quality-review/anthropic-cloud-sonnet-5.5-medium.md) | Readable module separation and safe DOM construction; duplicated persistence fallback and weak record validation need work. | Efficient desktop search and CRUD, but mobile tables hide stock/actions and cart total until panned. | All normal required flows pass; failed stock writes can still produce successful orders without stock deduction. |
| [GLM 5.3 Flash · GPU](quality-review/4x-rtxpro6000-glm-5.3-flash-q4kxl.md) | Clear data/cart/order modules, central validation and safe rendering. Failed persistence results are ignored across the checkout sequence. | Useful desktop management and feedback; mobile whitespace/overflow and modal focus escape make operation harder. | Normal rules pass, including current prices, stock clamping and historical snapshots. A failed order save can consume stock and clear the cart while reporting success. |
| [GLM 5.3 Flash · cloud](quality-review/zai-cloud-glm-5.3-flash.md) | Clear store/UI separation, safe rendering and 71 passing tests; ignored persistence outcomes and incomplete render dependencies cause defects. | Straightforward desktop flows, but stale disabled cart actions, lost keyboard focus and mobile horizontal scrolling hinder use. | All requested features work normally; stock/cart reconciliation is sound, but failed history writes can consume stock without retaining the order. |
| [DeepSeek V4 Flash · GPU](quality-review/4x-rtxpro6000-deepseek-v4-flash-q8kxl.md) | Readable named functions, but global state and unsafe attribute rendering cause real defects; persistence writes have no coordinated failure handling. | Basic desktop flow is clear. Cart-add opens an unrelated details panel, Value sorting fails, and mobile actions sit offscreen. | Normal stock/cart/checkout/history passes. Cart prices stay stale after edits, and a rejected order write can consume stock without a saved purchase. |
| [Qwen 3.8 27B · CPU](quality-review/ryzen7-8745hs-qwen38-27b-iq3.md) | Readable data/UI functions and safe text rendering, but missing checkout visibility, weak storage validation and partial checkout writes. | CRUD/search/cart are straightforward; checkout is inaccessible and the mobile cart overflows. | Direct-file vanilla/localStorage and T1–T5 work; hidden Checkout prevents ordinary T6 completion despite working internal order logic. |
| [Qwen 3.5 35B · GPU](quality-review/4x-rtxpro6000-qwen3.5-35b-a3b-q5kxl.md) | Readable named functions and simple structure; inline executable handlers, duplicated mutable data and missing storage boundaries cause serious defects. | Discoverable desktop actions, but inaccessible reloaded history, stale search and scrolling burden harm everyday use. | Core flows exist; empty inventory persistence, history retrieval and consistent order pricing fail. |
| [Gemma 4 26B · CPU](quality-review/ryzen7-8745hs-gemma4-26b.md) | Readable small stores, but unsafe HTML rendering, destructive full rerenders, and stock mutations before checkout validation. | Normal flows are discoverable; draft loss, distant cart feedback, lost keyboard focus, and invisible stale cart items impede recovery. | Happy-path stock/history persistence works; rejected checkout consumes stock, empty inventory reseeds, and deleting products leaves cart state inconsistent. |
| [Qwen 3.6 35B · CPU](quality-review/ryzen7-8745hs-qwen36-35b.md) | Readable inventory functions, but DOM/argument/return-value mismatches leave major features unintegrated; no supplied tests. | CRUD and live search work; cart silently does nothing, Orders opens the wrong form, and mobile actions are clipped. | Direct-file vanilla/localStorage inventory is usable, but required cart, checkout and history are broken and empty inventory reseeds. |

## Browser verification and supplied tests

Every app was opened directly through `file://` in an isolated Chrome profile/context, with desktop **1440×1000** and mobile **390×844** inspection. Screenshots were actually viewed. Reviewers exercised normal UI actions where possible and identified scripted DOM interactions or fault-injection diagnostics separately. A synthetic invocation of inaccessible checkout code was **not** counted as a passing user workflow.

| Codebase | Normal cart → purchase → reload evidence | Supplied automated checks executed |
|---|---|---|
| GPT-6 Astra cloud | Passed; failed checkout write preserves all saved state, and historical receipts survive product changes/deletion. | 31/31 passed: 17 storage and 14 Playwright browser tests; no skips. Independent browser probe also completed. |
| Fable cloud | Passed; stock and historical snapshots remain correct through product edits/deletion. Compound write failure can leave a phantom order. | 118/118 passed across inventory, cart, orders, search and formatting. Independent browser probe passed 25 assertions. |
| Opus cloud | Passed; order snapshots retained after product deletion. | 48/48 passed: inventory 19, cart 13, orders 16. |
| GPT-5.6 cloud | Passed; tested order-write failure rolled back successfully. | None supplied; JavaScript syntax check passed. |
| DeepSeek cloud | Passed; failed-write probes found stock/receipt inconsistency. | 708 checks passed across 72 smoke-test sections. |
| GPT-6 cloud | Passed; tested cart-clear failure rolled back stock and history. | None supplied; both JavaScript syntax checks passed. |
| Grok cloud | Passed with **unit totals only**; persistent rollback failure remains. | None supplied. |
| Sonnet cloud | Passed; failed stock writes can nevertheless record a purchase. | None supplied. |
| GPU GLM | Passed; failed order writes can nevertheless consume stock. | 146 passed: data 41, cart 61, orders 44. UI suite **skipped** because `jsdom` is absent, despite exit 0. |
| Cloud GLM | Passed; stale Add-to-cart state obstructs repeat use. | 71/71 passed: store 44, UI 27. |
| GPU DeepSeek | Passed; failed order writes can nevertheless consume stock. | None supplied; JavaScript syntax check passed. |
| CPU Qwen 3.8 | **Blocked:** Checkout remains hidden. Internal diagnostic success is not a UI pass. | None supplied; JavaScript syntax check passed. |
| GPU Qwen 3.5 | Purchase works; **saved history is invisible after reload**, and repricing can make order totals inconsistent. | None supplied. |
| CPU Gemma | Simple purchase passes; **rejected multi-item purchase can consume stock without an order**. | None supplied. |
| CPU Qwen 3.6 | **Blocked:** Add to Cart does nothing; cart is blank; Orders opens the wrong form. | None supplied. |

These counts use different test granularity and are **not comparable quality scores**. Several suites use fake DOM/storage implementations and miss layout, focus and mid-session persistence failures. The audit probes are additional review evidence, not pre-existing application tests. Historical `RESULTS.md` pass labels were not accepted as current verification.

## Visual assessment

| Codebase | Visual judgment supporting its grade |
|---|---|
| GPT-6 Astra cloud | Restrained light panels, strong headings and consistent desktop controls. At 390px, 672px inventory tables sit inside 324px scrolling regions; tall rows hide actions to the right, and cart controls are partially clipped. |
| Fable cloud | Clear blue/neutral hierarchy, aligned desktop table and readable stock badges. Mobile cards, forms and cart fit without horizontal overflow, but tall cards create a long page. |
| Opus cloud | Clean blue/white hierarchy and readable tables; mobile stock and actions require sideways scrolling. |
| GPT-5.6 cloud | Cohesive green/neutral styling and balanced desktop columns; mobile content and modal fit, though the cart is far below the list. |
| GPT-6 cloud | Restrained green cards, clear type and aligned controls; product actions wrap visibly on phones without horizontal overflow. |
| DeepSeek cloud | Consistent dark presentation and sensible mobile list wrapping; mobile price input is clipped. |
| Grok cloud | Readable dark table and clear confirmations; tall mobile rows and slightly clipped cart actions reduce polish. |
| Sonnet cloud | Orderly navy/white styling and forms; narrow tables wrap heavily and hide totals/actions behind horizontal scrolling. |
| GPU GLM | Readable desktop table and stock badges; excessive mobile whitespace and page overflow. |
| Cloud GLM | Consistent blue actions and aligned figures; dense table-only mobile presentation hides key columns. |
| GPU DeepSeek | Coherent navy header and white sections; large creation form, tiny row icons and offscreen mobile actions. |
| CPU Qwen 3.8 | Basic but readable desktop structure; crowded buttons and mobile cart overflow. |
| GPU Qwen 3.5 | Consistent basic styling, but the mobile page expands to 789px at a 390px viewport. |
| CPU Gemma | Legible tables and headings; basic spacing and mobile action buttons stacked against one another. |
| CPU Qwen 3.6 | Coherent desktop cards/badges; mobile width reaches 490px and clips product actions. |
