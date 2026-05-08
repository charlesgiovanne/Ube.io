import React from "react";
import { useNavigate } from "react-router-dom";
import type { GameState } from "../../types";
import { PixelButton } from "../ui/PixelButton";
import { PixelCard } from "../ui/PixelCard";
import { useAppStore } from "../../stores/appStore";
import { gameSocket } from "../../lib/api";

interface GameOverProps {
  gameState: GameState;
  localPlayerId: string;
}

export function GameOver({ gameState, localPlayerId }: GameOverProps) {
  const navigate = useNavigate();
  const setGameState = useAppStore((s) => s.setGameState);
  const setLobby = useAppStore((s) => s.setLobby);
  const mode = useAppStore((s) => s.selectedMode);

  const sorted = [...gameState.players].sort((a, b) => b.score - a.score);
  const localPlayer = gameState.players.find((p) => p.id === localPlayerId);
  const rank = sorted.findIndex((p) => p.id === localPlayerId) + 1;
  const isWinner = gameState.winner === localPlayer?.name;

  const medals = ["🥇", "🥈", "🥉"];

  const handlePlayAgain = () => {
    gameSocket.disconnect();
    setGameState(null);
    if (mode === "vs_ai") {
      navigate("/game");
    } else {
      setLobby(null);
      navigate("/lobby");
    }
  };

  const handleMenu = () => {
    gameSocket.disconnect();
    setGameState(null);
    setLobby(null);
    navigate("/mode-select");
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50">
      <PixelCard glow className="w-full max-w-md mx-4">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="font-pixel text-[24px] mb-1"
            style={{ textShadow: "3px 3px 0 var(--color-ube-dark)" }}>
            {isWinner ? (
              <span className="text-[var(--color-accent)]">YOU WIN! 🎉</span>
            ) : (
              <span className="text-[var(--color-ube-light)]">GAME OVER</span>
            )}
          </div>
          <div className="font-pixel text-[8px] text-[var(--color-muted-foreground)]">
            {gameState.winner ? `${gameState.winner} wins!` : "Time's up!"}
          </div>
        </div>

        {/* Your result */}
        {localPlayer && (
          <div className="bg-[var(--color-secondary)] border-2 border-[var(--color-ube)] border-b-4 border-r-4 p-3 mb-4 text-center">
            <div className="font-pixel text-[8px] text-[var(--color-muted-foreground)] mb-1">YOUR RESULT</div>
            <div className="font-pixel text-[20px] text-[var(--color-accent)]">
              {medals[rank - 1] ?? `#${rank}`}
            </div>
            <div className="font-pixel text-[10px] text-[var(--color-foreground)]">{localPlayer.name}</div>
            <div className="font-pixel text-[8px] text-[var(--color-muted-foreground)] mt-1">
              Score: <span className="text-[var(--color-accent)]">{localPlayer.score}</span>
              &nbsp;• Plant: <span className="text-[var(--color-leaf)]">{Math.round(localPlayer.plantGrowth)}%</span>
            </div>
          </div>
        )}

        {/* Full leaderboard */}
        <div className="flex flex-col gap-1 mb-6">
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className={[
                "flex justify-between items-center px-3 py-1.5 border border-b-2 border-r-2",
                p.id === localPlayerId
                  ? "bg-purple-950/60 border-[var(--color-ube)]"
                  : "bg-[var(--color-secondary)] border-[var(--color-border)]",
              ].join(" ")}
            >
              <div className="flex items-center gap-2">
                <span className="font-pixel text-[8px]">{medals[i] ?? `${i + 1}.`}</span>
                <span className="font-pixel text-[8px]" style={{ color: p.color }}>{p.name}</span>
                {p.isAI && <span className="font-pixel text-[6px] text-[var(--color-muted-foreground)]">AI</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-pixel text-[7px] text-[var(--color-leaf)]">{Math.round(p.plantGrowth)}%</span>
                <span className="font-pixel text-[8px] text-[var(--color-accent)]">{p.score}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <PixelButton className="flex-1" onClick={handlePlayAgain}>
            ↺ Play Again
          </PixelButton>
          <PixelButton variant="secondary" className="flex-1" onClick={handleMenu}>
            ⌂ Menu
          </PixelButton>
        </div>
      </PixelCard>
    </div>
  );
}
