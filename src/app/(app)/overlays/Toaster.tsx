"use client";

import { useToast } from "../runtime";
import styles from "../overlays.module.css";

export function Toaster() {
  const { toast } = useToast();
  if (!toast) return null;
  return (
    <div className={styles.toast} role="status">
      <span>{toast}</span>
    </div>
  );
}
