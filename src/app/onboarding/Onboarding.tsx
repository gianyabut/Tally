"use client";

import { useRef, useState, useTransition } from "react";
import { Logo } from "@/components/Logo";
import { shortName } from "@/lib/names";
import { FISCAL_YEAR } from "@/lib/types";
import { completeJoinOnboarding, completeSoloOnboarding } from "./actions";
import styles from "./onboarding.module.css";

export type PendingInvite = {
  token: string;
  teamName: string;
  inviter: string;
  memberCount: number;
};

type Step = "start" | "setup" | "invite";

const fmt = (n: number) => (n % 1 === 0 ? String(n) : n.toFixed(1));

function Field({
  label,
  value,
  dim,
  onStep,
}: {
  label: string;
  value: number;
  dim?: boolean;
  onStep: (dir: 1 | -1) => void;
}) {
  return (
    <div>
      <div className={styles.fieldLabel}>{label}</div>
      <div className={styles.fieldRow}>
        <span className={`${styles.numeral} ${dim ? styles.numeralDim : ""}`}>
          {fmt(value)}
        </span>
        <div className={styles.steppers}>
          <button
            type="button"
            className={styles.stepBtn}
            onClick={() => onStep(-1)}
            aria-label={`Decrease ${label.toLowerCase()}`}
          >
            −
          </button>
          <button
            type="button"
            className={styles.stepBtn}
            onClick={() => onStep(1)}
            aria-label={`Increase ${label.toLowerCase()}`}
          >
            ＋
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * The three onboarding steps from the design:
 *   1. "How are you starting?" — join (if invited) or start solo
 *   2. credits setup
 *   3. "Invite your workmates" — solo path only, optional
 */
export function Onboarding({
  firstName,
  email,
  invite,
}: {
  firstName: string;
  email: string;
  invite: PendingInvite | null;
}) {
  const [step, setStep] = useState<Step>("start");
  const [joined, setJoined] = useState(false);
  const [vl, setVl] = useState(15);
  const [sl, setSl] = useState(15);
  const [carry, setCarry] = useState(0);
  const [draft, setDraft] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pending, startTransition] = useTransition();

  // Three steps on the solo path (fork → credits → invite), two when joining.
  // Before a choice is made the solo path is assumed, as in the prototype.
  const total = joined ? 2 : 3;
  const stepNum = step === "start" ? 1 : step === "setup" ? 2 : 3;

  function flash(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  function run(action: () => Promise<{ ok: false; error: string } | void>) {
    startTransition(async () => {
      const res = await action();
      if (res && !res.ok) flash(res.error);
    });
  }

  const step1 = (
    set: React.Dispatch<React.SetStateAction<number>>,
    delta: number,
    max: number,
  ) => set((v) => Math.min(max, Math.max(0, v + delta)));

  function setupNext() {
    if (joined && invite) {
      run(() => completeJoinOnboarding({ token: invite.token, vl, sl, carry }));
    } else {
      setStep("invite");
    }
  }

  function addEmail() {
    const d = draft.trim();
    if (!d.includes("@")) {
      flash("Enter a valid email");
      return;
    }
    setEmails((list) => [...list, d]);
    setDraft("");
  }

  function finishInvites() {
    const list = [...emails];
    if (draft.trim().includes("@")) list.push(draft.trim());
    run(() => completeSoloOnboarding({ vl, sl, carry, emails: list }));
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <Logo size={17} strokeWidth={2.4} />
          <span className={styles.brandName}>TALLY</span>
        </div>
        <span className={styles.step}>{`STEP ${stepNum} OF ${total}`}</span>
      </header>

      {step === "start" && (
        <div className={styles.bodyCenter}>
          <div
            className={styles.eyebrow}
          >{`SIGNED IN AS ${email.toUpperCase()}`}</div>
          <div className={styles.title}>How are you starting?</div>
          <div className={styles.cards}>
            {invite ? (
              <button
                type="button"
                className={styles.card}
                onClick={() => {
                  setJoined(true);
                  setStep("setup");
                }}
              >
                <div className={styles.cardTitleRow}>
                  <span
                    className={styles.cardTitle}
                  >{`Join ${invite.teamName}`}</span>
                  <span className={styles.badge}>INVITE FOUND</span>
                </div>
                <div className={styles.cardMeta}>
                  {`${shortName(invite.inviter).toUpperCase()} INVITED YOU · ${invite.memberCount} ${
                    invite.memberCount === 1 ? "MEMBER" : "MEMBERS"
                  } · YOU JOIN AS STAFF`}
                </div>
              </button>
            ) : (
              // No invite for this account: same card, inert, saying how to get one.
              <div
                className={`${styles.card} ${styles.cardDisabled}`}
                aria-disabled="true"
              >
                <div className={styles.cardTitleRow}>
                  <span className={styles.cardTitle}>Join a team</span>
                  <span className={`${styles.badge} ${styles.badgeQuiet}`}>
                    NO INVITE YET
                  </span>
                </div>
                <div className={styles.cardMeta}>
                  ASK YOUR ADMIN TO INVITE THIS EMAIL · OR ACCEPT LATER FROM THE
                  BELL
                </div>
              </div>
            )}
            <button
              type="button"
              className={`${styles.card} ${styles.cardQuiet}`}
              onClick={() => {
                setJoined(false);
                setStep("setup");
              }}
            >
              <div className={styles.cardTitle}>Start my own space</div>
              <div className={styles.cardMeta}>
                A TEAM OF ONE — TRACK YOUR YEAR, INVITE WORKMATES LATER
              </div>
            </button>
          </div>
          <div className={styles.consent}>
            JOINING MOVES YOUR LEDGER INTO THE TEAM.
            <br />
            BALANCES BECOME VISIBLE TO ITS ADMIN, MANAGER AND HR.
          </div>
        </div>
      )}

      {step === "setup" && (
        <>
          <div className={styles.body}>
            <div
              className={styles.eyebrow}
            >{`WELCOME, ${firstName.toUpperCase()}`}</div>
            <div
              className={styles.title}
            >{`Set up your ${FISCAL_YEAR} ledger`}</div>
            <div className={styles.subtitle}>
              Your yearly credits, once. Everything else is logged as it
              happens.
            </div>
            <div className={styles.grid}>
              <Field
                label="VACATION"
                value={vl}
                onStep={(d) => step1(setVl, d, 30)}
              />
              <Field
                label="SICK"
                value={sl}
                onStep={(d) => step1(setSl, d, 30)}
              />
              <Field
                label="IL CARRY-OVER"
                value={carry}
                dim
                onStep={(d) => step1(setCarry, d * 0.5, 10)}
              />
            </div>
            <div className={styles.holidays}>
              <span className={styles.dot} />
              <span
                className={styles.holidaysLabel}
              >{`Philippine holidays ${FISCAL_YEAR} preloaded`}</span>
              <span className={styles.holidaysMeta}>
                18 DATES · REGULAR + SPECIAL
              </span>
            </div>
          </div>
          <div className={styles.footer}>
            <span className={styles.footerNote}>
              You can change credits later
            </span>
            <button
              type="button"
              className={styles.primary}
              onClick={setupNext}
              disabled={pending}
            >
              {joined && invite ? `Join ${invite.teamName} →` : "Continue →"}
            </button>
          </div>
        </>
      )}

      {step === "invite" && (
        <div className={styles.bodyCenter}>
          <div className={styles.eyebrow}>OPTIONAL</div>
          <div className={styles.title}>Invite your workmates</div>
          <div className={styles.subtitleSm}>
            Any email works — the invite is their signup. They join as Staff.
          </div>
          <div className={styles.inviteRow}>
            <input
              type="email"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addEmail();
                }
              }}
              placeholder="name@anywhere.com"
              className={styles.emailInput}
              aria-label="Workmate email"
            />
            <button type="button" className={styles.addBtn} onClick={addEmail}>
              Add
            </button>
          </div>
          {emails.length > 0 && (
            <div className={styles.chips}>
              {emails.map((em, i) => (
                <button
                  key={`${em}-${i}`}
                  type="button"
                  className={styles.chip}
                  onClick={() =>
                    setEmails((list) => list.filter((_, j) => j !== i))
                  }
                  aria-label={`Remove ${em}`}
                >
                  {em} ✕
                </button>
              ))}
            </div>
          )}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryLg}
              onClick={finishInvites}
              disabled={pending}
            >
              Finish setup
            </button>
            <button
              type="button"
              className={styles.skip}
              onClick={() =>
                run(() =>
                  completeSoloOnboarding({ vl, sl, carry, skipped: true }),
                )
              }
              disabled={pending}
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className={styles.toast} role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
