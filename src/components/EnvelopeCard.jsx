// Envelope card (replaces the old stat strip). Collapsed: Terpakai/Budget/Sisa.
// Expanded: the four envelope rows with progress bars.
// Ported from amplop-components.jsx (EnvelopeCard).

import { useState } from 'react'
import { fmtK } from '../lib/format.js'

export function EnvelopeCard({ A, monthly, envColor, onTapRow }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card env-card">
      <button className={'env-top env-toggle' + (open ? ' open' : '')} onClick={() => setOpen(!open)} aria-expanded={open}>
        <div className="stat">
          <div className="stat-label">Terpakai</div>
          <div className="stat-value">{fmtK(A.totalSpent)}</div>
        </div>
        <div className="stat mid">
          <div className="stat-label">Budget</div>
          <div className="stat-value">{fmtK(monthly)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Sisa</div>
          <div className={'stat-value ' + (A.sisa >= 0 ? 'g' : 'r')}>{fmtK(A.sisa)}</div>
        </div>
        <span className={'env-top-caret' + (open ? ' open' : '')}>›</span>
      </button>
      {open ? (
        <div className="env-rows">
          {A.rows.map((r) => {
            const over = r.spent > r.budget
            const pct = r.budget > 0 ? Math.min(100, (r.spent / r.budget) * 100) : 100
            return (
              <button className="env-row" key={r.id} onClick={() => onTapRow(r.id)}>
                <span className="env-dot" style={{ background: envColor(r.id) }}></span>
                <span className="env-main">
                  <span className="env-line">
                    <span className="env-label">{r.label}</span>
                    <span className={'env-nums' + (over ? ' r' : '')}>
                      {fmtK(r.spent)} <em>/ {fmtK(r.budget)}</em>
                    </span>
                  </span>
                  <span className="bar">
                    <span className="bar-fill" style={{ width: pct + '%', background: over ? 'var(--red)' : envColor(r.id) }}></span>
                  </span>
                </span>
                <span className="env-caret">›</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
