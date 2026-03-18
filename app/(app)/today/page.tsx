"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { db } from "@/db";
import { MorningPlanning } from "@/components/morning-planning";
import { HabitChecklist } from "@/components/habit-checklist";
import { EveningCheckIn } from "@/components/evening-checkin";

type PageState = "loading" | "plan" | "checklist" | "evening" | "done";

export default function TodayPage() {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id;
      if (!uid) return;

      setUserId(uid);

      const today = new Date().toISOString().split("T")[0];
      const existing = await db.daily_plans
        .where("user_id")
        .equals(uid)
        .filter((p) => p.plan_date === today)
        .first();

      if (!existing) {
        setPageState("plan");
      } else if (existing.completed_at) {
        setPageState("done");
      } else {
        setPageState("checklist");
      }
    }
    init();
  }, []);

  if (pageState === "loading") {
    return (
      <div className="flex h-full items-center justify-center py-20 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (pageState === "plan" && userId) {
    return (
      <MorningPlanning
        userId={userId}
        onComplete={() => setPageState("checklist")}
      />
    );
  }

  if (pageState === "checklist" && userId) {
    return (
      <HabitChecklist
        userId={userId}
        onEndDay={() => setPageState("evening")}
      />
    );
  }

  if (pageState === "evening" && userId) {
    return (
      <EveningCheckIn
        userId={userId}
        onComplete={() => setPageState("done")}
      />
    );
  }

  if (pageState === "done") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 px-6 text-center">
        <p className="text-3xl">🌙</p>
        <p className="text-sm font-medium">Day complete. Rest well.</p>
        <p className="text-xs text-muted-foreground">
          Your progress has been saved. See you tomorrow.
        </p>
      </div>
    );
  }

  return null;
}
