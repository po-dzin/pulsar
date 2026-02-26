import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
    },
  },
  globalIgnores([
    ".next/**",
    ".next-dev-turbo/**",
    ".next-dev-webpack/**",
    "next-env.d.ts",
    "out/**",
    "build/**",
    "test-results/**",
    "playwright-report/**",
  ]),
]);
