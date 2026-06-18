# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

**ShanCi Expense** — a personal expense-tracking web app (Indonesian-language
UI). The current production app is a Vite + vanilla-JS SPA deployed to Firebase
Hosting. It talks to five Google Cloud Run backend services (not in this repo).

**A full UI redesign ("v2 Amplop") is planned and will be implemented over the
next sessions.** Before starting redesign work, read
[`docs/v2-amplop-redesign-plan.md`](docs/v2-amplop-redesign-plan.md) — it is the
source of truth for that effort.

## Commands

```bash
npm install        # install deps (Vite only today)
npm run dev        # dev server on http://localhost:3000 (vite.config.js)
npm run build      # production build → dist/
npm run preview    # preview the production build
```

Deploy is Firebase Hosting (`firebase.json` serves `dist/`, SPA rewrite to
`/index.html`). There is **no test runner or linter configured yet** — adding one
(at least for the v2 budget engine) is part of the redesign plan.

## Environment / backend

API URLs come from Vite env vars (see `.env.production`). The five services:

| Var | Method | Purpose |
| --- | --- | --- |
| `VITE_GET_WEEKLY_EXPENSE_URL` | GET | weekly view (server-computed) |
| `VITE_ADD_WEEKLY_EXPENSE_URL` | POST | add weekly expense |
| `VITE_GET_MONTHLY_EXPENSE_URL` | GET | monthly view |
| `VITE_ADD_MONTHLY_EXPENSE_URL` | POST | add monthly expense |
| `VITE_GET_RECAP_URL` | POST | recap view |
| `VITE_API_TIMEOUT` | — | fetch timeout (ms) |

The backends live in separate Cloud Run services. **Endpoint contract changes
required by v2 cannot be made from this repo** — coordinate with the backend, and
mock locally to stay unblocked. Today's GET endpoints return *pre-formatted
display strings* (e.g. `remaining.weekday = { label, label_color }`), not raw
numbers — this is the central thing v2 changes.

## Current architecture (production app)

Vanilla ES modules, no framework. Three tabs + shared modals:

- `index.html` — markup for all three tabs and both modals.
- `src/main.js` — app entry; orchestrates modules; weekly tab logic; fetch/normalize/render; loading & error states.
- `src/tabs.js` — tab switching, `tabChanged` custom event, transitions.
- `src/monthly.js` — monthly tab (fetch, render, month nav — nav currently hidden).
- `src/recap.js` — recap tab (POST-driven, paginated by previous month).
- `src/modal.js` — add-expense modal, context-aware (weekly vs monthly), form submit.
- `src/details.js` — expense detail modal + grouped details tables.
- `src/style.css` — all styles (~37 KB).

Cross-module calls go through a few `window.*` globals (`window.showModal`,
`window.loadMonthlyData`, etc.) and the `tabChanged` event. Keep that pattern if
you extend the current app; the v2 plan replaces it.

## Conventions

- **Language:** UI copy is **Indonesian** ("Tambah Pengeluaran", "Sisa", etc.).
  Keep new strings Indonesian and centralized where practical.
- **Modules:** ES modules (`type: module`). Match the existing vanilla style in
  the current app unless the v2 plan dictates otherwise.
- **Currency/format:** amounts are integers; the v2 design formats with helpers
  (`fmtK`, `fmtRp`) — reuse those, don't hand-roll formatting.
- **No secrets in the repo.** API URLs are public Cloud Run endpoints; never add
  credentials.

## v2 Amplop redesign — what's coming

The next phase replaces the three-tab table UI with a single-screen,
**envelope-budgeting (amplop) calendar**. Highlights (full detail in the plan):

- Source design: a React prototype handed off from Claude Design. A copy of the
  prototype lives under the handoff bundle; the production approach is decided in
  the plan (React-via-Vite is the recommendation, not yet ratified).
- New expense shape: `{ id, date, time, amount, cat, note, subscriptionId? }`
  with categories **Makan / Belanja / Jajan / Cash / Lainnya / Langganan**.
- Client-side **envelope engine** attributes spend to four envelopes (Belanja
  Mingguan, Akhir Pekan, Langganan, Fleksibel) with subtle month-boundary rules
  (shopping week follows its Friday; weekend follows its Saturday). This must be
  unit-tested before cutover.
- First-class **subscriptions** catalog; "paid" status is derived from
  `Langganan` expenses, not stored.
- A mocked **AI "import from screenshots"** flow — deferred to a later, standalone
  phase.

### Before implementing v2

Several decisions in the plan's §12 are **not yet ratified** (framework choice,
where the budget engine lives, category remapping, Recap tab's fate, scan-flow
timing, backend ownership). **Do not start Phase 1 until these are confirmed with
the user.** If a session begins redesign work, re-read the plan and check which
decisions are settled.

## Working agreement

- This repo's default working branch for the redesign effort is
  `claude/expense-app-redesign-plan-*`. Develop on the branch you're told to use;
  don't push to `main` without explicit permission.
- Don't open pull requests unless asked.
- Commit messages: clear and descriptive; explain the "why".
