"use client";

import { todayIso } from "@/lib/ledger/dates";
import { useState } from "react";
import type { ReportData } from "@/lib/pdf/report-data";
import { useAppData } from "../runtime";
import styles from "./export.module.css";

type GenState = "idle" | "busy" | "done";
type IncKey = "leaveHistory" | "holidayWork" | "proofImages";

const INCLUDES: [IncKey, string][] = [
  ["leaveHistory", "Leave history with notes"],
  ["holidayWork", "Holiday work + IL/OT decisions"],
  ["proofImages", "Proof images as appendix"],
];

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "report";

function ImageGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1.5" y="3" width="13" height="10" rx="1" stroke="#9A968C" strokeWidth="1.1" />
      <circle cx="5.5" cy="6.5" r="1.1" fill="#9A968C" />
      <path d="M2.5 11.5l3.2-3 2.6 2.4 2.2-2 3 2.6" stroke="#9A968C" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

export function ExportView({
  data,
  canTeam,
  teamCount,
}: {
  data: ReportData;
  canTeam: boolean;
  teamCount: number;
}) {
  const { year } = useAppData();
  const [who, setWho] = useState<"me" | "team">("me");
  const [inc, setInc] = useState<Record<IncKey, boolean>>({
    leaveHistory: true,
    holidayWork: true,
    proofImages: true,
  });
  const [gen, setGen] = useState<GenState>("idle");

  const slug = slugify(data.employee);
  const proofCount = inc.proofImages ? data.proofCount : 0;
  const pageCount = inc.proofImages ? data.pageCount : 1;
  const filename =
    who === "me"
      ? `tally_${slug}_${year}.pdf · ${pageCount} pages · ${proofCount} proof images`
      : `tally_team_${year}.zip · ${teamCount} PDFs`;

  const chooseWho = (w: "me" | "team") => {
    if (w === "team" && !canTeam) return;
    setWho(w);
    setGen("idle");
  };
  const toggleInc = (k: IncKey) => {
    setInc((s) => ({ ...s, [k]: !s[k] }));
    setGen("idle");
  };

  async function generate() {
    if (gen !== "idle") return;
    setGen("busy");
    const incParam = [
      inc.leaveHistory && "leave",
      inc.holidayWork && "holiday",
      inc.proofImages && "proof",
    ]
      .filter(Boolean)
      .join(",");
    try {
      const res = await fetch(`/api/export?year=${year}&who=${who}&inc=${incParam}`);
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = who === "me" ? `tally_${slug}_${year}.pdf` : `tally_team_${year}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setGen("done");
    } catch {
      setGen("idle");
    }
  }

  const genStyle: React.CSSProperties =
    gen === "done"
      ? { background: "transparent", color: "var(--ink)" }
      : { background: "var(--btnbg)", color: "var(--btnfg)" };
  const genLabel =
    gen === "done" ? "✓ PDF ready — check downloads" : gen === "busy" ? "Generating…" : "Generate PDF";

  const on = (v: boolean) => (v ? "var(--ink)" : "var(--faint)");

  return (
    <>
      {/* ================= Desktop ================= */}
      <div className={styles.desk}>
        <div className={styles.controls}>
          <div className={styles.eyebrow}>EXPORT FOR HR · ONE PDF PER PERSON-YEAR</div>

          <div>
            <div className={`${styles.label} ${styles.yearLabel}`}>YEAR</div>
            <div className={styles.years}>
              <span className={styles.yearOn}>{year}</span>
              <span className={styles.yearOff}>{year - 1}</span>
            </div>
          </div>

          <div>
            <div className={styles.label}>WHO</div>
            <button type="button" className={`${styles.opt} ${styles.optDivider}`} onClick={() => chooseWho("me")}>
              <span className={styles.mark} style={{ color: on(who === "me") }}>
                {who === "me" ? "●" : "○"}
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: who === "me" ? "var(--ink)" : "var(--mut)" }}>
                Just me — {data.employee}
              </span>
            </button>
            <button type="button" className={styles.opt} onClick={() => chooseWho("team")} disabled={!canTeam}>
              <span className={styles.mark} style={{ color: on(who === "team") }}>
                {who === "team" ? "●" : "○"}
              </span>
              <span style={{ fontSize: 13.5, color: who === "team" ? "var(--ink)" : "var(--mut)" }}>
                Whole team <span className={styles.hint}>{teamCount} PDFs · ADMIN/MGR/HR only</span>
              </span>
            </button>
          </div>

          <div>
            <div className={styles.label}>INCLUDE</div>
            {INCLUDES.map(([k, label]) => (
              <button key={k} type="button" className={`${styles.opt} ${styles.incRow}`} onClick={() => toggleInc(k)}>
                <span className={`${styles.mark} ${styles.markW}`} style={{ color: on(inc[k]) }}>
                  {inc[k] ? "✓" : "○"}
                </span>
                <span style={{ color: on(inc[k]) }}>{label}</span>
              </button>
            ))}
          </div>

          <div className={styles.genWrap}>
            <div className={styles.filename}>{filename}</div>
            <button type="button" className={styles.gen} style={genStyle} onClick={generate}>
              {genLabel}
            </button>
          </div>
        </div>

        <div className={styles.preview}>
          <div className={styles.paper}>
            <div className={styles.pHead}>
              <svg width="14" height="14" viewBox="0 0 26 26" fill="none" aria-hidden>
                <path d="M5 5v16M11 5v16M17 5v16M2.5 22.5L23.5 3.5" stroke="#1A1F2E" strokeWidth="2.6" strokeLinecap="round" />
              </svg>
              <div className={styles.pBrand}>TALLY — ANNUAL LEAVE REPORT</div>
              <div className={styles.pDate}>{todayIso()}</div>
            </div>
            <div className={styles.pMeta}>
              <div>
                <div className={styles.pLabel}>EMPLOYEE</div>
                <div className={styles.pName}>{data.employee}</div>
                <div style={{ color: "#666" }}>{data.team}</div>
              </div>
              <div>
                <div className={styles.pLabel}>PERIOD</div>
                <div className={styles.pMono}>{data.period}</div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div className={styles.pLabel}>REF</div>
                <div className={styles.pMono}>{data.ref}</div>
              </div>
            </div>
            <div className={styles.pStats}>
              <div>
                <div className={styles.pStatNum}>
                  {data.summary.vlUsed}
                  <span className={styles.pStatSub}>/{data.summary.vlTotal}</span>
                </div>
                <div className={styles.pStatLabel}>VL USED</div>
              </div>
              <div>
                <div className={styles.pStatNum}>
                  {data.summary.slUsed}
                  <span className={styles.pStatSub}>/{data.summary.slTotal}</span>
                </div>
                <div className={styles.pStatLabel}>SL USED</div>
              </div>
              <div>
                <div className={styles.pStatNum}>{data.summary.ilEarned}</div>
                <div className={styles.pStatLabel}>IL EARNED</div>
              </div>
              <div>
                <div className={styles.pStatNum}>
                  {data.summary.otDays}
                  <span className={styles.pStatSub}> d</span>
                </div>
                <div className={styles.pStatLabel}>OT PAID</div>
              </div>
            </div>

            {inc.leaveHistory && (
              <div className={styles.pSection}>
                <div className={styles.pSecHead}>
                  <span className={styles.pSecNum}>1</span>
                  <span className={styles.pSecTitle}>LEAVES TAKEN</span>
                </div>
                {data.leaves.map((l, i) => (
                  <div key={i} className={styles.pLeaveRow}>
                    <div className={styles.pCellMono}>{l.date}</div>
                    <div style={{ fontWeight: 600 }}>{l.title}</div>
                    <div style={{ color: "#777" }}>{l.note}</div>
                    <div style={{ fontFamily: "var(--font-mono), monospace", textAlign: "right" }}>−{l.days}</div>
                  </div>
                ))}
              </div>
            )}

            {inc.holidayWork && (
              <div className={styles.pSection}>
                <div className={styles.pSecHead}>
                  <span className={styles.pSecNum}>2</span>
                  <span className={styles.pSecTitle}>HOLIDAYS WORKED — CREDITED AS IL OR PAID AS OT DAY</span>
                </div>
                {data.holidayWork.map((h, i) => (
                  <div key={i} className={styles.pHolRow}>
                    <div className={styles.pCellMono}>{h.date}</div>
                    <div>{h.title}</div>
                    <div style={{ fontFamily: "var(--font-mono), monospace", fontWeight: 600 }}>{h.amt}</div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono), monospace",
                        color: h.proofMissing ? "#C0392B" : "#666",
                        textAlign: "right",
                      }}
                    >
                      {h.proofText}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {inc.proofImages && (
              <div className={styles.pSection}>
                <div className={styles.pSecHead} style={{ marginBottom: 6 }}>
                  <span className={styles.pSecNum}>3</span>
                  <span className={styles.pSecTitle}>PROOF OF WORK — FULL-SIZE IMAGES ON THE PAGES BELOW</span>
                </div>
                <div className={styles.pThumbs}>
                  {data.proofs.map((p, i) => (
                    <div key={i} className={styles.pThumb}>
                      <div className={styles.pThumbBox}>
                        <ImageGlyph />
                      </div>
                      <div className={styles.pCap}>
                        {p.page} · {p.file}
                      </div>
                      <div className={styles.pCap2}>
                        {p.date} · {p.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.pFoot}>
              <div>Signed digitally via Tally · tally.app/r/{data.ref}</div>
              <div style={{ marginLeft: "auto", fontFamily: "var(--font-mono), monospace" }}>PAGE 1 OF {pageCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= Mobile ================= */}
      <div className={styles.mob}>
        <div className={styles.mHead}>
          <div className={styles.mEyebrow}>EXPORT FOR HR</div>
          <div className={styles.mTitle}>Your {year}, one PDF</div>
        </div>
        <div className={styles.mCards}>
          <div className={styles.mCard}>
            <span className={styles.mCardLabel}>YEAR</span>
            <span className={styles.mCardValue}>{year}</span>
          </div>
          <button type="button" className={styles.mCard} onClick={() => chooseWho(who === "me" ? "team" : "me")}>
            <span className={styles.mCardLabel}>WHO</span>
            <span className={styles.mWho}>{who === "me" ? "Just me" : "Whole team"}</span>
            <span style={{ color: "var(--faint)" }}>⇄</span>
          </button>
          <div className={styles.mInclude}>
            <div className={`${styles.mCardLabel} ${styles.mIncLabel}`}>INCLUDE</div>
            {INCLUDES.map(([k, label]) => (
              <button key={k} type="button" className={styles.mIncRow} onClick={() => toggleInc(k)}>
                <span className={styles.markW} style={{ fontFamily: "var(--font-mono), monospace", color: on(inc[k]) }}>
                  {inc[k] ? "✓" : "○"}
                </span>
                <span style={{ color: on(inc[k]) }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className={styles.mThumbWrap}>
          <div className={styles.mThumb}>
            <div className={styles.mThumbTitle}>TALLY — ANNUAL LEAVE REPORT</div>
            <div className={styles.mBlocks}>
              <div className={styles.mBlock} />
              <div className={styles.mBlock} />
              <div className={styles.mBlock} />
              <div className={styles.mBlock} />
            </div>
            <div className={styles.mLine} style={{ marginTop: 5 }} />
            <div className={styles.mLine} />
            <div className={styles.mLine} style={{ width: "70%" }} />
            <div className={styles.mImgs}>
              <div className={styles.mImg} />
              <div className={styles.mImg} />
              <div className={styles.mImg} />
            </div>
            <div className={styles.mThumbFoot}>
              {pageCount} PAGES · {proofCount} PROOF IMAGES
            </div>
          </div>
        </div>
        <div className={styles.mGen}>
          <div className={styles.mFilename}>{filename}</div>
          <button type="button" className={styles.mGenBtn} style={genStyle} onClick={generate}>
            {genLabel}
          </button>
        </div>
      </div>
    </>
  );
}
