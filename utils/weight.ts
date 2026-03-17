// Habit weight update utility
// On completion: current = min(max, current + growth_rate * (max - current))
// On miss:       current = max(min, current - decay_rate * (current - min))
// See /docs/02-schema.md (habit_stat_weights)

export function updateWeightOnCompletion(params: {
  current: number
  min: number
  max: number
  growthRate: number
}): number {
  const { current, min, max, growthRate } = params
  return Math.min(max, current + growthRate * (max - current))
}

export function updateWeightOnMiss(params: {
  current: number
  min: number
  max: number
  decayRate: number
}): number {
  const { current, min, max, decayRate } = params
  void max
  return Math.max(min, current - decayRate * (current - min))
}
