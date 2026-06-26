// Month calendar grid (Monday-start). Layout comes from monthGrid(y,m); each
// day's data (spent / is_today / is_weekend) comes from the server `calendar`.

import { monthGrid, DOWS_HEAD } from '../lib/dates.js'
import { fmtK } from '../lib/format.js'

function AmplopCell({ cell, cellH, onTap }) {
  const day = Number(cell.date.slice(8, 10))
  let cls = 'cell'
  if (cell.is_weekend) cls += ' wknd'
  if (cell.is_today) cls += ' today'
  return (
    <button className={cls} style={{ height: cellH }} onClick={onTap}>
      <span className="dnum">{day}</span>
      <span className="cellstack">
        {cell.spent > 0 ? <span className="spent">{fmtK(cell.spent)}</span> : null}
      </span>
    </button>
  )
}

export function AmplopCalendar({ y, m, calendar, cellH, onDayTap }) {
  const weeks = monthGrid(y, m)
  const byDate = {}
  calendar.forEach((c) => { byDate[c.date] = c })
  return (
    <div className="card cal-card">
      <div className="cal-head">
        {DOWS_HEAD.map((d, i) => (
          <div key={d} className={'cal-dow' + (i >= 5 ? ' wk' : '')}>{d}</div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div className="cal-row" key={wi}>
          {week.map((k, ci) => {
            const cell = k && byDate[k]
            if (!cell) return <div className="cell empty" style={{ height: cellH }} key={'x' + ci}></div>
            return <AmplopCell key={k} cell={cell} cellH={cellH} onTap={() => onDayTap(k)} />
          })}
        </div>
      ))}
    </div>
  )
}
