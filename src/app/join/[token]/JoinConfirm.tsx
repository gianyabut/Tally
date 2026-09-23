"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { acceptInvite } from "@/app/(app)/team-actions";

export function JoinConfirm({
  token,
  teamName,
  inviter,
  valid,
}: {
  token: string;
  teamName: string;
  inviter: string;
  valid: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function accept() {
    setError(null);
    startTransition(async () => {
      const res = await acceptInvite(token);
      if (res.ok) router.replace("/ledger?welcome=moved");
      else setError(res.error.toUpperCase());
    });
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      <Logo size={36} />
      <div
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: "0.2em",
          color: "var(--faint)",
          marginTop: 16,
        }}
      >
        TEAM INVITE
      </div>

      {valid ? (
        <>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>
            Join {teamName}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--mut)",
              marginTop: 8,
              maxWidth: 360,
              lineHeight: 1.6,
            }}
          >
            {inviter} invited you. Your ledger moves with you — balances become
            visible to its Admin, Manager and HR. You join as Staff.
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 28, alignItems: "center" }}>
            <button
              type="button"
              onClick={accept}
              disabled={pending}
              style={{
                padding: "13px 24px",
                borderRadius: 4,
                background: "var(--btnbg)",
                color: "var(--btnfg)",
                fontWeight: 600,
                fontSize: 14,
                opacity: pending ? 0.6 : 1,
              }}
            >
              {pending ? "Joining…" : `Join ${teamName}`}
            </button>
            <button
              type="button"
              onClick={() => router.replace("/ledger")}
              style={{ fontSize: 13, color: "var(--dim)" }}
            >
              Not now
            </button>
          </div>
          {error && (
            <div
              className="mono"
              style={{ fontSize: 11, color: "var(--sig)", marginTop: 14 }}
            >
              {error}
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 8 }}>
            This invite isn&apos;t valid
          </div>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--dim)",
              marginTop: 8,
              lineHeight: 1.7,
            }}
          >
            IT MAY HAVE BEEN REVOKED, ALREADY USED, OR EXPIRED.
          </div>
          <button
            type="button"
            onClick={() => router.replace("/ledger")}
            style={{
              marginTop: 24,
              padding: "12px 22px",
              borderRadius: 4,
              border: "1px solid var(--line)",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Go to my ledger →
          </button>
        </>
      )}
    </main>
  );
}
