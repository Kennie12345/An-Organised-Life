"use client";

import { usePet } from "@/hooks/use-pet";
import { PetSprite } from "./pet-sprite";
import { PetBackground } from "./pet-background";
import { playSound } from "@/lib/sounds";
import { haptic } from "@/lib/haptics";
import { Sparkles } from "@/components/gamification/sparkles";
import { useEffect, useRef, useState } from "react";
import { subscribePetEvents, type PetEventType } from "@/lib/pet-events";

/**
 * Full pet scene: pixel-art background + large pet + effects.
 * Everything renders at a low pixel resolution and is scaled up
 * with image-rendering: pixelated for a cohesive retro look.
 */

interface PetSceneProps {
  avgStatValue: number;
  peakLevel?: number;
  className?: string;
}

export function PetScene({ avgStatValue, peakLevel = 1, className }: PetSceneProps) {
  const pet = usePet(avgStatValue, peakLevel);
  const [showSparkles, setShowSparkles] = useState(false);
  const sparkleKey = useRef(0);

  // Play sounds + haptics on pet events
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

  // Reset sparkles after showing
  useEffect(() => {
    if (showSparkles) {
      const timer = setTimeout(() => setShowSparkles(false), 100);
      return () => clearTimeout(timer);
    }
  }, [showSparkles]);

  return (
    <div
      className={`relative overflow-hidden ${className ?? ""}`}
      style={{ imageRendering: "pixelated" }}
    >
      {/* Background scene */}
      <PetBackground timeOfDay={pet.timeOfDay} season={pet.season} />

      {/* Pet — large, centered, sitting on the ground */}
      <div className="absolute inset-0 flex items-end justify-center" style={{ paddingBottom: "8%" }}>
        <div className="relative" style={{ width: "65%", maxWidth: "280px", aspectRatio: "1 / 1" }}>
          <PetSprite
            condition={pet.condition}
            evolution={pet.evolution}
            emotion={pet.emotion}
            bodyTransform={pet.bodyTransform}
            isAnimating={pet.isAnimating}
            onTap={pet.handleTap}
            className="w-full h-full"
          />
          {/* Sparkle effects — centered on pet */}
          <Sparkles
            key={sparkleKey.current}
            show={showSparkles}
          />
        </div>
      </div>
    </div>
  );
}
