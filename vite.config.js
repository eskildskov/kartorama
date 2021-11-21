/* eslint-disable */

import { defineConfig } from "vite";

export default defineConfig({
  root: "src",
  build: {
    outDir: "../dist",
    //   lib: {
    //     entry: "export.js",
    //     name: "Kartorama",
    //     fileName: (format) => `kartorama.${format}.js`,
    //     formats: ["es"],
    //   },
    //   rollupOptions: {
    //     // make sure to externalize deps that shouldn't be bundled
    //     // into your library
    //     // external: ["vue"],
    //     output: {
    //       // Provide global variables to use in the UMD build
    //       // for externalized deps
    //       globals: {
    //         // vue: "Vue",
    //       },
    //     },
    //   },
  },
});
