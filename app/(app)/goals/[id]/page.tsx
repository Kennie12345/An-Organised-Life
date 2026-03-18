"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Check, Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  db,
  type DbGoal,
  type DbStat,
  type DbGoalMilestone,
  type DbGoalStep,
  type DbGoalStakeEffect,
  type DbGoalHabitLink,
  type DbGoalMetricTarget,
  type DbHabit,
  type DbTask,
  type DbLogbookMetric,
} from "@/db";
import { queueWrite } from "@/lib/sync";
import { awardTaskXp } from "@/utils/task-xp";
import { uuid } from "@/utils/uuid";

/* ── Types ── */

interface GoalDetailData {
  goal: DbGoal;
  stat: DbStat | null;
  milestones: (DbGoalMilestone & { steps: DbGoalStep[] })[];
  stakeEffects: DbGoalStakeEffect[];
  linkedHabits: DbHabit[];
  tasks: DbTask[];
  metricTarget: {
    target: DbGoalMetricTarget;
    metric: DbLogbookMetric;
    latestValue: number | null;
  } | null;
}

/* ── Milestone Row ── */

function MilestoneRow({
  milestone,
  onToggle,
}: {
  milestone: DbGoalMilestone & { steps: DbGoalStep[] };
  onToggle: (id: string) => void;
}) {
  const done = !!milestone.completed_at;
  const stepsDone = milestone.steps.filter((s) => s.completed_at).length;

  return (
    <div className="py-2">
      <button
        onClick={() => onToggle(milestone.id)}
        className="w-full flex items-start gap-3 text-left active:opacity-50"
      >
        <div
          className="mt-0.5 w-[18px] h-[18px] rounded-full border flex items-center justify-center flex-shrink-0"
          style={{
            borderColor: done
              ? "hsl(152 60% 48%)"
              : "hsl(var(--muted-foreground) / 0.3)",
            backgroundColor: done
              ? "hsl(152 60% 48% / 0.1)"
              : "transparent",
          }}
        >
          {done && (
            <Check
              size={11}
              strokeWidth={2.5}
              style={{ color: "hsl(152 60% 48%)" }}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-[14px]"
            style={{
              textDecoration: done ? "line-through" : "none",
              opacity: done ? 0.5 : 1,
            }}
          >
            {milestone.name}
          </p>
          {milestone.target_date && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {milestone.target_date}
            </p>
          )}
          {milestone.steps.length > 0 && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {stepsDone}/{milestone.steps.length} steps
            </p>
          )}
        </div>
      </button>

      {/* Steps under milestone */}
      {milestone.steps.length > 0 && (
        <div className="ml-9 mt-1 space-y-1">
          {milestone.steps
            .sort((a, b) => a.sequence_order - b.sequence_order)
            .map((step) => (
              <div key={step.id} className="flex items-center gap-2">
                <div
                  className="w-[12px] h-[12px] rounded-sm border flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: step.completed_at
                      ? "hsl(152 60% 48%)"
                      : "hsl(var(--muted-foreground) / 0.2)",
                    backgroundColor: step.completed_at
                      ? "hsl(152 60% 48% / 0.1)"
                      : "transparent",
                  }}
                >
                  {step.completed_at && (
                    <Check
                      size={8}
                      strokeWidth={3}
                      style={{ color: "hsl(152 60% 48%)" }}
                    />
                  )}
                </div>
                <span
                  className="text-[12px]"
                  style={{
                    textDecoration: step.completed_at ? "line-through" : "none",
                    opacity: step.completed_at ? 0.5 : 1,
                  }}
                >
                  {step.name}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

/* ── Task Row ── */

function TaskRow({
  task,
  onToggle,
}: {
  task: DbTask;
  onToggle: (id: string) => void;
}) {
  const done = !!task.completed_at;

  return (
    <button
      onClick={() => onToggle(task.id)}
      className="w-full flex items-center gap-3 py-2 text-left active:opacity-50"
    >
      <div
        className="w-[16px] h-[16px] rounded-sm border flex items-center justify-center flex-shrink-0"
        style={{
          borderColor: done
            ? "hsl(152 60% 48%)"
            : "hsl(var(--muted-foreground) / 0.3)",
          backgroundColor: done ? "hsl(152 60% 48% / 0.1)" : "transparent",
        }}
      >
        {done && (
          <Check
            size={10}
            strokeWidth={2.5}
            style={{ color: "hsl(152 60% 48%)" }}
          />
        )}
      </div>
      <span
        className="text-[13px]"
        style={{
          textDecoration: done ? "line-through" : "none",
          opacity: done ? 0.5 : 1,
        }}
      >
        {task.name}
      </span>
    </button>
  );
}

/* ── Main Page ── */

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<GoalDetailData | null>(null);
  const [statMap, setStatMap] = useState<Map<string, DbStat>>(new Map());
  const [loading, setLoading] = useState(true);
  const [newTaskName, setNewTaskName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData?.user?.id;
    if (!uid || !id) return;
    setUserId(uid);

    const goal = await db.goals.get(id);
    if (!goal) {
      setLoading(false);
      return;
    }

    const allStats = await db.stats.where("user_id").equals(uid).toArray();
    const sMap = new Map(allStats.map((s) => [s.id, s]));
    setStatMap(sMap);

    const stat = goal.primary_stat_id
      ? sMap.get(goal.primary_stat_id) ?? null
      : null;

    const [rawMilestones, stakeEffects, habitLinks, tasks] = await Promise.all([
      db.goal_milestones.where("goal_id").equals(id).sortBy("sequence_order"),
      db.goal_stake_effects.where("goal_id").equals(id).toArray(),
      db.goal_habit_links.where("goal_id").equals(id).toArray(),
      db.tasks.where("goal_id").equals(id).toArray(),
    ]);

    // Load steps for each milestone
    const milestones = await Promise.all(
      rawMilestones.map(async (m) => {
        const steps = await db.goal_steps
          .where("milestone_id")
          .equals(m.id)
          .sortBy("sequence_order");
        return { ...m, steps };
      }),
    );

    // Resolve linked habits
    const habitIds = habitLinks.map((l: DbGoalHabitLink) => l.habit_id);
    const linkedHabits = (await db.habits.bulkGet(habitIds)).filter(
      Boolean,
    ) as DbHabit[];

    // Metric target
    let metricTarget: GoalDetailData["metricTarget"] = null;
    const metricTargets = await db.goal_metric_targets
      .where("goal_id")
      .equals(id)
      .toArray();
    if (metricTargets.length > 0) {
      const mt = metricTargets[0];
      const metric = await db.logbook_metrics.get(mt.logbook_metric_id);
      if (metric) {
        const entries = await db.logbook_entries
          .where("metric_id")
          .equals(mt.logbook_metric_id)
          .toArray();
        const latest =
          entries.length > 0
            ? entries.sort(
                (a, b) =>
                  new Date(b.logged_at).getTime() -
                  new Date(a.logged_at).getTime(),
              )[0]
            : null;
        metricTarget = { target: mt, metric, latestValue: latest?.value ?? null };
      }
    }

    setData({
      goal,
      stat,
      milestones,
      stakeEffects,
      linkedHabits,
      tasks,
      metricTarget,
    });
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleMilestone = async (milestoneId: string) => {
    if (!data) return;
    const now = new Date().toISOString();
    const m = data.milestones.find((m) => m.id === milestoneId);
    if (!m) return;

    const newCompleted = m.completed_at ? null : now;
    await db.goal_milestones.update(milestoneId, {
      completed_at: newCompleted,
      updated_at: now,
    });
    await queueWrite("goal_milestones", milestoneId, "upsert", {
      ...m,
      completed_at: newCompleted,
      updated_at: now,
    });

    setData((d) =>
      d
        ? {
            ...d,
            milestones: d.milestones.map((ms) =>
              ms.id === milestoneId
                ? { ...ms, completed_at: newCompleted }
                : ms,
            ),
          }
        : d,
    );
  };

  const toggleTask = async (taskId: string) => {
    if (!data || !userId) return;
    const now = new Date().toISOString();
    const t = data.tasks.find((t) => t.id === taskId);
    if (!t) return;

    const newCompleted = t.completed_at ? null : now;
    await db.tasks.update(taskId, {
      completed_at: newCompleted,
      updated_at: now,
    });
    await queueWrite("tasks", taskId, "upsert", {
      ...t,
      completed_at: newCompleted,
      updated_at: now,
    });

    // Award XP on completion (not on un-complete)
    if (newCompleted) {
      await awardTaskXp(userId, taskId);
    }

    setData((d) =>
      d
        ? {
            ...d,
            tasks: d.tasks.map((tk) =>
              tk.id === taskId
                ? { ...tk, completed_at: newCompleted }
                : tk,
            ),
          }
        : d,
    );
  };

  const addTask = async () => {
    if (!data || !userId || !newTaskName.trim()) return;
    const now = new Date().toISOString();
    const taskId = uuid();

    const task = {
      id: taskId,
      user_id: userId,
      name: newTaskName.trim(),
      notes: null,
      goal_id: data.goal.id,
      milestone_id: null,
      source: "planned" as const,
      goal_linked_at: null,
      completed_at: null,
      xp_awarded: null,
      created_at: now,
      updated_at: now,
    };

    await db.tasks.add(task as never);
    await queueWrite("tasks", taskId, "upsert", task);

    setData((d) => (d ? { ...d, tasks: [...d.tasks, task as DbTask] } : d));
    setNewTaskName("");
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center py-20 text-sm text-muted-foreground">
        Goal not found
      </div>
    );
  }

  const { goal, stat, milestones, stakeEffects, linkedHabits, tasks, metricTarget } =
    data;
  const pendingTasks = tasks.filter((t) => !t.completed_at);
  const completedTasks = tasks.filter((t) => t.completed_at);
  const successEffects = stakeEffects.filter((e) => e.trigger === "success");
  const failureEffects = stakeEffects.filter((e) => e.trigger === "failure");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <button
          onClick={() => router.back()}
          className="p-1 -ml-1 active:opacity-50 mb-3"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-baseline justify-between">
          <h1 className="text-[20px] font-medium">{goal.name}</h1>
          {stat && (
            <span className="text-[12px] text-muted-foreground">
              {stat.name}
            </span>
          )}
        </div>

        <p className="text-[13px] text-muted-foreground/70 mt-1">
          {goal.why}
        </p>

        {/* Metric progress */}
        {metricTarget && (
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-muted-foreground">
                {metricTarget.metric.name}
              </span>
              <span className="text-[12px] tabular-nums">
                {metricTarget.latestValue ?? metricTarget.target.start_value}{" "}
                <span className="text-muted-foreground/50">→</span>{" "}
                {metricTarget.target.target_value} {metricTarget.metric.unit}
              </span>
            </div>
            {(() => {
              const start = metricTarget.target.start_value;
              const target = metricTarget.target.target_value;
              const current = metricTarget.latestValue ?? start;
              const range = target - start;
              const progress =
                range !== 0
                  ? Math.max(0, Math.min(1, (current - start) / range))
                  : 0;
              return (
                <div className="mt-1.5 h-[3px] rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress * 100}%`,
                      backgroundColor: "hsl(var(--foreground) / 0.4)",
                    }}
                  />
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-6">
        {/* Stakes */}
        {stakeEffects.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
              Stakes
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {successEffects.map((e) => (
                <span
                  key={e.id}
                  className="text-[12px]"
                  style={{ color: "hsl(152 60% 48%)" }}
                >
                  {statMap.get(e.stat_id)?.name ?? "?"} +{e.effect_value}
                </span>
              ))}
              {failureEffects.map((e) => (
                <span
                  key={e.id}
                  className="text-[12px]"
                  style={{ color: "hsl(0 65% 55%)" }}
                >
                  {statMap.get(e.stat_id)?.name ?? "?"} {e.effect_value}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Grace: {goal.grace_period_value} {goal.grace_period_unit}
            </p>
          </div>
        )}

        {/* Milestones */}
        {milestones.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">
              Milestones ·{" "}
              {milestones.filter((m) => m.completed_at).length}/
              {milestones.length}
            </p>
            <div className="flex gap-0.5 mb-3">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className="flex-1 h-[3px] rounded-full"
                  style={{
                    backgroundColor: m.completed_at
                      ? "hsl(var(--foreground))"
                      : "hsl(var(--muted))",
                    opacity: m.completed_at ? 0.4 : 1,
                  }}
                />
              ))}
            </div>
            <div className="divide-y divide-muted">
              {milestones.map((m) => (
                <MilestoneRow
                  key={m.id}
                  milestone={m}
                  onToggle={toggleMilestone}
                />
              ))}
            </div>
          </div>
        )}

        {/* Linked Habits */}
        {linkedHabits.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
              Linked habits
            </p>
            <div className="space-y-1.5">
              {linkedHabits.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between py-1.5"
                >
                  <span className="text-[13px]">{h.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {h.time_block}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tasks */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">
            Tasks ·{" "}
            {completedTasks.length}/{tasks.length}
          </p>

          {pendingTasks.length > 0 && (
            <div>
              {pendingTasks.map((t) => (
                <TaskRow key={t.id} task={t} onToggle={toggleTask} />
              ))}
            </div>
          )}

          {completedTasks.length > 0 && (
            <div>
              {completedTasks.map((t) => (
                <TaskRow key={t.id} task={t} onToggle={toggleTask} />
              ))}
            </div>
          )}

          {/* Add task inline */}
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Add a task…"
              className="flex-1 bg-transparent border-b border-muted-foreground/15 pb-1.5 text-[13px] outline-none focus:border-foreground/30 transition-colors placeholder:text-muted-foreground/30"
            />
            {newTaskName.trim() && (
              <button
                onClick={addTask}
                className="p-1 text-muted-foreground active:text-foreground"
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
