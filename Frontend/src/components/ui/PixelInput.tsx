import React from "react";

interface PixelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function PixelInput({ label, error, className = "", ...props }: PixelInputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="font-pixel text-[8px] text-[var(--color-muted-foreground)] uppercase tracking-widest">
          {label}
        </label>
      )}
      <input
        {...props}
        className={[
          "font-pixel text-[9px] bg-[var(--color-input)] border-2 border-[var(--color-border)] border-b-4 border-r-4",
          "text-[var(--color-foreground)] px-4 py-2.5 outline-none",
          "focus:border-[var(--color-primary)] placeholder:text-[var(--color-muted-foreground)]",
          "transition-colors",
          className,
        ].join(" ")}
      />
      {error && (
        <span className="font-pixel text-[7px] text-[var(--color-destructive)]">{error}</span>
      )}
    </div>
  );
}
