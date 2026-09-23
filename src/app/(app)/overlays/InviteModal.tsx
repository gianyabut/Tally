"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useModal, useToast } from "../runtime";
import { sendInvites } from "../team-actions";
import styles from "../overlays.module.css";

export function InviteModal() {
  const { close } = useModal();
  const { showToast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [draft, setDraft] = useState("");
  const [list, setList] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  function add() {
    const d = draft.trim();
    if (!d.includes("@")) {
      setError("Enter a valid email");
      return;
    }
    setError(null);
    setList((l) => [...l, d]);
    setDraft("");
  }

  function send() {
    const all = [...list];
    if (draft.includes("@")) all.push(draft.trim());
    if (all.length === 0) {
      setError("Add at least one email");
      return;
    }
    startTransition(async () => {
      const res = await sendInvites(all);
      if (res.ok) {
        close();
        showToast(
          `${res.count} invite${res.count === 1 ? "" : "s"} sent — pending until they join`,
        );
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  const label =
    list.length > 0
      ? `Send ${list.length} invite${list.length === 1 ? "" : "s"}`
      : "Send invites";

  return (
    <>
      <div className={styles.scrim} onClick={close} />
      <div className={styles.panel}>
        <div className={styles.header}>
          <div>
            <div className={styles.headerTitle}>Invite to your team</div>
            <div className={styles.headerSub}>
              ANY EMAIL WORKS — THE INVITE IS THEIR SIGNUP
            </div>
          </div>
          <span className={styles.esc} onClick={close} style={{ cursor: "pointer" }}>
            ESC
          </span>
        </div>

        <div className={styles.body}>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="name@anywhere.com"
              className={styles.input}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={add}
              style={{
                padding: "10px 16px",
                border: "1px solid var(--line)",
                borderRadius: 4,
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Add
            </button>
          </div>

          {list.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {list.map((email, i) => (
                <span
                  key={i}
                  onClick={() => setList((l) => l.filter((_, j) => j !== i))}
                  style={{
                    cursor: "pointer",
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 12,
                    border: "1px solid var(--hair)",
                    borderRadius: 4,
                    padding: "6px 10px",
                  }}
                >
                  {email} ✕
                </span>
              ))}
            </div>
          )}

          <div
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 10.5,
              color: "var(--faint)",
              lineHeight: 1.7,
            }}
          >
            THEY GET AN EMAIL → &quot;JOIN TEAM&quot; → SIGN IN WITH GOOGLE → DONE.
            <br />
            THEY SHOW AS PENDING UNTIL THEY JOIN · INVITES EXPIRE IN 14 DAYS.
          </div>

          {error && <div className={styles.error}>{error}</div>}
        </div>

        <div className={styles.footer}>
          <span className={styles.footerNote}>new members join as Staff</span>
          <button
            type="button"
            className={styles.primary}
            onClick={send}
            disabled={pending}
          >
            {pending ? "Sending…" : label}
          </button>
        </div>
      </div>
    </>
  );
}
