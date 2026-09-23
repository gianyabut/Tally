"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { initials } from "@/lib/names";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { FISCAL_YEAR } from "@/lib/types";
import { useOutsideClose } from "@/lib/useOutsideClose";
import { useAppData, useModal } from "./runtime";
import { Overlays } from "./overlays/Overlays";
import styles from "./AppShell.module.css";

const TABS = [
  { href: "/ledger", label: "Ledger" },
  { href: "/team", label: "Team" },
  { href: "/export", label: "Export" },
] as const;

function BellIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 1.5a4.2 4.2 0 0 0-4.2 4.2c0 3-1.3 4.3-1.3 4.3h11s-1.3-1.3-1.3-4.3A4.2 4.2 0 0 0 8 1.5zM6.5 12.5a1.6 1.6 0 0 0 3 0"
        stroke="var(--mut)"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TabIcon({ tab, color }: { tab: string; color: string }) {
  if (tab === "/ledger")
    return (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M3.5 2.5v11M7 2.5v11M10.5 2.5v11M2 13.5L14 3.5"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  if (tab === "/team")
    return (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="5.5" cy="5.5" r="2.4" stroke={color} strokeWidth="1.4" />
        <circle cx="11" cy="6.5" r="1.9" stroke={color} strokeWidth="1.4" />
        <path
          d="M1.5 13.5c.5-2.4 2-3.5 4-3.5s3.5 1.1 4 3.5M9.5 10.6c1.9.1 3.7 1 4.2 2.9"
          stroke={color}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    );
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 2v7M8 9l-2.8-2.8M8 9l2.8-2.8"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.5 10.5v2A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5v-2"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Avatar that opens a small menu (theme + sign out). Identical to the mockup at rest. */
function AvatarMenu({ name, mobile }: { name: string; mobile?: boolean }) {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  useOutsideClose(open, useCallback(() => setOpen(false), []));
  return (
    <div className={styles.avatarWrap} data-popover-root>
      <button
        type="button"
        className={mobile ? styles.mobAvatar : styles.avatar}
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
      >
        {initials(name)}
      </button>
      {open && (
        <>
          <div className={styles.menu} role="menu">
            <button
              type="button"
              role="menuitem"
              className={styles.menuItem}
              onClick={() => {
                toggleTheme();
                setOpen(false);
              }}
            >
              {theme === "dark" ? "LIGHT THEME" : "DARK THEME"}
            </button>
            <form action="/auth/signout" method="post">
              <button type="submit" role="menuitem" className={styles.menuItem}>
                SIGN OUT
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export function AppShell({
  name,
  active,
  children,
}: {
  name: string;
  /** Override the active tab (design previews render outside the real routes). */
  active?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { open, modal } = useModal();
  const { notifications } = useAppData();
  // While an overlay is open the page can't scroll, so pin the (normally
  // sticky) tab bar absolutely at the same spot: a sticky layer is composited,
  // and overlays painted over it would lose ClearType text.
  // The proof viewer is an opaque full-surface takeover, so the bar isn't
  // painted at all then.
  const barStyle: React.CSSProperties | undefined =
    modal.kind !== null
      ? {
          position: "absolute",
          left: 0,
          right: 0,
          top: `calc(${modal.top}px + 100dvh)`,
          bottom: "auto",
          transform: "translateY(-100%)",
          display: modal.kind === "proof" ? "none" : undefined,
        }
      : undefined;
  const hasNotif = notifications.length > 0;
  const current = active ?? pathname;
  const isActive = (href: string) =>
    current === href || current.startsWith(href + "/");

  return (
    <div className={styles.app}>
      {/* Desktop header */}
      <header className={styles.deskHeader}>
        <div className={styles.brand}>
          <Logo size={18} strokeWidth={2.4} />
          <span className={styles.deskBrandName}>TALLY</span>
        </div>
        <nav className={styles.nav}>
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`${styles.navLink} ${isActive(t.href) ? styles.navLinkActive : ""}`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <div className={styles.deskRight}>
          <button
            type="button"
            className={styles.bell}
            onClick={() => open("notif")}
            aria-label="Notifications"
          >
            <BellIcon size={15} />
            {hasNotif && <span className={styles.bellDot} />}
          </button>
          <button
            type="button"
            className={styles.cmdChip}
            onClick={() => open("palette")}
            aria-label="Quick actions"
          >
            ⌘K
          </button>
          <span className={styles.deskFy}>FY{FISCAL_YEAR}</span>
          <AvatarMenu name={name} />
        </div>
      </header>

      {/* Mobile header */}
      <header className={styles.mobHeader}>
        <div className={styles.brand}>
          <Logo size={16} strokeWidth={2.4} />
          <span className={styles.mobBrandName}>TALLY</span>
        </div>
        <div className={styles.mobRight}>
          <button
            type="button"
            className={styles.mobBell}
            onClick={() => open("notif")}
            aria-label="Notifications"
          >
            <BellIcon size={14} />
            {hasNotif && <span className={styles.mobBellDot} />}
          </button>
          <span className={styles.mobFy}>FY{FISCAL_YEAR}</span>
          <AvatarMenu name={name} mobile />
        </div>
      </header>

      <main className={styles.main}>{children}</main>

      {/* Mobile bottom bar + FAB */}
      <div className={styles.bottomWrap} style={barStyle}>
        <button
          type="button"
          className={styles.fab}
          onClick={() => open("palette")}
          aria-label="Quick actions"
        >
          ＋
        </button>
        <nav className={styles.bottomBar}>
          {TABS.map((t) => {
            const on = isActive(t.href);
            return (
              <Link key={t.href} href={t.href} className={styles.tab} aria-label={t.label}>
                <TabIcon tab={t.href} color={on ? "var(--ink)" : "var(--faint)"} />
                <span
                  className={styles.tick}
                  style={{ background: on ? "var(--ink)" : "transparent" }}
                />
              </Link>
            );
          })}
        </nav>
      </div>

      <Overlays />
    </div>
  );
}
