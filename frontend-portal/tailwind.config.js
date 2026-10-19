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
        "surface-variant": "#dbe2f8",
        "tertiary-fixed-dim": "#ffb59b",
        "on-primary-fixed": "#000667",
        "tertiary-container": "#541800",
        "surface-bright": "#f9f9ff",
        "surface-tint": "#4a54b7",
        "on-primary-fixed-variant": "#313b9d",
        "background": "#f9f9ff",
        "on-tertiary": "#ffffff",
        "on-primary": "#ffffff",
        "on-secondary-fixed": "#001e2d",
        "on-error": "#ffffff",
        "outline-variant": "#c6c5d4",
        "on-background": "#141c2b",
        "primary-fixed": "#e0e0ff",
        "on-primary-container": "#818bf1",
        "secondary-fixed-dim": "#82cfff",
        "on-surface-variant": "#454652",
        "secondary": "#00658d",
        "secondary-fixed": "#c6e7ff",
        "tertiary": "#320a00",
        "tertiary-fixed": "#ffdbcf",
        "on-secondary-container": "#005577",
        "on-surface": "#141c2b",
        "primary-container": "#111b83",
        "primary": "#00055d",
        "surface-container-highest": "#dbe2f8",
        "on-tertiary-container": "#f6672c",
        "on-tertiary-fixed-variant": "#812900",
        "on-secondary": "#ffffff",
        "on-secondary-fixed-variant": "#004c6b",
        "surface-container": "#e8eeff",
        "error": "#ba1a1a",
        "surface-container-low": "#f1f3ff",
        "primary-fixed-dim": "#bdc2ff",
        "on-error-container": "#93000a",
        "inverse-on-surface": "#ecf0ff",
        "surface-dim": "#d2daef",
        "error-container": "#ffdad6",
        "inverse-surface": "#293041",
        "secondary-container": "#75cafd",
        "surface-container-lowest": "#ffffff",
        "surface": "#f9f9ff",
        "inverse-primary": "#bdc2ff",
        "surface-container-high": "#e0e8fd",
        "outline": "#767684",
        "on-tertiary-fixed": "#380d00"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      spacing: {
        "margin-mobile": "1rem",
        "space-xl": "2.5rem",
        "space-xs": "0.25rem",
        "space-lg": "1.5rem",
        "space-sm": "0.5rem",
        "margin-desktop": "3rem",
        "margin": "2rem",
        "gutter-mobile": "1rem",
        "gutter": "1.5rem",
        "space-md": "1rem"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"]
      }
    }
  },
  plugins: [],
};
