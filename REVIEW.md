# Review — PR #14 `claude/expense-app-redesign-plan-phase-4-settings`

Phase 4 of the v2 "Amplop" redesign: hidden URL-only settings page (budget
config + subscription catalog CRUD) and subscription payment via the normal
add-expense form (Langganan category + picker; pay = POST Langganan expense;
delete = un-pay). HEAD `2a57b5d`. First (full) review.

## Verification reproduced
- `npm test` → 32 passing (4 files). Confirmed locally.
- Backend contract / 1-based month / URL construction match tests + live notes.

## Blocking
- [x] Missing failure-path test for the new Langganan branch in
  `src/components/ExpenseForm.jsx`. **Fixed:** `app.test.jsx` now has
  "blocks a Langganan payment when no subscription is chosen" (asserts the
  "Pilih langganan yang dibayar" error and that `addExpense` is NOT called).
  Also added the budget reject-path test in `Settings.test.jsx`
  ("rejects an invalid budget (negative)"). Suite: 34 passing.

## Resolved
- ExpenseForm Langganan no-sub-picked failure path — covered (app.test.jsx).
- BudgetSection negative/non-integer rejection — covered (Settings.test.jsx).

## Non-blocking (nits)
- nit: `src/settings/Settings.jsx:41-49` — on a write error, `run()` sets the
  notice but does not reload; the editor keeps optimistic local state. Harmless
  (next load reconciles), but a reload-on-error would be tidier.
- nit: `src/app.jsx:113` — `openExpense(e, from, k)` still takes an unused `k`
  param (pre-existing).
- nit: `src/data/api.js` — `getBudget`/`getSubscriptions` build query strings via
  string concat (consistent with existing `getMonth`); fine, but `URLSearchParams`
  would be uniform. Not a correctness issue (year/month are numbers).

## Notes / things checked and found correct
- ExpenseForm disable logic (`:85`): paid subs disabled except the currently
  linked one when editing; `(initial && initial.subscription_id)` is `null` when
  adding, so paid subs stay disabled. Correct.
- `subscription_id` is sent iff category===Langganan, else `null` (`:32`). Correct.
- 1-based month sent from Settings (`getMonth()+1`) and asserted in tests. Correct.
- Old Langganan read-only guard removed cleanly in `app.jsx`; Langganan rows now
  editable/deletable; EnvelopeSheet Langganan detail stays read-only. Correct.
- api error passthrough incl. 409 covered (`api.test.js:63-69`); Settings
  invalid-sub covered (`Settings.test.jsx:59-68`).
- CLAUDE.md: Indonesian copy, currency via fmtRp/fmtK, no secrets, focused diff,
  `index.html` (v1) untouched, settings is a separate Vite rollup input. OK.
