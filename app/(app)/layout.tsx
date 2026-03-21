import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SyncStatusIndicator } from "@/components/layout/sync-status";
import { WaterTracker } from "@/components/tracking/water-tracker";
import { MedicationTracker } from "@/components/tracking/medication-tracker";
import { DailyJobsProvider } from "@/components/daily/daily-jobs-provider";
import { Settings } from "lucide-react";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
    // dvh = dynamic viewport height — correct on iOS Safari (excludes browser chrome)
    <div className="flex flex-col" style={{ height: "100dvh" }}>
      <header className="shrink-0 border-b border-border bg-background px-4 pt-safe">
        {/* Title row */}
        <div className="flex items-center justify-between" style={{ height: "44px" }}>
          <span className="font-semibold text-sm">An Organised Life</span>
          <SyncStatusIndicator />
        </div>
        {/* Tracker row — water + medication */}
        <div className="flex items-center gap-3 pb-2">
          <WaterTracker userId={data.user.id} />
          <MedicationTracker userId={data.user.id} />
        </div>
      </header>

      {/* scroll-ios gives native momentum scrolling; pb-16 clears the fixed bottom nav */}
      <main className="flex-1 scroll-ios min-h-0">
        <Suspense>{children}</Suspense>
      </main>

      <BottomNav />
      <DailyJobsProvider />
    </div>
  );
}
