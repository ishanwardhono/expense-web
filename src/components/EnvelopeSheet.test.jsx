// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { EnvelopeSheet } from './EnvelopeSheet.jsx'

// NOTE: amount strings below use U+2212 '−' (fmtK's minus), not ASCII '-'.
function makeDash(flex) {
  return {
    stats: { spent: 880000, budget: 5000000, remaining: 4120000 },
    envelopes: [
      { id: 'belanja', label: 'Belanja Mingguan', budget: 2400000, spent: 432000, left: 1968000, over: false },
      { id: 'weekend', label: 'Akhir Pekan', budget: 800000, spent: 254000, left: 546000, over: false },
      { id: 'langganan', label: 'Langganan', budget: 187000, spent: 186000, left: 1000, over: false },
      { id: 'fleksibel', label: 'Fleksibel', budget: 1613000, spent: 8000, left: flex.left, over: flex.left < 0 },
    ],
    belanja_weeks: [],
    weekends: [],
    subscriptions: [],
    flex,
  }
}

afterEach(cleanup)

describe('EnvelopeSheet — fleksibel rollover', () => {
  it('shows the rollover total and one summed row per type group', () => {
    render(<EnvelopeSheet which="fleksibel" onClose={() => {}} dash={makeDash({
      budget: 1613000, rollover: 115000, spent: 8000, left: 1720000,
      rollover_items: [
        { type: 'week', amount: 168000 },
        { type: 'weekend', amount: -54000 },
        { type: 'subscription', amount: 1000 },
      ],
    })} />)
    expect(screen.getByText('Rollover')).toBeTruthy()
    expect(screen.getByText('+115K')).toBeTruthy()
    expect(screen.getByText('Mingguan')).toBeTruthy()
    expect(screen.getByText('+168K')).toBeTruthy()
    expect(screen.getByText('Akhir pekan')).toBeTruthy()
    expect(screen.getByText('−54K')).toBeTruthy()
    expect(screen.getByText('Langganan')).toBeTruthy()
    expect(screen.getByText('+1K')).toBeTruthy()
  })

  it('renders "pas" for a zero-sum type group and an unsigned zero total', () => {
    render(<EnvelopeSheet which="fleksibel" onClose={() => {}} dash={makeDash({
      budget: 1613000, rollover: 0, spent: 8000, left: 1605000,
      rollover_items: [{ type: 'week', amount: 0 }],
    })} />)
    expect(screen.getByText('Rollover')).toBeTruthy()
    expect(screen.getByText('pas')).toBeTruthy()
  })

  it('hides the rollover section on a legacy payload without rollover fields', () => {
    render(<EnvelopeSheet which="fleksibel" onClose={() => {}} dash={makeDash({
      budget: 1613000, spent: 8000, left: 1605000,
    })} />)
    expect(screen.queryByText('Rollover')).toBeNull()
    expect(screen.getByText('Sisa')).toBeTruthy() // ledger still renders
  })
})
