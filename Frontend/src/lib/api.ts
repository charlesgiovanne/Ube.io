/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  api.ts — SINGLE SOURCE OF TRUTH for all backend comms      ║
 * ║  Change VITE_API_URL / VITE_WS_URL env vars to point        ║
 * ║  at your Go server. Nothing else needs changing.            ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import type {
  WsMessage,
  WsMessageType,
  AppUser,
  LobbyState,
  PlayerInput,
  GameMode,
} from "../types";

// ─── Config ───────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
const WS_BASE  = import.meta.env.VITE_WS_URL  ?? "ws://localhost:8080";

// ─── REST Endpoints ───────────────────────────────────────────────────────────

/** Register a new player name. Returns the created user (id + name). */
export async function registerPlayer(name: string): Promise<AppUser> {
  const res = await fetch(`${API_BASE}/api/players`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Delete player from backend (logout). */
export async function unregisterPlayer(id: string): Promise<void> {
  await fetch(`${API_BASE}/api/players/${id}`, { method: "DELETE" });
}

/** Create a new lobby room. Returns lobby state with roomCode. */
export async function createLobby(
  hostId: string,
  mode: GameMode
): Promise<LobbyState> {
  const res = await fetch(`${API_BASE}/api/lobbies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hostId, mode }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Fetch lobby info by room code. */
export async function getLobby(roomCode: string): Promise<LobbyState> {
  const res = await fetch(`${API_BASE}/api/lobbies/${roomCode}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ─── WebSocket ────────────────────────────────────────────────────────────────

type Listener<T = unknown> = (payload: T) => void;

export class GameSocket {
  private ws: WebSocket | null = null;
  private listeners = new Map<WsMessageType, Set<Listener>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  /** Open connection to the game room. */
  connect(roomCode: string, playerId: string): void {
    this.shouldReconnect = true;
    this._open(roomCode, playerId);
  }

  private _open(roomCode: string, playerId: string) {
    const url = `${WS_BASE}/ws/${roomCode}?playerId=${playerId}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.info("[WS] connected");
      this.pingInterval = setInterval(() => this.send("ping", {}), 20_000);
    };

    this.ws.onmessage = (e) => {
      try {
        const msg: WsMessage = JSON.parse(e.data);
        this.dispatch(msg.type, msg.payload);
      } catch {
        console.warn("[WS] bad message", e.data);
      }
    };

    this.ws.onclose = () => {
      console.warn("[WS] closed");
      if (this.pingInterval) clearInterval(this.pingInterval);
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(
          () => this._open(roomCode, playerId),
          2_000
        );
      }
    };

    this.ws.onerror = (err) => console.error("[WS] error", err);
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.ws?.close();
    this.ws = null;
  }

  send<T>(type: WsMessageType, payload: T): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  sendInput(input: PlayerInput): void {
    this.send("player_input", input);
  }

  on<T>(type: WsMessageType, fn: Listener<T>): () => void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    (this.listeners.get(type) as Set<Listener>).add(fn as Listener);
    return () => (this.listeners.get(type) as Set<Listener>)?.delete(fn as Listener);
  }

  private dispatch(type: WsMessageType, payload: unknown) {
    this.listeners.get(type)?.forEach((fn) => fn(payload));
  }
}

/** Singleton socket shared across the app. */
export const gameSocket = new GameSocket();
