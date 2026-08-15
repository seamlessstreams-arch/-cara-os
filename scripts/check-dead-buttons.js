#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Guard: a button that looks actionable must do something.
//
// A <Button> with no onClick, no href, no asChild, no type="submit", not
// wrapped in a <Link> or a Radix Trigger, and not disabled, is inert: it
// renders, it hovers, it has a label like "Log Concern" or "Export Report",
// and clicking it does nothing at all. Nothing tells the user that — no
// error, no toast, no disabled state. On a records system that is the same
// promise-and-discard problem as the unwired create dialogs (#930, #933),
// one step earlier in the interaction.
//
// This guard does NOT try to fix the ones already here. Each is a product
// decision — wire it, remove it, or disable it with a reason — and several
// (the "Request Cara Draft" buttons) depend on AI credits that are currently
// exhausted. They are listed in BASELINE below so the count can only fall.
// A new dead button fails the build.
//
// Burn-down, not a permanent allowance: when one is decided, delete its line.
// Keying is `page|label`, not line numbers, so the list survives edits.
//
// Deliberately NOT flagged: buttons inside <Link>/<Trigger> (the parent
// carries the action), explicit `disabled` (an honest "not available"),
// type="submit" inside a form, and icon-only buttons with no text label
// (they are covered by the a11y work, not this).
// ─────────────────────────────────────────────────────────────────────────────
const fs = require("node:fs");
const path = require("node:path");

// Known-inert buttons at the time this guard landed. See the note above:
// this list is a burn-down. Do not add to it.
const BASELINE = new Set([
  "admissions/workflow|New Referral",
  "admissions/workflow|Advance to {PHASE_LABELS[nextPhase",
  "buildings|View Vehicles",
  "buildings|View Maintenance",
  "care-events|Review Regulation 45 evidence",
  "children/progress|Copy to Clipboard",
  "children/progress|Add to Report",
  "communications|New Draft",
  "communications|Edit",
  "communications|Submit for Review",
  "communications|Approve",
  "communications|Mark as Sent",
  "communications|Copy",
  "dashboard/manager-control-centre|Export Summary",
  "dashboard/manager-control-centre|Open Record",
  "dashboard/manager-control-centre|Add Oversight </B",
  "dashboard/manager-control-centre|Assign Task",
  "dashboard/manager-control-centre|Request Cara Draft",
  "dashboard/provider-oversight|Export Report",
  "dashboard/provider-oversight|Request Action",
  "dashboard/provider-oversight|Mark Reviewed",
  "direct-work|Record a Session",
  "incidents/learning-review|Create Key Work Task",
  "incidents/learning-review|Create Debrief Task",
  "incidents/learning-review|Review Risk Assessment",
  "incidents/learning-review|Escalate to RI",
  "intelligence/cara/resources|Preview",
  "intelligence/cara/resources|Print",
  "intelligence/cara/studio|Review gaps",
  "mandatory-training-matrix|Schedule refresher",
  "medication|Print MAR Sheet",
  "professional-contact|Add Contact",
  "quality/ofsted-evidence-room|Export as PDF",
  "quality/ofsted-evidence-room|Link Record",
  "quality/ofsted-evidence-room|View Source",
  "quality/reg-44|Add Action",
  "quality/reg-44|Add Manager Response",
  "quality/reg-44|Add Response",
  "quality/reg-45|Request Cara D",
  "quality/reg-45|Request Cara Draft",
  "quality/reg-45|Auto-Link Evidence",
  "recruitment/candidates/[candidateId]|Export",
  "recruitment|Export",
  "recruitment|Generate",
  "recruitment/safer-recruitment/audit|Generate Inspection Bundle",
  "recruitment/safer-recruitment/checks|Export Grid",
  "regulation-45|Export draft report",
  "safeguarding|Log Concern",
  "staff/competence-passport|Assign Training",
  "staff/competence-passport|Schedule Supervision",
  "staff/competence-passport|Restrict Duty",
  "workforce/appraisals|New Appraisal",
  "workforce/cara-planner|Manual Plan",
  "workforce/induction|New Induction",
  "workforce/observations|New Observation",
  "workforce/qualifications|Add Qualification",
]);

/** Full JSX tag from '<' at `start` — a '>' inside {…} or a string is not the close. */
function tagAt(text, start) {
  let i = start, depth = 0, q = null;
  for (; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === q && text[i - 1] !== "\\") q = null; continue; }
    if (c === '"' || c === "'" || c === "`") q = c;
    else if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0) return text.slice(start, i + 1);
  }
  return text.slice(start, start + 400);
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "node_modules") continue;
      yield* walk(full);
    } else if (entry.name === "page.tsx") {
      yield full;
    }
  }
}

const violations = [];
for (const file of walk("src/app")) {
  const text = fs.readFileSync(file, "utf8");
  if (!text.includes("<Button")) continue;
  const page = file
    .split(path.sep).join("/")
    .replace("src/app/(platform)/", "")
    .replace("/page.tsx", "");

  const re = /<Button\b/g;
  let m;
  while ((m = re.exec(text))) {
    const tag = tagAt(text, m.index);
    if (/onClick|asChild|type="submit"|href|\bdisabled\b/.test(tag)) continue;

    const after = text.slice(m.index + tag.length, m.index + tag.length + 120);
    const label = after.split("</Button")[0].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 34);
    if (!label) continue; // icon-only: a11y's problem, not this guard's

    const back = text.slice(Math.max(0, m.index - 500), m.index);
    if (/<Link\b[^>]*>\s*(\{[^}]*\}\s*)?$/s.test(back)) continue;
    if (/<\w*Trigger\b[^>]*>\s*$/s.test(back)) continue;

    if (BASELINE.has(`${page}|${label}`)) continue;
    const line = text.slice(0, m.index).split("\n").length;
    violations.push(`${page}/page.tsx:${line}  "${label}" has no onClick, href or form — clicking it does nothing`);
  }
}

if (violations.length) {
  console.error(
    `check-dead-buttons: ${violations.length} button(s) look actionable and do nothing.\n` +
      `Give it a handler, wrap it in a Link, or mark it disabled with a reason —\n` +
      `an inert control tells the user nothing at all when they press it.\n`
  );
  for (const v of violations) console.error("  " + v);
  process.exit(1);
}
console.log(`check-dead-buttons: no new inert buttons (${BASELINE.size} pre-existing, burn-down list in this file).`);
