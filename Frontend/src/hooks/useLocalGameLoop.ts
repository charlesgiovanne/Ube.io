import { useEffect, useRef, useCallback } from "react";
import type { GameState, Vec2, Player } from "../types";
import { ORB_RADII, ORB_SCORES } from "../types";
import {
  MAP_W, MAP_H, PLAYER_RADIUS, CREATURE_RADIUS,
  CREATURE_BITE_PENALTY, CREATURE_BITE_COOLDOWN,
  dist, clamp, makeOrb, makePowerup, makeCreature,
  getPlantPos,
} from "../lib/gameHelpers";

const SPEED_BASE = 2.8;
const SPEED_BOOST = 5.2;
const MAGNET_RANGE = 120;
const POWERUP_DURATION = 8_000;
const MAX_ORBS = 35;
const MAX_POWERUPS = 6;
const MAX_CREATURES = 4;

type SetState = (updater: (prev: GameState) => GameState) => void;

export function useLocalGameLoop(
  gameState: GameState | null,
  setGameState: SetState,
  inputRef: React.RefObject<{ dx: number; dy: number }>
) {
  const frameRef = useRef<number>();
  const lastTickRef = useRef(performance.now());
  const secondTimerRef = useRef(0);

  const tick = useCallback(() => {
    const now = performance.now();
    const dt = Math.min((now - lastTickRef.current) / (1000 / 60), 3);
    lastTickRef.current = now;

    setGameState((gs) => {
      if (!gs || gs.phase !== "playing") return gs;

      // ── Clone mutable parts ──────────────────────────────────────────────
      let players = gs.players.map((p) => ({ ...p, activePowerups: [...p.activePowerups] }));
      let orbs = [...gs.orbs];
      let powerups = [...gs.powerups];
      let creatures = gs.creatures.map((c) => ({ ...c }));
      let timeLeft = gs.timeLeft;

      // ── Timer ─────────────────────────────────────────────────────────────
      secondTimerRef.current += dt;
      if (secondTimerRef.current >= 60) {
        secondTimerRef.current -= 60;
        timeLeft = Math.max(0, timeLeft - 1);
      }

      // ── Move players ──────────────────────────────────────────────────────
      players = players.map((p, i) => {
        if (!p.isAlive) return p;

        const isHuman = i === 0 && !p.isAI;
        let dx = 0, dy = 0;

        if (isHuman && inputRef.current) {
          dx = inputRef.current.dx;
          dy = inputRef.current.dy;
        } else if (p.isAI) {
          // AI: chase nearest orb
          let best: { d: number; pos: Vec2 } | null = null;
          for (const orb of orbs) {
            const d = dist(p.pos, orb.pos);
            if (!best || d < best.d) best = { d, pos: orb.pos };
          }
          if (best) {
            const angle = Math.atan2(best.pos.y - p.pos.y, best.pos.x - p.pos.x);
            dx = Math.cos(angle);
            dy = Math.sin(angle);
          }
        }

        const hasSpeed = p.activePowerups.some((ap) => ap.type === "speed" && ap.expiresAt > Date.now());
        const speed = (hasSpeed ? SPEED_BOOST : SPEED_BASE) * dt;

        const newPos = {
          x: clamp(p.pos.x + dx * speed, PLAYER_RADIUS, MAP_W - PLAYER_RADIUS),
          y: clamp(p.pos.y + dy * speed, PLAYER_RADIUS, MAP_H - PLAYER_RADIUS),
        };

        // expire powerups
        const activePowerups = p.activePowerups.filter((ap) => ap.expiresAt > Date.now());

        // magnet: pull orbs
        const hasMagnet = activePowerups.some((ap) => ap.type === "magnet");
        if (hasMagnet) {
          orbs = orbs.map((orb) => {
            const d = dist(newPos, orb.pos);
            if (d < MAGNET_RANGE && d > 1) {
              const angle = Math.atan2(newPos.y - orb.pos.y, newPos.x - orb.pos.x);
              return { ...orb, pos: { x: orb.pos.x + Math.cos(angle) * 2 * dt, y: orb.pos.y + Math.sin(angle) * 2 * dt } };
            }
            return orb;
          });
        }

        return { ...p, pos: newPos, activePowerups, bitCooldown: Math.max(0, p.bitCooldown - 1) };
      });

      // ── Collect orbs ──────────────────────────────────────────────────────
      const collectedOrbIds = new Set<string>();
      players = players.map((p) => {
        if (!p.isAlive) return p;
        let score = p.score;
        let plantGrowth = p.plantGrowth;
        const hasDouble = p.activePowerups.some((ap) => ap.type === "double" && ap.expiresAt > Date.now());

        for (const orb of orbs) {
          if (collectedOrbIds.has(orb.id)) continue;
          if (dist(p.pos, orb.pos) < PLAYER_RADIUS + ORB_RADII[orb.size]) {
            collectedOrbIds.add(orb.id);
            const pts = ORB_SCORES[orb.size] * (hasDouble ? 2 : 1);
            score += pts;
            plantGrowth = Math.min(100, plantGrowth + pts * 0.5);
          }
        }
        return { ...p, score, plantGrowth };
      });
      orbs = orbs.filter((o) => !collectedOrbIds.has(o.id));

      // ── Collect powerups ──────────────────────────────────────────────────
      const collectedPwIds = new Set<string>();
      const now2 = Date.now();
      players = players.map((p) => {
        if (!p.isAlive) return p;
        let activePowerups = [...p.activePowerups];
        for (const pw of powerups) {
          if (collectedPwIds.has(pw.id)) continue;
          if (dist(p.pos, pw.pos) < PLAYER_RADIUS + 14) {
            collectedPwIds.add(pw.id);
            activePowerups = [...activePowerups.filter((a) => a.type !== pw.type), { type: pw.type, expiresAt: now2 + POWERUP_DURATION }];
          }
        }
        return { ...p, activePowerups };
      });
      powerups = powerups.filter((pw) => !collectedPwIds.has(pw.id) && pw.expiresAt > now2);

      // ── Move creatures ────────────────────────────────────────────────────
      creatures = creatures.map((c) => {
        // find nearest alive player
        let nearest: Player | null = null;
        let nearestD = Infinity;
        for (const p of players) {
          if (!p.isAlive) continue;
          const d = dist(c.pos, p.pos);
          if (d < nearestD) { nearestD = d; nearest = p; }
        }

        let { vel } = c;
        if (nearest && nearestD < 200) {
          const angle = Math.atan2(nearest.pos.y - c.pos.y, nearest.pos.x - c.pos.x);
          vel = { x: Math.cos(angle) * 2.2, y: Math.sin(angle) * 2.2 };
        } else {
          // wander
          vel = {
            x: clamp(vel.x + (Math.random() - 0.5) * 0.3, -1.8, 1.8),
            y: clamp(vel.y + (Math.random() - 0.5) * 0.3, -1.8, 1.8),
          };
        }

        const pos = {
          x: clamp(c.pos.x + vel.x * dt, CREATURE_RADIUS, MAP_W - CREATURE_RADIUS),
          y: clamp(c.pos.y + vel.y * dt, CREATURE_RADIUS, MAP_H - CREATURE_RADIUS),
        };

        return { ...c, pos, vel };
      });

      // ── Creature bites ────────────────────────────────────────────────────
      players = players.map((p) => {
        if (!p.isAlive || p.bitCooldown > 0) return p;
        for (const c of creatures) {
          if (dist(p.pos, c.pos) < PLAYER_RADIUS + CREATURE_RADIUS) {
            return {
              ...p,
              score: Math.max(0, p.score - CREATURE_BITE_PENALTY),
              plantGrowth: Math.max(0, p.plantGrowth - 5),
              bitCooldown: CREATURE_BITE_COOLDOWN,
            };
          }
        }
        return p;
      });

      // ── Spawn new entities ────────────────────────────────────────────────
      if (orbs.length < MAX_ORBS && Math.random() < 0.05 * dt) orbs = [...orbs, makeOrb()];
      if (powerups.length < MAX_POWERUPS && Math.random() < 0.01 * dt) powerups = [...powerups, makePowerup()];
      if (creatures.length < MAX_CREATURES && Math.random() < 0.003 * dt) creatures = [...creatures, makeCreature()];

      // ── Check end ─────────────────────────────────────────────────────────
      let phase = gs.phase;
      let winner = gs.winner;
      if (timeLeft <= 0) {
        phase = "ended";
        const top = [...players].sort((a, b) => b.score - a.score)[0];
        winner = top?.name ?? null;
      }

      return { ...gs, players, orbs, powerups, creatures, timeLeft, phase, winner };
    });

    frameRef.current = requestAnimationFrame(tick);
  }, [setGameState, inputRef]);

  useEffect(() => {
    if (!gameState || gameState.phase !== "playing") return;
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [gameState?.phase, tick]);
}
