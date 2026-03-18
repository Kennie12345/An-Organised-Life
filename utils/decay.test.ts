import { describe, it, expect } from 'vitest'
import { applyStatDecay } from './decay'

describe('applyStatDecay', () => {
  it('returns current value when within grace period', () => {
    // grace=2, daysSinceLast=2 → no decay
    const result = applyStatDecay({ currentValue: 80, decayGraceDays: 2, decayRate: 5, daysSinceLast: 2 })
    expect(result).toBe(80)
  })

  it('returns current value when completed today', () => {
    const result = applyStatDecay({ currentValue: 80, decayGraceDays: 2, decayRate: 5, daysSinceLast: 0 })
    expect(result).toBe(80)
  })

  it('applies base decay on first day past grace period', () => {
    // grace=2, daysSinceLast=3 → 1 day decaying at 1.0x
    // decay = 5 * 1.0 = 5. result = 80 - 5 = 75
    const result = applyStatDecay({ currentValue: 80, decayGraceDays: 2, decayRate: 5, daysSinceLast: 3 })
    expect(result).toBe(75)
  })

  it('applies 1.2x multiplier on second day past grace', () => {
    // grace=2, daysSinceLast=4 → 2 days decaying: day1=5*1.0=5, day2=5*1.2=6
    // total = 11, result = 80 - 11 = 69
    const result = applyStatDecay({ currentValue: 80, decayGraceDays: 2, decayRate: 5, daysSinceLast: 4 })
    expect(result).toBe(69)
  })

  it('applies 1.5x multiplier on third+ day past grace', () => {
    // grace=2, daysSinceLast=5 → 3 days: day1=5, day2=6, day3=5*1.5=7.5
    // total = 18.5, result = 80 - 18.5 = 61.5
    const result = applyStatDecay({ currentValue: 80, decayGraceDays: 2, decayRate: 5, daysSinceLast: 5 })
    expect(result).toBe(61.5)
  })

  it('floors at 1, never reaches 0', () => {
    // Very high decay over many days
    const result = applyStatDecay({ currentValue: 10, decayGraceDays: 0, decayRate: 100, daysSinceLast: 5 })
    expect(result).toBe(1)
  })

  it('handles grace period of 0', () => {
    // grace=0, daysSinceLast=1 → 1 day decaying at 1.0x
    const result = applyStatDecay({ currentValue: 50, decayGraceDays: 0, decayRate: 10, daysSinceLast: 1 })
    expect(result).toBe(40)
  })
})
