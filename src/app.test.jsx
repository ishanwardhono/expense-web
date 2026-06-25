// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { App } from './app.jsx'
import { setNow } from './lib/today.js'
import { _resetLocal } from './data/api.js'

// Pin the clock to the seed month so the shell opens on data, deterministically.
beforeEach(() => {
  setNow(() => new Date(2026, 5, 25, 12, 0, 0))
  if (typeof localStorage !== 'undefined') localStorage.clear()
  _resetLocal()
})
afterEach(() => { setNow(null); cleanup() })

describe('App — v2 shell mounts and renders', () => {
  it('renders the current month title and (after async load) the envelope summary', async () => {
    render(<App />)
    expect(screen.getByText('Juni 2026')).toBeTruthy() // topbar renders immediately
    // Envelope card appears once the month data resolves from the API layer.
    expect(await screen.findByText('Terpakai')).toBeTruthy()
    expect(screen.getByText('Budget')).toBeTruthy()
    expect(screen.getByText('Sisa')).toBeTruthy()
  })

  it('opens the entry menu from the FAB with a manual option', () => {
    render(<App />)
    fireEvent.click(screen.getByLabelText('Tambah pengeluaran hari ini'))
    expect(screen.getByText('Input manual')).toBeTruthy()
    // Import is present but stubbed (scan flow deferred to Phase 5).
    expect(screen.getByText('Impor dari images')).toBeTruthy()
  })

  it('navigates months and shows the "back to today" pill', async () => {
    render(<App />)
    await screen.findByText('Terpakai')
    fireEvent.click(screen.getByLabelText('Bulan sebelumnya'))
    expect(screen.getByText('Mei 2026')).toBeTruthy()
    expect(screen.getByText('Kembali ke hari ini')).toBeTruthy()
  })

  it('adds an expense through the form and persists it (round-trip via the API)', async () => {
    render(<App />)
    // June seed = 26 expenses + 2 paid subs surfaced as rows = 28 transaksi.
    expect(await screen.findByText(/28 transaksi/)).toBeTruthy()

    fireEvent.click(screen.getByLabelText('Tambah pengeluaran hari ini'))
    fireEvent.click(screen.getByText('Input manual'))
    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '50000' } })
    fireEvent.click(screen.getByText('Simpan'))

    // After the write + reload, the history count reflects the new expense.
    expect(await screen.findByText(/29 transaksi/)).toBeTruthy()
  })
})
