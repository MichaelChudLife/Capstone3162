import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  esbuild: {
    jsx: "automatic",
  },
  test: {
    setupFiles: ["tests/setup.ts"],
    projects: [
      {
        extends: true,
        test: { name: "unit", environment: "node", include: ["tests/**/*.test.ts"] },
      },
      {
        extends: true,
        test: { name: "components", environment: "jsdom", include: ["tests/**/*.test.tsx"] },
      },
    ],
  },
});
