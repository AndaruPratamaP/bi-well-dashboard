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
          50: '#f0f8f8',
          100: '#d7eeef',
          200: '#b4dedf',
          300: '#8ccb6b', // Light Green from BI-WELL Palette
          400: '#4fb696',
          500: '#2e9d6b', // Medium Green from BI-WELL Palette
          600: '#1b8b84',
          700: '#0e8b96', // Teal from BI-WELL Palette
          800: '#076974',
          900: '#004e5b', // Dark Teal from BI-WELL Palette
          950: '#002f37',
        },
        brand: {
          darkTeal: '#004E5B',
          teal: '#0E8B96',
          mediumGreen: '#2E9D6B',
          lightGreen: '#8CCB6B',
          gold: '#D4A838',
          'gold-light': '#faeec7',
          'gold-dark': '#b58b22',
        },
        medical: {
          normal: '#10b981',     // Green (Severity: Sehat / Kelas A)
          'normal-light': '#ecfdf5',
          warning: '#f59e0b',    // Yellow/Amber (Severity: Peringatan / Kelas C)
          'warning-light': '#fffbeb',
          critical: '#ef4444',   // Red (Severity: Kritis / Kelas D)
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
