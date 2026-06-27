/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        canvas: "#f5f7fa",
        surface: "#ffffff",
        "surface-2": "#f8fafc",
        "surface-elevated": "#f1f5f9",
        "text-primary": "#1a1a1a",
        "text-secondary": "#6b7280",
        "text-tertiary": "#9ca3af",
        "border-light": "rgba(0,0,0,0.06)",
        primary: {
          DEFAULT: "#00c2e8",
          dark: "#00a3c4",
          light: "#e0f8ff",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#00c2a8",
          dark: "#00a38c",
          light: "#e0f9f5",
          foreground: "#ffffff",
        },
        coral: {
          DEFAULT: "#ff5252",
          dark: "#e04545",
          light: "#ffe5e5",
        },
        success: {
          DEFAULT: "#00c853",
          light: "#e8f9ee",
        },
        warning: {
          DEFAULT: "#ff9800",
          light: "#fff4e0",
        },
        error: {
          DEFAULT: "#ff5252",
          light: "#ffe5e5",
        },
        info: {
          DEFAULT: "#2196f3",
          light: "#e3f2fd",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
      },
      fontFamily: {
        outfit: ['Outfit', 'system-ui', 'sans-serif'],
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: "20px",
        lg: "16px",
        md: "12px",
        sm: "8px",
        full: "9999px",
      },
      boxShadow: {
        xs: "0 1px 3px rgba(0,0,0,0.08)",
        sm: "0 1px 3px rgba(0,0,0,0.08)",
        md: "0 4px 12px rgba(0,0,0,0.1)",
        lg: "0 8px 24px rgba(0,0,0,0.12)",
        xl: "0 16px 48px rgba(0,0,0,0.15)",
        "primary-glow": "0 4px 16px rgba(0,194,232,0.35)",
        "secondary-glow": "0 4px 16px rgba(0,194,168,0.35)",
        "modal": "0 -4px 30px rgba(0,0,0,0.12)",
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
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-20px) rotate(10deg)" },
        },
        "badge-bounce": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.3)" },
        },
        "card-enter": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-20px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(800px) rotate(720deg)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 1.5s infinite",
        float: "float 6s ease-in-out infinite",
        "badge-bounce": "badge-bounce 0.5s cubic-bezier(0.34,1.56,0.64,1)",
        "card-enter": "card-enter 0.5s ease forwards",
        "confetti-fall": "confetti-fall 3s ease-in forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
