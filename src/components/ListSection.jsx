// Collapsible "Riwayat Pengeluaran": category filter chips + expenses grouped
// by day. Driven by the dashboard `days` map (date -> expense rows).

import { useState } from 'react'
import { ExpRow } from './ExpRow.jsx'
import { CATS } from '../lib/categories.js'
import { fmtRp, fmtDateLong } from '../lib/format.js'

export function ListSection({ days, filter, setFilter, catColor, onRowTap, cats, tagStyle }) {
  const [open, setOpen] = useState(false)
  const allCats = cats || CATS
  const dayKeys = Object.keys(days).sort().reverse()
  const groups = dayKeys.map((k) => {
    const list = days[k].filter((e) => filter === 'Semua' || e.category === filter)
    return { k, list }
  }).filter((g) => g.list.length > 0)
  const txCount = dayKeys.reduce((s, k) => s + days[k].length, 0)

  return (
    <div className="list-section">
      <button className="sec-head sec-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
        <div className="sec-title">Riwayat Pengeluaran</div>
        <div className="sec-meta">
          {txCount} transaksi
          <span className={'sec-caret' + (open ? ' open' : '')}>›</span>
        </div>
      </button>
      {open ? (
        <>
          <div className="chips">
            {['Semua'].concat(allCats).map((c) => {
              const on = c === filter
              const color = c === 'Semua' ? 'var(--accent)' : catColor(c)
              return (
                <button key={c} className={'chip' + (on ? ' on' : '')}
                  style={on ? { background: color } : null}
                  onClick={() => setFilter(c)}>
                  {c !== 'Semua' ? <span className="dot" style={{ background: on ? 'rgba(255,255,255,.85)' : catColor(c) }}></span> : null}
                  {c}
                </button>
              )
            })}
          </div>
          {groups.length === 0 ? (
            <div className="empty-note card-pad">Tidak ada pengeluaran{filter !== 'Semua' ? ' untuk kategori ' + filter : ''}</div>
          ) : (
            groups.map((g) => {
              const total = g.list.reduce((s, e) => s + e.amount, 0)
              return (
                <div className="day-group" key={g.k}>
                  <div className="day-head">
                    <span>{fmtDateLong(g.k)}</span>
                    <span className="total">{fmtRp(total)}</span>
                  </div>
                  {g.list.map((e) => (
                    <ExpRow key={e.id} e={e} catColor={catColor} tagStyle={tagStyle} onClick={() => onRowTap(e)} />
                  ))}
                </div>
              )
            })
          )}
        </>
      ) : null}
    </div>
  )
}
