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
        sm: '8px',
        md: '16px',
        lg: '24px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 12px rgba(0,0,0,0.08)',
        lg: '0 8px 24px rgba(0,0,0,0.12)',
      },
      fontSize: {
        heading: ['1.75rem', { lineHeight: '1.3', fontWeight: '600' }],
        subheading: ['1.25rem', { lineHeight: '1.4', fontWeight: '500' }],
        body: ['1.125rem', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['0.9375rem', { lineHeight: '1.5', fontWeight: '400' }],
      },
    },
  },
  plugins: [],
};
