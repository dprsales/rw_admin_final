/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/crm/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        crm: {
          ink: '#1c1915',
          muted: '#5c564c',
          line: '#e4ddd2',
          paper: '#f7f4ef',
          card: '#fffdf9',
          gold: '#9a7433',
          'gold-soft': '#f3ead8',
          dark: '#16130f',
          cream: '#f6f1e7',
          hot: '#9c3418',
          warm: '#9a5b12',
          cold: '#1e4d78',
        },
      },
      fontFamily: {
        crm: ['Georgia', 'Times New Roman', 'serif'],
        'crm-sans': ['Segoe UI', 'Calibri', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};
