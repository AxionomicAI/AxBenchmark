// Frozen M09 acceptance.v1 catalog. Full observation contract lives in M09; these are display fixtures.
export const CHECKS = [
  [
    "T1_repository",
    "Repository initialized",
    "repo"
  ],
  [
    "T1_readme",
    "Project README exists",
    "repo"
  ],
  [
    "T1_scaffold",
    "HTML5 scaffold exists",
    "browser"
  ],
  [
    "T1_runtime",
    "Vanilla runtime",
    "browser"
  ],
  [
    "T1_direct_file",
    "Direct-file entry works",
    "browser"
  ],
  [
    "T1_commit",
    "T1 committed",
    "repo"
  ],
  [
    "T2_products",
    "Products carry stock",
    "browser"
  ],
  [
    "T2_samples",
    "First-run sample data",
    "browser"
  ],
  [
    "T2_persistence",
    "Inventory survives reopening",
    "browser"
  ],
  [
    "T2_commit",
    "T2 committed",
    "repo"
  ],
  [
    "T3_view",
    "Inventory can be viewed",
    "browser"
  ],
  [
    "T3_create",
    "Product can be added",
    "browser"
  ],
  [
    "T3_edit",
    "Product can be edited",
    "browser"
  ],
  [
    "T3_delete",
    "Product can be deleted",
    "browser"
  ],
  [
    "T3_commit",
    "T3 committed",
    "repo"
  ],
  [
    "T4_lookup",
    "Current product can be found",
    "browser"
  ],
  [
    "T4_commit",
    "T4 committed",
    "repo"
  ],
  [
    "T5_add",
    "Inventory item enters cart",
    "browser"
  ],
  [
    "T5_quantity",
    "Cart quantity changes",
    "browser"
  ],
  [
    "T5_remove",
    "Cart item can be removed",
    "browser"
  ],
  [
    "T5_total",
    "Cart total reflects contents",
    "browser"
  ],
  [
    "T5_persistence",
    "Cart survives reopening",
    "browser"
  ],
  [
    "T5_commit",
    "T5 committed",
    "repo"
  ],
  [
    "T6_stock",
    "Purchase updates stock",
    "browser"
  ],
  [
    "T6_history",
    "Purchase history persists",
    "browser"
  ],
  [
    "T6_readme",
    "README updated in T6",
    "repo"
  ],
  [
    "T6_commit",
    "T6 committed",
    "repo"
  ],
  [
    "T7_browser_qa",
    "Author exercised a real browser",
    "repo"
  ],
  [
    "T7_fixes",
    "Observed discovered defects resolved",
    "repo"
  ],
  [
    "T7_commit",
    "T7 committed",
    "repo"
  ]
];
export const CHECK_DETAILS = {
  "T1_repository": {
    "requirement": "R021",
    "phase": "H",
    "target": "task_history",
    "strategy": "repository",
    "evidence": "r",
    "observation": "T1 starts empty and ends with a readable Git repository; readable end tree has no repository."
  },
  "T1_readme": {
    "requirement": "R021",
    "phase": "B",
    "target": "delivered_artifact",
    "strategy": "repository",
    "evidence": "r",
    "observation": "A discoverable README describes this project; no README or only empty content. No root-only path requirement."
  },
  "T1_scaffold": {
    "requirement": "R020",
    "phase": "B",
    "target": "delivered_artifact",
    "strategy": "runtime",
    "evidence": "r,b",
    "observation": "`index.html` is an HTML5 document with a basic document body; missing entry or an observed non-HTML scaffold. No folder layout or visual design prescribed."
  },
  "T1_runtime": {
    "requirement": "R020",
    "phase": "B",
    "target": "delivered_artifact",
    "strategy": "runtime",
    "evidence": "r,b,l",
    "observation": "Resolved runtime dependency closure contains only application HTML/CSS/vanilla JS and browser APIs; identified framework/library runtime is loaded or required. Testing/dev tools outside the delivered runtime are allowed."
  },
  "T1_direct_file": {
    "requirement": "R020",
    "phase": "B",
    "target": "delivered_artifact",
    "strategy": "runtime",
    "evidence": "b,l",
    "observation": "Opening the actual `file:` entry loads the scaffold/app without an app server; demonstrated reliance on a server prevents the required entry from working."
  },
  "T1_commit": {
    "requirement": "R021",
    "phase": "H",
    "target": "task_history",
    "strategy": "repository",
    "evidence": "r,l",
    "observation": "New task commit satisfies advancement below; readable before/after history proves none."
  },
  "T2_products": {
    "requirement": "R022",
    "phase": "B",
    "target": "delivered_artifact",
    "strategy": "data",
    "evidence": "d,r",
    "observation": "Initialized data contains identifiable products and their stock; proven initialized model lacks products or stock. No mandatory product field names."
  },
  "T2_samples": {
    "requirement": "R022",
    "phase": "B",
    "target": "delivered_artifact",
    "strategy": "data",
    "evidence": "d,b",
    "observation": "Fresh storage initializes nonempty sample products; completed initialization leaves no sample products. No T3 view required."
  },
  "T2_persistence": {
    "requirement": "R022",
    "phase": "B",
    "target": "delivered_artifact",
    "strategy": "data",
    "evidence": "d,b",
    "observation": "Product/stock state persisted in localStorage is read back on close/reopen with the same origin/profile; observed data loss/reset or an alternative-only persistence mechanism."
  },
  "T2_commit": {
    "requirement": "R022",
    "phase": "H",
    "target": "task_history",
    "strategy": "repository",
    "evidence": "r,l",
    "observation": "New T2 commit; readable task history proves no advancement."
  },
  "T3_view": {
    "requirement": "R023",
    "phase": "B",
    "target": "delivered_artifact",
    "strategy": "behavior",
    "evidence": "d,b",
    "observation": "A user can inspect inventory products; resolved complete inventory view omits products known to exist."
  },
  "T3_create": {
    "requirement": "R023",
    "phase": "B",
    "target": "delivered_artifact",
    "strategy": "behavior",
    "evidence": "d,b",
    "observation": "Valid values for the app's own fields create a distinguishable product retained after reopening; valid completed action loses/does not create it."
  },
  "T3_edit": {
    "requirement": "R023",
    "phase": "B",
    "target": "delivered_artifact",
    "strategy": "behavior",
    "evidence": "d,b",
    "observation": "Change an app-supported product value and reopen; completed edit is absent or lost. No mandated editable field list."
  },
  "T3_delete": {
    "requirement": "R023",
    "phase": "B",
    "target": "delivered_artifact",
    "strategy": "behavior",
    "evidence": "d,b",
    "observation": "Delete an unused product, accept any offered confirmation, reopen; selected product remains/reappears."
  },
  "T3_commit": {
    "requirement": "R023",
    "phase": "H",
    "target": "task_history",
    "strategy": "repository",
    "evidence": "r,l",
    "observation": "New T3 commit; readable task history proves no advancement."
  },
  "T4_lookup": {
    "requirement": "R024",
    "phase": "B",
    "target": "delivered_artifact",
    "strategy": "behavior",
    "evidence": "d,b",
    "observation": "Use the app's offered lookup/filter on an existing distinguishing value, then repeat after a supported edit; the matching current product is not findable. No fixed fields, substring policy, latency or ranking."
  },
  "T4_commit": {
    "requirement": "R024",
    "phase": "H",
    "target": "task_history",
    "strategy": "repository",
    "evidence": "r,l",
    "observation": "New T4 commit; readable task history proves no advancement."
  },
  "T5_add": {
    "requirement": "R025",
    "phase": "B",
    "target": "delivered_artifact",
    "strategy": "behavior",
    "evidence": "d,b",
    "observation": "Add an available inventory product; resolved cart does not contain the selected product."
  },
  "T5_quantity": {
    "requirement": "R025",
    "phase": "B",
    "target": "delivered_artifact",
    "strategy": "behavior",
    "evidence": "d,b",
    "observation": "Change between two valid positive quantities within observed stock; resolved cart quantity is unchanged/wrong."
  },
  "T5_remove": {
    "requirement": "R025",
    "phase": "B",
    "target": "delivered_artifact",
    "strategy": "behavior",
    "evidence": "d,b",
    "observation": "Remove an added line; line remains or returns on reopening."
  },
  "T5_total": {
    "requirement": "R025",
    "phase": "B",
    "target": "delivered_artifact",
    "strategy": "behavior",
    "evidence": "d,b",
    "observation": "A displayed total agrees with the app's exposed price/amount rules after add/change/remove; observed numeric inconsistency. Currency/rounding/tax policy is not invented."
  },
  "T5_persistence": {
    "requirement": "R025",
    "phase": "B",
    "target": "delivered_artifact",
    "strategy": "behavior",
    "evidence": "d,b",
    "observation": "Nonempty cart products/quantities survive close/reopen through localStorage; observed loss/reset or another-only store."
  },
  "T5_commit": {
    "requirement": "R025",
    "phase": "H",
    "target": "task_history",
    "strategy": "repository",
    "evidence": "r,l",
    "observation": "New T5 commit; readable task history proves no advancement."
  },
  "T6_stock": {
    "requirement": "R026",
    "phase": "B",
    "target": "delivered_artifact",
    "strategy": "behavior",
    "evidence": "d,b",
    "observation": "Complete a valid within-stock purchase; stock decreases by purchased quantities and persists; demonstrated unchanged/wrong stock or lost update."
  },
  "T6_history": {
    "requirement": "R026",
    "phase": "B",
    "target": "delivered_artifact",
    "strategy": "behavior",
    "evidence": "d,b",
    "observation": "Completed purchase is retained in order history through localStorage and reopening; observed missing/lost record. No fixed order schema or extra history UI is required."
  },
  "T6_readme": {
    "requirement": "R026",
    "phase": "H",
    "target": "task_history",
    "strategy": "repository",
    "evidence": "r,l",
    "observation": "T6 start/end README content differs and is included in the task's new commit; readable history shows no README update or no committed update. No prescribed section wording."
  },
  "T6_commit": {
    "requirement": "R026",
    "phase": "H",
    "target": "task_history",
    "strategy": "repository",
    "evidence": "r,l",
    "observation": "New T6 commit; readable task history proves no advancement."
  },
  "T7_browser_qa": {
    "requirement": "R027",
    "phase": "H",
    "target": "task_history",
    "strategy": "qa",
    "evidence": "l,b",
    "observation": "Corroborated T7 browser actions exercise the available inventory/cart/checkout workflows with observed results; a complete observed action record demonstrates no real-browser exercise or an asserted QA run contains no product interaction. A success claim alone is insufficient."
  },
  "T7_fixes": {
    "requirement": "R027",
    "phase": "H",
    "target": "task_history",
    "strategy": "qa",
    "evidence": "l,r,b",
    "observation": "Replay supported requirement-grounded defects actually discovered during T7 against its end snapshot; a discovered defect demonstrably remains. With complete observed QA and no discovered defects, pass as “no observed unresolved defect”; do not require an arbitrary source edit."
  },
  "T7_commit": {
    "requirement": "R027",
    "phase": "H",
    "target": "task_history",
    "strategy": "repository",
    "evidence": "r,l",
    "observation": "New T7 commit, including a legitimate empty commit when QA needs no edits; readable history proves no advancement."
  }
};
export const byCheck = Object.fromEntries(CHECKS.map((c) => [c[0], c]));
export const PHASE_COUNTS = { unique: 30, at_task: 30, final_regression: 30, final_artifact: 19, final_history: 11 };
export const PI_AT_TASK = { T5_remove: "fail", T5_persistence: "fail", T6_history: "fail" };
export const PI_FINAL = { T4_lookup: "fail", T5_remove: "fail", T6_history: "fail" };
export const COMMITS = { T1: "a8c03e1", T2: "61f2d9b", T3: "c04e7aa", T4: "9d1b552", T5: "4e7a1c9", T6: "7b3f0de", T7: "1f0b2aa" };
