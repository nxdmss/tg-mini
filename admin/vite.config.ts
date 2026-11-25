import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  resolve: { dedupe: ["react", "react-dom", "react-router-dom"] },
  plugins: [
    react(),
  ],

  build: {
    target: "es2015",
  },
});
