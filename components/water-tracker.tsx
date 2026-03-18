"use client";

import { useEffect, useState } from "react";
import { GlassWater } from "lucide-react";
import { db, type DbHabitLog } from "@/db";
import { calculateXp, type MaturityStage } from "@/utils/xp";
import { applyXpGain } from "@/utils/leveling";
import { uuid } from "@/utils/uuid";

const WATER_TARGET = 8;

interface WaterTrackerProps {
  userId: string;
}

export function WaterTracker({ userId }: WaterTrackerProps) {
  const [count, setCount] = useState(0);
  const [habitId, setHabitId] = useState<string | null>(null);
  const [currentLog, setCurrentLog] = useState<DbHabitLog | null>(null);
  const [xpAwarded, setXpAwarded] = useState(false);

  useEffect(() => {
    async function init() {
      const waterHabit = await db.habits
        .where("user_id")
        .equals(userId)
        .filter((h) => h.name === "Water intake" && h.is_active)
        .first();

      if (!waterHabit) return;
      setHabitId(waterHabit.id);

      const today = new Date().toISOString().split("T")[0];
      const todayLog = await db.habit_logs
        .where("user_id")
        .equals(userId)
        .filter(
          (l) => l.habit_id === waterHabit.id && l.completed_at.startsWith(today),
        )
        .first();

      if (todayLog) {
        setCurrentLog(todayLog);
        const saved = parseInt(todayLog.completion_value ?? "0", 10);
        const glassCount = isNaN(saved) ? 0 : saved;
        setCount(glassCount);
        setXpAwarded((todayLog.xp_final ?? 0) > 0);
      }
    }
    init();
  }, [userId]);

  async function handleGlassTap(glassIndex: number) {
    const newCount = glassIndex + 1;
    if (newCount <= count || !habitId) return;

    setCount(newCount);
    const now = new Date().toISOString();

    let activeLog = currentLog;

    if (activeLog) {
      await db.habit_logs.update(activeLog.id, {
        completion_value: String(newCount),
        completed_at: now,
      });
      activeLog = { ...activeLog, completion_value: String(newCount), completed_at: now };
      setCurrentLog(activeLog);
      await db.sync_queue.add({
        table_name: "habit_logs",
        record_id: activeLog.id,
        operation: "upsert",
        payload: JSON.stringify(activeLog),
        queued_at: now,
      });
    } else {
      const newLogId = uuid();
      const log: DbHabitLog = {
        id: newLogId,
        habit_id: habitId,
        user_id: userId,
        completed_at: now,
        completion_value: String(newCount),
        sequence_multiplier: 1.0,
        xp_base: 0,
        xp_final: 0,
        notes: null,
        metadata: null,
        llm_prompt_shown: false,
        llm_response: null,
        loot_drop_id: null,
        bonus_xp_awarded: null,
      };
      await db.habit_logs.put(log);
      setCurrentLog(log);
      activeLog = log;
      await db.sync_queue.add({
        table_name: "habit_logs",
        record_id: newLogId,
        operation: "upsert",
        payload: JSON.stringify(log),
        queued_at: now,
      });
    }

    // Award XP once when target is reached
    if (newCount >= WATER_TARGET && !xpAwarded) {
      setXpAwarded(true);

      const habit = await db.habits.get(habitId);
      if (!habit) return;

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

      const user = await db.users.get(userId);
      const levelBefore = user?.level ?? 1;
      const { level: levelAfter, currentXp: newCurrentXp } = applyXpGain(
        levelBefore,
        user?.current_xp ?? 0,
        xpFinal,
      );

      await db.xp_events.add({
        id: uuid(),
        user_id: userId,
        amount: xpFinal,
        source_type: "habit_completion",
        source_id: activeLog.id,
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

      // Update the log with XP values
      await db.habit_logs.update(activeLog.id, {
        xp_base: xpBase,
        xp_final: xpFinal,
      });
    }
  }

  if (!habitId) return null;

  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`Water: ${count} of ${WATER_TARGET} glasses`}
    >
      {Array.from({ length: WATER_TARGET }).map((_, i) => (
        <button
          key={i}
          onClick={() => handleGlassTap(i)}
          className={`p-1 transition-colors active:scale-90 ${
            i < count ? "text-blue-400" : "text-muted-foreground/30"
          }`}
          aria-label={`Glass ${i + 1}`}
        >
          <GlassWater size={14} />
        </button>
      ))}
      <span className="ml-1 text-[10px] text-muted-foreground">
        {count}/{WATER_TARGET}
      </span>
    </div>
  );
}
