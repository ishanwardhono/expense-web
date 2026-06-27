// ============================================================
// Pengaturan (Settings) — budget config + subscription catalog.
// Both are effective-dated config: edits apply from the CURRENT month
// (past months frozen) — the backend enforces this; the UI says so.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { now } from '../lib/today.js'
import { CFG } from '../lib/config.js'
import { fmtRp } from '../lib/format.js'
import * as api from '../data/api.js'
import { BudgetSection } from './BudgetSection.jsx'
import { SubscriptionsSection } from './SubscriptionsSection.jsx'

export function Settings() {
  const y = now().getFullYear()
  const month = now().getMonth() + 1 // backend months are 1-based

  const [budget, setBudget] = useState(null)
  const [subs, setSubs] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [b, s] = await Promise.all([api.getBudget(y, month), api.getSubscriptions(y, month)])
      setBudget(b)
      setSubs(s)
    } catch (err) {
      setError(err.message || 'Gagal memuat pengaturan.')
    } finally {
      setLoading(false)
    }
  }, [y, month])

  useEffect(() => { load() }, [load])

  async function run(fn, okMsg) {
    try {
      await fn()
      setNotice(okMsg)
      await load()
    } catch (err) {
      setNotice(err.message || 'Gagal menyimpan.')
    }
  }

  const cssVars = { '--accent': CFG.accent }

  return (
    <div className="app settings" style={cssVars}>
      <div className="set-top">
        <a className="set-back" href="/">‹ Kembali</a>
        <div className="set-title">Pengaturan</div>
      </div>

      {notice ? (
        <button className="notice" onClick={() => setNotice(null)}>{notice} <span className="notice-x">✕</span></button>
      ) : null}

      {loading && !budget ? (
        <div className="state-card card"><div className="empty-note">Memuat…</div></div>
      ) : null}

      {error && !budget ? (
        <div className="state-card card">
          <div className="empty-note">{error}</div>
          <button className="btn primary state-retry" onClick={load}>Coba lagi</button>
        </div>
      ) : null}

      {budget ? (
        <BudgetSection
          budget={budget}
          onSave={(body) => run(() => api.putBudget(body), 'Budget tersimpan.')}
        />
      ) : null}

      {subs ? (
        <SubscriptionsSection
          subs={subs}
          fmtRp={fmtRp}
          onCreate={(body) => run(() => api.createSubscription(body), 'Langganan ditambahkan.')}
          onUpdate={(id, body) => run(() => api.updateSubscription(id, body), 'Langganan diperbarui.')}
          onDelete={(id) => run(() => api.deleteSubscription(id), 'Langganan dihentikan.')}
        />
      ) : null}

      <div className="set-foot">
        Perubahan budget &amp; langganan berlaku mulai bulan ini; bulan-bulan
        sebelumnya tidak berubah.
      </div>
    </div>
  )
}
