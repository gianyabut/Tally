"use client";

import { useTheme } from "@/lib/theme/ThemeProvider";

/**
 * Minimal mono theme switch, pinned bottom-right. Temporary affordance until
 * the in-app avatar menu carries theme selection.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 100,
        fontFamily: "var(--font-mono), monospace",
        fontSize: 10,
        letterSpacing: "0.16em",
        color: "var(--dim)",
        border: "1px solid var(--line)",
        borderRadius: 4,
        padding: "7px 10px",
        background: "var(--bg)",
      }}
    >
      {theme === "dark" ? "◐ LIGHT" : "◑ DARK"}
    </button>
  );
}
