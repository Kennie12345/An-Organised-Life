"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, BarChart2, Target, History } from "lucide-react";

const tabs = [
  { href: "/today", label: "Today", icon: CalendarDays },
  { href: "/stats", label: "Stats", icon: BarChart2 },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/history", label: "History", icon: History },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    // pb-safe pads below the home indicator bar on iPhone
    // The nav content sits in h-16 (64px); total height = 64px + safe-area-inset-bottom
    <nav className="shrink-0 border-t border-border bg-background pb-safe pl-safe pr-safe">
      <div className="flex h-16 items-stretch">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              // min touch target: Apple HIG recommends 44×44pt
              className={`flex flex-1 flex-col items-center justify-center gap-1 text-xs active:opacity-60 transition-opacity ${
                active ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.75}
                className={active ? "text-foreground" : "text-muted-foreground"}
              />
              <span className={active ? "font-semibold" : "font-normal"}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
