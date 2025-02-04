import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        border: "var(--border)",
        // Category Colors
        product: {
          DEFAULT: "#10b981", // Base
          light: "#34d399",
          dark: "#059669",
          muted: "rgba(16, 185, 129, 0.2)"
        },
        content: {
          DEFAULT: "#eab308", // Base
          light: "#facc15",
          dark: "#ca8a04",
          muted: "rgba(234, 179, 8, 0.2)"
        },
        software: {
          DEFAULT: "#e11d48", // Base
          light: "#f43f5e",
          dark: "#be123c",
          muted: "rgba(225, 29, 72, 0.2)"
        },
        innovation: {
          DEFAULT: "#9333ea", // Base
          light: "#a855f7",
          dark: "#7e22ce",
          muted: "rgba(147, 51, 234, 0.2)"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
} satisfies Config;
