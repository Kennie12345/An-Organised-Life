"use client";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function getWeekDays(): string[] {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

interface SevenDayGridProps {
  completedDates: string[]; // YYYY-MM-DD strings
}

export function SevenDayGrid({ completedDates }: SevenDayGridProps) {
  const weekDays = getWeekDays();
  const todayStr = new Date().toISOString().split("T")[0];
  const done = new Set(completedDates);

  return (
    <div className="flex gap-1.5 mt-2">
      {weekDays.map((date, i) => {
        const completed = done.has(date);
        const isFuture = date > todayStr;
        return (
          <div key={date} className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-muted-foreground leading-none">
              {DAY_LABELS[i]}
            </span>
            <div
              className={`w-3.5 h-3.5 rounded-full ${
                completed
                  ? "bg-foreground"
                  : isFuture
                  ? "opacity-0"
                  : "border border-border"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}
