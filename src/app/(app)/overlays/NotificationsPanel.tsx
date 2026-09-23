"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAppData, useModal, useToast } from "../runtime";
import { acceptInvite, markNotificationRead } from "../team-actions";
import styles from "../overlays.module.css";

/** "JUST NOW", "12M AGO", "3H AGO", "2D AGO". */
function when(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 2) return "JUST NOW";
  if (mins < 60) return `${mins}M AGO`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}H AGO`;
  return `${Math.floor(hours / 24)}D AGO`;
}

export function NotificationsPanel() {
  const { notifications } = useAppData();
  const { close } = useModal();
  const { showToast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function accept(token: string, team: string, id: string) {
    startTransition(async () => {
      const res = await acceptInvite(token);
      if (!res.ok) return showToast(res.error);
      await markNotificationRead(id);
      close();
      showToast(`You joined ${team} — ledger moved into the team`);
      router.refresh();
    });
  }

  function decline(id: string) {
    startTransition(async () => {
      await markNotificationRead(id);
      close();
      showToast("Invite declined");
      router.refresh();
    });
  }

  return (
    <>
      <div className={styles.catcher} onClick={close} />
      <div className={styles.notif} role="dialog" aria-label="Notifications">
        <div className={styles.nHead}>
          <span className={styles.nTitle}>NOTIFICATIONS</span>
          <span className={styles.nCount} style={{ color: notifications.length ? "var(--sig)" : "var(--faint)" }}>
            {notifications.length ? `${notifications.length} NEW` : ""}
          </span>
        </div>

        {notifications.map((n) => {
          const team = n.payload.team ?? "a team";
          const from = n.payload.from ?? "A teammate";
          return (
            <div key={n.id} className={styles.nRow}>
              <div className={styles.nTop}>
                <span className={styles.nDot} />
                <span className={styles.nKind}>Team invite</span>
                <span className={styles.nWhen}>{when(n.created_at)}</span>
              </div>
              <div className={styles.nBody}>
                {`${from} invited you to join ${team}. Your ledger moves with you — balances become visible to its Admin, Manager and HR.`.toUpperCase()}
              </div>
              <div className={styles.nActions}>
                <button
                  type="button"
                  className={styles.nAccept}
                  disabled={pending || !n.payload.token}
                  onClick={() => n.payload.token && accept(n.payload.token, team, n.id)}
                >
                  Accept — join team
                </button>
                <button type="button" className={styles.nDecline} disabled={pending} onClick={() => decline(n.id)}>
                  Decline
                </button>
              </div>
            </div>
          );
        })}

        {notifications.length === 0 && <div className={styles.nEmpty}>NO NOTIFICATIONS — ALL CLEAR</div>}
      </div>
    </>
  );
}
