/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-red': '#EA2831',
        'brand-red-dark': '#C81E25',
      }
    },
  },
  plugins: [],
}