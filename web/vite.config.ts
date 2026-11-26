import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// GitHub Pages project site: https://duball97.github.io/ETF-Coin/
export default defineConfig({
  plugins: [react()],
  base: "/ETF-Coin/",
});
