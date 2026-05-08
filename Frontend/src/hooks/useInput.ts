import { useEffect, useRef } from "react";

export interface InputState {
  dx: number;
  dy: number;
}

export function useInput(): React.RefObject<InputState> {
  const ref = useRef<InputState>({ dx: 0, dy: 0 });
  const keys = useRef(new Set<string>());

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keys.current.add(e.key);
      updateDir();
    };
    const onUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key);
      updateDir();
    };

    const updateDir = () => {
      let dx = 0, dy = 0;
      const k = keys.current;
      if (k.has("ArrowLeft")  || k.has("a") || k.has("A")) dx -= 1;
      if (k.has("ArrowRight") || k.has("d") || k.has("D")) dx += 1;
      if (k.has("ArrowUp")    || k.has("w") || k.has("W")) dy -= 1;
      if (k.has("ArrowDown")  || k.has("s") || k.has("S")) dy += 1;

      // normalize diagonal
      if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
      }

      ref.current = { dx, dy };
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  return ref;
}
