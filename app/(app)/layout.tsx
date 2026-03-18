import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/bottom-nav";
import { SyncStatusIndicator } from "@/components/sync-status";
import { WaterTracker } from "@/components/water-tracker";
import { MedicationTracker } from "@/components/medication-tracker";

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
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
