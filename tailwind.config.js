// tailwind.config.js
module.exports = {
  purge: [
    './src/app/**/*.{js,ts,jsx,tsx}', 
    './src/components/**/*.{js,ts,jsx,tsx}'],
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}', 
    './src/components/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: false,
  theme: {
    extend: {
      fontFamily: {
        bonheur: ['var(--font-bonheur)', 'cursive'],
        sans: ['Inter', 'sans-serif'],
        heading: ['Merriweather', 'serif'],
      },
      colors: {
        background: '#fffaf0', // light cream
        primary: '#d97706',    // saffron
        secondary: '#2563eb',  // ISKCON blue
        accent: '#16a34a',     // vrindavan green
        text: '#1f2937',       // charcoal
        card: '#ffffff',
        border: '#e5e7eb',
      },
      backgroundColor: {
        testgreen: '#00ff00',
      },
    },
  },
  plugins: [],
}