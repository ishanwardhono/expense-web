import { describe, it, expect } from 'vitest'
import { fmtRp, fmtK, fmtRange } from './format.js'

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

  // Matches the prototype: fmtRp shows the absolute value (callers never pass
  // negatives; negative figures use fmtK, which carries its own minus sign).
  it('formats the absolute value for negatives', () => {
    expect(fmtRp(-5000)).toBe('Rp5.000')
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

describe('fmtRange', () => {
  it('same month: "1–7 Jun"', () => {
    expect(fmtRange('2026-06-01', '2026-06-07')).toBe('1–7 Jun')
  })

  it('crossing months: "29 Jun–5 Jul"', () => {
    expect(fmtRange('2026-06-29', '2026-07-05')).toBe('29 Jun–5 Jul')
  })
})

describe('fmtK', () => {
  it('formats sub-thousands verbatim', () => {
    expect(fmtK(750)).toBe('750')
  })

  it('formats thousands with a K suffix', () => {
    expect(fmtK(50000)).toBe('50K')
  })

  it('formats millions with a Jt suffix and id-ID decimals', () => {
    expect(fmtK(1250000)).toBe('1,25Jt')
  })

  it('renders a U+2212 minus for negatives', () => {
    expect(fmtK(-5000)).toBe('−5K')
  })

  it('treats non-finite input as zero', () => {
    expect(fmtK(NaN)).toBe('0')
  })
})
