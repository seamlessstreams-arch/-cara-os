// Declares Vitest's global APIs (describe / it / expect / vi / beforeEach …) to
// TypeScript. The project runs Vitest with `globals: true` (see vitest.config.ts),
// so test files use these without importing them — this reference makes tsc aware
// of them too, additively (it does NOT set compilerOptions.types, so Node / Next
// / DOM ambient types remain included). Clears the bulk of the test-file errors.
/// <reference types="vitest/globals" />
