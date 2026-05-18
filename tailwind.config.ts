import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'media', // follows system preference automatically (iOS-like)
  theme: {
    extend: {
      colors: {
        ios: {
          blue:   '#007AFF',
          green:  '#34C759',
          orange: '#FF9500',
          red:    '#FF3B30',
          indigo: '#5856D6',
          gray:   '#8E8E93',
          gray2:  '#AEAEB2',
          gray3:  '#C7C7CC',
          gray4:  '#D1D1D6',
          gray5:  '#E5E5EA',
          gray6:  '#F2F2F7',
        },
      },
      fontFamily: {
        // Resolves to native SF Pro on Apple devices, falls back gracefully
        sf: ['-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'ios-card': '0 2px 12px 0 rgba(0,0,0,0.08)',
        'ios-sheet': '0 -4px 24px 0 rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
