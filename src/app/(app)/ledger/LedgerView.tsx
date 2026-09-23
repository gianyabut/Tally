"use client";

import { useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TallyMarks } from "@/components/ledger/TallyMarks";
import { buildTallyRows, buildTimeline, fmt } from "@/lib/ledger/view";
import { useAppData, useModal, useToast } from "../runtime";
import { attachProof } from "../actions";
import styles from "./ledger.module.css";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function weekday(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  return WEEKDAYS[d.getUTCDay()];
}

export function LedgerView() {
  const { entries, balances, nextHoliday, year, holidays } = useAppData();
  const { open } = useModal();
  const { showToast } = useToast();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const fileInput = useRef<HTMLInputElement>(null);
  const pendingEntryId = useRef<string | null>(null);

  const tallyRows = buildTallyRows(balances);
  const groups = buildTimeline(entries, holidays);

  function triggerAttach(entryId: string) {
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

  return (
    <div className={styles.wrap}>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={onFilePicked}
      />

      {/* Balances band */}
      <div className={styles.band}>
        <div className={styles.totalBlock}>
          <div className={styles.balLabel}>DAYS OFF LEFT</div>
          <div className={styles.balTotal}>{fmt(balances.totalLeft)}</div>
          <div className={styles.balCaption}>
            {fmt(balances.vlLeft)} VL + {fmt(balances.slLeft)} SL +{" "}
            {fmt(balances.ilAvailable)} IL
          </div>
        </div>

        <div className={styles.tallyCol}>
          {tallyRows.map((t) => (
            <div key={t.key} className={styles.tallyRow}>
              <span className={styles.tallyLabel}>{t.label}</span>
              <TallyMarks
                lit={t.lit}
                dim={t.dim}
                pending={t.pending}
                litColor={t.litColor}
              />
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
          {nextHoliday && (
            <div className={styles.holidayCard}>
              <div className={styles.holidayEyebrow}>
                NEXT HOLIDAY · T−{nextHoliday.daysUntil}D
              </div>
              <div className={styles.holidayName}>
                {nextHoliday.holiday.name}
              </div>
              <div className={styles.holidayMeta}>
                {nextHoliday.holiday.date} · {weekday(nextHoliday.holiday.date)}{" "}
                · {nextHoliday.holiday.type.toUpperCase()}
              </div>
              <button
                type="button"
                className={styles.holidayBtn}
                onClick={() => open("log")}
              >
                Log holiday work
              </button>
            </div>
          )}
          <Link href="/export" className={styles.exportRow}>
            <span style={{ fontSize: 13.5, color: "var(--ring2)" }}>
              {year} HR report
            </span>
            <span
              style={{ marginLeft: "auto", fontSize: 13.5, fontWeight: 600 }}
            >
              Export →
            </span>
          </Link>
        </div>
      </div>

      {/* Timeline */}
      <div className={styles.timeline}>
        <div className={styles.timelineHead}>
          <span className={styles.timelineHeadLabel}>TIMELINE·{year}</span>
          <span className={styles.timelineHeadN}>n={entries.length}</span>
        </div>

        {entries.length === 0 && (
          <div className={styles.empty}>
            NO ENTRIES YET — LOG HOLIDAY WORK OR FILE A LEAVE (⌘K)
          </div>
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
                  {r.pending ? (
                    <div
                      className={styles.metaPending}
                      onClick={() => triggerAttach(r.id)}
                    >
                      ● PROOF MISSING — ADD TO CREDIT
                    </div>
                  ) : (
                    <div
                      className={`${styles.metaNormal} ${
                        r.hasProof ? styles.metaClickable : ""
                      }`}
                      onClick={
                        r.hasProof
                          ? () => open("proof", { entry: r.entry })
                          : undefined
                      }
                    >
                      {r.metaLine}
                    </div>
                  )}
                </div>
                <span className={styles.amt} style={{ color: r.amtColor }}>
                  {r.amtText}
                </span>
              </div>
            ))}
          </div>
        ))}

        {entries.length > 0 && (
          <div className={styles.legend}>
            <span>
              <span
                className={styles.legendSwatch}
                style={{ background: "var(--ink)" }}
              />
              OT DAY
            </span>
            <span>
              <span
                className={styles.legendSwatch}
                style={{ background: "var(--ring2)" }}
              />
              IL EARNED
            </span>
            <span>
              <span
                className={styles.legendSwatch}
                style={{
                  borderRadius: "50%",
                  border: "1.5px solid var(--faint)",
                  width: 7,
                  height: 7,
                }}
              />
              SPENT
            </span>
            <span style={{ color: "var(--sig)" }}>
              <span
                className={styles.legendSwatch}
                style={{ background: "var(--sig)" }}
              />
              NEEDS YOU
            </span>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <span className={styles.footerLabel}>
          SYNCED · {entries.length} RECORDS
        </span>
        <Link
          href="/export"
          className={styles.link}
          style={{ marginLeft: "auto" }}
        >
          Export {year} →
        </Link>
      </div>
    </div>
  );
}
