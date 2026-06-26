// ============================================================
// v2 Amplop — top-level app. Phase 3: the backend owns all envelope/budget
// math, so this renders the server's month dashboard (no client engine) and
// writes through the REST API, re-fetching the month after each change.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { MONTHS_ID, keyToDate } from './lib/dates.js'
import { fmtK } from './lib/format.js'
import { now, todayKey } from './lib/today.js'
import { CFG } from './lib/config.js'
import { CATS, catColor, envColor } from './lib/categories.js'
import * as api from './data/api.js'

import { EnvelopeCard } from './components/EnvelopeCard.jsx'
import { AmplopCalendar } from './components/AmplopCalendar.jsx'
import { ListSection } from './components/ListSection.jsx'
import { DaySheet } from './components/DaySheet.jsx'
import { EnvelopeSheet } from './components/EnvelopeSheet.jsx'
import { ExpenseForm } from './components/ExpenseForm.jsx'
import { ScanEntryMenu } from './components/ScanEntryMenu.jsx'

const TAG_STYLE = 'Garis samping'

export function App() {
  const [cursor, setCursor] = useState(() => ({ y: now().getFullYear(), m: now().getMonth() }))
  const [dash, setDash] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [sheet, setSheet] = useState(null)
  const [filter, setFilter] = useState('Semua')

  const y = cursor.y, m = cursor.m

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const d = await api.getMonth(y, m + 1) // backend months are 1-based
      setDash(d)
      setNotice(d._stale ? 'Menampilkan data tersimpan (offline).' : null)
    } catch (err) {
      setError(err.message || 'Gagal memuat data.')
    } finally {
      setLoading(false)
    }
  }, [y, m])

  useEffect(() => { load() }, [load])

  async function reload() {
    try { setDash(await api.getMonth(y, m + 1)) } catch { /* keep current view */ }
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

  const days = dash ? dash.days : {}
  const spentByDate = {}
  if (dash) dash.calendar.forEach((c) => { spentByDate[c.date] = c.spent })

  const dayContext = (k) => {
    const dow = keyToDate(k).getDay()
    if (dow === 5) return 'Jumat · jatah belanja cair'
    if (dow === 6 || dow === 0) return 'Akhir pekan · amplop Sabtu–Minggu'
    return 'Hari kerja · amplop fleksibel'
  }
  const dayMinis = (k) => {
    const total = spentByDate[k] || 0
    const minis = [{ l: 'Terpakai', v: total > 0 ? fmtK(total) : '—' }]
    const week = dash.belanja_weeks.find((w) => k >= w.monday && k <= w.sunday)
    if (week) minis.push({ l: 'Sisa belanja', v: fmtK(week.left), cls: week.left >= 0 ? 'g' : 'r' })
    const dow = keyToDate(k).getDay()
    if (dow === 0 || dow === 6) {
      const wk = dash.weekends.find((w) => k === w.saturday || k === w.sunday)
      if (wk) minis.push({ l: 'Sisa wknd', v: fmtK(wk.left), cls: wk.left >= 0 ? 'g' : 'r' })
    } else {
      minis.push({ l: 'Sisa fleksibel', v: fmtK(dash.flex.left), cls: dash.flex.left >= 0 ? 'g' : 'r' })
    }
    return minis
  }

  const isCurrentMonth = dash ? dash.period.is_current
    : (y === now().getFullYear() && m === now().getMonth())

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
  function saveExpense(exp, body) {
    runWrite(() => (exp ? api.updateExpense(exp.id, body) : api.addExpense(body)), closeForm)
  }
  function deleteExpense(id) {
    runWrite(() => api.deleteExpense(id), closeForm)
  }
  function closeForm() {
    setSheet((sh) => (sh && sh.from === 'day' ? { type: 'day', k: sh.k } : null))
  }
  function openExpense(e, from, k) {
    // Langganan payments are managed via the subscription flow (Phase 4); their
    // rows are read-only here.
    if (e.category === 'Langganan' || e.subscription_id) {
      setNotice('Pembayaran langganan dikelola di fase berikutnya.')
      return
    }
    setSheet({ type: 'form', k: e.date, exp: e, from })
  }

  // ---------- Render ----------
  const cssVars = { '--accent': CFG.accent, '--cellH': CFG.cellH + 'px' }

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

      {!dash && loading ? (
        <div className="state-card card"><div className="empty-note">Memuat data…</div></div>
      ) : null}

      {!dash && error ? (
        <div className="state-card card">
          <div className="empty-note">{error}</div>
          <button className="btn primary state-retry" onClick={load}>Coba lagi</button>
        </div>
      ) : null}

      {dash ? (
        <>
          <EnvelopeCard stats={dash.stats} envelopes={dash.envelopes} envColor={envColor}
            onTapRow={(id) => setSheet({ type: 'env', which: id })} />

          <AmplopCalendar y={y} m={m} calendar={dash.calendar} cellH={CFG.cellH}
            onDayTap={(k) => setSheet({ type: 'day', k })} />

          <ListSection days={days} filter={filter} setFilter={setFilter} catColor={catColor}
            cats={CATS.concat(['Langganan'])} tagStyle={TAG_STYLE}
            onRowTap={(e) => openExpense(e, null, null)} />
        </>
      ) : null}

      <button className="fab" aria-label="Tambah pengeluaran hari ini"
        onClick={() => openAdd(todayKey(), null)}>+</button>

      {dash && sheet && sheet.type === 'day' ? (
        <DaySheet k={sheet.k} list={days[sheet.k] || []}
          subLine={dayContext(sheet.k)} minis={dayMinis(sheet.k)} catColor={catColor}
          tagStyle={TAG_STYLE}
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
          onSave={(body) => saveExpense(sheet.exp, body)}
          onDelete={deleteExpense} onClose={closeForm} />
      ) : null}

      {dash && sheet && sheet.type === 'env' ? (
        <EnvelopeSheet which={sheet.which} dash={dash} onClose={() => setSheet(null)} />
      ) : null}
    </div>
  )
}
