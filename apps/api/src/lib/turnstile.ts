// Cloudflare Turnstile verification (free bot protection).
//
// If TURNSTILE_SECRET is not configured, verification is skipped so the app
// keeps working until the keys are set.

interface TurnstileEnv {
  TURNSTILE_SECRET?: string;
}

export async function verifyTurnstile(
  env: TurnstileEnv,
  token: string | undefined,
  ip?: string,
): Promise<boolean> {
  if (!env.TURNSTILE_SECRET) return true; // not configured
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export function clientIp(c: { req: { header: (n: string) => string | undefined } }): string | undefined {
  return c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
}
