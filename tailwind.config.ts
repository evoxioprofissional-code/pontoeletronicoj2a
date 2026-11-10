import type { Config } from "tailwindcss";

// Identidade j2aponto — tema claro, azul-petróleo.
// Poucas cores, bordas finas, cantos discretos. Sem brilhos nem gradientes.
const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F6F4F0", // fundo da página (papel)
        surface: "#FFFFFF", // cartões e barras
        line: {
          DEFAULT: "#E4E0D8", // divisórias
          strong: "#CBC5BA", // contorno de campos
        },
        ink: {
          DEFAULT: "#141C1F", // texto principal
          2: "#48545A", // texto secundário
          3: "#636E73", // texto de apoio
        },
        brand: {
          DEFAULT: "#0E4F5E", // azul-petróleo
          strong: "#0A3D49", // hover/pressionado
          tint: "#E2EEF0", // fundo suave
          line: "#B9D3D8",
        },
        ok: { DEFAULT: "#1B7A4B", tint: "#E3F3EA", line: "#B5DCC6" },
        warn: { DEFAULT: "#8A5300", tint: "#FBF0DC", line: "#EBCF9B" },
        danger: { DEFAULT: "#B4281E", tint: "#FBE8E6", line: "#EDBBB6" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        bar: "0 1px 0 0 #E4E0D8",
        sheet: "0 -1px 0 0 #E4E0D8, 0 -12px 32px -16px rgba(20,28,31,0.18)",
        pop: "0 12px 32px -12px rgba(20,28,31,0.22)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "1" },
        },
        "check-in": {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "60%": { transform: "scale(1.08)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.25s ease-out both",
        "pulse-dot": "pulse-dot 1.2s ease-in-out infinite",
        "check-in": "check-in 0.35s cubic-bezier(0.2,0.8,0.2,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
