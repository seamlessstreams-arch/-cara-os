import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Repo-wide lock for the staff-fictionalisation arc (PRs #767–#775): the demo
// home's roster (src/lib/seed-data.ts STAFF) uses invented people, but the
// legacy staff's real-looking names — full names, invented-surname combos,
// initialled forms, and the distinctive first names — kept resurfacing in
// page-local demo arrays, API-route fixtures, seed prose, and both stores.
// This test bans them from every NON-TEST source file so they cannot creep
// back. Test files are excluded (their fixtures are self-contained and are a
// separate cleanup); so are these deliberate uses:
//
// - src/lib/cara/knowledge-base.ts may contain "Darren Laville" ONLY in
//   `origin:` attribution lines — that is real authorship credit for the
//   practice frameworks, not demo fiction.
// - Bare first names "Darren"/"Ryan"/"Anna"/"Edward"/"Diane" are NOT banned:
//   "Hi Darren" greets the demo *user* (landing page, tour, dashboard
//   fallback), "Anna Freud Centre" is a real organisation, and common first
//   names have legitimate uses. The initialled forms and full combos below
//   are what identified the legacy staff.
const BANNED_SUBSTRINGS = [
  "Darren Laville",
  "Ryan Mitchell",
  "Ryan Thompson",
  "Anna Kowalski",
  "Anna Wilson",
  "Edward Chen",
  "Edward Nkemelu",
  "Diane Harper",
  "Lackson",
  "Mirela",
  "Chervelle",
  "Tshawa",
  "Kalongo",
];
const BANNED_PATTERNS = [/\bDarren L\b/, /\bRyan P\b/, /\bAnna T\b/];

const SRC_ROOT = join(__dirname, "..", "..");
const KNOWLEDGE_BASE = join("lib", "cara", "knowledge-base.ts");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== "__tests__" && entry !== "node_modules") walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.test\./.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe("legacy staff names are banned from non-test source", () => {
  const files = walk(SRC_ROOT);

  it("scans a substantial file set — guards against a vacuous pass", () => {
    expect(files.length).toBeGreaterThan(500);
  });

  it("contains no banned legacy staff name", () => {
    const hits: string[] = [];
    for (const file of files) {
      const rel = file.slice(SRC_ROOT.length + 1);
      const content = readFileSync(file, "utf8");
      const isKnowledgeBase = rel.endsWith(KNOWLEDGE_BASE) || rel === KNOWLEDGE_BASE;
      for (const banned of BANNED_SUBSTRINGS) {
        if (!content.includes(banned)) continue;
        if (isKnowledgeBase && banned === "Darren Laville") {
          const offending = content
            .split("\n")
            .filter((line) => line.includes(banned) && !line.includes("origin:"));
          if (offending.length === 0) continue;
        }
        hits.push(`${rel} contains "${banned}"`);
      }
      for (const pattern of BANNED_PATTERNS) {
        if (!pattern.test(content)) continue;
        if (isKnowledgeBase && pattern.source.includes("Darren")) {
          const offending = content
            .split("\n")
            .filter((line) => pattern.test(line) && !line.includes("origin:"));
          if (offending.length === 0) continue;
        }
        hits.push(`${rel} matches ${pattern}`);
      }
    }
    expect(hits, `legacy staff names in non-test source:\n${hits.join("\n")}`).toEqual([]);
  });
});
