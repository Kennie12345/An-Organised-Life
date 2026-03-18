"use client";

// Daily jobs that run once per day on app open.
// Tasks 3.3–3.6: upkeep drain, stat decay, habit weight decay, maturity transitions.
// Pure utility functions are imported from /utils/ — this hook orchestrates them.

import { useEffect, useRef, useState } from "react";
import { db } from "@/db";
import type { DbHabitStatWeight, DbHabitStreak, DbHabitMaturity, DbStat } from "@/db";
import { applyUpkeepDrain } from "@/utils/leveling";
import { applyStatDecay } from "@/utils/decay";
import { updateWeightOnMiss } from "@/utils/weight";

const STORAGE_KEY = "daily_jobs_last_run";

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + "T00:00:00");
  const b = new Date(dateB + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/**
 * Maturity stage thresholds (from 02-schema.md):
 * Fragile: 0–21, Building: 22–65, Established: 66–89, Mastered: 90+
 */
function maturityStage(consistentDays: number): string {
  if (consistentDays >= 90) return "mastered";
  if (consistentDays >= 66) return "established";
  if (consistentDays >= 22) return "building";
  return "fragile";
}

export function useDailyJobs(userId: string | null): { levelDropTo: number | null; dismissLevelDrop: () => void } {
  const ran = useRef(false);
  const [levelDropTo, setLevelDropTo] = useState<number | null>(null);

  useEffect(() => {
    if (!userId || ran.current) return;

    const lastRun = localStorage.getItem(STORAGE_KEY);
    const todayStr = today();

    if (lastRun === todayStr) return; // already ran today

    ran.current = true;

    (async () => {
      const now = new Date().toISOString();
      const missedDays = lastRun ? daysBetween(lastRun, todayStr) : 1;

      if (missedDays <= 0) return;

      // ── 3.3  Upkeep drain ──
      const user = await db.users.get(userId);
      if (user) {
        const levelBefore = user.level;
        const { level, currentXp } = applyUpkeepDrain(
          user.level,
          user.current_xp,
          missedDays,
        );

        await db.users.update(userId, {
          level,
          current_xp: currentXp,
          updated_at: now,
        });

        // Log upkeep XP event
        if (user.current_xp !== currentXp || level !== levelBefore) {
          const drainAmount = user.current_xp - currentXp;
          await db.xp_events.add({
            id: crypto.randomUUID(),
            user_id: userId,
            amount: -drainAmount,
            source_type: "upkeep_drain",
            source_id: null,
            level_before: levelBefore,
            level_after: level,
            created_at: now,
          });
          await db.sync_queue.add({
            table_name: "users",
            record_id: userId,
            operation: "upsert",
            payload: JSON.stringify({ ...user, level, current_xp: currentXp, updated_at: now }),
            queued_at: now,
          });
        }

        // Show level-drop warning if level decreased
        if (level < levelBefore) {
          setLevelDropTo(level);
        }
      }

      // ── 3.4  Stat decay ──
      const stats = await db.stats
        .where("user_id")
        .equals(userId)
        .filter((s: DbStat) => s.is_active)
        .toArray();

      const weights = await db.habit_stat_weights.toArray();
      const allHabitIds = [...new Set(weights.map((w: DbHabitStatWeight) => w.habit_id))];

      // Find last completion date per habit
      const lastCompletionMap = new Map<string, string>();
      for (const habitId of allHabitIds) {
        const latest = await db.habit_logs
          .where("habit_id")
          .equals(habitId)
          .reverse()
          .sortBy("completed_at");
        if (latest.length > 0) {
          lastCompletionMap.set(habitId, latest[0].completed_at.split("T")[0]);
        }
      }

      for (const stat of stats) {
        // Find habits that feed this stat
        const statWeights = weights.filter((w: DbHabitStatWeight) => w.stat_id === stat.id);
        if (statWeights.length === 0) continue;

        // Days since most recent completion of ANY habit feeding this stat
        let minDaysSince = Infinity;
        for (const w of statWeights) {
          const lastDate = lastCompletionMap.get(w.habit_id);
          if (lastDate) {
            const days = daysBetween(lastDate, todayStr);
            if (days < minDaysSince) minDaysSince = days;
          }
        }

        if (minDaysSince === Infinity) minDaysSince = missedDays;

        const newValue = applyStatDecay({
          currentValue: stat.current_value,
          decayGraceDays: stat.decay_grace_days,
          decayRate: stat.decay_rate,
          daysSinceLast: minDaysSince,
        });

        if (newValue !== stat.current_value) {
          await db.stats.update(stat.id, {
            current_value: newValue,
            updated_at: now,
          });
          await db.sync_queue.add({
            table_name: "stats",
            record_id: stat.id,
            operation: "upsert",
            payload: JSON.stringify({ ...stat, current_value: newValue, updated_at: now }),
            queued_at: now,
          });
        }
      }

      // ── 3.5  Habit weight decay (for missed habits) ──
      const streaks = await db.habit_streaks
        .where("user_id")
        .equals(userId)
        .toArray();

      for (const w of weights) {
        const lastDate = lastCompletionMap.get(w.habit_id);
        if (!lastDate) continue;

        const daysSince = daysBetween(lastDate, todayStr);
        if (daysSince <= 1) continue; // completed today or yesterday — no decay

        const newWeight = updateWeightOnMiss({
          current: w.current_weight,
          min: w.min_weight,
          max: w.max_weight,
          decayRate: w.decay_rate,
        });

        if (newWeight !== w.current_weight) {
          await db.habit_stat_weights.update(w.id, {
            current_weight: newWeight,
            updated_at: now,
          });
          await db.sync_queue.add({
            table_name: "habit_stat_weights",
            record_id: w.id,
            operation: "upsert",
            payload: JSON.stringify({ ...w, current_weight: newWeight, updated_at: now }),
            queued_at: now,
          });
        }
      }

      // ── 3.6  Maturity stage transitions ──
      const maturities = await db.habit_maturity
        .where("user_id")
        .equals(userId)
        .toArray();

      for (const m of maturities) {
        // Check if habit was completed yesterday (streak continues)
        const streak = streaks.find((s: DbHabitStreak) => s.habit_id === m.habit_id);
        const lastDate = lastCompletionMap.get(m.habit_id);
        const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];

        // If the habit was NOT completed yesterday, consistent_days does not grow
        // (it's only incremented on completion in habit-checklist.tsx)
        // But if there's a multi-day gap, we could consider resetting — for now
        // we just check stage transitions based on current consistent_days
        const newStage = maturityStage(m.consistent_days);

        if (newStage !== m.stage) {
          await db.habit_maturity.update(m.id, {
            stage: newStage,
            last_stage_changed_at: now,
            updated_at: now,
          });
          await db.sync_queue.add({
            table_name: "habit_maturity",
            record_id: m.id,
            operation: "upsert",
            payload: JSON.stringify({ ...m, stage: newStage, last_stage_changed_at: now, updated_at: now }),
            queued_at: now,
          });
        }
      }

      // Mark today as done
      localStorage.setItem(STORAGE_KEY, todayStr);
    })();
  }, [userId]);

  return { levelDropTo, dismissLevelDrop: () => setLevelDropTo(null) };
}
