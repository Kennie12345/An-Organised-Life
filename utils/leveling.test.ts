import { describe, it, expect } from 'vitest'
import {
  xpRequiredForLevel,
  dailyUpkeepCost,
  lootDropBaseRate,
  applyUpkeepDrain,
  applyXpGain,
} from './leveling'

describe('xpRequiredForLevel', () => {
  it('returns 150 for levels 1–5', () => {
    expect(xpRequiredForLevel(1)).toBe(150)
    expect(xpRequiredForLevel(5)).toBe(150)
  })

  it('returns 400 for levels 6–10', () => {
    expect(xpRequiredForLevel(6)).toBe(400)
    expect(xpRequiredForLevel(10)).toBe(400)
  })

  it('returns 1200 for levels 11–15', () => {
    expect(xpRequiredForLevel(11)).toBe(1200)
  })

  it('returns 4000 for levels 16–20', () => {
    expect(xpRequiredForLevel(16)).toBe(4000)
  })

  it('returns 12000 for levels 21+', () => {
    expect(xpRequiredForLevel(21)).toBe(12000)
    expect(xpRequiredForLevel(100)).toBe(12000)
  })
})

describe('dailyUpkeepCost', () => {
  it('returns correct cost per tier', () => {
    expect(dailyUpkeepCost(1)).toBe(30)
    expect(dailyUpkeepCost(6)).toBe(80)
    expect(dailyUpkeepCost(11)).toBe(180)
    expect(dailyUpkeepCost(16)).toBe(400)
    expect(dailyUpkeepCost(21)).toBe(800)
  })
})

describe('lootDropBaseRate', () => {
  it('returns correct rates per tier', () => {
    expect(lootDropBaseRate(1)).toBe(0.30)
    expect(lootDropBaseRate(6)).toBe(0.20)
    expect(lootDropBaseRate(11)).toBe(0.12)
    expect(lootDropBaseRate(16)).toBe(0.08)
    expect(lootDropBaseRate(21)).toBe(0.05)
  })
})

describe('applyUpkeepDrain', () => {
  it('drains XP without level drop when XP is sufficient', () => {
    const result = applyUpkeepDrain(1, 100, 1)
    expect(result.level).toBe(1)
    expect(result.currentXp).toBe(70) // 100 - 30
  })

  it('floors at 0 XP at level 1 when drain exceeds XP', () => {
    const result = applyUpkeepDrain(1, 10, 1)
    expect(result.level).toBe(1)
    expect(result.currentXp).toBe(0)
  })

  it('drops level when XP reaches 0 above level 1', () => {
    // level 6, xp=50, upkeep=80 → xp goes negative → drop to level 5
    const result = applyUpkeepDrain(6, 50, 1)
    expect(result.level).toBe(5)
    expect(result.currentXp).toBe(150) // level 5 xpRequired
  })

  it('applies multiple missed days', () => {
    const result = applyUpkeepDrain(1, 150, 3)
    // day1: 150-30=120, day2: 120-30=90, day3: 90-30=60
    expect(result.level).toBe(1)
    expect(result.currentXp).toBe(60)
  })
})

describe('applyXpGain', () => {
  it('adds XP without leveling up', () => {
    const result = applyXpGain(1, 50, 50)
    expect(result.level).toBe(1)
    expect(result.currentXp).toBe(100)
    expect(result.leveledUp).toBe(false)
  })

  it('levels up when XP threshold is reached', () => {
    const result = applyXpGain(1, 100, 50)
    // 100+50=150 >= 150 → level up, xp=0
    expect(result.level).toBe(2)
    expect(result.currentXp).toBe(0)
    expect(result.leveledUp).toBe(true)
  })

  it('handles multi-level-up in one gain', () => {
    // Start level 1, xp=0. Gain 450 → level up at 150 (xp=300 remaining),
    // still level 1→2 tier (xp needed 150), 300-150=150 → level up again (level 3), 150-150=0
    const result = applyXpGain(1, 0, 450)
    expect(result.level).toBe(4)
    expect(result.currentXp).toBe(0)
    expect(result.leveledUp).toBe(true)
  })

  it('carries over excess XP after level up', () => {
    // level 1, xp=0, gain=200 → 200-150=50 carry, now level 2
    const result = applyXpGain(1, 0, 200)
    expect(result.level).toBe(2)
    expect(result.currentXp).toBe(50)
  })
})
