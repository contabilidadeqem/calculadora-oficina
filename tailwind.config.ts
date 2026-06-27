import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#0B2A32",
          800: "#0F3340",
          700: "#1A4D5C",
        },
        gold: {
          500: "#C9956A",
          400: "#D4A97E",
          600: "#A8794F",
        },
        cream: {
          50: "#F5EFE0",
          100: "#E8DCC4",
          200: "#D6C7A8",
        },
        muted: {
          DEFAULT: "rgba(255,255,255,0.55)",
          soft: "rgba(255,255,255,0.70)",
          dim: "rgba(255,255,255,0.30)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        hero: "linear-gradient(180deg, #0B2A32 0%, #0F3340 100%)",
      },
      borderRadius: {
        card: "14px",
        cta: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
