/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm ivory surface ramp
        ivory: {
          50: '#fdfcf9',
          100: '#faf8f3',
          200: '#f5f1e8',
          300: '#efe9db',
          400: '#e4dcc8',
          500: '#d6ccb4',
        },
        // Deep ink text ramp
        ink: {
          50: '#f6f6f4',
          100: '#e9e8e4',
          200: '#d1d0ca',
          300: '#a8a6a0',
          400: '#7a7872',
          500: '#52514d',
          600: '#3d3c39',
          700: '#2b2a28',
          800: '#1c1b1a',
          900: '#0f0e0d',
        },
        // Restrained lime accent
        lime: {
          50: '#f8fee9',
          100: '#eefbc6',
          200: '#def988',
          300: '#c4f23f',
          400: '#a8d61f',
          500: '#86b312',
          600: '#668a0e',
          700: '#4a630a',
          800: '#33450a',
          900: '#1f2a08',
        },
        // Functional ramps
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      maxWidth: {
        '7xl': '80rem',
        '8xl': '88rem',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-slow': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'fade-in-slow': 'fade-in-slow 0.7s ease-out forwards',
        'slide-up': 'slide-up 0.6s ease-out forwards',
        'scale-in': 'scale-in 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
};
