/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        // ===== Bar animations (with horizontal centering) =====
        'bar-slide-up-fade-in': {
          '0%': { transform: 'translate(-50%, 100%)', opacity: '0' },
          '100%': { transform: 'translate(-50%, 0)', opacity: '1' },
        },
        'bar-slide-down-fade-out': {
          '0%': { transform: 'translate(-50%, 0)', opacity: '1' },
          '100%': { transform: 'translate(-50%, 100%)', opacity: '0' },
        },

        // ===== General animations (no horizontal translation) =====
        'slide-up-fade-in': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down-fade-out': {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
      },
      animation: {
        // Bar animations
        'bar-slide-up-fade-in': 'bar-slide-up-fade-in 0.3s ease-out forwards',
        'bar-slide-down-fade-out': 'bar-slide-down-fade-out 0.3s ease-in forwards',

        // General animations
        'slide-up-fade-in': 'slide-up-fade-in 0.3s ease-out forwards',
        'slide-down-fade-out': 'slide-down-fade-out 0.3s ease-in forwards',
      },
    },
  },
  plugins: [],
};
