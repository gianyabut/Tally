"use client";

import { useMemo, useState } from "react";
import type { ReportData } from "@/lib/pdf/report-data";
import { useAppData } from "../runtime";
import styles from "./export.module.css";

type GenState = "idle" | "busy" | "done";

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
  const [inc, setInc] = useState({
    leaveHistory: true,
    holidayWork: true,
    proofImages: true,
  });
  const [gen, setGen] = useState<GenState>("idle");

  const incParam = useMemo(
    () =>
      [
        inc.leaveHistory ? "leave" : "",
        inc.holidayWork ? "holiday" : "",
        inc.proofImages ? "proof" : "",
      ]
        .filter(Boolean)
        .join(","),
    [inc],
  );

  const slug = data.employee
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  const filename =
    who === "me"
      ? `tally_${slug}_${year}.pdf · ${data.pageCount} pages · ${data.proofCount} proof images`
      : `tally_team_${year}.zip · ${teamCount} PDFs`;

  async function generate() {
    if (gen === "busy") return;
    setGen("busy");
    try {
      const res = await fetch(
        `/api/export?year=${year}&who=${who}&inc=${incParam}`,
      );
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download =
        who === "me" ? `tally_${slug}_${year}.pdf` : `tally_team_${year}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      setGen("done");
    } catch {
      setGen("idle");
    }
  }

  const resetGen = () => setGen("idle");

  const includeRows: [keyof typeof inc, string][] = [
    ["leaveHistory", "Leave history with notes"],
    ["holidayWork", "Holiday work + IL/OT decisions"],
    ["proofImages", "Proof images as appendix"],
  ];

  return (
    <div className={styles.wrap}>
      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.eyebrow}>
          EXPORT FOR HR · ONE PDF PER PERSON-YEAR
        </div>

        <div>
          <div className={styles.groupLabel}>YEAR</div>
          <div className={styles.yearTabs}>
            <span className={styles.yearActive}>{year}</span>
            <span className={styles.yearInactive}>{year - 1}</span>
          </div>
        </div>

        <div>
          <div className={styles.groupLabel}>WHO</div>
          <div
            className={styles.optRow}
            onClick={() => {
              setWho("me");
              resetGen();
            }}
          >
            <span
              className={styles.optMark}
              style={{ color: who === "me" ? "var(--ink)" : "var(--faint)" }}
            >
              {who === "me" ? "●" : "○"}
            </span>
            <span
              className={styles.optText}
              style={{
                fontWeight: 600,
                color: who === "me" ? "var(--ink)" : "var(--mut)",
              }}
            >
              Just me — {data.employee}
            </span>
          </div>
          <div
            className={styles.optRow}
            style={{
              borderBottom: "none",
              opacity: canTeam ? 1 : 0.4,
              cursor: canTeam ? "pointer" : "default",
            }}
            onClick={() => {
              if (!canTeam) return;
              setWho("team");
              resetGen();
            }}
          >
            <span
              className={styles.optMark}
              style={{ color: who === "team" ? "var(--ink)" : "var(--faint)" }}
            >
              {who === "team" ? "●" : "○"}
            </span>
            <span
              className={styles.optText}
              style={{ color: who === "team" ? "var(--ink)" : "var(--mut)" }}
            >
              Whole team{" "}
              <span className={styles.hint}>
                {teamCount} PDFs · ADMIN/MGR/HR only
              </span>
            </span>
          </div>
        </div>

        <div>
          <div className={styles.groupLabel}>INCLUDE</div>
          {includeRows.map(([key, label]) => (
            <div
              key={key}
              className={styles.optRow}
              onClick={() => {
                setInc((s) => ({ ...s, [key]: !s[key] }));
                resetGen();
              }}
            >
              <span
                className={styles.optMark}
                style={{ color: inc[key] ? "var(--ink)" : "var(--faint)" }}
              >
                {inc[key] ? "✓" : "○"}
              </span>
              <span
                className={styles.optText}
                style={{ color: inc[key] ? "var(--ink)" : "var(--faint)" }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className={styles.genFooter}>
          <div className={styles.filename}>{filename}</div>
          <button
            type="button"
            className={styles.genBtn}
            onClick={generate}
            style={{
              background: gen === "done" ? "transparent" : "var(--btnbg)",
              color: gen === "done" ? "var(--ink)" : "var(--btnfg)",
            }}
          >
            {gen === "done"
              ? "✓ PDF ready — check downloads"
              : gen === "busy"
                ? "Generating…"
                : "Generate PDF"}
          </button>
        </div>
      </div>

      {/* Paper preview */}
      <div className={styles.preview}>
        <div className={styles.paper}>
          <div className={styles.pHeader}>
            <div className={styles.pBrand}>TALLY — ANNUAL LEAVE REPORT</div>
            <div className={styles.pDate}>{new Date().toISOString().slice(0, 10)}</div>
          </div>
          <div className={styles.pMeta}>
            <div>
              <div className={styles.pMetaLabel}>EMPLOYEE</div>
              <div className={styles.pMetaBold}>{data.employee}</div>
            </div>
            <div>
              <div className={styles.pMetaLabel}>PERIOD</div>
              <div className={styles.pMetaMono}>{data.period}</div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div className={styles.pMetaLabel}>REF</div>
              <div className={styles.pMetaMono}>{data.ref}</div>
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

          {inc.leaveHistory && data.leaves.length > 0 && (
            <div className={styles.pSection}>
              <div className={styles.pSectionHead}>
                <span className={styles.pSectionNum}>1</span>
                <span className={styles.pSectionTitle}>LEAVES TAKEN</span>
              </div>
              {data.leaves.map((l, i) => (
                <div key={i} className={styles.pLeaveRow}>
                  <div className={styles.pMono}>{l.date}</div>
                  <div style={{ fontWeight: 600 }}>{l.title}</div>
                  <div style={{ color: "#777" }}>{l.note}</div>
                  <div className={styles.pMono} style={{ textAlign: "right" }}>
                    −{l.days}
                  </div>
                </div>
              ))}
            </div>
          )}

          {inc.holidayWork && data.holidayWork.length > 0 && (
            <div className={styles.pSection}>
              <div className={styles.pSectionHead}>
                <span className={styles.pSectionNum}>2</span>
                <span className={styles.pSectionTitle}>
                  HOLIDAYS WORKED — CREDITED AS IL OR PAID AS OT DAY
                </span>
              </div>
              {data.holidayWork.map((h, i) => (
                <div key={i} className={styles.pHolRow}>
                  <div className={styles.pMono}>{h.date}</div>
                  <div>{h.title}</div>
                  <div className={styles.pMono} style={{ fontWeight: 600 }}>
                    {h.amt}
                  </div>
                  <div
                    className={styles.pMono}
                    style={{
                      textAlign: "right",
                      color: h.proofMissing ? "#C0392B" : "#666",
                    }}
                  >
                    {h.proofText}
                  </div>
                </div>
              ))}
            </div>
          )}

          {inc.proofImages && data.proofs.length > 0 && (
            <div className={styles.pSection}>
              <div className={styles.pSectionHead}>
                <span className={styles.pSectionNum}>3</span>
                <span className={styles.pSectionTitle}>
                  PROOF OF WORK — FULL-SIZE IMAGES ON THE PAGES BELOW
                </span>
              </div>
              <div className={styles.pThumbs}>
                {data.proofs.map((p, i) => (
                  <div key={i} className={styles.pThumb}>
                    <div className={styles.pThumbBox}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="1.5" y="3" width="13" height="10" rx="1" stroke="#9A968C" strokeWidth="1.1" />
                        <circle cx="5.5" cy="6.5" r="1.1" fill="#9A968C" />
                        <path d="M2.5 11.5l3.2-3 2.6 2.4 2.2-2 3 2.6" stroke="#9A968C" strokeWidth="1" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className={styles.pThumbCap}>
                      {p.page} · {p.file}
                    </div>
                    <div className={styles.pThumbCap2}>
                      {p.date} · {p.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.pFooter}>
            <div>Signed digitally via Tally · tally.app/r/{data.ref}</div>
            <div style={{ marginLeft: "auto", fontFamily: "var(--font-mono), monospace" }}>
              PAGE 1 OF {data.pageCount}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
