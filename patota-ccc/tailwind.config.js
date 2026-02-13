/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1d4ed8', // Azul para o tema do app
        secondary: '#9333ea',
        success: '#16a34a',
        danger: '#dc2626',
        warning: '#ea580c',
      },
    },
  },
  plugins: [],
}
