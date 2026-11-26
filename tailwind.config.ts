import type { Config } from "tailwindcss";

// Identidade j2aponto — fundo claro, azul-petróleo vivo, cartões com fio
// fino, títulos fortes e cartão principal escuro. Cores em variáveis CSS
// (globals.css).
const v = (nome: string) => `rgb(var(--${nome}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: v("paper"), // fundo agrupado
        surface: v("surface"), // cartões e barras
        sunken: v("sunken"), // campos, trilhos, áreas internas
        line: { DEFAULT: v("line"), strong: v("line-strong") },
        ink: { DEFAULT: v("ink"), 2: v("ink-2"), 3: v("ink-3") },
        brand: {
          DEFAULT: v("brand"),
          strong: v("brand-strong"),
          tint: v("brand-tint"),
          line: v("brand-line"),
          soft: v("brand-soft"),
        },
        "on-brand": v("on-brand"),
        ok: { DEFAULT: v("ok"), tint: v("ok-tint"), line: v("ok-line") },
        warn: { DEFAULT: v("warn"), tint: v("warn-tint"), line: v("warn-line") },
        danger: { DEFAULT: v("danger"), tint: v("danger-tint"), line: v("danger-line") },
        hero: { DEFAULT: v("hero"), 2: v("hero-2") },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "1.25rem",
        ctl: "0.875rem",
      },
      boxShadow: {
        card: "var(--sombra-card)",
        float: "var(--sombra-float)",
        pop: "var(--sombra-pop)",
        bar: "0 0.5px 0 0 rgb(var(--line))",
        sheet: "0 -0.5px 0 0 rgb(var(--line))",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "1" },
        },
        "check-in": {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "60%": { transform: "scale(1.1)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        respirar: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.55" },
          "50%": { transform: "scale(1.08)", opacity: "0" },
        },
        sobe: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s cubic-bezier(0.2,0.8,0.2,1) both",
        "pulse-dot": "pulse-dot 1.2s ease-in-out infinite",
        "check-in": "check-in 0.45s cubic-bezier(0.2,0.8,0.2,1) both",
        respirar: "respirar 2.4s ease-in-out infinite",
        sobe: "sobe 0.35s cubic-bezier(0.2,0.8,0.2,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
