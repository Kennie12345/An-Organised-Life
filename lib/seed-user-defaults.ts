// Seeds default stats, habits, habit_stat_weights, habit_streaks, and habit_maturity
// for a given user into IndexedDB. Used for dev/testing before onboarding (Phase 8) exists.
// Also queues all writes for sync.

import { db } from "@/db";
import { DEFAULT_STATS, DEFAULT_HABITS } from "@/config/defaults";
import type { Json } from "@/lib/supabase/database.types";
import { uuid } from "@/utils/uuid";

export async function seedUserDefaults(userId: string) {
  // Check if already seeded
  const existingStats = await db.stats.where("user_id").equals(userId).count();
  if (existingStats > 0) return;

  const now = new Date().toISOString();

  // ── Stats ──
  const statIdMap = new Map<string, string>();
  for (const s of DEFAULT_STATS) {
    const id = uuid();
    statIdMap.set(s.name, id);
    await db.stats.put({
      id,
      user_id: userId,
      name: s.name,
      color: s.color,
      icon: s.icon,
      description: null,
      current_value: 50,
      decay_grace_days: s.decay_grace_days,
      decay_rate: s.decay_rate,
      sequence_order: s.sequence_order,
      is_active: true,
      created_at: now,
      updated_at: now,
    });
    await db.sync_queue.add({
      table_name: "stats",
      record_id: id,
      operation: "upsert",
      payload: JSON.stringify({ id, user_id: userId, name: s.name, color: s.color, icon: s.icon, description: null, current_value: 50, decay_grace_days: s.decay_grace_days, decay_rate: s.decay_rate, sequence_order: s.sequence_order, is_active: true, created_at: now, updated_at: now }),
      queued_at: now,
    });
  }

  // ── Habits + weights + streaks + maturity ──
  for (const h of DEFAULT_HABITS) {
    const habitId = uuid();
    await db.habits.put({
      id: habitId,
      user_id: userId,
      name: h.name,
      description: null,
      frequency: h.frequency,
      time_block: h.time_block,
      sequence_order: h.sequence_order,
      completion_type: h.completion_type,
      completion_config: h.completion_config as { [key: string]: Json | undefined } | null,
      xp_min: h.xp_min,
      xp_max: h.xp_max,
      loot_drop_eligible: true,
      is_active: true,
      created_at: now,
      updated_at: now,
    });
    await db.sync_queue.add({
      table_name: "habits",
      record_id: habitId,
      operation: "upsert",
      payload: JSON.stringify({ id: habitId, user_id: userId, name: h.name, frequency: h.frequency, time_block: h.time_block, sequence_order: h.sequence_order, completion_type: h.completion_type, completion_config: h.completion_config, xp_min: h.xp_min, xp_max: h.xp_max, loot_drop_eligible: true, is_active: true, created_at: now, updated_at: now }),
      queued_at: now,
    });

    // Habit stat weights
    for (const sw of h.stat_weights) {
      const statId = statIdMap.get(sw.stat);
      if (!statId) continue;
      const weightId = uuid();
      await db.habit_stat_weights.put({
        id: weightId,
        habit_id: habitId,
        stat_id: statId,
        base_weight: sw.base_weight,
        min_weight: sw.min_weight,
        max_weight: sw.max_weight,
        current_weight: sw.base_weight,
        growth_rate: 0.12,
        decay_rate: 0.06,
        updated_at: now,
      });
      await db.sync_queue.add({
        table_name: "habit_stat_weights",
        record_id: weightId,
        operation: "upsert",
        payload: JSON.stringify({ id: weightId, habit_id: habitId, stat_id: statId, base_weight: sw.base_weight, min_weight: sw.min_weight, max_weight: sw.max_weight, current_weight: sw.base_weight, growth_rate: 0.12, decay_rate: 0.06, updated_at: now }),
        queued_at: now,
      });
    }

    // Habit streak
    const streakId = uuid();
    await db.habit_streaks.put({
      id: streakId,
      habit_id: habitId,
      user_id: userId,
      current_streak: 0,
      best_streak: 0,
      last_completed_date: null,
      updated_at: now,
    });
    await db.sync_queue.add({
      table_name: "habit_streaks",
      record_id: streakId,
      operation: "upsert",
      payload: JSON.stringify({ id: streakId, habit_id: habitId, user_id: userId, current_streak: 0, best_streak: 0, last_completed_date: null, updated_at: now }),
      queued_at: now,
    });

    // Habit maturity
    const maturityId = uuid();
    await db.habit_maturity.put({
      id: maturityId,
      habit_id: habitId,
      user_id: userId,
      stage: "fragile",
      consistent_days: 0,
      last_stage_changed_at: now,
      updated_at: now,
    });
    await db.sync_queue.add({
      table_name: "habit_maturity",
      record_id: maturityId,
      operation: "upsert",
      payload: JSON.stringify({ id: maturityId, habit_id: habitId, user_id: userId, stage: "fragile", consistent_days: 0, last_stage_changed_at: now, updated_at: now }),
      queued_at: now,
    });
  }

  // ── User record (ensure exists) ──
  const existingUser = await db.users.get(userId);
  if (!existingUser) {
    await db.users.put({
      id: userId,
      email: "",
      name: "",
      pet_name: "Your Pet",
      level: 1,
      current_xp: 0,
      lifetime_xp: 0,
      peak_level: 1,
      created_at: now,
      updated_at: now,
    });
  }
}
