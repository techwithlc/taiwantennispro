/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        court: {
          available: '#22c55e',
          taken: '#ef4444',
          partial: '#f59e0b',
          unknown: '#6b7280',
        },
      },
    },
  },
  plugins: [],
}

