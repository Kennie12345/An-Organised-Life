"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDailyJobs } from "@/hooks/use-daily-jobs";
import { seedUserDefaults } from "@/lib/seed-user-defaults";
import { db } from "@/db";
import { LevelDropWarning } from "@/components/gamification/level-drop-warning";

/**
 * Client component that seeds defaults (if needed), runs daily jobs (upkeep drain,
 * stat decay, weight decay, maturity transitions) once per day on app open.
 * Shows level-drop warning if needed.
 * Redirects first-time users to /induction before seeding.
 */
export function DailyJobsProvider() {
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id;
      if (!uid) return;

      // Check if user has completed onboarding
      const user = await db.users.get(uid);
      if (!user || !user.onboarding_completed_at) {
        // Don't redirect if already on induction page
        if (pathname !== "/induction") {
          router.push("/induction");
        }
        return;
      }

      // Seed defaults if no stats exist (handles edge cases)
      await seedUserDefaults(uid);

      setUserId(uid);
    })();
  }, [pathname, router]);

  const { levelDropTo, dismissLevelDrop } = useDailyJobs(userId);

  return (
    <>
      {levelDropTo !== null && (
        <LevelDropWarning level={levelDropTo} show onDismiss={dismissLevelDrop} />
      )}
    </>
  );
}
