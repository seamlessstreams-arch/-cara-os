#!/usr/bin/env node
/*
 * check-modal-viewport.js — a centred modal panel must be capped to the viewport.
 *
 * The class this guards (reported live on the document upload modal, then found
 * in 25 more places):
 *
 *   A backdrop centres its panel with `fixed inset-0 … flex items-center`. When
 *   the panel grows taller than the viewport, a centred flex item overflows
 *   EQUALLY above and below its container — and the part above the top edge
 *   cannot be scrolled to. The header and the start of the form become
 *   permanently unreachable. It looks like "the window is cut off and needs
 *   resizing", and it gets worse the longer the form is, so it shows up first on
 *   exactly the forms people most need to finish.
 *
 *   Adding a height cap alone is NOT enough: a panel carrying `overflow-hidden`
 *   (for its rounded corners) that is then capped will clip its content with no
 *   way to scroll — worse than the original bug.
 *
 * THE RULE: a centred panel must carry BOTH
 *   - a height cap (`max-h-…`, normally `max-h-[calc(100dvh-2rem)]`; use dvh so
 *     mobile browser chrome is accounted for), and
 *   - a way to scroll its own overflow (`overflow-y-auto`/`overflow-auto`, or a
 *     `flex flex-col` panel whose body scrolls).
 * A backdrop that scrolls itself (`overflow-y-auto` on the backdrop, with an
 * inner `flex min-h-full items-center` wrapper) also satisfies this and is the
 * richer pattern — see src/components/documents/document-upload-modal.tsx.
 *
 * When this fails: add the cap and the scroll to the flagged panel. Do NOT
 * silence it by removing `items-center` — an uncentred tall modal is still
 * unreachable, just differently.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SCAN_DIRS = [path.join(ROOT, "src", "app"), path.join(ROOT, "src", "components")];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "node_modules") continue;
      walk(p, out);
    } else if (entry.name.endsWith(".tsx")) {
      out.push(p);
    }
  }
  return out;
}

const findings = [];
for (const file of SCAN_DIRS.flatMap((d) => (fs.existsSync(d) ? walk(d) : []))) {
  const src = fs.readFileSync(file, "utf8");
  for (const m of src.matchAll(/className="([^"]*fixed inset-0[^"]*)"/g)) {
    const backdrop = m.group ? m.group(1) : m[1];
    // Only centred flex backdrops are at risk.
    if (!backdrop.includes("flex") || !backdrop.includes("items-center")) continue;
    // A backdrop that scrolls itself is the safe pattern.
    if (backdrop.includes("overflow-y-auto") || backdrop.includes("overflow-auto")) continue;

    const tail = src.slice(m.index + m[0].length, m.index + m[0].length + 700);
    const pm = tail.match(/className=\{?["`]([^"`]*)/);
    if (!pm) continue;
    const panel = pm[1];
    // Heuristic for "this is the dialog panel": dialogs are width-constrained.
    if (!panel.includes("max-w")) continue;

    const capped = /max-h-/.test(panel);
    const scrolls =
      panel.includes("overflow-y-auto") ||
      panel.includes("overflow-auto") ||
      (panel.includes("flex") && panel.includes("flex-col"));

    if (!capped || !scrolls) {
      const line = src.slice(0, m.index).split("\n").length;
      const missing = [!capped && "a height cap (max-h-…)", !scrolls && "a scroll (overflow-y-auto, or flex-col with a scrolling body)"]
        .filter(Boolean)
        .join(" and ");
      findings.push({
        where: `${path.relative(ROOT, file)}:${line}`,
        missing,
        panel: panel.length > 90 ? panel.slice(0, 90) + "…" : panel,
      });
    }
  }
}

if (findings.length > 0) {
  console.error(
    `check-modal-viewport: ${findings.length} centred modal panel(s) can overflow the viewport unreachably.\n` +
      "A centred flex item taller than its container clips above the top edge and cannot be scrolled to:\n",
  );
  for (const f of findings) {
    console.error(`  ✗ ${f.where} — missing ${f.missing}`);
    console.error(`      panel: ${f.panel}`);
  }
  console.error("\nAdd `max-h-[calc(100dvh-2rem)]` plus a scroll. See this file's header.");
  process.exit(1);
}

console.log("check-modal-viewport: every centred modal panel is capped to the viewport and can scroll ✓");
