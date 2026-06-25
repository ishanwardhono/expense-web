# Review — PR #10: Phase 1 v2 Amplop static shell (offline/seed)

First review. Scope: port the handoff React prototype to ES modules and render the
full interactive envelope-calendar UI against seed/localStorage only — no network,
no live-app cutover. Reviewed at HEAD cc63596.

Ratified decisions honored as not-bugs: stored `paid:{date,amount}` (no manual
Langganan category), Import FAB stubbed ("segera hadir"), v2 mounts via new
`v2.html` with `index.html` untouched, `fmtRp` absolute-value behaviour.

## Blocking

_None._

## Resolved

_None (first review, no prior blocking issues)._

## Non-blocking (nits)

- `src/components/ExpenseForm.jsx:23` and `src/components/PaySheet.jsx:17`:
  `parseInt(amount, 10)` tolerates trailing garbage ("100abc" -> 100). Acceptable
  for an `input[type=number]`, but a stricter parse would be marginally safer.
- `src/app.jsx:50-63` `dayMinis`: days that fall in a shopping week owned by an
  adjacent month (e.g. Mon 2026-06-29 -> July's week) get no "Sisa belanja" mini.
  This is consistent with the engine's month-boundary attribution and is intended,
  not a defect — noted only for awareness.

## Verification

- `npm test` -> 27 passing (format 12, engine 12, app render smoke 3). Failure paths
  covered: format.js non-finite -> Rp0/0; engine month-boundary (Fri/Sat ownership).
- `npm run build` -> green; emits `dist/v2.html` + v2 bundle and an intact
  `dist/index.html` (live vanilla app builds unchanged).
- No live-app files touched (index.html, main.js, tabs/monthly/recap/modal/details,
  style.css all unchanged). Focused diff.
- No secrets, no network calls in new code (Phase 1 offline scope).
- Form validation rejects non-positive/invalid amounts in ExpenseForm and PaySheet;
  localStorage load/save both guarded with try/catch; non-finite guards in format.js.
- Sheet routing (closeForm/closePay/openExpense) traced: from='day' returns to day
  sheet, from='env' returns to langganan sheet, from=null closes fully — consistent.
- UI copy is Indonesian; currency via shared `fmtK`/`fmtRp`; conventional `feat:` commit.

## Blocking issues
_None._

VERDICT: READY_TO_MERGE
