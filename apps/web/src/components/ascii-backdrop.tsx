"use client";

import { useEffect, useRef } from "react";

/**
 * AsciiBackdrop — a fixed, full-viewport ASCII "field survey" scene sitting
 * behind the whole site. Contour rings, a faint coordinate grid, and sparse
 * survey glyphs. Static (re-renders only on resize / theme change), like the
 * login page background. Always low-contrast so it never competes with content.
 *
 * Native light/dark via `prefers-color-scheme`.
 */
export function AsciiBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cnv: HTMLCanvasElement = canvas;
    const g: CanvasRenderingContext2D = ctx;

    const RAMP = " .:-=+*#%@";
    let W = 0, H = 0, cols = 0, rows = 0, charW = 7, charH = 11, dpr = 1;

    function palette() {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return { bg: "#0A0A0A", ink: "rgba(200,200,200,0.42)" };
      }
      return { bg: "#EFEFEC", ink: "rgba(40,40,40,0.32)" };
    }

    function gauss(nx: number, ny: number, cx: number, cy: number, s: number) {
      const dx = nx - cx, dy = ny - cy;
      return Math.exp(-(dx * dx + dy * dy) / (2 * s * s));
    }

    function render() {
      const { bg, ink } = palette();
      g.fillStyle = bg;
      g.fillRect(0, 0, W, H);
      g.font = "10px ui-monospace, Menlo, Consolas, monospace";
      g.textBaseline = "top";
      g.fillStyle = ink;

      const peaks = [
        { x: 0.18, y: 0.28, s: 0.16 },
        { x: 0.80, y: 0.72, s: 0.20 },
        { x: 0.62, y: 0.16, s: 0.12 },
        { x: 0.30, y: 0.85, s: 0.14 },
      ];

      for (let r = 0; r < rows; r++) {
        const ny = r / rows;
        let line = "";
        for (let c = 0; c < cols; c++) {
          const nx = c / cols;
          let v = 0;
          for (const p of peaks) v = Math.max(v, gauss(nx, ny, p.x, p.y, p.s));
          v += 0.06 * Math.sin(nx * 14 + ny * 9) * Math.sin(ny * 18);

          const isGrid = c % 8 === 0 && r % 6 === 0;
          const glyph: string | null =
            Math.abs(nx - 0.42) < 0.003 && Math.abs(ny - 0.58) < 0.02 ? "+" :
            Math.abs(nx - 0.66) < 0.003 && Math.abs(ny - 0.34) < 0.02 ? "o" :
            Math.abs(nx - 0.09) < 0.003 && Math.abs(ny - 0.70) < 0.02 ? "*" : null;

          let ch: string;
          if (glyph) {
            ch = glyph;
          } else if (isGrid) {
            ch = "·";
          } else if (v > 0.02) {
            const idx = Math.floor(v * 0.9 * (RAMP.length - 1));
            ch = RAMP[Math.max(0, Math.min(RAMP.length - 1, idx))]!;
          } else {
            ch = " ";
          }
          line += ch;
        }
        g.fillText(line, 0, r * charH);
      }
    }

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth;
      H = window.innerHeight;
      cnv.width = W * dpr;
      cnv.height = H * dpr;
      cnv.style.width = W + "px";
      cnv.style.height = H + "px";
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.font = "10px ui-monospace, Menlo, Consolas, monospace";
      charW = Math.max(6, g.measureText("M").width);
      charH = 11;
      cols = Math.floor(W / charW);
      rows = Math.floor(H / charH);
      render();
    }

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", render);
    window.addEventListener("resize", resize);
    resize();
    return () => {
      mq.removeEventListener("change", render);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
}
