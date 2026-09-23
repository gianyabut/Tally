"use client";

import { useTheme } from "@/lib/theme/ThemeProvider";

/**
 * Compact inline theme switch, sized to sit in a header row next to the bell /
 * ⌘K chip / avatar. Self-styled with tokens so it looks consistent anywhere.
 */
export function ThemeToggle({ size = 32 }: { size?: number }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      style={{
        width: size,
        height: size,
        display: "grid",
        placeItems: "center",
        border: "1px solid var(--line)",
        borderRadius: 4,
        color: "var(--dim)",
        background: "transparent",
        fontSize: 13,
        lineHeight: 1,
      }}
    >
      {theme === "dark" ? "◐" : "◑"}
    </button>
  );
}
