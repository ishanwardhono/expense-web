# Review — PR #9: Phase 0 foundations for v2 Amplop (React + Vitest)

First review. Scope: toolchain foundations only (React/Vite JSX, Vitest, canonical `fmtRp`).
The vanilla app must keep building untouched; `proto/*.jsx` bundle absence is a known,
accepted deferral (not a blocker).

## Blocking

_None._

## Resolved

_None yet._

## Non-blocking (nits)

- `src/lib/format.js`: `fmtRp` relies on `toLocaleString('id-ID')` which depends on the
  runtime having full ICU. Node 18+ ships full ICU by default (verified: ICU 78.3,
  groups with dots), so this is fine today — worth a note if a minimal-ICU runtime is
  ever targeted.

## Verification

- `npm test` -> 7 passing (`src/lib/format.test.js`), includes failure path (NaN/Infinity/undefined -> `Rp0`).
- `npm run build` -> vanilla app builds green with React plugin enabled.
- Changed files limited to: package.json, package-lock.json, vite.config.js, src/lib/format.js, src/lib/format.test.js. No unrelated app code touched.
- Conventional commit (`feat:`), single logical change.
