"use client";

import { useEffect, useState } from "react";
import { Pill } from "lucide-react";
import { db, type DbHabit, type DbHabitLog } from "@/db";
import { calculateXp, type MaturityStage } from "@/utils/xp";
import { applyXpGain } from "@/utils/leveling";

interface MedState {
  habit: DbHabit;
  log: DbHabitLog | null;
}

interface MedicationTrackerProps {
  userId: string;
}

export function MedicationTracker({ userId }: MedicationTrackerProps) {
  const [meds, setMeds] = useState<MedState[]>([]);

  useEffect(() => {
    async function init() {
      const medHabits = await db.habits
        .where("user_id")
        .equals(userId)
        .filter(
          (h) => h.is_active && h.name.toLowerCase().includes("medication"),
        )
        .sortBy("sequence_order");

      if (medHabits.length === 0) return;

      const today = new Date().toISOString().split("T")[0];
      const habitIds = medHabits.map((h) => h.id);
      const todayLogs = await db.habit_logs
        .where("user_id")
        .equals(userId)
        .filter(
          (l) =>
            habitIds.includes(l.habit_id) && l.completed_at.startsWith(today),
        )
        .toArray();

      const logMap = new Map(todayLogs.map((l) => [l.habit_id, l]));
      setMeds(medHabits.map((h) => ({ habit: h, log: logMap.get(h.id) ?? null })));
    }
    init();
  }, [userId]);

  async function handleTap(habitId: string) {
    const med = meds.find((m) => m.habit.id === habitId);
    if (!med || med.log) return; // already taken

    const now = new Date().toISOString();
    const habit = med.habit;

    const maturity = await db.habit_maturity
      .where("habit_id")
      .equals(habitId)
      .filter((m) => m.user_id === userId)
      .first();

    const maturityStage = (maturity?.stage ?? "fragile") as MaturityStage;

    const habitWeights = await db.habit_stat_weights
      .where("habit_id")
      .equals(habitId)
      .toArray();
    const currentWeight =
      habitWeights.length > 0
        ? habitWeights.reduce((sum, w) => sum + w.current_weight, 0) /
          habitWeights.length
        : 1.0;

    const { xpBase, xpFinal } = calculateXp({
      xpMin: habit.xp_min,
      xpMax: habit.xp_max,
      currentWeight,
      sequenceMultiplier: 1.0,
      maturityStage,
    });

    const logId = crypto.randomUUID();
    const log: DbHabitLog = {
      id: logId,
      habit_id: habitId,
      user_id: userId,
      completed_at: now,
      completion_value: "true",
      sequence_multiplier: 1.0,
      xp_base: xpBase,
      xp_final: xpFinal,
      notes: null,
      metadata: null,
      llm_prompt_shown: false,
      llm_response: null,
      loot_drop_id: null,
      bonus_xp_awarded: null,
    };

    await db.habit_logs.put(log);

    const user = await db.users.get(userId);
    const levelBefore = user?.level ?? 1;
    const { level: levelAfter, currentXp: newCurrentXp } = applyXpGain(
      levelBefore,
      user?.current_xp ?? 0,
      xpFinal,
    );

    await db.xp_events.add({
      id: crypto.randomUUID(),
      user_id: userId,
      amount: xpFinal,
      source_type: "habit_completion",
      source_id: logId,
      level_before: levelBefore,
      level_after: levelAfter,
      created_at: now,
    });

    if (user) {
      await db.users.update(userId, {
        current_xp: newCurrentXp,
        level: levelAfter,
        lifetime_xp: (user.lifetime_xp ?? 0) + xpFinal,
        updated_at: now,
      });
    }

    await db.sync_queue.add({
      table_name: "habit_logs",
      record_id: logId,
      operation: "upsert",
      payload: JSON.stringify(log),
      queued_at: now,
    });

    setMeds((prev) =>
      prev.map((m) => (m.habit.id === habitId ? { ...m, log } : m)),
    );
  }

  if (meds.length === 0) return null;

  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`Medication: ${meds.filter((m) => m.log).length} of ${meds.length} taken`}
    >
      {meds.map((m) => (
        <button
          key={m.habit.id}
          onClick={() => handleTap(m.habit.id)}
          className={`p-1 transition-colors active:scale-90 ${
            m.log ? "text-green-400" : "text-muted-foreground/30"
          }`}
          aria-label={m.habit.name}
          title={m.habit.name}
        >
          <Pill size={14} />
        </button>
      ))}
    </div>
  );
}
