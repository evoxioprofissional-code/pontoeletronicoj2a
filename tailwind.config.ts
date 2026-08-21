import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/screens/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta industrial (HMI) — ver docs de identidade visual
        graphite: "#14171C", // fundo base — grafite quase preto
        steel: "#1E232B", // superfície/cards — aço escuro
        "steel-line": "#2A313B", // divisórias/bordas
        amber: {
          DEFAULT: "#F5A623", // acento primário — âmbar de segurança
          soft: "#FBB93F",
        },
        signal: "#3ECF8E", // sucesso — verde sinal
        danger: "#E5484D", // erro/fora da área — vermelho de segurança
        ink: "#EDEFF2", // texto primário
        muted: "#8A93A3", // texto secundário
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        phone:
          "0 40px 80px -20px rgba(0,0,0,0.7), 0 0 0 2px rgba(255,255,255,0.02) inset",
        "amber-glow": "0 0 0 1px rgba(245,166,35,0.4), 0 8px 24px -8px rgba(245,166,35,0.35)",
      },
      keyframes: {
        "amber-pulse": {
          "0%, 100%": { opacity: "0.35", transform: "scale(0.9)" },
          "50%": { opacity: "1", transform: "scale(1)" },
        },
        "scan-ring": {
          "0%": { transform: "scale(0.92)", opacity: "0.15" },
          "50%": { opacity: "0.7" },
          "100%": { transform: "scale(1.12)", opacity: "0" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-90%)" },
          "100%": { transform: "translateY(90%)" },
        },
        "stamp-impact": {
          "0%": {
            transform: "scale(2.6) rotate(-9deg)",
            opacity: "0",
            filter: "blur(3px)",
          },
          "55%": {
            transform: "scale(0.9) rotate(-3deg)",
            opacity: "1",
            filter: "blur(0)",
          },
          "72%": { transform: "scale(1.05) rotate(-4deg)" },
          "100%": { transform: "scale(1) rotate(-3deg)", opacity: "1" },
        },
        "stamp-ripple": {
          "0%": { transform: "scale(0.6)", opacity: "0.5" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
        "card-shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-3px)" },
          "50%": { transform: "translateX(3px)" },
          "75%": { transform: "translateX(-2px)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "amber-pulse": "amber-pulse 1.4s ease-in-out infinite",
        "scan-ring": "scan-ring 1.8s ease-out infinite",
        "scan-line": "scan-line 2s ease-in-out infinite alternate",
        "stamp-impact": "stamp-impact 0.5s cubic-bezier(0.2,0.8,0.2,1) both",
        "stamp-ripple": "stamp-ripple 0.6s ease-out 0.15s both",
        "card-shake": "card-shake 0.28s ease-in-out 0.1s",
        "fade-up": "fade-up 0.3s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
