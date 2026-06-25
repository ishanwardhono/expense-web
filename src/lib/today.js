// Single source of "now" for the v2 UI. The prototype hard-pinned TODAY to
// 2026-06-16 for a deterministic demo; production uses the real clock. Kept in
// one module so tests (and future features) can inject a fixed clock instead.

import { dateKey } from './dates.js'

let _now = () => new Date()

/** Override the clock (tests/demos). Pass no args to reset to the real clock. */
export function setNow(fn) { _now = fn || (() => new Date()) }

/** Current Date per the active clock. */
export function now() { return _now() }

/** Today's 'YYYY-MM-DD' key per the active clock. */
export function todayKey() {
  const d = _now()
  return dateKey(d.getFullYear(), d.getMonth(), d.getDate())
}
