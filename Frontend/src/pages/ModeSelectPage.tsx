import React from "react";
import { useNavigate } from "react-router-dom";
import { PixelButton } from "../components/ui/PixelButton";
import { PixelCard } from "../components/ui/PixelCard";
import { useAppStore } from "../stores/appStore";
import { unregisterPlayer } from "../lib/api";

export default function ModeSelectPage() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const setMode = useAppStore((s) => s.setMode);
  const reset = useAppStore((s) => s.reset);

  const handleMode = (mode: "online" | "vs_ai") => {
    setMode(mode);
    navigate(mode === "vs_ai" ? "/game" : "/lobby");
  };

  const handleLogout = async () => {
    if (user) {
      try { await unregisterPlayer(user.id); } catch { /* offline ok */ }
    }
    reset();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative">
      <div
        className="pointer-events-none fixed inset-0 opacity-10"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,transparent,transparent 31px,var(--color-border) 32px)," +
            "repeating-linear-gradient(90deg,transparent,transparent 31px,var(--color-border) 32px)",
        }}
      />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="font-pixel text-[8px] text-[var(--color-ube-light)] tracking-widest mb-2">
            WELCOME BACK
          </div>
          <div className="font-pixel text-[18px] text-[var(--color-accent)]">
            {user?.name ?? "PLAYER"}
          </div>
        </div>

        <PixelCard>
          <div className="font-pixel text-[9px] text-[var(--color-muted-foreground)] text-center mb-6 uppercase tracking-widest">
            Select Mode
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => handleMode("online")}
              className="group relative bg-[var(--color-secondary)] border-2 border-[var(--color-ube)] border-b-4 border-r-4
                hover:bg-[var(--color-ube-dark)] transition-all duration-75 active:translate-y-[2px] active:shadow-none p-5 text-left"
            >
              <div className="font-pixel text-[11px] text-[var(--color-ube-light)] mb-2">🌐 Online</div>
              <div className="font-pixel text-[7px] text-[var(--color-muted-foreground)] leading-relaxed">
                Join a lobby with up to 10 real players.<br />
                First player to press Start begins the game.
              </div>
            </button>

            <button
              onClick={() => handleMode("vs_ai")}
              className="group relative bg-[var(--color-secondary)] border-2 border-[var(--color-leaf)] border-b-4 border-r-4
                hover:bg-green-950/60 transition-all duration-75 active:translate-y-[2px] active:shadow-none p-5 text-left"
            >
              <div className="font-pixel text-[11px] text-[var(--color-leaf)] mb-2">🤖 VS AI</div>
              <div className="font-pixel text-[7px] text-[var(--color-muted-foreground)] leading-relaxed">
                Play locally against 3 AI opponents.<br />
                No internet required — runs in browser.
              </div>
            </button>
          </div>
        </PixelCard>

        <div className="mt-6 flex justify-between items-center">
          <div className="font-pixel text-[7px] text-[var(--color-muted-foreground)]">
            Orbs • Powerups • Creatures
          </div>
          <PixelButton variant="danger" size="sm" onClick={handleLogout}>
            Logout
          </PixelButton>
        </div>
      </div>
    </div>
  );
}
