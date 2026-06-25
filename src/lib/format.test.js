import { describe, it, expect } from 'vitest'
import { fmtRp } from './format.js'

describe('fmtRp', () => {
  it('formats millions with dot thousands separators (id-ID)', () => {
    expect(fmtRp(5000000)).toBe('Rp5.000.000')
  })

  it('formats a typical weekly budget', () => {
    expect(fmtRp(600000)).toBe('Rp600.000')
  })

  it('formats zero', () => {
    expect(fmtRp(0)).toBe('Rp0')
  })

  it('formats values below 1000 without separators', () => {
    expect(fmtRp(750)).toBe('Rp750')
  })

  it('renders the sign before the Rp prefix for negatives (Fleksibel can go negative)', () => {
    expect(fmtRp(-5000)).toBe('-Rp5.000')
  })

  it('truncates fractional input to an integer', () => {
    expect(fmtRp(1234.99)).toBe('Rp1.234')
  })

  // Failure path: a bad numeric value must never reach the UI as "RpNaN".
  it('treats non-finite input as zero', () => {
    expect(fmtRp(NaN)).toBe('Rp0')
    expect(fmtRp(Infinity)).toBe('Rp0')
    expect(fmtRp(undefined)).toBe('Rp0')
  })
})
