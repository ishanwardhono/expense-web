# Review — PR #12: Phase 3 wire v2 Amplop client to the real backend

First review (fresh, supersedes the PR #11 record). Scope: re-point the v2
"Amplop" client at the real `expense-functions` backend (localhost:8080), which
computes all envelope/budget math server-side and returns a render-ready month
dashboard. Client is now a thin renderer. Phase-2 mock/seed/store/engine were
intentionally removed. Reviewed at HEAD 1eda60e.

Ratified decisions honored as not-bugs: wire+verify only (v2.html, index.html
cutover deferred); localhost default base URL baked into the v2 bundle is
expected; in-repo mock/seed/store/engine/PaySheet/monthWindow/CFG-budget removed;
Langganan rows read-only (subscription mgmt + Langganan add is Phase 4).

## Blocking

_None._

## Resolved

_None (first review of this PR; prior PR #11 record superseded)._

## Non-blocking (nits)

- nit: `src/app.jsx:52-54` `reload()` (post-write refetch) drops the `_stale`
  flag, so if the server write succeeds but the immediate refetch fails the user
  sees stale offline data without the offline notice. No data loss (write already
  committed server-side); cosmetic, and carried over from Phase 2.
- nit: `src/components/EnvelopeSheet.jsx:74,103-105` dereferences
  `envById.langganan/belanja/weekend.budget` with no guard. The contract
  guarantees all four envelopes so this is safe today; a malformed/partial
  dashboard would throw inside the sheet (not on the main screen). Awareness only.
- nit: `src/data/api.js:38-46` `friendly()` rewrites any error whose message
  matches `/Failed to fetch|NetworkError/i`. A server `{error}` string containing
  those words would be masked. Pathological; server messages are Indonesian.

## Verification

- Month indexing consistent: cursor stores 0-based `m`; every server call is
  `api.getMonth(y, m+1)` (`app.jsx:40,53`); display uses `MONTHS_ID[m]`; grid
  uses 0-based `monthGrid(y,m)` and `monthGrid`'s own `m+1` in `dateKey`;
  `isCurrentMonth` prefers server `period.is_current`, falls back to local
  compare only before load. api.test.js:25 + app.test.jsx:62 assert 1-based wire.
- Field names match the contract: `occurred_at` (ExpRow/ExpenseForm via `hhmm`),
  `envelope.{id,label}` (ExpRow tag), week/weekend `state` past|current|future
  (EnvelopeSheet WeekRow), `due_day`/`paid.{date,amount}`/`alloc`
  (EnvelopeSheet subs), `calendar[].{date,dow,is_weekend,is_today,spent}`
  (AmplopCalendar), `stats.{spent,budget,remaining}`, `flex.{budget,spent,left}`,
  `belanja_weeks[].{monday,friday,sunday,left}`, `weekends[].{saturday,sunday,
  left}`. No mismatches found.
- Data-null gating sound: no read of `dash.*` before load. `dayMinis`/`dayContext`
  read `dash.*` unguarded but only run inside the `{dash && sheet.type==='day'}`
  render branch (`app.jsx:175`). Calendar/list/envelope blocks all behind `dash ?`.
- Write-then-reload flow correct: `runWrite` awaits the write, closes the sheet,
  then `reload()`s; errors surface via `notice`. Langganan/`subscription_id` rows
  are blocked from the edit form (`app.jsx:116-119`) and ExpenseForm always sends
  `subscription_id: null` — consistent with Phase-3 manual categories only.
- 204 handling: `sendJSON` returns null on 204 and tolerates an empty/throwing
  json body (api.test.js:53-61). Server `{error}` passthrough on non-2xx proven
  (api.test.js:63-69); network failure → friendly Indonesian (api.test.js:71-75);
  `_stale` offline cache after a prior success, keyed per (year,month) so no
  cross-month bleed (api.test.js:77-93).
- Failure-path coverage present: api error + offline-cache + 204; app add
  round-trip re-reads the month (1→2 transaksi) and asserts the POST body.
- `npm test` → 24 passing; `npm run build` → green (emits dist/v2.html + v2
  bundle, dist/index.html intact). Legacy production app (index.html, main.js,
  tabs/monthly/recap/modal/details/style.css) untouched — focused diff.
- CLAUDE.md: UI copy Indonesian; currency via shared `fmtK`/`fmtRp`; no secrets
  (localhost base URL is a public dev default, not a credential); conventional
  `feat:` commit; removed engine/mock cleanly with no dangling references.

## Blocking issues
_None._
