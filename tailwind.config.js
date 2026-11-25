/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/crm/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        crm: {
          ink: '#f1f2f4',
          muted: '#a4acb8',
          line: '#303640',
          paper: '#0c0e12',
          card: '#14181f',
          elevated: '#1a1f27',
          sidebar: '#0a0c10',
          primary: '#c5a46d',
          'primary-hover': '#d8b982',
          hot: '#f04438',
          warm: '#f5a524',
          cold: '#3b82f6',
          ok: '#22c55e',
        },
      },
      fontFamily: {
        crm: ['Poppins', 'Segoe UI', 'system-ui', 'sans-serif'],
        'crm-sans': ['Open Sans', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};
