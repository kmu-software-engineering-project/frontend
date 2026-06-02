import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f8f1e7',
          100: '#ead9c1',
          200: '#dec49e',
          300: '#cfaa75',
          400: '#bd9254',
          500: '#a8794a',
          600: '#895f38',
          700: '#6d492c',
          800: '#4d3422',
          900: '#2c2018',
        },
        secondary: {
          50: '#f7f4ee',
          100: '#e9e2d4',
          200: '#d8ccb6',
          300: '#c4b292',
          400: '#aa936f',
          500: '#8b7355',
          600: '#6e5941',
          700: '#554331',
          800: '#3b2f24',
          900: '#241e19',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 60px rgba(66, 52, 35, 0.10)',
      },
    },
  },
  plugins: [],
}

export default config
