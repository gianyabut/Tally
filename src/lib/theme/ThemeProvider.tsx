"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "tally-theme";

/**
 * The current theme lives on <html data-t>, set before paint by the no-flash
 * script and mutated by the toggle. We treat that attribute as an external
 * store and subscribe to it with useSyncExternalStore — this reads the real
 * value on the client while rendering "dark" on the server/first paint, so
 * there's no hydration mismatch and no setState-in-effect.
 */
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-t") === "light"
    ? "light"
    : "dark";
}

function getServerSnapshot(): Theme {
  return "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-t", theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* storage may be unavailable (private mode) — ignore */
  }
  emit();
}

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const setTheme = useCallback((t: Theme) => applyTheme(t), []);
  const toggleTheme = useCallback(
    () => applyTheme(getSnapshot() === "dark" ? "light" : "dark"),
    [],
  );
  return { theme, setTheme, toggleTheme };
}

/**
 * Inline script that applies the stored theme before first paint, avoiding a
 * flash of the wrong theme. Rendered in <head>.
 */
export const themeNoFlashScript = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");document.documentElement.setAttribute("data-t",t==="light"?"light":"dark");}catch(e){document.documentElement.setAttribute("data-t","dark");}})();`;
