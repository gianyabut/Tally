"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAppData, useModal, useToast } from "../runtime";
import { logHolidayWork } from "../actions";
import styles from "../overlays.module.css";

export function LogHolidayModal() {
  const { holidays, nextHoliday, year } = useAppData();
  const { close } = useModal();
  const { showToast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [holidayId, setHolidayId] = useState(
    nextHoliday?.holiday.id ?? holidays[0]?.id ?? "",
  );
  const [portion, setPortion] = useState<"full" | "half">("full");
  const [creditAs, setCreditAs] = useState<"il" | "ot">("il");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const selected = holidays.find((h) => h.id === holidayId);
  const amt = portion === "full" ? "1.0" : "0.5";

  function confirm() {
    setError(null);
    if (!file) {
      setError("Attach a proof image first — it's required");
      return;
    }
    const fd = new FormData();
    fd.set("holidayId", holidayId);
    fd.set("portion", portion);
    fd.set("creditAs", creditAs);
    fd.set("proof", file);
    startTransition(async () => {
      const res = await logHolidayWork(fd);
      if (res.ok) {
        close();
        showToast(
          creditAs === "il"
            ? `IL +${amt} credited — ${selected?.name ?? "holiday"}`
            : `OT day logged — ${selected?.name ?? "holiday"}`,
        );
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <>
      <div className={styles.scrim} onClick={close} />
      <div className={styles.panel} style={{ top: 44 }}>
        <div className={styles.header}>
          <div>
            <div className={styles.headerTitle}>Log holiday work</div>
            <div className={styles.headerSub}>
              {selected
                ? `${selected.date} · ${selected.type.toUpperCase()}`
                : `FY${year}`}
            </div>
          </div>
          <span className={styles.esc} onClick={close} style={{ cursor: "pointer" }}>
            ESC
          </span>
        </div>

        <div className={styles.body}>
          {/* Holiday picker */}
          <select
            value={holidayId}
            onChange={(e) => setHolidayId(e.target.value)}
            className={styles.input}
            style={{ appearance: "auto" }}
          >
            {holidays.map((h) => (
              <option key={h.id} value={h.id}>
                {h.date} — {h.name}
              </option>
            ))}
          </select>

          {/* Full / Half */}
          <div className={styles.tabs}>
            <span
              className={`${styles.tab} ${portion === "full" ? styles.tabActive : ""}`}
              onClick={() => setPortion("full")}
            >
              Full day
            </span>
            <span
              className={`${styles.tab} ${portion === "half" ? styles.tabActive : ""}`}
              onClick={() => setPortion("half")}
            >
              Half day
            </span>
          </div>

          {/* IL / OT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              className={`${styles.option} ${creditAs === "il" ? styles.optionSel : ""}`}
              onClick={() => setCreditAs("il")}
            >
              <span className={styles.chip}>1</span>
              <div style={{ flex: 1 }}>
                <div className={styles.optionTitle}>Take an In-Lieu day</div>
                <div className={styles.optionDesc}>a day off, spend anytime</div>
              </div>
              <span className={styles.optionAmt}>IL +{amt}</span>
            </div>
            <div
              className={`${styles.option} ${creditAs === "ot" ? styles.optionSel : ""}`}
              onClick={() => setCreditAs("ot")}
            >
              <span className={styles.chip}>2</span>
              <div style={{ flex: 1 }}>
                <div className={styles.optionTitle}>Take an OT day</div>
                <div className={styles.optionDesc}>paid day, next payroll</div>
              </div>
              <span className={styles.optionAmt}>OT +{amt}</span>
            </div>
          </div>

          {/* Proof */}
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div
            className={`${styles.proofRow} ${file ? styles.proofRowOk : ""}`}
            onClick={() => fileInput.current?.click()}
          >
            <span
              className={styles.proofText}
              style={{ color: file ? "var(--ink)" : "var(--mut)" }}
            >
              {file ? `${file.name} — attached` : "Tap to attach your proof image"}
            </span>
            <span
              className={styles.proofTag}
              style={{ color: file ? "var(--ink)" : "var(--sig)" }}
            >
              {file ? "✓" : "REQUIRED"}
            </span>
          </div>

          {error && <div className={styles.error}>{error}</div>}
        </div>

        <div className={styles.footer}>
          <span className={styles.footerNote}>it&apos;s your ledger — no approvals</span>
          <button
            type="button"
            className={styles.primary}
            onClick={confirm}
            disabled={pending}
          >
            {pending ? "Saving…" : "Add to ledger"}
          </button>
        </div>
      </div>
    </>
  );
}
