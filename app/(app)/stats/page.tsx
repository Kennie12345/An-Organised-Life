"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  db,
  type DbUser,
  type DbStat,
  type DbDailyPlan,
  type DbHabitStatWeight,
  type DbHabit,
  type DbHabitLog,
} from "@/db";
import { xpRequiredForLevel } from "@/utils/leveling";
import { PetSprite } from "@/components/pet-sprite";

/* ── Types ── */

interface StatRow {
  id: string;
  name: string;
  value: number;
  delta: number;
}

interface ContributingHabit {
  name: string;
  weight: number;
  timeBlock: string;
}

interface StatDetail {
  habits: ContributingHabit[];
  recentLogs: { habitName: string; date: string }[];
  dailyCounts: number[]; // last 30 days — completions per day for habits feeding this stat
}

/* ── Helpers ── */

function petConditionWord(stats: StatRow[]): string {
  if (stats.length === 0) return "Waiting";
  const avg = stats.reduce((s, st) => s + st.value, 0) / stats.length;
  if (avg >= 75) return "Thriving";
  if (avg >= 55) return "Content";
  if (avg >= 35) return "Tired";
  return "Needs care";
}

/** Date string N days ago */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/* ── Mood Sparkline ── */

function MoodSparkline({ moods }: { moods: number[] }) {
  if (moods.length < 2) return null;

  const w = 240;
  const h = 48;
  const pad = 8;
  const step = (w - pad * 2) / (moods.length - 1);

  const points = moods.map((m, i) => ({
    x: pad + i * step,
    y: h - pad - ((m - 1) / 4) * (h - pad * 2),
  }));

  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    d += ` C${p1.x + (p2.x - p0.x) / 6},${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6},${p2.y - (p3.y - p1.y) / 6} ${p2.x},${p2.y}`;
  }

  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 48 }}>
      <path
        d={d}
        fill="none"
        stroke="hsl(var(--foreground))"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.15}
      />
      <circle cx={last.x} cy={last.y} r="3.5" fill="hsl(var(--foreground))" opacity={0.35} />
    </svg>
  );
}

/* ── 30-day mini bar chart ── */

function ThirtyDayChart({ counts }: { counts: number[] }) {
  const max = Math.max(...counts, 1);
  const w = 240;
  const h = 40;
  const barW = (w - (counts.length - 1)) / counts.length; // 1px gap
  const pad = 2;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 40 }}>
      {counts.map((c, i) => {
        const barH = c === 0 ? 0 : Math.max(pad, (c / max) * (h - pad));
        return (
          <rect
            key={i}
            x={i * (barW + 1)}
            y={h - barH}
            width={barW}
            height={barH}
            rx={1}
            fill="hsl(var(--foreground))"
            opacity={c === 0 ? 0.05 : 0.2}
          />
        );
      })}
    </svg>
  );
}

/* ── Stat Detail Panel ── */

function StatDetailPanel({ detail }: { detail: StatDetail }) {
  return (
    <div className="mt-3 mb-1 space-y-4">
      {/* 30-day activity */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
          30-day activity
        </p>
        <ThirtyDayChart counts={detail.dailyCounts} />
        <div className="flex justify-between text-[10px] text-muted-foreground/50 mt-1">
          <span>30d ago</span>
          <span>Today</span>
        </div>
      </div>

      {/* Contributing habits */}
      {detail.habits.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
            Contributing habits
          </p>
          <div className="space-y-1.5">
            {detail.habits.map((h) => (
              <div key={h.name} className="flex items-baseline justify-between">
                <span className="text-[12px]">{h.name}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {h.weight.toFixed(2)} · {h.timeBlock}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent logs */}
      {detail.recentLogs.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
            Recent logs
          </p>
          <div className="space-y-1">
            {detail.recentLogs.map((log, i) => (
              <div key={i} className="flex items-baseline justify-between">
                <span className="text-[12px]">{log.habitName}</span>
                <span className="text-[10px] text-muted-foreground">{log.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Page ── */

export default function StatsPage() {
  const [user, setUser] = useState<DbUser | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState<StatRow[]>([]);
  const [moods, setMoods] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStat, setExpandedStat] = useState<string | null>(null);
  const [statDetail, setStatDetail] = useState<StatDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id;
      if (!uid) return;

      setUserId(uid);
      const userRow = await db.users.get(uid);

      const allStats = await db.stats
        .where("user_id")
        .equals(uid)
        .sortBy("sequence_order");
      const activeStats = allStats.filter((s) => s.is_active);

      const plans = await db.daily_plans
        .where("user_id")
        .equals(uid)
        .reverse()
        .sortBy("plan_date");
      const recentMoods = plans
        .slice(0, 14)
        .map((p: DbDailyPlan) => p.mood_end ?? p.mood_start)
        .filter((m): m is number => m != null)
        .reverse();

      setUser(userRow ?? null);
      setStats(
        activeStats.map((s: DbStat) => ({
          id: s.id,
          name: s.name,
          value: s.current_value,
          delta: 0,
        })),
      );
      setMoods(recentMoods);
      setLoading(false);
    }
    load();
  }, []);

  const loadStatDetail = useCallback(
    async (statId: string) => {
      if (!userId) return;
      setDetailLoading(true);

      // Get habit_stat_weights for this stat
      const weights = await db.habit_stat_weights
        .where("stat_id")
        .equals(statId)
        .toArray();

      const habitIds = weights.map((w: DbHabitStatWeight) => w.habit_id);

      // Get habit names
      const habits = await db.habits.bulkGet(habitIds);
      const habitMap = new Map(
        habits.filter(Boolean).map((h) => [h!.id, h!]),
      );

      // Contributing habits
      const contributingHabits: ContributingHabit[] = weights
        .map((w: DbHabitStatWeight) => {
          const h = habitMap.get(w.habit_id);
          if (!h) return null;
          return {
            name: h.name,
            weight: w.current_weight,
            timeBlock: h.time_block,
          };
        })
        .filter(Boolean) as ContributingHabit[];

      // Recent logs — last 10 for habits feeding this stat
      const thirtyDaysAgo = daysAgo(30);
      const allLogs: DbHabitLog[] = [];
      for (const hId of habitIds) {
        const logs = await db.habit_logs
          .where("habit_id")
          .equals(hId)
          .filter((l: DbHabitLog) => l.completed_at >= thirtyDaysAgo)
          .toArray();
        allLogs.push(...logs);
      }
      allLogs.sort((a, b) => b.completed_at.localeCompare(a.completed_at));

      const recentLogs = allLogs.slice(0, 10).map((l: DbHabitLog) => ({
        habitName: habitMap.get(l.habit_id)?.name ?? "Unknown",
        date: l.completed_at.split("T")[0],
      }));

      // 30-day daily completion counts
      const dailyCounts: number[] = [];
      for (let i = 29; i >= 0; i--) {
        const day = daysAgo(i);
        const count = allLogs.filter(
          (l: DbHabitLog) => l.completed_at.split("T")[0] === day,
        ).length;
        dailyCounts.push(count);
      }

      setStatDetail({ habits: contributingHabits, recentLogs, dailyCounts });
      setDetailLoading(false);
    },
    [userId],
  );

  const handleStatTap = useCallback(
    (statId: string) => {
      if (expandedStat === statId) {
        setExpandedStat(null);
        setStatDetail(null);
      } else {
        setExpandedStat(statId);
        loadStatDetail(statId);
      }
    },
    [expandedStat, loadStatDetail],
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const level = user?.level ?? 1;
  const currentXp = user?.current_xp ?? 0;
  const xpToNext = xpRequiredForLevel(level);
  const xpPct = (currentXp / xpToNext) * 100;
  const petName = user?.pet_name ?? "Your Pet";
  const conditionWord = petConditionWord(stats);

  return (
    <div className="px-6 pt-6 pb-8 overflow-y-auto">
      {/* ── Pet identity ── */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-3" style={{ height: "40dvh" }}>
          <PetSprite className="h-full w-auto" />
        </div>
        <p className="text-[28px] font-light tracking-tight">{petName}</p>
        <p className="text-[14px] text-muted-foreground mt-0.5">
          Lv {level} · {conditionWord}
        </p>
        <div className="mt-3 mx-auto max-w-[220px] flex items-center gap-2">
          <div className="flex-1 h-[3px] rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-foreground/15"
              style={{ width: `${xpPct}%` }}
            />
          </div>
          <p className="text-[11px] tabular-nums text-muted-foreground/60">
            {currentXp}/{xpToNext}
          </p>
        </div>
      </div>

      {/* ── Condition ── */}
      {stats.length > 0 && (
        <>
          <p className="text-[13px] uppercase tracking-[0.15em] text-muted-foreground mb-4">
            Condition
          </p>

          <div className="flex flex-col gap-4">
            {stats.map((stat) => (
              <div key={stat.id}>
                <button
                  className="w-full text-left active:opacity-50 transition-opacity"
                  onClick={() => handleStatTap(stat.id)}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-[16px]">{stat.name}</span>
                    <span className="text-[15px] tabular-nums text-muted-foreground">
                      {Math.round(stat.value)}
                      {stat.delta !== 0 && (
                        <span
                          className="ml-1.5 text-[12px]"
                          style={{
                            color:
                              stat.delta > 0
                                ? "hsl(152 60% 48%)"
                                : "hsl(0 65% 55%)",
                          }}
                        >
                          {stat.delta > 0 ? "+" : ""}
                          {stat.delta}
                        </span>
                      )}
                    </span>
                  </div>
                </button>

                {expandedStat === stat.id && (
                  <div className="pl-1 border-l border-muted ml-1">
                    {detailLoading ? (
                      <p className="text-[11px] text-muted-foreground py-3">
                        Loading…
                      </p>
                    ) : statDetail ? (
                      <StatDetailPanel detail={statDetail} />
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Mood ── */}
      {moods.length >= 2 && (
        <div className="mt-8">
          <p className="text-[13px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
            Mood
          </p>
          <MoodSparkline moods={moods} />
        </div>
      )}
    </div>
  );
}
