// The 21 acceptance checks of the built-in inventory benchmark (checks/acceptance.v1.json), as titled in the frames.
// Titles restate the preserved prompts only; choices the prompts leave open (search fields, currency, stock conflicts,
// order structure) are deliberately not checked. Shared by M01 (task tab), M08 (verification) and M09 (coverage).
export const CHECKS = [
  ['T1.1', 'Git repository with a commit for T1', 'repo'],
  ['T1.2', 'README present at the project root', 'repo'],
  ['T2.1', 'Sample products appear on first load', 'browser'],
  ['T2.2', 'Products and stock survive a page reload', 'browser'],
  ['T2.3', 'Cleared storage restores the sample data on next load', 'browser'],
  ['T2.4', 'No console errors while the inventory loads', 'browser'],
  ['T3.1', 'The inventory is listed with each product’s stock', 'browser'],
  ['T3.2', 'A new product can be added', 'browser'],
  ['T3.3', 'A product can be edited', 'browser'],
  ['T3.4', 'A product can be deleted', 'browser'],
  ['T3.5', 'Inventory changes survive a page reload', 'browser'],
  ['T4.1', 'Lookup finds a product the user asks for', 'browser'],
  ['T4.2', 'Lookup reflects the current inventory after edits', 'browser'],
  ['T5.1', 'Products can be added to the cart', 'browser'],
  ['T5.2', 'Changing a quantity updates the total', 'keyboard'],
  ['T5.3', 'Removing an item updates the total', 'keyboard'],
  ['T5.4', 'The cart survives a page reload', 'browser'],
  ['T6.1', 'Completing a purchase decreases stock', 'browser'],
  ['T6.2', 'The order appears in a history that survives reload', 'browser'],
  ['T6.3', 'README updated in the T6 commit', 'repo'],
  ['T7.1', 'The site works end to end in a real browser', 'browser'],
];
export const byCheck = Object.fromEntries(CHECKS.map((c) => [c[0], c]));

// R-0928a-4 (Pi · qwen3.5-35b-a3b): per-task outcomes and the final regression on the delivered T7 artifact.
// Both total 18 passed and 3 failed; the failing checks differ (T7 fixed T5.4 and broke T4.2).
export const PI_AT_TASK = { 'T5.3': 'fail', 'T5.4': 'fail', 'T6.2': 'fail' };
export const PI_FINAL = { 'T4.2': 'fail', 'T5.3': 'fail', 'T6.2': 'fail' };
export const COMMITS = { T1: 'a8c03e1', T2: '61f2d9b', T3: 'c04e7aa', T4: '9d1b552', T5: '4e7a1c9', T6: '7b3f0de', T7: '1f0b2aa' };
