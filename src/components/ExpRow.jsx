// One expense row, used in day sheets and the history list.
// `tag` is the envelope tag from categories.tagOf; `tagStyle` 'Garis samping'
// renders it as a coloured side bar. Ported from expense-components.jsx.

import { fmtRp } from '../lib/format.js'

export function ExpRow({ e, catColor, onClick, tag, tagStyle }) {
  const bar = tag && tagStyle === 'Garis samping'
  return (
    <button className={'exp-row' + (bar ? ' has-bar' : '')} onClick={onClick}>
      {bar ? <span className="amp-bar" style={{ background: tag.color }}></span> : null}
      <span className="cat-dot" style={{ background: catColor(e.cat) }}></span>
      <span className="exp-main">
        <span className="exp-cat">
          {e.cat}
          {tag && !bar ? (
            <span className="amp-tag" style={{ color: tag.color, background: 'color-mix(in srgb, ' + tag.color + ' 12%, white)' }}>{tag.label}</span>
          ) : null}
        </span>
        {e.note ? <span className="exp-note">{e.note}</span> : null}
      </span>
      <span className="exp-right">
        <span className="exp-amt">{fmtRp(e.amount)}</span>
        {e.time ? <span className="exp-time">{e.time}</span> : null}
      </span>
    </button>
  )
}
