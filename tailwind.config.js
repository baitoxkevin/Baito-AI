/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html"
  ],
  theme: {
    extend: {
      colors: {
        border: "rgb(229, 231, 235)",
        input: "rgb(229, 231, 235)",
        ring: "rgb(99, 102, 241)",
        background: "rgb(255, 255, 255)",
        foreground: "rgb(17, 24, 39)",
        primary: {
          DEFAULT: "#5484ED",
          foreground: "rgb(255, 255, 255)"
        },
        secondary: {
          DEFAULT: "rgb(243, 244, 246)",
          foreground: "rgb(17, 24, 39)"
        },
        destructive: {
          DEFAULT: "#DC2127",
          foreground: "rgb(255, 255, 255)"
        },
        muted: {
          DEFAULT: "rgb(243, 244, 246)",
          foreground: "rgb(107, 114, 128)"
        },
        accent: {
          DEFAULT: "rgb(243, 244, 246)",
          foreground: "rgb(17, 24, 39)"
        },
        card: {
          DEFAULT: "rgb(255, 255, 255)",
          foreground: "rgb(17, 24, 39)"
        }
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem"
      }
    }
  },
  plugins: [require("@tailwindcss/forms")]
}
