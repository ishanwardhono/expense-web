# ShanCi Expense — v2 "Amplop" Redesign: Implementation Plan

> Status: **Planning only — no code to be written yet.** This document maps the
> Claude Design v2 prototype ("Kalender Pengeluaran v2 (Amplop)") onto the
> current production app and proposes a phased path to ship it.

---

## 1. Goal

Replace the current three-tab, table-based expense UI with the v2 **envelope
(amplop) calendar** design: a single-screen, mobile-first app where the month
is a calendar grid, the monthly budget is split into named "envelopes," and
expenses are added/edited through bottom sheets — including an AI-assisted
"import from screenshots" flow.

The redesign is a **full UI rewrite**, not a restyle. It also changes the data
model and the budgeting logic, so part of this plan is deciding how much of the
new behavior lives in the client vs. the backend.

---

## 2. What the v2 design actually is

The handoff bundle's primary file (`Kalender Pengeluaran v2 (Amplop).html`) is a
CSS shell plus a React 18 + Babel-standalone prototype loaded from seven JSX
files. The relevant ones for v2 are:

| Prototype file | Role |
| --- | --- |
| `proto/expense-data.jsx` | Categories, date helpers, currency formatting, seed data, subscription helpers, localStorage migration |
| `proto/expense-components.jsx` | Shared UI: bottom-sheet wrapper, expense row, expense add/edit form, list section |
| `proto/amplop-engine.jsx` | **Envelope budget engine** — attributes each expense to an envelope and computes per-envelope/weekly/weekend/flexible totals |
| `proto/amplop-components.jsx` | Envelope card, calendar grid, envelope detail sheet, day detail sheet |
| `proto/scan-flow.jsx` | AI "import from screenshots" flow (gallery → processing → review) — fully mocked |
| `proto/amplop-app.jsx` | Top-level app: state, month navigation, sheet routing, persistence |
| `proto/tweaks-panel.jsx` | Claude Design authoring tool scaffold — **dev-only, drop in production** |

### 2.1 Screens & components

A single scrollable screen (max-width 430px, fixed FAB), composed of:

1. **Top bar** — gradient header (`--accent`), month title with `‹ / ›`
   navigation, and a "Kembali ke hari ini" pill when not on the current month.
2. **Envelope card** (`EnvelopeCard`) — replaces the old stat strip. Collapsed:
   `Terpakai / Budget / Sisa`. Expanded: four envelope rows, each with a colored
   dot, `spent / budget`, and a progress bar:
   - **Belanja Mingguan** (weekly shopping)
   - **Akhir Pekan** (weekend)
   - **Langganan** (subscriptions)
   - **Fleksibel** (flexible — the remainder, may go negative)
3. **Calendar** (`AmplopCalendar`) — Monday-start month grid; each day cell shows
   the date and the total spent that day; weekends tinted; today highlighted.
4. **History** (`ListSection`) — collapsible "Riwayat Pengeluaran" with category
   filter chips and expenses grouped by day, each row tagged with its envelope.
5. **FAB (+)** — opens an entry menu (Import from images / Manual input), then the
   expense form.
6. **Bottom sheets**:
   - `DaySheetV2` — one day's expenses + mini-stats (terpakai / sisa belanja /
     sisa weekend or flexible) + "Tambah Pengeluaran".
   - `EnvelopeSheet` — per-envelope breakdown (weeks, weekends, subscription
     list, or the flexible math).
   - `ExpenseForm` — add/edit: amount, category chips, subscription picker (when
     category = Langganan), time, note.
   - `ScanFlow` — pick screenshots → simulated AI processing → review/edit
     extracted rows → commit many expenses at once.

### 2.2 The envelope engine (`amplop-engine.jsx`)

This is the conceptual heart of v2. Given raw expenses + a subscription catalog +
a month, `computeAmplop` derives everything. Attribution rules (`amplopOf`):

- `Belanja` & `Cash` → **Belanja Mingguan** (any day)
- `Makan` & `Jajan` on a weekday → **Belanja Mingguan**
- `Makan` & `Jajan` on Sat/Sun → **Akhir Pekan**
- `Lainnya` on Sat/Sun → **Akhir Pekan**
- `Lainnya` on a weekday → **Fleksibel**
- `Langganan` entries → **Langganan**

Month-boundary rules: a shopping week (Mon–Sun) belongs to the month of its
**Friday**; a weekend (Sat+Sun) belongs to the month of its **Saturday**.
Budgets come from a fixed config in `amplop-app.jsx`:

```
monthly        = 5,000,000
shopWeekly     =   600,000   (per Friday in the month)
weekendBudget  =   200,000   (per weekend in the month)
flexBudget     = monthly − shopBudget − weekendBudget − subscriptionAlloc
```

Subscription "paid" status is **derived**, not stored: a subscription counts as
paid for a month if there's a `Langganan` expense with that `subscriptionId` in
that month. The catalog (`SEED_SUBS`) is a pure reference table.

### 2.3 Data model (prototype)

```js
expense = { id, date: 'YYYY-MM-DD', time: 'HH:MM', amount: <number>,
            cat: 'Makan'|'Belanja'|'Jajan'|'Cash'|'Lainnya'|'Langganan',
            note: <string>, subscriptionId?: <string> }

subscription = { id, name, color, alloc: <number>, dueDay: 1..31, active: <bool> }
```

Persistence in the prototype is **`localStorage`** under key
`expense-cal-proto-v1` (shared with the v1 design). `TODAY` is hard-pinned to
`2026-06-16` for a deterministic demo.

---

## 3. Current production app (what we're replacing)

- **Stack:** Vite 5 + vanilla JS modules, no framework. Deployed to Firebase
  Hosting (`firebase.json` → `dist`). Entry `index.html` + `src/*.js` +
  `src/style.css`.
- **UI:** three tabs — `weekly` (`src/main.js`), `monthly` (`src/monthly.js`),
  `recap` (`src/recap.js`) — driven by `src/tabs.js`; a shared add/detail modal
  (`src/modal.js`, `src/details.js`).
- **Backend:** five Cloud Run endpoints (`.env.production`):
  - `VITE_GET_WEEKLY_EXPENSE_URL` (GET)
  - `VITE_ADD_WEEKLY_EXPENSE_URL` (POST)
  - `VITE_GET_MONTHLY_EXPENSE_URL` (GET)
  - `VITE_ADD_MONTHLY_EXPENSE_URL` (POST)
  - `VITE_GET_RECAP_URL` (POST)
- **Key contract difference:** the current GET endpoints return **pre-formatted,
  server-computed display strings** (e.g. `remaining.weekday = { label, label_color }`,
  `days[dayName] = "Ga ada jajan"`). The client does almost no math. The add
  endpoint accepts `{ amount, date, type, note, context }`.

This is the central tension: **v2 expects raw numeric transactions and does the
budgeting math on the client**, while today's backend returns finished strings
and owns the math. We cannot ship v2 against the current GET responses unchanged.

---

## 4. Gap analysis (v1 prod → v2 design)

| Area | Current prod | v2 design | Gap / work |
| --- | --- | --- | --- |
| Layout | 3 tabs, tables | 1 screen: envelope card + calendar + history + sheets | Full rewrite |
| Framework | Vanilla JS | React (prototype) | Framework decision (§5.1) |
| Budget math | Server-computed strings | Client-side envelope engine | Decide engine location (§5.2) |
| Expense shape | `{ amount, date, type, note }` | `{ amount, date, time, cat, note, subscriptionId? }` | New `time`, `cat`, `subscriptionId`; raw numbers required |
| Categories | Weekly: Konsumsi/Belanja/Laundry/Air Minum/Lainnya; Monthly: Lainnya/Subscription/Cash/Vacation/Listrik/Kesehatan/Internet/Maintenance | Makan/Belanja/Jajan/Cash/Lainnya + Langganan | Unify taxonomy + migrate old data (§7.2) |
| Subscriptions | "Subscription"/"Internet"/… as monthly types | First-class catalog + derived paid status | New subscription catalog + endpoints |
| Get data | Formatted weekly/monthly views | Raw transaction list for a month | New/changed GET contract |
| Recap tab | Separate POST endpoint + tables | No direct equivalent (envelope sheets cover some of it) | Decide: keep, fold in, or drop (§11) |
| AI scan | None | Import from screenshots (mocked) | New backend capability (§10) |
| Persistence | API only | localStorage in prototype | Wire to API; localStorage as cache/offline only |

---

## 5. Key architecture decisions

These three decisions shape everything below. Each has a recommendation; all are
flagged again in §12 (Open decisions) for sign-off before Phase 1.

### 5.1 Framework: React (recommended) vs. keep vanilla

The v2 UI is highly stateful — routed bottom sheets, a multi-step scan flow,
collapsible cards, inline-editable review rows. The prototype is already React,
and most of `proto/*.jsx` is close to directly reusable.

- **Recommended: adopt React via the existing Vite setup.** Add `react` +
  `react-dom`, convert `proto/*.jsx` from global-`window` modules into real ES
  modules. Fastest route to pixel-fidelity and the lowest risk of behavioral
  drift in the envelope engine. Cost: a new runtime dependency and a JSX build
  step (Vite handles both trivially).
- **Alternative: re-author in vanilla JS** to match the current codebase. Avoids
  new deps but means manually re-implementing all sheet/state logic and the scan
  flow — significantly more effort and more chance of subtle divergence.

> The design handoff README explicitly says to recreate the look in "whatever
> technology makes sense," not to copy the prototype's structure. Given how much
> working React logic ships in the bundle, React is the pragmatic choice.

### 5.2 Budget engine: client now, backend later (recommended)

`computeAmplop` is self-contained and well-specified. Two viable models:

- **Recommended (phased):** keep the engine **on the client** for Phase 1–3.
  Change the backend GET to return the **raw list of a month's expenses +
  the subscription catalog + the budget config**; the client computes envelopes.
  Then, in a later phase, optionally move the math server-side for a single
  source of truth.
- **Alternative:** port `computeAmplop` into the Cloud Run backend immediately
  and have it return computed envelopes. More backend work up front; better if
  multiple clients must agree.

Either way, the **budget config** (`monthly`, `shopWeekly`, `weekendBudget`)
must stop being a hard-coded constant and become server-provided / user-editable.

### 5.3 AI scan flow: defer to a later phase (recommended)

The scan flow is fully mocked (`SCAN_GALLERY`, `SCAN_RESULT`) and depends on
OCR + per-app (GoPay, Livin', DANA) parsers that don't exist yet. Recommend
shipping the calendar + envelopes + manual entry first, and treating scan as an
independent later phase. The "Manual input" path through the entry menu is the
critical path and must work without it.

---

## 6. Proposed target structure (React route)

```
index.html                 # single mount point <div id="root">, drop old tab markup
src/
  main.jsx                 # React entry; renders <App/>
  app.jsx                  # was amplop-app.jsx (state, sheet routing, month nav)
  lib/
    format.js              # fmtK, fmtRp, fmtDate*  (from expense-data.jsx)
    dates.js               # dateKey, keyToDate, monthGrid, isWeekendKey, …
    categories.js          # CATS, palette, category↔envelope mapping
    amplop-engine.js       # computeAmplop, amplopOf, subPaymentIn  (pure, unit-testable)
  data/
    api.js                 # fetch wrappers around the (new) endpoints
    store.js               # client state + localStorage cache/offline
  components/
    Sheet.jsx
    EnvelopeCard.jsx
    AmplopCalendar.jsx
    ListSection.jsx
    ExpRow.jsx
    DaySheet.jsx           # DaySheetV2
    EnvelopeSheet.jsx
    ExpenseForm.jsx
  scan/                    # later phase
    ScanEntryMenu.jsx
    ScanFlow.jsx
  styles/
    tokens.css             # :root vars from the v2 <style>
    app.css                # the rest of the v2 CSS
```

Notes:
- **Drop `tweaks-panel.jsx` entirely** (authoring-tool scaffold).
- Keep the engine in `lib/amplop-engine.js` as a **pure module** so it can be
  unit-tested and, later, shared with / moved to the backend.
- Replace the prototype's pinned `TODAY`/`TODAY_KEY` with real `new Date()`
  helpers (single module so tests can inject a fixed clock).

---

## 7. Data model & API changes

### 7.1 Unified expense shape

Target stored shape:

```
{ id, date: 'YYYY-MM-DD', time: 'HH:MM', amount: <int, no formatting>,
  cat: <one of unified categories>, note: <string>,
  subscriptionId: <string|null> }
```

Backend `add` must accept `time`, `cat`, and `subscriptionId` (today it takes
`type` and a combined `date`). Backend `get` must return **raw integer amounts**
(not display strings) so the client engine can sum them.

### 7.2 Category taxonomy + migration

v2 categories drive the envelope engine by exact name, so they must be the
canonical set: **Makan, Belanja, Jajan, Cash, Lainnya, Langganan.**

Existing data uses different types. A migration/mapping is required, e.g.:

- Konsumsi → Makan; Air Minum → Makan (or Jajan); Laundry → Lainnya
- Subscription/Internet/Listrik/Kesehatan/Maintenance → Langganan or Lainnya
  (per product intent); Vacation → Lainnya; Cash → Cash; Belanja → Belanja
- Anything unmapped → Lainnya

This mapping is a **product decision** and must be confirmed (it changes which
envelope historical spend lands in). Decide whether to migrate stored records or
map at read-time.

### 7.3 Subscriptions

New catalog resource: `{ id, name, color, alloc, dueDay, active }`. Needs
read (and eventually CRUD) endpoints. "Paid this month" stays **derived** from
`Langganan` expenses — do not store a `paid` flag (matches the prototype and
its `migrateStore` logic).

### 7.4 Budget config

Expose `{ monthly, shopWeekly, weekendBudget }` from the backend (or a settings
endpoint) instead of the hard-coded `CFG`. Required for §5.2.

---

## 8. Phased implementation plan

**Phase 0 — Foundations & decisions**
- Confirm the three §5 decisions and the §7.2 category mapping.
- Add React + Vite JSX support; set up a minimal test runner for the engine.
- Move v2 CSS into `styles/`, parameterized by `--accent`.

**Phase 1 — Static shell (offline / seed data)**
- Port `expense-data` helpers, the engine, and all view components to ES modules.
- Render top bar, envelope card, calendar, history, and all sheets against
  **seed/localStorage data** (no network yet). Replace pinned `TODAY`.
- Goal: pixel-faithful, fully interactive UI driven by local state.

**Phase 2 — Backend contract + wiring**
- Define/adjust endpoints: `GET month` (raw expenses + subs + config),
  `POST add/edit expense`, `DELETE expense`, `GET subscriptions`.
- Replace localStorage reads/writes with API calls; keep localStorage as an
  offline cache. Loading/error states per existing UX patterns.

**Phase 3 — Data migration + cutover**
- Apply the category mapping to existing records (or read-time map).
- QA envelope math against known months; verify month-boundary (Friday/Saturday)
  rules. Replace the old `index.html`/tabs; ship behind the same Firebase host.

**Phase 4 — Subscriptions management**
- CRUD for the subscription catalog; due-date display; derived paid status.

**Phase 5 — AI scan import (independent)**
- Backend OCR + per-app parsers (GoPay, Livin', …); replace mocked
  `SCAN_RESULT`. Wire `ScanFlow` to real extraction; keep the review/commit UX.

**Phase 6 — Optional: move engine server-side**
- Port `computeAmplop` to the backend for a single source of truth; client
  becomes a thin renderer.

---

## 9. Component port map (prototype → production)

| Prototype symbol | Source | Production target | Notes |
| --- | --- | --- | --- |
| `AmplopApp` | amplop-app.jsx | `app.jsx` | Strip `useTweaks`/TweaksPanel; real clock; API-backed store |
| `computeAmplop`, `amplopOf` | amplop-engine.jsx | `lib/amplop-engine.js` | Pure; unit-test the attribution + boundary rules |
| `EnvelopeCard`, `EnvelopeSheet`, `WeekRow` | amplop-components.jsx | `components/` | As-is visually |
| `AmplopCalendar`, `AmplopCell` | amplop-components.jsx | `components/AmplopCalendar.jsx` | `cellH` stays configurable |
| `DaySheetV2` | amplop-components.jsx | `components/DaySheet.jsx` | |
| `Sheet`, `ExpRow`, `ExpenseForm`, `ListSection` | expense-components.jsx | `components/` | Form needs real submit → API |
| Seed/helpers | expense-data.jsx | `lib/*`, `data/store.js` | Seed data → tests/fixtures only |
| `ScanEntryMenu`, `ScanFlow`, `GalleryPicker`, `ProcessingView`, `ReviewView` | scan-flow.jsx | `scan/` | Phase 5 |
| `tweaks-panel.jsx` | — | **dropped** | Authoring tool only |

---

## 10. Styling notes

- The v2 CSS is one ~1,200-line `<style>` block; split into `tokens.css`
  (`:root` vars) + `app.css`. The whole theme keys off **`--accent`** (set per
  render), so keep that variable as the single theming knob.
- Heavy use of `color-mix(in srgb|oklab, …)`, `aspect-ratio`, and
  `env(safe-area-inset-*)`. These are fine on modern mobile Safari/Chrome but
  **confirm the minimum supported browser**; add fallbacks if older targets
  matter.
- Mobile-first, `max-width: 430px` centered "app" frame with a fixed FAB and
  bottom sheets — verify on desktop widths (the design assumes a phone frame).
- UI copy is **Indonesian**; keep strings centralized for consistency.

---

## 11. Recap tab — decision needed

v2 has **no direct replacement** for the current Recap tab (`src/recap.js` +
`VITE_GET_RECAP_URL`). The envelope sheets and history arguably cover the same
need. Options: (a) drop Recap, (b) keep it as a secondary view reachable from the
envelope card, or (c) rebuild it later in the v2 visual language. **Recommend (a)
for the initial cutover**, revisit based on usage. Needs confirmation.

---

## 12. Open decisions (need sign-off before Phase 1)

1. **Framework** — React via Vite (recommended) vs. re-author in vanilla JS.
2. **Budget engine location** — client now / backend later (recommended) vs.
   backend immediately.
3. **Category mapping** — confirm the §7.2 old→new mapping (affects historical
   envelope attribution).
4. **Budget config source** — hard-coded defaults vs. server-provided vs.
   user-editable settings (recommend server-provided, user-editable later).
5. **Recap tab fate** — drop / keep / rebuild (recommend drop initially).
6. **AI scan scope & timing** — confirm it's a later, independent phase.
7. **Backend ownership** — these endpoints are separate Cloud Run services not in
   this repo; confirm who implements the contract changes and the rollout order
   (frontend can develop against a mock until the real endpoints land).

---

## 13. Out of scope (for now)

- Real OCR / e-wallet parsing (Phase 5 backend work).
- Multi-currency, exports, analytics charts (existing README "future" list).
- Auth/multi-user changes.

---

## 14. Risks

- **Contract mismatch:** v2 needs raw numeric transactions; today's GET returns
  formatted strings. Backend changes are a hard dependency for Phase 2 — mock
  early to avoid blocking the frontend.
- **Engine correctness:** the Friday/Saturday month-boundary rules are subtle;
  cover them with unit tests before cutover, or historical months will show
  wrong envelope totals.
- **Data migration:** category remapping is irreversible if applied in place —
  prefer read-time mapping or a reversible migration with a backup.
- **Browser support** for `color-mix`/`aspect-ratio` if old devices are in scope.
- **Scope creep** via the scan flow — keep it firewalled as its own phase.
