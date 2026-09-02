// Email sending. In production this should route through a provider (Resend /
// Postmark / Mailgun). We construct real links and attempt a real send when a
// provider key is configured; otherwise we log the prepared email so the flow
// can still be exercised locally and the emails are verifiable in the worker
// logs. Wire RESEND_API_KEY (or similar) to start delivering.

export interface OutboundEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface EnvLike {
  RESEND_API_KEY?: string;
  APP_URL?: string;
}

export async function sendEmail(c: { env: EnvLike }, email: OutboundEmail): Promise<{ delivered: boolean }> {
  if (c.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${c.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "EduRank <no-reply@edurank.co.za>",
          to: [email.to],
          subject: email.subject,
          text: email.text,
          html: email.html,
        }),
      });
      if (res.ok) return { delivered: true };
      console.error("Email send failed:", res.status, await res.text().catch(() => ""));
      return { delivered: false };
    } catch (e) {
      console.error("Email send error:", e);
      return { delivered: false };
    }
  }

  // No provider configured — log so the link is recoverable during dev.
  console.log(`[email:dev] to=${email.to} subject="${email.subject}"\n${email.text}`);
  return { delivered: false };
}

export function appUrl(env: { APP_URL?: string }, path: string): string {
  const base = (env.APP_URL ?? "https://edurank.co.za").replace(/\/$/, "");
  return `${base}${path}`;
}
