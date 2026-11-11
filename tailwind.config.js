/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    
    extend: {
      colors: {
        navy: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#829AB1',
          500: '#627D98',
          600: '#486581',
          700: '#334E68',
          800: '#243B53',
          900: '#102A43',
          950: '#081726',
          DEFAULT: '#102A43',
        },
        teal: {
          50: '#E8F7F4',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
          DEFAULT: '#0D9488',
        },
        emergency: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
          DEFAULT: '#DC2626',
        },
        surface: {
          50: '#FFFFFF',
          100: '#F6F9FC',
          200: '#EDF2F7',
          300: '#E2E8F0',
          DEFAULT: '#F6F9FC',
        },
        brandMuted: '#64748B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(16, 42, 67, 0.05), 0 1px 2px 0 rgba(16, 42, 67, 0.03)',
        'card-hover': '0 10px 25px -5px rgba(16, 42, 67, 0.08), 0 8px 10px -6px rgba(16, 42, 67, 0.04)',
        'modal': '0 20px 25px -5px rgba(16, 42, 67, 0.15), 0 10px 10px -5px rgba(16, 42, 67, 0.08)',
      }
    },
  },
  plugins: [],
}

