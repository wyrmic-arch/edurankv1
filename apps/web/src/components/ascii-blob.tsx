"use client";

import { useEffect, useRef } from "react";

/**
 * ASCIIBlob — a live, animated ASCII "blob" on a small canvas.
 *
 * A morphing mass built from summed sine lobes: it breathes, melts its edge,
 * drifts slowly around the panel, and carries a couple of tiny orbiting
 * pixels. Shaded with a character ramp so the core is dense and the rim
 * fades. Mirrors the effect on the login page.
 *
 * Renders on `prefers-reduced-motion: reduce` as a single static frame.
 * Pauses when the tab is hidden.
 */
export function ASCIIBlob({
  size = 160,
  tone = "white",
  className = "",
}: {
  size?: number;
  tone?: "white" | "ink";
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cnv: HTMLCanvasElement = canvas;
    const g: CanvasRenderingContext2D = ctx;
    const RAMP = " .:-=+*#%@";
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = size;
    const H = size;
    cnv.width = W * dpr;
    cnv.height = H * dpr;
    cnv.style.width = W + "px";
    cnv.style.height = H + "px";
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    const charW = Math.max(3, Math.floor(W / 44));
    const charH = charW * 2; // terminals are ~2:1
    const cols = Math.floor(W / charW);
    const rows = Math.floor(H / charH);

    const fg = tone === "ink" ? "rgba(10,10,10,0.9)" : "rgba(240,240,240,0.9)";

    // pressure (0..1) at normalized grid position for time t (seconds)
    function field(nx: number, ny: number, t: number) {
      const cx = 0.5 + Math.sin(t * 0.35) * 0.14;
      const cy = 0.5 + Math.cos(t * 0.28) * 0.10;
      let d = Math.hypot(nx - cx, ny - cy);
      let r = 0.30 + 0.04 * Math.sin(t * 0.9 + 0.6) + 0.05 * Math.sin(t * 1.7 + 1.2);
      const ang = Math.atan2(ny - cy, nx - cx);
      r += 0.05 * Math.sin(3 * ang + t * 0.8);
      r += 0.035 * Math.sin(5 * ang - t * 1.1);
      r += 0.02 * Math.sin(2 * ang + t * 0.5);
      let p = 1 - d / r;
      p = Math.max(0, Math.min(1, (p + 0.15) * 1.25));
      // orbiting satellite pixels
      const sd = Math.hypot(nx - (0.5 + Math.cos(t * 0.7) * 0.36), ny - (0.5 + Math.sin(t * 0.8) * 0.32));
      const sat = Math.max(0, 1 - sd / 0.05);
      return Math.min(1, p + sat * 0.9);
    }

    function draw(t: number) {
      g.clearRect(0, 0, W, H);
      g.font = `${charH * 0.9}px ui-monospace, Menlo, Consolas, monospace`;
      g.textBaseline = "top";
      g.fillStyle = fg;
      for (let r = 0; r < rows; r++) {
        let line = "";
        for (let c = 0; c < cols; c++) {
          const nx = (c * charW + charW / 2) / W;
          const ny = (r * charH + charH / 2) / H;
          const p = field(nx, ny, t);
          const idx = Math.floor(p * (RAMP.length - 1));
          line += RAMP[Math.max(0, Math.min(RAMP.length - 1, idx))]!;
        }
        g.fillText(line, 0, r * charH);
      }
    }

    let raf = 0;
    function loop(ts: number) {
      draw(ts / 1000);
      raf = requestAnimationFrame(loop);
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      draw(0.4);
    } else {
      raf = requestAnimationFrame(loop);
    }

    function onVisibility() {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      } else if (!reduce && !raf) {
        raf = requestAnimationFrame(loop);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [size, tone]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
