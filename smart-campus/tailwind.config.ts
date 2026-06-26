import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      xs: "360px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      "3xl": "1920px",
      "4k": "2560px",
    },
    extend: {
      colors: {
        // EWU brand palette
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#bcd3ff",
          300: "#8eb5ff",
          400: "#598dff",
          500: "#3366ff", // primary
          600: "#1f47f5",
          700: "#1735e1",
          800: "#192db6",
          900: "#1a2c8f",
          950: "#141b57",
        },
        ink: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d5dae2",
          300: "#b0b9c8",
          400: "#8591a7",
          500: "#66748f",
          600: "#515d76",
          700: "#434c60",
          800: "#3a4251",
          900: "#0f172a",
          950: "#080c18",
        },
        gold: {
          50: "#fffaeb",
          100: "#fff0c6",
          200: "#ffdf88",
          300: "#ffc94a",
          400: "#ffb31f",
          500: "#f99007",
          600: "#dd6a02",
          700: "#b74806",
          800: "#94370c",
          900: "#7a2e0d",
        },
        success: "#16a34a",
        danger: "#dc2626",
        warning: "#d97706",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06)",
        glow: "0 8px 30px rgba(51,102,255,0.25)",
        soft: "0 2px 8px rgba(15,23,42,0.05)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(40px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "toast-in": {
          "0%": { opacity: "0", transform: "translateY(-8px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: "0.6" },
          "100%": { transform: "scale(2)", opacity: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease forwards",
        "slide-up": "slide-up 0.45s cubic-bezier(0.16,1,0.3,1) forwards",
        "slide-in-right": "slide-in-right 0.4s cubic-bezier(0.16,1,0.3,1) forwards",
        "scale-in": "scale-in 0.25s cubic-bezier(0.16,1,0.3,1) forwards",
        shimmer: "shimmer 1.5s infinite",
        "toast-in": "toast-in 0.3s cubic-bezier(0.16,1,0.3,1) forwards",
        "pulse-ring": "pulse-ring 1.6s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
