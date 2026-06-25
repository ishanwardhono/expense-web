// Per-envelope breakdown sheet (weeks, weekends, subscription list, or the
// flexible math). Ported from amplop-components.jsx (WeekRow + EnvelopeSheet).

import { Sheet } from './Sheet.jsx'
import { fmtK, fmtDateShort } from '../lib/format.js'
import { fmtRp } from '../lib/format.js'
import { fmtRange } from '../lib/amplop-engine.js'
import { todayKey } from '../lib/today.js'

function WeekRow({ rangeText, w, startK }) {
  const today = todayKey()
  const past = w.sunK < today
  const current = !past && startK <= today
  return (
    <div className="env-week">
      <span className="ew-left">
        <span className="ew-range">{rangeText}{current ? ' · pekan ini' : ''}</span>
      </span>
      <span className="ew-right">
        {past ? (
          <>
            <span className="ew-amt">{fmtK(w.spent)} <em>/ {fmtK(w.budget)}</em></span>
            {w.left === 0 ? (
              <span className="diff pos">pas</span>
            ) : (
              <span className={'diff ' + (w.left > 0 ? 'pos' : 'neg')}>{w.left > 0 ? '+' : ''}{fmtK(w.left)}</span>
            )}
          </>
        ) : current ? (
          <>
            <span className="ew-amt">{w.spent > 0 ? fmtK(w.spent) + ' terpakai' : 'belum ada'}</span>
            <span className={'diff ' + (w.left >= 0 ? 'pos' : 'neg')}>sisa {fmtK(w.left)}</span>
          </>
        ) : (
          <span className="ew-amt"><em>{fmtK(w.budget)}</em></span>
        )}
      </span>
    </div>
  )
}

export function EnvelopeSheet({ which, A, cfg, subs, onTapSub, onClose }) {
  let title = '', sub = '', body = null, note = ''

  if (which === 'belanja') {
    title = 'Belanja Mingguan'
    sub = 'Jatah ' + fmtK(cfg.shopWeekly) + ' cair tiap Jumat · berlaku Senin–Minggu pekan itu'
    note = 'Mencakup Belanja & Cash (kapan saja), plus Makan & Jajan di hari kerja. Tiap pekan berdiri sendiri — pekan yang terpotong pergantian bulan ikut bulan dari hari Jumat-nya.'
    body = (
      <div className="env-list">
        {A.weeks.map((w) => (
          <WeekRow key={w.friK} rangeText={fmtRange(w.monK, w.sunK)} w={w} startK={w.monK} />
        ))}
      </div>
    )
  } else if (which === 'weekend') {
    title = 'Akhir Pekan'
    sub = fmtK(cfg.weekendBudget) + ' untuk Sabtu + Minggu (berdua)'
    note = 'Mencakup Makan, Jajan & Lainnya di hari Sabtu–Minggu (Belanja & Cash tetap masuk Belanja Mingguan). Tiap akhir pekan berdiri sendiri — ikut bulan dari hari Sabtu-nya.'
    body = (
      <div className="env-list">
        {A.weekends.map((w) => (
          <WeekRow key={w.satK} rangeText={fmtRange(w.satK, w.sunK)} w={w} startK={w.satK} />
        ))}
      </div>
    )
  } else if (which === 'langganan') {
    title = 'Langganan'
    sub = fmtK(A.subsAlloc) + ' dialokasikan bulan ini'
    body = (
      <div className="sheet-list">
        {subs.map((s) => {
          const paid = s.paid && s.paid.date.indexOf(A.monthPrefix) === 0 ? s.paid : null
          const diff = paid ? s.alloc - paid.amount : 0
          return (
            <button className="sub-row" key={s.id} onClick={() => onTapSub(s)}>
              <span className="sub-main">
                <span className="sub-name">{s.name}</span>
                <span className="sub-sub">{paid ? '✓ Dibayar ' + fmtDateShort(paid.date) : 'Jatuh tempo ' + fmtDateShort(s.due)}</span>
              </span>
              <span className="sub-right">
                <span className="sub-amt">{fmtRp(paid ? paid.amount : s.alloc)}</span>
                {paid ? (
                  diff !== 0
                    ? <span className={'diff ' + (diff > 0 ? 'pos' : 'neg')}>{diff > 0 ? '+' : ''}{fmtK(diff)}</span>
                    : <span className="diff pos">sesuai</span>
                ) : (
                  <span className="pay-tag">Bayar</span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    )
  } else {
    title = 'Fleksibel'
    sub = 'Jatah yang tersisa setelah semua alokasi'
    note = 'Hanya pengeluaran Lainnya di hari kerja yang dihitung dari amplop ini. Nilainya bisa minus kalau pemakaian melebihi jatah.'
    const flexRows = [
      { l: 'Budget bulanan', v: fmtK(cfg.monthly) },
      { l: '− Belanja mingguan', v: '−' + fmtK(A.shopBudget) },
      { l: '− Akhir pekan', v: '−' + fmtK(A.wkndBudget) },
      { l: '− Langganan', v: '−' + fmtK(A.subsAlloc) },
      { l: 'Jatah fleksibel', v: fmtK(A.flexBudget), strong: true },
      { l: 'Terpakai', v: fmtK(A.flexSpent) },
      { l: 'Sisa', v: fmtK(A.flexLeft), strong: true, cls: A.flexLeft >= 0 ? 'g' : 'r' },
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
