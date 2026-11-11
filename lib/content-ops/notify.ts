// Outgoing emails via Resend's HTTP API (no SDK). Without RESEND_API_KEY the
// send is skipped and reported, so the automations can be previewed safely.
//
// Env: RESEND_API_KEY, EMAIL_FROM (e.g. "Pam · Tech Innovation <pam@techinnovation.consulting>"),
// NOTIFY_EMAIL (Pam's inbox for internal alerts).

export type EmailResult = { sent: boolean; skipped?: string; error?: string }

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

export async function sendEmail(to: string, subject: string, html: string, text: string): Promise<EmailResult> {
  if (!to) return { sent: false, skipped: "no_recipient" }
  if (!emailConfigured()) return { sent: false, skipped: "email_not_configured" }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, html, text }),
    })
    if (!res.ok) return { sent: false, error: `resend ${res.status}: ${(await res.text()).slice(0, 200)}` }
    return { sent: true }
  } catch (error) {
    return { sent: false, error: error instanceof Error ? error.message : "send_failed" }
  }
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)
}

// A small branded layout shared by every email.
export function emailLayout(title: string, bodyHtml: string, cta?: { label: string; href: string }): string {
  const button = cta
    ? `<p style="margin:28px 0"><a href="${escapeHtml(cta.href)}" style="background:#003219;color:#FAF6EE;padding:14px 26px;border-radius:999px;text-decoration:none;font-weight:600;display:inline-block">${escapeHtml(cta.label)}</a></p>`
    : ""
  return `<!doctype html><html><body style="margin:0;background:#FAF6EE;font-family:Helvetica,Arial,sans-serif;color:#003219">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
<h1 style="font-family:Georgia,serif;font-weight:500;font-size:24px;margin:0 0 16px">${escapeHtml(title)}</h1>
${bodyHtml}${button}
<p style="margin-top:32px;font-size:12px;color:#00321999">Tech Innovation Consulting · validation de contenu</p>
</div></body></html>`
}
