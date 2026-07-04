import { defineConfig } from "vite";
import { resolve } from "path";
import injectHTML from "vite-plugin-html-inject";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        error: resolve(__dirname, "error.html"),
      },
    },
  },
  plugins: [injectHTML()],
});
