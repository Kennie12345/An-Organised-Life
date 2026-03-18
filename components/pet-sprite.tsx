"use client";

import { useEffect, useState } from "react";

/**
 * 32x32 pixel-art tamagotchi pet.
 * Idle animation: gentle bob + periodic blink.
 * Placeholder — will be extended with mood-reactive states later.
 */

const SIZE = 32;
const PX = 8; // each pixel rendered at 2x → 64x64 CSS pixels

// Palette
const O = "#2A3A2A"; // outline
const B = "#6B9E6B"; // body
const L = "#8FBF8F"; // belly
const E = "#1A1A1A"; // eye
const W = "#FFFFFF"; // eye shine
const C = "#DFA0B0"; // cheek
const F = "#5A8A5A"; // feet

// Sprite defined as rows of [x, color] runs for non-transparent pixels.
// Only stores filled pixels — everything else is transparent.
type Row = [number, string][]; // [x, color]

function buildSprite(blink: boolean): Row[] {
  const rows: Row[] = Array.from({ length: SIZE }, () => []);
  const dot = (x: number, y: number, c: string) => {
    if (y >= 0 && y < SIZE) rows[y].push([x, c]);
  };
  const hline = (y: number, x1: number, x2: number, c: string) => {
    for (let x = x1; x <= x2; x++) dot(x, y, c);
  };

  // ── Outline ──
  hline(5, 12, 19, O);
  hline(6, 10, 11, O); hline(6, 20, 21, O);
  dot(9, 7, O); dot(22, 7, O);
  dot(8, 8, O); dot(23, 8, O);
  for (let y = 9; y <= 19; y++) { dot(7, y, O); dot(24, y, O); }
  dot(8, 20, O); dot(23, 20, O);
  dot(9, 21, O); dot(22, 21, O);
  hline(22, 10, 11, O); hline(22, 20, 21, O);
  hline(23, 12, 19, O);
  // Feet outline
  hline(24, 9, 13, O); hline(24, 18, 22, O);
  hline(25, 9, 13, O); hline(25, 18, 22, O);

  // ── Body fill ──
  hline(6, 12, 19, B);
  hline(7, 10, 21, B);
  for (let y = 8; y <= 19; y++) hline(y, 8 + (y <= 8 ? 1 : 0), 23 - (y <= 8 ? 1 : 0), B);
  hline(20, 9, 22, B);
  hline(21, 10, 21, B);
  hline(22, 12, 19, B);

  // ── Light belly ──
  for (let y = 16; y <= 21; y++) {
    const inset = y <= 17 ? 0 : y <= 19 ? 1 : 2;
    hline(y, 12 + inset, 19 - inset, L);
  }

  // ── Eyes ──
  if (blink) {
    // Blink: horizontal line
    hline(12, 11, 13, E);
    hline(12, 19, 21, E);
  } else {
    // Open eyes: 3x3 with shine
    dot(11, 11, W); dot(12, 11, E); dot(13, 11, E);
    dot(11, 12, E); dot(12, 12, E); dot(13, 12, E);
    dot(11, 13, E); dot(12, 13, E); dot(13, 13, E);

    dot(19, 11, W); dot(20, 11, E); dot(21, 11, E);
    dot(19, 12, E); dot(20, 12, E); dot(21, 12, E);
    dot(19, 13, E); dot(20, 13, E); dot(21, 13, E);
  }

  // ── Cheeks ──
  dot(9, 15, C); dot(10, 15, C);
  dot(21, 15, C); dot(22, 15, C);

  // ── Smile ──
  dot(13, 16, O); dot(18, 16, O);
  hline(17, 14, 17, O);

  // ── Feet fill ──
  hline(24, 10, 12, F); hline(24, 19, 21, F);
  hline(25, 10, 12, F); hline(25, 19, 21, F);

  return rows;
}

export function PetSprite({ className }: { className?: string }) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const scheduleBlink = () => {
      const delay = 2500 + Math.random() * 3000; // blink every 2.5–5.5s
      return setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 120); // blink lasts 120ms
        timerRef = scheduleBlink();
      }, delay);
    };
    let timerRef = scheduleBlink();
    return () => clearTimeout(timerRef);
  }, []);

  const sprite = buildSprite(blink);

  return (
    <div
      className={className}
      style={{
        imageRendering: "pixelated",
        animation: "pet-bob 2.4s ease-in-out infinite",
        aspectRatio: "1 / 1",
      }}
    >
      <style>{`
        @keyframes pet-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
      `}</style>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        shapeRendering="crispEdges"
      >
        {sprite.flatMap((row, y) =>
          row.map(([x, color], i) => (
            <rect
              key={`${y}-${i}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={color}
            />
          )),
        )}
      </svg>
    </div>
  );
}
