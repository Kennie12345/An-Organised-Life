"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Gift } from "lucide-react";
import type { DbLootDropCatalog } from "@/db";

const TYPE_LABELS: Record<string, string> = {
  xp_surge:     "XP SURGE",
  stat_boost:   "STAT BOOST",
  rested_bonus: "RESTED BONUS",
  fortune:      "FORTUNE",
};

function formatPayload(type: string, payload: unknown): string {
  const p = payload as Record<string, unknown>;
  if (type === "xp_surge" && typeof p.xp_bonus === "number") {
    return `+${p.xp_bonus} bonus XP`;
  }
  if (type === "stat_boost" && typeof p.boost === "number") {
    return `+${p.boost} to a stat`;
  }
  if (type === "rested_bonus" && typeof p.multiplier === "number") {
    return `Next habit: ${p.multiplier}× XP`;
  }
  if (type === "fortune" && typeof p.message === "string") {
    return `"${p.message}"`;
  }
  return "";
}

interface LootDropRevealProps {
  catalog: DbLootDropCatalog;
  onCollect: () => void;
}

export function LootDropReveal({ catalog, onCollect }: LootDropRevealProps) {
  const typeLabel = TYPE_LABELS[catalog.type] ?? catalog.type.toUpperCase();
  const payloadLine = formatPayload(catalog.type, catalog.payload);

  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        key="loot-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onCollect}
      />

      {/* Bottom sheet */}
      <motion.div
        key="loot-sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl px-6 pt-6 pb-safe-or-8"
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pill handle */}
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-6" />

        {/* Bouncing icon */}
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: [0, 1.3, 0.9, 1.1, 1], rotate: [-15, 8, -4, 2, 0] }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex justify-center mb-4"
        >
          <div className="w-20 h-20 rounded-3xl bg-foreground flex items-center justify-center shadow-lg">
            <Gift className="w-10 h-10 text-background" strokeWidth={1.5} />
          </div>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-5"
        >
          <p className="text-xs font-bold tracking-widest text-muted-foreground mb-1">
            LOOT DROP
          </p>
          <span className="inline-block text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full bg-foreground text-background">
            {typeLabel}
          </span>
        </motion.div>

        {/* Reward info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="text-center mb-6"
        >
          <p className="text-xl font-bold mb-1">{catalog.name}</p>
          <p className="text-sm text-muted-foreground">{catalog.description}</p>
          {payloadLine && (
            <p className="mt-2 text-sm font-semibold text-foreground">
              {payloadLine}
            </p>
          )}
        </motion.div>

        {/* Collect button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={onCollect}
          className="w-full rounded-2xl bg-foreground py-4 text-sm font-bold text-background active:opacity-70"
        >
          Collect
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}
