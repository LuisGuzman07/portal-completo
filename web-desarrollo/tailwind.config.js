/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        novablue: {
          dark: '#0B1530',     // Azul oscuro corporativo
          navy: '#0F1E40',     // Navy intermedio
          surface: '#13234F',  // Superficie tarjetas oscuras
          primary: '#2563EB',  // Azul principal vibrante
          hover: '#1D4ED8',    // Azul hover
          sky: '#38BDF8',      // Celeste de contraste
          light: '#60A5FA',    // Azul claro secundario
        },
        novaslate: {
          50: '#F8FAFC',       // Gris claro de fondo
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-sm': '0 0 15px -3px rgba(37, 99, 235, 0.25)',
        'glow-md': '0 0 25px -5px rgba(56, 189, 248, 0.3)',
        'glow-lg': '0 0 40px -10px rgba(37, 99, 235, 0.35)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
