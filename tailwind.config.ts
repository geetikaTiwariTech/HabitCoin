import type { Config } from "tailwindcss";
import theme from "./theme.json"; // assuming you keep it at root
export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: `${theme.radius}rem`,
        md: `calc(${theme.radius}rem - 2px)`,
        sm: `calc(${theme.radius}rem - 4px)`,
      },
      colors: {
        // Static fallback if CSS variables aren't used or fail
        primary: {
          DEFAULT: theme.primary,
          foreground: "#ffffff",
        },
        background: "#ffffff",
        foreground: "#000000",
        // You can map more theme tokens here if your theme.json grows
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
