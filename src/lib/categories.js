// Categories and category/envelope colour + tag mapping for the v2 UI.
//
// Note (deliberate divergence from plan doc §7.2): the manual categories are
// exactly the prototype's set — there is NO manual "Langganan" category.
// Subscription payments surface as a synthetic row tagged "Langganan"; see
// data/store.js. Ported from amplop-app.jsx.

import { CFG, FLEX_COLOR } from './config.js'
import { amplopOf } from './amplop-engine.js'

export const CATS = ['Makan', 'Belanja', 'Jajan', 'Cash', 'Lainnya']

/** Colour for an expense category chip/dot. */
export function catColor(cat) {
  if (cat === 'Langganan') return '#8a8da6'
  const i = CATS.indexOf(cat)
  return CFG.catPalette[i >= 0 ? i : 4]
}

/** Colour for an envelope id (belanja/weekend/langganan/fleksibel). */
export function envColor(id) {
  if (id === 'belanja') return catColor('Belanja')
  if (id === 'weekend') return '#d6569b'
  if (id === 'langganan') return '#8a8da6'
  return FLEX_COLOR
}

const AMP_LABELS = { belanja: 'BLNJ', weekend: 'WKND', fleksibel: 'FLEX', langganan: 'SUBS' }
const AMP_FULL = { belanja: 'Belanja Mingguan', weekend: 'Akhir Pekan', fleksibel: 'Fleksibel', langganan: 'Langganan' }

/** Envelope tag (label/full/color) for an expense or synthetic subscription row. */
export function tagOf(e) {
  const id = e.sub ? 'langganan' : amplopOf(e)
  return { label: AMP_LABELS[id], full: AMP_FULL[id], color: envColor(id) }
}
