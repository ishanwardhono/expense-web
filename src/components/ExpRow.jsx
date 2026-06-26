// One expense row (day sheets + history). Renders server fields directly: the
// envelope tag ships on each expense (`e.envelope = {id, label}`), and the time
// is derived from `e.occurred_at`. `tagStyle` 'Garis samping' = coloured side bar.

import { hhmm } from '../lib/format.js'
import { fmtRp } from '../lib/format.js'
import { envColor } from '../lib/categories.js'

export function ExpRow({ e, catColor, onClick, tagStyle }) {
  const tag = e.envelope ? { label: e.envelope.label, color: envColor(e.envelope.id) } : null
  const bar = tag && tagStyle === 'Garis samping'
  const time = hhmm(e.occurred_at)
  return (
    <button className={'exp-row' + (bar ? ' has-bar' : '')} onClick={onClick}>
      {bar ? <span className="amp-bar" style={{ background: tag.color }}></span> : null}
      <span className="cat-dot" style={{ background: catColor(e.category) }}></span>
      <span className="exp-main">
        <span className="exp-cat">
          {e.category}
          {tag && !bar ? (
            <span className="amp-tag" style={{ color: tag.color, background: 'color-mix(in srgb, ' + tag.color + ' 12%, white)' }}>{tag.label}</span>
          ) : null}
        </span>
        {e.note ? <span className="exp-note">{e.note}</span> : null}
      </span>
      <span className="exp-right">
        <span className="exp-amt">{fmtRp(e.amount)}</span>
        {time ? <span className="exp-time">{time}</span> : null}
      </span>
    </button>
  )
}
