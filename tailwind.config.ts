import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9eaff",
          500: "#2f6fed",
          600: "#2259d1",
          700: "#1c47a8",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
