# 🫛 UBE GROW — Frontend

A pixel-art real-time multiplayer IO game built with **Vite + React + TypeScript + Tailwind CSS**.

---

## 📁 File Structure

```
ube-game/
├── index.html
├── vite.config.ts          # Dev proxy: /api & /ws → Go backend
├── .env.example            # VITE_API_URL, VITE_WS_URL
├── package.json
├── tsconfig*.json
│
└── src/
    ├── main.tsx            # ReactDOM root mount
    ├── App.tsx             # Thin wrapper — renders <AppRouter />
    ├── index.css           # Tailwind v4 + pixel font + CSS vars
    │
    ├── router.tsx          ◄──────────────────────────────────────
    │                          ★ ONLY FILE TO MODIFY FOR ROUTING ★
    │                          - All page routes defined here
    │                          - AuthGuard lives here
    │                          - Change paths here, not in pages
    │   ─────────────────────────────────────────────────────────
    │
    ├── lib/
    │   ├── api.ts          ◄──────────────────────────────────────
    │   │                      ★ ONLY FILE TO MODIFY FOR BACKEND ★
    │   │                      - registerPlayer()  POST /api/players
    │   │                      - unregisterPlayer() DELETE /api/players/:id
    │   │                      - createLobby()     POST /api/lobbies
    │   │                      - getLobby()        GET  /api/lobbies/:code
    │   │                      - GameSocket class  WS   /ws/:roomCode
    │   │                      - gameSocket singleton
    │   └── gameHelpers.ts  # Map constants, entity factories, math utils
    │
    ├── types/
    │   └── index.ts        # All shared TypeScript types & interfaces
    │
    ├── stores/
    │   └── appStore.ts     # Zustand store (user, lobby, gameState, mode)
    │                         Persists `user` to localStorage
    │
    ├── hooks/
    │   ├── useInput.ts          # Keyboard input → dx/dy ref (WASD/arrows)
    │   └── useLocalGameLoop.ts  # rAF game loop for vs_ai mode
    │
    ├── pages/
    │   ├── LandingPage.tsx      /          Name entry → registerPlayer()
    │   ├── ModeSelectPage.tsx   /mode-select  Pick Online vs VS AI
    │   ├── LobbyPage.tsx        /lobby     Create/join room, wait for players
    │   └── GamePage.tsx         /game      Canvas + HUD + game loop
    │
    └── components/
        ├── ui/
        │   ├── PixelButton.tsx  Reusable pixel-art button
        │   ├── PixelInput.tsx   Reusable pixel-art input
        │   └── PixelCard.tsx    Reusable pixel-art card
        │
        └── game/
            ├── GameCanvas.tsx   Canvas renderer (players, orbs, plants, creatures)
            ├── HUD.tsx          Timer, leaderboard, score, powerup timers
            ├── GameOver.tsx     End screen with rankings
            └── MobileJoystick.tsx  Touch joystick for mobile
```

---

## 🔌 Backend Integration Points

All backend communication is centralized in **`src/lib/api.ts`**.

### REST Endpoints Expected

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/players` | Register a player name → `{ id, name }` |
| `DELETE` | `/api/players/:id` | Unregister on logout |
| `POST` | `/api/lobbies` | Create lobby → `LobbyState` |
| `GET` | `/api/lobbies/:code` | Get lobby by room code |

### WebSocket `/ws/:roomCode?playerId=:id`

| Direction | Message Type | Payload |
|-----------|-------------|---------|
| Client → Server | `player_input` | `{ dx, dy, seq }` |
| Client → Server | `start_game` | `{ roomCode }` |
| Client → Server | `ping` | `{}` |
| Server → Client | `lobby_update` | `LobbyState` |
| Server → Client | `game_state` | `GameState` |
| Server → Client | `game_over` | `{ winner }` |
| Server → Client | `pong` | `{}` |

---

## 🎮 Game Features

- **Lobby**: Up to 10 players, host starts game immediately (no wait for full)
- **VS AI**: Fully local — 3 AI opponents, no server needed
- **Orbs**: 4 sizes (tiny/small/medium/large), random colors, different scores
- **Powerups**: ⚡ Speed, ✕2 Double score, 🧲 Magnet (pulls orbs toward you)
- **Creatures**: Red pixel monsters that chase players, deal -10 score on bite
- **Plants**: Grow on map edges; reflect each player's score as visual progress
- **Timer**: 2-minute games; biggest score wins
- **Mobile**: Touch joystick on mobile devices

---

## 🚀 Getting Started

```bash
cp .env.example .env.local
# Edit VITE_API_URL and VITE_WS_URL to point at your Go server

npm install
npm run dev
```

The Vite dev server proxies `/api` and `/ws` automatically (see `vite.config.ts`).

---

## 🌐 Production Build

```bash
npm run build
# Outputs to dist/ — serve as static files behind your Go server
```
