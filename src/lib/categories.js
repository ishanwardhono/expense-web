// Category + envelope colour mapping for the v2 UI.
//
// The manual expense categories are the prototype's five; "Langganan" is a
// payment category carried by the backend (an expense with a subscription_id)
// — it isn't offered as a manual chip in this phase. Envelope tagging now comes
// from the server (each expense ships an `envelope: {id, label}`), so the client
// only maps ids/categories to colours.

import { CFG } from './config.js'

export const CATS = ['Makan', 'Belanja', 'Jajan', 'Cash', 'Lainnya']

const FLEX_COLOR = '#e0962a' // amber — distinct from the Belanja Mingguan blue

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
