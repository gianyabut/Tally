"use client";

import { useEffect } from "react";
import { useAppData, useModal } from "../runtime";
import { typingInField } from "./keys";
import styles from "../overlays.module.css";

export function CommandPalette() {
  const { open, close, modal } = useModal();
  const { nextHoliday } = useAppData();

  // Number keys select a palette action.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typingInField(e) || e.metaKey || e.ctrlKey) return;
      if (e.key === "1") open("log");
      else if (e.key === "2") open("leave");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div className={styles.scrim} onClick={close} />
      <div className={styles.panel} style={{ top: modal.top + 56 }} role="dialog" aria-label="Quick actions">
        <div className={styles.palHead}>
          <span className={styles.palPrompt}>what happened?</span>
          <button type="button" className={styles.esc} onClick={close}>
            ESC
          </button>
        </div>
        <div className={styles.palList}>
          <button type="button" className={styles.palRow} onClick={() => open("log")}>
            <span className={styles.chip}>1</span>
            <div style={{ flex: 1 }}>
              <div className={styles.rowTitle}>Log holiday work</div>
              <div className={styles.rowSub}>
                {nextHoliday
                  ? `next: ${nextHoliday.holiday.name} · ${nextHoliday.holiday.date}`
                  : "credit an In-Lieu or OT day"}
              </div>
            </div>
          </button>
          <button type="button" className={styles.palRow} onClick={() => open("leave")}>
            <span className={styles.chip}>2</span>
            <div style={{ flex: 1 }}>
              <div className={styles.rowTitle}>File a leave</div>
              <div className={styles.rowSub}>spend VL, SL or In-Lieu</div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
