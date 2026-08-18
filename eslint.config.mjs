import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Standalone sub-package with its own deps/tsconfig — not part of the app build.
    "cornerstone-agent/**",
  ]),

  // ── Local decisions (census 2026-08-17; every other rule keeps its stock
  //    severity — tune deliberately, never by attrition) ─────────────────────
  {
    // The CI guards are CommonJS BY DESIGN: plain `node scripts/x.js`, no
    // build step, runnable on a bare runner. Telling them not to `require()`
    // is the ruleset being wrong about the code, not the code being wrong.
    files: ["scripts/**"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    // The standard convention for INTENTIONAL discards: a leading underscore
    // says "unused on purpose" — a destructure that drops fields, a callback
    // whose signature is fixed, a caught error nobody inspects. Everything
    // not underscored still warns, which is what makes the 4,791-finding
    // burn-down expressible: fix it or own it by name.
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", {
        args: "all",
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        ignoreRestSiblings: true,
      }],
    },
  },
]);

export default eslintConfig;
