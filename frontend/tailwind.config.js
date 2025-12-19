/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Obsidian / Catppuccin Mocha inspired palette
        dark: {
          bg: '#1e1e2e',        // Base - deep purple-black
          surface: '#181825',   // Mantle - slightly darker
          card: '#313244',      // Surface0 - card backgrounds
          border: '#45475a',    // Surface1 - borders
          hover: '#585b70',     // Surface2 - hover states
          active: '#6c7086',    // Overlay0 - active states
          crust: '#11111b',     // Crust - deepest background
        },
        brand: {
          primary: '#cba6f7',   // Mauve - primary purple
          secondary: '#b4befe', // Lavender - secondary
          accent: '#f5c2e7',    // Pink - accent
          tertiary: '#94e2d5',  // Teal - tertiary accent
        },
        text: {
          primary: '#cdd6f4',   // Text - light lavender
          secondary: '#a6adc8', // Subtext1 - muted
          muted: '#6c7086',     // Overlay0 - very muted
        },
        // Status colors
        status: {
          success: '#a6e3a1',   // Green
          warning: '#f9e2af',   // Yellow
          error: '#f38ba8',     // Red/Pink
          info: '#89b4fa',      // Blue
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #cba6f720 0deg, #1e1e2e 360deg)',
        'obsidian-gradient': 'linear-gradient(135deg, #1e1e2e 0%, #181825 50%, #11111b 100%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(203, 166, 247, 0.15)',
        'glow-lg': '0 0 40px rgba(203, 166, 247, 0.2)',
      },
    },
  },
  plugins: [],
}
