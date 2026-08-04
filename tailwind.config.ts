import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#0B0C0E",
          surface: "#16181B",
          elevated: "#1E2124",
        },
        border: {
          subtle: "#2A2D31",
          strong: "#3A3E45",
        },
        amber: {
          DEFAULT: "#D97B3F",
          hover: "#E88A4E",
        },
        text: {
          primary: "#EDEDEF",
          muted: "#8B8F97",
        },
        badge: {
          sage: "#5FA88A",
          ochre: "#C9A44C",
          brick: "#C25A4D",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
