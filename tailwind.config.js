/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        linen: "#F7F4EE",
        mist: "#E8EEF1",
        sage: "#7D927A",
        clay: "#B9785F",
        gold: "#C9A227"
      },
      fontFamily: {
        sans: ["System"]
      }
    }
  },
  plugins: []
};
