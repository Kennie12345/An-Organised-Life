"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  db,
  type DbStat,
  type DbGoal,
  type DbHabit,
  type DbHabitLog,
  type DbTask,
  type DbLogbookMetric,
  type DbLogbookEntry,
} from "@/db";
import { queueWrite } from "@/lib/sync";
import { Check, ChevronLeft } from "lucide-react";

/* ── Types ── */

interface StatChange {
  stat: DbStat;
  completionsThisWeek: number;
  completionsLastWeek: number;
  direction: "up" | "down" | "flat";
}

interface UnlinkedTask {
  task: DbTask;
}

interface MetricTrend {
  metric: DbLogbookMetric;
  thisWeek: number[];
  lastWeek: number[];
  direction: "up" | "down" | "flat";
}

/* ── Stat Summary Section ── */

function StatSummary({ changes }: { changes: StatChange[] }) {
  if (changes.length === 0) return null;

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
        Stats this week
      </p>
      <div className="space-y-1.5">
        {changes.map((c) => (
          <div key={c.stat.id} className="flex items-center justify-between py-1">
            <span className="text-[13px]">{c.stat.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-[12px] tabular-nums">
                {Math.round(c.stat.current_value)}
              </span>
              <span
                className="text-[11px]"
                style={{
                  color:
                    c.direction === "up"
                      ? "hsl(152 60% 48%)"
                      : c.direction === "down"
                        ? "hsl(0 65% 55%)"
                        : "hsl(var(--muted-foreground))",
                }}
              >
                {c.completionsThisWeek} completions
                {c.direction === "up" && " ↑"}
                {c.direction === "down" && " ↓"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Unlinked Tasks Section ── */

function UnlinkedTasksSection({
  tasks,
  goals,
  onLink,
}: {
  tasks: UnlinkedTask[];
  goals: DbGoal[];
  onLink: (taskId: string, goalId: string) => void;
}) {
  const [linkingTask, setLinkingTask] = useState<string | null>(null);

  if (tasks.length === 0) return null;

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
        Completed tasks — link to a goal?
      </p>
      <div className="space-y-2">
        {tasks.map(({ task }) => (
          <div key={task.id}>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[13px]">{task.name}</span>
              {goals.length > 0 && (
                <button
                  onClick={() =>
                    setLinkingTask(linkingTask === task.id ? null : task.id)
                  }
                  className="text-[11px] text-muted-foreground active:text-foreground"
                >
                  Link
                </button>
              )}
            </div>
            {linkingTask === task.id && (
              <div className="ml-2 space-y-1 pb-2">
                {goals.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      onLink(task.id, g.id);
                      setLinkingTask(null);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-[12px] active:opacity-50"
                    style={{ border: "1px solid hsl(var(--muted))" }}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Logbook Trends ── */

function LogbookTrends({ trends }: { trends: MetricTrend[] }) {
  if (trends.length === 0) return null;

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
        Logbook trends
      </p>
      <div className="space-y-1.5">
        {trends.map((t) => {
          const avg = (vals: number[]) =>
            vals.length > 0
              ? vals.reduce((a, b) => a + b, 0) / vals.length
              : 0;
          const thisAvg = avg(t.thisWeek);
          const lastAvg = avg(t.lastWeek);

          return (
            <div
              key={t.metric.id}
              className="flex items-center justify-between py-1"
            >
              <span className="text-[13px]">{t.metric.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-[12px] tabular-nums">
                  {t.thisWeek.length > 0
                    ? thisAvg.toFixed(1)
                    : "—"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {t.metric.unit}
                </span>
                {t.lastWeek.length > 0 && t.thisWeek.length > 0 && (
                  <span
                    className="text-[10px]"
                    style={{
                      color:
                        t.direction === "up"
                          ? "hsl(152 60% 48%)"
                          : t.direction === "down"
                            ? "hsl(0 65% 55%)"
                            : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {t.direction === "up" && "↑"}
                    {t.direction === "down" && "↓"}
                    {t.direction === "flat" && "—"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Page ── */

export default function WeeklyReviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [statChanges, setStatChanges] = useState<StatChange[]>([]);
  const [unlinkedTasks, setUnlinkedTasks] = useState<UnlinkedTask[]>([]);
  const [goals, setGoals] = useState<DbGoal[]>([]);
  const [metricTrends, setMetricTrends] = useState<MetricTrend[]>([]);
  const [intentions, setIntentions] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id;
      if (!uid) return;
      setUserId(uid);

      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Sunday
      weekStart.setHours(0, 0, 0, 0);
      const lastWeekStart = new Date(weekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

      const thisWeekStr = weekStart.toISOString();
      const lastWeekStr = lastWeekStart.toISOString();

      // Load data
      const [stats, habits, logs, tasks, activeGoals, metrics, entries] =
        await Promise.all([
          db.stats.where("user_id").equals(uid).sortBy("sequence_order"),
          db.habits.where("user_id").equals(uid).toArray(),
          db.habit_logs.where("user_id").equals(uid).toArray(),
          db.tasks.where("user_id").equals(uid).toArray(),
          db.goals
            .where("user_id")
            .equals(uid)
            .filter((g: DbGoal) => g.status === "active")
            .toArray(),
          db.logbook_metrics.where("user_id").equals(uid).toArray(),
          db.logbook_entries.where("user_id").equals(uid).toArray(),
        ]);

      setGoals(activeGoals);

      // Stat changes: count completions this week vs last week per stat
      const habitStatWeights = await db.habit_stat_weights.toArray();
      const habitToStats = new Map<string, string[]>();
      for (const w of habitStatWeights) {
        const arr = habitToStats.get(w.habit_id) ?? [];
        arr.push(w.stat_id);
        habitToStats.set(w.habit_id, arr);
      }

      const thisWeekLogs = logs.filter((l) => l.completed_at >= thisWeekStr);
      const lastWeekLogs = logs.filter(
        (l) => l.completed_at >= lastWeekStr && l.completed_at < thisWeekStr,
      );

      const countPerStat = (logSet: DbHabitLog[]) => {
        const counts = new Map<string, number>();
        for (const log of logSet) {
          const statIds = habitToStats.get(log.habit_id) ?? [];
          for (const sid of statIds) {
            counts.set(sid, (counts.get(sid) ?? 0) + 1);
          }
        }
        return counts;
      };

      const thisWeekCounts = countPerStat(thisWeekLogs);
      const lastWeekCounts = countPerStat(lastWeekLogs);

      const changes: StatChange[] = stats.map((stat) => {
        const tw = thisWeekCounts.get(stat.id) ?? 0;
        const lw = lastWeekCounts.get(stat.id) ?? 0;
        return {
          stat,
          completionsThisWeek: tw,
          completionsLastWeek: lw,
          direction: tw > lw ? "up" : tw < lw ? "down" : "flat",
        };
      });
      setStatChanges(changes);

      // Unlinked completed tasks this week
      const unlinked = tasks
        .filter(
          (t) =>
            t.completed_at &&
            t.completed_at >= thisWeekStr &&
            !t.goal_id,
        )
        .map((task) => ({ task }));
      setUnlinkedTasks(unlinked);

      // Logbook trends
      const trends: MetricTrend[] = metrics.map((metric) => {
        const metricEntries = entries.filter(
          (e) => e.metric_id === metric.id,
        );
        const tw = metricEntries
          .filter((e) => e.logged_at >= thisWeekStr)
          .map((e) => e.value);
        const lw = metricEntries
          .filter(
            (e) => e.logged_at >= lastWeekStr && e.logged_at < thisWeekStr,
          )
          .map((e) => e.value);

        const avgTw =
          tw.length > 0 ? tw.reduce((a, b) => a + b, 0) / tw.length : 0;
        const avgLw =
          lw.length > 0 ? lw.reduce((a, b) => a + b, 0) / lw.length : 0;

        return {
          metric,
          thisWeek: tw,
          lastWeek: lw,
          direction:
            tw.length === 0 || lw.length === 0
              ? "flat"
              : avgTw > avgLw
                ? "up"
                : avgTw < avgLw
                  ? "down"
                  : "flat",
        };
      });
      setMetricTrends(trends);

      setLoading(false);
    }
    load();
  }, []);

  const linkTask = async (taskId: string, goalId: string) => {
    if (!userId) return;
    const now = new Date().toISOString();
    const task = await db.tasks.get(taskId);
    if (!task) return;

    await db.tasks.update(taskId, {
      goal_id: goalId,
      goal_linked_at: now,
      updated_at: now,
    });
    await queueWrite("tasks", taskId, "upsert", {
      ...task,
      goal_id: goalId,
      goal_linked_at: now,
      updated_at: now,
    });

    setUnlinkedTasks((prev) => prev.filter((t) => t.task.id !== taskId));
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="px-6 pt-6 pb-8 overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-1 -ml-1 active:opacity-50"
        >
          <ChevronLeft size={20} />
        </button>
        <p className="text-[13px] uppercase tracking-[0.15em] text-muted-foreground">
          Weekly Review
        </p>
      </div>

      <div className="space-y-8">
        {/* Stat summary */}
        <StatSummary changes={statChanges} />

        {/* Unlinked tasks */}
        <UnlinkedTasksSection
          tasks={unlinkedTasks}
          goals={goals}
          onLink={linkTask}
        />

        {/* Logbook trends */}
        <LogbookTrends trends={metricTrends} />

        {/* Next week intentions */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
            Intentions for next week
          </p>
          <textarea
            value={intentions}
            onChange={(e) => setIntentions(e.target.value)}
            placeholder="What will you focus on?"
            rows={3}
            className="w-full bg-transparent border border-muted-foreground/20 rounded-lg p-3 text-[13px] outline-none focus:border-foreground/40 transition-colors placeholder:text-muted-foreground/30 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
