// Per-envelope breakdown sheet. All figures come from the dashboard:
// belanja_weeks / weekends carry a precomputed `state` (past|current|future);
// the Langganan list is read-only this phase (subscription management → Phase 4).

import { Sheet } from './Sheet.jsx'
import { fmtK, fmtRp, fmtDateShort } from '../lib/format.js'

function WeekRow({ row }) {
  const { range, state, spent, budget, left } = row
  return (
    <div className="env-week">
      <span className="ew-left">
        <span className="ew-range">{range}{state === 'current' ? ' · pekan ini' : ''}</span>
      </span>
      <span className="ew-right">
        {state === 'past' ? (
          <>
            <span className="ew-amt">{fmtK(spent)} <em>/ {fmtK(budget)}</em></span>
            {left === 0 ? (
              <span className="diff pos">pas</span>
            ) : (
              <span className={'diff ' + (left > 0 ? 'pos' : 'neg')}>{left > 0 ? '+' : ''}{fmtK(left)}</span>
            )}
          </>
        ) : state === 'current' ? (
          <>
            <span className="ew-amt">{spent > 0 ? fmtK(spent) + ' terpakai' : 'belum ada'}</span>
            <span className={'diff ' + (left >= 0 ? 'pos' : 'neg')}>sisa {fmtK(left)}</span>
          </>
        ) : (
          <span className="ew-amt"><em>{fmtK(budget)}</em></span>
        )}
      </span>
    </div>
  )
}

export function EnvelopeSheet({ which, dash, onClose }) {
  const envById = {}
  dash.envelopes.forEach((e) => { envById[e.id] = e })
  let title = '', sub = '', body = null, note = ''

  if (which === 'belanja') {
    title = 'Belanja Mingguan'
    sub = 'Jatah cair tiap Jumat · berlaku Senin–Minggu pekan itu'
    note = 'Mencakup Belanja & Cash (kapan saja), plus Makan & Jajan di hari kerja. Tiap pekan berdiri sendiri — pekan yang terpotong pergantian bulan ikut bulan dari hari Jumat-nya.'
    body = <div className="env-list">{dash.belanja_weeks.map((w) => <WeekRow key={w.friday} row={w} />)}</div>
  } else if (which === 'weekend') {
    title = 'Akhir Pekan'
    sub = 'Amplop untuk Sabtu + Minggu (berdua)'
    note = 'Mencakup Makan, Jajan & Lainnya di hari Sabtu–Minggu (Belanja & Cash tetap masuk Belanja Mingguan). Tiap akhir pekan berdiri sendiri — ikut bulan dari hari Sabtu-nya.'
    body = <div className="env-list">{dash.weekends.map((w) => <WeekRow key={w.saturday} row={w} />)}</div>
  } else if (which === 'langganan') {
    const subs = dash.subscriptions || []
    title = 'Langganan'
    sub = fmtK(envById.langganan.budget) + ' dialokasikan bulan ini'
    note = 'Bayar langganan dengan menambah pengeluaran kategori Langganan. Kelola daftar langganan menyusul.'
    body = (
      <div className="sheet-list">
        {subs.length === 0 ? <div className="empty-note">Belum ada langganan</div> : subs.map((s) => {
          const diff = s.paid ? s.alloc - s.paid.amount : 0
          return (
            <div className="sub-row" key={s.id}>
              <span className="sub-main">
                <span className="sub-name">{s.name}</span>
                <span className="sub-sub">{s.paid ? '✓ Dibayar ' + fmtDateShort(s.paid.date) : 'Jatuh tempo tgl ' + s.due_day}</span>
              </span>
              <span className="sub-right">
                <span className="sub-amt">{fmtRp(s.paid ? s.paid.amount : s.alloc)}</span>
                {s.paid ? (
                  diff !== 0
                    ? <span className={'diff ' + (diff > 0 ? 'pos' : 'neg')}>{diff > 0 ? '+' : ''}{fmtK(diff)}</span>
                    : <span className="diff pos">sesuai</span>
                ) : (
                  <span className="diff neg">belum</span>
                )}
              </span>
            </div>
          )
        })}
      </div>
    )
  } else {
    title = 'Fleksibel'
    sub = 'Jatah yang tersisa setelah semua alokasi'
    note = 'Hanya pengeluaran Lainnya di hari kerja yang dihitung dari amplop ini. Nilainya bisa minus kalau pemakaian melebihi jatah.'
    const flexRows = [
      { l: 'Budget bulanan', v: fmtK(dash.stats.budget) },
      { l: '− Belanja mingguan', v: '−' + fmtK(envById.belanja.budget) },
      { l: '− Akhir pekan', v: '−' + fmtK(envById.weekend.budget) },
      { l: '− Langganan', v: '−' + fmtK(envById.langganan.budget) },
      { l: 'Jatah fleksibel', v: fmtK(dash.flex.budget), strong: true },
      { l: 'Terpakai', v: fmtK(dash.flex.spent) },
      { l: 'Sisa', v: fmtK(dash.flex.left), strong: true, cls: dash.flex.left >= 0 ? 'g' : 'r' },
    ]
    body = (
      <div className="env-list">
        {flexRows.map((r, i) => (
          <div className={'fx-row' + (r.strong ? ' strong' : '') + (r.cls ? ' ' + r.cls : '')} key={i}>
            <span className="fx-l">{r.l}</span>
            <span className="fx-v">{r.v}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Sheet onClose={onClose}>
      <div className="sheet-title">{title}</div>
      <div className="sheet-sub">{sub}</div>
      {body}
      {note ? <div className="sheet-note">{note}</div> : null}
      <button className="btn ghost full" onClick={onClose}>Tutup</button>
    </Sheet>
  )
}
