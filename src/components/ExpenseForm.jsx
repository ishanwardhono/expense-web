// Add / edit expense form: amount, category chips, time, note.
// Ported from expense-components.jsx (ExpenseForm). The scan banner only shows
// when an onScan handler is supplied (deferred to Phase 5 — not wired here).

import { useState } from 'react'
import { Sheet } from './Sheet.jsx'
import { CATS } from '../lib/categories.js'
import { pad2 } from '../lib/dates.js'
import { fmtDateLong, hhmm } from '../lib/format.js'

// `subs` is the month's resolved subscription set (from the dashboard); a
// Langganan expense pays one of them. Already-paid subs are disabled (the
// backend allows at most one payment per subscription per calendar month).
export function ExpenseForm({ initial, dateK, catColor, onSave, onDelete, onClose, onScan, subs = [] }) {
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [cat, setCat] = useState(initial ? initial.category : 'Makan')
  const [subId, setSubId] = useState(initial && initial.subscription_id ? initial.subscription_id : '')
  const [note, setNote] = useState(initial && initial.note ? initial.note : '')
  const [time, setTime] = useState(() => {
    if (initial && initial.occurred_at) return hhmm(initial.occurred_at) || '00:00'
    const now = new Date()
    return pad2(now.getHours()) + ':' + pad2(now.getMinutes())
  })
  const [err, setErr] = useState('')

  const chips = CATS.concat(['Langganan'])

  function submit() {
    const a = parseInt(amount, 10)
    if (!a || a <= 0) { setErr('Masukkan jumlah yang valid'); return }
    if (!time) { setErr('Waktu wajib diisi'); return }
    const sid = cat === 'Langganan' ? subId : null
    if (cat === 'Langganan' && !sid) { setErr('Pilih langganan yang dibayar'); return }
    onSave({ date: dateK, time, amount: a, category: cat, subscription_id: sid, note: note.trim() })
  }

  return (
    <Sheet onClose={onClose}>
      <div className="sheet-title">{initial ? 'Ubah Pengeluaran' : 'Tambah Pengeluaran'}</div>
      <div className="sheet-sub">{fmtDateLong(dateK)}</div>
      {onScan ? (
        <button className="scan-banner" onClick={onScan}>
          <span className="sb-ic" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="3" /><path d="M9 18h6" /><path d="m8.5 8.5 2.5 2.5 4-4.5" /></svg>
          </span>
          <span className="sb-tx">
            <span className="sb-t">Impor dari images</span>
            <span className="sb-s">Screenshot GoPay &amp; Livin’</span>
          </span>
          <span className="sb-go">›</span>
        </button>
      ) : null}
      {err ? <div className="form-err">⚠️ {err}</div> : null}
      <label className="f-label">Jumlah</label>
      <div className="amt-wrap">
        <span className="amt-rp">Rp</span>
        <input className="amt-in" type="number" inputMode="numeric" step="500" placeholder="0"
          value={amount} autoFocus={!initial}
          onChange={(e) => { setAmount(e.target.value); setErr('') }} />
      </div>
      <label className="f-label">Kategori</label>
      <div className="cat-chips">
        {chips.map((c) => {
          const on = c === cat
          return (
            <button key={c} className={'chip' + (on ? ' on' : '')}
              style={on ? { background: catColor(c) } : null}
              onClick={() => { setCat(c); setErr('') }}>
              <span className="dot" style={{ background: on ? 'rgba(255,255,255,.85)' : catColor(c) }}></span>
              {c}
            </button>
          )
        })}
      </div>
      {cat === 'Langganan' ? (
        <>
          <label className="f-label">Langganan</label>
          {subs.length === 0 ? (
            <div className="form-err">Belum ada langganan. Tambahkan di halaman Pengaturan dulu.</div>
          ) : (
            <select className="f-in" aria-label="Langganan" value={subId}
              onChange={(e) => { setSubId(e.target.value); setErr('') }}>
              <option value="">Pilih langganan…</option>
              {subs.map((s) => {
                const paid = s.status === 'paid' && s.id !== (initial && initial.subscription_id)
                return <option key={s.id} value={s.id} disabled={paid}>{s.name}{paid ? ' (sudah dibayar)' : ''}</option>
              })}
            </select>
          )}
        </>
      ) : null}
      <div className="form-row">
        <div className="form-col">
          <label className="f-label">Waktu</label>
          <input className="f-in" type="time" value={time} required lang="id-ID"
            onChange={(e) => { setTime(e.target.value); setErr('') }} />
        </div>
      </div>
      <label className="f-label">Catatan (opsional)</label>
      <textarea className="f-in" rows="2" placeholder="Masukkan catatan pengeluaran..."
        value={note} onChange={(e) => setNote(e.target.value)}></textarea>
      <div className="btn-row">
        {initial ? (
          <button className="btn danger" onClick={() => onDelete(initial.id)}>Hapus</button>
        ) : null}
        <button className="btn ghost" onClick={onClose}>Batal</button>
        <button className="btn primary" onClick={submit}>Simpan</button>
      </div>
    </Sheet>
  )
}
