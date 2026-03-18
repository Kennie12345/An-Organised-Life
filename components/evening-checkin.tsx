"use client";

import { useState, useEffect } from "react";
import { db } from "@/db";
import type { DbXpEvent, DbHabitLog, DbDailyPlan } from "@/db";

const MOODS = [
  { value: 1, emoji: "😔", label: "Rough" },
  { value: 2, emoji: "😕", label: "Meh" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "😊", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
];

interface TodaySummary {
  xpEarned: number;
  habitsCompleted: number;
  habitsTotal: number;
  moodStart: number | null;
}

async function getTodaySummary(userId: string): Promise<TodaySummary> {
  const today = new Date().toISOString().split("T")[0];

  const [xpEvents, habitLogs, allHabits, plan] = await Promise.all([
    db.xp_events
      .where("user_id")
      .equals(userId)
      .filter((e: DbXpEvent) => e.created_at.startsWith(today))
      .toArray(),
    db.habit_logs
      .where("user_id")
      .equals(userId)
      .filter((l: DbHabitLog) => l.completed_at.startsWith(today))
      .toArray(),
    db.habits
      .where("user_id")
      .equals(userId)
      .filter((h) => h.is_active)
      .toArray(),
    db.daily_plans
      .where("user_id")
      .equals(userId)
      .filter((p: DbDailyPlan) => p.plan_date === today)
      .first(),
  ]);

  return {
    xpEarned: xpEvents.reduce((sum: number, e: DbXpEvent) => sum + (e.amount ?? 0), 0),
    habitsCompleted: habitLogs.length,
    habitsTotal: allHabits.length,
    moodStart: plan?.mood_start ?? null,
  };
}

interface EveningCheckInProps {
  userId: string;
  onComplete: () => void;
}

export function EveningCheckIn({ userId, onComplete }: EveningCheckInProps) {
  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [journal, setJournal] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getTodaySummary(userId).then(setSummary);
  }, [userId]);

  async function handleEndDay() {
    if (!mood) return;
    setSaving(true);

    const today = new Date().toISOString().split("T")[0];
    const now = new Date().toISOString();

    const plan = await db.daily_plans
      .where("user_id")
      .equals(userId)
      .filter((p) => p.plan_date === today)
      .first();

    if (plan) {
      await db.daily_plans.update(plan.id, {
        mood_end: mood,
        journal_entry: journal.trim() || null,
        completed_at: now,
        updated_at: now,
      });

      await db.sync_queue.add({
        table_name: "daily_plans",
        record_id: plan.id,
        operation: "upsert",
        payload: JSON.stringify({
          ...plan,
          mood_end: mood,
          journal_entry: journal.trim() || null,
          completed_at: now,
          updated_at: now,
        }),
        queued_at: now,
      });
    }

    onComplete();
  }

  const completionPct =
    summary && summary.habitsTotal > 0
      ? Math.round((summary.habitsCompleted / summary.habitsTotal) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6 px-4 py-6 max-w-lg mx-auto">
      {/* Today summary */}
      {summary && (
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
            Today
          </p>
          <div className="flex gap-6">
            <div>
              <p className="text-2xl font-bold">+{summary.xpEarned}</p>
              <p className="text-xs text-muted-foreground">XP earned</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {summary.habitsCompleted}/{summary.habitsTotal}
              </p>
              <p className="text-xs text-muted-foreground">habits done</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{completionPct}%</p>
              <p className="text-xs text-muted-foreground">complete</p>
            </div>
          </div>
          {summary.moodStart && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Morning mood: {MOODS[summary.moodStart - 1]?.emoji}</span>
            </div>
          )}
        </div>
      )}

      {/* Journal */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">How was your day?</p>
        <p className="text-xs text-muted-foreground">
          A few sentences — what went well, what was hard. Keep it brief.
        </p>
        <textarea
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
          placeholder="Today I..."
          rows={3}
          maxLength={500}
          className="rounded-xl border border-border bg-background px-3 py-2.5 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <p className="text-[10px] text-muted-foreground text-right">
          {journal.length}/500
        </p>
      </div>

      {/* Evening mood */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">How are you feeling tonight?</p>
        <div className="flex justify-between gap-2">
          {MOODS.map(({ value, emoji, label }) => (
            <button
              key={value}
              onClick={() => setMood(value)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl border py-3 text-lg active:opacity-70 ${
                mood === value
                  ? "border-foreground bg-foreground/5"
                  : "border-border"
              }`}
            >
              <span>{emoji}</span>
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* End Day */}
      <button
        onClick={handleEndDay}
        disabled={!mood || saving}
        className="mt-2 w-full rounded-xl bg-foreground py-3.5 text-sm font-semibold text-background disabled:opacity-40 active:opacity-70"
      >
        {saving ? "Saving..." : "End Day"}
      </button>
      {!mood && (
        <p className="text-center text-xs text-muted-foreground -mt-4">
          Select a mood to continue
        </p>
      )}
    </div>
  );
}
