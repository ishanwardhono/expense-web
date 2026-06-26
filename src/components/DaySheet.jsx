// One day's expenses + mini-stats + "Tambah Pengeluaran". The list and the
// mini-stats are assembled by the app from the dashboard.

import { Sheet } from './Sheet.jsx'
import { ExpRow } from './ExpRow.jsx'
import { fmtDateLong } from '../lib/format.js'

export function DaySheet({ k, list, subLine, minis, catColor, tagStyle, onClose, onAdd, onEdit }) {
  return (
    <Sheet onClose={onClose}>
      <div className="sheet-title">{fmtDateLong(k)}</div>
      <div className="sheet-sub">{subLine}</div>
      <div className="mini-stats" style={{ gridTemplateColumns: 'repeat(' + minis.length + ', 1fr)' }}>
        {minis.map((s, i) => (
          <div className="mini" key={i}>
            <div className="mini-l">{s.l}</div>
            <div className={'mini-v' + (s.cls ? ' ' + s.cls : '')}>{s.v}</div>
          </div>
        ))}
      </div>
      <div className="sheet-list">
        {list.length === 0 ? (
          <div className="empty-note">Belum ada pengeluaran di hari ini</div>
        ) : (
          list.map((e) => (
            <ExpRow key={e.id} e={e} catColor={catColor} tagStyle={tagStyle} onClick={() => onEdit(e)} />
          ))
        )}
      </div>
      <button className="btn primary full" onClick={onAdd}>+ Tambah Pengeluaran</button>
    </Sheet>
  )
}
