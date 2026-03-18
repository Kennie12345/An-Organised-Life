"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SevenDayGrid } from "./seven-day-grid";
import { CompletionInput } from "./completion-input";
import type { DbHabit, DbHabitLog } from "@/db";

type RowStatus = "completed" | "active" | "upcoming";

interface HabitRowProps {
  habit: DbHabit;
  status: RowStatus;
  log?: DbHabitLog;
  weekCompletedDates: string[];
  xpFlash?: number; // XP to display after completion
  onComplete: (value: string, outOfSequence: boolean) => void;
}

export function HabitRow({
  habit,
  status,
  log,
  weekCompletedDates,
  xpFlash,
  onComplete,
}: HabitRowProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [oosActive, setOosActive] = useState(false); // out-of-sequence input shown

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = habit.completion_config as any;

  // --- COMPLETED ---
  if (status === "completed" && log) {
    return (
      <div className="relative px-4 py-3.5 border-b border-border/50">
        {/* XP award animation — flies up from top-right of the row */}
        <AnimatePresence>
          {xpFlash !== undefined && (
            <motion.div
              key={xpFlash}
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [0, 1, 1, 0], y: [0, -8, -28, -52] }}
              transition={{ duration: 1.4, times: [0, 0.06, 0.5, 1], ease: "easeOut" }}
              className="pointer-events-none absolute right-4 top-3 text-sm font-bold text-foreground z-10"
            >
              +{xpFlash} XP
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-5 h-5 rounded-full bg-foreground flex items-center justify-center shrink-0">
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path
                d="M1 4L3.5 6.5L9 1"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{habit.name}</p>
            {log.completion_value && log.completion_value !== "true" && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {log.completion_value.replace("|", " · ")}
              </p>
            )}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-medium text-foreground/70">
                +{log.xp_final} XP
              </span>
              {log.sequence_multiplier < 1 && (
                <span className="text-xs text-muted-foreground">(50% — out of sequence)</span>
              )}
            </div>
            <SevenDayGrid completedDates={weekCompletedDates} />
          </div>
        </div>
      </div>
    );
  }

  // --- ACTIVE (current step) ---
  if (status === "active") {
    return (
      <div className="px-4 py-3.5 border-b border-border/50">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-5 h-5 rounded-full border-2 border-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{habit.name}</p>
            {habit.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{habit.description}</p>
            )}
            <CompletionInput
              type={habit.completion_type}
              config={config}
              onComplete={(val) => onComplete(val, false)}
            />
            <SevenDayGrid completedDates={weekCompletedDates} />
          </div>
        </div>
      </div>
    );
  }

  // --- UPCOMING (dimmed) ---
  return (
    <div
      className={`px-4 py-3.5 border-b border-border/50 transition-opacity ${
        oosActive ? "opacity-100" : "opacity-40"
      }`}
      onClick={() => {
        if (!oosActive && !showWarning) setShowWarning(true);
      }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 w-5 h-5 rounded-full border border-border shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{habit.name}</p>

          {/* Out-of-sequence warning */}
          {showWarning && !oosActive && (
            <div
              className="mt-2 rounded-xl border border-border bg-background p-3"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-xs font-medium mb-2">
                You'll earn 50% XP out of sequence. Complete your foundation
                first for full rewards.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowWarning(false)}
                  className="flex-1 rounded-xl border border-border py-2.5 text-xs font-medium active:opacity-70"
                >
                  Go back
                </button>
                <button
                  onClick={() => {
                    setShowWarning(false);
                    setOosActive(true);
                  }}
                  className="flex-1 rounded-xl bg-foreground py-2.5 text-xs font-medium text-background active:opacity-70"
                >
                  Proceed anyway
                </button>
              </div>
            </div>
          )}

          {/* Out-of-sequence completion input */}
          {oosActive && (
            <CompletionInput
              type={habit.completion_type}
              config={config}
              onComplete={(val) => onComplete(val, true)}
            />
          )}

          <SevenDayGrid completedDates={weekCompletedDates} />
        </div>
      </div>
    </div>
  );
}
