"use client";

import { useToast } from "../runtime";
import styles from "../overlays.module.css";

export function Toaster() {
  const { toasts } = useToast();
  if (toasts.length === 0) return null;
  return (
    <div className={styles.toaster}>
      {toasts.map((t) => (
        <div key={t.id} className={styles.toast}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
