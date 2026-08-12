#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Give eslint a TypeScript 6 to talk to, without touching the TypeScript 7 the
// type gates run on.
//
// The typescript-eslint bundled inside eslint-config-next refuses to load
// against TS >= 7 (their tracking issue #10940) and its gate is simply
// whatever `require("typescript")` resolves to from that subtree. TS 7 is the
// native-port performance release, not a language change, so lint parsed by
// TS 6 sees the same syntax the compiler does. The TS 7 release notes describe
// exactly this side-by-side arrangement.
//
// npm overrides could not express "TS 6 for this subtree only" — the peer
// solver insists on one root typescript — so this plants the nested copy as a
// symlink instead: node_modules/eslint-config-next/node_modules/typescript →
// the typescript6 alias package. It lives in node_modules (never committed),
// is recreated on demand by `npm run lint`, and vanishes with the next
// `npm ci`. Delete this script the day typescript-eslint supports TS 7.
//
// Everything else keeps resolving the root typescript@7: tsc, the three CI
// type-check scopes, next build.
// ─────────────────────────────────────────────────────────────────────────────
const fs = require("node:fs");
const path = require("node:path");

const target = path.resolve("node_modules/typescript6");

if (!fs.existsSync(target)) {
  // Only lint needs the TS 6 sidecar. In an environment that omitted
  // devDependencies there is nothing to repair either — npm never linked the
  // alias bins — so a missing sidecar must not fail the install.
  console.log("link-eslint-ts6: typescript6 not installed (devDependencies omitted?) — nothing to do.");
  process.exit(0);
}

// Every package in the lint chain that resolves `typescript` for itself. The
// nested typescript-eslint stack under eslint-config-next is covered by the
// first entry (upward resolution stops there); ts-api-utils and the three
// @typescript-eslint helpers are HOISTED to the root by npm, so each needs its
// own nested copy or it grabs the root TS 7 and crashes on changed internals
// (ts-api-utils reads enum members TS 7 no longer exposes).
const HOSTS = [
  "node_modules/eslint-config-next",
  "node_modules/ts-api-utils",
  ...(() => {
    const scope = "node_modules/@typescript-eslint";
    try {
      return fs.readdirSync(scope).map((d) => path.join(scope, d));
    } catch {
      return [];
    }
  })(),
];

for (const host of HOSTS) {
  if (!fs.existsSync(host)) continue;
  const linkDir = path.join(host, "node_modules");
  const link = path.join(linkDir, "typescript");
  fs.mkdirSync(linkDir, { recursive: true });
  // Replace whatever is there (a stale real dir from an old install, or nothing).
  fs.rmSync(link, { recursive: true, force: true });
  fs.symlinkSync(path.relative(linkDir, path.resolve(target)), link, "dir");
}

// The alias package ships tsc/tsserver bins too, and npm links whichever it
// saw last into node_modules/.bin — which silently downgrades `npx tsc` for
// the WHOLE repo to the slow TS 6 (caught here when a type check that runs in
// ~25s under TS 7 timed out). Re-point both bins at the root typescript@7,
// unconditionally, every run.
for (const [bin, rel] of [
  ["tsc", "../typescript/bin/tsc"],
  ["tsserver", "../typescript/bin/tsserver"],
]) {
  const b = path.join("node_modules/.bin", bin);
  fs.rmSync(b, { force: true });
  fs.symlinkSync(rel, b);
}

const version = JSON.parse(fs.readFileSync(path.join(target, "package.json"), "utf8")).version;
console.log(`link-eslint-ts6: lint chain now resolves typescript@${version}; root stays ${
  JSON.parse(fs.readFileSync("node_modules/typescript/package.json", "utf8")).version
}.`);
