import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  publicDir: "public",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        forYou: resolve(__dirname, "for-you.html"),
        whyUs: resolve(__dirname, "why-us.html"),
        trainingFunctional: resolve(__dirname, "training-functional.html"),
        trainingStrength: resolve(__dirname, "training-strength.html"),
        trainingBody: resolve(__dirname, "training-body.html"),
        trainingYouth: resolve(__dirname, "training-youth.html"),
      },
    },
  },
});
