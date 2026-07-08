import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Appelsínugulur merkislitur (endurhönnun, "hreinn merkislitur") –
          // notaður samræmt sem aðal-accent litur forritsins (hausar, merki,
          // virkir reitir). "dark" er dýpkaða útgáfan fyrir virka/ýtta fleti.
          DEFAULT: "#E76425",
          dark: "#CC4F0E",
          light: "#DDA67F",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
