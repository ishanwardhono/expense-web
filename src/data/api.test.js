import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// api.js reads BASE from import.meta.env at import time, so each test stubs env
// + global.fetch, then imports fresh.
beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('VITE_API_BASE_URL', 'http://test.local')
})
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

function jsonRes(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

const MINI_DASH = { period: { year: 2026, month: 6 }, stats: {}, days: {} }

describe('api client', () => {
  it('getMonth requests the dashboard with 1-based month and returns it', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonRes(MINI_DASH))
    vi.stubGlobal('fetch', fetchMock)
    const api = await import('./api.js')

    const d = await api.getMonth(2026, 6)
    expect(d).toEqual(MINI_DASH)
    expect(fetchMock).toHaveBeenCalledWith('http://test.local/month?year=2026&month=6', expect.any(Object))
  })

  it('addExpense POSTs the body to /expenses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonRes({ id: 'new' }, 201))
    vi.stubGlobal('fetch', fetchMock)
    const api = await import('./api.js')

    const body = { date: '2026-06-23', time: '12:10', amount: 18000, category: 'Makan', subscription_id: null, note: 'x' }
    const created = await api.addExpense(body)
    expect(created).toEqual({ id: 'new' })
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe('http://test.local/expenses')
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body)).toEqual(body)
  })

  it('updateExpense PUTs to /expenses/{id}', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonRes({ id: 'abc' }))
    vi.stubGlobal('fetch', fetchMock)
    const api = await import('./api.js')

    await api.updateExpense('abc', { amount: 99 })
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe('http://test.local/expenses/abc')
    expect(opts.method).toBe('PUT')
  })

  it('deleteExpense DELETEs and returns null on 204', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204, json: async () => { throw new Error('no body') } })
    vi.stubGlobal('fetch', fetchMock)
    const api = await import('./api.js')

    const res = await api.deleteExpense('abc')
    expect(res).toBeNull()
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE')
  })

  it('surfaces the server {error} message on a non-2xx response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonRes({ error: 'subscription already paid this month' }, 409))
    vi.stubGlobal('fetch', fetchMock)
    const api = await import('./api.js')

    await expect(api.addExpense({})).rejects.toThrow('subscription already paid this month')
  })

  it('maps a network failure to a friendly Indonesian error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')))
    const api = await import('./api.js')
    await expect(api.getMonth(2026, 6)).rejects.toThrow('Tidak dapat terhubung ke server.')
  })

  it('falls back to the cached dashboard (flagged _stale) when a fetch fails', async () => {
    const mem = new Map()
    vi.stubGlobal('localStorage', {
      getItem: (k) => (mem.has(k) ? mem.get(k) : null),
      setItem: (k, v) => mem.set(k, v),
    })
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonRes(MINI_DASH))
      .mockRejectedValueOnce(new Error('Failed to fetch'))
    vi.stubGlobal('fetch', fetchMock)
    const api = await import('./api.js')

    await api.getMonth(2026, 6)               // success → caches
    const stale = await api.getMonth(2026, 6) // failure → cached copy
    expect(stale._stale).toBe(true)
    expect(stale.period).toEqual(MINI_DASH.period)
  })

  it('getBudget / putBudget hit /budget', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonRes({ monthly: 5000000, shop_weekly: 600000, weekend_budget: 200000 }))
    vi.stubGlobal('fetch', fetchMock)
    const api = await import('./api.js')

    await api.getBudget(2026, 6)
    expect(fetchMock).toHaveBeenCalledWith('http://test.local/budget?year=2026&month=6', expect.any(Object))

    await api.putBudget({ monthly: 5500000, shop_weekly: 650000, weekend_budget: 200000 })
    const [url, opts] = fetchMock.mock.calls[1]
    expect(url).toBe('http://test.local/budget')
    expect(opts.method).toBe('PUT')
    expect(JSON.parse(opts.body)).toMatchObject({ monthly: 5500000 })
  })

  it('subscription CRUD hits /subscriptions', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonRes({ id: 's1' }))
    vi.stubGlobal('fetch', fetchMock)
    const api = await import('./api.js')

    await api.getSubscriptions(2026, 6)
    expect(fetchMock.mock.calls[0][0]).toBe('http://test.local/subscriptions?year=2026&month=6')

    await api.createSubscription({ name: 'Netflix', color: '#c8403c', alloc: 187000, due_day: 5 })
    expect(fetchMock.mock.calls[1][0]).toBe('http://test.local/subscriptions')
    expect(fetchMock.mock.calls[1][1].method).toBe('POST')

    await api.updateSubscription('s1', { alloc: 200000 })
    expect(fetchMock.mock.calls[2][0]).toBe('http://test.local/subscriptions/s1')
    expect(fetchMock.mock.calls[2][1].method).toBe('PUT')

    await api.deleteSubscription('s1')
    expect(fetchMock.mock.calls[3][0]).toBe('http://test.local/subscriptions/s1')
    expect(fetchMock.mock.calls[3][1].method).toBe('DELETE')
  })
})
