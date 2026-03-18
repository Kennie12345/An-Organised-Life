import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/bottom-nav";
import { SyncStatusIndicator } from "@/components/sync-status";

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
      <header className="shrink-0 border-b border-border bg-background px-4 flex items-end justify-between pt-safe"
        style={{ paddingBottom: "12px", minHeight: "calc(44px + env(safe-area-inset-top))" }}
      >
        <span className="font-semibold text-sm">An Organised Life</span>
        <SyncStatusIndicator />
      </header>

      {/* scroll-ios gives native momentum scrolling; pb-16 clears the fixed bottom nav */}
      <main className="flex-1 scroll-ios min-h-0">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
