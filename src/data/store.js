// Client state persistence for the v2 shell.
//
// Phase 1: localStorage is the source of truth (offline, seeded). Phase 2 wires
// these to the backend and keeps localStorage only as an offline cache.

import { SEED_EXPENSES, SEED_SUBS } from './seed.js'

const STORE_KEY = 'shanci-amplop-v2'

/** Load the store from localStorage, falling back to seed data. */
export function loadStore() {
  try {
    const raw = typeof localStorage !== 'undefined' && localStorage.getItem(STORE_KEY)
    if (raw) {
      const s = JSON.parse(raw)
      if (s && Array.isArray(s.expenses) && Array.isArray(s.subs)) return s
    }
  } catch { /* ignore corrupt/unavailable storage */ }
  return { expenses: SEED_EXPENSES, subs: SEED_SUBS }
}

/** Persist the store to localStorage (best effort). */
export function saveStore(store) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORE_KEY, JSON.stringify(store))
  } catch { /* ignore storage quota/availability errors */ }
}

/**
 * Group a month's expenses by day key, injecting subscription payments as
 * synthetic "Langganan" rows (the prototype's behaviour — subs surface in the
 * day/history views even though they aren't manual expenses). Rows sorted by time.
 */
export function buildByDay(expenses, subs, monthPrefix) {
  const byDay = {}
  expenses.forEach((e) => {
    if (e.date.indexOf(monthPrefix) === 0) {
      (byDay[e.date] = byDay[e.date] || []).push(e)
    }
  })
  subs.forEach((s) => {
    if (s.paid && s.paid.date.indexOf(monthPrefix) === 0) {
      const v = { id: 'sub-' + s.id, date: s.paid.date, time: '', amount: s.paid.amount, cat: 'Langganan', note: s.name, sub: true, subId: s.id }
      ;(byDay[v.date] = byDay[v.date] || []).push(v)
    }
  })
  Object.keys(byDay).forEach((k) => {
    byDay[k].sort((a, b) => (a.time || '').localeCompare(b.time || ''))
  })
  return byDay
}
