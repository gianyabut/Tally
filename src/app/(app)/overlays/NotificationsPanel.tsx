"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAppData, useModal, useToast } from "../runtime";
import { acceptInvite, markNotificationRead } from "../team-actions";

export function NotificationsPanel() {
  const { notifications } = useAppData();
  const { close } = useModal();
  const { showToast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function accept(token: string, team: string, notifId: string) {
    startTransition(async () => {
      const res = await acceptInvite(token);
      if (res.ok) {
        await markNotificationRead(notifId);
        close();
        showToast(`You joined ${team} — ledger moved into the team`);
        router.refresh();
      } else {
        showToast(res.error);
      }
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
      <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={close} />
      <div
        style={{
          position: "fixed",
          right: 16,
          top: 60,
          width: "min(340px, calc(100% - 32px))",
          background: "var(--bg)",
          border: "1px solid var(--hair)",
          borderRadius: 6,
          boxShadow: "0 24px 60px rgba(0,0,0,.5)",
          zIndex: 50,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "13px 16px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 10,
              letterSpacing: "0.18em",
              color: "var(--mut)",
            }}
          >
            NOTIFICATIONS
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontFamily: "var(--font-mono), monospace",
              fontSize: 10,
              color: notifications.length ? "var(--sig)" : "var(--faint)",
            }}
          >
            {notifications.length ? `${notifications.length} NEW` : ""}
          </span>
        </div>

        {notifications.length === 0 && (
          <div
            style={{
              padding: "22px 16px",
              fontFamily: "var(--font-mono), monospace",
              fontSize: 10.5,
              color: "var(--faint)",
            }}
          >
            NO NOTIFICATIONS — ALL CLEAR
          </div>
        )}

        {notifications.map((n) => {
          const team = n.payload.team ?? "a team";
          const from = n.payload.from ?? "A teammate";
          return (
            <div
              key={n.id}
              style={{ padding: "14px 16px", borderBottom: "1px solid var(--row)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--sig)",
                  }}
                />
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>Team invite</span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 9.5,
                    color: "var(--faint)",
                  }}
                >
                  JUST NOW
                </span>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 10,
                  color: "var(--dim)",
                  marginTop: 6,
                  lineHeight: 1.7,
                  textTransform: "uppercase",
                }}
              >
                {from} invited you to join {team}. Your ledger moves with you —
                balances become visible to its Admin, Manager and HR.
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  marginTop: 12,
                }}
              >
                <button
                  type="button"
                  disabled={pending || !n.payload.token}
                  onClick={() =>
                    n.payload.token && accept(n.payload.token, team, n.id)
                  }
                  style={{
                    padding: "9px 16px",
                    borderRadius: 4,
                    background: "var(--btnbg)",
                    color: "var(--btnfg)",
                    fontWeight: 600,
                    fontSize: 12.5,
                  }}
                >
                  Accept — join team
                </button>
                <span
                  onClick={() => !pending && decline(n.id)}
                  style={{ fontSize: 12.5, color: "var(--dim)", cursor: "pointer" }}
                >
                  Decline
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
