// XP engine
// Formula: xp_base * current_weight * sequence_multiplier * maturity_multiplier
// See /docs/02-schema.md (habit_logs XP formula)

export type MaturityStage = 'fragile' | 'building' | 'established' | 'mastered'

const MATURITY_XP_MULTIPLIER: Record<MaturityStage, number> = {
  fragile: 1.0,
  building: 1.3,
  established: 1.6,
  mastered: 2.0,
}

export function calculateXp(params: {
  xpMin: number
  xpMax: number
  currentWeight: number
  sequenceMultiplier: 1.0 | 0.5
  maturityStage: MaturityStage
}): { xpBase: number; xpFinal: number } {
  const { xpMin, xpMax, currentWeight, sequenceMultiplier, maturityStage } = params

  const xpBase = Math.floor(Math.random() * (xpMax - xpMin + 1)) + xpMin
  const maturityMultiplier = MATURITY_XP_MULTIPLIER[maturityStage]

  const xpFinal = Math.round(xpBase * currentWeight * sequenceMultiplier * maturityMultiplier)

  return { xpBase, xpFinal }
}
