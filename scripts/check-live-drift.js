#!/usr/bin/env node
/*
 * check-live-drift.js — every deploy target must be serving the current HEAD.
 *
 * The class this guards: THREE Vercel projects build from this one repo, and
 * for a long time only two of them auto-deployed. `cara-paintpoint` — the LIVE
 * tenant — had no git link at all, so it only moved when someone ran
 * `npx vercel deploy` by hand. On 2026-07-25 four commits were pushed over a
 * session; the two git-connected projects tracked main correctly and the LIVE
 * one sat four commits behind, serving users a stale build. Every live-check
 * along the way passed, because each one probed a single URL.
 *
 * That is the failure mode: verifying one target and concluding "it is live".
 * This checks them ALL against the local HEAD and names the ones that drifted.
 *
 * Not a CI guard — it needs the network and a deployed build, so it is a
 * post-deploy verification step (`npm run verify:live`). Run it after any push
 * whose result has to be live. Exit 1 on drift.
 *
 * If a target is legitimately retired, delete the project or remove it here —
 * do not leave it listed and failing, or this becomes noise people ignore.
 */
const { execSync } = require("child_process");

const TARGETS = [
  { url: "https://cara-paintpoint.vercel.app", label: "LIVE TENANT (Oak House)" },
  { url: "https://cara-careos-fresh.vercel.app", label: "git-connected" },
  { url: "https://cornerstone-v2-seamlessstreams-archs-projects.vercel.app", label: "git-connected" },
];

const TIMEOUT_MS = 20_000;

function head() {
  return execSync("git rev-parse --short=9 HEAD", { encoding: "utf8" }).trim();
}

async function commitOf(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${url}/api/v1/health-check`, { signal: ctl.signal });
    if (!res.ok) return `HTTP ${res.status}`;
    const json = await res.json();
    return json?.data?.build?.commit ?? "no commit in payload";
  } catch (e) {
    return e.name === "AbortError" ? "timeout" : `unreachable (${e.message})`;
  } finally {
    clearTimeout(t);
  }
}

(async () => {
  const expected = head();
  console.log(`check-live-drift: local HEAD is ${expected}\n`);

  const rows = await Promise.all(
    TARGETS.map(async (t) => ({ ...t, got: await commitOf(t.url) })),
  );

  const drifted = rows.filter((r) => r.got !== expected);

  for (const r of rows) {
    const host = r.url.replace(/^https:\/\//, "");
    const mark = r.got === expected ? "✓" : "✖";
    console.log(`  ${mark} ${host.padEnd(58)} ${r.got}   [${r.label}]`);
  }

  if (drifted.length > 0) {
    console.error(
      `\ncheck-live-drift: ${drifted.length} target(s) are NOT serving HEAD.\n` +
        `A target can lag because its build is still running (wait ~8 min and re-run), or\n` +
        `because it is not git-connected and needs a manual deploy:\n` +
        `    npx vercel deploy --prod --archive=tgz\n`,
    );
    process.exit(1);
  }

  console.log(`\ncheck-live-drift: all ${rows.length} targets serving ${expected} ✓`);
})();
