"use client";

import { useState } from "react";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import styles from "./login.module.css";

export default function LoginPage() {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function signInWithGoogle() {
    if (!isSupabaseConfigured) {
      setNotice(
        "SUPABASE NOT CONNECTED YET — ADD CREDENTIALS TO .env.local TO ENABLE GOOGLE SIGN-IN.",
      );
      return;
    }
    setBusy(true);
    setNotice(null);
    const supabase = createClient();
    const origin = window.location.origin;
    const next = new URLSearchParams(window.location.search).get("next");
    const callback = next
      ? `${origin}/auth/callback?next=${encodeURIComponent(next)}`
      : `${origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback },
    });
    if (error) {
      setBusy(false);
      setNotice(`SIGN-IN FAILED — ${error.message.toUpperCase()}`);
    }
    // On success the browser redirects to Google.
  }

  return (
    <main className={styles.screen}>
      <Logo size={40} strokeWidth={2.4} />
      <div className={styles.wordmark}>TALLY</div>
      <div className={styles.tagline}>every day off, counted</div>

      <div className={styles.buttonWrap}>
        <button
          type="button"
          className={styles.googleBtn}
          onClick={signInWithGoogle}
          disabled={busy}
        >
          <span className={styles.gMark}>G</span>
          {busy ? "Redirecting…" : "Continue with Google"}
        </button>
        <div className={styles.caption}>
          ONE BUTTON — SIGN-UP AND SIGN-IN ARE THE SAME.
          <br />
          INVITED BY A TEAMMATE? SAME BUTTON.
        </div>
        {notice && <div className={styles.notice}>{notice}</div>}
      </div>

      <div className={styles.footer}>no passwords · google auth only</div>
    </main>
  );
}
