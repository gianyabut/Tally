"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/types";
import type { Invite, TeamMember } from "@/lib/data/team";
import { fmt } from "@/lib/ledger/view";
import { shortName } from "@/lib/names";
import { useOutsideClose } from "@/lib/useOutsideClose";
import { useAppData, useModal, useToast } from "../runtime";
import { resendInvite, revokeInvite, setMemberRole } from "../team-actions";
import styles from "./team.module.css";

const LABEL: Record<Role, string> = { admin: "ADMIN", manager: "MANAGER", hr: "HR", staff: "STAFF" };

function chipColors(role: Role | "pending"): React.CSSProperties {
  if (role === "admin") return { background: "var(--btnbg)", color: "var(--btnfg)", borderColor: "transparent" };
  if (role === "staff") return { background: "transparent", color: "var(--dim)", borderColor: "var(--line)" };
  if (role === "pending") return { background: "transparent", color: "var(--faint)", borderColor: "var(--line)" };
  return { background: "transparent", color: "var(--ink)", borderColor: "var(--hair)" };
}

/** "1 IL · 3 OT", "1 IL", "2 OT" or "—", as in the design. */
function holLabel(m: TeamMember) {
  const parts = [];
  if (m.il_earned > 0) parts.push(`${fmt(m.il_earned)} IL`);
  if (m.ot_days > 0) parts.push(`${m.ot_days} OT`);
  return parts.length ? parts.join(" · ") : "—";
}

type MenuOption = { label: string; color: string; pick: () => void };

export function TeamView({ members, invites }: { members: TeamMember[]; invites: Invite[] }) {
  const { role } = useAppData();
  const { open } = useModal();
  const { showToast } = useToast();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [menuFor, setMenuFor] = useState<string | null>(null);
  useOutsideClose(menuFor !== null, useCallback(() => setMenuFor(null), []));

  const isAdmin = role === "admin";
  const peopleCount = members.length + invites.length;
  const out = members.filter((m) => m.out_today);

  function act(run: () => Promise<{ ok: true } | { ok: false; error: string }>, success: string, refresh = true) {
    setMenuFor(null);
    startTransition(async () => {
      const res = await run();
      if (!res.ok) return showToast(res.error);
      showToast(success);
      if (refresh) router.refresh();
    });
  }

  const roleOptions = (m: TeamMember): MenuOption[] =>
    (["manager", "hr", "staff"] as Role[]).map((r) => ({
      label: LABEL[r],
      color: r === m.role ? "var(--ink)" : "var(--mut)",
      pick: () =>
        act(
          () => setMemberRole(m.user_id, r),
          `${m.name ?? "Member"} is now ${LABEL[r][0] + LABEL[r].slice(1).toLowerCase()}`,
        ),
    }));

  const inviteOptions = (inv: Invite): MenuOption[] => [
    { label: "RESEND", color: "var(--mut)", pick: () => act(() => resendInvite(inv.id), `Invite resent to ${inv.email}`, false) },
    { label: "REVOKE", color: "var(--sig)", pick: () => act(() => revokeInvite(inv.id), "Invite revoked") },
  ];

  function roleCell(id: string, label: string, colors: React.CSSProperties, options: MenuOption[]) {
    const clickable = options.length > 0;
    return (
      <div className={styles.roleWrap} data-popover-root>
        {clickable ? (
          <button
            type="button"
            className={`${styles.chip} ${styles.chipClickable}`}
            style={colors}
            onClick={() => setMenuFor(menuFor === id ? null : id)}
            aria-expanded={menuFor === id}
          >
            {label}
          </button>
        ) : (
          <span className={styles.chip} style={colors}>
            {label}
          </span>
        )}
        {clickable && menuFor === id && (
          <div className={styles.menu} role="menu">
            {options.map((o) => (
              <button key={o.label} type="button" role="menuitem" className={styles.menuItem} style={{ color: o.color }} onClick={o.pick}>
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const groups: [string, TeamMember[]][] = [
    [`ADMIN · ${members.filter((m) => m.role === "admin").length}`, members.filter((m) => m.role === "admin")],
    [
      `MANAGER + HR · ${members.filter((m) => m.role === "manager" || m.role === "hr").length}`,
      members.filter((m) => m.role === "manager" || m.role === "hr"),
    ],
    [`STAFF · ${members.filter((m) => m.role === "staff").length}`, members.filter((m) => m.role === "staff")],
  ];

  return (
    <>
      {/* ================= Desktop ================= */}
      <div className={styles.desk}>
        <div className={styles.head}>
          <div className={styles.headLabel}>
            TEAM · {peopleCount} PEOPLE ·{" "}
            <span className={styles.headHint}>
              {isAdmin ? "YOU ARE ADMIN — CLICK A ROLE TO REASSIGN" : `YOU ARE ${LABEL[role]}`}
            </span>
          </div>
          <div className={styles.outStrip}>
            <span className={styles.outDot} />
            <span className={styles.outTitle}>Out today</span>
            {out.length === 0 && <span className={styles.outName}>Nobody</span>}
            {out.map((m) => (
              <span key={m.user_id} className={styles.outName}>
                {shortName(m.name ?? "")} <span className={styles.outType}>{m.out_type}</span>
              </span>
            ))}
            {isAdmin && (
              <button type="button" className={styles.inviteBtn} onClick={() => open("invite")}>
                ＋ Invite
              </button>
            )}
          </div>
        </div>

        <div className={styles.tableWrap}>
          <div className={styles.table}>
            <div className={`${styles.grid} ${styles.thead}`}>
              <div>MEMBER</div>
              <div>ROLE</div>
              <div>VL REMAINING</div>
              <div className={styles.right}>VL</div>
              <div className={styles.right}>SL</div>
              <div className={styles.right}>IL</div>
              <div className={styles.right}>HOL.WORK</div>
            </div>

            {members.map((m) => {
              const pct = Math.max(0, Math.min(100, Math.round((m.vl_left / 15) * 100)));
              const editable = isAdmin && !m.is_self && m.role !== "admin";
              return (
                <div key={m.user_id} className={`${styles.grid} ${styles.trow}`}>
                  <div className={styles.member}>
                    <span className={styles.memberName}>
                      {m.name}
                      {m.is_self ? " (you)" : ""}
                    </span>
                    {m.out_today && <span className={styles.outTag}>OUT</span>}
                  </div>
                  {roleCell(m.user_id, LABEL[m.role], chipColors(m.role), editable ? roleOptions(m) : [])}
                  <div className={styles.bar}>
                    <div className={styles.barFill} style={{ width: `${pct}%` }} />
                  </div>
                  <div className={styles.num}>{fmt(m.vl_left)}</div>
                  <div className={`${styles.num} ${styles.numMut}`}>{fmt(m.sl_left)}</div>
                  <div className={`${styles.num} ${styles.numMut}`}>{fmt(m.il_avail)}</div>
                  <div className={styles.hol}>{holLabel(m)}</div>
                </div>
              );
            })}

            {invites.map((inv) => (
              <div key={inv.id} className={`${styles.grid} ${styles.trow}`}>
                <div className={styles.member}>
                  <span className={styles.memberName} style={{ color: "var(--dim)" }}>
                    {inv.email}
                  </span>
                </div>
                {roleCell(inv.id, "PENDING", chipColors("pending"), isAdmin ? inviteOptions(inv) : [])}
                <div className={styles.bar}>
                  <div className={styles.barFill} style={{ width: "0%" }} />
                </div>
                <div className={styles.num}>—</div>
                <div className={`${styles.num} ${styles.numMut}`}>—</div>
                <div className={`${styles.num} ${styles.numMut}`}>—</div>
                <div className={styles.hol}>invited</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.footer}>
          <span className={styles.footerLabel}>STAFF SEE BALANCES + WHO&apos;S OUT · FULL LEDGERS: ADMIN · MANAGER · HR</span>
          <Link href="/export" className={styles.footerLink}>
            Export whole team →
          </Link>
        </div>
      </div>

      {/* ================= Mobile ================= */}
      <div className={styles.mob}>
        <div className={styles.mHead}>
          <div className={styles.mHeadLabel}>TEAM · {peopleCount} PEOPLE</div>
          {isAdmin && (
            <button type="button" className={styles.mInvite} onClick={() => open("invite")}>
              ＋ INVITE
            </button>
          )}
        </div>
        <div className={styles.mList}>
          {groups
            .filter(([, rows]) => rows.length > 0)
            .map(([label, rows]) => (
              <div key={label}>
                <div className={styles.mGroup}>{label}</div>
                {rows.map((m) => (
                  <div key={m.user_id} className={styles.mRow}>
                    <span className={styles.mName}>
                      {m.name}
                      {m.is_self ? " (you)" : ""}
                    </span>
                    {m.out_today && <span className={styles.mOut}>OUT</span>}
                    <span className={styles.mNums}>
                      {fmt(m.vl_left)} · {fmt(m.sl_left)} · {fmt(m.il_avail)}
                    </span>
                  </div>
                ))}
              </div>
            ))}

          {invites.length > 0 && (
            <div>
              <div className={styles.mGroup}>PENDING · {invites.length}</div>
              {invites.map((inv) => (
                <div key={inv.id} className={styles.mRow}>
                  <span className={styles.mName} style={{ color: "var(--dim)" }}>
                    {inv.email}
                  </span>
                  <span className={styles.mNums} />
                  {isAdmin && (
                    <>
                      <button type="button" className={`${styles.mAction} ${styles.mResend}`} onClick={inviteOptions(inv)[0].pick}>
                        RESEND
                      </button>
                      <button type="button" className={`${styles.mAction} ${styles.mRevoke}`} onClick={inviteOptions(inv)[1].pick}>
                        REVOKE
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className={styles.mNote}>
            COLUMNS: VL · SL · IL
            <br />
            STAFF SEE BALANCES + WHO&apos;S OUT ONLY
          </div>
        </div>
      </div>
    </>
  );
}
