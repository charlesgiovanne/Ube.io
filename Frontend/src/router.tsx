/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  router.tsx — CENTRALIZED ROUTING                                        ║
 * ║                                                                          ║
 * ║  This is the ONLY file you need to modify for:                           ║
 * ║    • Adding/removing pages                                               ║
 * ║    • Changing route paths                                                ║
 * ║    • Adding auth guards                                                  ║
 * ║    • Wiring new backend-connected pages                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import React from "react";
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom";
import { useAppStore } from "./stores/appStore";

// ── Pages (lazy-loaded) ────────────────────────────────────────────────────
import LandingPage from "./pages/LandingPage";
import ModeSelectPage from "./pages/ModeSelectPage";
import LobbyPage from "./pages/LobbyPage";
import GamePage from "./pages/GamePage";

// ── Auth Guard ─────────────────────────────────────────────────────────────
/**
 * Wraps protected routes. Redirects to "/" if no user is found in the store.
 * Extend this to check tokens/session when integrating a real auth system.
 */
function AuthGuard() {
  const user = useAppStore((s) => s.user);
  if (!user) return <Navigate to="/" replace />;
  return <Outlet />;
}

// ── Router Definition ──────────────────────────────────────────────────────
/**
 * Route map:
 *
 *  /               → LandingPage      (public)  register name → POST /api/players
 *  /mode-select    → ModeSelectPage   (auth)    choose vs_ai or online
 *  /lobby          → LobbyPage        (auth)    POST /api/lobbies, GET /api/lobbies/:code
 *                                               WS  /ws/:roomCode?playerId=...
 *  /game           → GamePage         (auth)    WS  /ws/:roomCode for online
 *                                               local simulation for vs_ai
 */
const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    element: <AuthGuard />,
    children: [
      {
        path: "/mode-select",
        element: <ModeSelectPage />,
      },
      {
        path: "/lobby",
        element: <LobbyPage />,
      },
      {
        path: "/game",
        element: <GamePage />,
      },
    ],
  },
  // Catch-all: redirect unknown routes to landing
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

// ── App Entry with Router ──────────────────────────────────────────────────
export default function AppRouter() {
  return <RouterProvider router={router} />;
}
