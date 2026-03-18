"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Plus } from "lucide-react";

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
  expanded,
  onToggle,
}: {
  card: GoalCard;
  statMap: Map<string, DbStat>;
  expanded: boolean;
  onToggle: () => void;
}) {
  const pendingTasks = card.tasks.filter((t) => !t.completed_at);

  return (
    <div>
      <button
        className="w-full text-left active:opacity-50 transition-opacity"
        onClick={onToggle}
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

      {/* Expanded detail: full task list, grace period */}
      {expanded && (
        <div className="mt-3 mb-1 space-y-3 pl-2 border-l border-muted ml-1">
          {/* Grace period */}
          {card.goal.grace_period_value > 0 && (
            <p className="text-[10px] text-muted-foreground">
              Grace: {card.goal.grace_period_value} {card.goal.grace_period_unit}
            </p>
          )}

          {/* Linked habits with detail */}
          {card.linkedHabits.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1.5">
                Linked habits
              </p>
              <div className="space-y-1">
                {card.linkedHabits.map((h) => (
                  <p key={h.id} className="text-[12px]">
                    {h.name}
                    <span className="text-muted-foreground ml-1.5">
                      {h.time_block}
                    </span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Full task list */}
          {card.tasks.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1.5">
                Tasks · {card.tasks.filter((t) => t.completed_at).length}/{card.tasks.length}
              </p>
              <div className="space-y-1">
                {pendingTasks.map((t) => (
                  <p key={t.id} className="text-[12px]">
                    {t.name}
                  </p>
                ))}
                {card.tasks
                  .filter((t) => t.completed_at)
                  .slice(0, 3)
                  .map((t) => (
                    <p
                      key={t.id}
                      className="text-[12px] text-muted-foreground line-through"
                    >
                      {t.name}
                    </p>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Separator */}
      <div className="mt-4 border-b border-muted" />
    </div>
  );
}

/* ── Page ── */

export default function GoalsPage() {
  const [cards, setCards] = useState<GoalCard[]>([]);
  const [statMap, setStatMap] = useState<Map<string, DbStat>>(new Map());
  const [loading, setLoading] = useState(true);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id;
      if (!uid) return;

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

      setCards(goalCards);
      setLoading(false);
    }
    load();
  }, []);

  const handleToggle = useCallback((goalId: string) => {
    setExpandedGoal((prev) => (prev === goalId ? null : goalId));
  }, []);

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
              expanded={expandedGoal === card.goal.id}
              onToggle={() => handleToggle(card.goal.id)}
            />
          ))}
        </div>
      )}

      {/* Add Goal button → Scratch Pad */}
      {cards.length < 3 && (
        <button
          className="mt-8 w-full flex items-center justify-center gap-2 py-3 text-[13px] text-muted-foreground active:opacity-50 transition-opacity border border-dashed border-muted-foreground/20 rounded-lg"
          onClick={() => {
            // Scratch Pad is Phase 6 — placeholder navigation
          }}
        >
          <Plus size={16} strokeWidth={1.5} />
          Add Goal via Scratch Pad
        </button>
      )}
    </div>
  );
}
