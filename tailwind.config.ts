import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        neon: {
          DEFAULT: '#38bdf8',
          glow: 'rgba(56,189,248,0.4)',
          dim: 'rgba(56,189,248,0.1)',
        },
        glass: {
          bg: 'rgba(255,255,255,0.04)',
          border: 'rgba(255,255,255,0.08)',
          card: 'rgba(15,23,42,0.7)',
        },
        surface: {
          DEFAULT: '#0a0f1e',
          elevated: '#0f172a',
          card: '#111827',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-neon': 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
      },
      boxShadow: {
        neon: '0 0 20px rgba(56,189,248,0.3)',
        'neon-sm': '0 0 10px rgba(56,189,248,0.2)',
        glass: '0 8px 32px rgba(0,0,0,0.4)',
      },
      animation: {
        'fade-in': 'fadeSlideIn 0.3s ease forwards',
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

export default config
