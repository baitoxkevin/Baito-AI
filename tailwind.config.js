/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      animation: {
        'wave-pulse': 'wave-pulse 4s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite linear',
        'shimmer-slide': 'shimmer-slide var(--speed) ease-in-out infinite alternate',
        'spin-around': 'spin-around calc(var(--speed) * 2) infinite linear',
        'pulse-ring': 'pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
        'bounce-subtle': 'bounce-subtle 2s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'rainbow': 'rainbow var(--speed, 2s) infinite linear',
        'gradient': 'gradient 8s linear infinite',
        'shake': 'shake 0.5s ease-in-out',
        'aurora': 'aurora 10s ease-in-out infinite',
        'line-shadow': 'line-shadow 3s linear infinite',
        'shiny-text': 'shiny-text 8s infinite',
        'rippling': 'rippling 0.6s linear',
        'meteor-effect': 'meteor 5s linear infinite',
      },
      keyframes: {
        'wave-pulse': {
          '0%, 100%': { opacity: 0.4 },
          '50%': { opacity: 0.7 },
        },
        'shimmer': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'shimmer-slide': {
          '0%': { transform: 'translateX(-100%) translateY(-100%)' },
          '100%': { transform: 'translateX(100%) translateY(100%)' },
        },
        'spin-around': {
          '0%': { transform: 'translateZ(0) rotate(0)' },
          '100%': { transform: 'translateZ(0) rotate(360deg)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: 0.7 },
          '50%': { transform: 'scale(1)', opacity: 0.3 },
          '100%': { transform: 'scale(0.9)', opacity: 0.7 },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'float': {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
          '100%': { transform: 'translateY(0px)' },
        },
        'rainbow': {
          '0%': { 'background-position': '0% 50%' },
          '100%': { 'background-position': '200% 50%' },
        },
        'gradient': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        'aurora': {
          '0%, 100%': { 'background-position': '50% 50%' },
          '50%': { 'background-position': '100% 100%' },
        },
        'line-shadow': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'shiny-text': {
          '0%, 100%': { 'background-position': '0 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'rippling': {
          '0%': { transform: 'scale(0)', opacity: 1 },
          '100%': { transform: 'scale(2)', opacity: 0 },
        },
        'meteor': {
          '0%': { transform: 'rotate(215deg) translateX(0)', opacity: 1 },
          '70%': { opacity: 1 },
          '100%': {
            transform: 'rotate(215deg) translateX(-500px)',
            opacity: 0,
          },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: '#f3f6fc',
          100: '#e5eef9',
          200: '#c6dbf1',
          300: '#94bde5',
          400: '#5b9bd5',
          500: '#367ec1',
          600: '#2a6eb6',
          700: '#205084',
          800: '#1e446e',
          900: '#1e3a5c',
          950: '#14263d',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
      },
      boxShadow: {
        'glow': '0 0 15px 2px rgba(101, 157, 255, 0.3)',
        'glow-strong': '0 0 20px 5px rgba(101, 157, 255, 0.5)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-subtle': 'linear-gradient(to right, var(--tw-gradient-stops))',
        'shimmer': 'linear-gradient(to right, #f6f7f8 0%, #edeef1 20%, #f6f7f8 40%, #f6f7f8 100%)',
        'shimmer-dark': 'linear-gradient(to right, #1f2937 0%, #374151 20%, #1f2937 40%, #1f2937 100%)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
