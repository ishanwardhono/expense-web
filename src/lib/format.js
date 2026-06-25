// Canonical formatting helpers for the v2 "Amplop" UI.
//
// Per CLAUDE.md, currency must be formatted through shared helpers rather than
// hand-rolled at each call site. This module is the single source for that.
//
// Phase 0 establishes `fmtRp` (full Rupiah). The compact `fmtK` form and the
// remaining `expense-data` helpers (dates, categories) are ported in Phase 1
// from the prototype bundle, where their exact display format is defined.

/**
 * Format an integer amount as Indonesian Rupiah, e.g. 5000000 -> "Rp5.000.000".
 *
 * Amounts in v2 are integers (no decimals). Non-finite input is treated as 0
 * so a bad value can never render "RpNaN" in the UI. Negative values (the
 * Fleksibel envelope can go negative) render as "-Rp5.000".
 *
 * @param {number} amount integer rupiah
 * @returns {string}
 */
export function fmtRp(amount) {
  const n = Number.isFinite(amount) ? Math.trunc(amount) : 0
  const sign = n < 0 ? '-' : ''
  const grouped = Math.abs(n).toLocaleString('id-ID')
  return `${sign}Rp${grouped}`
}
