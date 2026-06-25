# Review — PR #11: Phase 2 v2 Amplop data-API seam

First review. Scope: introduce a data-API seam (`src/data/api.js`) so the v2
shell loads/saves via endpoints with localStorage as an offline cache, plus
loading/error/retry/notice states. Reviewed at HEAD 2913f6a.

Ratified decisions honored as not-bugs: in-repo mock adapter selected by env
flag (USE_MOCK = no VITE_GET_MONTH_URL); GET month returns server budget config;
persist expenses + subscription payment only (full sub CRUD is Phase 4); auth
public per §13; v2 mounts via v2.html (index.html untouched).

## Blocking

_None._

## Resolved

_None (first review, no prior blocking issues)._

## Non-blocking (nits)

- nit: `src/data/api.js:163` (real `addExpense`) returns the created expense but
  does not write it into the local `_db` cache. The subsequent `reload()` in
  `app.jsx:67` re-fetches and re-caches, so the happy path is correct. But if
  that reload fails after a successful server write, `getMonth` returns the
  `_stale` cache, which lacks the just-added row — the write succeeded server-side
  yet the UI silently omits it until the next good fetch. No data loss/corruption;
  edge UX wrinkle for the not-yet-built real backend.
- nit: `src/app.jsx:66-69` `reload()` discards a `_stale` flag on the post-write
  fetch — the offline notice won't appear in that path. Cosmetic.
- nit: `src/data/api.js:140` `cacheMonth` replaces `subs`/`config` wholesale from
  each month fetch. Fine while subs/config are global, but if subs ever become
  month-scoped this merge would need revisiting. Noted for awareness only.

## Verification

- Padded ±7-day `monthWindow` proven sufficient by brute force over 2024–2030:
  every engine shopping week (Mon=Fri-4 .. Sun=Fri+2) and weekend (Sat .. Sun+1)
  falls inside the window — zero failures. Boundary spend is preserved.
- `npm test` -> 38 passing (api mock 7, api real failure paths 3, format 12,
  engine 12, app 4). Failure paths covered: cold network -> friendly Indonesian
  error; stale offline fallback after a prior success; non-ok HTTP -> throw;
  app write round-trip (28 -> 29 transaksi via API).
- `npm run build` -> green; emits dist/v2.html + v2 bundle and an intact
  dist/index.html. No live-app files touched (index.html, main.js, tabs/monthly/
  recap/modal/details/style.css all unchanged) — focused diff.
- No nil/zero read of `A`/`cfg` when `data` is null: every use is behind a
  `data ?` gate or a `data &&` sheet guard. Loading/error/retry/notice wired;
  write errors surface via `notice`.
- Module-level `_db`/`_hasCache`/`_seq` cleared by `_resetLocal()` (called in
  test `beforeEach`); real-adapter tests use `vi.resetModules()`. No cross-test
  state leak; `_stale` only after an in-session success (intentional).
- `friendly()` maps Timeout/Abort + "Failed to fetch" to Indonesian copy, else
  preserves the Error. All fetches carry `AbortSignal.timeout(TIMEOUT)`.
- CLAUDE.md: UI copy Indonesian; currency via shared `fmtK`; no secrets
  (.env.example placeholders empty); conventional `feat:` commit.

## Blocking issues
_None._

VERDICT: READY_TO_MERGE
