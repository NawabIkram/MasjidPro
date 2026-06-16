/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#F8FAFC",
        "surface-soft": "#F1F5F9",
        "surface-card": "#FFFFFF",
        primary: "#0F766E",
        "primary-dark": "#005C55",
        "primary-soft": "#CCFBF1",
        leaf: "#16A34A",
        gold: "#C0842E",
        slate: "#0F172A",
        muted: "#64748B",
        line: "#E2E8F0",
      },
      boxShadow: {
        card: "0 1px 3px rgba(15, 23, 42, 0.05), 0 10px 20px rgba(15, 23, 42, 0.03)",
        lift: "0 16px 40px rgba(15, 23, 42, 0.12)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Geist", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "1rem",
      },
    },
  },
  plugins: [],
};
