"use client";

import { useEffect, useState, memo } from "react";

/**
 * Canvas-free confetti burst using CSS animations.
 * Lightweight, GPU-accelerated, no dependencies.
 */

interface Particle {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  rotation: number;
  size: number;
  xDrift: number;
}

const COLORS = [
  "#FF6B8A", "#FFB347", "#FFE066", "#7BC67E", "#6BB5FF",
  "#C084FC", "#F472B6", "#34D399", "#FBBF24", "#818CF8",
];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 30 + Math.random() * 40, // 30-70% across
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: Math.random() * 0.3,
    duration: 0.8 + Math.random() * 0.6,
    rotation: Math.random() * 720 - 360,
    size: 4 + Math.random() * 4,
    xDrift: (Math.random() - 0.5) * 120,
  }));
}

interface ConfettiProps {
  /** Whether to show the confetti burst */
  show: boolean;
  /** Number of particles */
  count?: number;
}

export const Confetti = memo(function Confetti({ show, count = 40 }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setParticles(generateParticles(count));
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [show, count]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) translateX(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(var(--x-drift)) rotate(var(--rotation)) scale(0.3);
            opacity: 0;
          }
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: 0,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            borderRadius: "1px",
            animation: `confetti-fall ${p.duration}s ${p.delay}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
            ["--x-drift" as string]: `${p.xDrift}px`,
            ["--rotation" as string]: `${p.rotation}deg`,
          }}
        />
      ))}
    </div>
  );
});
