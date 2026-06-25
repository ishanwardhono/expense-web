// Month calendar grid (Monday-start). Each day cell shows the date and the
// total spent that day; weekends tinted, today highlighted.
// Ported from amplop-components.jsx (AmplopCell + AmplopCalendar).

import { keyToDate, isWeekendKey, monthGrid, DOWS_HEAD } from '../lib/dates.js'
import { fmtK } from '../lib/format.js'
import { todayKey } from '../lib/today.js'

function AmplopCell({ k, spent, cellH, onTap }) {
  const day = keyToDate(k).getDate()
  const isToday = k === todayKey()
  let cls = 'cell'
  if (isWeekendKey(k)) cls += ' wknd'
  if (isToday) cls += ' today'
  return (
    <button className={cls} style={{ height: cellH }} onClick={onTap}>
      <span className="dnum">{day}</span>
      <span className="cellstack">
        {spent > 0 ? <span className="spent">{fmtK(spent)}</span> : null}
      </span>
    </button>
  )
}

export function AmplopCalendar({ y, m, spentOf, cellH, onDayTap }) {
  const weeks = monthGrid(y, m)
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
            if (!k) return <div className="cell empty" style={{ height: cellH }} key={'x' + ci}></div>
            return (
              <AmplopCell key={k} k={k} spent={spentOf(k)} cellH={cellH}
                onTap={() => onDayTap(k)} />
            )
          })}
        </div>
      ))}
    </div>
  )
}
