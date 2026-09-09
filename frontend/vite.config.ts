import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: [
        "Android >= 7",
        "Chrome >= 70",
        "Safari >= 12",
        "iOS >= 12",
      ],
      polyfills: true,
    }),
  ],
  build: {
    target: "es2015",
  },
});
