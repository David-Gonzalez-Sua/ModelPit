const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: colors.neutral,
        'model-red': '#dc2626',
        'model-blood': '#991b1b',
        'model-gold': '#fbbf24',
        'model-gold-dark': '#b45309',
        'model-dark': '#0a0a0a',
        'model-base': '#111111',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'clash-flash': 'clash 0.3s ease-out forwards',
        'health-drain': 'drain 0.5s ease-out forwards',
      },
      keyframes: {
        clash: {
          '0%': { transform: 'scale(1)', opacity: '0' },
          '50%': { transform: 'scale(1.5)', opacity: '1', filter: 'brightness(2)' },
          '100%': { transform: 'scale(1)', opacity: '0' },
        },
        drain: {
          '0%': { filter: 'brightness(2)' },
          '100%': { filter: 'brightness(1)' },
        }
      }
    },
  },
  plugins: [],
}
