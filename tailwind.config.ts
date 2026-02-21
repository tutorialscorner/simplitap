import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      keyframes: {
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-15px)" },
        },
        "shadow-breathe": {
          "0%, 100%": { opacity: "0.2", transform: "scale(0.9)" },
          "50%": { opacity: "0.1", transform: "scale(1.1)" },
        },
        "tap-gesture-card": {
          "0%": { transform: "translate3d(60px, 20px, -20px) rotateX(10deg) rotateY(-20deg) rotateZ(5deg)", opacity: "0" },
          "10%": { transform: "translate3d(80px, 0px, 0px) rotateX(0deg) rotateY(-15deg) rotateZ(5deg)", opacity: "1" },
          "15%": { transform: "translate3d(10px, -60px, 20px) rotateX(0deg) rotateY(-5deg) rotateZ(-10deg)", opacity: "1" },
          "18%": { transform: "translate3d(0px, -50px, 10px) rotateX(0deg) rotateY(0deg) rotateZ(-5deg) scale(0.98)", opacity: "1" }, // Tap
          "22%": { transform: "translate3d(120px, -100px, 40px) rotateX(10deg) rotateY(10deg) rotateZ(20deg)", opacity: "0" }, // Fly away fast
          "100%": { transform: "translate3d(120px, -100px, 40px) rotateX(10deg) rotateY(10deg) rotateZ(20deg)", opacity: "0" }, // Stay gone
        },
        "notification-slide-enter": {
          "0%, 15%": { transform: "translateY(-150%) translateX(-50%)", opacity: "0" },
          "18%": { transform: "translateY(12px) translateX(-50%)", opacity: "1" }, // Slide in on tap
          "25%": { transform: "translateY(12px) translateX(-50%)", opacity: "1" },
          "28%": { transform: "translateY(-150%) translateX(-50%)", opacity: "0" }, // Slide out as app opens
          "100%": { transform: "translateY(-150%) translateX(-50%)", opacity: "0" },
        },
        "app-launch": {
          "0%, 19%": { transform: "scale(0.8)", opacity: "0", borderRadius: "2rem" },
          "25%": { transform: "scale(1)", opacity: "1", borderRadius: "0rem" }, // Open fully
          "80%": { transform: "scale(1)", opacity: "1", borderRadius: "0rem" }, // Hold ~8 secs
          "90%": { transform: "scale(1.1)", opacity: "0", borderRadius: "0rem" }, // Fade out slowly
          "100%": { transform: "scale(1.1)", opacity: "0", borderRadius: "0rem" },
        },
        "wallpaper-fade": {
          "0%, 20%": { opacity: "1", transform: "scale(1)" },
          "25%": { opacity: "0", transform: "scale(1.1)" },
          "85%": { opacity: "0", transform: "scale(1.1)" },
          "95%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "dock-slide": {
          "0%, 20%": { transform: "translateY(0)", opacity: "1" },
          "25%": { transform: "translateY(200%)", opacity: "0" },
          "85%": { transform: "translateY(200%)", opacity: "0" },
          "95%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "screen-blur": {
          "0%, 15%": { filter: "blur(0px) brightness(1)" },
          "18%": { filter: "blur(4px) brightness(0.9)" }, // Blur for notification
          "24%": { filter: "blur(0px) brightness(1)" }, // Clear for app
          "100%": { filter: "blur(0px) brightness(1)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "navbar-slide-down": {
          from: { transform: "translateY(-100%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "blob": {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "fade-up": "fade-up 0.6s ease-out",
        "float-slow": "float-slow 6s ease-in-out infinite",
        "shadow-breathe": "shadow-breathe 6s ease-in-out infinite",
        "tap-gesture-card": "tap-gesture-card 14s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        "notification-slide-enter": "notification-slide-enter 14s ease-in-out infinite",
        "app-launch": "app-launch 14s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        "wallpaper-fade": "wallpaper-fade 14s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        "dock-slide": "dock-slide 14s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        "screen-blur": "screen-blur 14s ease-in-out infinite",
        "navbar-slide-down": "navbar-slide-down 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
        "blob": "blob 7s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
