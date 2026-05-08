import React from "react";

interface PixelCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function PixelCard({ children, className = "", glow = false }: PixelCardProps) {
  return (
    <div
      className={[
        "bg-[var(--color-card)] border-2 border-[var(--color-border)] border-b-4 border-r-4 p-6",
        glow ? "shadow-[0_0_24px_4px_var(--color-ube)] " : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
