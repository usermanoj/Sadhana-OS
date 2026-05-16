/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        ivory: '#FDFAF6',
        surface: '#FFFFFF',
        muted: '#F5F0EB',
        border: '#E5E0DB',
        'text-primary': '#1A1A1A',
        'text-secondary': '#6B6B6B',
        accent: {
          DEFAULT: '#7C3AED',
          primary: '#7C3AED',
          secondary: '#F59E0B',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '16px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 12px rgba(0,0,0,0.08)',
        lg: '0 8px 24px rgba(0,0,0,0.12)',
      },
      fontSize: {
        heading: ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        subheading: ['1rem', { lineHeight: '1.5', fontWeight: '500' }],
        body: ['0.875rem', { lineHeight: '1.43', fontWeight: '400' }],
        caption: ['0.75rem', { lineHeight: '1.33', fontWeight: '400' }],
      },
      keyframes: {
        pageFade: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        pageFade: 'pageFade 150ms ease-out',
      },
    },
  },
  plugins: [],
};
