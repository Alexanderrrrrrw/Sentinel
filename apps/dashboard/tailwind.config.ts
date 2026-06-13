import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Sentinel Dark theme - Deep Space
        "sentinel-dark": {
          bg: "#030712",
          surface: "#111827",
          primary: "#3b82f6",
          success: "#10b981",
          muted: "#64748b",
          warning: "#f59e0b",
        },
        // Backwards-compatible aliases
        ink: "#030712",
        signal: "#10b981", // Emerald
        pulse: "#3b82f6",  // Blue
        warning: "#f59e0b",
        cyan: {
          electric: "#0ea5e9", // Sky
        },
      },
      fontFamily: {
        display: ["ui-sans-serif", "system-ui", "sans-serif"],
        body: ["ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        panel: "0 10px 40px -10px rgba(0, 0, 0, 0.5)",
        glow: "0 0 15px rgba(59, 130, 246, 0.1)",
        "glow-signal": "0 0 15px rgba(16, 185, 129, 0.1)",
      },
      keyframes: {
        flash: {
          "0%": { backgroundColor: "rgba(16, 185, 129, 0.1)" },
          "100%": { backgroundColor: "transparent" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "15%": { transform: "translateX(-2px)" },
          "30%": { transform: "translateX(2px)" },
          "45%": { transform: "translateX(-1px)" },
          "60%": { transform: "translateX(1px)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "scale(0.98) translateY(4px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        flash: "flash 0.7s ease-out",
        shake: "shake 0.4s ease-in-out",
        "fade-in": "fade-in 0.25s ease-out",
        "slide-up": "slide-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
