// Envelope card. Collapsed: Terpakai / Budget / Sisa (from dashboard `stats`).
// Expanded: the four envelope rows (from dashboard `envelopes`, each already
// carrying budget/spent/left/over).

import { useState } from 'react'
import { fmtK } from '../lib/format.js'

export function EnvelopeCard({ stats, envelopes, envColor, onTapRow }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card env-card">
      <button className={'env-top env-toggle' + (open ? ' open' : '')} onClick={() => setOpen(!open)} aria-expanded={open}>
        <div className="stat">
          <div className="stat-label">Terpakai</div>
          <div className="stat-value">{fmtK(stats.spent)}</div>
        </div>
        <div className="stat mid">
          <div className="stat-label">Budget</div>
          <div className="stat-value">{fmtK(stats.budget)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Sisa</div>
          <div className={'stat-value ' + (stats.remaining >= 0 ? 'g' : 'r')}>{fmtK(stats.remaining)}</div>
        </div>
        <span className={'env-top-caret' + (open ? ' open' : '')}>›</span>
      </button>
      {open ? (
        <div className="env-rows">
          {envelopes.map((r) => {
            const pct = r.budget > 0 ? Math.min(100, (r.spent / r.budget) * 100) : 100
            return (
              <button className="env-row" key={r.id} onClick={() => onTapRow(r.id)}>
                <span className="env-dot" style={{ background: envColor(r.id) }}></span>
                <span className="env-main">
                  <span className="env-line">
                    <span className="env-label">{r.label}</span>
                    <span className={'env-nums' + (r.over ? ' r' : '')}>
                      {fmtK(r.spent)} <em>/ {fmtK(r.budget)}</em>
                    </span>
                  </span>
                  <span className="bar">
                    <span className="bar-fill" style={{ width: pct + '%', background: r.over ? 'var(--red)' : envColor(r.id) }}></span>
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
