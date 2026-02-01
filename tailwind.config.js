/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Jawir OS Primary Colors
        "primary": "#dab80b",
        "primary-hover": "#bfa10a",
        "primary-light": "#f5e879",
        
        // Coffee Dark Theme
        "background-light": "#f8f8f5",
        "background-dark": "#221f10",
        "coffee-dark": "#181711",
        "coffee-medium": "#2d2a1e",
        "coffee-light": "#393628",
        
        // Cream Colors
        "cream": "#f1f0ea",
        "cream-muted": "#bab59c",
        "cream-dark": "#8a8577",
        
        // Status Colors
        "status-success": "#22c55e",
        "status-warning": "#f59e0b",
        "status-error": "#ef4444",
        "status-info": "#3b82f6",
        
        // Integration Brand Colors
        "whatsapp": "#25D366",
        "google": "#4285F4",
        "home-assistant": "#41BDF5",
      },
      fontFamily: {
        "display": ["Inter", "system-ui", "sans-serif"],
        "mono": ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        "xl": "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        "card": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        "card-hover": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "primary": "0 4px 14px 0 rgba(218, 184, 11, 0.25)",
        "glow": "0 0 20px rgba(218, 184, 11, 0.3)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 3s linear infinite",
        "bounce-gentle": "bounce 2s ease-in-out infinite",
        "waveform": "waveform 0.5s ease-in-out infinite alternate",
      },
      keyframes: {
        waveform: {
          "0%": { transform: "scaleY(0.3)" },
          "100%": { transform: "scaleY(1)" },
        },
      },
      backgroundImage: {
        "batik-pattern": "url('/assets/images/batik-pattern.svg')",
        "dot-pattern": "radial-gradient(circle, #dab80b 1px, transparent 1px)",
      },
      backgroundSize: {
        "dot-sm": "20px 20px",
        "dot-md": "30px 30px",
      },
    },
  },
  plugins: [],
}
