// ============================================================
// v2 Amplop — top-level app: state, month nav, sheet routing, persistence.
// Ported from amplop-app.jsx. Changes from the prototype:
//  - Tweaks panel dropped; entry style is fixed to the "menu" FAB flow.
//  - Pinned TODAY replaced with the real clock (lib/today.js).
//  - AI scan flow deferred to Phase 5; the menu's Import option is stubbed.
//  - localStorage via data/store.js (Phase 2 swaps in the API).
// ============================================================

import { useEffect, useState } from 'react'
import { MONTHS_ID, keyToDate } from './lib/dates.js'
import { fmtK } from './lib/format.js'
import { now, todayKey } from './lib/today.js'
import { CFG, budgetConfig } from './lib/config.js'
import { CATS, catColor, envColor, tagOf } from './lib/categories.js'
import { computeAmplop } from './lib/amplop-engine.js'
import { loadStore, saveStore, buildByDay } from './data/store.js'

import { EnvelopeCard } from './components/EnvelopeCard.jsx'
import { AmplopCalendar } from './components/AmplopCalendar.jsx'
import { ListSection } from './components/ListSection.jsx'
import { DaySheet } from './components/DaySheet.jsx'
import { EnvelopeSheet } from './components/EnvelopeSheet.jsx'
import { ExpenseForm } from './components/ExpenseForm.jsx'
import { PaySheet } from './components/PaySheet.jsx'
import { ScanEntryMenu } from './components/ScanEntryMenu.jsx'

const TAG_STYLE = 'Garis samping'

export function App() {
  const [store, setStore] = useState(loadStore)
  const [cursor, setCursor] = useState(() => ({ y: now().getFullYear(), m: now().getMonth() }))
  const [sheet, setSheet] = useState(null)
  const [filter, setFilter] = useState('Semua')

  useEffect(() => { saveStore(store) }, [store])

  const y = cursor.y, m = cursor.m
  const cfg = budgetConfig()
  const A = computeAmplop(store.expenses, store.subs, y, m, cfg)
  const byDay = buildByDay(store.expenses, store.subs, A.monthPrefix)
  const spentOf = (k) => (byDay[k] || []).reduce((s, e) => s + e.amount, 0)

  const dayContext = (k) => {
    const dow = keyToDate(k).getDay()
    if (dow === 5) return 'Jumat · jatah belanja ' + fmtK(cfg.shopWeekly) + ' cair'
    if (dow === 6 || dow === 0) return 'Akhir pekan · amplop ' + fmtK(cfg.weekendBudget) + ' (Sab–Min)'
    return 'Hari kerja · amplop fleksibel'
  }
  const dayMinis = (k) => {
    const total = spentOf(k)
    const minis = [{ l: 'Terpakai', v: total > 0 ? fmtK(total) : '—' }]
    const week = A.weeks.find((w) => k >= w.monK && k <= w.sunK)
    if (week) minis.push({ l: 'Sisa belanja', v: fmtK(week.left), cls: week.left >= 0 ? 'g' : 'r' })
    const dow = keyToDate(k).getDay()
    if (dow === 0 || dow === 6) {
      const wk = A.weekends.find((w) => k === w.satK || k === w.sunK)
      if (wk) minis.push({ l: 'Sisa wknd', v: fmtK(wk.left), cls: wk.left >= 0 ? 'g' : 'r' })
    } else {
      minis.push({ l: 'Sisa fleksibel', v: fmtK(A.flexLeft), cls: A.flexLeft >= 0 ? 'g' : 'r' })
    }
    return minis
  }

  const isCurrentMonth = y === now().getFullYear() && m === now().getMonth()

  // ---------- Actions ----------
  function navMonth(delta) {
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })
  }
  // FAB opens the entry menu (import / manual); a day cell goes straight to manual.
  function openAdd(k, from) {
    if (from !== 'day') {
      setSheet({ type: 'menu', k: k || todayKey(), from: from || null })
    } else {
      setSheet({ type: 'form', k: k || todayKey(), exp: null, from: from || null })
    }
  }
  function saveExpense(data) {
    setStore((s) => {
      if (data.id) {
        return { ...s, expenses: s.expenses.map((e) => (e.id === data.id ? data : e)) }
      }
      return { ...s, expenses: s.expenses.concat([{ ...data, id: 'e' + Date.now() }]) }
    })
    closeForm()
  }
  function deleteExpense(id) {
    setStore((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) }))
    closeForm()
  }
  function setSubPaid(id, paid) {
    setStore((s) => ({ ...s, subs: s.subs.map((x) => (x.id === id ? { ...x, paid } : x)) }))
    closePay()
  }
  function closeForm() {
    setSheet((sh) => (sh && sh.from === 'day' ? { type: 'day', k: sh.k } : null))
  }
  function closePay() {
    setSheet((sh) => {
      if (sh && sh.from === 'env') return { type: 'env', which: 'langganan' }
      if (sh && sh.from === 'day') return { type: 'day', k: sh.k }
      return null
    })
  }
  function openExpense(e, from, k) {
    if (e.sub) { setSheet({ type: 'pay', subId: e.subId, from, k }); return }
    setSheet({ type: 'form', k: e.date, exp: e, from })
  }

  // ---------- Render ----------
  const cssVars = { '--accent': CFG.accent, '--cellH': CFG.cellH + 'px' }
  const activeSub = sheet && sheet.type === 'pay'
    ? store.subs.find((x) => x.id === sheet.subId)
    : null

  return (
    <div className="app" style={cssVars} data-screen-label="Kalender Amplop v2">
      <div className="topbar">
        <div className="month-nav">
          <button className="nav-btn" onClick={() => navMonth(-1)} aria-label="Bulan sebelumnya">‹</button>
          <div className="month-center">
            <div className="month-title">{MONTHS_ID[m]} {y}</div>
          </div>
          <button className="nav-btn" onClick={() => navMonth(1)} aria-label="Bulan selanjutnya">›</button>
        </div>
        {!isCurrentMonth ? (
          <button className="today-pill" onClick={() => setCursor({ y: now().getFullYear(), m: now().getMonth() })}>
            Kembali ke hari ini
          </button>
        ) : null}
      </div>

      <EnvelopeCard A={A} monthly={CFG.monthly} envColor={envColor}
        onTapRow={(id) => setSheet({ type: 'env', which: id })} />

      <AmplopCalendar y={y} m={m} spentOf={spentOf} cellH={CFG.cellH}
        onDayTap={(k) => setSheet({ type: 'day', k })} />

      <ListSection byDay={byDay} filter={filter} setFilter={setFilter} catColor={catColor}
        cats={CATS.concat(['Langganan'])} tagOf={tagOf} tagStyle={TAG_STYLE}
        onRowTap={(e) => openExpense(e, null, null)} />

      <button className="fab" aria-label="Tambah pengeluaran hari ini"
        onClick={() => openAdd(todayKey(), null)}>+</button>

      {sheet && sheet.type === 'day' ? (
        <DaySheet k={sheet.k} list={byDay[sheet.k] || []}
          subLine={dayContext(sheet.k)} minis={dayMinis(sheet.k)} catColor={catColor}
          tagOf={tagOf} tagStyle={TAG_STYLE}
          onClose={() => setSheet(null)}
          onAdd={() => openAdd(sheet.k, 'day')}
          onEdit={(e) => openExpense(e, 'day', sheet.k)} />
      ) : null}

      {sheet && sheet.type === 'menu' ? (
        <ScanEntryMenu
          onManual={() => setSheet({ type: 'form', k: sheet.k, exp: null, from: sheet.from })}
          onClose={() => setSheet((sh) => (sh && sh.from === 'day' ? { type: 'day', k: sh.k } : null))} />
      ) : null}

      {sheet && sheet.type === 'form' ? (
        <ExpenseForm initial={sheet.exp} dateK={sheet.k} catColor={catColor}
          onSave={saveExpense} onDelete={deleteExpense} onClose={closeForm} />
      ) : null}

      {sheet && sheet.type === 'env' ? (
        <EnvelopeSheet which={sheet.which} A={A} cfg={cfg} subs={store.subs}
          onTapSub={(sub) => setSheet({ type: 'pay', subId: sub.id, from: 'env' })}
          onClose={() => setSheet(null)} />
      ) : null}

      {activeSub ? (
        <PaySheet sub={activeSub} monthPrefix={A.monthPrefix}
          onSave={(paid) => setSubPaid(activeSub.id, paid)}
          onCancelPaid={() => setSubPaid(activeSub.id, null)}
          onClose={closePay} />
      ) : null}
    </div>
  )
}
