import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    exclude: ["node_modules", "e2e", "cornerstone-agent"],
    // vitest's 5s default is too tight for this repo. Importing the in-memory
    // store pulls in ~20.5k lines of seed, and suites that also use
    // vi.resetModules() pay that per case. Such a test passes alone in ~2.7s
    // and then tips over 5s under parallel load — a FLAKE, not a real failure,
    // which is the worst kind of red: it trains people to re-run rather than
    // read. 138 test files import the store with no explicit timeout; four had
    // been patched one at a time with vi.setConfig({ testTimeout: 30_000 }).
    // Setting it once here fixes the whole class, and those per-file overrides
    // still win where they are set.
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Next's `server-only` marker is not resolvable under vitest — stub it so
      // server-side modules (the AI gateway, meters, services) can be unit-tested.
      "server-only": path.resolve(__dirname, "./src/test/server-only.stub.ts"),
    },
  },
});
