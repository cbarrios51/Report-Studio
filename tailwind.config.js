/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nothing Design System — OLED blacks + neutral grays
        dark: {
          50:  '#f5f5f5',
          100: '#e5e5e5',
          200: '#cccccc',
          300: '#aaaaaa',
          400: '#888888',
          500: '#666666',
          600: '#444444',
          700: '#2a2a2a',
          800: '#1a1a1a',
          900: '#0f0f0f',
          950: '#000000',
        },
        // Accent — Nothing red, used sparingly
        primary: {
          DEFAULT: '#ff3333',
          light: '#ff6666',
          dark: '#cc0000',
        },
        // Corporate blue — only inside the report document
        corporate: {
          DEFAULT: '#0070C0',
          light: '#0099ff',
          dark: '#005999',
        },
        accent: {
          green: '#22c55e',
          orange: '#f59e0b',
          red: '#ff3333',
          cyan: '#06b6d4',
        },
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
