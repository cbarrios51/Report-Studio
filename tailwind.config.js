/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Midnight Blue palette
        navy: {
          50:  '#EDF2FF',
          100: '#C5D5F0',
          200: '#93AEDD',
          300: '#6289C8',
          400: '#3D6AB3',
          500: '#2A4F8A',
          600: '#1E3A6E',
          700: '#162850',
          800: '#0F1A38',
          900: '#090F22',
          950: '#050914',
        },
        // Surface shades
        surface: {
          0:   '#070C1A',
          1:   '#0A1020',
          2:   '#0F1629',
          3:   '#162035',
          4:   '#1E2D47',
          5:   '#2D4267',
        },
        // Primary blue accent
        primary: {
          DEFAULT: '#4F8EF7',
          hover:   '#6BA3F9',
          dim:     'rgba(79,142,247,0.12)',
          light:   '#93C5FD',
          dark:    '#2563EB',
        },
        // Text hierarchy
        ink: {
          1: '#EDF2FF',
          2: '#A8BEDC',
          3: '#6B85A8',
          4: '#3E5470',
        },
        // Utility accents
        accent: {
          green:  '#34D399',
          amber:  '#FBBF24',
          red:    '#F87171',
          purple: '#A78BFA',
          cyan:   '#22D3EE',
        },
        // Corporate blue for report document
        corporate: {
          DEFAULT: '#0070C0',
          light:   '#0099ff',
          dark:    '#005999',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Space Mono"', 'monospace'],
      },
      borderRadius: {
        sm:  '6px',
        DEFAULT: '8px',
        md:  '10px',
        lg:  '12px',
        xl:  '16px',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(79,142,247,0.15)',
        'glow-sm':   '0 0 10px rgba(79,142,247,0.1)',
        'card':      '0 4px 24px rgba(0,0,0,0.4)',
        'panel':     '0 1px 3px rgba(0,0,0,0.3)',
      },
      animation: {
        'fade-in':    'fadeIn 0.25s ease-out',
        'slide-in':   'slideIn 0.25s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%':   { transform: 'translateX(-8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
