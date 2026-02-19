import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/domain/**/*.spec.ts", "tests/contracts/**/*.spec.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/domain/**/*.ts", "src/application/**/*.ts", "src/infrastructure/**/*.ts"],
    },
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
