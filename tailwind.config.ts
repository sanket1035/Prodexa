import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0C0E",
        surface: {
          DEFAULT: "#16181B",
          hover: "#1E2124",
        },
        border: "#2A2D31",
        primaryText: "#EDEDEF",
        secondaryText: "#8B8F97",
        amber: {
          DEFAULT: "#D97B3F",
          hover: "#E88A4E",
          dim: "rgba(217, 123, 63, 0.12)",
        },
        sage: {
          DEFAULT: "#5FA88A",
          dim: "rgba(95, 168, 138, 0.12)",
        },
        ochre: {
          DEFAULT: "#C9A44C",
          dim: "rgba(201, 164, 76, 0.12)",
        },
        brick: {
          DEFAULT: "#C25A4D",
          dim: "rgba(194, 90, 77, 0.12)",
        },
        slate: {
          DEFAULT: "#6E7B8B",
          dim: "rgba(110, 123, 139, 0.12)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-geist-mono)", "Geist Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "6px",
        md: "6px",
        lg: "6px",
        sm: "4px",
      },
    },
  },
  plugins: [],
};

export default config;
