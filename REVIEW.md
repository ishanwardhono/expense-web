# Review — PR #15 `feat/v2-amplop-phase3-cutover`

Phase 3 cutover: promote the React "Amplop" shell to the root `index.html`;
preserve the old vanilla app verbatim at `legacy.html`; delete `v2.html`; update
`vite.config.js` rollup inputs (main + legacy + settings, drop v2). HEAD = PR tip.
First (full) review.

## Verification reproduced
- `legacy.html` is byte-identical to the previous `index.html` (`git diff` empty). OK.
- New `index.html` mounts `/src/main.jsx` (present); title `ShanCi Expense` + favicon `/icon.ico` (`public/icon.ico` present). OK.
- `v2.html` removed from the tree. OK.
- vite inputs map 1:1 to existing files: `index.html`, `legacy.html`, `settings.html`; `v2` dropped. OK.
- Firebase rewrite `**` → `/index.html`: `legacy.html` / `settings.html` are emitted as their own static files, so the catch-all does not shadow them (rewrite applies only to unmatched paths). OK.
- `settings.html` → `/src/settings-main.jsx` (present). OK.

## Blocking
- [x] `src/settings/Settings.jsx:56` — the "‹ Kembali" back link was
  `href="/v2.html"`, the entry point this PR deletes. **Fixed:** now `href="/"`
  (the new root).

## Non-blocking (nits)
- [x] nit: `src/main.jsx:1` — comment updated to "Mounted from the root index.html".
- [x] nit: `README.md:7` — updated to describe the v2 shell at `/` with the vanilla app at `/legacy.html`.
