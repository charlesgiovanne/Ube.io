import React from "react";

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary:   "bg-[var(--color-primary)] text-white border-purple-900 hover:bg-purple-500 active:translate-y-[2px] active:shadow-none",
  secondary: "bg-[var(--color-secondary)] text-[var(--color-foreground)] border-[var(--color-border)] hover:bg-purple-900/60",
  danger:    "bg-[var(--color-destructive)] text-white border-red-900 hover:bg-red-500",
  ghost:     "bg-transparent text-[var(--color-muted-foreground)] border-transparent hover:text-white",
};

const sizes = {
  sm: "text-[8px] px-3 py-1.5",
  md: "text-[9px] px-5 py-2.5",
  lg: "text-[10px] px-7 py-3",
};

export function PixelButton({ variant = "primary", size = "md", className = "", children, ...props }: PixelButtonProps) {
  return (
    <button
      {...props}
      className={[
        "font-pixel border-2 border-b-4 border-r-4 transition-all duration-75 uppercase tracking-wide",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
