"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/types";
import type { Invite, TeamMember } from "@/lib/data/team";
import { fmt } from "@/lib/ledger/view";
import { useAppData, useModal, useToast } from "../runtime";
import { revokeInvite, resendInvite, setMemberRole } from "../team-actions";
import styles from "./team.module.css";

const ROLE_LABEL: Record<Role, string> = {
  admin: "ADMIN",
  manager: "MANAGER",
  hr: "HR",
  staff: "STAFF",
};

function chipStyle(role: Role): React.CSSProperties {
  if (role === "admin")
    return { background: "var(--btnbg)", color: "var(--btnfg)", borderColor: "transparent" };
  if (role === "staff")
    return { background: "transparent", color: "var(--dim)", borderColor: "var(--line)" };
  return { background: "transparent", color: "var(--ink)", borderColor: "var(--hair)" };
}

export function TeamView({
  members,
  invites,
}: {
  members: TeamMember[];
  invites: Invite[];
}) {
  const { role, teamName } = useAppData();
  const { open } = useModal();
  const { showToast } = useToast();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const isAdmin = role === "admin";
  const totalPeople = members.length + invites.length;
  const out = members.filter((m) => m.out_today);

  function reassign(target: string, newRole: Role, name: string) {
    setMenuFor(null);
    startTransition(async () => {
      const res = await setMemberRole(target, newRole);
      if (res.ok) {
        showToast(`${name} is now ${ROLE_LABEL[newRole][0] + ROLE_LABEL[newRole].slice(1).toLowerCase()}`);
        router.refresh();
      } else showToast(res.error);
    });
  }

  function doRevoke(id: string) {
    startTransition(async () => {
      const res = await revokeInvite(id);
      if (res.ok) {
        showToast("Invite revoked");
        router.refresh();
      } else showToast(res.error);
    });
  }

  function doResend(id: string) {
    startTransition(async () => {
      const res = await resendInvite(id);
      if (res.ok) showToast("Invite resent");
      else showToast(res.error);
    });
  }

  const RoleChip = ({ m }: { m: TeamMember }) => {
    const canEdit = isAdmin && !m.is_self && m.role !== "admin";
    return (
      <div className={styles.roleWrap}>
        <span
          className={`${styles.chip} ${canEdit ? styles.chipClickable : ""}`}
          style={chipStyle(m.role)}
          onClick={canEdit ? () => setMenuFor(menuFor === m.user_id ? null : m.user_id) : undefined}
        >
          {ROLE_LABEL[m.role]}
        </span>
        {canEdit && menuFor === m.user_id && (
          <div className={styles.menu}>
            {(["manager", "hr", "staff"] as Role[]).map((r) => (
              <div
                key={r}
                className={styles.menuItem}
                style={{ color: r === m.role ? "var(--ink)" : "var(--mut)" }}
                onClick={() => reassign(m.user_id, r, m.name ?? "Member")}
              >
                {ROLE_LABEL[r]}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.wrap}>
      {/* Desktop */}
      <div className={styles.desktopOnly} style={{ flexDirection: "column", flex: 1 }}>
        <div className={styles.head}>
          <div className={styles.headLabel}>
            TEAM · {totalPeople} PEOPLE
            {isAdmin && (
              <span className={styles.headLabelHint}>
                {" "}
                · YOU ARE ADMIN — CLICK A ROLE TO REASSIGN
              </span>
            )}
          </div>
          <div className={styles.outStrip}>
            <span className={styles.outDot} />
            <span className={styles.outTitle}>Out today</span>
            {out.length === 0 && (
              <span className={styles.outName}>Nobody&apos;s out</span>
            )}
            {out.map((m) => (
              <span key={m.user_id} className={styles.outName}>
                {m.name}{" "}
                <span className={styles.outType}>{m.out_type ?? ""}</span>
              </span>
            ))}
            {isAdmin && (
              <button className={styles.inviteBtn} onClick={() => open("invite")}>
                ＋ Invite
              </button>
            )}
          </div>
        </div>

        <div className={styles.tableScroll}>
          <div className={styles.table}>
            <div className={styles.thead}>
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
              return (
                <div key={m.user_id} className={styles.trow}>
                  <div className={styles.member}>
                    <span className={styles.memberName}>
                      {m.name}
                      {m.is_self ? " (you)" : ""}
                    </span>
                    {m.out_today && <span className={styles.outTag}>OUT</span>}
                  </div>
                  <RoleChip m={m} />
                  <div className={styles.bar}>
                    <div className={styles.barFill} style={{ width: `${pct}%` }} />
                  </div>
                  <div className={styles.num}>{fmt(m.vl_left)}</div>
                  <div className={`${styles.num} ${styles.numMut}`}>{fmt(m.sl_left)}</div>
                  <div className={`${styles.num} ${styles.numMut}`}>{fmt(m.il_avail)}</div>
                  <div className={`${styles.num} ${styles.numDim}`}>{m.hol_summary}</div>
                </div>
              );
            })}

            {invites.map((inv) => (
              <div key={inv.id} className={styles.trow} style={{ opacity: 0.7 }}>
                <div className={styles.member}>
                  <span className={styles.memberName} style={{ color: "var(--dim)" }}>
                    {inv.email}
                  </span>
                </div>
                <span
                  className={styles.chip}
                  style={{ borderStyle: "dashed", color: "var(--faint)" }}
                >
                  PENDING
                </span>
                <div />
                <div className={styles.num} style={{ gridColumn: "4 / 8", textAlign: "right", display: "flex", gap: 14, justifyContent: "flex-end" }}>
                  {isAdmin && (
                    <>
                      <span
                        className={styles.action}
                        style={{ color: "var(--mut)" }}
                        onClick={() => doResend(inv.id)}
                      >
                        RESEND
                      </span>
                      <span
                        className={styles.action}
                        style={{ color: "var(--sig)" }}
                        onClick={() => doRevoke(inv.id)}
                      >
                        REVOKE
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.footer}>
          <span className={styles.footerLabel}>
            STAFF SEE BALANCES + WHO&apos;S OUT · FULL LEDGERS: ADMIN · MANAGER · HR
          </span>
        </div>
      </div>

      {/* Mobile */}
      <div className={styles.mobileOnly} style={{ flexDirection: "column", flex: 1 }}>
        <div className={styles.mobHead}>
          <div className={styles.mobHeadLabel}>
            {teamName.toUpperCase()} · {totalPeople}
          </div>
          {isAdmin && (
            <button className={styles.mobInvite} onClick={() => open("invite")}>
              ＋ INVITE
            </button>
          )}
        </div>
        <div className={styles.mobList}>
          {(
            [
              ["ADMIN", members.filter((m) => m.role === "admin")],
              ["MANAGER + HR", members.filter((m) => m.role === "manager" || m.role === "hr")],
              ["STAFF", members.filter((m) => m.role === "staff")],
            ] as [string, TeamMember[]][]
          )
            .filter(([, rows]) => rows.length)
            .map(([label, rows]) => (
              <div key={label}>
                <div className={styles.groupLabel}>
                  {label} · {rows.length}
                </div>
                {rows.map((m) => (
                  <div key={m.user_id} className={styles.mobRow}>
                    <span className={styles.mobName}>
                      {m.name}
                      {m.is_self ? " (you)" : ""}
                    </span>
                    {m.out_today && (
                      <span className={styles.outTag}>OUT</span>
                    )}
                    <span className={styles.mobNums}>
                      {fmt(m.vl_left)} · {fmt(m.sl_left)} · {fmt(m.il_avail)}
                    </span>
                  </div>
                ))}
              </div>
            ))}

          {invites.length > 0 && (
            <div>
              <div className={styles.groupLabel}>PENDING · {invites.length}</div>
              {invites.map((inv) => (
                <div key={inv.id} className={styles.mobRow}>
                  <span className={styles.mobName} style={{ color: "var(--dim)" }}>
                    {inv.email}
                  </span>
                  {isAdmin && (
                    <span style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
                      <span
                        className={styles.action}
                        style={{ color: "var(--mut)" }}
                        onClick={() => doResend(inv.id)}
                      >
                        RESEND
                      </span>
                      <span
                        className={styles.action}
                        style={{ color: "var(--sig)" }}
                        onClick={() => doRevoke(inv.id)}
                      >
                        REVOKE
                      </span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 9,
              color: "var(--faint)",
              padding: "12px 0",
              lineHeight: 1.7,
            }}
          >
            COLUMNS: VL · SL · IL
            <br />
            STAFF SEE BALANCES + WHO&apos;S OUT ONLY
          </div>
        </div>
      </div>
    </div>
  );
}
