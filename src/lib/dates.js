// Date helpers for the v2 "Amplop" UI. Dates are stored as 'YYYY-MM-DD' keys.
// Ported from the prototype's expense-data.jsx (pure, no globals).

export const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
export const DOWS_FULL = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
export const DOWS_HEAD = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

export function pad2(n) { return String(n).padStart(2, '0') }

export function dateKey(y, m, d) { return y + '-' + pad2(m + 1) + '-' + pad2(d) }

export function keyToDate(k) {
  const p = k.split('-').map(Number)
  return new Date(p[0], p[1] - 1, p[2])
}

export function isWeekendKey(k) {
  const dow = keyToDate(k).getDay()
  return dow === 0 || dow === 6
}

// Month grid, one row per week, Monday-start. null = empty cell.
export function monthGrid(y, m) {
  const lead = (new Date(y, m, 1).getDay() + 6) % 7
  const dim = new Date(y, m + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= dim; d++) cells.push(dateKey(y, m, d))
  while (cells.length % 7) cells.push(null)
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}
