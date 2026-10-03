# Quality review protocol

Review date: 2026-10-01. This is a review of the supplied artifacts, not a new model benchmark. Do not modify application source, create CI/CD, or rerun model generation.

Environment update after initial reviews: the user disabled the sandbox. Browser probes can now run directly; do not provide `sandbox_permissions` or ask for launch approval. Earlier review delays were tooling/approval delays, not application defects.

Each folder is reviewed by a fresh subagent, strictly sequentially. Supporting infrastructure is reviewed separately from inventory applications.

## Common specification

Read `benchmark/tasks/00-project.md` and T1–T7. The common deliverable is a framework/library-free HTML5 + vanilla JavaScript inventory site that works by opening `index.html` directly. Data must use localStorage.

- T1: basic project structure, README, Git initialization and commit (verify historical Git claims only if evidence is supplied).
- T2: seeded products with stock and persistence, with seed data on first run.
- T3: view, add, edit, and delete products.
- T4: quickly find products.
- T5: add to cart from inventory, change quantities, remove items, show total, persist cart.
- T6: checkout updates stock and preserves an order history; README updated.
- T7: real-browser QA/fixes requested for cloud runs only. Do not penalize local runs for not having T7. Test files are useful evidence, not proof that T7 occurred or that the app works.

Authentication, servers, frameworks, advanced reporting, transactional databases, and cloud deployment were not required. Accessibility, responsive design, storage failure behavior, and automated tests are additional quality dimensions, not invented specification requirements.

## Review procedure

1. Read the folder's README, implementation files, and tests. Treat RESULTS.md as historical claims, not current verification. Do not read other application reviews before forming your assessment.
2. Open the actual `file:///Users/mike-axionomic/Downloads/comparison/FOLDER/index.html` in a NEW isolated browser context/profile for this folder. Prefer a self-contained browser probe with the already cached Puppeteer at `/Users/mike-axionomic/.npm/_npx/668c188756b835f3/node_modules/puppeteer` and Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, unique `/tmp` userDataDir, headless mode, closing browser in finally. This avoids profile locks across fresh agents. Chrome DevTools MCP is also available (tools/schema via ALL_TOOLS; pageId required), but its shared profile needs release between reviewers. Do not clear or change normal user contexts. Direct-file operation is an explicit requirement. Sandbox launch failures must use explicit escalation, not bypasses. Save any browser probe as `quality-review/FOLDER-probe.mjs`; it is audit evidence, not an application test/source change.
3. Inspect at 1440×1000 desktop and 390×844 mobile. Save and actually view PNG screenshots to `quality-review/FOLDER-desktop.png` and `quality-review/FOLDER-mobile.png`. Inspect important forms/cart/order states as well as the landing page. Describe concrete hierarchy, spacing, legibility, responsive layout, and feedback.
4. Exercise the meaningful normal flow: initial seed, create/edit/search a product, add to cart, change quantity/remove, checkout, verify stock and history, reload to check persistence, delete a product. Batch DOM interaction with evaluate_script when useful, but distinguish scripted interactions from genuine click/keyboard behavior and test focus/keyboard separately where feasible. Record precisely what was verified; never claim unexecuted checks passed.
5. Probe a few relevant edge cases grounded in the code: zero/excess/fractional quantities, cart after product edits/deletion, empty states, keyboard/focus/accessibility, malformed persisted data or failed writes. Prioritize confirmed user-impacting defects. Clearly label static risks vs browser reproductions. Do not claim cross-tab or corrupt storage failures were tested if only inferred.
6. Run supplied tests if feasible and record exact commands, outcomes/counts, and limitations. No unnecessary dependencies or newly created application tests. Inspect source for unsafe rendering, state boundaries, money handling, persistence, duplication, dead code, and meaningful test coverage.
7. Write `quality-review/FOLDER.md` containing scores, T1–T6 status, observations, tested flows and outcomes, desktop/mobile screenshot links, strongest positive, top defects with relative file paths and exact line numbers, supplied-test results, and limitations. Include three explicit short comments: **Code quality**, **UX**, and **Business rules/spec adherence**. End with a compact JSON object carrying scores and task statuses for synthesis. Return a concise summary to the parent.
8. Close your review page/context if supported; leave source unchanged. Do not spawn subagents.

## Scores and synthesis

Use 1–5, permitting half-points: 1 missing or largely broken; 2 major obstacles; 3 usable with material gaps; 4 strong with smaller defects; 5 excellent for this small application scope. Scores are informed judgments, not benchmark percentages. Score absolute artifact quality, not model reputation, hardware, cost, or historical task labels. The user explicitly requested a 1–5 grade per category and comments on code quality, UX, and business-rule adherence. Keep the overall weighted score secondary.

- UX: discoverability, efficient flows, validation, feedback, recovery (25% of overall).
- Visual: coherent hierarchy, typography, spacing, density, desktop/mobile polish (15%).
- Code: readability, cohesive state/data responsibilities, correctness-oriented design, duplication, maintainability (20%).
- Business rules/spec: verified fidelity to actual T1–T6 requirements, especially stock/cart/checkout/history, plus base direct-file/vanilla/localStorage constraints (25%). Unavailable Git history is marked unverified, not automatically failed. Keep JSON key `spec` for compatibility.
- Robustness: data integrity, edge cases, persistence failure handling, safe rendering (10%).
- Accessibility: labels, semantics, keyboard access, focus and announcements, responsive legibility (5%). This is a spot check, not a WCAG certification.
- Automated tests: report execution and coverage separately, without giving an advantage simply for test-file quantity.

Keep scoring calibrated: a cosmetic flaw should not dominate a core-workflow break; passing the happy path is not sufficient for 5; extra features do not excuse unmet requirements. Any overall score is the weighted score above, converted to /100. Cost, speed, energy and generation protocol from COMPARISON.md are context only and not quality-score inputs.
