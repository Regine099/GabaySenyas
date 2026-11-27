/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Manrope', 'system-ui', 'sans-serif'] },
      colors: {
        navy: { 950: '#071a38', 900: '#0b2447', 800: '#0d2f66', 700: '#12408a' },
        teal: { brand: '#0f9ba0', soft: '#e3f4f4' },
        amber: { brand: '#f8b62d' },
        surface: '#f3f7f8',
        line: '#e3eaee',
        muted: '#6b7c93',
      },
    },
  },
  plugins: [],
};
