# Fleksibel Rollover (frontend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the backend's new Fleksibel rollover — closed weeks/weekends/subscriptions flush their leftover into the Fleksibel envelope — in the Fleksibel detail sheet, with an itemized breakdown of where every add/deduct came from.

**Architecture:** The backend (`expense-functions`, spec D9/§6.6) computes everything; `GET /month` gains `flex.rollover` (int) and `flex.rollover_items` (array), and the fleksibel row's `left`/`over` already include the rollover. The client stays a thin renderer: `EnvelopeSheet` grows a rollover section in its Fleksibel ledger, and one new date-range formatter is added. Everything else (`dayMinis` "Sisa fleksibel", `EnvelopeCard`) picks the new numbers up automatically because it renders `flex.left` / `envelopes[].left` verbatim.

**Tech Stack:** React 18 + Vite, Vitest + @testing-library/react (jsdom). No new dependencies.

## Global Constraints

- **Backend contract (spec §7.1 of `expense-functions/docs/superpowers/specs/2026-06-15-amplop-v2-backend-design.md`):**
  ```jsonc
  "flex": {
    "budget": 1470000, "rollover": 115000, "spent": 8000, "left": 1577000,
    "rollover_items": [
      { "type": "week",         "start": "2026-06-01", "end": "2026-06-07", "amount": 168000 },
      { "type": "weekend",      "start": "2026-06-06", "end": "2026-06-07", "amount": -54000 },
      { "type": "subscription", "name": "Netflix",                          "amount": 1000 }
    ]
  }
  ```
  Items exist only for **closed** sources (past pills, paid subs) and **include zero amounts**; open sources are absent. `left = budget + rollover − spent`.
- **Legacy payloads must not crash.** `localStorage` caches old dashboards without `rollover`/`rollover_items` (offline fallback in `src/data/api.js`), and the backend may deploy after this frontend. Guard with `flex.rollover || 0` / `flex.rollover_items || []`; when there are no items, render exactly today's ledger (no rollover section).
- **UI copy is Indonesian**; amounts only via `fmtK`/`fmtRp` (`src/lib/format.js`); the minus sign is **U+2212 `−`**, never ASCII `-` — test assertions must use `−`.
- **Do not push to `main` and do not open a PR unless asked** (repo CLAUDE.md). Work on a feature branch, e.g. `claude/fleksibel-rollover`.
- Run `npm test` before starting: the suite must be green at baseline.

## File Structure

- `src/lib/format.js` — add `fmtRange(startK, endK)` (only new shared logic).
- `src/lib/format.test.js` — tests for `fmtRange`.
- `src/components/EnvelopeSheet.jsx` — Fleksibel branch: rollover total + item rows in the `fx-row` ledger; copy updates.
- `src/components/EnvelopeSheet.test.jsx` — **new** focused component tests (renders `EnvelopeSheet` directly; no App scaffolding needed — `Sheet` is a plain wrapper div).
- `src/styles/app.css` — indented `.fx-row.sub` variant for item rows.
- `src/app.test.jsx` — sync the `makeDash` fixture to the new contract + one App-level integration test.

---

### Task 1: `fmtRange` date-range formatter

**Files:**
- Modify: `src/lib/format.js`
- Test: `src/lib/format.test.js`

**Interfaces:**
- Consumes: `keyToDate`, `MONTHS_ID` (already imported in `format.js`), existing `fmtDateShort`.
- Produces: `fmtRange(startK, endK) → string` — `'1–7 Jun'` (same month) or `'29 Jun–5 Jul'` (crossing). Keys are `YYYY-MM-DD`. Separator is **en dash `–`**, matching the backend's `belanja_weeks[].range` style. Task 2 imports this.

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/format.test.js` (add `fmtRange` to the existing import from `./format.js`):

```js
describe('fmtRange', () => {
  it('same month: "1–7 Jun"', () => {
    expect(fmtRange('2026-06-01', '2026-06-07')).toBe('1–7 Jun')
  })
  it('crossing months: "29 Jun–5 Jul"', () => {
    expect(fmtRange('2026-06-29', '2026-07-05')).toBe('29 Jun–5 Jul')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/format.test.js`
Expected: FAIL — `fmtRange` is not exported.

- [ ] **Step 3: Implement `fmtRange`**

Append to `src/lib/format.js`:

```js
/**
 * Date-range label for a week/weekend: "1–7 Jun" when both keys share a
 * month, "29 Jun–5 Jul" when the range crosses one. Mirrors the backend's
 * `range` strings (en dash, no year).
 */
export function fmtRange(startK, endK) {
  const s = keyToDate(startK)
  const sameMonth = s.getMonth() === keyToDate(endK).getMonth()
  return (sameMonth ? s.getDate() : fmtDateShort(startK)) + '–' + fmtDateShort(endK)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/format.test.js`
Expected: PASS (all existing + 2 new).

- [ ] **Step 5: Commit**

```bash
git add src/lib/format.js src/lib/format.test.js
git commit -m "feat: add fmtRange date-range formatter for rollover item labels"
```

---

### Task 2: Rollover section in the Fleksibel sheet

**Files:**
- Modify: `src/components/EnvelopeSheet.jsx` (the final `else` branch, currently lines 83–106)
- Modify: `src/styles/app.css` (after the `.fx-row.r .fx-v` rule)
- Test: `src/components/EnvelopeSheet.test.jsx` (new file)

**Interfaces:**
- Consumes: `fmtRange` from Task 1; `dash.flex.{budget,rollover,spent,left,rollover_items}`; `dash.stats.budget`; `envById.{belanja,weekend,langganan}.budget`.
- Produces: Fleksibel ledger rows — labels `'Rollover'`, `'Pekan <range>'`, `'Akhir pekan <range>'`, `<subscription name>`; zero amounts render `'pas'`. Task 4's integration test asserts these exact strings.

- [ ] **Step 1: Write the failing component tests**

Create `src/components/EnvelopeSheet.test.jsx`:

```jsx
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { EnvelopeSheet } from './EnvelopeSheet.jsx'

// NOTE: amount strings below use U+2212 '−' (fmtK's minus), not ASCII '-'.
function makeDash(flex) {
  return {
    stats: { spent: 880000, budget: 5000000, remaining: 4120000 },
    envelopes: [
      { id: 'belanja', label: 'Belanja Mingguan', budget: 2400000, spent: 432000, left: 1968000, over: false },
      { id: 'weekend', label: 'Akhir Pekan', budget: 800000, spent: 254000, left: 546000, over: false },
      { id: 'langganan', label: 'Langganan', budget: 187000, spent: 186000, left: 1000, over: false },
      { id: 'fleksibel', label: 'Fleksibel', budget: 1613000, spent: 8000, left: flex.left, over: flex.left < 0 },
    ],
    belanja_weeks: [],
    weekends: [],
    subscriptions: [],
    flex,
  }
}

afterEach(cleanup)

describe('EnvelopeSheet — fleksibel rollover', () => {
  it('shows the rollover total and one labeled row per closed source', () => {
    render(<EnvelopeSheet which="fleksibel" onClose={() => {}} dash={makeDash({
      budget: 1613000, rollover: 115000, spent: 8000, left: 1720000,
      rollover_items: [
        { type: 'week', start: '2026-06-01', end: '2026-06-07', amount: 168000 },
        { type: 'weekend', start: '2026-06-06', end: '2026-06-07', amount: -54000 },
        { type: 'subscription', name: 'Netflix', amount: 1000 },
      ],
    })} />)
    expect(screen.getByText('Rollover')).toBeTruthy()
    expect(screen.getByText('+115K')).toBeTruthy()
    expect(screen.getByText('Pekan 1–7 Jun')).toBeTruthy()
    expect(screen.getByText('+168K')).toBeTruthy()
    expect(screen.getByText('Akhir pekan 6–7 Jun')).toBeTruthy()
    expect(screen.getByText('−54K')).toBeTruthy()
    expect(screen.getByText('Netflix')).toBeTruthy()
    expect(screen.getByText('+1K')).toBeTruthy()
  })

  it('renders "pas" for a zero-amount closed source and an unsigned zero total', () => {
    render(<EnvelopeSheet which="fleksibel" onClose={() => {}} dash={makeDash({
      budget: 1613000, rollover: 0, spent: 8000, left: 1605000,
      rollover_items: [{ type: 'week', start: '2026-06-01', end: '2026-06-07', amount: 0 }],
    })} />)
    expect(screen.getByText('Rollover')).toBeTruthy()
    expect(screen.getByText('pas')).toBeTruthy()
  })

  it('hides the rollover section on a legacy payload without rollover fields', () => {
    render(<EnvelopeSheet which="fleksibel" onClose={() => {}} dash={makeDash({
      budget: 1613000, spent: 8000, left: 1605000,
    })} />)
    expect(screen.queryByText('Rollover')).toBeNull()
    expect(screen.getByText('Sisa')).toBeTruthy() // ledger still renders
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/EnvelopeSheet.test.jsx`
Expected: FAIL — `Rollover`, `Pekan 1–7 Jun` etc. not found (legacy test may already pass; the other two must fail).

- [ ] **Step 3: Implement the rollover ledger**

In `src/components/EnvelopeSheet.jsx`, extend the format import:

```js
import { fmtK, fmtRp, fmtDateShort, fmtRange } from '../lib/format.js'
```

Replace the entire final `else` branch (the Fleksibel one) with:

```jsx
  } else {
    title = 'Fleksibel'
    sub = 'Jatah yang tersisa setelah semua alokasi'
    note = 'Mencakup pengeluaran Lainnya (hari apa pun). Sisa atau minus dari pekan, akhir pekan, dan langganan yang sudah selesai ikut masuk ke amplop ini. Nilainya bisa minus kalau pemakaian melebihi jatah.'
    const flex = dash.flex
    const rollover = flex.rollover || 0
    const items = flex.rollover_items || []
    const itemLabel = (it) => it.type === 'subscription'
      ? it.name
      : (it.type === 'week' ? 'Pekan ' : 'Akhir pekan ') + fmtRange(it.start, it.end)
    const signedK = (n) => (n > 0 ? '+' : '') + fmtK(n)
    const flexRows = [
      { l: 'Budget bulanan', v: fmtK(dash.stats.budget) },
      { l: '− Belanja mingguan', v: '−' + fmtK(envById.belanja.budget) },
      { l: '− Akhir pekan', v: '−' + fmtK(envById.weekend.budget) },
      { l: '− Langganan', v: '−' + fmtK(envById.langganan.budget) },
      { l: 'Jatah fleksibel', v: fmtK(flex.budget), strong: true },
    ]
    if (items.length > 0) {
      flexRows.push({ l: 'Rollover', v: signedK(rollover), strong: true, cls: rollover >= 0 ? 'g' : 'r' })
      items.forEach((it) => flexRows.push({
        l: itemLabel(it),
        v: it.amount === 0 ? 'pas' : signedK(it.amount),
        sub: true,
        cls: it.amount > 0 ? 'g' : it.amount < 0 ? 'r' : undefined,
      }))
    }
    flexRows.push({ l: 'Terpakai', v: fmtK(flex.spent) })
    flexRows.push({ l: 'Sisa', v: fmtK(flex.left), strong: true, cls: flex.left >= 0 ? 'g' : 'r' })
    body = (
      <div className="env-list">
        {flexRows.map((r, i) => (
          <div className={'fx-row' + (r.strong ? ' strong' : '') + (r.sub ? ' sub' : '') + (r.cls ? ' ' + r.cls : '')} key={i}>
            <span className="fx-l">{r.l}</span>
            <span className="fx-v">{r.v}</span>
          </div>
        ))}
      </div>
    )
  }
```

(The `'−' + fmtK(...)` literals above are the existing U+2212 convention — keep them verbatim.)

In `src/styles/app.css`, directly after the `.fx-row.r .fx-v { color: var(--red); }` rule, add:

```css
.fx-row.sub { border-top: none; padding-top: 0; }
.fx-row.sub .fx-l { padding-left: 14px; font-weight: 500; font-size: 12.5px; }
.fx-row.sub .fx-v { font-weight: 600; font-size: 12.5px; }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/EnvelopeSheet.test.jsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/EnvelopeSheet.jsx src/components/EnvelopeSheet.test.jsx src/styles/app.css
git commit -m "feat: rollover breakdown in the Fleksibel envelope sheet"
```

---

### Task 3: Align belanja/weekend/langganan sheet copy with the rollover rule

Stale copy fix + rollover mention: the weekend note still claims `Lainnya` counts toward the weekend envelope (the backend attributes `Lainnya` to Fleksibel on **any** day since expense-functions commit `4b9fac5`), and no sheet says where leftovers go now.

**Files:**
- Modify: `src/components/EnvelopeSheet.jsx` (the three `note = '…'` strings in the `belanja`, `weekend`, and `langganan` branches)

**Interfaces:**
- Consumes: nothing new.
- Produces: copy only — no test depends on these strings.

- [ ] **Step 1: Update the three notes**

In the `which === 'belanja'` branch, replace the `note` string with:

```js
    note = 'Mencakup Belanja & Cash (kapan saja), plus Makan & Jajan di hari kerja. Tiap pekan berdiri sendiri — pekan yang terpotong pergantian bulan ikut bulan dari hari Jumat-nya. Sisa (atau minus) pekan yang sudah lewat masuk ke amplop Fleksibel.'
```

In the `which === 'weekend'` branch, replace the `note` string with:

```js
    note = 'Mencakup Makan & Jajan di hari Sabtu–Minggu (Belanja & Cash tetap masuk Belanja Mingguan). Tiap akhir pekan berdiri sendiri — ikut bulan dari hari Sabtu-nya. Sisa (atau minus) akhir pekan yang sudah lewat masuk ke amplop Fleksibel.'
```

In the `which === 'langganan'` branch, replace the `note` string with:

```js
    note = 'Bayar langganan dengan menambah pengeluaran kategori Langganan. Selisih antara alokasi dan pembayaran masuk ke amplop Fleksibel.'
```

- [ ] **Step 2: Run the full suite to confirm nothing asserted those strings**

Run: `npm test`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/EnvelopeSheet.jsx
git commit -m "fix: envelope sheet copy — Lainnya is always Fleksibel; leftovers roll into Fleksibel"
```

---

### Task 4: Sync the App test fixture and add an end-to-end sheet test

**Files:**
- Modify: `src/app.test.jsx`

**Interfaces:**
- Consumes: Task 2's rendered strings (`'Rollover'`, `'Pekan 1–7 Jun'`).
- Produces: `makeDash` now mirrors the real §7.1 contract, so future App tests exercise the new shape.

- [ ] **Step 1: Sync `makeDash` to the new contract**

In `src/app.test.jsx`, replace the `flex:` line inside `makeDash` with:

```js
    flex: { budget: 1800000, rollover: 0, spent: 0, left: 1800000, rollover_items: [] },
```

- [ ] **Step 2: Add the failing integration test**

Append inside the existing `describe('App — renders the server dashboard', …)` block:

```jsx
  it('opens the Fleksibel sheet from the envelope card and shows the rollover', async () => {
    const dash = makeDash([ROW])
    dash.flex = {
      budget: 1800000, rollover: 582000, spent: 0, left: 2382000,
      rollover_items: [{ type: 'week', start: '2026-06-01', end: '2026-06-07', amount: 582000 }],
    }
    api.getMonth.mockResolvedValue(dash)

    render(<App />)
    await screen.findByText('Terpakai')
    fireEvent.click(screen.getByText('Terpakai').closest('button')) // expand envelope card
    fireEvent.click(screen.getByText('Fleksibel'))                  // open the sheet

    expect(screen.getByText('Rollover')).toBeTruthy()
    expect(screen.getByText('+582K')).toBeTruthy()
    expect(screen.getByText('Pekan 1–7 Jun')).toBeTruthy()
  })
```

- [ ] **Step 3: Run the App tests**

Run: `npx vitest run src/app.test.jsx`
Expected: PASS (existing 6 + 1 new). If `getByText('Fleksibel')` matches multiple nodes, scope it: `screen.getAllByText('Fleksibel')[0]` (the env-card row renders before the sheet exists, so the plain query should be unique at click time).

- [ ] **Step 4: Commit**

```bash
git add src/app.test.jsx
git commit -m "test: cover the Fleksibel rollover sheet end-to-end; sync dashboard fixture"
```

---

### Task 5: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: PASS — every file (`format`, `EnvelopeSheet`, `app`, `api`, `Settings`).

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: builds `dist/` with no errors.

- [ ] **Step 3: Manual smoke (optional but recommended)**

`npm run dev` against a local backend **without** Phase 6 (or offline cache): the Fleksibel sheet must render today's ledger with no rollover section and no console errors — this proves the legacy guard. Once the backend Phase 6 ships, re-check with real `rollover_items`.

- [ ] **Step 4: Stop**

Do **not** push to `main` or open a PR — repo policy is PRs only when asked. Report status and wait for direction.

---

## Deployment-order note

This frontend is safe to ship **before** the backend Phase 6: legacy payloads render exactly today's UI (guarded). Until the backend ships, `flex.left` simply won't include rollover — no wrong numbers, just the old behavior.
