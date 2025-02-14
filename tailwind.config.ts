import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0F172A",
        primary: {
          DEFAULT: "#3B82F6",
          hover: "#2563EB",
        },
        secondary: {
          DEFAULT: "#64748B",
          hover: "#475569",
        },
        success: {
          DEFAULT: "#22C55E",
          hover: "#16A34A",
        },
        error: {
          DEFAULT: "#EF4444",
          hover: "#DC2626",
        },
        card: "#1E293B",
      },
      typography: {
        DEFAULT: {
          css: {
            color: "#D1D5DB",
            a: {
              color: "#3B82F6",
              "&:hover": {
                color: "#2563EB",
              },
            },
            h1: {
              color: "#F9FAFB",
            },
            h2: {
              color: "#F3F4F6",
            },
            h3: {
              color: "#E5E7EB",
            },
            strong: {
              color: "#F9FAFB",
            },
            code: {
              color: "#E5E7EB",
            },
            blockquote: {
              color: "#9CA3AF",
            },
          },
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};

export default config;
