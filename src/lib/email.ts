import "server-only";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const FROM = process.env.INVITE_FROM_EMAIL ?? "Tally <invites@example.com>";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const isEmailConfigured = Boolean(RESEND_API_KEY);

/**
 * Send a team invite. Best-effort: if Resend isn't configured we skip silently
 * (invites still work via the in-app notification + shareable join link).
 */
export async function sendInviteEmail(opts: {
  to: string;
  team: string;
  from: string;
  token: string;
}): Promise<{ sent: boolean; joinUrl: string }> {
  const joinUrl = `${SITE_URL}/join/${opts.token}`;
  if (!RESEND_API_KEY) return { sent: false, joinUrl };

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:440px;margin:0 auto;color:#1d1b16">
      <p style="font-size:16px"><strong>${escapeHtml(opts.from)}</strong> invited you to join
      <strong>${escapeHtml(opts.team)}</strong> on Tally — a shared leave &amp; holiday-work tracker.</p>
      <p><a href="${joinUrl}" style="display:inline-block;background:#1d1b16;color:#f2efe6;padding:12px 22px;border-radius:4px;text-decoration:none;font-weight:600">Join team</a></p>
      <p style="font-size:12px;color:#8b8574">Sign in with Google to accept. The invite expires in 14 days.</p>
      <p style="font-size:12px;color:#b4ae9d">Ignore this if you don't know them.</p>
    </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: opts.to,
        subject: `${opts.from} invited you to ${opts.team} on Tally`,
        html,
      }),
    });
    return { sent: res.ok, joinUrl };
  } catch {
    return { sent: false, joinUrl };
  }
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c] as string,
  );
}
