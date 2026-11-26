import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Relative base so assets work on GitHub Pages, Vercel, and local preview.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
