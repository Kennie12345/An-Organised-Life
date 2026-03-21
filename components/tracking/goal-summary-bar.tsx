"use client";

import { useEffect, useState } from "react";
import { db, type DbGoal, type DbGoalStakeEffect, type DbStat } from "@/db";

interface GoalSummary {
  goal: DbGoal;
  stakes: Array<{ statName: string; statColor: string; effect_value: number; trigger: string }>;
}

export function GoalSummaryBar({ userId }: { userId: string }) {
  const [goals, setGoals] = useState<GoalSummary[]>([]);

  useEffect(() => {
    async function load() {
      const activeGoals = await db.goals
        .where("user_id")
        .equals(userId)
        .filter((g) => g.status === "active")
        .toArray();

      if (activeGoals.length === 0) {
        setGoals([]);
        return;
      }

      const stats = await db.stats.where("user_id").equals(userId).toArray();
      const statMap = new Map(stats.map((s) => [s.id, s]));

      const allStakes = await db.goal_stake_effects.toArray();

      const summaries: GoalSummary[] = activeGoals.map((goal) => {
        const goalStakes = allStakes
          .filter((s) => s.goal_id === goal.id)
          .map((s) => {
            const stat = statMap.get(s.stat_id);
            return {
              statName: stat?.name ?? "?",
              statColor: stat?.color ?? "#888",
              effect_value: s.effect_value,
              trigger: s.trigger,
            };
          });

        return { goal, stakes: goalStakes };
      });

      setGoals(summaries);
    }
    load();
  }, [userId]);

  if (goals.length === 0) return null;

  return (
    <div className="px-4 py-3 space-y-2">
      {goals.map(({ goal, stakes }) => {
        const successStakes = stakes.filter((s) => s.trigger === "success");
        const failureStakes = stakes.filter((s) => s.trigger === "failure");

        return (
          <div
            key={goal.id}
            className="px-4 py-3 rounded-xl"
            style={{
              backgroundColor: "hsl(var(--muted) / 0.4)",
              border: "1px solid hsl(var(--border) / 0.5)",
            }}
          >
            <p className="text-[14px] font-medium truncate">{goal.name}</p>
            <div className="flex gap-3 mt-1.5">
              {successStakes.map((s, i) => (
                <span
                  key={`s-${i}`}
                  className="text-[11px] font-medium"
                  style={{ color: "rgb(34 197 94)" }}
                >
                  {s.statName} +{s.effect_value}
                </span>
              ))}
              {failureStakes.map((s, i) => (
                <span
                  key={`f-${i}`}
                  className="text-[11px] font-medium"
                  style={{ color: "rgb(239 68 68)" }}
                >
                  {s.statName} {s.effect_value}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
