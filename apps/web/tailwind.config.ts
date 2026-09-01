import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#07090D",
        surface: {
          1: "#0C1016",
          2: "#11161F",
          3: "#171E2A",
          4: "#1F2836",
        },
        line: "#232B38",
        ink: "#EAF0F6",
        mute: "#8A97A8",
        dim: "#5B6779",
        volt: "#A6FF3F",
        gold: "#FFC24B",
        blood: "#FF4D5E",
        sky: "#43D9FF",
        rose: "#FF6B9D",
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        "glow-volt": "0 0 24px rgba(166,255,63,0.18)",
        "glow-gold": "0 0 24px rgba(255,194,75,0.18)",
        "glow-blood": "0 0 24px rgba(255,77,94,0.2)",
        "glow-sky": "0 0 24px rgba(67,217,255,0.18)",
        panel: "0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 32px rgba(0,0,0,0.45)",
      },
      letterSpacing: {
        hud: "0.18em",
      },
      keyframes: {
        pulseRing: {
          "0%": { opacity: "0.9", transform: "scale(0.6)" },
          "100%": { opacity: "0", transform: "scale(2.2)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "92%": { opacity: "1" },
          "93%": { opacity: "0.6" },
          "94%": { opacity: "1" },
          "97%": { opacity: "0.8" },
        },
      },
      animation: {
        pulseRing: "pulseRing 1.8s ease-out infinite",
        marquee: "marquee 30s linear infinite",
        flicker: "flicker 6s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
