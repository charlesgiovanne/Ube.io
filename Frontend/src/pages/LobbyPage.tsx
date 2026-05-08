import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PixelButton } from "../components/ui/PixelButton";
import { PixelCard } from "../components/ui/PixelCard";
import { PixelInput } from "../components/ui/PixelInput";
import { useAppStore } from "../stores/appStore";
import { createLobby, getLobby, gameSocket } from "../lib/api";
import type { LobbyState, GameState } from "../types";

export default function LobbyPage() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const setLobby = useAppStore((s) => s.setLobby);
  const setGameState = useAppStore((s) => s.setGameState);
  const lobby = useAppStore((s) => s.lobby);

  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [localLobby, setLocalLobby] = useState<LobbyState | null>(lobby);

  useEffect(() => {
    if (!user) { navigate("/"); return; }

    // Listen for lobby updates over WebSocket
    const unsub1 = gameSocket.on<LobbyState>("lobby_update", (payload) => {
      setLocalLobby(payload);
      setLobby(payload);
    });

    // Game starts
    const unsub2 = gameSocket.on<GameState>("game_state", (payload) => {
      setGameState(payload);
      navigate("/game");
    });

    return () => { unsub1(); unsub2(); };
  }, [user, navigate, setLobby, setGameState]);

  const handleCreate = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const newLobby = await createLobby(user.id, "online");
      setLocalLobby(newLobby);
      setLobby(newLobby);
      gameSocket.connect(newLobby.roomCode, user.id);
    } catch {
      // Offline fallback: create a mock lobby
      const mockLobby: LobbyState = {
        roomCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
        players: [{ id: user.id, name: user.name, isReady: false, isHost: true }],
        maxPlayers: 10,
        mode: "online",
        countdown: null,
      };
      setLocalLobby(mockLobby);
      setLobby(mockLobby);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user || !joinCode.trim()) return;
    setLoading(true);
    setError("");
    try {
      const found = await getLobby(joinCode.trim().toUpperCase());
      setLocalLobby(found);
      setLobby(found);
      gameSocket.connect(found.roomCode, user.id);
    } catch {
      setError("Lobby not found!");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (!localLobby) return;
    gameSocket.send("start_game", { roomCode: localLobby.roomCode });
    // Offline fallback: navigate directly
    if (!localLobby.roomCode.startsWith("WS")) {
      navigate("/game");
    }
  };

  const isHost = localLobby?.players.find((p) => p.id === user?.id)?.isHost ?? false;

  if (!localLobby) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div
          className="pointer-events-none fixed inset-0 opacity-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,transparent,transparent 31px,var(--color-border) 32px)," +
              "repeating-linear-gradient(90deg,transparent,transparent 31px,var(--color-border) 32px)",
          }}
        />
        <PixelCard className="w-full max-w-sm relative z-10" glow>
          <div className="font-pixel text-[10px] text-center mb-6 text-[var(--color-ube-light)]">
            ONLINE LOBBY
          </div>

          <div className="flex flex-col gap-4">
            <PixelButton size="lg" className="w-full" onClick={handleCreate} disabled={loading}>
              ✦ Create Lobby
            </PixelButton>

            <div className="font-pixel text-[7px] text-[var(--color-muted-foreground)] text-center">— or join —</div>

            <PixelInput
              placeholder="ROOM CODE"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              maxLength={8}
              className="w-full text-center tracking-widest"
              error={error}
            />

            <PixelButton variant="secondary" size="lg" className="w-full" onClick={handleJoin} disabled={loading || !joinCode}>
              → Join Room
            </PixelButton>
          </div>

          <div className="mt-4">
            <PixelButton variant="ghost" size="sm" className="w-full" onClick={() => navigate("/mode-select")}>
              ← Back
            </PixelButton>
          </div>
        </PixelCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div
        className="pointer-events-none fixed inset-0 opacity-10"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,transparent,transparent 31px,var(--color-border) 32px)," +
            "repeating-linear-gradient(90deg,transparent,transparent 31px,var(--color-border) 32px)",
        }}
      />
      <PixelCard className="w-full max-w-md relative z-10" glow>
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="font-pixel text-[8px] text-[var(--color-muted-foreground)]">ROOM CODE</div>
            <div className="font-pixel text-[18px] text-[var(--color-accent)] tracking-widest">
              {localLobby.roomCode}
            </div>
          </div>
          <div className="font-pixel text-[8px] text-[var(--color-muted-foreground)]">
            {localLobby.players.length}/{localLobby.maxPlayers}
          </div>
        </div>

        {/* Player list */}
        <div className="flex flex-col gap-2 mb-6">
          {localLobby.players.map((p) => (
            <div
              key={p.id}
              className="flex justify-between items-center bg-[var(--color-secondary)] border border-[var(--color-border)] px-3 py-2"
            >
              <div className="font-pixel text-[8px] text-[var(--color-foreground)]">
                {p.isHost ? "👑 " : "◦ "}{p.name}
              </div>
              {p.id === user?.id && (
                <div className="font-pixel text-[7px] text-[var(--color-ube-light)]">YOU</div>
              )}
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: localLobby.maxPlayers - localLobby.players.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center bg-[var(--color-secondary)] border border-dashed border-[var(--color-border)] px-3 py-2 opacity-30"
            >
              <div className="font-pixel text-[8px] text-[var(--color-muted-foreground)]">— waiting...</div>
            </div>
          ))}
        </div>

        {localLobby.countdown !== null && (
          <div className="text-center font-pixel text-[20px] text-[var(--color-accent)] mb-4 animate-pulse">
            Starting in {localLobby.countdown}...
          </div>
        )}

        {isHost ? (
          <PixelButton size="lg" className="w-full" onClick={handleStart}>
            ▶ Start Game ({localLobby.players.length} players)
          </PixelButton>
        ) : (
          <div className="font-pixel text-[8px] text-[var(--color-muted-foreground)] text-center">
            Waiting for host to start...
          </div>
        )}

        <div className="mt-4">
          <PixelButton variant="ghost" size="sm" className="w-full" onClick={() => { setLobby(null); setLocalLobby(null); }}>
            ← Leave Lobby
          </PixelButton>
        </div>
      </PixelCard>
    </div>
  );
}
