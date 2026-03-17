// Stat decay utility
// Grace period + escalating rate: day 2 = base, day 3 = 1.2x, day 4+ = 1.5x
// Floor of 1 — stats never reach zero
// See /docs/02-schema.md (stats decay notes)

const STAT_FLOOR = 1

/**
 * Calculate stat decay given days since last habit completion for this stat.
 * daysSinceLast = 0 means completed today — no decay.
 * daysSinceLast = 1 means missed today — within grace period (no decay if grace >= 1).
 */
export function applyStatDecay(params: {
  currentValue: number
  decayGraceDays: number
  decayRate: number
  daysSinceLast: number
}): number {
  const { currentValue, decayGraceDays, decayRate, daysSinceLast } = params

  if (daysSinceLast <= decayGraceDays) {
    return currentValue
  }

  const daysDecaying = daysSinceLast - decayGraceDays

  let totalDecay = 0
  for (let day = 1; day <= daysDecaying; day++) {
    const multiplier = day === 1 ? 1.0 : day === 2 ? 1.2 : 1.5
    totalDecay += decayRate * multiplier
  }

  return Math.max(STAT_FLOOR, currentValue - totalDecay)
}
