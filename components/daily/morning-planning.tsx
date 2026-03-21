"use client";

import { useState, useEffect } from "react";
import { db } from "@/db";
import { uuid } from "@/utils/uuid";
import type { DbXpEvent, DbHabitLog, DbDailyPlan, DbGoal, DbGoalStakeEffect, DbStat } from "@/db";

const MOODS = [
  { value: 1, emoji: "😔", label: "Rough" },
  { value: 2, emoji: "😕", label: "Meh" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "😊", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
];

import type { Json } from "@/lib/supabase/database.types";

interface AdHocIntention {
  text: string;
  linked_goal_id: string | null;
  [key: string]: Json | undefined;
}

interface YesterdaySummary {
  xpEarned: number;
  habitsCompleted: number;
  mood: number | null;
}

async function getYesterdaySummary(userId: string): Promise<YesterdaySummary> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yDate = yesterday.toISOString().split("T")[0];

  const [xpEvents, habitLogs, plan] = await Promise.all([
    db.xp_events
      .where("user_id")
      .equals(userId)
      .filter((e: DbXpEvent) => e.created_at.startsWith(yDate))
      .toArray(),
    db.habit_logs
      .where("user_id")
      .equals(userId)
      .filter((l: DbHabitLog) => l.completed_at.startsWith(yDate))
      .toArray(),
    db.daily_plans
      .where("user_id")
      .equals(userId)
      .filter((p: DbDailyPlan) => p.plan_date === yDate)
      .first(),
  ]);

  return {
    xpEarned: xpEvents.reduce((sum: number, e: DbXpEvent) => sum + (e.amount ?? 0), 0),
    habitsCompleted: habitLogs.length,
    mood: plan?.mood_start ?? null,
  };
}

interface MorningPlanningProps {
  userId: string;
  onComplete: () => void;
}

export function MorningPlanning({ userId, onComplete }: MorningPlanningProps) {
  const [summary, setSummary] = useState<YesterdaySummary | null>(null);
  const [activeGoals, setActiveGoals] = useState<DbGoal[]>([]);
  const [goalStakes, setGoalStakes] = useState<Record<string, Array<{ statName: string; color: string; value: number; trigger: string }>>>({});
  const [focusGoalId, setFocusGoalId] = useState<string | null>(null);
  const [adHocIntentions, setAdHocIntentions] = useState<AdHocIntention[]>([]);
  const [mood, setMood] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Ad-hoc intention capture state
  const [addingIntention, setAddingIntention] = useState(false);
  const [intentionDraft, setIntentionDraft] = useState("");
  // After submitting draft, show goal-link prompt
  const [linkingIntention, setLinkingIntention] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [summ, goals] = await Promise.all([
        getYesterdaySummary(userId),
        db.goals
          .where("user_id")
          .equals(userId)
          .filter((g: DbGoal) => g.status === "active")
          .toArray(),
      ]);
      setSummary(summ);
      setActiveGoals(goals);

      // Load stakes for each goal
      if (goals.length > 0) {
        const [allStakes, stats] = await Promise.all([
          db.goal_stake_effects.toArray(),
          db.stats.where("user_id").equals(userId).toArray(),
        ]);
        const statMap = new Map(stats.map((s) => [s.id, s]));
        const stakesByGoal: Record<string, Array<{ statName: string; color: string; value: number; trigger: string }>> = {};
        for (const goal of goals) {
          stakesByGoal[goal.id] = allStakes
            .filter((s) => s.goal_id === goal.id)
            .map((s) => {
              const stat = statMap.get(s.stat_id);
              return { statName: stat?.name ?? "?", color: stat?.color ?? "#888", value: s.effect_value, trigger: s.trigger };
            });
        }
        setGoalStakes(stakesByGoal);
      }
    }
    load();
  }, [userId]);

  function handleIntentionSubmit() {
    if (!intentionDraft.trim()) return;
    setLinkingIntention(intentionDraft.trim());
    setIntentionDraft("");
    setAddingIntention(false);
  }

  function handleGoalLink(goalId: string | null) {
    if (!linkingIntention) return;
    setAdHocIntentions((prev) => [
      ...prev,
      { text: linkingIntention, linked_goal_id: goalId },
    ]);
    setLinkingIntention(null);
  }

  async function handleBeginDay() {
    if (!mood) return;
    setSaving(true);

    const today = new Date().toISOString().split("T")[0];
    const id = uuid();
    const now = new Date().toISOString();

    const plan = {
      id,
      user_id: userId,
      plan_date: today,
      intentions: {
        focus_goal_id: focusGoalId,
        ad_hoc: adHocIntentions,
      },
      mood_start: mood,
      mood_end: null,
      journal_entry: null,
      completed_at: null,
      created_at: now,
      updated_at: now,
    };

    await db.daily_plans.put(plan);
    await db.sync_queue.add({
      table_name: "daily_plans",
      record_id: id,
      operation: "upsert",
      payload: JSON.stringify(plan),
      queued_at: now,
    });

    onComplete();
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6 max-w-lg mx-auto">
      {/* Yesterday summary */}
      {summary && (summary.xpEarned > 0 || summary.habitsCompleted > 0) ? (
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
            Yesterday
          </p>
          <div className="flex gap-6">
            <div>
              <p className="text-2xl font-bold">+{summary.xpEarned}</p>
              <p className="text-xs text-muted-foreground">XP earned</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.habitsCompleted}</p>
              <p className="text-xs text-muted-foreground">
                habit{summary.habitsCompleted !== 1 ? "s" : ""} done
              </p>
            </div>
            {summary.mood && (
              <div>
                <p className="text-2xl">{MOODS[summary.mood - 1]?.emoji}</p>
                <p className="text-xs text-muted-foreground">mood</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          No data from yesterday yet.
        </div>
      )}

      {/* Goal focus */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">What's your focus today?</p>
        {activeGoals.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active goals yet — set them in the Goals tab.
          </p>
        ) : (
          activeGoals.map((goal) => (
            <button
              key={goal.id}
              onClick={() =>
                setFocusGoalId(focusGoalId === goal.id ? null : goal.id)
              }
              className={`w-full rounded-xl border px-4 py-3.5 text-left active:opacity-70 ${
                focusGoalId === goal.id
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              <p className="text-sm font-medium">{goal.name}</p>
              {goal.why && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {goal.why}
                </p>
              )}
              {goalStakes[goal.id] && goalStakes[goal.id].length > 0 && (
                <div className="flex gap-2 mt-1.5">
                  {goalStakes[goal.id]
                    .filter((s) => s.trigger === "success")
                    .map((s, i) => (
                      <span key={`s${i}`} className="text-[10px] font-medium" style={{ color: "rgb(34 197 94)" }}>
                        {s.statName} +{s.value}
                      </span>
                    ))}
                  {goalStakes[goal.id]
                    .filter((s) => s.trigger === "failure")
                    .map((s, i) => (
                      <span key={`f${i}`} className="text-[10px] font-medium" style={{ color: "rgb(239 68 68)" }}>
                        {s.statName} {s.value}
                      </span>
                    ))}
                </div>
              )}
            </button>
          ))
        )}

        {/* Ad-hoc intentions already added */}
        {adHocIntentions.map((intention, i) => {
          const linked = activeGoals.find((g) => g.id === intention.linked_goal_id);
          return (
            <div
              key={i}
              className="rounded-xl border border-border px-4 py-3 flex items-start justify-between gap-2"
            >
              <div>
                <p className="text-sm">{intention.text}</p>
                {linked && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    → {linked.name}
                  </p>
                )}
              </div>
              <button
                onClick={() =>
                  setAdHocIntentions((prev) => prev.filter((_, j) => j !== i))
                }
                className="text-muted-foreground text-xs shrink-0 active:opacity-70"
              >
                Remove
              </button>
            </div>
          );
        })}

        {/* Goal-link prompt after submitting a draft */}
        {linkingIntention && (
          <div className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col gap-3">
            <p className="text-sm font-medium">"{linkingIntention}"</p>
            <p className="text-xs text-muted-foreground">
              Does this connect to any of your goals?
            </p>
            <div className="flex flex-col gap-2">
              {activeGoals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => handleGoalLink(goal.id)}
                  className="w-full rounded-xl border border-border px-3 py-2.5 text-left text-sm active:opacity-70"
                >
                  {goal.name}
                </button>
              ))}
              <button
                onClick={() => handleGoalLink(null)}
                className="text-xs text-muted-foreground py-1 active:opacity-70"
              >
                Skip — it doesn't connect to a goal
              </button>
            </div>
          </div>
        )}

        {/* Add intention input */}
        {addingIntention ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={intentionDraft}
              onChange={(e) => setIntentionDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleIntentionSubmit()}
              placeholder="What's coming up today?"
              autoFocus
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleIntentionSubmit}
              disabled={!intentionDraft.trim()}
              className="rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-40 active:opacity-70"
            >
              Add
            </button>
          </div>
        ) : (
          !linkingIntention && (
            <button
              onClick={() => setAddingIntention(true)}
              className="text-sm text-muted-foreground text-left active:opacity-70"
            >
              + Add intention
            </button>
          )
        )}
      </div>

      {/* Mood */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">How are you feeling this morning?</p>
        <div className="flex justify-between gap-2">
          {MOODS.map(({ value, emoji, label }) => (
            <button
              key={value}
              onClick={() => setMood(value)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl border py-3 text-lg active:opacity-70 ${
                mood === value
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              <span>{emoji}</span>
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Begin Day */}
      <button
        onClick={handleBeginDay}
        disabled={!mood || saving || !!linkingIntention}
        className="mt-2 w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-40 active:opacity-70"
      >
        {saving ? "Starting…" : "Begin Day"}
      </button>
      {!mood && (
        <p className="text-center text-xs text-muted-foreground -mt-4">
          Select a mood to continue
        </p>
      )}
      {linkingIntention && (
        <p className="text-center text-xs text-muted-foreground -mt-4">
          Link or skip your intention above to continue
        </p>
      )}
    </div>
  );
}
