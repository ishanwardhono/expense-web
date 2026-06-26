// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'

// The app renders the server dashboard, so we mock the API client.
vi.mock('./data/api.js', () => ({
  getMonth: vi.fn(),
  addExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
}))

import { App } from './app.jsx'
import { setNow } from './lib/today.js'
import * as api from './data/api.js'

function makeDash(dayRows, subscriptions = []) {
  const days = {}
  dayRows.forEach((r) => { (days[r.date] = days[r.date] || []).push(r) })
  return {
    period: { year: 2026, month: 6, label: 'Juni 2026', is_current: true },
    stats: { spent: 18000, budget: 5000000, remaining: 4982000 },
    envelopes: [
      { id: 'belanja', label: 'Belanja Mingguan', budget: 2400000, spent: 18000, left: 2382000, over: false },
      { id: 'weekend', label: 'Akhir Pekan', budget: 800000, spent: 0, left: 800000, over: false },
      { id: 'langganan', label: 'Langganan', budget: 0, spent: 0, left: 0, over: false },
      { id: 'fleksibel', label: 'Fleksibel', budget: 1800000, spent: 0, left: 1800000, over: false },
    ],
    belanja_weeks: [{ range: '22–28 Jun', monday: '2026-06-22', friday: '2026-06-26', sunday: '2026-06-28', budget: 600000, spent: 18000, left: 582000, state: 'current' }],
    weekends: [{ range: '27–28 Jun', saturday: '2026-06-27', sunday: '2026-06-28', budget: 200000, spent: 0, left: 200000, state: 'future' }],
    flex: { budget: 1800000, spent: 0, left: 1800000 },
    calendar: [{ date: '2026-06-23', dow: 2, is_weekend: false, is_today: false, spent: 18000 }],
    days,
    subscriptions,
  }
}

const ROW = {
  id: 'x1', date: '2026-06-23', occurred_at: '2026-06-23T12:10:00+07:00', amount: 18000,
  category: 'Makan', subscription_id: null, note: 'Nasi padang', envelope: { id: 'belanja', label: 'BLNJ' },
}

beforeEach(() => {
  setNow(() => new Date(2026, 5, 25, 12, 0, 0))
  api.getMonth.mockResolvedValue(makeDash([ROW]))
  api.addExpense.mockResolvedValue({ id: 'x2' })
})
afterEach(() => { setNow(null); vi.clearAllMocks(); cleanup() })

describe('App — renders the server dashboard', () => {
  it('shows the month title and (after load) the envelope summary', async () => {
    render(<App />)
    expect(screen.getByText('Juni 2026')).toBeTruthy()
    expect(await screen.findByText('Terpakai')).toBeTruthy()
    expect(screen.getByText('Budget')).toBeTruthy()
    expect(screen.getByText('Sisa')).toBeTruthy()
  })

  it('requests the month as 1-based from the API', async () => {
    render(<App />)
    await screen.findByText('Terpakai')
    expect(api.getMonth).toHaveBeenCalledWith(2026, 6)
  })

  it('opens the FAB entry menu with a manual option', async () => {
    render(<App />)
    await screen.findByText('Terpakai')
    fireEvent.click(screen.getByLabelText('Tambah pengeluaran hari ini'))
    expect(screen.getByText('Input manual')).toBeTruthy()
    expect(screen.getByText('Impor dari images')).toBeTruthy()
  })

  it('navigates months and shows the "back to today" pill', async () => {
    render(<App />)
    await screen.findByText('Terpakai')
    fireEvent.click(screen.getByLabelText('Bulan sebelumnya'))
    expect(screen.getByText('Mei 2026')).toBeTruthy()
  })

  it('adds an expense through the form and reloads the month', async () => {
    api.getMonth
      .mockResolvedValueOnce(makeDash([ROW]))                              // initial: 1 transaksi
      .mockResolvedValue(makeDash([ROW, { ...ROW, id: 'x2', note: 'b' }])) // after write: 2 transaksi

    render(<App />)
    expect(await screen.findByText(/1 transaksi/)).toBeTruthy()

    fireEvent.click(screen.getByLabelText('Tambah pengeluaran hari ini'))
    fireEvent.click(screen.getByText('Input manual'))
    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '50000' } })
    fireEvent.click(screen.getByText('Simpan'))

    expect(await screen.findByText(/2 transaksi/)).toBeTruthy()
    const body = api.addExpense.mock.calls[0][0]
    expect(body).toMatchObject({ amount: 50000, category: 'Makan', subscription_id: null })
  })

  it('pays a subscription via the Langganan category + picker', async () => {
    api.getMonth.mockResolvedValue(makeDash([], [
      { id: 's1', name: 'Netflix', color: '#c8403c', alloc: 187000, due_day: 5, paid: null, status: 'unpaid' },
    ]))

    render(<App />)
    await screen.findByText('Terpakai')
    fireEvent.click(screen.getByLabelText('Tambah pengeluaran hari ini'))
    fireEvent.click(screen.getByText('Input manual'))
    fireEvent.click(screen.getByText('Langganan'))
    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '186000' } })
    fireEvent.change(screen.getByLabelText('Langganan'), { target: { value: 's1' } })
    fireEvent.click(screen.getByText('Simpan'))

    await waitFor(() => expect(api.addExpense).toHaveBeenCalled())
    expect(api.addExpense.mock.calls[0][0]).toMatchObject({ amount: 186000, category: 'Langganan', subscription_id: 's1' })
  })

  it('blocks a Langganan payment when no subscription is chosen', async () => {
    api.getMonth.mockResolvedValue(makeDash([], [
      { id: 's1', name: 'Netflix', color: '#c8403c', alloc: 187000, due_day: 5, paid: null, status: 'unpaid' },
    ]))

    render(<App />)
    await screen.findByText('Terpakai')
    fireEvent.click(screen.getByLabelText('Tambah pengeluaran hari ini'))
    fireEvent.click(screen.getByText('Input manual'))
    fireEvent.click(screen.getByText('Langganan'))
    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '186000' } })
    // intentionally leave the subscription picker on "Pilih langganan…"
    fireEvent.click(screen.getByText('Simpan'))

    expect(screen.getByText(/Pilih langganan yang dibayar/)).toBeTruthy()
    expect(api.addExpense).not.toHaveBeenCalled()
  })
})
