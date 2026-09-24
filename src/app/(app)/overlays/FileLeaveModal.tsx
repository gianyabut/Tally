"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { availableFor } from "@/lib/ledger/balances";
import {
  addMonths,
  dateRange,
  isWorkingDay,
  leaveEnd,
  longDate,
  monthCells,
  monthTitle,
  nextWorkingDay,
  todayIso,
  workingDaysBetween,
} from "@/lib/ledger/dates";
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
const DOW = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const MAX_DAYS = 30; // the server caps a single leave at 30 working days

export function FileLeaveModal() {
  const { balances, holidays } = useAppData();
  const { close, modal } = useModal();
  const { showToast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const holidaySet = useMemo(() => new Set(holidays.map((h) => h.date)), [holidays]);
  const holidayName = useMemo(() => new Map(holidays.map((h) => [h.date, h.name])), [holidays]);

  // The picked range, as tapped: first day, then last. Past months are fine.
  const [start, setStart] = useState(() => nextWorkingDay(todayIso(), holidaySet));
  const [end, setEnd] = useState(start);
  const [picking, setPicking] = useState<"first" | "last">("first");
  const [month, setMonth] = useState(start.slice(0, 7));
  const [halfLast, setHalfLast] = useState(false);
  const [source, setSource] = useState<Source>("vl");
  const [note, setNote] = useState("");

  // What actually gets filed: the working days inside the range, minus half of
  // the last one if toggled. The server re-derives the end from (first working
  // day, days) — rounding a half up — so send that start.
  const whole = workingDaysBetween(start, end, holidaySet);
  const half = halfLast && whole > 0;
  const days = half ? whole - 0.5 : whole;
  const first = whole > 0 ? nextWorkingDay(start, holidaySet) : start;
  const last = whole > 0 ? leaveEnd(first, whole, holidaySet) : end;
  const selected = SOURCES.find((s) => s.source === source)!;

  function tap(d: string) {
    if (picking === "first" || d < start) {
      setStart(d);
      setEnd(d);
      setPicking("last");
    } else {
      setEnd(d);
      setPicking("first");
    }
  }

  function confirm() {
    if (pending) return;
    if (days === 0) return showToast("Pick at least one working day");
    if (days > MAX_DAYS) return showToast(`${MAX_DAYS} working days max — file it as two leaves`);
    if (first.slice(0, 4) !== last.slice(0, 4)) return showToast("File each year's days as a separate leave");
    if (source !== "unpaid" && availableFor(source, balances) < days) {
      showToast(`Not enough ${selected.code} — pick another source`);
      return;
    }
    startTransition(async () => {
      const res = await fileLeave({ source, days, startDate: first, note });
      if (!res.ok) return showToast(res.error);
      close();
      showToast(`Leave filed — ${dateRange(first, last)} (−${days.toFixed(1)} ${selected.code})`);
      router.refresh();
    });
  }

  // 1–4 pick the source, Enter files (unless Enter is pressing a focused button).
  const confirmRef = useRef(confirm);
  useEffect(() => {
    confirmRef.current = confirm;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typingInField(e) || e.metaKey || e.ctrlKey) return;
      const hit = SOURCES.find((s) => s.key === e.key);
      if (hit) setSource(hit.source);
      else if (e.key === "Enter" && (e.target as HTMLElement | null)?.tagName !== "BUTTON") {
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
      <div
        className={`${styles.panel} ${styles.leavePanel}`}
        style={{ "--at": `${modal.top}px` } as React.CSSProperties}
        role="dialog"
        aria-label="File a leave"
      >
        <div className={styles.head}>
          <div>
            <div className={styles.headTitle}>File a leave</div>
            <div className={styles.headSub}>PAST OR UPCOMING DATES</div>
          </div>
          <button type="button" className={styles.esc} onClick={close} aria-label="Close">
            <span className={styles.deskOnly}>ESC</span>
            <span className={styles.mobOnly}>✕</span>
          </button>
        </div>

        <div className={`${styles.body} ${styles.bodyLeave}`}>
          <div className={styles.cal}>
            <div className={styles.calNav}>
              <button type="button" className={styles.calStep} onClick={() => setMonth((m) => addMonths(m, -1))} aria-label="Previous month">
                ‹
              </button>
              <span className={styles.calMonth} aria-live="polite">
                {monthTitle(month).toUpperCase()}
              </span>
              <button type="button" className={styles.calStep} onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="Next month">
                ›
              </button>
            </div>
            <div className={styles.calGrid}>
              {DOW.map((d) => (
                <span key={d} className={styles.calDow}>
                  {d}
                </span>
              ))}
              {monthCells(month).map((d, i) => {
                if (!d) return <span key={`blank-${i}`} />;
                const edge = d === start || d === end;
                const inside = d > start && d < end;
                const off = !isWorkingDay(d, holidaySet);
                const cls = edge ? styles.calEdge : `${inside ? styles.calIn : ""} ${off ? styles.calOff : ""}`;
                return (
                  <button
                    key={d}
                    type="button"
                    className={`${styles.calDay} ${cls}`}
                    onClick={() => tap(d)}
                    aria-label={longDate(d)}
                    aria-pressed={edge || inside}
                    title={holidayName.get(d)}
                  >
                    {Number(d.slice(8))}
                    {half && d === last && <span className={styles.calHalf}>½</span>}
                  </button>
                );
              })}
            </div>
            <div className={styles.calHint}>TAP FIRST DAY, THEN LAST · WEEKENDS &amp; HOLIDAYS DON&apos;T COUNT</div>
          </div>

          <div className={styles.calSum}>
            <span className={styles.calSumN}>{fmt(days)}</span>
            <span className={styles.calSumText}>
              WORKING {days <= 1 ? "DAY" : "DAYS"}
              <span className={styles.deskOnly}> · </span>
              <span className={styles.calSumRange}>{dateRange(first, last).toUpperCase()}</span>
            </span>
            <div className={styles.seg} role="group" aria-label="Last day">
              <button
                type="button"
                className={`${styles.segBtn} ${half ? "" : styles.segOn}`}
                aria-pressed={!half}
                onClick={() => setHalfLast(false)}
              >
                FULL
              </button>
              <button
                type="button"
                className={`${styles.segBtn} ${half ? styles.segOn : ""}`}
                aria-pressed={half}
                disabled={whole === 0}
                onClick={() => setHalfLast(true)}
              >
                {whole === 1 ? "½ DAY" : "½ LAST DAY"}
              </button>
            </div>
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
