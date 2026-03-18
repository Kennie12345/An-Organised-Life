"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  db,
  type DbHabit,
  type DbHabitLog,
  type DbHabitStreak,
  type DbXpEvent,
  type DbLootDrop,
  type DbLootDropCatalog,
} from "@/db";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

/* ── Types ── */

interface DaySummary {
  date: string; // YYYY-MM-DD
  total: number;
  done: number;
  pct: number;
}

interface DayDetail {
  date: string;
  logs: (DbHabitLog & { habitName: string })[];
}

/* ── Calendar Grid ── */

function CalendarGrid({
  days,
  month,
  onSelectDay,
  selectedDate,
}: {
  days: DaySummary[];
  month: Date;
  onSelectDay: (date: string) => void;
  selectedDate: string | null;
}) {
  const year = month.getFullYear();
  const mo = month.getMonth();
  const firstDay = new Date(year, mo, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, mo + 1, 0).getDate();

  const dayMap = useMemo(
    () => new Map(days.map((d) => [d.date, d])),
    [days],
  );

  const cells: (DaySummary | null)[] = [];
  // Pad start
  for (let i = 0; i < firstDay; i++) cells.push(null);
  // Fill days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push(dayMap.get(dateStr) ?? { date: dateStr, total: 0, done: 0, pct: 0 });
  }

  const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div
            key={i}
            className="text-[10px] text-muted-foreground/50 text-center"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell)
            return <div key={i} className="aspect-square" />;

          const isToday =
            cell.date === new Date().toISOString().slice(0, 10);
          const isSelected = cell.date === selectedDate;

          return (
            <button
              key={i}
              onClick={() => onSelectDay(cell.date)}
              className="aspect-square rounded-md flex items-center justify-center text-[11px] tabular-nums transition-colors"
              style={{
                backgroundColor:
                  cell.pct > 0
                    ? `hsl(152 60% 48% / ${0.1 + cell.pct * 0.4})`
                    : isSelected
                      ? "hsl(var(--foreground) / 0.05)"
                      : "transparent",
                border: isSelected
                  ? "1px solid hsl(var(--foreground) / 0.2)"
                  : isToday
                    ? "1px solid hsl(var(--foreground) / 0.1)"
                    : "1px solid transparent",
              }}
            >
              {new Date(cell.date).getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Day Detail Panel ── */

function DayDetailPanel({
  detail,
  onClose,
}: {
  detail: DayDetail;
  onClose: () => void;
}) {
  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-muted-foreground">
          {new Date(detail.date + "T12:00:00").toLocaleDateString("en-AU", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
        <button onClick={onClose} className="p-1 text-muted-foreground">
          <X size={14} />
        </button>
      </div>

      {detail.logs.length === 0 ? (
        <p className="text-[12px] text-muted-foreground/60">
          No completions this day
        </p>
      ) : (
        <div className="space-y-1">
          {detail.logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between py-1"
            >
              <span className="text-[13px]">{log.habitName}</span>
              <span className="text-[11px] tabular-nums text-muted-foreground">
                +{log.xp_final} xp
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Achievement Log ── */

function AchievementLog({
  xpEvents,
  lootDrops,
  catalogMap,
}: {
  xpEvents: DbXpEvent[];
  lootDrops: DbLootDrop[];
  catalogMap: Map<string, DbLootDropCatalog>;
}) {
  // Level ups from xp_events
  const levelUps = xpEvents.filter(
    (e) => e.level_after > e.level_before,
  );
  // Combine with loot drops, sort by date desc
  type Entry = { type: "level_up"; date: string; level: number } | { type: "loot"; date: string; name: string; rarity: string };
  const entries: Entry[] = [
    ...levelUps.map((e) => ({
      type: "level_up" as const,
      date: e.created_at,
      level: e.level_after,
    })),
    ...lootDrops.map((d) => {
      const cat = catalogMap.get(d.catalog_id);
      return {
        type: "loot" as const,
        date: d.awarded_at,
        name: cat?.name ?? "Loot",
        rarity: cat?.rarity ?? "common",
      };
    }),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (entries.length === 0) return null;

  return (
    <div className="mt-6">
      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
        Achievements
      </p>
      <div className="space-y-1.5">
        {entries.slice(0, 20).map((e, i) => (
          <div key={i} className="flex items-center justify-between py-1">
            <span className="text-[12px]">
              {e.type === "level_up"
                ? `Level ${e.level}`
                : `${e.name}`}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {new Date(e.date).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Streak History ── */

function StreakHistory({
  habits,
  streaks,
}: {
  habits: DbHabit[];
  streaks: DbHabitStreak[];
}) {
  const streakMap = useMemo(
    () => new Map(streaks.map((s) => [s.habit_id, s])),
    [streaks],
  );

  const active = habits.filter((h) => h.is_active);
  if (active.length === 0) return null;

  return (
    <div className="mt-6">
      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
        Streaks
      </p>
      <div className="space-y-1.5">
        {active.map((h) => {
          const s = streakMap.get(h.id);
          return (
            <div
              key={h.id}
              className="flex items-center justify-between py-1"
            >
              <span className="text-[12px]">{h.name}</span>
              <div className="flex gap-3 text-[11px] tabular-nums">
                <span>
                  {s?.current_streak ?? 0}
                  <span className="text-muted-foreground/50 ml-0.5">
                    current
                  </span>
                </span>
                <span>
                  {s?.best_streak ?? 0}
                  <span className="text-muted-foreground/50 ml-0.5">
                    best
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Page ── */

export default function HistoryPage() {
  const [habits, setHabits] = useState<DbHabit[]>([]);
  const [habitLogs, setHabitLogs] = useState<DbHabitLog[]>([]);
  const [streaks, setStreaks] = useState<DbHabitStreak[]>([]);
  const [xpEvents, setXpEvents] = useState<DbXpEvent[]>([]);
  const [lootDrops, setLootDrops] = useState<DbLootDrop[]>([]);
  const [catalogMap, setCatalogMap] = useState<Map<string, DbLootDropCatalog>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayDetail, setDayDetail] = useState<DayDetail | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id;
      if (!uid) return;

      const [h, logs, s, xp, drops, catalog] = await Promise.all([
        db.habits.where("user_id").equals(uid).toArray(),
        db.habit_logs.where("user_id").equals(uid).toArray(),
        db.habit_streaks.where("user_id").equals(uid).toArray(),
        db.xp_events.where("user_id").equals(uid).toArray(),
        db.loot_drops.where("user_id").equals(uid).toArray(),
        db.loot_drop_catalog.toArray(),
      ]);

      setHabits(h);
      setHabitLogs(logs);
      setStreaks(s);
      setXpEvents(xp);
      setLootDrops(drops);
      setCatalogMap(new Map(catalog.map((c) => [c.id, c])));
      setLoading(false);
    }
    load();
  }, []);

  // Build day summaries for current month
  const daySummaries = useMemo(() => {
    const habitMap = new Map(habits.map((h) => [h.id, h]));
    const activeHabits = habits.filter((h) => h.is_active);
    const totalPerDay = activeHabits.length;

    // Group logs by date
    const logsByDate = new Map<string, DbHabitLog[]>();
    for (const log of habitLogs) {
      const date = log.completed_at.slice(0, 10);
      const arr = logsByDate.get(date) ?? [];
      arr.push(log);
      logsByDate.set(date, arr);
    }

    const summaries: DaySummary[] = [];
    const year = currentMonth.getFullYear();
    const mo = currentMonth.getMonth();
    const daysInMonth = new Date(year, mo + 1, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const logs = logsByDate.get(dateStr) ?? [];
      const uniqueHabits = new Set(logs.map((l) => l.habit_id));
      const done = uniqueHabits.size;
      summaries.push({
        date: dateStr,
        total: totalPerDay,
        done,
        pct: totalPerDay > 0 ? done / totalPerDay : 0,
      });
    }

    return summaries;
  }, [habits, habitLogs, currentMonth]);

  // Load day detail
  const selectDay = useCallback(
    (date: string) => {
      setSelectedDate(date);
      const habitMap = new Map(habits.map((h) => [h.id, h]));
      const logs = habitLogs
        .filter((l) => l.completed_at.slice(0, 10) === date)
        .map((l) => ({
          ...l,
          habitName: habitMap.get(l.habit_id)?.name ?? "Unknown",
        }))
        .sort(
          (a, b) =>
            new Date(a.completed_at).getTime() -
            new Date(b.completed_at).getTime(),
        );
      setDayDetail({ date, logs });
    },
    [habits, habitLogs],
  );

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
    setSelectedDate(null);
    setDayDetail(null);
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
    setSelectedDate(null);
    setDayDetail(null);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const monthLabel = currentMonth.toLocaleDateString("en-AU", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="px-6 pt-6 pb-8 overflow-y-auto">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 active:opacity-50">
          <ChevronLeft size={18} />
        </button>
        <p className="text-[13px] uppercase tracking-[0.15em] text-muted-foreground">
          {monthLabel}
        </p>
        <button onClick={nextMonth} className="p-1 active:opacity-50">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Calendar */}
      <CalendarGrid
        days={daySummaries}
        month={currentMonth}
        onSelectDay={selectDay}
        selectedDate={selectedDate}
      />

      {/* Day detail */}
      {dayDetail && (
        <DayDetailPanel
          detail={dayDetail}
          onClose={() => {
            setSelectedDate(null);
            setDayDetail(null);
          }}
        />
      )}

      {/* Streak History */}
      <StreakHistory habits={habits} streaks={streaks} />

      {/* Achievement Log */}
      <AchievementLog
        xpEvents={xpEvents}
        lootDrops={lootDrops}
        catalogMap={catalogMap}
      />
    </div>
  );
}
