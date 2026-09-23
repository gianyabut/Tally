"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { availableFor } from "@/lib/ledger/balances";
import { fmt } from "@/lib/ledger/view";
import { useAppData, useModal, useToast } from "../runtime";
import { fileLeave } from "../actions";
import styles from "../overlays.module.css";

type Source = "vl" | "sl" | "il" | "unpaid";
const SOURCES: { key: string; label: string; source: Source }[] = [
  { key: "1", label: "Vacation", source: "vl" },
  { key: "2", label: "Sick", source: "sl" },
  { key: "3", label: "In-Lieu", source: "il" },
  { key: "4", label: "Unpaid", source: "unpaid" },
];

const todayIso = () => new Date().toISOString().slice(0, 10);

export function FileLeaveModal() {
  const { balances } = useAppData();
  const { close } = useModal();
  const { showToast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [days, setDays] = useState(1);
  const [startDate, setStartDate] = useState(todayIso());
  const [source, setSource] = useState<Source>("vl");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedLeft = availableFor(source, balances);
  const selectedShort = source !== "unpaid" && selectedLeft < days;

  function confirm() {
    setError(null);
    if (selectedShort) {
      setError(`Not enough ${source.toUpperCase()} — pick another source`);
      return;
    }
    startTransition(async () => {
      const res = await fileLeave({ source, days, startDate, note });
      if (res.ok) {
        close();
        showToast(
          `Leave filed — ${startDate} (−${fmt(days)} ${source.toUpperCase()})`,
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
            <div className={styles.headerTitle}>File a leave</div>
            <div className={styles.headerSub}>
              {fmt(days)} DAY{days === 1 ? "" : "S"} FROM {startDate}
            </div>
          </div>
          <span className={styles.esc} onClick={close} style={{ cursor: "pointer" }}>
            ESC
          </span>
        </div>

        <div className={styles.body}>
          {/* Days + start date */}
          <div className={styles.fieldLabelRow}>
            <span className={styles.fieldLabel}>DAYS</span>
            <button
              type="button"
              className={styles.stepBtn}
              onClick={() => setDays((d) => Math.max(1, d - 1))}
            >
              −
            </button>
            <span className={styles.stepValue}>{fmt(days)}</span>
            <button
              type="button"
              className={styles.stepBtn}
              onClick={() => setDays((d) => Math.min(30, d + 1))}
            >
              ＋
            </button>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={styles.input}
              style={{ marginLeft: "auto", width: 150 }}
            />
          </div>

          {/* Spend from */}
          <div>
            <div className={styles.fieldLabel} style={{ marginBottom: 8 }}>
              SPEND FROM
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {SOURCES.map((s) => {
                const left = availableFor(s.source, balances);
                const after = s.source === "unpaid" ? null : left - days;
                const short = after !== null && after < 0;
                const sel = source === s.source;
                return (
                  <div
                    key={s.key}
                    className={`${styles.option} ${sel ? styles.optionSel : ""}`}
                    onClick={() => setSource(s.source)}
                  >
                    <span className={styles.chip}>{s.key}</span>
                    <span
                      className={styles.optionTitle}
                      style={{ color: sel ? "var(--ink)" : "var(--mut)" }}
                    >
                      {s.label}
                    </span>
                    <span
                      className={styles.spendMath}
                      style={{
                        color: short
                          ? "var(--sig)"
                          : sel
                            ? "var(--ink)"
                            : "var(--dim)",
                      }}
                    >
                      {s.source === "unpaid"
                        ? "—"
                        : short
                          ? `${fmt(left)} → not enough`
                          : `${fmt(left)} → ${fmt(after as number)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <input
            placeholder="note — optional, goes in the HR export"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={styles.input}
          />

          {error && <div className={styles.error}>{error}</div>}
        </div>

        <div className={styles.footer}>
          <span className={styles.footerNote}>
            teammates see the dates, not the note
          </span>
          <button
            type="button"
            className={styles.primary}
            onClick={confirm}
            disabled={pending || selectedShort}
          >
            {pending ? "Filing…" : "File leave"}
          </button>
        </div>
      </div>
    </>
  );
}
