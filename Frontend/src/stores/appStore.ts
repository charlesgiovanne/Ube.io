import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppUser, GameMode, GameState, LobbyState } from "../types";

interface AppStore {
  // ── Auth ──────────────────────────────────────────────────────
  user: AppUser | null;
  setUser: (u: AppUser | null) => void;

  // ── Mode ──────────────────────────────────────────────────────
  selectedMode: GameMode;
  setMode: (m: GameMode) => void;

  // ── Lobby ─────────────────────────────────────────────────────
  lobby: LobbyState | null;
  setLobby: (l: LobbyState | null) => void;

  // ── Game ──────────────────────────────────────────────────────
  gameState: GameState | null;
  setGameState: (g: GameState | null) => void;

  // ── Helpers ───────────────────────────────────────────────────
  reset: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),

      selectedMode: "online",
      setMode: (selectedMode) => set({ selectedMode }),

      lobby: null,
      setLobby: (lobby) => set({ lobby }),

      gameState: null,
      setGameState: (gameState) => set({ gameState }),

      reset: () =>
        set({ user: null, lobby: null, gameState: null, selectedMode: "online" }),
    }),
    {
      name: "ube-game-store",
      partialize: (s) => ({ user: s.user }), // only persist user
    }
  )
);
