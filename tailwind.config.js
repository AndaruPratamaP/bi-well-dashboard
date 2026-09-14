/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bi: {
          50: '#f0f5fc',
          100: '#e1ecf8',
          200: '#c2daf2',
          300: '#94bfe9',
          400: '#5e9ddd',
          500: '#387ecf',
          600: '#2563bf',
          700: '#1e4fa9',
          800: '#1c428a',
          900: '#003876', // Official Bank Indonesia Blue
          950: '#0b1d44',
        },
        medical: {
          normal: '#10b981',     // Green
          'normal-light': '#ecfdf5',
          warning: '#f59e0b',    // Yellow/Amber
          'warning-light': '#fffbeb',
          critical: '#ef4444',   // Red
          'critical-light': '#fef2f2'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
