"use client";

import { useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HolidayRuler } from "@/components/ledger/HolidayRuler";
import { TallyMarks } from "@/components/ledger/TallyMarks";
import { daysBetween, weekday } from "@/lib/ledger/dates";
import { buildRuler } from "@/lib/ledger/ruler";
import {
  buildTallyRows,
  buildTimeline,
  fmt,
  type TimelineItem,
} from "@/lib/ledger/view";
import { useAppData, useModal, useToast } from "../runtime";
import { attachProof } from "../actions";
import styles from "./ledger.module.css";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "S"}`;
const awayLabel = (days: number) =>
  days === 0 ? "TODAY" : days === 1 ? "DAY AWAY" : "DAYS AWAY";

export function LedgerView() {
  const { entries, balances, nextHoliday, ahead, year, holidays } = useAppData();
  const { open } = useModal();
  const { showToast } = useToast();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const fileInput = useRef<HTMLInputElement>(null);
  const pendingEntryId = useRef<string | null>(null);

  const tallyRows = buildTallyRows(balances);
  const groups = buildTimeline(entries, holidays);
  const totalLeft = fmt(balances.totalLeft);
  const caption = `${fmt(balances.vlLeft)} VL + ${fmt(balances.slLeft)} SL + ${fmt(balances.ilAvailable)} IL`;

  const ruler = buildRuler(ahead);
  const aheadSummary =
    plural(ruler.holidayCount, "HOLIDAY") +
    (ruler.leaveCount > 0 ? ` · ${plural(ruler.leaveCount, "LEAVE")} FILED` : "");
  // The window crosses New Year, so its first holiday can be next year's;
  // past the window, fall back to this year's next holiday.
  const next = ahead.holidays[0]
    ? { holiday: ahead.holidays[0], daysUntil: daysBetween(ahead.from, ahead.holidays[0].date) }
    : nextHoliday;

  function attachFor(entryId: string) {
    pendingEntryId.current = entryId;
    fileInput.current?.click();
  }

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const entryId = pendingEntryId.current;
    e.target.value = "";
    if (!file || !entryId) return;
    const fd = new FormData();
    fd.set("entryId", entryId);
    fd.set("proof", file);
    startTransition(async () => {
      const res = await attachProof(fd);
      if (res.ok) {
        showToast("Proof attached — IL credited");
        router.refresh();
      } else {
        showToast(res.error);
      }
    });
  }

  /** The meta line under a timeline title: attach-proof prompt, proof link, or plain. */
  function renderMeta(r: TimelineItem, className: string, pendingClass = "") {
    if (r.pending)
      return (
        <button
          type="button"
          className={`${className} ${pendingClass}`}
          style={{ color: "var(--sig)" }}
          onClick={() => attachFor(r.id)}
        >
          ● PROOF MISSING — ADD TO CREDIT
        </button>
      );
    if (r.hasProof)
      return (
        <button type="button" className={className} onClick={() => open("proof", { entry: r.entry })}>
          {r.metaLine}
        </button>
      );
    return <div className={className}>{r.metaLine}</div>;
  }

  return (
    <>
      <input ref={fileInput} type="file" accept="image/*" hidden onChange={onFilePicked} />

      {/* ================= Desktop ================= */}
      <div className={styles.desk}>
        <div className={styles.band}>
          <div className={styles.totalBlock}>
            <div className={styles.balLabel}>DAYS OFF LEFT</div>
            <div className={styles.balTotal}>{totalLeft}</div>
            <div className={styles.balCaption}>{caption}</div>
          </div>

          <div className={styles.tallyCol}>
            {tallyRows.map((t) => (
              <div key={t.key} className={styles.tallyRow}>
                <span className={styles.tallyLabel}>{t.label}</span>
                <TallyMarks lit={t.lit} dim={t.dim} pending={t.pending} litColor={t.litColor} />
                <span className={styles.tallyVal}>
                  {t.val}
                  <span className={styles.tallySub} style={{ color: t.subColor }}>
                    {" "}
                    {t.sub}
                  </span>
                </span>
              </div>
            ))}
          </div>

          <div className={styles.sideCol}>
            <div className={styles.ahead}>
              <div className={styles.aheadHead}>
                <span>NEXT {ahead.days} DAYS</span>
                <span className={styles.aheadSum}>{aheadSummary}</span>
              </div>
              <HolidayRuler ruler={ruler} />
              <div className={styles.aheadLegend}>
                <span>
                  <i className={styles.lgToday} />
                  TODAY
                </span>
                <span>
                  <i className={styles.lgHoliday} />
                  HOLIDAY
                </span>
                <span>
                  <i className={styles.lgLeave} />
                  YOUR LEAVE
                </span>
              </div>
              {next && (
                <div className={styles.next}>
                  <div>
                    <div className={styles.nextEyebrow}>NEXT HOLIDAY</div>
                    <div className={styles.nextName}>{next.holiday.name}</div>
                    <div className={styles.nextMeta}>
                      {next.holiday.date} · {weekday(next.holiday.date)} ·{" "}
                      {next.holiday.type.toUpperCase()}
                    </div>
                  </div>
                  <div className={styles.nextCount}>
                    <b>{next.daysUntil}</b>
                    <span>{awayLabel(next.daysUntil)}</span>
                  </div>
                </div>
              )}
              <div className={styles.aheadBtns}>
                <button type="button" className={styles.aheadBtn} onClick={() => open("leave")}>
                  File a leave
                </button>
                <button type="button" className={styles.aheadBtnGhost} onClick={() => open("log")}>
                  Log holiday work
                </button>
              </div>
            </div>
            <Link href="/export" className={styles.exportRow}>
              <span className={styles.exportRowLabel}>{year} HR report</span>
              <span className={styles.exportRowCta}>Export →</span>
            </Link>
          </div>
        </div>

        <div className={styles.timeline}>
          <div className={styles.tHead}>
            <span className={styles.tHeadLabel}>TIMELINE·{year}</span>
            <span className={styles.tHeadN}>n={entries.length}</span>
          </div>

          {entries.length === 0 && (
            <div className={styles.empty}>NO ENTRIES YET — LOG HOLIDAY WORK OR FILE A LEAVE</div>
          )}

          {groups.map((g, gi) => (
            <div key={gi} className={styles.rail}>
              {g.items.map((r) => (
                <div key={r.id} className={styles.row}>
                  <span className={styles.mon} style={{ color: r.monColor }}>
                    {r.mon}
                  </span>
                  <span
                    className={styles.node}
                    style={{
                      background: r.nodeBg,
                      outline: `1px solid ${r.nodeOutline}`,
                      borderRadius: r.nodeRad,
                    }}
                  />
                  <span className={styles.day} style={{ color: r.dateColor }}>
                    {r.day}
                  </span>
                  <div className={styles.rowMain}>
                    <div className={styles.rowTitle}>{r.title}</div>
                    {renderMeta(r, styles.meta, styles.metaPending)}
                  </div>
                  <span className={styles.amt} style={{ color: r.amtColor }}>
                    {r.amtText}
                  </span>
                </div>
              ))}
            </div>
          ))}

          <div className={styles.legend}>
            <span>
              <span className={styles.swatch} style={{ background: "var(--ink)" }} />
              OT DAY
            </span>
            <span>
              <span className={styles.swatch} style={{ background: "var(--ring2)" }} />
              IL EARNED
            </span>
            <span>
              <span className={styles.swatchSpent} />
              SPENT
            </span>
            <span style={{ color: "var(--sig)" }}>
              <span className={styles.swatch} style={{ background: "var(--sig)" }} />
              NEEDS YOU
            </span>
          </div>
        </div>

        <div className={styles.footer}>
          <span className={styles.footerLabel}>SYNCED · {entries.length} RECORDS</span>
          <Link href="/export" className={styles.footerLink}>
            Export {year} →
          </Link>
        </div>
      </div>

      {/* ================= Mobile ================= */}
      <div className={styles.mob}>
        <div className={styles.mTotal}>
          <div className={styles.balLabel}>DAYS OFF LEFT</div>
          <div className={styles.mBalTotal}>{totalLeft}</div>
          <div className={styles.mBalCaption}>{caption}</div>
          <div className={styles.mActions}>
            <button type="button" className={styles.mActionBtn} onClick={() => open("leave")}>
              File a leave
            </button>
            <button type="button" className={styles.mActionGhost} onClick={() => open("log")}>
              Log holiday work
            </button>
          </div>
        </div>

        <div className={styles.mTallies}>
          {tallyRows.map((t) => (
            <div key={t.key} className={styles.mTallyRow}>
              <span className={styles.mTallyLabel}>{t.label}</span>
              <TallyMarks lit={t.lit} dim={t.dim} pending={t.pending} litColor={t.litColor} height={22} />
              <span className={styles.mTallyVal}>
                {t.val}
                <span className={styles.mTallySub} style={{ color: t.subColor }}>
                  {" "}
                  {t.sub}
                </span>
              </span>
            </div>
          ))}
        </div>

        <div className={styles.mAhead}>
          <div className={styles.aheadHead}>
            <span>NEXT {ahead.days} DAYS</span>
            <span className={styles.aheadSum}>{aheadSummary}</span>
          </div>
          <HolidayRuler ruler={ruler} />
          {next && (
            <div className={styles.mNext}>
              <div>
                <div className={styles.mNextName}>{next.holiday.name}</div>
                <div className={styles.mNextMeta}>
                  {next.holiday.date.slice(5)} · {weekday(next.holiday.date)} ·{" "}
                  {next.holiday.type.toUpperCase()}
                </div>
              </div>
              <div className={`${styles.nextCount} ${styles.mNextCount}`}>
                <b>{next.daysUntil}</b>
                <span>{next.daysUntil === 0 ? "TODAY" : "DAYS"}</span>
              </div>
            </div>
          )}
        </div>

        <div className={styles.mScroll}>
          <div className={styles.mHead}>
            <span className={styles.mHeadLabel}>TIMELINE·{year}</span>
            <span className={styles.mHeadN}>n={entries.length}</span>
          </div>

          {entries.length === 0 && (
            <div className={styles.empty}>NO ENTRIES YET — TAP ＋ TO LOG</div>
          )}

          {groups.map((g, gi) => (
            <div key={gi} className={styles.mRail}>
              {g.items.map((r) => (
                <div key={r.id} className={styles.mRow}>
                  <span className={styles.mMon} style={{ color: r.monColor }}>
                    {r.mon}
                  </span>
                  <span
                    className={styles.mNode}
                    style={{
                      background: r.nodeBg,
                      outline: `1px solid ${r.nodeOutline}`,
                      borderRadius: r.nodeRad,
                    }}
                  />
                  <span className={styles.mDay} style={{ color: r.dateColor }}>
                    {r.day}
                  </span>
                  <div className={styles.rowMain}>
                    <div className={styles.mRowTitle}>{r.title}</div>
                    {renderMeta(r, styles.mMeta)}
                  </div>
                  <span className={styles.mAmt} style={{ color: r.amtColor }}>
                    {r.amtText}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
