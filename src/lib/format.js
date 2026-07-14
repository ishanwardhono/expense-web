// Canonical formatting helpers for the v2 "Amplop" UI.
//
// Per CLAUDE.md, currency/date display must go through these shared helpers
// rather than being hand-rolled at each call site. Ported from the prototype's
// expense-data.jsx so the production output matches the design pixel-for-pixel.

import { keyToDate, MONTHS_ID, DOWS_FULL } from './dates.js'

const MINUS = '−' // U+2212 MINUS SIGN (matches the prototype, not '-')

/**
 * Compact amount: 50000 -> "50K", 1250000 -> "1,25Jt", -5000 -> "−5K".
 * Negative envelope figures (e.g. Fleksibel) render with a leading minus sign.
 */
export function fmtK(n) {
  const v = Number.isFinite(n) ? n : 0
  const neg = v < 0
  const a = Math.abs(v)
  let s
  if (a >= 1000000) s = (a / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + 'Jt'
  else if (a >= 1000) s = (a / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + 'K'
  else s = String(a)
  return (neg ? MINUS : '') + s
}

/**
 * Full Rupiah: 5000000 -> "Rp5.000.000".
 *
 * Matches the prototype, which formats the absolute value (callers only ever
 * pass positive amounts; negative figures use {@link fmtK}, which carries its
 * own minus sign). Non-finite input is treated as 0 so a bad value can never
 * render "RpNaN".
 */
export function fmtRp(n) {
  const a = Number.isFinite(n) ? Math.trunc(Math.abs(n)) : 0
  return 'Rp' + a.toLocaleString('id-ID')
}

/** "Senin, 16 Juni 2026" */
export function fmtDateLong(k) {
  const d = keyToDate(k)
  return DOWS_FULL[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS_ID[d.getMonth()] + ' ' + d.getFullYear()
}

/** "16 Jun" */
export function fmtDateShort(k) {
  const d = keyToDate(k)
  return d.getDate() + ' ' + MONTHS_ID[d.getMonth()].slice(0, 3)
}

/**
 * Date-range label for a week/weekend: "1–7 Jun" when both keys share a
 * month, "29 Jun–5 Jul" when the range crosses one. Mirrors the backend's
 * `range` strings (en dash, no year).
 */
export function fmtRange(startK, endK) {
  const s = keyToDate(startK)
  const sameMonth = s.getMonth() === keyToDate(endK).getMonth()
  return (sameMonth ? s.getDate() : fmtDateShort(startK)) + '–' + fmtDateShort(endK)
}

/**
 * 'HH:MM' wall-clock time from a backend `occurred_at` (RFC3339 with the
 * Asia/Jakarta offset, e.g. '2026-06-01T12:10:00+07:00'). Returns '' for
 * midnight (the backend's "no time given" sentinel) so rows stay clean.
 */
export function hhmm(occurredAt) {
  if (!occurredAt || occurredAt.length < 16) return ''
  const t = occurredAt.slice(11, 16)
  return t === '00:00' ? '' : t
}
