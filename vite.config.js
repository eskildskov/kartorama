/* eslint-disable */

import { defineConfig } from "vite";
import { dependencies } from "./package.json";

const vendors = [
  "leaflet",
  "@turf/turf",
  "@turf/meta",
  "@turf/helpers",
  "@geoman-io/leaflet-geoman-free",
  "@fortawesome/fontawesome-free",
];

export default defineConfig({
  root: "src",

  build: {
    outDir: "../dist",
    emptyOutDir: true,
    sourceMap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: vendors,
          // ...renderChunks(dependencies),
        },
      },
    },
  },
});
