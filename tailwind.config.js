/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./resources/views/**/*.blade.php', './public/js/app.js', './app/**/*.php'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#eef6ff', 100: '#d9eaff', 500: '#2f6fed', 600: '#2259d1', 700: '#1c47a8' },
      },
    },
  },
  plugins: [],
};
