import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        om: {
          dark: "#0B1120",       // Fond principal (Bleu nuit très sombre)
          primary: "#009DDC",    // Bleu OM (Ciel/Azure)
          accent: "#D3A400",     // Or OM
          glass: "rgba(255, 255, 255, 0.05)", // Base pour l'effet verre
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;