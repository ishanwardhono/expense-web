// Collapsible "Riwayat Pengeluaran" with category filter chips and expenses
// grouped by day. Ported from expense-components.jsx (ListSection).

import { useState } from 'react'
import { ExpRow } from './ExpRow.jsx'
import { CATS } from '../lib/categories.js'
import { fmtRp, fmtDateLong } from '../lib/format.js'

export function ListSection({ byDay, filter, setFilter, catColor, onRowTap, cats, tagOf, tagStyle }) {
  const [open, setOpen] = useState(false)
  const allCats = cats || CATS
  const days = Object.keys(byDay).sort().reverse()
  const groups = days.map((k) => {
    const list = byDay[k].filter((e) => filter === 'Semua' || e.cat === filter)
    return { k, list }
  }).filter((g) => g.list.length > 0)
  const txCount = days.reduce((s, k) => s + byDay[k].length, 0)

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
                  {g.list.slice().reverse().map((e) => (
                    <ExpRow key={e.id} e={e} catColor={catColor} tag={tagOf ? tagOf(e) : null} tagStyle={tagStyle} onClick={() => onRowTap(e)} />
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
