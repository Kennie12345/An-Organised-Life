"use client";

import { useEffect, useState, memo, useMemo } from "react";
import type { Condition, PetEmotion, EvolutionStage } from "@/hooks/use-pet";
import { buildCatSprite } from "@/lib/cat-sprites";

/**
 * Renders the cat pixel-art sprite for any evolution stage.
 * Each stage has its own native pixel dimensions.
 * SVG scales to fill container with image-rendering: pixelated.
 */

interface PetSpriteProps {
  className?: string;
  condition?: Condition;
  evolution?: EvolutionStage;
  emotion?: PetEmotion;
  bodyTransform?: string;
  isAnimating?: boolean;
  onTap?: () => void;
}

export const PetSprite = memo(function PetSprite({
  className,
  condition = "content",
  evolution = "egg",
  emotion = "neutral",
  bodyTransform = "",
  isAnimating = false,
  onTap,
}: PetSpriteProps) {
  const [blink, setBlink] = useState(false);

  // Blinking
  useEffect(() => {
    if (emotion === "sleeping") return;
    const scheduleBlink = () => {
      const delay = 2500 + Math.random() * 3000;
      return setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 150);
        timerRef = scheduleBlink();
      }, delay);
    };
    let timerRef = scheduleBlink();
    return () => clearTimeout(timerRef);
  }, [emotion]);

  const { pixels, width, height } = useMemo(
    () => buildCatSprite(evolution, condition),
    [evolution, condition],
  );

  return (
    <div
      className={className}
      onClick={onTap}
      role={onTap ? "button" : undefined}
      tabIndex={onTap ? 0 : undefined}
      style={{
        imageRendering: "pixelated",
        cursor: onTap ? "pointer" : undefined,
      }}
    >
      <style>{`
        @keyframes pet-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes pet-sleep-bob {
          0%, 100% { transform: translateY(0) scaleY(1); }
          50% { transform: translateY(1px) scaleY(0.98); }
        }
      `}</style>
      <div
        style={{
          animation:
            emotion === "sleeping"
              ? "pet-sleep-bob 3s ease-in-out infinite"
              : isAnimating
                ? "none"
                : "pet-bob 2.4s ease-in-out infinite",
          transform: isAnimating ? bodyTransform : undefined,
          transition: isAnimating
            ? "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
            : "transform 0.4s ease",
          transformOrigin: "center bottom",
          width: "100%",
          height: "100%",
          opacity: blink ? 0.92 : 1,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          shapeRendering="crispEdges"
          preserveAspectRatio="xMidYMax meet"
        >
          {pixels.map(([x, y, color], i) => (
            <rect key={i} x={x} y={y} width={1} height={1} fill={color} />
          ))}
        </svg>
      </div>
    </div>
  );
});
