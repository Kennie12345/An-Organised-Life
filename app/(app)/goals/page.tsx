"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  db,
  type DbGoal,
  type DbGoalMilestone,
  type DbGoalStakeEffect,
  type DbGoalHabitLink,
  type DbGoalMetricTarget,
  type DbLogbookMetric,
  type DbLogbookEntry,
  type DbStat,
  type DbHabit,
  type DbTask,
} from "@/db";
import { queueWrite } from "@/lib/sync";
import { awardTaskXp } from "@/utils/task-xp";
import { Check, Plus } from "lucide-react";

/* ── Types ── */

interface GoalCard {
  goal: DbGoal;
  stat: DbStat | null;
  milestones: DbGoalMilestone[];
  stakeEffects: DbGoalStakeEffect[];
  linkedHabits: DbHabit[];
  tasks: DbTask[];
  metricTarget: {
    target: DbGoalMetricTarget;
    metric: DbLogbookMetric;
    latestValue: number | null;
  } | null;
}

/* ── Milestone Step Visual ── */

function MilestoneSteps({ milestones }: { milestones: DbGoalMilestone[] }) {
  if (milestones.length === 0) return null;
  const sorted = [...milestones].sort(
    (a, b) => a.sequence_order - b.sequence_order,
  );
  const completed = sorted.filter((m) => m.completed_at).length;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          Milestones
        </p>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {completed}/{sorted.length}
        </span>
      </div>
      <div className="flex gap-1">
        {sorted.map((m) => (
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
      {/* Next incomplete milestone name */}
      {completed < sorted.length && (
        <p className="text-[11px] text-muted-foreground mt-1.5">
          Next: {sorted.find((m) => !m.completed_at)?.name}
        </p>
      )}
    </div>
  );
}

/* ── Metric Progress ── */

function MetricProgress({
  metricTarget,
}: {
  metricTarget: GoalCard["metricTarget"];
}) {
  if (!metricTarget) return null;

  const { target, metric, latestValue } = metricTarget;
  const current = latestValue ?? target.start_value;
  const range = target.target_value - target.start_value;
  const progress = range !== 0 ? (current - target.start_value) / range : 0;
  const pct = Math.max(0, Math.min(1, progress));

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          {metric.name}
        </p>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {current.toFixed(metric.unit === "reps" ? 0 : 1)} / {target.target_value.toFixed(metric.unit === "reps" ? 0 : 1)} {metric.unit}
        </span>
      </div>
      <div className="h-[3px] rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct * 100}%`,
            backgroundColor: "hsl(var(--foreground))",
            opacity: 0.4,
          }}
        />
      </div>
    </div>
  );
}

/* ── Stake Effects (compact) ── */

function StakeEffects({
  effects,
  stats,
}: {
  effects: DbGoalStakeEffect[];
  stats: Map<string, DbStat>;
}) {
  if (effects.length === 0) return null;

  const success = effects.filter((e) => e.trigger === "success");
  const failure = effects.filter((e) => e.trigger === "failure");

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1.5">
        Stakes
      </p>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {success.map((e) => (
          <span
            key={e.id}
            className="text-[11px]"
            style={{ color: "hsl(152 60% 48%)" }}
          >
            {stats.get(e.stat_id)?.name ?? "?"} +{e.effect_value}
          </span>
        ))}
        {failure.map((e) => (
          <span
            key={e.id}
            className="text-[11px]"
            style={{ color: "hsl(0 65% 55%)" }}
          >
            {stats.get(e.stat_id)?.name ?? "?"} {e.effect_value}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Goal Card ── */

function GoalCardView({
  card,
  statMap,
  onNavigate,
}: {
  card: GoalCard;
  statMap: Map<string, DbStat>;
  onNavigate: () => void;
}) {
  const pendingTasks = card.tasks.filter((t) => !t.completed_at);

  return (
    <div>
      <button
        className="w-full text-left active:opacity-50 transition-opacity"
        onClick={onNavigate}
      >
        {/* Goal name + stat */}
        <div className="flex items-baseline justify-between">
          <span className="text-[16px]">{card.goal.name}</span>
          {card.stat && (
            <span className="text-[12px] text-muted-foreground">
              {card.stat.name}
            </span>
          )}
        </div>

        {/* Why */}
        <p className="text-[12px] text-muted-foreground/70 mt-1 line-clamp-2">
          {card.goal.why}
        </p>
      </button>

      {/* Progress: milestones or metric */}
      <div className="mt-3 space-y-3">
        <MilestoneSteps milestones={card.milestones} />
        <MetricProgress metricTarget={card.metricTarget} />
      </div>

      {/* Stakes */}
      <div className="mt-3">
        <StakeEffects effects={card.stakeEffects} stats={statMap} />
      </div>

      {/* Linked habits + tasks (compact row) */}
      <div className="flex gap-3 mt-3 text-[11px] text-muted-foreground">
        {card.linkedHabits.length > 0 && (
          <span>
            {card.linkedHabits.map((h) => h.name).join(" · ")}
          </span>
        )}
      </div>
      {pendingTasks.length > 0 && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          {pendingTasks.length} task{pendingTasks.length !== 1 ? "s" : ""} pending
        </p>
      )}

      {/* Separator */}
      <div className="mt-4 border-b border-muted" />
    </div>
  );
}

/* ── Page ── */

/* ── Task Manager Section ── */

function TaskManager({
  cards,
  unlinkedTasks,
  userId,
  onRefresh,
}: {
  cards: GoalCard[];
  unlinkedTasks: DbTask[];
  userId: string;
  onRefresh: () => void;
}) {
  const [newTaskName, setNewTaskName] = useState("");
  const [goalLinkPrompt, setGoalLinkPrompt] = useState<string | null>(null); // task id

  const addTask = async () => {
    if (!newTaskName.trim()) return;
    const now = new Date().toISOString();
    const taskId = crypto.randomUUID();
    const task = {
      id: taskId,
      user_id: userId,
      name: newTaskName.trim(),
      notes: null,
      goal_id: null,
      milestone_id: null,
      source: "captured" as const,
      goal_linked_at: null,
      completed_at: null,
      xp_awarded: null,
      created_at: now,
      updated_at: now,
    };
    await db.tasks.add(task as never);
    await queueWrite("tasks", taskId, "upsert", task);
    setNewTaskName("");
    onRefresh();
  };

  const toggleTask = async (task: DbTask) => {
    const now = new Date().toISOString();
    if (task.completed_at) {
      // Un-complete
      await db.tasks.update(task.id, { completed_at: null, updated_at: now });
      await queueWrite("tasks", task.id, "upsert", {
        ...task,
        completed_at: null,
        updated_at: now,
      });
      onRefresh();
    } else {
      // Complete — award XP and show goal link prompt if unlinked
      await db.tasks.update(task.id, { completed_at: now, updated_at: now });
      await queueWrite("tasks", task.id, "upsert", {
        ...task,
        completed_at: now,
        updated_at: now,
      });
      await awardTaskXp(userId, task.id);
      if (!task.goal_id && cards.length > 0) {
        setGoalLinkPrompt(task.id);
      }
      onRefresh();
    }
  };

  const linkTaskToGoal = async (taskId: string, goalId: string) => {
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
    setGoalLinkPrompt(null);
    onRefresh();
  };

  const allPending = unlinkedTasks.filter((t) => !t.completed_at);
  const allCompleted = unlinkedTasks.filter((t) => t.completed_at);

  return (
    <div className="mt-10">
      <p className="text-[13px] uppercase tracking-[0.15em] text-muted-foreground mb-4">
        Tasks
      </p>

      {/* Unlinked pending tasks */}
      {allPending.length > 0 && (
        <div className="mb-3 space-y-0.5">
          {allPending.map((t) => (
            <button
              key={t.id}
              onClick={() => toggleTask(t)}
              className="w-full flex items-center gap-3 py-2 text-left active:opacity-50"
            >
              <div
                className="w-[16px] h-[16px] rounded-sm border flex items-center justify-center flex-shrink-0"
                style={{
                  borderColor: "hsl(var(--muted-foreground) / 0.3)",
                }}
              />
              <span className="text-[13px]">{t.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Unlinked completed tasks */}
      {allCompleted.length > 0 && (
        <div className="mb-3 space-y-0.5">
          {allCompleted.slice(0, 5).map((t) => (
            <button
              key={t.id}
              onClick={() => toggleTask(t)}
              className="w-full flex items-center gap-3 py-2 text-left active:opacity-50"
            >
              <div
                className="w-[16px] h-[16px] rounded-sm border flex items-center justify-center flex-shrink-0"
                style={{
                  borderColor: "hsl(152 60% 48%)",
                  backgroundColor: "hsl(152 60% 48% / 0.1)",
                }}
              >
                <Check
                  size={10}
                  strokeWidth={2.5}
                  style={{ color: "hsl(152 60% 48%)" }}
                />
              </div>
              <span className="text-[13px] text-muted-foreground line-through">
                {t.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Add task */}
      <div className="flex items-center gap-2">
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

      {/* Goal link prompt (bottom sheet style) */}
      {goalLinkPrompt && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30">
          <div
            className="w-full max-w-md rounded-t-2xl px-6 pt-5 pb-8 space-y-3"
            style={{ backgroundColor: "hsl(var(--background))" }}
          >
            <p className="text-[14px]">Does this contribute to a goal?</p>
            {cards.map((c) => (
              <button
                key={c.goal.id}
                onClick={() => linkTaskToGoal(goalLinkPrompt, c.goal.id)}
                className="w-full text-left px-4 py-3 rounded-lg border transition-colors active:opacity-50"
                style={{ borderColor: "hsl(var(--muted))" }}
              >
                <span className="text-[13px]">{c.goal.name}</span>
              </button>
            ))}
            <button
              onClick={() => setGoalLinkPrompt(null)}
              className="w-full text-center py-3 text-[13px] text-muted-foreground active:opacity-50"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Page ── */

export default function GoalsPage() {
  const [cards, setCards] = useState<GoalCard[]>([]);
  const [unlinkedTasks, setUnlinkedTasks] = useState<DbTask[]>([]);
  const [statMap, setStatMap] = useState<Map<string, DbStat>>(new Map());
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  const loadData = useCallback(async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id;
      if (!uid) return;
      setUserId(uid);

      // Load all stats for lookup
      const allStats = await db.stats.where("user_id").equals(uid).toArray();
      const sMap = new Map(allStats.map((s) => [s.id, s]));
      setStatMap(sMap);

      // Load active goals
      const goals = await db.goals
        .where("user_id")
        .equals(uid)
        .filter((g: DbGoal) => g.status === "active")
        .toArray();

      // Load related data for each goal
      const goalCards: GoalCard[] = await Promise.all(
        goals.map(async (goal) => {
          const [milestones, stakeEffects, habitLinks, tasks, metricTargets] =
            await Promise.all([
              db.goal_milestones
                .where("goal_id")
                .equals(goal.id)
                .sortBy("sequence_order"),
              db.goal_stake_effects
                .where("goal_id")
                .equals(goal.id)
                .toArray(),
              db.goal_habit_links
                .where("goal_id")
                .equals(goal.id)
                .toArray(),
              db.tasks
                .where("goal_id")
                .equals(goal.id)
                .toArray(),
              db.goal_metric_targets
                .where("goal_id")
                .equals(goal.id)
                .toArray(),
            ]);

          // Resolve linked habits
          const habitIds = habitLinks.map((l: DbGoalHabitLink) => l.habit_id);
          const habits = (await db.habits.bulkGet(habitIds)).filter(
            Boolean,
          ) as DbHabit[];

          const stat = goal.primary_stat_id
            ? sMap.get(goal.primary_stat_id) ?? null
            : null;

          // Resolve metric target (first one, if any)
          let metricTarget: GoalCard["metricTarget"] = null;
          if (metricTargets.length > 0) {
            const mt = metricTargets[0];
            const metric = await db.logbook_metrics.get(mt.logbook_metric_id);
            if (metric) {
              // Get latest logbook entry for this metric
              const entries = await db.logbook_entries
                .where("metric_id")
                .equals(mt.logbook_metric_id)
                .toArray();
              const latest = entries.length > 0
                ? entries.sort(
                    (a, b) =>
                      new Date(b.logged_at).getTime() -
                      new Date(a.logged_at).getTime(),
                  )[0]
                : null;

              metricTarget = {
                target: mt,
                metric,
                latestValue: latest?.value ?? null,
              };
            }
          }

          return {
            goal,
            stat,
            milestones,
            stakeEffects,
            linkedHabits: habits,
            tasks,
            metricTarget,
          };
        }),
      );

      // Load unlinked tasks (no goal_id)
      const allTasks = await db.tasks.where("user_id").equals(uid).toArray();
      const unlinked = allTasks.filter((t) => !t.goal_id);
      setUnlinkedTasks(unlinked);

      setCards(goalCards);
      setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="px-6 pt-6 pb-8 overflow-y-auto">
      <div className="flex items-baseline justify-between mb-6">
        <p className="text-[13px] uppercase tracking-[0.15em] text-muted-foreground">
          Active Goals
        </p>
        <span className="text-[12px] tabular-nums text-muted-foreground">
          {cards.length}/3
        </span>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[14px] text-muted-foreground mb-1">
            No active goals
          </p>
          <p className="text-[12px] text-muted-foreground/60">
            Goals start in the Scratch Pad
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {cards.map((card) => (
            <GoalCardView
              key={card.goal.id}
              card={card}
              statMap={statMap}
              onNavigate={() => router.push(`/goals/${card.goal.id}`)}
            />
          ))}
        </div>
      )}

      {/* Add Goal button */}
      {cards.length < 3 && (
        <button
          className="mt-8 w-full flex items-center justify-center gap-2 py-3 text-[13px] text-muted-foreground active:opacity-50 transition-opacity border border-dashed border-muted-foreground/20 rounded-lg"
          onClick={() => router.push("/scratch-pad")}
        >
          <Plus size={16} strokeWidth={1.5} />
          Add Goal via Scratch Pad
        </button>
      )}

      {/* Task Manager */}
      {userId && (
        <TaskManager
          cards={cards}
          unlinkedTasks={unlinkedTasks}
          userId={userId}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}
