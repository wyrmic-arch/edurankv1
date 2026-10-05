"use client";

/**
 * Sharing helpers: native Web Share where available (mobile), WhatsApp deep
 * links for South Africa, and clipboard fallback. Also renders a "rank card"
 * image on a canvas so students can post their standing.
 */

export interface RankCardData {
  displayName: string;
  rank: number;
  points: number;
  schoolName?: string | null;
  tierLabel?: string | null;
  season: number;
  kind?: string; // e.g. "NATIONAL RANK" or a school name
}

export function siteOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return "https://edurank.co.za";
}

export function whatsappUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Share a link: native share → WhatsApp → clipboard. Returns what happened. */
export async function shareOrCopy(opts: { title: string; text: string; url?: string }): Promise<"shared" | "whatsapp" | "copied"> {
  const url = opts.url ?? siteOrigin();
  const shareData = { title: opts.title, text: opts.text, url };
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(shareData);
      return "shared";
    } catch (e) {
      // User cancelled — don't fall through to another action.
      if (e instanceof DOMException && e.name === "AbortError") return "shared";
    }
  }
  if (typeof navigator !== "undefined" && typeof navigator.canShare === "function" && /android|iphone|ipad|mobile/i.test(navigator.userAgent)) {
    window.open(whatsappUrl(`${opts.text} ${url}`), "_blank", "noopener");
    return "whatsapp";
  }
  await copyText(`${opts.text} ${url}`);
  return "copied";
}

export function referralMessage(name: string, code: string): string {
  return `Join me on EduRank — South Africa's study notes arena. It's free: upload notes, earn points, unlock the best study material and climb the board. Use my code ${code} and we both get a bonus.`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Render the shareable rank card as a PNG File (1080×1350). */
export async function renderRankCard(data: RankCardData): Promise<File> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable.");
  const sans = `"Inter", system-ui, -apple-system, "Segoe UI", sans-serif`;
  const mono = `"JetBrains Mono", ui-monospace, "SFMono-Regular", monospace`;
  const serif = `"EB Garamond", Georgia, serif`;

  // Background + framed border.
  ctx.fillStyle = "#0A0A0A";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#2A2A2A";
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, W - 56, H - 56);

  // Top bar.
  ctx.fillStyle = "#E4E4E4";
  ctx.font = `700 34px ${mono}`;
  if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = "10px";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("EDURANK", 76, 118);
  if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
  ctx.fillStyle = "#A4A9B0";
  ctx.font = `400 24px ${mono}`;
  ctx.textAlign = "right";
  ctx.fillText(`SEASON ${data.season}`, W - 76, 116);

  // Accent rule.
  ctx.strokeStyle = "#F0532D";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(76, 170);
  ctx.lineTo(280, 170);
  ctx.stroke();

  // Rank label + number.
  ctx.textAlign = "center";
  ctx.fillStyle = "#A4A9B0";
  ctx.font = `400 26px ${mono}`;
  if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = "8px";
  ctx.fillText((data.kind ?? "NATIONAL RANK").toUpperCase(), W / 2, 350);
  if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";

  ctx.fillStyle = "#F0532D";
  ctx.font = `600 300px ${serif}`;
  ctx.fillText(`#${data.rank}`, W / 2, 640);

  // Name.
  ctx.fillStyle = "#E4E4E4";
  ctx.font = `600 64px ${sans}`;
  ctx.fillText(truncate(ctx, data.displayName, W - 160), W / 2, 760);

  // School / tier.
  ctx.fillStyle = "#A4A9B0";
  ctx.font = `400 32px ${mono}`;
  const sub = [data.schoolName, data.tierLabel].filter(Boolean).join("  ·  ").toUpperCase();
  if (sub) ctx.fillText(truncate(ctx, sub, W - 160), W / 2, 822);

  // Points pill.
  const label = `${data.points.toLocaleString("en-ZA")} PTS`;
  ctx.font = `700 44px ${mono}`;
  const tw = ctx.measureText(label).width;
  const pw = tw + 96;
  ctx.fillStyle = "#101010";
  ctx.strokeStyle = "#2A2A2A";
  ctx.lineWidth = 2;
  roundRect(ctx, (W - pw) / 2, 900, pw, 96, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#E4E4E4";
  ctx.fillText(label, W / 2, 963);

  // Footer.
  ctx.fillStyle = "#8A9098";
  ctx.font = `400 24px ${mono}`;
  ctx.fillText("EDURANK.CO.ZA", W / 2, H - 110);
  ctx.fillStyle = "#6B6F75";
  ctx.font = `400 22px ${mono}`;
  ctx.fillText("SOUTH AFRICA'S STUDY NOTES ARENA", W / 2, H - 72);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not render the card.");
  return new File([blob], "edurank-rank.png", { type: "image/png" });
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
}

/** Share (or download) the rank card. */
export async function shareRankCard(data: RankCardData): Promise<"shared" | "downloaded"> {
  const file = await renderRankCard(data);
  const text = `I'm #${data.rank} on EduRank${data.schoolName ? ` for ${data.schoolName}` : ""}! Climb the board with me:`;
  const url = siteOrigin();
  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "My EduRank rank", text, url });
      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "shared";
    }
  }
  // Fallback: download the image and offer the text.
  const href = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = href;
  a.download = "edurank-rank.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 10_000);
  return "downloaded";
}
