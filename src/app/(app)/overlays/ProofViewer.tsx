"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fmt } from "@/lib/ledger/view";
import { useAppData, useModal, useToast } from "../runtime";
import { attachProof, getProofUrl, removeProof } from "../actions";
import styles from "../overlays.module.css";

function ImageIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 16 16" fill="none" style={{ marginBottom: 8 }} aria-hidden>
      <rect x="1.5" y="3" width="13" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="5.5" cy="6.5" r="1.2" fill="currentColor" />
      <path d="M2.5 11.5l3.2-3 2.6 2.4 2.2-2 3 2.6" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
}

export function ProofViewer() {
  const { modal, close } = useModal();
  const { holidays } = useAppData();
  const { showToast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const entry = modal.entry;
  const proof = entry?.proof ?? null;

  useEffect(() => {
    let live = true;
    if (proof?.file_path) {
      getProofUrl(proof.file_path)
        .then((u) => live && setUrl(u))
        .catch(() => {});
    }
    return () => {
      live = false;
    };
  }, [proof?.file_path]);

  if (!entry || !proof) return null;

  const mmdd = entry.date_start.slice(5);
  const title = holidays.find((h) => h.id === entry.holiday_id)?.name ?? "Holiday work";
  const amt = (entry.credit_as === "ot" ? "OT +" : "IL +") + fmt(Math.abs(entry.amount));
  const sizeKb = Math.max(1, Math.round(proof.size_bytes / 1024));

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>, success: string) {
    startTransition(async () => {
      const res = await action();
      if (!res.ok) return showToast(res.error);
      close();
      showToast(success);
      router.refresh();
    });
  }

  function onReplace(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !entry) return;
    const fd = new FormData();
    fd.set("entryId", entry.id);
    fd.set("proof", file);
    run(() => attachProof(fd), "Proof replaced");
  }

  return (
    <div className={styles.viewer} style={{ top: modal.top }} role="dialog" aria-label="Proof">
      <input ref={fileInput} type="file" accept="image/*" hidden onChange={onReplace} />
      <div className={styles.vHead}>
        <button type="button" className={styles.vClose} onClick={close}>
          ✕ close
        </button>
        <span className={styles.vMeta}>
          <span style={{ color: "var(--ink)" }}>{proof.file_name}</span> · {sizeKb} KB
        </span>
      </div>
      <div className={styles.vBody}>
        <div className={styles.vFrame}>
          {url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={`Proof — ${title}`}
              className={styles.vImg}
              style={loaded ? undefined : { display: "none" }}
              onLoad={() => setLoaded(true)}
            />
          )}
          {!loaded && (
            <div className={styles.vPlaceholder}>
              <ImageIcon />
              <div className={styles.vCaption}>screenshot — {mmdd}</div>
            </div>
          )}
        </div>
      </div>
      <div className={styles.vFoot}>
        <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, color: "var(--dim)" }}>{mmdd}</span>
        <span style={{ fontSize: 14.5, fontWeight: 600 }}>{title}</span>
        <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 13, color: "var(--mut)" }}>{amt}</span>
        <span className={styles.vActions}>
          <button type="button" style={{ color: "var(--dim)" }} onClick={() => fileInput.current?.click()} disabled={pending}>
            Replace
          </button>
          <button
            type="button"
            style={{ color: "var(--sig)" }}
            onClick={() => run(() => removeProof(entry.id), "Proof removed — back to pending")}
            disabled={pending}
          >
            Remove
          </button>
          {url ? (
            <a href={url} target="_blank" rel="noopener noreferrer" download={proof.file_name} style={{ fontWeight: 600 }}>
              Download
            </a>
          ) : (
            <span style={{ fontWeight: 600 }}>Download</span>
          )}
        </span>
      </div>
    </div>
  );
}
