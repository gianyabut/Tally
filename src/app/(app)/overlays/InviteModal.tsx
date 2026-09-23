"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useModal, useToast } from "../runtime";
import { sendInvites } from "../team-actions";
import styles from "../overlays.module.css";

export function InviteModal() {
  const { close, modal } = useModal();
  const { showToast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState("");
  const [list, setList] = useState<string[]>([]);

  function add() {
    const d = draft.trim();
    if (!d.includes("@")) return showToast("Enter a valid email");
    setList((l) => [...l, d]);
    setDraft("");
  }

  function send() {
    const all = [...list];
    if (draft.trim().includes("@")) all.push(draft.trim());
    if (all.length === 0) return showToast("Add at least one email");
    startTransition(async () => {
      const res = await sendInvites(all);
      if (!res.ok) return showToast(res.error);
      close();
      showToast(`${res.count} ${res.count === 1 ? "invite" : "invites"} sent — pending until they join`);
      router.refresh();
    });
  }

  const label = list.length ? `Send ${list.length} ${list.length === 1 ? "invite" : "invites"}` : "Send invites";

  return (
    <>
      <div className={styles.scrim} onClick={close} />
      <div className={styles.panel} style={{ top: modal.top + 56 }} role="dialog" aria-label="Invite to your team">
        <div className={styles.head}>
          <div>
            <div className={styles.headTitle}>Invite to your team</div>
            <div className={styles.headSub}>ANY EMAIL WORKS — THE INVITE IS THEIR SIGNUP</div>
          </div>
          <button type="button" className={styles.esc} onClick={close}>
            ESC
          </button>
        </div>

        <div className={`${styles.body} ${styles.bodyInvite}`}>
          <div className={styles.inviteRow}>
            <input
              type="email"
              className={styles.email}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
              }}
              placeholder="name@anywhere.com"
              aria-label="Email"
            />
            <button type="button" className={styles.add} onClick={add}>
              Add
            </button>
          </div>

          {list.length > 0 && (
            <div className={styles.chips}>
              {list.map((email, i) => (
                <button
                  key={`${email}-${i}`}
                  type="button"
                  className={styles.emailChip}
                  onClick={() => setList((l) => l.filter((_, j) => j !== i))}
                  aria-label={`Remove ${email}`}
                >
                  {email} ✕
                </button>
              ))}
            </div>
          )}

          <div className={styles.explain}>
            THEY GET AN EMAIL → &quot;JOIN TEAM&quot; → SIGN IN WITH GOOGLE → DONE.
            <br />
            THEY SHOW AS PENDING HERE UNTIL THEY JOIN · INVITES EXPIRE IN 14 DAYS.
          </div>
        </div>

        <div className={styles.foot}>
          <span className={styles.footNote}>new members join as Staff</span>
          <button type="button" className={styles.primary} onClick={send} disabled={pending}>
            {label}
          </button>
        </div>
      </div>
    </>
  );
}
