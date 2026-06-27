# Review — PR #15 `feat/v2-amplop-phase3-cutover`

Phase 3 cutover: promote the React "Amplop" shell to the root `index.html`;
preserve the old vanilla app verbatim at `legacy.html`; delete `v2.html`; update
`vite.config.js` rollup inputs (main + legacy + settings, drop v2).
Pass 2 = regression check of range `fc25b40..72381b3`.

## Resolved
- [x] `src/settings/Settings.jsx:56` — back link `href="/v2.html"` → `href="/"`.
  Now resolves to the React root in dev/preview/Firebase. Verified fixed in
  commit 72381b3; no new bug introduced by the change.

## Verification reproduced (Pass 1)
- `legacy.html` byte-identical to the previous `index.html`. OK.
- New `index.html` mounts `/src/main.jsx`; correct title + favicon `/icon.ico`. OK.
- `v2.html` removed; vite inputs map 1:1 to existing files; `v2` dropped. OK.
- Firebase `**` → `/index.html` rewrite does not shadow `legacy.html`/`settings.html`. OK.

## Non-blocking (nits) — addressed
- `src/main.jsx:1` comment updated ("Mounted from the root index.html").
- `README.md` v2.html references updated to reflect the cutover.
