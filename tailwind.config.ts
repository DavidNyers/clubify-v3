import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        violet: {
          DEFAULT: '#8b5cf6',
          light: '#a78bfa',
          dark: '#7c3aed',
        },
        pink: {
          DEFAULT: '#ec4899',
          light: '#f472b6',
          dark: '#db2777',
        },
        'bg-base': 'rgb(9 9 11)',
        'bg-surface': 'rgb(24 24 27)',
        'bg-elevated': 'rgb(39 39 42)',
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.6s ease forwards',
        'gradient-shift': 'gradient-shift 15s ease infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'scan-line': 'scan-line 2s linear infinite',
      },
      keyframes: {
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(139,92,246,0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(139,92,246,0.6)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

export default config
