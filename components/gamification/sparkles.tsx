"use client";

import { useEffect, useState, memo } from "react";

/**
 * Sparkle particle effect — small glowing dots that burst outward.
 * Used for loot drops, XP gains, and other rewards.
 */

interface Spark {
  id: number;
  angle: number;
  distance: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
}

const SPARK_COLORS = ["#FFE066", "#FBBF24", "#FCD34D", "#FEF3C7", "#FFFFFF"];

function generateSparks(count: number): Spark[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: (360 / count) * i + (Math.random() - 0.5) * 30,
    distance: 20 + Math.random() * 40,
    size: 3 + Math.random() * 3,
    delay: Math.random() * 0.2,
    duration: 0.4 + Math.random() * 0.3,
    color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
  }));
}

interface SparklesProps {
  show: boolean;
  count?: number;
  className?: string;
}

export const Sparkles = memo(function Sparkles({
  show,
  count = 12,
  className = "",
}: SparklesProps) {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setSparks(generateSparks(count));
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [show, count]);

  if (!visible) return null;

  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`}>
      <style>{`
        @keyframes sparkle-burst {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          60% {
            opacity: 1;
          }
          100% {
            transform: translate(
              calc(-50% + var(--spark-x)),
              calc(-50% + var(--spark-y))
            ) scale(0);
            opacity: 0;
          }
        }
      `}</style>
      {sparks.map((s) => {
        const rad = (s.angle * Math.PI) / 180;
        const x = Math.cos(rad) * s.distance;
        const y = Math.sin(rad) * s.distance;
        return (
          <div
            key={s.id}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: s.size,
              height: s.size,
              borderRadius: "50%",
              backgroundColor: s.color,
              boxShadow: `0 0 ${s.size}px ${s.color}`,
              animation: `sparkle-burst ${s.duration}s ${s.delay}s ease-out forwards`,
              ["--spark-x" as string]: `${x}px`,
              ["--spark-y" as string]: `${y}px`,
            }}
          />
        );
      })}
    </div>
  );
});
