/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'medical-primary': '#2563eb',
        'medical-secondary': '#1e40af',
        'medical-light': '#dbeafe',
      },
    },
  },
  plugins: [],
}

