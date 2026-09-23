"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { availableFor } from "@/lib/ledger/balances";
import { leaveEnd, nextWorkingDay, shortDate, todayIso } from "@/lib/ledger/dates";
import { fmt } from "@/lib/ledger/view";
import { useAppData, useModal, useToast } from "../runtime";
import { fileLeave } from "../actions";
import { typingInField } from "./keys";
import styles from "../overlays.module.css";

type Source = "vl" | "sl" | "il" | "unpaid";
const SOURCES: { key: string; label: string; source: Source; code: string }[] = [
  { key: "1", label: "Vacation", source: "vl", code: "VL" },
  { key: "2", label: "Sick", source: "sl", code: "SL" },
  { key: "3", label: "In-Lieu", source: "il", code: "IL" },
  { key: "4", label: "Unpaid", source: "unpaid", code: "Unpaid" },
];

export function FileLeaveModal() {
  const { balances, holidays } = useAppData();
  const { close, modal } = useModal();
  const { showToast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const holidaySet = useMemo(() => new Set(holidays.map((h) => h.date)), [holidays]);
  const [start, setStart] = useState(() => nextWorkingDay(todayIso(), holidaySet));
  const [days, setDays] = useState(3);
  const [source, setSource] = useState<Source>("vl");
  const [note, setNote] = useState("");
  const dateInput = useRef<HTMLInputElement>(null);

  const end = leaveEnd(start, days, holidaySet);
  const selected = SOURCES.find((s) => s.source === source)!;

  function confirm() {
    if (pending) return;
    if (source !== "unpaid" && availableFor(source, balances) < days) {
      showToast(`Not enough ${selected.code} — pick another source`);
      return;
    }
    startTransition(async () => {
      const res = await fileLeave({ source, days, startDate: start, note });
      if (!res.ok) return showToast(res.error);
      close();
      const range =
        start === end
          ? shortDate(start)
          : start.slice(0, 7) === end.slice(0, 7)
            ? `${shortDate(start)}–${Number(end.slice(8))}`
            : `${shortDate(start)}–${shortDate(end)}`;
      showToast(`Leave filed — ${range} (−${days.toFixed(1)} ${selected.code})`);
      router.refresh();
    });
  }

  // 1–4 pick the source, Enter files.
  const confirmRef = useRef(confirm);
  useEffect(() => {
    confirmRef.current = confirm;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typingInField(e) || e.metaKey || e.ctrlKey) return;
      const hit = SOURCES.find((s) => s.key === e.key);
      if (hit) setSource(hit.source);
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
      <div className={styles.panel} style={{ top: modal.top + 44 }} role="dialog" aria-label="File a leave">
        <div className={styles.head}>
          <div>
            <div className={styles.headTitle}>
              File a leave —{" "}
              <span
                className={styles.pick}
                role="button"
                tabIndex={0}
                onClick={() => dateInput.current?.showPicker?.()}
                onKeyDown={(e) => e.key === " " && dateInput.current?.showPicker?.()}
              >
                {shortDate(start)}
                <input
                  ref={dateInput}
                  type="date"
                  className={styles.pickControl}
                  style={{ pointerEvents: "none" }}
                  tabIndex={-1}
                  value={start}
                  onChange={(e) => e.target.value && setStart(e.target.value)}
                  aria-label="First day of leave"
                />
              </span>{" "}
              → {shortDate(end)}
            </div>
            <div className={styles.headSub}>
              {fmt(days)} WORKING {days === 1 ? "DAY" : "DAYS"}
            </div>
          </div>
          <button type="button" className={styles.esc} onClick={close}>
            ESC
          </button>
        </div>

        <div className={`${styles.body} ${styles.bodyLeave}`}>
          <div className={styles.daysRow}>
            <span className={styles.fieldLabel}>DAYS</span>
            <button type="button" className={styles.step} onClick={() => setDays((d) => Math.max(1, d - 1))} aria-label="Fewer days">
              −
            </button>
            <span className={styles.stepValue}>{fmt(days)}</span>
            <button type="button" className={styles.step} onClick={() => setDays((d) => Math.min(30, d + 1))} aria-label="More days">
              ＋
            </button>
          </div>

          <div>
            <div className={styles.fieldLabel} style={{ marginBottom: 8 }}>
              SPEND FROM
            </div>
            <div className={styles.options}>
              {SOURCES.map((s) => {
                const left = availableFor(s.source, balances);
                const after = s.source === "unpaid" ? null : left - days;
                const short = after !== null && after < 0;
                const on = source === s.source;
                return (
                  <button
                    key={s.key}
                    type="button"
                    className={`${styles.option} ${styles.optionLeave} ${on ? styles.optionOn : ""}`}
                    onClick={() => setSource(s.source)}
                  >
                    <span className={styles.chip}>{s.key}</span>
                    <span className={styles.optTitle} style={{ color: on ? "var(--ink)" : "var(--mut)" }}>
                      {s.label}
                    </span>
                    <span
                      className={styles.math}
                      style={{ color: short ? "var(--sig)" : on ? "var(--ink)" : "var(--dim)" }}
                    >
                      {after === null ? "—" : short ? `${fmt(left)} → not enough` : `${fmt(left)} → ${fmt(after)}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <input
            className={styles.line}
            placeholder="note — optional, goes in the HR export"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            aria-label="Note"
          />
        </div>

        <div className={styles.foot}>
          <span className={styles.footNote}>teammates see the dates, not the note</span>
          <button type="button" className={styles.primary} onClick={confirm} disabled={pending}>
            File leave
          </button>
        </div>
      </div>
    </>
  );
}
