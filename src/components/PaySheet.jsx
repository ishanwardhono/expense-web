// Subscription pay sheet — set or clear this month's payment.
// Per the prototype (and confirmed over the plan doc), "paid" is stored as
// { date, amount }, not derived. Ported from expense-components.jsx (PaySheet).

import { useState } from 'react'
import { Sheet } from './Sheet.jsx'
import { fmtRp, fmtDateShort } from '../lib/format.js'
import { todayKey } from '../lib/today.js'

export function PaySheet({ sub, monthPrefix, onSave, onCancelPaid, onClose }) {
  const paid = sub.paid && sub.paid.date.startsWith(monthPrefix) ? sub.paid : null
  const [amount, setAmount] = useState(String(paid ? paid.amount : sub.alloc))
  const [date, setDate] = useState(paid ? paid.date : todayKey())
  const [err, setErr] = useState('')

  function submit() {
    const a = parseInt(amount, 10)
    if (!a || a <= 0) { setErr('Masukkan jumlah yang valid'); return }
    onSave({ date, amount: a })
  }

  return (
    <Sheet onClose={onClose}>
      <div className="sheet-title">{paid ? 'Ubah Pembayaran' : 'Bayar'} · {sub.name}</div>
      <div className="sheet-sub">Alokasi {fmtRp(sub.alloc)} · jatuh tempo {fmtDateShort(sub.due)}</div>
      {err ? <div className="form-err">⚠️ {err}</div> : null}
      <label className="f-label">Jumlah dibayar</label>
      <div className="amt-wrap">
        <span className="amt-rp">Rp</span>
        <input className="amt-in" type="number" inputMode="numeric" step="500" value={amount}
          onChange={(e) => { setAmount(e.target.value); setErr('') }} />
      </div>
      <label className="f-label">Tanggal bayar</label>
      <input className="f-in" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <div className="btn-row">
        {paid ? (
          <button className="btn danger" onClick={onCancelPaid}>Batalkan</button>
        ) : null}
        <button className="btn ghost" onClick={onClose}>Batal</button>
        <button className="btn primary" onClick={submit}>Simpan</button>
      </div>
    </Sheet>
  )
}
