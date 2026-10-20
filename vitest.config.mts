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
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/**/*.test.ts"],
          globalSetup: ["tests/global-setup.ts"],
          setupFiles: ["tests/setup.ts", "tests/setup-db.ts"],
          testTimeout: 20000,
          hookTimeout: 60000,
        },
      },
      {
        extends: true,
        test: { name: "components", environment: "jsdom", include: ["tests/**/*.test.tsx"], setupFiles: ["tests/setup.ts"] },
      },
    ],
  },
});
