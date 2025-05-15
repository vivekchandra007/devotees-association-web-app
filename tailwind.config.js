// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#fffaf0', // light cream
        primary: '#d97706',    // saffron
        secondary: '#2563eb',  // ISKCON blue
        accent: '#16a34a',     // vrindavan green
        text: '#1f2937',       // charcoal
        card: '#ffffff',
        border: '#e5e7eb',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Merriweather', 'serif'],
      },
    },
  },
  plugins: [],
}