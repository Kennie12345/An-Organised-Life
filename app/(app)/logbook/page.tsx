"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  db,
  type DbLogbookMetric,
  type DbLogbookEntry,
  type DbLootDropCatalog,
} from "@/db";
import { queueWrite } from "@/lib/sync";
import { uuid } from "@/utils/uuid";
import { ChevronLeft, Plus, TrendingUp, TrendingDown, Minus, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";

/* ── Types ── */

interface MetricWithEntries {
  metric: DbLogbookMetric;
  entries: DbLogbookEntry[];
  latestValue: number | null;
  trend: "up" | "down" | "flat" | null;
  bestValue: number | null;
}

/* ── Mini Chart (last 30 entries) ── */

function MiniChart({ entries }: { entries: DbLogbookEntry[] }) {
  if (entries.length < 2) return null;

  const recent = entries.slice(0, 30);
  const values = recent.map((e) => e.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const h = 40;
  const w = 200;

  const points = recent
    .map((e, i) => {
      const x = w - (i / (recent.length - 1)) * w;
      const y = h - ((e.value - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-[40px]"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke="hsl(var(--foreground))"
        strokeWidth="1.5"
        strokeOpacity="0.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Expanded Metric Detail ── */

function MetricDetail({
  data,
  userId,
  onRefresh,
}: {
  data: MetricWithEntries;
  userId: string;
  onRefresh: () => void;
}) {
  const [newValue, setNewValue] = useState("");
  const [newNote, setNewNote] = useState("");
  const [personalBestDrop, setPersonalBestDrop] = useState<DbLootDropCatalog | null>(null);

  const logEntry = async () => {
    const val = parseFloat(newValue);
    if (isNaN(val)) return;

    const now = new Date().toISOString();
    const entryId = uuid();

    const entry = {
      id: entryId,
      metric_id: data.metric.id,
      user_id: userId,
      value: val,
      logged_at: now,
      notes: newNote.trim() || null,
      metadata: null,
    };

    await db.logbook_entries.add(entry as never);
    await queueWrite("logbook_entries", entryId, "upsert", entry);

    // Boost linked stat (+1, capped at 100)
    if (data.metric.stat_id) {
      const stat = await db.stats.get(data.metric.stat_id);
      if (stat) {
        const newValue = Math.min(100, stat.current_value + 1);
        await db.stats.update(stat.id, {
          current_value: newValue,
          updated_at: now,
        });
        await queueWrite("stats", stat.id, "upsert", {
          ...stat,
          current_value: newValue,
          updated_at: now,
        });
      }
    }

    // Personal best detection
    const isNewBest =
      data.bestValue === null || val > data.bestValue;

    if (isNewBest) {
      // Trigger loot drop
      const user = (await db.users.toArray())[0];
      const userLevel = user?.level ?? 1;

      const catalog = await db.loot_drop_catalog
        .filter((c) => c.min_level <= userLevel)
        .toArray();

      if (catalog.length > 0) {
        const picked = catalog[Math.floor(Math.random() * catalog.length)];
        const dropId = uuid();
        const lootDrop = {
          id: dropId,
          user_id: userId,
          catalog_id: picked.id,
          habit_log_id: null,
          awarded_at: now,
          acknowledged: false,
          updated_at: now,
        };
        await db.loot_drops.add(lootDrop as never);
        await queueWrite("loot_drops", dropId, "upsert", lootDrop);
        setPersonalBestDrop(picked);
      }
    }

    setNewValue("");
    setNewNote("");
    onRefresh();
  };

  return (
    <div className="mt-3 space-y-3">
      {/* Chart */}
      {data.entries.length >= 2 && (
        <div className="px-1">
          <MiniChart entries={data.entries} />
        </div>
      )}

      {/* Personal best badge */}
      {personalBestDrop && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px]"
          style={{
            backgroundColor: "hsl(45 90% 55% / 0.1)",
            color: "hsl(45 90% 40%)",
          }}
        >
          <Trophy size={14} />
          Personal best! Loot drop: {personalBestDrop.name}
        </div>
      )}

      {/* Log new entry */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="number"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder={data.metric.unit}
            className="flex-1 bg-transparent border-b border-muted-foreground/20 pb-1.5 text-[14px] outline-none focus:border-foreground/40 transition-colors placeholder:text-muted-foreground/30"
          />
          <button
            onClick={logEntry}
            disabled={!newValue.trim()}
            className="px-4 py-1.5 rounded-lg text-[12px] transition-opacity"
            style={{
              backgroundColor: newValue.trim()
                ? "hsl(var(--foreground))"
                : "hsl(var(--muted))",
              color: newValue.trim()
                ? "hsl(var(--background))"
                : "hsl(var(--muted-foreground))",
              opacity: newValue.trim() ? 1 : 0.5,
            }}
          >
            Log
          </button>
        </div>
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && logEntry()}
          placeholder="Note (optional)"
          className="w-full bg-transparent border-b border-muted-foreground/15 pb-1.5 text-[12px] outline-none focus:border-foreground/30 transition-colors placeholder:text-muted-foreground/30"
        />
      </div>

      {/* Recent entries */}
      <div className="space-y-1">
        {data.entries.slice(0, 10).map((e) => (
          <div
            key={e.id}
            className="flex items-baseline justify-between py-1"
          >
            <span className="text-[13px] tabular-nums">{e.value}</span>
            <span className="text-[10px] text-muted-foreground">
              {new Date(e.logged_at).toLocaleDateString()}
              {e.notes && (
                <span className="ml-1.5 text-muted-foreground/60">
                  {e.notes}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Page ── */

export default function LogbookPage() {
  const router = useRouter();
  const [metricsData, setMetricsData] = useState<MetricWithEntries[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    const uid = data?.user?.id;
    if (!uid) return;
    setUserId(uid);

    const metrics = await db.logbook_metrics
      .where("user_id")
      .equals(uid)
      .toArray();

    const data2: MetricWithEntries[] = await Promise.all(
      metrics.map(async (metric) => {
        const entries = await db.logbook_entries
          .where("metric_id")
          .equals(metric.id)
          .toArray();

        // Sort by date descending
        entries.sort(
          (a, b) =>
            new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime(),
        );

        const latestValue = entries.length > 0 ? entries[0].value : null;
        const bestValue =
          entries.length > 0 ? Math.max(...entries.map((e) => e.value)) : null;

        // Trend: compare latest vs previous
        let trend: "up" | "down" | "flat" | null = null;
        if (entries.length >= 2) {
          const diff = entries[0].value - entries[1].value;
          trend = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
        }

        return { metric, entries, latestValue, trend, bestValue };
      }),
    );

    setMetricsData(data2);
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
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-1 -ml-1 active:opacity-50"
        >
          <ChevronLeft size={20} />
        </button>
        <p className="text-[13px] uppercase tracking-[0.15em] text-muted-foreground">
          Logbook
        </p>
      </div>

      {metricsData.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[14px] text-muted-foreground mb-1">
            No metrics yet
          </p>
          <p className="text-[12px] text-muted-foreground/60">
            Metrics are created during onboarding or goal setup
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {metricsData.map((data) => {
            const expanded = expandedMetric === data.metric.id;
            return (
              <div key={data.metric.id}>
                <button
                  onClick={() =>
                    setExpandedMetric(
                      expanded ? null : data.metric.id,
                    )
                  }
                  className="w-full flex items-center justify-between py-3 active:opacity-50"
                >
                  <div>
                    <span className="text-[14px]">{data.metric.name}</span>
                    <span className="text-[11px] text-muted-foreground ml-2">
                      {data.metric.unit}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {data.latestValue !== null && (
                      <span className="text-[14px] tabular-nums">
                        {data.latestValue}
                      </span>
                    )}
                    {data.trend === "up" && (
                      <TrendingUp
                        size={14}
                        style={{ color: "hsl(152 60% 48%)" }}
                      />
                    )}
                    {data.trend === "down" && (
                      <TrendingDown
                        size={14}
                        style={{ color: "hsl(0 65% 55%)" }}
                      />
                    )}
                    {data.trend === "flat" && (
                      <Minus size={14} className="text-muted-foreground" />
                    )}
                  </div>
                </button>

                {expanded && userId && (
                  <MetricDetail
                    data={data}
                    userId={userId}
                    onRefresh={loadData}
                  />
                )}

                <div className="border-b border-muted" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
