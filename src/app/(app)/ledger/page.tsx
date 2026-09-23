import { getYearSettings } from "@/lib/data/ledger";
import { FISCAL_YEAR } from "@/lib/types";
import styles from "../page.module.css";

const fmt = (n: number) => (n % 1 === 0 ? String(n) : n.toFixed(1));

export default async function LedgerPage() {
  const ys = await getYearSettings(FISCAL_YEAR);

  // No entries yet in Milestone 1, so balances = full credits.
  const vl = ys?.vl_credits ?? 0;
  const sl = ys?.sl_credits ?? 0;
  const il = ys?.il_carryover ?? 0;
  const total = vl + sl + il;

  return (
    <>
      <div className={styles.pad}>
        <div className={styles.balLabel}>DAYS OFF LEFT</div>
        <div className={styles.balTotal}>{fmt(total)}</div>
        <div className={styles.balCaption}>
          {fmt(vl)} VL + {fmt(sl)} SL + {fmt(il)} IL
        </div>
      </div>

      <div className={styles.note}>
        <div className={styles.noteEyebrow}>NEXT — MILESTONE 2</div>
        <div className={styles.noteTitle}>
          Tally-mark balances, the spine timeline, logging & proof
        </div>
        <div className={styles.noteBody}>
          Your credits are set. The holiday-work log, leave filing (⌘K), the
          derived tally-mark visualization, and the timeline of entries arrive
          next.
        </div>
      </div>
    </>
  );
}
