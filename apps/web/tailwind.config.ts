import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#EFEFEC",
        ink: "#0A0A0A",
        rule: "#0A0A0A",
        mute: "#8A8D93",
        dim: "#6B6E74",
        ruleSoft: "#D8D8D4",
        // Monochrome night base — black & white, no accent hue.
        night: "#0A0A0A",
        oil: "#101010",
        smoke: "#1A1A1A",
        cinder: "#262626",
        ash: "#E4E4E4",
        ghost: "#8C8C8C",
        // Accents are greyscale only.
        mark: "#FFFFFF",
        markBright: "#FFFFFF",
        ember: "#333333",
        ok: "#FFFFFF",
        okBright: "#FFFFFF",
      },
      boxShadow: {
        ember: "0 0 24px rgba(255,255,255,0.14)",
        emberSm: "0 0 12px rgba(255,255,255,0.10)",
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
        "flicker": {
          "0%, 100%": { opacity: "1" },
          "41%": { opacity: "1" },
          "42%": { opacity: "0.55" },
          "43%": { opacity: "1" },
          "78%": { opacity: "1" },
          "79%": { opacity: "0.7" },
          "80%": { opacity: "1" },
        },
        "rise": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "ember": {
          "0%, 100%": { boxShadow: "0 0 18px rgba(255,255,255,0.14)" },
          "50%": { boxShadow: "0 0 32px rgba(255,255,255,0.26)" },
        },
        "floaty": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        caret: "caret 1s steps(1) infinite",
        "ping-slow": "ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        flicker: "flicker 6s linear infinite",
        rise: "rise 0.6s cubic-bezier(0.2, 0.7, 0.3, 1) both",
        ember: "ember 3s ease-in-out infinite",
        floaty: "floaty 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;