import { describe, it, expect } from 'vitest'
import { amplopOf, computeAmplop, addDaysK, dowsInMonth } from './amplop-engine.js'
import { budgetConfig } from './config.js'
import { SEED_EXPENSES, SEED_SUBS } from '../data/seed.js'

// Reference weekdays in 2026 (verified): 2026-06-01 is a Monday,
// 2026-06-06 a Saturday, 2026-06-07 a Sunday.
const WEEKDAY = '2026-06-01'
const SAT = '2026-06-06'
const SUN = '2026-06-07'

describe('amplopOf — category attribution', () => {
  it('Belanja and Cash go to Belanja Mingguan on any day', () => {
    expect(amplopOf({ cat: 'Belanja', date: SAT })).toBe('belanja')
    expect(amplopOf({ cat: 'Cash', date: SUN })).toBe('belanja')
    expect(amplopOf({ cat: 'Belanja', date: WEEKDAY })).toBe('belanja')
  })

  it('Makan and Jajan on a weekday go to Belanja Mingguan', () => {
    expect(amplopOf({ cat: 'Makan', date: WEEKDAY })).toBe('belanja')
    expect(amplopOf({ cat: 'Jajan', date: WEEKDAY })).toBe('belanja')
  })

  it('Makan and Jajan on a weekend go to Akhir Pekan', () => {
    expect(amplopOf({ cat: 'Makan', date: SAT })).toBe('weekend')
    expect(amplopOf({ cat: 'Jajan', date: SUN })).toBe('weekend')
  })

  it('Lainnya goes to Akhir Pekan on a weekend, Fleksibel on a weekday', () => {
    expect(amplopOf({ cat: 'Lainnya', date: SAT })).toBe('weekend')
    expect(amplopOf({ cat: 'Lainnya', date: WEEKDAY })).toBe('fleksibel')
  })
})

describe('date helpers', () => {
  it('addDaysK crosses month boundaries', () => {
    expect(addDaysK('2026-06-29', 6)).toBe('2026-07-05')
    expect(addDaysK('2026-02-01', -1)).toBe('2026-01-31')
  })

  it('dowsInMonth lists the Fridays (dow 5) of June 2026', () => {
    expect(dowsInMonth(2026, 5, 5)).toEqual(['2026-06-05', '2026-06-12', '2026-06-19', '2026-06-26'])
  })
})

describe('computeAmplop — month-boundary rules', () => {
  const cfg = budgetConfig()

  // A shopping week belongs to the month of its FRIDAY. The week of Friday
  // 2026-07-03 runs Mon 2026-06-29 .. Sun 2026-07-05, so a Belanja expense on
  // 2026-06-29 counts toward JULY, not June.
  it('shopping spend on Mon 2026-06-29 lands in July (its Friday is in July)', () => {
    const exp = [{ id: 'x', date: '2026-06-29', time: '10:00', amount: 100000, cat: 'Belanja', note: '' }]
    const june = computeAmplop(exp, [], 2026, 5, cfg)
    const july = computeAmplop(exp, [], 2026, 6, cfg)
    expect(june.shopSpent).toBe(0)
    expect(july.shopSpent).toBe(100000)
  })

  // A weekend belongs to the month of its SATURDAY. 2026-01-31 is a Saturday
  // and 2026-02-01 the Sunday, so a weekend expense on Sun 2026-02-01 counts
  // toward JANUARY, not February.
  it('weekend spend on Sun 2026-02-01 lands in January (its Saturday is in January)', () => {
    const exp = [{ id: 'x', date: '2026-02-01', time: '13:00', amount: 70000, cat: 'Makan', note: '' }]
    const jan = computeAmplop(exp, [], 2026, 0, cfg)
    const feb = computeAmplop(exp, [], 2026, 1, cfg)
    expect(jan.wkndSpent).toBe(70000)
    expect(feb.wkndSpent).toBe(0)
  })
})

describe('computeAmplop — budgets and subscriptions (June 2026 seed)', () => {
  const A = computeAmplop(SEED_EXPENSES, SEED_SUBS, 2026, 5, budgetConfig())

  it('derives the four envelope rows', () => {
    expect(A.rows.map((r) => r.id)).toEqual(['belanja', 'weekend', 'langganan', 'fleksibel'])
  })

  it('sizes budgets from the number of Fridays/Saturdays in the month', () => {
    expect(A.shopBudget).toBe(600000 * 4) // 4 Fridays in June 2026
    expect(A.wkndBudget).toBe(200000 * 4) // 4 Saturdays in June 2026
  })

  it('allocates and derives paid subscriptions for the month', () => {
    expect(A.subsAlloc).toBe(187000 + 55000 + 59000 + 29000)
    expect(A.subsPaid).toBe(186000 + 65000) // Netflix + Spotify paid in June
  })

  it('computes the flexible budget as the remainder', () => {
    expect(A.flexBudget).toBe(5000000 - A.shopBudget - A.wkndBudget - A.subsAlloc)
    expect(A.sisa).toBe(5000000 - A.totalSpent)
  })
})
