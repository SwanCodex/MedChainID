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
          bg: '#050505',
          surface: '#0A0A0A',
          card: '#1A1A1A',
          border: '#262626',
          hover: '#1F1F1F',
        },
        text: {
          primary: '#E5E5E5',
          secondary: '#A3A3A3',
          muted: '#737373',
        },
        accent: {
          primary: '#3B82F6',
          hover: '#2563EB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Geist Sans', 'Roboto', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      borderRadius: {
        'DEFAULT': '6px',
      },
    },
  },
  plugins: [],
}
