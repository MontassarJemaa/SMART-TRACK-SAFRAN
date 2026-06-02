import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        safran: {
          navy: '#1A3A6B',
          blue: '#00A8E8',
          dark: '#1A3A6B',
          accent: '#00A8E8',
          danger: '#D32F2F',
          warning: '#F9A825',
          success: '#2E7D32'
        }
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.45s ease-out forwards'
      }
    }
  },
  plugins: []
};

export default config;
