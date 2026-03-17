// Leveling curve utility
// XP required per level: 150 → 400 → 1200 → 4000 → 12000
// Daily upkeep cost per level
// See /docs/05-default-config.md (Leveling Curve)

interface LevelTier {
  minLevel: number
  maxLevel: number
  xpRequired: number
  upkeepCostPerDay: number
  lootDropBaseRate: number
}

const LEVEL_TIERS: LevelTier[] = [
  { minLevel: 1, maxLevel: 5, xpRequired: 150, upkeepCostPerDay: 30, lootDropBaseRate: 0.30 },
  { minLevel: 6, maxLevel: 10, xpRequired: 400, upkeepCostPerDay: 80, lootDropBaseRate: 0.20 },
  { minLevel: 11, maxLevel: 15, xpRequired: 1200, upkeepCostPerDay: 180, lootDropBaseRate: 0.12 },
  { minLevel: 16, maxLevel: 20, xpRequired: 4000, upkeepCostPerDay: 400, lootDropBaseRate: 0.08 },
  { minLevel: 21, maxLevel: Infinity, xpRequired: 12000, upkeepCostPerDay: 800, lootDropBaseRate: 0.05 },
]

function getTier(level: number): LevelTier {
  return LEVEL_TIERS.find((t) => level >= t.minLevel && level <= t.maxLevel) ?? LEVEL_TIERS[LEVEL_TIERS.length - 1]
}

export function xpRequiredForLevel(level: number): number {
  return getTier(level).xpRequired
}

export function dailyUpkeepCost(level: number): number {
  return getTier(level).upkeepCostPerDay
}

export function lootDropBaseRate(level: number): number {
  return getTier(level).lootDropBaseRate
}

/**
 * Apply daily upkeep drain. Returns new { currentXp, level } after drain.
 * If currentXp hits 0, drops to previous level at that level's max XP.
 */
export function applyUpkeepDrain(
  currentLevel: number,
  currentXp: number,
  missedDays: number = 1,
): { level: number; currentXp: number } {
  let level = currentLevel
  let xp = currentXp

  for (let i = 0; i < missedDays; i++) {
    const cost = dailyUpkeepCost(level)
    xp -= cost

    if (xp <= 0 && level > 1) {
      level -= 1
      xp = xpRequiredForLevel(level) // drop to previous level's max
    } else if (xp <= 0) {
      xp = 0 // level 1 floor
    }
  }

  return { level, currentXp: xp }
}

/**
 * Apply XP gain. Returns new { currentXp, level } after award, handling level-ups.
 */
export function applyXpGain(
  currentLevel: number,
  currentXp: number,
  xpGained: number,
): { level: number; currentXp: number; leveledUp: boolean } {
  let level = currentLevel
  let xp = currentXp + xpGained
  let leveledUp = false

  while (xp >= xpRequiredForLevel(level)) {
    xp -= xpRequiredForLevel(level)
    level += 1
    leveledUp = true
  }

  return { level, currentXp: xp, leveledUp }
}
