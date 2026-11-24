/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        tarot: {
          dark: '#090A10',
          card: '#121526',
          border: '#232845',
          gold: '#D4AF37',
          goldLight: '#F3E5AB',
          accent: '#7C3AED',
          accentLight: '#A78BFA',
          muted: '#8E94B2',
          surface: '#1A1E36',
        }
      },
      fontFamily: {
        serif: ['Cinzel', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-gold': '0 0 25px -5px rgba(212, 175, 55, 0.3)',
        'glow-purple': '0 0 30px -5px rgba(124, 58, 237, 0.35)',
      }
    },
  },
  plugins: [],
}
