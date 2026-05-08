import React from "react";
import type { GameState } from "../../types";

interface HUDProps {
  gameState: GameState;
  localPlayerId: string;
}

const POWERUP_ICONS: Record<string, string> = {
  speed: "⚡",
  double: "✕2",
  magnet: "🧲",
};

const POWERUP_COLORS: Record<string, string> = {
  speed: "#60a5fa",
  double: "#fcd34d",
  magnet: "#c084fc",
};

export function HUD({ gameState, localPlayerId }: HUDProps) {
  const { players, timeLeft } = gameState;

  const sorted = [...players].sort((a, b) => b.score - a.score);
  const localPlayer = players.find((p) => p.id === localPlayerId);

  const mins = Math.floor(timeLeft / 60);
  const secs = String(timeLeft % 60).padStart(2, "0");
  const isUrgent = timeLeft <= 30;

  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {/* ── Timer ── */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2">
        <div
          className={[
            "font-pixel text-[14px] px-4 py-1 border-2 border-b-4 border-r-4",
            isUrgent
              ? "bg-red-950 border-red-600 text-red-300 animate-pulse"
              : "bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-accent)]",
          ].join(" ")}
        >
          {mins}:{secs}
        </div>
      </div>

      {/* ── Leaderboard (top-right) ── */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 min-w-[120px]">
        {sorted.slice(0, 5).map((p, i) => (
          <div
            key={p.id}
            className={[
              "flex justify-between items-center px-2 py-1 border border-b-2 border-r-2",
              p.id === localPlayerId
                ? "bg-purple-950/80 border-[var(--color-ube)]"
                : "bg-[var(--color-card)]/80 border-[var(--color-border)]",
            ].join(" ")}
          >
            <span className="font-pixel text-[7px]" style={{ color: p.id === localPlayerId ? "#fcd34d" : p.color }}>
              {i + 1}. {p.name.slice(0, 8)}
            </span>
            <span className="font-pixel text-[7px] text-[var(--color-accent)] ml-2">
              {p.score}
            </span>
          </div>
        ))}
      </div>

      {/* ── Local player status (bottom) ── */}
      {localPlayer && (
        <div className="absolute bottom-3 left-3 flex flex-col gap-2">
          {/* Score */}
          <div className="bg-[var(--color-card)]/90 border-2 border-[var(--color-ube)] border-b-4 border-r-4 px-3 py-2">
            <div className="font-pixel text-[7px] text-[var(--color-muted-foreground)]">SCORE</div>
            <div className="font-pixel text-[14px] text-[var(--color-accent)]">{localPlayer.score}</div>
          </div>

          {/* Plant growth bar */}
          <div className="bg-[var(--color-card)]/90 border-2 border-[var(--color-border)] border-b-4 border-r-4 px-3 py-2 min-w-[100px]">
            <div className="font-pixel text-[7px] text-[var(--color-muted-foreground)] mb-1">PLANT</div>
            <div className="h-2 bg-[var(--color-secondary)] border border-[var(--color-border)]">
              <div
                className="h-full bg-[var(--color-leaf)] transition-all duration-300"
                style={{ width: `${localPlayer.plantGrowth}%` }}
              />
            </div>
            <div className="font-pixel text-[6px] text-[var(--color-leaf)] mt-1">
              {Math.round(localPlayer.plantGrowth)}%
            </div>
          </div>

          {/* Active powerups */}
          {localPlayer.activePowerups.length > 0 && (
            <div className="flex gap-1">
              {localPlayer.activePowerups.map((ap) => {
                const remaining = Math.max(0, Math.ceil((ap.expiresAt - Date.now()) / 1000));
                return (
                  <div
                    key={ap.type}
                    className="bg-[var(--color-card)]/90 border-2 border-b-4 border-r-4 px-2 py-1 flex flex-col items-center"
                    style={{ borderColor: POWERUP_COLORS[ap.type] }}
                  >
                    <span className="text-[10px]">{POWERUP_ICONS[ap.type]}</span>
                    <span className="font-pixel text-[6px]" style={{ color: POWERUP_COLORS[ap.type] }}>
                      {remaining}s
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Controls hint (bottom-right) ── */}
      <div className="absolute bottom-3 right-3">
        <div className="bg-[var(--color-card)]/70 border border-[var(--color-border)] px-2 py-1">
          <div className="font-pixel text-[6px] text-[var(--color-muted-foreground)]">WASD / ↑↓←→ to move</div>
        </div>
      </div>
    </div>
  );
}
