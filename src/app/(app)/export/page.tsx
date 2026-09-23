import styles from "../page.module.css";

export default function ExportPage() {
  return (
    <div className={styles.empty}>
      <div>
        <div className={styles.emptyEyebrow}>EXPORT FOR HR</div>
        <div className={styles.emptyTitle}>Your annual PDF report</div>
        <div className={styles.emptyBody}>
          ONE PDF PER PERSON-YEAR — SUMMARY, LEAVES, HOLIDAY WORK, PROOF.
          <br />
          PDF GENERATION — MILESTONE 4.
        </div>
      </div>
    </div>
  );
}
