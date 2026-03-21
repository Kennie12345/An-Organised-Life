"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TrendingDown } from "lucide-react";
import { useEffect } from "react";
import { playSound } from "@/lib/sounds";
import { haptic } from "@/lib/haptics";

interface LevelDropWarningProps {
  level: number;
  show: boolean;
  onDismiss: () => void;
}

export function LevelDropWarning({ level, show, onDismiss }: LevelDropWarningProps) {
  useEffect(() => {
    if (show) {
      playSound("levelDrop");
      haptic("heavy");
    }
  }, [show]);
  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Overlay */}
          <motion.div
            key="leveldrop-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onDismiss}
          />

          {/* Bottom sheet */}
          <motion.div
            key="leveldrop-sheet"
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

            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.1, 0.95, 1] }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex justify-center mb-4"
            >
              <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center">
                <TrendingDown className="w-10 h-10 text-muted-foreground" strokeWidth={1.5} />
              </div>
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-6"
            >
              <p className="text-xs font-bold tracking-widest text-muted-foreground mb-2">
                LEVEL DROP
              </p>
              <p className="text-4xl font-bold mb-1">Level {level}</p>
              <p className="text-sm text-muted-foreground">
                Your pet needs more care. Complete habits to recover.
              </p>
            </motion.div>

            {/* Dismiss */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={onDismiss}
              className="w-full rounded-2xl border border-border py-4 text-sm font-medium text-foreground active:opacity-70"
            >
              Got it
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
