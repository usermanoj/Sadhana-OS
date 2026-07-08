/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        ivory: '#FAF7F1',
        surface: '#FFFDFC',
        muted: '#F2EDE6',
        border: '#E6DED2',
        'text-primary': '#171412',
        'text-secondary': '#6E6258',
        accent: {
          DEFAULT: '#6D4AFF',
          primary: '#6D4AFF',
          secondary: '#C66A1B',
          success: '#0E9F6E',
          warning: '#D97706',
          danger: '#DC2626',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(36, 28, 20, 0.05)',
        md: '0 10px 24px rgba(36, 28, 20, 0.08)',
        lg: '0 18px 48px rgba(36, 28, 20, 0.12)',
        card: '0 10px 30px rgba(36, 28, 20, 0.06), 0 1px 2px rgba(36, 28, 20, 0.05)',
        lifted: '0 18px 44px rgba(36, 28, 20, 0.10), 0 2px 6px rgba(36, 28, 20, 0.06)',
        nav: '0 18px 36px rgba(36, 28, 20, 0.10)',
      },
      fontSize: {
        heading: ['1.75rem', { lineHeight: '1.28', fontWeight: '600' }],
        subheading: ['1.25rem', { lineHeight: '1.42', fontWeight: '500' }],
        body: ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['0.875rem', { lineHeight: '1.4', fontWeight: '400' }],
      },
      keyframes: {
        pageFade: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        completionPulse: {
          '0%': { boxShadow: '0 0 0 0 rgba(14, 159, 110, 0.22)' },
          '70%': { boxShadow: '0 0 0 10px rgba(14, 159, 110, 0)' },
          '100%': { boxShadow: 'var(--shadow-card)' },
        },
      },
      animation: {
        pageFade: 'pageFade 150ms ease-out',
        completionPulse: 'completionPulse 900ms ease-out',
      },
    },
  },
  plugins: [],
};
