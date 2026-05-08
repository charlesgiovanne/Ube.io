// ─── Game Entities ───────────────────────────────────────────────────────────

export type Vec2 = { x: number; y: number };

export type OrbSize = "tiny" | "small" | "medium" | "large";
export const ORB_SCORES: Record<OrbSize, number> = {
  tiny: 1,
  small: 3,
  medium: 7,
  large: 15,
};
export const ORB_RADII: Record<OrbSize, number> = {
  tiny: 5,
  small: 8,
  medium: 12,
  large: 18,
};

export type PowerupType = "speed" | "double" | "magnet";

export interface Orb {
  id: string;
  pos: Vec2;
  size: OrbSize;
  color: string;
}

export interface Powerup {
  id: string;
  pos: Vec2;
  type: PowerupType;
  expiresAt: number; // timestamp
}

export interface Creature {
  id: string;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  targetId: string | null;
}

export interface ActivePowerup {
  type: PowerupType;
  expiresAt: number;
}

export type PlayerSide = "left" | "right" | "top" | "bottom";

export interface Player {
  id: string;
  name: string;
  pos: Vec2;
  vel: Vec2;
  score: number;
  plantGrowth: number; // 0–100
  side: PlayerSide;
  color: string;
  activePowerups: ActivePowerup[];
  isAI: boolean;
  isAlive: boolean;
  bitCooldown: number; // frames until next creature bite
}

// ─── Game State ───────────────────────────────────────────────────────────────

export type GamePhase = "lobby" | "playing" | "ended";
export type GameMode = "online" | "vs_ai";

export interface GameState {
  phase: GamePhase;
  mode: GameMode;
  players: Player[];
  orbs: Orb[];
  powerups: Powerup[];
  creatures: Creature[];
  tickRate: number;
  mapWidth: number;
  mapHeight: number;
  timeLeft: number; // seconds
  winner: string | null;
}

// ─── Lobby ────────────────────────────────────────────────────────────────────

export interface LobbyPlayer {
  id: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
}

export interface LobbyState {
  roomCode: string;
  players: LobbyPlayer[];
  maxPlayers: number;
  mode: GameMode;
  countdown: number | null;
}

// ─── WebSocket Messages ───────────────────────────────────────────────────────

export type WsMessageType =
  | "join_lobby"
  | "lobby_update"
  | "start_game"
  | "game_state"
  | "player_input"
  | "game_over"
  | "error"
  | "ping"
  | "pong";

export interface WsMessage<T = unknown> {
  type: WsMessageType;
  payload: T;
}

export interface PlayerInput {
  dx: number;
  dy: number;
  seq: number;
}

// ─── App-Level ────────────────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  name: string;
}
