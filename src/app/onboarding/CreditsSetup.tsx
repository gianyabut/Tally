"use client";

import { useState, useTransition } from "react";
import { Logo } from "@/components/Logo";
import { FISCAL_YEAR } from "@/lib/types";
import { completeSoloOnboarding } from "./actions";
import styles from "./onboarding.module.css";

const fmt = (n: number) => (n % 1 === 0 ? String(n) : n.toFixed(1));

function Field({
  label,
  value,
  onStep,
  dim,
}: {
  label: string;
  value: number;
  onStep: (delta: number) => void;
  dim?: boolean;
}) {
  return (
    <div>
      <div className={styles.fieldLabel}>{label}</div>
      <div className={styles.fieldRow}>
        <span className={`${styles.numeral} ${dim ? styles.numeralDim : ""}`}>
          {fmt(value)}
        </span>
        <div className={styles.steppers}>
          <button
            type="button"
            className={styles.stepBtn}
            onClick={() => onStep(-1)}
            aria-label={`Decrease ${label}`}
          >
            −
          </button>
          <button
            type="button"
            className={styles.stepBtn}
            onClick={() => onStep(1)}
            aria-label={`Increase ${label}`}
          >
            ＋
          </button>
        </div>
      </div>
    </div>
  );
}

export function CreditsSetup({ firstName }: { firstName: string }) {
  const [vl, setVl] = useState(15);
  const [sl, setSl] = useState(15);
  const [carry, setCarry] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const step = (
    set: React.Dispatch<React.SetStateAction<number>>,
    delta: number,
    min: number,
    max: number,
  ) => set((v) => Math.min(max, Math.max(min, v + delta)));

  function finish() {
    setError(null);
    startTransition(async () => {
      const res = await completeSoloOnboarding({ vl, sl, carry });
      // On success the action redirects; only errors return here.
      if (res && !res.ok) setError(res.error.toUpperCase());
    });
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <div className={styles.brand}>
          <Logo size={17} strokeWidth={2.4} />
          <span className={styles.brandName}>TALLY</span>
        </div>
        <span className={styles.step}>SET UP YOUR LEDGER</span>
      </div>

      <div className={styles.body}>
        <div className={styles.eyebrow}>WELCOME, {firstName.toUpperCase()}</div>
        <div className={styles.title}>Set up your {FISCAL_YEAR} ledger</div>
        <div className={styles.subtitle}>
          Your yearly credits, once. Everything else is logged as it happens.
        </div>

        <div className={styles.grid}>
          <Field
            label="VACATION"
            value={vl}
            onStep={(d) => step(setVl, d, 0, 30)}
          />
          <Field label="SICK" value={sl} onStep={(d) => step(setSl, d, 0, 30)} />
          <Field
            label="IL CARRY-OVER"
            value={carry}
            dim
            onStep={(d) => step(setCarry, d * 0.5, 0, 10)}
          />
        </div>

        <div className={styles.holidays}>
          <span className={styles.dot} />
          <span className={styles.holidaysLabel}>
            Philippine holidays {FISCAL_YEAR} preloaded
          </span>
          <span className={styles.holidaysMeta}>18 DATES · REGULAR + SPECIAL</span>
        </div>

        {error && <div className={styles.error}>{error}</div>}
      </div>

      <div className={styles.footer}>
        <span className={styles.footerNote}>You can change credits later</span>
        <button
          type="button"
          className={styles.primary}
          onClick={finish}
          disabled={pending}
        >
          {pending ? "Setting up…" : "Finish setup →"}
        </button>
      </div>
    </div>
  );
}
