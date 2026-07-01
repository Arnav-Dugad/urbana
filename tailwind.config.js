/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#0B0F14',
          900: '#0E141B',
          850: '#121821',
          800: '#161E29',
          700: '#1E2836',
          600: '#2A3646',
        },
        greenery: '#34d399',
        walk: '#22d3ee',
        transit: '#f472b6',
        air: '#f59e0b',
        livable: '#a78bfa',
      },
      boxShadow: {
        panel: '0 8px 40px -12px rgba(0,0,0,0.7)',
        glow: '0 0 0 1px rgba(255,255,255,0.05), 0 20px 60px -20px rgba(0,0,0,0.8)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        'fade-up': 'fade-up 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};
