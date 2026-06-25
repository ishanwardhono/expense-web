// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { App } from './app.jsx'
import { setNow } from './lib/today.js'

// Pin the clock to the seed month so the shell opens on data, deterministically.
beforeEach(() => {
  setNow(() => new Date(2026, 5, 25, 12, 0, 0))
  if (typeof localStorage !== 'undefined') localStorage.clear()
})
afterEach(() => { setNow(null); cleanup() })

describe('App — v2 shell mounts and renders', () => {
  it('renders the current month title and envelope summary', () => {
    render(<App />)
    expect(screen.getByText('Juni 2026')).toBeTruthy()
    expect(screen.getByText('Terpakai')).toBeTruthy()
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

  it('navigates months and shows the "back to today" pill', () => {
    render(<App />)
    fireEvent.click(screen.getByLabelText('Bulan sebelumnya'))
    expect(screen.getByText('Mei 2026')).toBeTruthy()
    expect(screen.getByText('Kembali ke hari ini')).toBeTruthy()
  })
})
