import { describe, it, expect, beforeEach } from 'vitest'
import { getMonth, addExpense, updateExpense, deleteExpense, setSubPayment, _resetLocal, USE_MOCK } from './api.js'

// These exercise the mock adapter (no real endpoints configured in tests).
beforeEach(() => { _resetLocal() })

describe('api mock adapter', () => {
  it('runs in mock mode when no endpoint URL is configured', () => {
    expect(USE_MOCK).toBe(true)
  })

  it('getMonth returns expenses, subs, and the budget config', async () => {
    const d = await getMonth(2026, 5)
    expect(d.config).toEqual({ monthly: 5000000, shopWeekly: 600000, weekendBudget: 200000 })
    expect(d.subs.length).toBe(4)
    expect(d.expenses.length).toBeGreaterThan(0)
    // Seed is June 2026 — all within the June window.
    expect(d.expenses.every((e) => e.date.startsWith('2026-06'))).toBe(true)
  })

  it('returns the PADDED window so boundary days appear in the adjacent month', async () => {
    // A Monday whose shopping week (Mon 06-29 .. Sun 07-05) belongs to July.
    await addExpense({ date: '2026-06-29', time: '10:00', amount: 100000, cat: 'Belanja', note: 'x' })
    const july = await getMonth(2026, 6)
    expect(july.expenses.some((e) => e.date === '2026-06-29')).toBe(true)
  })

  it('addExpense assigns an id and persists', async () => {
    const created = await addExpense({ date: '2026-06-20', time: '12:00', amount: 12345, cat: 'Makan', note: '' })
    expect(created.id).toBeTruthy()
    const d = await getMonth(2026, 5)
    expect(d.expenses.find((e) => e.id === created.id).amount).toBe(12345)
  })

  it('updateExpense edits in place', async () => {
    const created = await addExpense({ date: '2026-06-20', time: '12:00', amount: 100, cat: 'Makan', note: '' })
    await updateExpense({ ...created, amount: 999 })
    const d = await getMonth(2026, 5)
    expect(d.expenses.find((e) => e.id === created.id).amount).toBe(999)
  })

  it('deleteExpense removes the row', async () => {
    const created = await addExpense({ date: '2026-06-20', time: '12:00', amount: 100, cat: 'Makan', note: '' })
    await deleteExpense(created.id)
    const d = await getMonth(2026, 5)
    expect(d.expenses.find((e) => e.id === created.id)).toBeUndefined()
  })

  it('setSubPayment sets and clears a subscription payment', async () => {
    await setSubPayment('s3', { date: '2026-06-18', amount: 59000 })
    let d = await getMonth(2026, 5)
    expect(d.subs.find((s) => s.id === 's3').paid).toEqual({ date: '2026-06-18', amount: 59000 })

    await setSubPayment('s3', null)
    d = await getMonth(2026, 5)
    expect(d.subs.find((s) => s.id === 's3').paid).toBeNull()
  })
})
