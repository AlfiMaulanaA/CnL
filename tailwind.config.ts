import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#8B5CF6',
          blue: '#3B82F6',
          cyan: '#06B6D4',
          green: '#22C55E',
          yellow: '#FACC15',
          orange: '#F97316',
          pink: '#EC4899',
          red: '#EF4444'
        },
        scene: '#F8FAFC'
      },
      fontFamily: {
        display: ['Fredoka', 'ui-rounded', 'system-ui', 'sans-serif'],
        body: ['Nunito', 'ui-rounded', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        candy: '0 4px 0 0 rgba(15, 23, 42, 0.15)',
        soft: '0 10px 30px -12px rgba(15, 23, 42, 0.25)',
        tile: 'inset 0 -2px 0 rgba(15, 23, 42, 0.12)'
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0.7)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.4)' },
          '55%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' }
        },
        'float-up': {
          '0%': { transform: 'translateY(0) scale(0.8)', opacity: '0' },
          '15%': { opacity: '1' },
          '100%': { transform: 'translateY(-120px) scale(1.2)', opacity: '0' }
        },
        'slide-banner': {
          '0%': { transform: 'translateY(-24px) scale(0.9)', opacity: '0' },
          '20%': { transform: 'translateY(0) scale(1.05)', opacity: '1' },
          '80%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-8px) scale(0.98)', opacity: '0' }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' }
        },
        'dice-tumble': {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.1)' },
          '100%': { transform: 'rotate(360deg) scale(1)' }
        }
      },
      animation: {
        'pop-in': 'pop-in 0.25s ease-out both',
        'bounce-in': 'bounce-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'float-up': 'float-up 1.6s ease-out forwards',
        'slide-banner': 'slide-banner 1.4s ease-out forwards',
        shake: 'shake 0.3s ease-in-out',
        'dice-tumble': 'dice-tumble 0.55s linear infinite'
      }
    }
  },
  plugins: []
};

export default config;
