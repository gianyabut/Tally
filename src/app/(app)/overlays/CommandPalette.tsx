"use client";

import { useEffect } from "react";
import { useAppData, useModal } from "../runtime";
import styles from "../overlays.module.css";

export function CommandPalette() {
  const { open, close } = useModal();
  const { nextHoliday } = useAppData();

  // Number keys select a palette action.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "1") open("log");
      else if (e.key === "2") open("leave");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div className={styles.scrim} onClick={close} />
      <div className={styles.panel}>
        <div className={styles.header}>
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 13.5,
              color: "var(--dim)",
            }}
          >
            what happened?
          </span>
          <span className={styles.esc} onClick={close} style={{ cursor: "pointer" }}>
            ESC
          </span>
        </div>
        <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 4 }}>
          <div className={styles.paletteRow} onClick={() => open("log")}>
            <span className={styles.chip}>1</span>
            <div style={{ flex: 1 }}>
              <div className={styles.rowTitle}>Log holiday work</div>
              <div className={styles.rowSub}>
                {nextHoliday
                  ? `next: ${nextHoliday.holiday.name} · ${nextHoliday.holiday.date}`
                  : "credit an In-Lieu or OT day"}
              </div>
            </div>
          </div>
          <div className={styles.paletteRow} onClick={() => open("leave")}>
            <span className={styles.chip}>2</span>
            <div style={{ flex: 1 }}>
              <div className={styles.rowTitle}>File a leave</div>
              <div className={styles.rowSub}>spend VL, SL or In-Lieu</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
