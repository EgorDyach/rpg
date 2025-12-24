/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'rpg-gold': '#FFD700',
        'rpg-gold-dark': '#DAA520',
        'rpg-purple': '#8B5CF6',
        'rpg-purple-dark': '#6D28D9',
        'rpg-blue': '#3B82F6',
        'rpg-blue-dark': '#1E40AF',
        'rpg-green': '#10B981',
        'rpg-green-dark': '#059669',
        'rpg-red': '#EF4444',
        'rpg-red-dark': '#DC2626',
        'rpg-bg': '#0F172A',
        'rpg-bg-light': '#1E293B',
        'rpg-text': '#F1F5F9',
        'rpg-text-dim': '#94A3B8',
      },
      fontFamily: {
        'game': ['"Press Start 2P"', 'cursive'],
        'display': ['"Orbitron"', 'sans-serif'],
      },
      boxShadow: {
        'rpg': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'rpg-glow': '0 0 20px rgba(139, 92, 246, 0.5)',
        'rpg-gold-glow': '0 0 20px rgba(255, 215, 0, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(139, 92, 246, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}

