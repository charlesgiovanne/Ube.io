import React, { useEffect, useRef } from "react";
import type { GameState, Player, Vec2 } from "../../types";
import { ORB_RADII } from "../../types";
import { getPlantPos, MAP_W, MAP_H, PLAYER_RADIUS, CREATURE_RADIUS } from "../../lib/gameHelpers";

interface GameCanvasProps {
  gameState: GameState;
  localPlayerId: string;
}

const POWERUP_COLORS: Record<string, string> = {
  speed: "#60a5fa",
  double: "#fcd34d",
  magnet: "#c084fc",
};

const POWERUP_ICONS: Record<string, string> = {
  speed: "⚡",
  double: "✕2",
  magnet: "🧲",
};

export function GameCanvas({ gameState, localPlayerId }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    const { players, orbs, powerups, creatures, mapWidth, mapHeight } = gameState;

    // ── Clear ──────────────────────────────────────────────────────────────
    ctx.clearRect(0, 0, mapWidth, mapHeight);

    // ── Background ─────────────────────────────────────────────────────────
    ctx.fillStyle = "#1a0f2e";
    ctx.fillRect(0, 0, mapWidth, mapHeight);

    // Pixel grid
    ctx.strokeStyle = "rgba(139,92,246,0.07)";
    ctx.lineWidth = 1;
    for (let x = 0; x < mapWidth; x += 32) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, mapHeight); ctx.stroke();
    }
    for (let y = 0; y < mapHeight; y += 32) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(mapWidth, y); ctx.stroke();
    }

    // ── Border ─────────────────────────────────────────────────────────────
    ctx.strokeStyle = "#7c3aed";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, mapWidth - 4, mapHeight - 4);

    // ── Plant bases ────────────────────────────────────────────────────────
    players.forEach((p, i) => {
      const sideCount = players.filter((_, j) => j % 4 === i % 4).length;
      const sideIndex = players.slice(0, i).filter((_, j) => j % 4 === i % 4).length;
      const plantPos = getPlantPos(p.side, sideIndex, sideCount);

      drawPlant(ctx, plantPos, p.color, p.plantGrowth, p.name, p.id === localPlayerId);
    });

    // ── Orbs ───────────────────────────────────────────────────────────────
    orbs.forEach((orb) => {
      const r = ORB_RADII[orb.size];
      ctx.save();

      // Glow
      const grd = ctx.createRadialGradient(orb.pos.x, orb.pos.y, 0, orb.pos.x, orb.pos.y, r * 2.5);
      grd.addColorStop(0, orb.color + "88");
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(orb.pos.x, orb.pos.y, r * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Core pixel square
      ctx.fillStyle = orb.color;
      const s = r * 1.4;
      ctx.fillRect(Math.round(orb.pos.x - s / 2), Math.round(orb.pos.y - s / 2), Math.ceil(s), Math.ceil(s));

      // Inner highlight
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillRect(Math.round(orb.pos.x - s / 2), Math.round(orb.pos.y - s / 2), Math.ceil(s / 2), Math.ceil(s / 2));

      ctx.restore();
    });

    // ── Powerups ───────────────────────────────────────────────────────────
    powerups.forEach((pw) => {
      const color = POWERUP_COLORS[pw.type] ?? "#fff";
      ctx.save();

      // Pulsing ring
      const t = (Date.now() % 1000) / 1000;
      const ringR = 14 + t * 6;
      ctx.strokeStyle = color + "66";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pw.pos.x, pw.pos.y, ringR, 0, Math.PI * 2);
      ctx.stroke();

      // Box
      ctx.fillStyle = color + "33";
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.fillRect(pw.pos.x - 12, pw.pos.y - 12, 24, 24);
      ctx.strokeRect(pw.pos.x - 12, pw.pos.y - 12, 24, 24);

      // Icon
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(POWERUP_ICONS[pw.type] ?? "?", pw.pos.x, pw.pos.y);

      ctx.restore();
    });

    // ── Creatures ──────────────────────────────────────────────────────────
    creatures.forEach((c) => {
      ctx.save();

      // Danger aura
      const grd = ctx.createRadialGradient(c.pos.x, c.pos.y, 0, c.pos.x, c.pos.y, CREATURE_RADIUS * 3);
      grd.addColorStop(0, "rgba(239,68,68,0.25)");
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(c.pos.x, c.pos.y, CREATURE_RADIUS * 3, 0, Math.PI * 2);
      ctx.fill();

      // Body (pixel-art blob)
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(
        Math.round(c.pos.x - CREATURE_RADIUS),
        Math.round(c.pos.y - CREATURE_RADIUS),
        CREATURE_RADIUS * 2,
        CREATURE_RADIUS * 2
      );
      // Eyes
      ctx.fillStyle = "#fff";
      ctx.fillRect(Math.round(c.pos.x - 6), Math.round(c.pos.y - 6), 5, 5);
      ctx.fillRect(Math.round(c.pos.x + 2), Math.round(c.pos.y - 6), 5, 5);
      ctx.fillStyle = "#000";
      ctx.fillRect(Math.round(c.pos.x - 5), Math.round(c.pos.y - 5), 3, 3);
      ctx.fillRect(Math.round(c.pos.x + 3), Math.round(c.pos.y - 5), 3, 3);
      // Teeth
      ctx.fillStyle = "#fff";
      ctx.fillRect(Math.round(c.pos.x - 7), Math.round(c.pos.y + 4), 4, 4);
      ctx.fillRect(Math.round(c.pos.x - 1), Math.round(c.pos.y + 4), 4, 4);
      ctx.fillRect(Math.round(c.pos.x + 5), Math.round(c.pos.y + 4), 4, 4);

      ctx.restore();
    });

    // ── Players ────────────────────────────────────────────────────────────
    players.forEach((p) => {
      if (!p.isAlive) return;
      drawPlayer(ctx, p, p.id === localPlayerId);
    });

  }, [gameState, localPlayerId]);

  return (
    <canvas
      ref={canvasRef}
      width={MAP_W}
      height={MAP_H}
      className="max-w-full max-h-full object-contain"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

// ─── Draw helpers ─────────────────────────────────────────────────────────────

function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, isLocal: boolean) {
  const { pos, color, name, activePowerups, bitCooldown } = p;
  const r = PLAYER_RADIUS;

  ctx.save();

  // Bit flash
  const isFlashing = bitCooldown > 90;

  // Active powerup rings
  activePowerups.forEach((ap, idx) => {
    const c = POWERUP_COLORS[ap.type] ?? "#fff";
    ctx.strokeStyle = c + "99";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r + 6 + idx * 6, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Body
  ctx.fillStyle = isFlashing ? "#ef4444" : color;
  ctx.fillRect(Math.round(pos.x - r), Math.round(pos.y - r), r * 2, r * 2);

  // Highlight
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillRect(Math.round(pos.x - r), Math.round(pos.y - r), r, r);

  // Local player outline
  if (isLocal) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(Math.round(pos.x - r) - 1, Math.round(pos.y - r) - 1, r * 2 + 2, r * 2 + 2);
  }

  // Name tag
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  const tagW = name.length * 5.5 + 8;
  ctx.fillRect(Math.round(pos.x - tagW / 2), Math.round(pos.y - r - 16), tagW, 11);
  ctx.fillStyle = isLocal ? "#fcd34d" : "#fff";
  ctx.font = "6px 'Press Start 2P', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name.slice(0, 10), pos.x, pos.y - r - 10);

  ctx.restore();
}

function drawPlant(
  ctx: CanvasRenderingContext2D,
  pos: Vec2,
  color: string,
  growth: number,
  name: string,
  isLocal: boolean
) {
  const stages = Math.floor(growth / 20); // 0–5 stages
  const baseSize = 8 + stages * 4;

  ctx.save();

  // Glow for high growth
  if (growth > 60) {
    const grd = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, baseSize * 2);
    grd.addColorStop(0, color + "55");
    grd.addColorStop(1, "transparent");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, baseSize * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stem
  ctx.fillStyle = "#4ade80";
  ctx.fillRect(Math.round(pos.x - 2), Math.round(pos.y - baseSize), 4, baseSize + 4);

  // Leaves (pixel squares growing per stage)
  for (let s = 0; s <= stages; s++) {
    const leafSize = 4 + s * 2;
    const leafY = pos.y - 4 - s * 6;
    ctx.fillStyle = s % 2 === 0 ? "#4ade80" : "#86efac";
    ctx.fillRect(Math.round(pos.x - leafSize - 2), Math.round(leafY - leafSize / 2), leafSize, leafSize);
    ctx.fillRect(Math.round(pos.x + 2), Math.round(leafY - leafSize / 2), leafSize, leafSize);
  }

  // Ube bulb on top
  const bulbSize = 6 + stages * 2;
  ctx.fillStyle = isLocal ? "#d8b4fe" : color;
  ctx.fillRect(Math.round(pos.x - bulbSize / 2), Math.round(pos.y - baseSize - bulbSize), bulbSize, bulbSize);

  // Score indicator
  ctx.fillStyle = isLocal ? "#fcd34d" : "rgba(255,255,255,0.7)";
  ctx.font = "5px 'Press Start 2P', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${Math.round(growth)}%`, pos.x, pos.y + 10);

  ctx.restore();
}
