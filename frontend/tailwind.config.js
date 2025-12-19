/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#09090b',        // Zinc 950 (Deep background)
          surface: '#18181b',   // Zinc 900 (Card background)
          card: '#18181b',      // Zinc 900
          border: '#27272a',    // Zinc 800
          hover: '#27272a',     // Zinc 800
          active: '#3f3f46',    // Zinc 700
        },
        brand: {
          primary: '#10b981',   // Emerald 500
          secondary: '#34d399', // Emerald 400
          accent: '#059669',    // Emerald 600
        },
        text: {
          primary: '#f4f4f5',   // Zinc 100
          secondary: '#a1a1aa', // Zinc 400
          muted: '#52525b',     // Zinc 600
        },
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #10b98133 0deg, #09090b 360deg)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
