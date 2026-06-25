import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Exercises the REAL adapter (failure paths) by configuring a URL via env and
// stubbing global.fetch. Each test imports api.js fresh so USE_MOCK is false.
beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('VITE_GET_MONTH_URL', 'https://example.test/month')
})
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks() })

describe('api real adapter — failure paths', () => {
  it('throws a friendly Indonesian error on a cold network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'))
    const api = await import('./api.js')
    expect(api.USE_MOCK).toBe(false)
    await expect(api.getMonth(2026, 5)).rejects.toThrow('Tidak dapat terhubung ke server.')
  })

  it('falls back to the offline cache (flagged _stale) after a prior success', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          expenses: [{ id: 'a', date: '2026-06-10', time: '12:00', amount: 5000, cat: 'Makan', note: '' }],
          subs: [],
          config: { monthly: 1, shopWeekly: 1, weekendBudget: 1 },
        }),
      })
      .mockRejectedValueOnce(new Error('Failed to fetch'))
    const api = await import('./api.js')

    const fresh = await api.getMonth(2026, 5)
    expect(fresh.expenses.some((e) => e.id === 'a')).toBe(true)

    const stale = await api.getMonth(2026, 5)
    expect(stale._stale).toBe(true)
    expect(stale.expenses.some((e) => e.id === 'a')).toBe(true)
  })

  it('maps a non-ok HTTP response to an error', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
    const api = await import('./api.js')
    await expect(api.getMonth(2026, 5)).rejects.toThrow()
  })
})
