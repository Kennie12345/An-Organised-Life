import { describe, it, expect } from 'vitest'
import { calculateXp } from './xp'

describe('calculateXp', () => {
  it('returns xpFinal within expected range for in-sequence fragile habit', () => {
    // weight=1.0, sequenceMultiplier=1.0, maturity=fragile (1.0x)
    // xpBase is in [10,20], xpFinal = xpBase * 1.0 * 1.0 * 1.0
    for (let i = 0; i < 20; i++) {
      const { xpBase, xpFinal } = calculateXp({
        xpMin: 10,
        xpMax: 20,
        currentWeight: 1.0,
        sequenceMultiplier: 1.0,
        maturityStage: 'fragile',
      })
      expect(xpBase).toBeGreaterThanOrEqual(10)
      expect(xpBase).toBeLessThanOrEqual(20)
      expect(xpFinal).toBe(xpBase) // 1.0 * 1.0 * 1.0 = 1.0
    }
  })

  it('applies out-of-sequence 0.5x penalty', () => {
    const { xpBase, xpFinal } = calculateXp({
      xpMin: 100,
      xpMax: 100,
      currentWeight: 1.0,
      sequenceMultiplier: 0.5,
      maturityStage: 'fragile',
    })
    expect(xpBase).toBe(100)
    expect(xpFinal).toBe(50)
  })

  it('applies mastered 2.0x maturity multiplier', () => {
    const { xpBase, xpFinal } = calculateXp({
      xpMin: 50,
      xpMax: 50,
      currentWeight: 1.0,
      sequenceMultiplier: 1.0,
      maturityStage: 'mastered',
    })
    expect(xpBase).toBe(50)
    expect(xpFinal).toBe(100)
  })

  it('applies weight scaling', () => {
    const { xpFinal } = calculateXp({
      xpMin: 100,
      xpMax: 100,
      currentWeight: 0.5,
      sequenceMultiplier: 1.0,
      maturityStage: 'fragile',
    })
    expect(xpFinal).toBe(50)
  })

  it('combines all multipliers correctly', () => {
    // xpBase=100, weight=0.8, sequence=0.5, maturity=building(1.3)
    // xpFinal = round(100 * 0.8 * 0.5 * 1.3) = round(52) = 52
    const { xpFinal } = calculateXp({
      xpMin: 100,
      xpMax: 100,
      currentWeight: 0.8,
      sequenceMultiplier: 0.5,
      maturityStage: 'building',
    })
    expect(xpFinal).toBe(52)
  })
})
