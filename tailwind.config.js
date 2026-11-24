/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/crm/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        crm: {
          ink: '#0f172a',
          muted: '#475569',
          line: '#e2e8f0',
          paper: '#f1f5f9',
          card: '#ffffff',
          primary: '#2563eb',
          'primary-soft': '#eff6ff',
          accent: '#059669',
          dark: '#0b1220',
          chrome: '#111827',
          hot: '#dc2626',
          warm: '#d97706',
          cold: '#0284c7',
        },
      },
      fontFamily: {
        crm: ['Poppins', 'Segoe UI', 'system-ui', 'sans-serif'],
        'crm-sans': ['Open Sans', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'crm-card': '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06)',
        'crm-nav': '0 0 0 1px rgba(255,255,255,0.06), 0 8px 24px rgba(37, 99, 235, 0.18)',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};
