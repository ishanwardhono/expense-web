// ============================================================
// v2 Amplop — top-level app: state, month nav, sheet routing.
//
// Phase 2: data now flows through data/api.js (mock or real, env-selected)
// instead of synchronous localStorage. The view loads a month at a time with
// loading / error / retry states; budget config comes from the API response.
// localStorage remains the offline cache (handled inside data/api.js).
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { MONTHS_ID, keyToDate, monthPrefixOf } from './lib/dates.js'
import { fmtK } from './lib/format.js'
import { now, todayKey } from './lib/today.js'
import { CFG } from './lib/config.js'
import { CATS, catColor, envColor, tagOf } from './lib/categories.js'
import { computeAmplop } from './lib/amplop-engine.js'
import { buildByDay } from './data/store.js'
import * as api from './data/api.js'

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
  const [cursor, setCursor] = useState(() => ({ y: now().getFullYear(), m: now().getMonth() }))
  const [data, setData] = useState(null)   // { expenses, subs, config }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [sheet, setSheet] = useState(null)
  const [filter, setFilter] = useState('Semua')

  const y = cursor.y, m = cursor.m
  const monthPrefix = monthPrefixOf(y, m)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const d = await api.getMonth(y, m)
      setData(d)
      setNotice(d._stale ? 'Menampilkan data tersimpan (offline).' : null)
    } catch (err) {
      setError(err.message || 'Gagal memuat data.')
    } finally {
      setLoading(false)
    }
  }, [y, m])

  useEffect(() => { load() }, [load])

  // Re-fetch the current month after a successful write so the view stays true.
  async function reload() {
    try { setData(await api.getMonth(y, m)) } catch { /* keep current view */ }
  }
  async function runWrite(fn, closer) {
    try {
      await fn()
      if (closer) closer()
      await reload()
    } catch (err) {
      setNotice(err.message || 'Gagal menyimpan.')
    }
  }

  const cfg = data && data.config
  const A = data ? computeAmplop(data.expenses, data.subs, y, m, cfg) : null
  const byDay = data ? buildByDay(data.expenses, data.subs, monthPrefix) : {}
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
  function openAdd(k, from) {
    if (from !== 'day') setSheet({ type: 'menu', k: k || todayKey(), from: from || null })
    else setSheet({ type: 'form', k: k || todayKey(), exp: null, from: from || null })
  }
  function saveExpense(dataIn) {
    runWrite(() => (dataIn.id ? api.updateExpense(dataIn) : api.addExpense(dataIn)), closeForm)
  }
  function deleteExpense(id) {
    runWrite(() => api.deleteExpense(id), closeForm)
  }
  function setSubPaid(id, paid) {
    runWrite(() => api.setSubPayment(id, paid), closePay)
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
  const activeSub = sheet && sheet.type === 'pay' && data
    ? data.subs.find((x) => x.id === sheet.subId)
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

      {notice ? (
        <button className="notice" onClick={() => setNotice(null)}>{notice} <span className="notice-x">✕</span></button>
      ) : null}

      {!data && loading ? (
        <div className="state-card card"><div className="empty-note">Memuat data…</div></div>
      ) : null}

      {!data && error ? (
        <div className="state-card card">
          <div className="empty-note">{error}</div>
          <button className="btn primary state-retry" onClick={load}>Coba lagi</button>
        </div>
      ) : null}

      {data ? (
        <>
          <EnvelopeCard A={A} monthly={cfg.monthly} envColor={envColor}
            onTapRow={(id) => setSheet({ type: 'env', which: id })} />

          <AmplopCalendar y={y} m={m} spentOf={spentOf} cellH={CFG.cellH}
            onDayTap={(k) => setSheet({ type: 'day', k })} />

          <ListSection byDay={byDay} filter={filter} setFilter={setFilter} catColor={catColor}
            cats={CATS.concat(['Langganan'])} tagOf={tagOf} tagStyle={TAG_STYLE}
            onRowTap={(e) => openExpense(e, null, null)} />
        </>
      ) : null}

      <button className="fab" aria-label="Tambah pengeluaran hari ini"
        onClick={() => openAdd(todayKey(), null)}>+</button>

      {data && sheet && sheet.type === 'day' ? (
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

      {data && sheet && sheet.type === 'env' ? (
        <EnvelopeSheet which={sheet.which} A={A} cfg={cfg} subs={data.subs}
          onTapSub={(sub) => setSheet({ type: 'pay', subId: sub.id, from: 'env' })}
          onClose={() => setSheet(null)} />
      ) : null}

      {activeSub ? (
        <PaySheet sub={activeSub} monthPrefix={monthPrefix}
          onSave={(paid) => setSubPaid(activeSub.id, paid)}
          onCancelPaid={() => setSubPaid(activeSub.id, null)}
          onClose={closePay} />
      ) : null}
    </div>
  )
}
