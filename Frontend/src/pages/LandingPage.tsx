import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PixelButton } from "../components/ui/PixelButton";
import { PixelInput } from "../components/ui/PixelInput";
import { PixelCard } from "../components/ui/PixelCard";
import { useAppStore } from "../stores/appStore";
import { registerPlayer } from "../lib/api";

export default function LandingPage() {
  const navigate = useNavigate();
  const setUser = useAppStore((s) => s.setUser);
  const existingUser = useAppStore((s) => s.user);

  const [name, setName] = useState(existingUser?.name ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError("Name cannot be empty!"); return; }
    if (trimmed.length > 16) { setError("Max 16 characters!"); return; }

    setLoading(true);
    setError("");

    try {
      // Try backend — fall back to local if server is offline
      let user;
      try {
        user = await registerPlayer(trimmed);
      } catch {
        user = { id: `local-${Date.now()}`, name: trimmed };
      }
      setUser(user);
      navigate("/mode-select");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not connect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Pixel grid bg */}
      <div
        className="pointer-events-none fixed inset-0 opacity-10"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,transparent,transparent 31px,var(--color-border) 32px)," +
            "repeating-linear-gradient(90deg,transparent,transparent 31px,var(--color-border) 32px)",
        }}
      />

      {/* Floating ube sprites */}
      <div className="pointer-events-none fixed inset-0">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute text-3xl animate-bounce"
            style={{
              left: `${10 + i * 12}%`,
              top: `${10 + (i % 3) * 30}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${2 + i * 0.3}s`,
              opacity: 0.25 + (i % 3) * 0.15,
            }}
          >
            🫛
          </div>
        ))}
      </div>

      {/* Title */}
      <div className="mb-10 text-center relative z-10">
        <div className="font-pixel text-[var(--color-ube-light)] text-[10px] tracking-widest mb-3 opacity-80">
          ✦ WELCOME TO ✦
        </div>
        <h1 className="font-pixel text-[28px] md:text-[36px] leading-tight"
          style={{ textShadow: "4px 4px 0 var(--color-ube-dark), 8px 8px 0 rgba(0,0,0,0.4)" }}>
          <span className="text-[var(--color-ube-light)]">UBE</span>
          <span className="text-[var(--color-accent)]"> GROW</span>
        </h1>
        <div className="font-pixel text-[8px] text-[var(--color-muted-foreground)] mt-3 tracking-widest">
          PLANT • COLLECT • CONQUER
        </div>
      </div>

      {/* Card */}
      <PixelCard glow className="w-full max-w-sm relative z-10">
        <div className="font-pixel text-[9px] text-[var(--color-muted-foreground)] mb-6 uppercase tracking-widest text-center">
          Enter Your Name
        </div>

        <PixelInput
          placeholder="PLAYER_001"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          maxLength={16}
          error={error}
          className="w-full text-center"
        />

        <div className="mt-6">
          <PixelButton
            size="lg"
            className="w-full"
            onClick={handleJoin}
            disabled={loading}
          >
            {loading ? "Connecting..." : "▶ Start"}
          </PixelButton>
        </div>

        <div className="mt-4 text-center font-pixel text-[7px] text-[var(--color-muted-foreground)]">
          Your name will auto-delete after 24 hours
        </div>
      </PixelCard>
    </div>
  );
}
