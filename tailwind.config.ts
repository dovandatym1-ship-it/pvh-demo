import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          50: "#F2F8F4",
          100: "#E2F0E7",
          200: "#C3E1CD",
          300: "#95C7A8",
          400: "#5FA77C",
          500: "#368856",
          600: "#1F633E", // Primary Government Green
          700: "#174E31", // Hover Green
          800: "#133E27",
          900: "#0F3220",
          950: "#071B11",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-display)", "Be Vietnam Pro", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
