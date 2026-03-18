"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDailyJobs } from "@/hooks/use-daily-jobs";
import { seedUserDefaults } from "@/lib/seed-user-defaults";
import { LevelDropWarning } from "./level-drop-warning";

/**
 * Client component that seeds defaults (if needed), runs daily jobs (upkeep drain,
 * stat decay, weight decay, maturity transitions) once per day on app open.
 * Shows level-drop warning if needed.
 */
export function DailyJobsProvider() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id;
      if (!uid) return;

      // Seed defaults if no stats exist (pre-onboarding)
      await seedUserDefaults(uid);

      setUserId(uid);
    })();
  }, []);

  const { levelDropTo, dismissLevelDrop } = useDailyJobs(userId);

  return (
    <>
      {levelDropTo !== null && (
        <LevelDropWarning level={levelDropTo} show onDismiss={dismissLevelDrop} />
      )}
    </>
  );
}
