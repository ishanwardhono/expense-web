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
    note = 'Mencakup Belanja & Cash (kapan saja), plus Makan & Jajan di hari kerja. Tiap pekan berdiri sendiri — pekan yang terpotong pergantian bulan ikut bulan dari hari Jumat-nya. Sisa (atau minus) pekan yang sudah lewat masuk ke amplop Fleksibel.'
    body = <div className="env-list">{dash.belanja_weeks.map((w) => <WeekRow key={w.friday} row={w} />)}</div>
  } else if (which === 'weekend') {
    title = 'Akhir Pekan'
    sub = 'Amplop untuk Sabtu + Minggu (berdua)'
    note = 'Mencakup Makan & Jajan di hari Sabtu–Minggu (Belanja & Cash tetap masuk Belanja Mingguan). Tiap akhir pekan berdiri sendiri — ikut bulan dari hari Sabtu-nya. Sisa (atau minus) akhir pekan yang sudah lewat masuk ke amplop Fleksibel.'
    body = <div className="env-list">{dash.weekends.map((w) => <WeekRow key={w.saturday} row={w} />)}</div>
  } else if (which === 'langganan') {
    const subs = dash.subscriptions || []
    title = 'Langganan'
    sub = fmtK(envById.langganan.budget) + ' dialokasikan bulan ini'
    note = 'Bayar langganan dengan menambah pengeluaran kategori Langganan. Selisih antara alokasi dan pembayaran masuk ke amplop Fleksibel.'
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
    note = 'Mencakup pengeluaran Lainnya (hari apa pun). Sisa atau minus dari pekan, akhir pekan, dan langganan yang sudah selesai ikut masuk ke amplop ini. Nilainya bisa minus kalau pemakaian melebihi jatah.'
    const flex = dash.flex
    // Legacy guard: cached dashboards (and a backend without Phase 6 yet) have
    // no rollover fields — render the plain ledger then.
    const rollover = flex.rollover || 0
    const items = flex.rollover_items || []
    // rollover_items is grouped by type: one summed row per type (§7.1).
    const itemLabel = (it) =>
      it.type === 'week' ? 'Mingguan' : it.type === 'weekend' ? 'Akhir pekan' : 'Langganan'
    const signedK = (n) => (n > 0 ? '+' : '') + fmtK(n)
    const flexRows = [
      { l: 'Budget bulanan', v: fmtK(dash.stats.budget) },
      { l: '− Belanja mingguan', v: '−' + fmtK(envById.belanja.budget) },
      { l: '− Akhir pekan', v: '−' + fmtK(envById.weekend.budget) },
      { l: '− Langganan', v: '−' + fmtK(envById.langganan.budget) },
      { l: 'Jatah fleksibel', v: fmtK(flex.budget), strong: true },
    ]
    if (items.length > 0) {
      flexRows.push({ l: 'Rollover', v: signedK(rollover), strong: true, cls: rollover >= 0 ? 'g' : 'r' })
      items.forEach((it) => flexRows.push({
        l: itemLabel(it),
        v: it.amount === 0 ? 'pas' : signedK(it.amount),
        sub: true,
        cls: it.amount > 0 ? 'g' : it.amount < 0 ? 'r' : undefined,
      }))
    }
    flexRows.push({ l: 'Terpakai', v: fmtK(flex.spent) })
    flexRows.push({ l: 'Sisa', v: fmtK(flex.left), strong: true, cls: flex.left >= 0 ? 'g' : 'r' })
    body = (
      <div className="env-list">
        {flexRows.map((r, i) => (
          <div className={'fx-row' + (r.strong ? ' strong' : '') + (r.sub ? ' sub' : '') + (r.cls ? ' ' + r.cls : '')} key={i}>
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
