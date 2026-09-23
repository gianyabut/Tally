"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { weekday } from "@/lib/ledger/dates";
import { useAppData, useModal, useToast } from "../runtime";
import { logHolidayWork } from "../actions";
import { typingInField } from "./keys";
import styles from "../overlays.module.css";

export function LogHolidayModal() {
  const { holidays, nextHoliday } = useAppData();
  const { close, modal } = useModal();
  const { showToast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Defaults to the next holiday, as in the design; the name in the title is a
  // picker so any holiday of the year (i.e. one you already worked) can be logged.
  const [holidayId, setHolidayId] = useState(nextHoliday?.holiday.id ?? holidays[0]?.id ?? "");
  const [full, setFull] = useState(true);
  const [creditIL, setCreditIL] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const holiday = holidays.find((h) => h.id === holidayId);
  const amt = full ? "1.0" : "0.5";

  function confirm() {
    if (pending) return;
    if (!file) {
      showToast("Attach a proof image first — it's required");
      return;
    }
    const fd = new FormData();
    fd.set("holidayId", holidayId);
    fd.set("portion", full ? "full" : "half");
    fd.set("creditAs", creditIL ? "il" : "ot");
    fd.set("proof", file);
    startTransition(async () => {
      const res = await logHolidayWork(fd);
      if (!res.ok) return showToast(res.error);
      close();
      showToast(creditIL ? `IL +${amt} credited — ${holiday?.name}` : `OT day logged — ${holiday?.name}`);
      router.refresh();
    });
  }

  // 1/2 pick the credit, Enter confirms.
  const confirmRef = useRef(confirm);
  useEffect(() => {
    confirmRef.current = confirm;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typingInField(e) || e.metaKey || e.ctrlKey) return;
      if (e.key === "1") setCreditIL(true);
      else if (e.key === "2") setCreditIL(false);
      else if (e.key === "Enter") {
        e.preventDefault();
        confirmRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div className={styles.scrim} onClick={close} />
      <div className={styles.panel} style={{ top: modal.top + 44 }} role="dialog" aria-label="Log holiday work">
        <div className={styles.head}>
          <div>
            <div className={styles.headTitle}>
              Log holiday work —{" "}
              <span className={styles.pick}>
                {holiday?.name}
                <select
                  className={styles.pickControl}
                  value={holidayId}
                  onChange={(e) => setHolidayId(e.target.value)}
                  aria-label="Holiday"
                >
                  {holidays.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.date} — {h.name}
                    </option>
                  ))}
                </select>
              </span>
            </div>
            {holiday && (
              <div className={styles.headSub}>
                {holiday.date} · {weekday(holiday.date)} · {holiday.type.toUpperCase()}
              </div>
            )}
          </div>
          <button type="button" className={styles.esc} onClick={close}>
            ESC
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.tabs}>
            <button type="button" className={`${styles.tab} ${full ? styles.tabOn : ""}`} onClick={() => setFull(true)}>
              Full day
            </button>
            <button type="button" className={`${styles.tab} ${!full ? styles.tabOn : ""}`} onClick={() => setFull(false)}>
              Half day
            </button>
          </div>

          <div className={styles.options}>
            <button type="button" className={`${styles.option} ${creditIL ? styles.optionOn : ""}`} onClick={() => setCreditIL(true)}>
              <span className={styles.chip}>1</span>
              <div style={{ flex: 1 }}>
                <div className={styles.optTitle} style={{ color: creditIL ? "var(--ink)" : "var(--mut)" }}>
                  Take an In-Lieu day
                </div>
                <div className={styles.optDesc}>a day off, spend anytime</div>
              </div>
              <span className={styles.optAmt}>IL +{amt}</span>
            </button>
            <button type="button" className={`${styles.option} ${!creditIL ? styles.optionOn : ""}`} onClick={() => setCreditIL(false)}>
              <span className={styles.chip}>2</span>
              <div style={{ flex: 1 }}>
                <div className={styles.optTitle} style={{ color: !creditIL ? "var(--ink)" : "var(--mut)" }}>
                  Take an OT day
                </div>
                <div className={styles.optDesc}>paid day, next payroll</div>
              </div>
              <span className={styles.optAmt}>OT +{amt}</span>
            </button>
          </div>

          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            className={`${styles.proofRow} ${file ? styles.proofRowOn : ""}`}
            onClick={() => fileInput.current?.click()}
          >
            <span className={styles.proofText} style={{ color: file ? "var(--ink)" : "var(--mut)" }}>
              {file ? `${file.name} — attached` : "Tap to attach your proof image"}
            </span>
            <span className={styles.proofTag} style={{ color: file ? "var(--ink)" : "var(--sig)" }}>
              {file ? "✓" : "REQUIRED"}
            </span>
          </button>
        </div>

        <div className={styles.foot}>
          <span className={styles.footNote}>it&apos;s your ledger — no approvals</span>
          <button type="button" className={styles.primary} onClick={confirm} disabled={pending}>
            Add to ledger
          </button>
        </div>
      </div>
    </>
  );
}
