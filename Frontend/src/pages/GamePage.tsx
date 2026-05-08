import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { GameCanvas } from "../components/game/GameCanvas";
import { HUD } from "../components/game/HUD";
import { GameOver } from "../components/game/GameOver";
import { MobileJoystick } from "../components/game/MobileJoystick";
import { PixelButton } from "../components/ui/PixelButton";
import { useAppStore } from "../stores/appStore";
import { useLocalGameLoop } from "../hooks/useLocalGameLoop";
import { useInput } from "../hooks/useInput";
import { createInitialGameState } from "../lib/gameHelpers";
import { gameSocket, unregisterPlayer } from "../lib/api";
import type { GameState } from "../types";

export default function GamePage() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const mode = useAppStore((s) => s.selectedMode);
  const storedGame = useAppStore((s) => s.gameState);
  const setStoredGame = useAppStore((s) => s.setGameState);
  const setLobby = useAppStore((s) => s.setLobby);
  const lobby = useAppStore((s) => s.lobby);

  const [gameState, _setGameState] = useState<GameState | null>(null);
  const gameStateRef = useRef<GameState | null>(null);

  const setGameState = useCallback((updater: ((prev: GameState) => GameState) | GameState | null) => {
    _setGameState((prev) => {
      const next = typeof updater === "function" ? updater(prev!) : updater;
      gameStateRef.current = next;
      return next;
    });
  }, []);

  const inputRef = useInput();
  const [localPlayerId, setLocalPlayerId] = useState<string>("");
  const [showPause, setShowPause] = useState(false);
  const [isMobile] = useState(() => window.matchMedia("(pointer: coarse)").matches);

  // ── Initialize ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { navigate("/"); return; }

    if (mode === "vs_ai") {
      const gs = createInitialGameState(user.name, "vs_ai", 3);
      const humanPlayer = gs.players.find((p) => !p.isAI);
      setLocalPlayerId(humanPlayer?.id ?? gs.players[0].id);
      setGameState(gs);
    } else {
      // Online mode: use stored game state from WS, or navigate back
      if (storedGame) {
        setGameState(storedGame);
        const me = storedGame.players.find((p) => p.name === user.name);
        setLocalPlayerId(me?.id ?? storedGame.players[0].id);
      } else {
        navigate("/lobby");
        return;
      }

      // Listen for live updates
      const unsub = gameSocket.on<GameState>("game_state", (payload) => {
        setGameState(payload);
        const me = payload.players.find((p) => p.name === user.name);
        if (me) setLocalPlayerId(me.id);
      });
      return unsub;
    }
  }, []); // eslint-disable-line

  // ── Local game loop (only vs_ai) ─────────────────────────────────────────
  useLocalGameLoop(
    mode === "vs_ai" ? gameState : null,
    setGameState as (u: (p: GameState) => GameState) => void,
    inputRef
  );

  // ── Online: send input to server ──────────────────────────────────────────
  const seqRef = useRef(0);
  useEffect(() => {
    if (mode !== "online") return;
    const iv = setInterval(() => {
      if (!inputRef.current) return;
      const { dx, dy } = inputRef.current;
      gameSocket.sendInput({ dx, dy, seq: ++seqRef.current });
    }, 1000 / 20); // 20 Hz
    return () => clearInterval(iv);
  }, [mode, inputRef]);

  // ── Pause ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowPause((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleQuit = async () => {
    gameSocket.disconnect();
    setStoredGame(null);
    setLobby(null);
    navigate("/mode-select");
  };

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-pixel text-[var(--color-ube-light)] text-[10px] animate-pulse">
          Loading game...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)] overflow-hidden">
      {/* Canvas container */}
      <div className="relative w-full flex-1 flex items-center justify-center">
        <div className="relative" style={{ maxWidth: "100vw", maxHeight: "calc(100vh - 120px)" }}>
          <GameCanvas gameState={gameState} localPlayerId={localPlayerId} />
          <HUD gameState={gameState} localPlayerId={localPlayerId} />

          {/* Pause overlay */}
          {showPause && gameState.phase === "playing" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-40">
              <div className="bg-[var(--color-card)] border-2 border-[var(--color-ube)] border-b-4 border-r-4 p-8 text-center">
                <div className="font-pixel text-[14px] text-[var(--color-ube-light)] mb-6">PAUSED</div>
                <div className="flex flex-col gap-3">
                  <PixelButton onClick={() => setShowPause(false)}>▶ Resume</PixelButton>
                  <PixelButton variant="danger" onClick={handleQuit}>✕ Quit</PixelButton>
                </div>
              </div>
            </div>
          )}

          {/* Game Over */}
          {gameState.phase === "ended" && (
            <GameOver gameState={gameState} localPlayerId={localPlayerId} />
          )}
        </div>
      </div>

      {/* Mobile controls */}
      {isMobile && gameState.phase === "playing" && (
        <div className="flex items-center justify-between w-full px-8 py-4 shrink-0">
          <MobileJoystick inputRef={inputRef} />
          <PixelButton variant="secondary" size="sm" onClick={() => setShowPause(true)}>
            ⏸
          </PixelButton>
        </div>
      )}

      {/* Desktop ESC hint */}
      {!isMobile && gameState.phase === "playing" && (
        <div className="pb-2 font-pixel text-[7px] text-[var(--color-muted-foreground)]">
          ESC to pause
        </div>
      )}
    </div>
  );
}
