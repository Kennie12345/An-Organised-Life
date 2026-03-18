"use client";

import { useEffect, useState, useCallback } from "react";
import { db } from "@/db";
import type { DbHabit, DbHabitLog, DbHabitMaturity, DbHabitStreak, DbHabitStatWeight, DbLootDropCatalog } from "@/db";
import { calculateXp, type MaturityStage } from "@/utils/xp";
import { applyXpGain } from "@/utils/leveling";
import { HabitRow } from "./habit-row";
import { LootDropReveal } from "./loot-drop-reveal";
import { LevelUpCelebration } from "./level-up-celebration";

type TimeBlock = "morning" | "afternoon" | "evening";

interface HabitState {
  habit: DbHabit;
  log?: DbHabitLog;
  weekLogs: DbHabitLog[];
  maturity?: DbHabitMaturity;
  streak?: DbHabitStreak;
}

interface HabitChecklistProps {
  userId: string;
  onEndDay?: () => void;
}

function getMondayOfCurrentWeek(): string {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split("T")[0];
}

// Extract effort multiplier from a composite completion value.
// Looks for the scale step in the config and maps the chosen option to its xp_weight.
function getEffortMultiplier(habit: DbHabit, completionValue: string): number {
  if (habit.completion_type !== "composite" || !habit.completion_config) return 1.0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cfg = habit.completion_config as Record<string, any>;
  const parts: Array<{ type: string; options: string[]; xp_weights?: number[] }> =
    Array.isArray(cfg.parts)
      ? cfg.parts
      : Object.keys(cfg)
          .filter((k) => /^step\d+$/.test(k))
          .sort()
          .map((k) => cfg[k]);
  const values = completionValue.split("|");
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.type === "scale" && part.xp_weights) {
      const idx = part.options.indexOf(values[i]);
      if (idx >= 0) return part.xp_weights[idx];
    }
  }
  return 1.0;
}

const LOOT_DROP_RATES: Record<string, number> = {
  fragile:     0.30,
  building:    0.20,
  established: 0.12,
  mastered:    0.08,
};

function getMaturityStage(consistentDays: number): string {
  if (consistentDays >= 89) return "mastered";
  if (consistentDays >= 65) return "established";
  if (consistentDays >= 21) return "building";
  return "fragile";
}

export function HabitChecklist({ userId, onEndDay }: HabitChecklistProps) {
  const [states, setStates] = useState<HabitState[]>([]);
  const [weights, setWeights] = useState<DbHabitStatWeight[]>([]);
  const [activeTab, setActiveTab] = useState<TimeBlock>("morning");
  const [loading, setLoading] = useState(true);
  // Map of habitId → XP earned (shown briefly after completion)
  const [xpFlashes, setXpFlashes] = useState<Record<string, number>>({});
  // Loot drop waiting to be revealed (catalog entry + drop id to acknowledge)
  const [pendingLoot, setPendingLoot] = useState<{ catalog: DbLootDropCatalog; dropId: string } | null>(null);
  // Level-up celebration
  const [levelUpTo, setLevelUpTo] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];
    const weekStart = getMondayOfCurrentWeek();

    const [habits, todayLogs, weekLogs, maturities, streaks, habitWeights] =
      await Promise.all([
        db.habits
          .where("user_id")
          .equals(userId)
          .filter((h) => h.is_active)
          .sortBy("sequence_order"),
        db.habit_logs
          .where("user_id")
          .equals(userId)
          .filter((l) => l.completed_at.startsWith(today))
          .toArray(),
        db.habit_logs
          .where("user_id")
          .equals(userId)
          .filter((l) => l.completed_at >= weekStart)
          .toArray(),
        db.habit_maturity
          .where("user_id")
          .equals(userId)
          .toArray(),
        db.habit_streaks
          .where("user_id")
          .equals(userId)
          .toArray(),
        db.habit_stat_weights.toArray(),
      ]);

    const todayLogMap = new Map(todayLogs.map((l) => [l.habit_id, l]));
    const maturityMap = new Map(maturities.map((m) => [m.habit_id, m]));
    const streakMap = new Map(streaks.map((s) => [s.habit_id, s]));

    const newStates: HabitState[] = habits.map((habit) => ({
      habit,
      log: todayLogMap.get(habit.id),
      weekLogs: weekLogs.filter((l) => l.habit_id === habit.id),
      maturity: maturityMap.get(habit.id),
      streak: streakMap.get(habit.id),
    }));

    setStates(newStates);
    setWeights(habitWeights);

    // Default to the first tab that has incomplete habits
    const blocks: TimeBlock[] = ["morning", "afternoon", "evening"];
    for (const block of blocks) {
      const blockHabits = newStates.filter((s) => s.habit.time_block === block);
      if (blockHabits.some((s) => !s.log)) {
        setActiveTab(block);
        break;
      }
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleComplete(
    habit: DbHabit,
    value: string,
    outOfSequence: boolean,
  ) {
    const now = new Date().toISOString();
    const today = now.split("T")[0];
    const sequenceMultiplier: 1.0 | 0.5 = outOfSequence ? 0.5 : 1.0;

    const maturity = states.find((s) => s.habit.id === habit.id)?.maturity;
    const maturityStage = (maturity?.stage ?? "fragile") as MaturityStage;

    // Average weight across all stats for this habit (default 1.0)
    const habitWeights = weights.filter((w) => w.habit_id === habit.id);
    const currentWeight =
      habitWeights.length > 0
        ? habitWeights.reduce((sum, w) => sum + w.current_weight, 0) /
          habitWeights.length
        : 1.0;

    const effortMultiplier = getEffortMultiplier(habit, value);
    const { xpBase, xpFinal } = calculateXp({
      xpMin: habit.xp_min,
      xpMax: habit.xp_max,
      currentWeight,
      sequenceMultiplier,
      maturityStage,
      effortMultiplier,
    });

    const logId = crypto.randomUUID();
    const log: DbHabitLog = {
      id: logId,
      habit_id: habit.id,
      user_id: userId,
      completed_at: now,
      completion_value: value,
      sequence_multiplier: sequenceMultiplier,
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

    // XP event + user XP update
    const user = await db.users.get(userId);
    const levelBefore = user?.level ?? 1;
    const { level: levelAfter, currentXp: newCurrentXp, leveledUp } = applyXpGain(
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
      const peakLevel = Math.max(user.peak_level ?? 1, levelAfter);
      await db.users.update(userId, {
        current_xp: newCurrentXp,
        level: levelAfter,
        lifetime_xp: (user.lifetime_xp ?? 0) + xpFinal,
        peak_level: peakLevel,
        updated_at: now,
      });

      if (leveledUp) {
        setLevelUpTo(levelAfter);
      }
    }

    // Habit streak update
    const existingStreak = states.find((s) => s.habit.id === habit.id)?.streak;
    if (existingStreak) {
      const yesterday = new Date(Date.now() - 86_400_000)
        .toISOString()
        .split("T")[0];
      let newStreak = 1;
      if (existingStreak.last_completed_date === today) {
        newStreak = existingStreak.current_streak; // already completed today
      } else if (existingStreak.last_completed_date === yesterday) {
        newStreak = existingStreak.current_streak + 1;
      }
      await db.habit_streaks.update(existingStreak.id, {
        current_streak: newStreak,
        best_streak: Math.max(existingStreak.best_streak, newStreak),
        last_completed_date: today,
        updated_at: now,
      });
    }

    // Habit maturity update
    const existingMaturity = states.find((s) => s.habit.id === habit.id)?.maturity;
    if (existingMaturity) {
      const newDays = existingMaturity.consistent_days + 1;
      const newStage = getMaturityStage(newDays);
      await db.habit_maturity.update(existingMaturity.id, {
        consistent_days: newDays,
        stage: newStage,
        ...(newStage !== existingMaturity.stage
          ? { last_stage_changed_at: now }
          : {}),
        updated_at: now,
      });
    }

    // Queue for sync
    await db.sync_queue.add({
      table_name: "habit_logs",
      record_id: logId,
      operation: "upsert",
      payload: JSON.stringify(log),
      queued_at: now,
    });

    // Update local state
    setStates((prev) =>
      prev.map((s) => {
        if (s.habit.id !== habit.id) return s;
        const todayDate = today;
        return {
          ...s,
          log,
          weekLogs: [
            ...s.weekLogs.filter((l) => !l.completed_at.startsWith(todayDate)),
            log,
          ],
        };
      }),
    );

    // Loot drop check
    if (habit.loot_drop_eligible) {
      const dropRate = LOOT_DROP_RATES[maturityStage] ?? 0.20;
      if (Math.random() < dropRate) {
        const userLevel = user?.level ?? 1;
        const catalog = await db.loot_drop_catalog
          .filter((c) => c.min_level <= userLevel)
          .toArray();
        if (catalog.length > 0) {
          const picked = catalog[Math.floor(Math.random() * catalog.length)];
          const dropId = crypto.randomUUID();
          const lootDrop = {
            id: dropId,
            user_id: userId,
            catalog_id: picked.id,
            habit_log_id: logId,
            awarded_at: now,
            acknowledged: false,
            updated_at: now,
          };
          await db.loot_drops.add(lootDrop);
          await db.habit_logs.update(logId, { loot_drop_id: dropId });
          await db.sync_queue.add({
            table_name: "loot_drops",
            record_id: dropId,
            operation: "upsert",
            payload: JSON.stringify(lootDrop),
            queued_at: now,
          });
          setPendingLoot({ catalog: picked, dropId });
        }
      }
    }

    // XP flash — show for 2s
    setXpFlashes((prev) => ({ ...prev, [habit.id]: xpFinal }));
    setTimeout(
      () =>
        setXpFlashes((prev) => {
          const next = { ...prev };
          delete next[habit.id];
          return next;
        }),
      2000,
    );
  }

  const tabStates = states.filter((s) => s.habit.time_block === activeTab);

  // Determine status for each habit in the active tab
  function getStatus(index: number): "completed" | "active" | "upcoming" {
    const s = tabStates[index];
    if (s.log) return "completed";
    // Active = first incomplete in sequence
    const firstIncompleteIdx = tabStates.findIndex((ts) => !ts.log);
    return index === firstIncompleteIdx ? "active" : "upcoming";
  }

  const TABS: { key: TimeBlock; label: string }[] = [
    { key: "morning", label: "Morning" },
    { key: "afternoon", label: "Afternoon" },
    { key: "evening", label: "Evening" },
  ];

  const tabDoneCount = (block: TimeBlock) => {
    const blockStates = states.filter((s) => s.habit.time_block === block);
    return blockStates.filter((s) => s.log).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (states.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2 text-sm text-muted-foreground px-6 text-center">
        <p className="font-medium text-foreground">No habits yet.</p>
        <p>Habits will appear here once configured during onboarding.</p>
      </div>
    );
  }

  async function handleCollectLoot() {
    if (!pendingLoot) return;
    const now = new Date().toISOString();
    const catalog = pendingLoot.catalog;
    const payload = catalog.payload as Record<string, unknown>;

    // Apply loot effect based on type
    if (catalog.type === "xp_surge" && typeof payload.xp_bonus === "number") {
      const user = await db.users.get(userId);
      if (user) {
        const { level, currentXp, leveledUp } = applyXpGain(
          user.level,
          user.current_xp,
          payload.xp_bonus,
        );
        await db.users.update(userId, {
          level,
          current_xp: currentXp,
          lifetime_xp: user.lifetime_xp + payload.xp_bonus,
          peak_level: Math.max(user.peak_level, level),
          updated_at: now,
        });
        await db.xp_events.add({
          id: crypto.randomUUID(),
          user_id: userId,
          amount: payload.xp_bonus,
          source_type: "loot_drop",
          source_id: pendingLoot.dropId,
          level_before: user.level,
          level_after: level,
          created_at: now,
        });
        if (leveledUp) setLevelUpTo(level);
      }
    } else if (catalog.type === "stat_boost" && typeof payload.boost === "number") {
      // Boost a random active stat
      const stats = await db.stats
        .where("user_id")
        .equals(userId)
        .filter((s) => s.is_active)
        .toArray();
      if (stats.length > 0) {
        const stat = stats[Math.floor(Math.random() * stats.length)];
        const newValue = Math.min(100, stat.current_value + payload.boost);
        await db.stats.update(stat.id, { current_value: newValue, updated_at: now });
        await db.sync_queue.add({
          table_name: "stats",
          record_id: stat.id,
          operation: "upsert",
          payload: JSON.stringify({ ...stat, current_value: newValue, updated_at: now }),
          queued_at: now,
        });
      }
    }
    // rested_bonus and fortune are passive — stored on the loot_drops row
    // and checked during habit completion / daily upkeep respectively

    await db.loot_drops.update(pendingLoot.dropId, { acknowledged: true, updated_at: now });
    await db.sync_queue.add({
      table_name: "loot_drops",
      record_id: pendingLoot.dropId,
      operation: "upsert",
      payload: JSON.stringify({ acknowledged: true, updated_at: now }),
      queued_at: now,
    });
    setPendingLoot(null);
  }

  return (
    <>
    {levelUpTo !== null && (
      <LevelUpCelebration level={levelUpTo} show onDismiss={() => setLevelUpTo(null)} />
    )}
    {pendingLoot && (
      <LootDropReveal catalog={pendingLoot.catalog} onCollect={handleCollectLoot} />
    )}
    <div className="flex flex-col">
      {/* Tab bar */}
      <div className="flex border-b border-border bg-background sticky top-0 z-10">
        {TABS.map(({ key, label }) => {
          const blockStates = states.filter((s) => s.habit.time_block === key);
          const total = blockStates.length;
          const done = tabDoneCount(key);
          const active = key === activeTab;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-3 text-xs font-medium transition-colors active:opacity-70 ${
                active
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {label}
              {total > 0 && (
                <span className="ml-1 text-[10px]">
                  {done}/{total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Habit list */}
      <div>
        {tabStates.length === 0 ? (
          <p className="px-4 py-8 text-sm text-muted-foreground text-center">
            No {activeTab} habits configured.
          </p>
        ) : (
          tabStates.map((s, i) => (
            <HabitRow
              key={s.habit.id}
              habit={s.habit}
              status={getStatus(i)}
              log={s.log}
              weekCompletedDates={s.weekLogs
                .map((l) => l.completed_at.split("T")[0])
                .filter(Boolean)}
              xpFlash={xpFlashes[s.habit.id]}
              onComplete={(value, oos) => handleComplete(s.habit, value, oos)}
            />
          ))
        )}
      </div>

      {/* End Day button — visible on the evening tab */}
      {onEndDay && activeTab === "evening" && (
        <div className="px-4 py-6">
          <button
            onClick={onEndDay}
            className="w-full rounded-xl border border-border py-3.5 text-sm font-medium text-foreground active:opacity-70"
          >
            End Day
          </button>
        </div>
      )}
    </div>
    </>
  );
}
