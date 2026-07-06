export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4D4DFF',
          dark: '#3E3EFF',
          light: '#6366FF',
        },
        accent: '#00E5A0',
        success: '#2ECC71',
        danger: '#FF4D4F',
        warning: '#F5A623',
        gray: {
          50: '#FAFAFA',
          100: '#F5F5F7',
          200: '#EFEFF2',
          300: '#E4E4E7',
          400: '#C7C7CC',
          500: '#9A9AA0',
          600: '#707078',
          700: '#505057',
          800: '#2D2D33',
          900: '#17171C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '20px',
        'button': '12px',
      },
      boxShadow: {
        'card': '0 4px 16px rgba(0,0,0,0.05)',
        'floating': '0 8px 20px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}
