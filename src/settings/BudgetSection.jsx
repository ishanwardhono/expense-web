// Budget config editor. Values are integer Rupiah; PUT applies from this month.

import { useState } from 'react'

const FIELDS = [
  { key: 'monthly', label: 'Budget bulanan' },
  { key: 'shop_weekly', label: 'Belanja mingguan (per Jumat)' },
  { key: 'weekend_budget', label: 'Akhir pekan (per Sabtu–Minggu)' },
]

export function BudgetSection({ budget, onSave }) {
  const [vals, setVals] = useState(() => ({
    monthly: String(budget.monthly),
    shop_weekly: String(budget.shop_weekly),
    weekend_budget: String(budget.weekend_budget),
  }))
  const [err, setErr] = useState('')

  function submit() {
    const out = {}
    for (const f of FIELDS) {
      const n = parseInt(vals[f.key], 10)
      if (!Number.isInteger(n) || n < 0) { setErr('Nilai harus angka ≥ 0'); return }
      out[f.key] = n
    }
    setErr('')
    onSave(out)
  }

  return (
    <div className="card set-card">
      <div className="set-sec-title">Budget</div>
      {err ? <div className="form-err">⚠️ {err}</div> : null}
      {FIELDS.map((f) => (
        <div key={f.key}>
          <label className="f-label">{f.label}</label>
          <div className="amt-wrap">
            <span className="amt-rp">Rp</span>
            <input className="amt-in" type="number" inputMode="numeric" step="1000" min="0"
              aria-label={f.label}
              value={vals[f.key]}
              onChange={(e) => { setVals((v) => ({ ...v, [f.key]: e.target.value })); setErr('') }} />
          </div>
        </div>
      ))}
      <button className="btn primary full set-save" onClick={submit}>Simpan budget</button>
    </div>
  )
}
