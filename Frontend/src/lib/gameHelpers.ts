import type { Vec2, OrbSize, PlayerSide, Player, Orb, Powerup, Creature, GameState, PowerupType } from "../types";
import { ORB_RADII, ORB_SCORES } from "../types";

// ─── Map ──────────────────────────────────────────────────────────────────────
export const MAP_W = 1200;
export const MAP_H = 800;
export const PLAYER_RADIUS = 14;
export const CREATURE_RADIUS = 20;
export const CREATURE_BITE_PENALTY = 10;
export const CREATURE_BITE_COOLDOWN = 120; // frames
export const GAME_DURATION = 120; // seconds

// ─── Colors ───────────────────────────────────────────────────────────────────
const PLAYER_COLORS = [
  "#a855f7", "#f59e0b", "#10b981", "#3b82f6",
  "#ec4899", "#14b8a6", "#f97316", "#8b5cf6",
  "#22c55e", "#ef4444",
];

// ─── Sides ────────────────────────────────────────────────────────────────────
const SIDES: PlayerSide[] = ["left", "right", "top", "bottom"];

export function getPlantPos(side: PlayerSide, index: number, total: number): Vec2 {
  switch (side) {
    case "left":   return { x: 40, y: 80 + (index / Math.max(total - 1, 1)) * (MAP_H - 160) };
    case "right":  return { x: MAP_W - 40, y: 80 + (index / Math.max(total - 1, 1)) * (MAP_H - 160) };
    case "top":    return { x: 80 + (index / Math.max(total - 1, 1)) * (MAP_W - 160), y: 40 };
    case "bottom": return { x: 80 + (index / Math.max(total - 1, 1)) * (MAP_W - 160), y: MAP_H - 40 };
  }
}

export function getSpawnPos(side: PlayerSide, index: number, total: number): Vec2 {
  const p = getPlantPos(side, index, total);
  switch (side) {
    case "left":   return { x: p.x + 60, y: p.y };
    case "right":  return { x: p.x - 60, y: p.y };
    case "top":    return { x: p.x, y: p.y + 60 };
    case "bottom": return { x: p.x, y: p.y - 60 };
  }
}

// ─── Generators ───────────────────────────────────────────────────────────────
let _id = 0;
const uid = () => `${++_id}`;

export function makeOrb(): Orb {
  const sizes: OrbSize[] = ["tiny", "tiny", "tiny", "small", "small", "medium", "large"];
  const size = sizes[Math.floor(Math.random() * sizes.length)];
  const colors = ["#f59e0b", "#fcd34d", "#fb923c", "#a3e635", "#34d399", "#60a5fa"];
  return {
    id: uid(),
    pos: {
      x: 80 + Math.random() * (MAP_W - 160),
      y: 80 + Math.random() * (MAP_H - 160),
    },
    size,
    color: colors[Math.floor(Math.random() * colors.length)],
  };
}

const POWERUP_TYPES: PowerupType[] = ["speed", "double", "magnet"];
export function makePowerup(): Powerup {
  return {
    id: uid(),
    pos: {
      x: 80 + Math.random() * (MAP_W - 160),
      y: 80 + Math.random() * (MAP_H - 160),
    },
    type: POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)],
    expiresAt: Date.now() + 15_000,
  };
}

export function makeCreature(): Creature {
  return {
    id: uid(),
    pos: {
      x: 100 + Math.random() * (MAP_W - 200),
      y: 100 + Math.random() * (MAP_H - 200),
    },
    vel: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 },
    radius: CREATURE_RADIUS,
    targetId: null,
  };
}

export function makePlayers(names: string[], isAI: boolean[]): Player[] {
  return names.map((name, i) => {
    const sideIdx = i % SIDES.length;
    const side = SIDES[sideIdx];
    const sideCount = names.filter((_, j) => j % SIDES.length === sideIdx).length;
    const sideIndex = names.slice(0, i).filter((_, j) => j % SIDES.length === sideIdx).length;
    return {
      id: uid(),
      name,
      pos: getSpawnPos(side, sideIndex, sideCount),
      vel: { x: 0, y: 0 },
      score: 0,
      plantGrowth: 0,
      side,
      color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      activePowerups: [],
      isAI: isAI[i] ?? false,
      isAlive: true,
      bitCooldown: 0,
    };
  });
}

// ─── Initial State (for local / vs-AI mode) ───────────────────────────────────
export function createInitialGameState(
  humanName: string,
  mode: "vs_ai" | "online",
  aiCount = 3
): GameState {
  const names = [humanName, ...Array.from({ length: aiCount }, (_, i) => `AI-${i + 1}`)];
  const isAI  = [false, ...Array(aiCount).fill(true)];

  const orbs = Array.from({ length: 30 }, makeOrb);
  const powerups = Array.from({ length: 5 }, makePowerup);
  const creatures = Array.from({ length: 3 }, makeCreature);

  return {
    phase: "playing",
    mode,
    players: makePlayers(names, isAI),
    orbs,
    powerups,
    creatures,
    tickRate: 60,
    mapWidth: MAP_W,
    mapHeight: MAP_H,
    timeLeft: GAME_DURATION,
    winner: null,
  };
}

// ─── Distance helper ─────────────────────────────────────────────────────────
export function dist(a: Vec2, b: Vec2) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
