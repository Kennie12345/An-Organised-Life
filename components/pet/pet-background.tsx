"use client";

import { memo, useMemo } from "react";
import type { TimeOfDay, Season } from "@/hooks/use-pet";

/**
 * Pixel-art background for the pet scene.
 * Everything is drawn as 1×1 rects in a low-res SVG (128×80),
 * then scaled up with image-rendering: pixelated for that chunky look.
 * Same pixel density as the 32×32 pet sprite.
 */

const W = 128;
const H = 80;

type PX = [number, number, number, number, string]; // x, y, w, h, color

/* ── Sky palettes ── */

interface SkyPalette {
  bands: string[]; // 5 colors from top to bottom
  cloud: string;
  cloudShadow: string;
}

const SKY: Record<TimeOfDay, SkyPalette> = {
  morning: {
    bands: ["#FFD4A0", "#FFE0B0", "#FFECC8", "#FFF4DD", "#FFF8E8"],
    cloud: "#FFFFFF",
    cloudShadow: "#FFE8CC",
  },
  afternoon: {
    bands: ["#5B9BD5", "#70AADD", "#8ABDE6", "#A8D0F0", "#C8E2F8"],
    cloud: "#FFFFFF",
    cloudShadow: "#D8E8F4",
  },
  evening: {
    bands: ["#C85070", "#D87050", "#E89060", "#F4B888", "#FFD8B0"],
    cloud: "#E8A0A0",
    cloudShadow: "#C87878",
  },
  night: {
    bands: ["#0A0A28", "#101038", "#181848", "#202058", "#282868"],
    cloud: "#303060",
    cloudShadow: "#202048",
  },
};

/* ── Ground palettes ── */

interface GroundPalette {
  grass1: string;
  grass2: string;
  dirt: string;
  trunk: string;
  leaves1: string;
  leaves2: string;
  flower: string;
}

const GROUND: Record<Season, GroundPalette> = {
  spring: {
    grass1: "#5AAA50", grass2: "#4A9840",
    dirt: "#8B7355", trunk: "#6B4830",
    leaves1: "#68C060", leaves2: "#88D878",
    flower: "#FF88AA",
  },
  summer: {
    grass1: "#48983A", grass2: "#3A8A2E",
    dirt: "#806848", trunk: "#5A3820",
    leaves1: "#4AAA40", leaves2: "#68C058",
    flower: "#FFD040",
  },
  autumn: {
    grass1: "#889050", grass2: "#788040",
    dirt: "#8B7355", trunk: "#5A3820",
    leaves1: "#D08830", leaves2: "#E8A840",
    flower: "#C86030",
  },
  winter: {
    grass1: "#88A898", grass2: "#78A088",
    dirt: "#8B7355", trunk: "#5A3820",
    leaves1: "#9AB8C8", leaves2: "#B0D0D8",
    flower: "#C8D8E0",
  },
};

/* ── Scene builder ── */

function buildScene(time: TimeOfDay, season: Season): PX[] {
  const px: PX[] = [];
  const sky = SKY[time];
  const gnd = GROUND[season];

  // ── Sky bands (rows 0–49) ──
  const bandH = 10;
  for (let b = 0; b < 5; b++) {
    px.push([0, b * bandH, W, bandH, sky.bands[b]]);
  }

  // ── Stars (night only) ──
  if (time === "night") {
    const starPositions = [
      [8, 3], [25, 7], [42, 2], [55, 9], [70, 4],
      [88, 6], [102, 3], [115, 8], [35, 15], [78, 12],
      [95, 18], [15, 20], [120, 14], [50, 22], [108, 20],
    ];
    for (const [sx, sy] of starPositions) {
      px.push([sx, sy, 1, 1, "#FFFFFF"]);
    }
    // Moon — 5×5 circle-ish
    const mx = 100, my = 8;
    px.push([mx + 1, my, 3, 1, "#F5E6B8"]);
    px.push([mx, my + 1, 5, 1, "#F5E6B8"]);
    px.push([mx, my + 2, 5, 1, "#FFF0D0"]);
    px.push([mx, my + 3, 5, 1, "#F5E6B8"]);
    px.push([mx + 1, my + 4, 3, 1, "#F5E6B8"]);
    // Moon shadow (crescent)
    px.push([mx + 3, my + 1, 2, 3, "#D8C898"]);
  }

  // ── Clouds ──
  if (time !== "night") {
    // Cloud 1 (left)
    px.push([15, 12, 8, 1, sky.cloud]);
    px.push([14, 13, 10, 2, sky.cloud]);
    px.push([13, 14, 12, 1, sky.cloudShadow]);
    // Cloud 2 (right)
    px.push([82, 8, 6, 1, sky.cloud]);
    px.push([80, 9, 10, 2, sky.cloud]);
    px.push([79, 10, 12, 1, sky.cloudShadow]);
    // Cloud 3 (small)
    px.push([55, 16, 5, 1, sky.cloud]);
    px.push([54, 17, 7, 1, sky.cloudShadow]);
  }

  // Sun/moon glow for morning/evening
  if (time === "morning") {
    px.push([105, 28, 6, 1, "#FFE8A0"]);
    px.push([104, 29, 8, 2, "#FFD880"]);
    px.push([103, 31, 10, 1, "#FFCC60"]);
    px.push([104, 32, 8, 1, "#FFE8A0"]);
  }

  // ── Ground layers (rows 50–79) ──
  // Main grass
  px.push([0, 55, W, 4, gnd.grass1]);
  px.push([0, 59, W, 3, gnd.grass2]);
  px.push([0, 62, W, 18, gnd.dirt]);
  // Grass edge — irregular top
  const grassEdge = [
    0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0,
    1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0,
  ];
  for (let i = 0; i < W; i++) {
    if (grassEdge[i % grassEdge.length]) {
      px.push([i, 54, 1, 1, gnd.grass1]);
    }
  }
  // Dirt texture
  for (let i = 0; i < 12; i++) {
    const dx = (i * 11 + 3) % W;
    const dy = 63 + (i % 5) * 3;
    px.push([dx, dy, 2, 1, gnd.grass2]);
  }

  // ── Left tree ──
  // Trunk
  px.push([18, 42, 3, 13, gnd.trunk]);
  px.push([17, 44, 1, 8, gnd.trunk]);
  // Branch
  px.push([21, 44, 3, 1, gnd.trunk]);
  px.push([23, 43, 1, 1, gnd.trunk]);
  // Canopy
  px.push([12, 30, 15, 2, gnd.leaves1]);
  px.push([10, 32, 19, 3, gnd.leaves2]);
  px.push([11, 35, 17, 2, gnd.leaves1]);
  px.push([13, 37, 13, 2, gnd.leaves2]);
  px.push([15, 39, 9, 2, gnd.leaves1]);
  px.push([17, 41, 5, 1, gnd.leaves2]);
  // Leaf highlights
  px.push([14, 31, 3, 1, gnd.leaves2]);
  px.push([20, 33, 4, 1, gnd.leaves1]);

  // ── Right bush ──
  px.push([98, 50, 10, 2, gnd.leaves2]);
  px.push([96, 52, 14, 3, gnd.leaves1]);
  px.push([97, 54, 12, 1, gnd.leaves2]);

  // ── Small bush far right ──
  px.push([115, 52, 6, 2, gnd.leaves1]);
  px.push([114, 53, 8, 2, gnd.leaves2]);

  // ── Flowers / seasonal accents ──
  if (season === "spring" || season === "summer") {
    px.push([45, 54, 1, 1, gnd.flower]);
    px.push([72, 53, 1, 1, gnd.flower]);
    px.push([58, 54, 1, 1, "#FFFFFF"]);
    px.push([85, 54, 1, 1, gnd.flower]);
  }

  // ── Grass tufts on ground ──
  for (const gx of [38, 52, 65, 78, 92]) {
    px.push([gx, 54, 1, 1, gnd.grass1]);
    px.push([gx + 1, 53, 1, 2, gnd.grass2]);
  }

  // ── Snow patches (winter) ──
  if (season === "winter") {
    px.push([12, 30, 5, 1, "#E8F0F8"]);
    px.push([20, 32, 4, 1, "#E8F0F8"]);
    px.push([97, 50, 4, 1, "#E8F0F8"]);
    px.push([30, 54, 8, 1, "#E8F0F8"]);
    px.push([60, 54, 6, 1, "#E8F0F8"]);
    px.push([90, 54, 5, 1, "#E8F0F8"]);
  }

  return px;
}

/* ── Component ── */

interface PetBackgroundProps {
  timeOfDay: TimeOfDay;
  season: Season;
}

export const PetBackground = memo(function PetBackground({
  timeOfDay,
  season,
}: PetBackgroundProps) {
  const pixels = useMemo(() => buildScene(timeOfDay, season), [timeOfDay, season]);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ imageRendering: "pixelated" }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        shapeRendering="crispEdges"
      >
        {pixels.map(([x, y, w, h, color], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} fill={color} />
        ))}
      </svg>
    </div>
  );
});
