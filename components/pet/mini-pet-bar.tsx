"use client";

import { useEffect, useState } from "react";
import { db, type DbUser } from "@/db";
import { createClient } from "@/lib/supabase/client";
import { xpRequiredForLevel } from "@/utils/leveling";
import { PetSprite } from "./pet-sprite";
import { PetBackground } from "./pet-background";
import { Sparkles } from "@/components/gamification/sparkles";
import { usePet } from "@/hooks/use-pet";
import { subscribePetEvents, type PetEventType } from "@/lib/pet-events";
import { playSound } from "@/lib/sounds";
import { haptic } from "@/lib/haptics";
import { useRef } from "react";

interface MiniPetBarProps {
  userId: string;
}

function petConditionWord(avg: number): string {
  if (avg >= 75) return "Thriving";
  if (avg >= 55) return "Content";
  if (avg >= 35) return "Tired";
  return "Needs care";
}

export function MiniPetBar({ userId }: MiniPetBarProps) {
  const [user, setUser] = useState<DbUser | null>(null);
  const [avgStat, setAvgStat] = useState(50);
  const [showSparkles, setShowSparkles] = useState(false);
  const sparkleKey = useRef(0);

  useEffect(() => {
    async function load() {
      const userRow = await db.users.get(userId);
      const stats = await db.stats
        .where("user_id")
        .equals(userId)
        .filter((s) => s.is_active)
        .toArray();
      const avg =
        stats.length > 0
          ? stats.reduce((s, st) => s + st.current_value, 0) / stats.length
          : 50;
      setUser(userRow ?? null);
      setAvgStat(avg);
    }
    load();

    // Re-load on pet events (XP/level may have changed)
    return subscribePetEvents(() => {
      load();
    });
  }, [userId]);

  // Sound + haptics for pet events on the Today screen
  useEffect(() => {
    return subscribePetEvents((event: PetEventType) => {
      switch (event) {
        case "tap":
          playSound("tap");
          haptic("light");
          break;
        case "rapid_tap":
          playSound("complete");
          haptic("double");
          sparkleKey.current++;
          setShowSparkles(true);
          break;
        case "habit_complete":
          playSound("complete");
          haptic("medium");
          sparkleKey.current++;
          setShowSparkles(true);
          break;
        case "level_up":
          playSound("levelUp");
          haptic("success");
          break;
        case "loot_drop":
          playSound("lootDrop");
          haptic("medium");
          sparkleKey.current++;
          setShowSparkles(true);
          break;
      }
    });
  }, []);

  // Reset sparkles
  useEffect(() => {
    if (showSparkles) {
      const timer = setTimeout(() => setShowSparkles(false), 100);
      return () => clearTimeout(timer);
    }
  }, [showSparkles]);

  const pet = usePet(avgStat, user?.peak_level ?? 1);

  const level = user?.level ?? 1;
  const currentXp = user?.current_xp ?? 0;
  const xpToNext = xpRequiredForLevel(level);
  const xpPct = Math.min(100, (currentXp / xpToNext) * 100);
  const petName = user?.pet_name ?? "Your Pet";

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-border/50 bg-background">
      {/* Mini pet scene */}
      <div
        className="relative shrink-0 rounded-xl overflow-hidden border border-border/30"
        style={{
          width: 72,
          height: 56,
          imageRendering: "pixelated",
        }}
      >
        <PetBackground timeOfDay={pet.timeOfDay} season={pet.season} />
        <div
          className="absolute inset-0 flex items-end justify-center"
          style={{ paddingBottom: "6%" }}
        >
          <div className="relative" style={{ width: "60%", aspectRatio: "1/1" }}>
            <PetSprite
              condition={pet.condition}
              evolution={pet.evolution}
              emotion={pet.emotion}
              bodyTransform={pet.bodyTransform}
              isAnimating={pet.isAnimating}
              onTap={pet.handleTap}
              className="w-full h-full"
            />
            <Sparkles key={sparkleKey.current} show={showSparkles} />
          </div>
        </div>
      </div>

      {/* Pet info + XP bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold truncate">{petName}</span>
          <span className="text-xs text-muted-foreground ml-2 shrink-0">
            Lv {level} · {petConditionWord(avgStat)}
          </span>
        </div>
        {/* XP progress bar */}
        <div className="mt-1.5 flex items-center gap-2">
          <div className="flex-1 h-[5px] rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700 ease-out"
              style={{ width: `${xpPct}%` }}
            />
          </div>
          <span className="text-[10px] tabular-nums text-muted-foreground/70 shrink-0">
            {currentXp}/{xpToNext}
          </span>
        </div>
      </div>
    </div>
  );
}
