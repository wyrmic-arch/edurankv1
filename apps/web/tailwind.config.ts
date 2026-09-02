import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#EFEFEC",
        ink: "#0A0A0A",
        rule: "#0A0A0A",
        mute: "#5C5C5C",
        dim: "#8C8C8C",
        ruleSoft: "#D8D8D4",
        // Accents — single accent only (the red highlight from the references).
        mark: "#C83A2A",
        ok: "#1B5E20",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      letterSpacing: {
        tight: "-0.02em",
        label: "0.14em",
      },
      fontSize: {
        micro: ["10px", { lineHeight: "14px" }],
        body: ["14px", { lineHeight: "22px" }],
        headline: ["44px", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        display: ["72px", { lineHeight: "1.0", letterSpacing: "-0.03em" }],
      },
      keyframes: {
        caret: {
          "0%, 50%": { opacity: "1" },
          "51%, 100%": { opacity: "0" },
        },
        "ping-slow": {
          "0%": { transform: "scale(0.8)", opacity: "0.8" },
          "70%, 100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },
      animation: {
        caret: "caret 1s steps(1) infinite",
        "ping-slow": "ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;