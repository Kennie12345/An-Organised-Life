"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  db,
  type DbScratchPadItem,
  type DbGoal,
} from "@/db";

import { queueWrite } from "@/lib/sync";
import { uuid } from "@/utils/uuid";
import { Plus, ChevronRight, Clock, MessageCircle, Archive, Sparkles } from "lucide-react";

/* ── Status Badge ── */

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    pending: {
      label: "Quarantine",
      color: "hsl(45 90% 40%)",
      bg: "hsl(45 90% 55% / 0.1)",
    },
    interrogating: {
      label: "In progress",
      color: "hsl(210 70% 50%)",
      bg: "hsl(210 70% 50% / 0.1)",
    },
    promoted: {
      label: "Promoted",
      color: "hsl(152 60% 48%)",
      bg: "hsl(152 60% 48% / 0.1)",
    },
    archived: {
      label: "Archived",
      color: "hsl(var(--muted-foreground))",
      bg: "hsl(var(--muted))",
    },
  };

  const c = config[status] ?? config.archived;

  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full"
      style={{ color: c.color, backgroundColor: c.bg }}
    >
      {c.label}
    </span>
  );
}

/* ── Time Remaining ── */

function TimeRemaining({ expiresAt }: { expiresAt: string }) {
  const now = Date.now();
  const expires = new Date(expiresAt).getTime();
  const remaining = expires - now;

  if (remaining <= 0) return <span className="text-[10px] text-muted-foreground">Expired</span>;

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
      <Clock size={10} />
      {hours}h {mins}m
    </span>
  );
}

/* ── Main Page ── */

export default function ScratchPadPage() {
  const router = useRouter();
  const [items, setItems] = useState<DbScratchPadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [newIdea, setNewIdea] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [activeGoalCount, setActiveGoalCount] = useState(0);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    const uid = data?.user?.id;
    if (!uid) return;
    setUserId(uid);

    const goalCount = await db.goals
      .where("user_id")
      .equals(uid)
      .filter((g: DbGoal) => g.status === "active")
      .count();
    setActiveGoalCount(goalCount);

    const all = await db.scratch_pad_items
      .where("user_id")
      .equals(uid)
      .toArray();

    // Auto-archive expired items
    const now = new Date();
    for (const item of all) {
      if (
        item.status !== "archived" &&
        item.status !== "promoted" &&
        new Date(item.auto_archive_at) <= now
      ) {
        await db.scratch_pad_items.update(item.id, {
          status: "archived",
          updated_at: now.toISOString(),
        });
        await queueWrite("scratch_pad_items", item.id, "upsert", {
          ...item,
          status: "archived",
          updated_at: now.toISOString(),
        });
        item.status = "archived";
      }
    }

    // Sort: pending/interrogating first, then promoted, then archived
    const order = { pending: 0, interrogating: 1, promoted: 2, archived: 3 };
    all.sort(
      (a, b) =>
        (order[a.status as keyof typeof order] ?? 4) -
        (order[b.status as keyof typeof order] ?? 4) ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    setItems(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const captureIdea = async () => {
    if (!userId || !newIdea.trim()) return;
    const now = new Date().toISOString();
    const id = uuid();

    const quarantineEnd = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const autoArchive = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const item = {
      id,
      user_id: userId,
      raw_idea: newIdea.trim(),
      status: "pending",
      created_at: now,
      interrogation_started_at: null,
      interrogation_completed_at: null,
      commitment_score: null,
      llm_conversation: null,
      promoted_goal_id: null,
      auto_archive_at: autoArchive,
      updated_at: now,
    };

    await db.scratch_pad_items.add(item as never);
    await queueWrite("scratch_pad_items", id, "upsert", item);

    // Create 24h notification schedule
    const schedId = uuid();
    const notif = {
      id: schedId,
      user_id: userId,
      type: "scratch_pad_ready",
      entity_type: "scratch_pad_item",
      entity_id: id,
      schedule_type: "triggered",
      recurrence_time: null,
      recurrence_days: null,
      advance_notice_min: 0,
      google_event_id: null,
      is_active: true,
      last_triggered_at: null,
      created_at: now,
      updated_at: now,
    };
    await db.notification_schedules.add(notif as never);
    await queueWrite("notification_schedules", schedId, "upsert", notif);

    setNewIdea("");
    setShowInput(false);
    loadData();
  };

  const canInterrogate = (item: DbScratchPadItem) => {
    if (item.status === "interrogating") return true;
    if (item.status !== "pending") return false;
    // Skip quarantine for first-time users (no active goals)
    if (activeGoalCount === 0) return true;
    // Otherwise require 24h quarantine
    return Date.now() - new Date(item.created_at).getTime() >= 24 * 60 * 60 * 1000;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const active = items.filter(
    (i) => i.status === "pending" || i.status === "interrogating",
  );
  const completed = items.filter(
    (i) => i.status === "promoted" || i.status === "archived",
  );

  return (
    <div className="px-6 pt-6 pb-8 overflow-y-auto">
      <div className="flex items-baseline justify-between mb-6">
        <p className="text-[13px] uppercase tracking-[0.15em] text-muted-foreground">
          Scratch Pad
        </p>
        <button
          onClick={() => setShowInput(true)}
          className="p-1 active:opacity-50"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* New idea input */}
      {showInput && (
        <div className="mb-6 space-y-2">
          <textarea
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            placeholder="Dump your idea here — no structure needed"
            rows={3}
            autoFocus
            className="w-full bg-transparent border border-muted-foreground/20 rounded-lg p-3 text-[14px] outline-none focus:border-foreground/40 transition-colors placeholder:text-muted-foreground/30 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={captureIdea}
              disabled={!newIdea.trim()}
              className="flex-1 py-2.5 rounded-lg text-[13px] transition-opacity"
              style={{
                backgroundColor: newIdea.trim()
                  ? "hsl(var(--foreground))"
                  : "hsl(var(--muted))",
                color: newIdea.trim()
                  ? "hsl(var(--background))"
                  : "hsl(var(--muted-foreground))",
                opacity: newIdea.trim() ? 1 : 0.5,
              }}
            >
              Capture
            </button>
            <button
              onClick={() => {
                setShowInput(false);
                setNewIdea("");
              }}
              className="px-4 py-2.5 rounded-lg text-[13px] text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active items */}
      {active.length === 0 && !showInput && (
        <div className="text-center py-12">
          <p className="text-[14px] text-muted-foreground mb-1">
            No ideas in quarantine
          </p>
          <p className="text-[12px] text-muted-foreground/60">
            Capture an idea — it waits 24h before you can commit
          </p>
        </div>
      )}

      {active.length > 0 && (
        <div className="space-y-3 mb-8">
          {active.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (canInterrogate(item)) {
                  router.push(`/scratch-pad/${item.id}`);
                }
              }}
              disabled={!canInterrogate(item)}
              className="w-full text-left px-4 py-3 rounded-lg transition-colors active:opacity-50"
              style={{
                border: "1px solid hsl(var(--muted))",
                opacity: canInterrogate(item) ? 1 : 0.6,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[14px] line-clamp-2 flex-1">
                  {item.raw_idea}
                </p>
                <StatusBadge status={item.status} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <TimeRemaining expiresAt={item.auto_archive_at} />
                {canInterrogate(item) && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <MessageCircle size={11} />
                    Begin interrogation
                    <ChevronRight size={12} />
                  </span>
                )}
                {!canInterrogate(item) && item.status === "pending" && (
                  <span className="text-[10px] text-muted-foreground">
                    Quarantine — wait 24h
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Completed items */}
      {completed.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3">
            History
          </p>
          <div className="space-y-2">
            {completed.slice(0, 10).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-muted-foreground truncate">
                    {item.raw_idea}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {item.commitment_score !== null && (
                    <span className="text-[11px] tabular-nums text-muted-foreground">
                      {item.commitment_score}/10
                    </span>
                  )}
                  <StatusBadge status={item.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
