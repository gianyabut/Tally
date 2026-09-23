/* eslint-disable jsx-a11y/alt-text -- @react-pdf/renderer <Image> is not an HTML img and has no alt prop */
import { todayIso } from "@/lib/ledger/dates";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ReportData } from "./report-data";

const INK = "#1A1F2E";
const MUTE = "#666";
const FAINT = "#888";
const HAIR = "#DDD";
const RED = "#C0392B";

const s = StyleSheet.create({
  page: {
    backgroundColor: "#FDFDFB",
    color: INK,
    paddingVertical: 40,
    paddingHorizontal: 44,
    fontFamily: "Helvetica",
    fontSize: 9,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: INK,
  },
  brand: { fontFamily: "Helvetica-Bold", fontSize: 12, letterSpacing: 0.4 },
  headerDate: { marginLeft: "auto", fontFamily: "Courier", fontSize: 8, color: MUTE },
  metaRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: HAIR,
  },
  metaBlock: { marginRight: 26 },
  metaLabel: { fontSize: 7, letterSpacing: 1, color: FAINT },
  metaValueBold: { fontFamily: "Helvetica-Bold", fontSize: 10, marginTop: 3 },
  metaValueMono: { fontFamily: "Courier", fontSize: 9, marginTop: 3 },
  statRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: HAIR,
  },
  stat: { flex: 1, alignItems: "center" },
  statNum: { fontFamily: "Courier", fontSize: 13 },
  statSub: { fontFamily: "Courier", fontSize: 7, color: FAINT },
  statLabel: { fontSize: 7, color: FAINT, marginTop: 3 },
  section: { paddingTop: 12 },
  sectionHead: { flexDirection: "row", alignItems: "baseline", marginBottom: 6 },
  sectionNum: { fontFamily: "Courier", fontSize: 8, color: "#999", marginRight: 6 },
  sectionTitle: { fontSize: 8, letterSpacing: 1, color: "#555", fontFamily: "Helvetica-Bold" },
  leaveRow: {
    flexDirection: "row",
    paddingVertical: 2.5,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    borderBottomStyle: "dotted",
  },
  cDate: { fontFamily: "Courier", color: MUTE, width: 60 },
  cTitle: { fontFamily: "Helvetica-Bold", width: 120 },
  cNote: { color: "#777", flex: 1 },
  cDays: { fontFamily: "Courier", width: 40, textAlign: "right" },
  holTitle: { flex: 1 },
  holAmt: { fontFamily: "Courier", width: 60 },
  holProof: { fontFamily: "Courier", width: 60, textAlign: "right" },
  thumbGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  thumb: { width: 92 },
  thumbImg: { width: 92, height: 58, objectFit: "cover", borderWidth: 1, borderColor: HAIR },
  thumbCap: { fontFamily: "Courier", fontSize: 7, color: "#555", marginTop: 3 },
  thumbCap2: { fontFamily: "Courier", fontSize: 7, color: "#999" },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 44,
    right: 44,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: HAIR,
    paddingTop: 8,
    fontSize: 8,
    color: FAINT,
  },
  apxImg: { width: "100%", height: 560, objectFit: "contain" },
});

export function Report({ data }: { data: ReportData }) {
  const {
    employee,
    ref,
    period,
    summary,
    leaves,
    holidayWork,
    proofs,
    pageCount,
  } = data;

  return (
    <Document title={`Tally ${data.year} — ${employee}`}>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          <Text style={s.brand}>TALLY — ANNUAL LEAVE REPORT</Text>
          <Text style={s.headerDate}>{todayIso()}</Text>
        </View>

        <View style={s.metaRow}>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>EMPLOYEE</Text>
            <Text style={s.metaValueBold}>{employee}</Text>
            {data.team ? <Text style={{ color: MUTE, marginTop: 1 }}>{data.team}</Text> : null}
          </View>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>PERIOD</Text>
            <Text style={s.metaValueMono}>{period}</Text>
          </View>
          <View style={[s.metaBlock, { marginLeft: "auto", marginRight: 0 }]}>
            <Text style={s.metaLabel}>REF</Text>
            <Text style={s.metaValueMono}>{ref}</Text>
          </View>
        </View>

        <View style={s.statRow}>
          <View style={s.stat}>
            <Text style={s.statNum}>
              {summary.vlUsed}
              <Text style={s.statSub}>/{summary.vlTotal}</Text>
            </Text>
            <Text style={s.statLabel}>VL USED</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statNum}>
              {summary.slUsed}
              <Text style={s.statSub}>/{summary.slTotal}</Text>
            </Text>
            <Text style={s.statLabel}>SL USED</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statNum}>{summary.ilEarned}</Text>
            <Text style={s.statLabel}>IL EARNED</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statNum}>
              {summary.otDays}
              <Text style={s.statSub}> d</Text>
            </Text>
            <Text style={s.statLabel}>OT PAID</Text>
          </View>
        </View>

        {leaves.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHead}>
              <Text style={s.sectionNum}>1</Text>
              <Text style={s.sectionTitle}>LEAVES TAKEN</Text>
            </View>
            {leaves.map((l, i) => (
              <View key={i} style={s.leaveRow}>
                <Text style={s.cDate}>{l.date}</Text>
                <Text style={s.cTitle}>{l.title}</Text>
                <Text style={s.cNote}>{l.note}</Text>
                <Text style={s.cDays}>−{l.days}</Text>
              </View>
            ))}
          </View>
        )}

        {holidayWork.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHead}>
              <Text style={s.sectionNum}>2</Text>
              <Text style={s.sectionTitle}>
                HOLIDAYS WORKED — CREDITED AS IL OR PAID AS OT DAY
              </Text>
            </View>
            {holidayWork.map((h, i) => (
              <View key={i} style={s.leaveRow}>
                <Text style={s.cDate}>{h.date}</Text>
                <Text style={s.holTitle}>{h.title}</Text>
                <Text style={s.holAmt}>{h.amt}</Text>
                <Text
                  style={[
                    s.holProof,
                    { color: h.proofMissing ? RED : MUTE },
                  ]}
                >
                  {h.proofText}
                </Text>
              </View>
            ))}
          </View>
        )}

        {proofs.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHead}>
              <Text style={s.sectionNum}>3</Text>
              <Text style={s.sectionTitle}>
                PROOF OF WORK — FULL-SIZE IMAGES ON THE PAGES BELOW
              </Text>
            </View>
            <View style={s.thumbGrid}>
              {proofs.map((p, i) => (
                <View key={i} style={s.thumb}>
                  {p.url ? (
                    <Image src={p.url} style={s.thumbImg} />
                  ) : (
                    <View style={s.thumbImg} />
                  )}
                  <Text style={s.thumbCap}>
                    {p.page} · {p.file}
                  </Text>
                  <Text style={s.thumbCap2}>
                    {p.date} · {p.title}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={s.footer}>
          <Text>Signed digitally via Tally · tally.app/r/{ref}</Text>
          <Text style={{ marginLeft: "auto", fontFamily: "Courier" }}>
            PAGE 1 OF {pageCount}
          </Text>
        </View>
      </Page>

      {/* Page 2 — proof index, so every "P.n" reference is verifiable */}
      {proofs.length > 0 && (
        <Page size="A4" style={s.page}>
          <View style={s.headerRow}>
            <Text style={s.brand}>PROOF OF WORK — INDEX</Text>
            <Text style={s.headerDate}>{ref}</Text>
          </View>
          <View style={s.section}>
            {proofs.map((p, i) => (
              <View key={i} style={s.leaveRow}>
                <Text style={s.cDate}>{p.page}</Text>
                <Text style={s.cTitle}>{p.date}</Text>
                <Text style={s.cNote}>{p.file}</Text>
                <Text style={[s.cDays, { width: 90 }]}>{p.title}</Text>
              </View>
            ))}
          </View>
          <View style={s.footer}>
            <Text>Signed digitally via Tally · tally.app/r/{ref}</Text>
            <Text style={{ marginLeft: "auto", fontFamily: "Courier" }}>
              PAGE 2 OF {pageCount}
            </Text>
          </View>
        </Page>
      )}

      {/* Proof appendix — one page per image, from page 3 */}
      {proofs.map((p, i) =>
        p.url ? (
          <Page key={i} size="A4" style={s.page}>
            <View style={s.headerRow}>
              <Text style={s.brand}>PROOF · {p.page}</Text>
              <Text style={s.headerDate}>
                {p.date} · {p.title} · {ref}
              </Text>
            </View>
            <Image src={p.url} style={s.apxImg} />
            <View style={s.footer}>
              <Text>{p.file}</Text>
              <Text style={{ marginLeft: "auto", fontFamily: "Courier" }}>
                PAGE {i + 3} OF {pageCount}
              </Text>
            </View>
          </Page>
        ) : null,
      )}
    </Document>
  );
}
