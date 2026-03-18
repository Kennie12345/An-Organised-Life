"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { db } from "@/db";
import { MorningPlanning } from "@/components/morning-planning";
import { HabitChecklist } from "@/components/habit-checklist";

type PageState = "loading" | "plan" | "checklist";

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

      setPageState(existing ? "checklist" : "plan");
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
    return <HabitChecklist userId={userId} />;
  }

  return null;
}
