// ============================================================
// v2 Amplop — envelope budget engine (pure, unit-tested)
//
// Attribution rules (amplopOf):
//  - Belanja & Cash                 -> Belanja Mingguan (any day)
//  - Makan & Jajan on a weekday     -> Belanja Mingguan
//  - Makan & Jajan on Sat/Sun       -> Akhir Pekan
//  - Lainnya on Sat/Sun             -> Akhir Pekan
//  - Lainnya on a weekday           -> Fleksibel
//  - subscription payments          -> Langganan (handled via `subs`, not here)
// Month boundaries:
//  - a shopping week (Mon–Sun) belongs to the month of its FRIDAY
//  - a weekend (Sat+Sun) belongs to the month of its SATURDAY
// ============================================================

import { keyToDate, dateKey, pad2, MONTHS_ID } from './dates.js'
import { fmtK, fmtDateShort } from './format.js'

export function addDaysK(k, n) {
  const d = keyToDate(k)
  d.setDate(d.getDate() + n)
  return dateKey(d.getFullYear(), d.getMonth(), d.getDate())
}

export function dowsInMonth(y, m, dow) {
  const dim = new Date(y, m + 1, 0).getDate()
  const out = []
  for (let d = 1; d <= dim; d++) {
    if (new Date(y, m, d).getDay() === dow) out.push(dateKey(y, m, d))
  }
  return out
}

export function amplopOf(e) {
  if (e.cat === 'Belanja' || e.cat === 'Cash') return 'belanja'
  const dow = keyToDate(e.date).getDay()
  const wknd = dow === 0 || dow === 6
  if (e.cat === 'Makan' || e.cat === 'Jajan') return wknd ? 'weekend' : 'belanja'
  return wknd ? 'weekend' : 'fleksibel'
}

export function fmtRange(aK, bK) {
  const a = keyToDate(aK), b = keyToDate(bK)
  if (a.getMonth() === b.getMonth()) {
    return a.getDate() + '–' + b.getDate() + ' ' + MONTHS_ID[a.getMonth()].slice(0, 3)
  }
  return fmtDateShort(aK) + ' – ' + fmtDateShort(bK)
}

export function computeAmplop(expenses, subs, y, m, cfg) {
  const monthPrefix = y + '-' + pad2(m + 1)
  const sum = (list) => list.reduce((s, e) => s + e.amount, 0)

  // Shopping weeks: one per Friday in the month, range Mon–Sun (each week stands alone).
  const weeks = dowsInMonth(y, m, 5).map((fk, i) => {
    const monK = addDaysK(fk, -4), sunK = addDaysK(fk, 2)
    const spent = sum(expenses.filter((e) => amplopOf(e) === 'belanja' && e.date >= monK && e.date <= sunK))
    const w = { i, friK: fk, monK, sunK, budget: cfg.shopWeekly, carryIn: 0, spent }
    w.left = w.budget - w.spent
    return w
  })

  // Weekends: one per Saturday in the month, range Sat+Sun (each weekend stands alone).
  const weekends = dowsInMonth(y, m, 6).map((sk, i) => {
    const sunK = addDaysK(sk, 1)
    const spent = sum(expenses.filter((e) => amplopOf(e) === 'weekend' && (e.date === sk || e.date === sunK)))
    const w = { i, satK: sk, sunK, budget: cfg.weekendBudget, carryIn: 0, spent }
    w.left = w.budget - w.spent
    return w
  })

  const subsAlloc = subs.reduce((s, x) => s + x.alloc, 0)
  const subsPaid = subs.reduce((s, x) => s + (x.paid && x.paid.date.indexOf(monthPrefix) === 0 ? x.paid.amount : 0), 0)
  const flexSpent = sum(expenses.filter((e) => e.date.indexOf(monthPrefix) === 0 && amplopOf(e) === 'fleksibel'))

  const shopBudget = cfg.shopWeekly * weeks.length
  const shopSpent = weeks.reduce((s, w) => s + w.spent, 0)
  const wkndBudget = cfg.weekendBudget * weekends.length
  const wkndSpent = weekends.reduce((s, w) => s + w.spent, 0)
  const flexBudget = cfg.monthly - shopBudget - wkndBudget - subsAlloc
  const totalSpent = shopSpent + wkndSpent + subsPaid + flexSpent

  const friMap = {}, satMap = {}
  weeks.forEach((w) => { friMap[w.friK] = w })
  weekends.forEach((w) => { satMap[w.satK] = w })

  return {
    monthPrefix,
    weeks, weekends, friMap, satMap,
    shopBudget, shopSpent,
    wkndBudget, wkndSpent,
    subsAlloc, subsPaid,
    flexBudget, flexSpent, flexLeft: flexBudget - flexSpent,
    totalSpent, sisa: cfg.monthly - totalSpent,
    rows: [
      { id: 'belanja', label: 'Belanja Mingguan', budget: shopBudget, spent: shopSpent, sub: weeks.length + ' Jumat × ' + fmtK(cfg.shopWeekly) },
      { id: 'weekend', label: 'Akhir Pekan', budget: wkndBudget, spent: wkndSpent, sub: weekends.length + ' akhir pekan × ' + fmtK(cfg.weekendBudget) },
      { id: 'langganan', label: 'Langganan', budget: subsAlloc, spent: subsPaid, sub: subs.length + ' langganan' },
      { id: 'fleksibel', label: 'Fleksibel', budget: flexBudget, spent: flexSpent, sub: 'sisanya, bisa minus' },
    ],
  }
}
