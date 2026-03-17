// Habit weight update utility
// On completion: current = min(max, current + growth_rate * (max - current))
// On miss:       current = max(min, current - decay_rate * (current - min))
// See /docs/02-schema.md (habit_stat_weights)
