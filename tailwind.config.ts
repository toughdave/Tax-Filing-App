import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#122338",
        mist: "#e6edf5",
        pine: "#1f6b57",
        ember: "#ca5a2f",
        lake: "#2679c8"
      },
      boxShadow: {
        soft: "0 20px 60px -35px rgba(18, 35, 56, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;
