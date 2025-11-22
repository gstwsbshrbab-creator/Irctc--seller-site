/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#6d28d9',
      },
      boxShadow: {
        'soft-card': '0 18px 40px rgba(15,23,42,0.55)',
      },
    },
  },
  plugins: [],
};
