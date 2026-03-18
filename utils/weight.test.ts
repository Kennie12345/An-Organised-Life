import { describe, it, expect } from 'vitest'
import { updateWeightOnCompletion, updateWeightOnMiss } from './weight'

describe('updateWeightOnCompletion', () => {
  it('increases weight toward max', () => {
    // current=0.5, min=0.1, max=2.0, growthRate=0.1
    // new = min(2.0, 0.5 + 0.1 * (2.0 - 0.5)) = min(2.0, 0.5 + 0.15) = 0.65
    const result = updateWeightOnCompletion({ current: 0.5, min: 0.1, max: 2.0, growthRate: 0.1 })
    expect(result).toBeCloseTo(0.65)
  })

  it('does not exceed max', () => {
    const result = updateWeightOnCompletion({ current: 1.99, min: 0.1, max: 2.0, growthRate: 1.0 })
    expect(result).toBe(2.0)
  })

  it('stays at max when already at max', () => {
    const result = updateWeightOnCompletion({ current: 2.0, min: 0.1, max: 2.0, growthRate: 0.1 })
    expect(result).toBe(2.0)
  })
})

describe('updateWeightOnMiss', () => {
  it('decreases weight toward min', () => {
    // current=1.0, min=0.1, max=2.0, decayRate=0.1
    // new = max(0.1, 1.0 - 0.1 * (1.0 - 0.1)) = max(0.1, 1.0 - 0.09) = 0.91
    const result = updateWeightOnMiss({ current: 1.0, min: 0.1, max: 2.0, decayRate: 0.1 })
    expect(result).toBeCloseTo(0.91)
  })

  it('does not go below min', () => {
    const result = updateWeightOnMiss({ current: 0.11, min: 0.1, max: 2.0, decayRate: 1.0 })
    expect(result).toBe(0.1)
  })

  it('stays at min when already at min', () => {
    const result = updateWeightOnMiss({ current: 0.1, min: 0.1, max: 2.0, decayRate: 0.5 })
    expect(result).toBe(0.1)
  })
})
