// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'

vi.mock('../data/api.js', () => ({
  getBudget: vi.fn(),
  putBudget: vi.fn(),
  getSubscriptions: vi.fn(),
  createSubscription: vi.fn(),
  updateSubscription: vi.fn(),
  deleteSubscription: vi.fn(),
}))

import { Settings } from './Settings.jsx'
import { setNow } from '../lib/today.js'
import * as api from '../data/api.js'

beforeEach(() => {
  setNow(() => new Date(2026, 5, 25, 12, 0, 0))
  api.getBudget.mockResolvedValue({ effective_year: 2025, effective_month: 1, monthly: 5000000, shop_weekly: 600000, weekend_budget: 200000 })
  api.getSubscriptions.mockResolvedValue([{ id: 's1', name: 'Netflix', color: '#c8403c', alloc: 187000, due_day: 5 }])
  api.putBudget.mockResolvedValue({})
  api.createSubscription.mockResolvedValue({ id: 's2' })
  api.deleteSubscription.mockResolvedValue(null)
})
afterEach(() => { setNow(null); vi.clearAllMocks(); cleanup() })

describe('Settings page', () => {
  it('loads budget + subscriptions for the current month (1-based)', async () => {
    render(<Settings />)
    expect(await screen.findByText('Budget')).toBeTruthy()
    expect(api.getBudget).toHaveBeenCalledWith(2026, 6)
    expect(api.getSubscriptions).toHaveBeenCalledWith(2026, 6)
    expect(screen.getByLabelText('Budget bulanan').value).toBe('5000000')
    expect(screen.getByText('Netflix')).toBeTruthy()
  })

  it('saves edited budget via putBudget', async () => {
    render(<Settings />)
    await screen.findByText('Budget')
    fireEvent.change(screen.getByLabelText('Budget bulanan'), { target: { value: '5500000' } })
    fireEvent.click(screen.getByText('Simpan budget'))
    await waitFor(() => expect(api.putBudget).toHaveBeenCalled())
    expect(api.putBudget.mock.calls[0][0]).toMatchObject({ monthly: 5500000, shop_weekly: 600000, weekend_budget: 200000 })
  })

  it('rejects an invalid budget (negative) and does not call putBudget', async () => {
    render(<Settings />)
    await screen.findByText('Budget')
    fireEvent.change(screen.getByLabelText('Budget bulanan'), { target: { value: '-5' } })
    fireEvent.click(screen.getByText('Simpan budget'))
    expect(screen.getByText(/Nilai harus angka/)).toBeTruthy()
    expect(api.putBudget).not.toHaveBeenCalled()
  })

  it('creates a subscription', async () => {
    render(<Settings />)
    await screen.findByText('Langganan')
    fireEvent.click(screen.getByText('+ Tambah langganan'))
    fireEvent.change(screen.getByLabelText('Nama'), { target: { value: 'Spotify' } })
    fireEvent.change(screen.getByLabelText('Alokasi'), { target: { value: '55000' } })
    fireEvent.change(screen.getByLabelText('Jatuh tempo'), { target: { value: '10' } })
    fireEvent.click(screen.getByText('Simpan'))
    await waitFor(() => expect(api.createSubscription).toHaveBeenCalled())
    expect(api.createSubscription.mock.calls[0][0]).toMatchObject({ name: 'Spotify', alloc: 55000, due_day: 10 })
  })

  it('rejects an invalid subscription (no name)', async () => {
    render(<Settings />)
    await screen.findByText('Langganan')
    fireEvent.click(screen.getByText('+ Tambah langganan'))
    fireEvent.change(screen.getByLabelText('Alokasi'), { target: { value: '55000' } })
    fireEvent.change(screen.getByLabelText('Jatuh tempo'), { target: { value: '10' } })
    fireEvent.click(screen.getByText('Simpan'))
    expect(screen.getByText(/Nama wajib diisi/)).toBeTruthy()
    expect(api.createSubscription).not.toHaveBeenCalled()
  })

  it('deletes a subscription', async () => {
    render(<Settings />)
    await screen.findByText('Netflix')
    fireEvent.click(screen.getByText('Hapus'))
    await waitFor(() => expect(api.deleteSubscription).toHaveBeenCalledWith('s1'))
  })
})
