import React, { useRef, useCallback } from "react";
import type { InputState } from "../../hooks/useInput";

interface JoystickProps {
  inputRef: React.RefObject<InputState>;
}

export function MobileJoystick({ inputRef }: JoystickProps) {
  const baseRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const activeTouch = useRef<number | null>(null);

  const update = useCallback((clientX: number, clientY: number) => {
    const base = baseRef.current;
    const stick = stickRef.current;
    if (!base || !stick) return;

    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const maxR = rect.width / 2 - 20;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, maxR);
    const angle = Math.atan2(dy, dx);

    const sx = Math.cos(angle) * clampedDist;
    const sy = Math.sin(angle) * clampedDist;

    stick.style.transform = `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px))`;

    const norm = dist > 10 ? clampedDist / maxR : 0;
    if (inputRef.current) {
      inputRef.current.dx = Math.cos(angle) * norm;
      inputRef.current.dy = Math.sin(angle) * norm;
    }
  }, [inputRef]);

  const reset = useCallback(() => {
    if (stickRef.current) {
      stickRef.current.style.transform = "translate(-50%, -50%)";
    }
    if (inputRef.current) {
      inputRef.current.dx = 0;
      inputRef.current.dy = 0;
    }
    activeTouch.current = null;
  }, [inputRef]);

  return (
    <div
      ref={baseRef}
      className="relative w-32 h-32 rounded-full border-4 border-[var(--color-ube)] bg-[var(--color-card)]/60"
      onTouchStart={(e) => {
        if (activeTouch.current !== null) return;
        const t = e.changedTouches[0];
        activeTouch.current = t.identifier;
        update(t.clientX, t.clientY);
      }}
      onTouchMove={(e) => {
        for (const t of Array.from(e.changedTouches)) {
          if (t.identifier === activeTouch.current) update(t.clientX, t.clientY);
        }
      }}
      onTouchEnd={(e) => {
        for (const t of Array.from(e.changedTouches)) {
          if (t.identifier === activeTouch.current) reset();
        }
      }}
    >
      {/* Crosshair */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <div className="w-full h-[1px] bg-[var(--color-ube)]" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <div className="h-full w-[1px] bg-[var(--color-ube)]" />
      </div>

      {/* Stick */}
      <div
        ref={stickRef}
        className="absolute top-1/2 left-1/2 w-12 h-12 rounded-full bg-[var(--color-ube)] border-2 border-[var(--color-ube-light)] opacity-80"
        style={{ transform: "translate(-50%, -50%)" }}
      />
    </div>
  );
}
