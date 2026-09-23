"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { FISCAL_YEAR } from "@/lib/types";
import { useAppData, useModal } from "./runtime";
import styles from "./AppShell.module.css";

type Tab = { href: string; label: string };
const TABS: Tab[] = [
  { href: "/ledger", label: "Ledger" },
  { href: "/team", label: "Team" },
  { href: "/export", label: "Export" },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function BellIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
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

export function AppShell({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { open } = useModal();
  const { notifications } = useAppData();
  const hasNotif = notifications.length > 0;
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  const avatar = initials(name);

  return (
    <div className={styles.app}>
      {/* Desktop header */}
      <header className={styles.deskHeader}>
        <div className={styles.brand}>
          <Logo size={18} strokeWidth={2.4} />
          <span className={styles.brandName}>TALLY</span>
        </div>
        <nav className={styles.nav}>
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`${styles.navLink} ${
                isActive(t.href) ? styles.navLinkActive : ""
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <div className={styles.deskRight}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => open("notif")}
            aria-label="Notifications"
          >
            <BellIcon />
            {hasNotif && <span className={styles.notifDot} />}
          </button>
          <button
            type="button"
            className={styles.cmdChip}
            onClick={() => open("palette")}
            title="Quick actions"
          >
            ⌘K
          </button>
          <span className={styles.fy}>FY{FISCAL_YEAR}</span>
          <div className={styles.avatar}>{avatar}</div>
        </div>
      </header>

      {/* Mobile header */}
      <header className={styles.mobHeader}>
        <div className={styles.brand}>
          <Logo size={16} strokeWidth={2.4} />
          <span className={styles.brandName}>TALLY</span>
        </div>
        <div className={styles.mobRight}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => open("notif")}
            aria-label="Notifications"
          >
            <BellIcon />
            {hasNotif && <span className={styles.notifDot} />}
          </button>
          <span className={styles.fy}>FY{FISCAL_YEAR}</span>
          <div className={styles.avatar}>{avatar}</div>
        </div>
      </header>

      <main className={styles.main}>{children}</main>

      {/* Mobile bottom bar + FAB */}
      <div className={styles.bottomWrap}>
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
            const active = isActive(t.href);
            const color = active ? "var(--ink)" : "var(--faint)";
            return (
              <Link key={t.href} href={t.href} className={styles.tab}>
                <TabIcon tab={t.href} color={color} />
                <span
                  className={`${styles.tick} ${active ? styles.tickActive : ""}`}
                />
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
