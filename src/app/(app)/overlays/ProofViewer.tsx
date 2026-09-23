"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fmt } from "@/lib/ledger/view";
import { useAppData, useModal, useToast } from "../runtime";
import { attachProof, getProofUrl, removeProof } from "../actions";
import styles from "../overlays.module.css";

export function ProofViewer() {
  const { modal, close } = useModal();
  const { holidays } = useAppData();
  const { showToast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const entry = modal.entry;
  const proof = entry?.proof ?? null;

  useEffect(() => {
    let active = true;
    if (proof?.file_path) {
      getProofUrl(proof.file_path).then((u) => active && setUrl(u));
    }
    return () => {
      active = false;
    };
  }, [proof?.file_path]);

  if (!entry || !proof) return null;

  const holidayName = holidays.find((h) => h.id === entry.holiday_id)?.name;
  const title =
    holidayName ??
    (entry.kind === "vl"
      ? "Vacation"
      : entry.kind === "sl"
        ? "Sick"
        : "Entry");
  const amt =
    (entry.credit_as === "ot" ? "OT +" : "IL +") + fmt(Math.abs(entry.amount));

  function onReplace(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !entry) return;
    const fd = new FormData();
    fd.set("entryId", entry.id);
    fd.set("proof", file);
    startTransition(async () => {
      const res = await attachProof(fd);
      if (res.ok) {
        close();
        showToast("Proof replaced");
        router.refresh();
      } else {
        showToast(res.error);
      }
    });
  }

  function onRemove() {
    if (!entry) return;
    startTransition(async () => {
      const res = await removeProof(entry.id);
      if (res.ok) {
        close();
        showToast("Proof removed — back to pending");
        router.refresh();
      } else {
        showToast(res.error);
      }
    });
  }

  const sizeKb = Math.max(1, Math.round(proof.size_bytes / 1024));

  return (
    <div className={styles.viewer}>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={onReplace}
      />
      <div className={styles.viewerHead}>
        <span className={styles.viewerClose} onClick={close}>
          ✕ close
        </span>
        <span className={styles.viewerMeta}>
          <span style={{ color: "var(--ink)" }}>{proof.file_name}</span> ·{" "}
          {sizeKb} KB
        </span>
      </div>
      <div className={styles.viewerBody}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={proof.file_name} className={styles.viewerImg} />
        ) : (
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 12,
              color: "var(--dim)",
            }}
          >
            loading…
          </span>
        )}
      </div>
      <div className={styles.viewerFoot}>
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 12,
            color: "var(--dim)",
          }}
        >
          {entry.date_start}
        </span>
        <span style={{ fontSize: 14.5, fontWeight: 600 }}>{title}</span>
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 13,
            color: "var(--mut)",
          }}
        >
          {amt}
        </span>
        <span
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 18,
            fontSize: 12.5,
          }}
        >
          <span
            style={{ color: "var(--dim)", cursor: "pointer" }}
            onClick={() => fileInput.current?.click()}
          >
            Replace
          </span>
          <span
            style={{
              color: "var(--sig)",
              cursor: pending ? "default" : "pointer",
            }}
            onClick={pending ? undefined : onRemove}
          >
            Remove
          </span>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontWeight: 600 }}
            >
              Download
            </a>
          )}
        </span>
      </div>
    </div>
  );
}
