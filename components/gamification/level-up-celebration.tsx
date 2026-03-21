"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import { Confetti } from "./confetti";
import { Sparkles } from "./sparkles";

interface LevelUpCelebrationProps {
  level: number;
  show: boolean;
  onDismiss: () => void;
}

export function LevelUpCelebration({ level, show, onDismiss }: LevelUpCelebrationProps) {
  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Confetti burst */}
          <Confetti show={show} count={50} />

          {/* Overlay */}
          <motion.div
            key="levelup-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onDismiss}
          />

          {/* Bottom sheet */}
          <motion.div
            key="levelup-sheet"
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

            {/* Star icon with sparkles */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: [0, 1.4, 0.9, 1.15, 1], rotate: [-20, 10, -5, 2, 0] }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex justify-center mb-4"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Star className="w-10 h-10 text-white" strokeWidth={1.5} fill="currentColor" />
                </div>
                <Sparkles show={show} count={16} />
              </div>
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center mb-6"
            >
              <p className="text-xs font-bold tracking-widest text-amber-500 mb-2">
                LEVEL UP
              </p>
              <p className="text-5xl font-bold mb-1">{level}</p>
              <p className="text-sm text-muted-foreground">
                Your pet is growing stronger.
              </p>
            </motion.div>

            {/* Dismiss */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              onClick={onDismiss}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-4 text-sm font-bold text-white active:opacity-70 shadow-lg shadow-amber-500/20"
            >
              Continue
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
