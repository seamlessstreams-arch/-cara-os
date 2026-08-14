#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Guard: a visible field label must be associated with its control.
//
// `<Label>Staff member</Label>` followed by a bare `<Input />` looks labelled
// but is not: with no htmlFor/id pair (and no implicit wrapping), a screen
// reader announces "edit text, blank" where a sighted user reads "Staff
// member". A placeholder is not a label either — it disappears on focus, and
// is not exposed as an accessible name by every AT/browser pairing.
//
// 1,251 pairs across 205 page files were associated in one pass; this keeps
// the next form from regressing. Scope is page files: a page renders once per
// route, so a file-scoped id is unique in the document.
//
// A label is a violation when it has no htmlFor, contains plain text (not a
// JSX expression), wraps no control of its own, and is immediately followed
// by a control that has no id. Fix: give the control an id and the label a
// matching htmlFor — see any converted page, e.g.
//   <Label htmlFor="a1b2-visit-date">Visit Date *</Label>
//   <Input id="a1b2-visit-date" type="date" … />
//
// DEFERRED (not fixable this way — a file-scoped id would DUPLICATE at
// runtime because the component renders many times on one page; these need
// React.useId()):
const DEFERRED = new Set([
  "src/app/(platform)/intelligence/document-wizard/page.tsx", // SectionLabel ×18
  "src/app/(platform)/maintenance/page.tsx",                  // MaintenanceCard ×2
  "src/app/(platform)/management/cara/page.tsx",              // ToggleSwitch ×9
  "src/app/(platform)/staffing-cover/page.tsx",               // PeriodRow ×2
  "src/app/(platform)/visitors-feedback/page.tsx",            // Stars ×2
  // Local `Label` here renders a <span>, not a <label> — htmlFor is
  // meaningless on it (tsc caught the attempt). Needs a real element change,
  // considered on its own rather than swept.
  "src/app/(platform)/intelligence/cara/livers/page.tsx",
]);
// ─────────────────────────────────────────────────────────────────────────────
const fs = require("node:fs");
const path = require("node:path");

const CONTROL = /<(Input|Textarea|SelectTrigger|input|textarea|select)\b/;

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
  const rel = file.split(path.sep).join("/");
  if (DEFERRED.has(rel)) continue;
  const text = fs.readFileSync(file, "utf8");
  // Plain-text label with no htmlFor, wrapping nothing.
  const re = /<([Ll]abel)\b(?![^>]*htmlFor)[^>]*>([^<{]+)<\/[Ll]abel>/g;
  let m;
  while ((m = re.exec(text))) {
    if (!m[2].trim()) continue;
    const window = text.slice(m.index + m[0].length, m.index + m[0].length + 400);
    const ctrl = CONTROL.exec(window);
    if (!ctrl) continue; // label with no control after it — not this class
    const nextLabel = /<[Ll]abel\b/.exec(window);
    if (nextLabel && nextLabel.index < ctrl.index) continue; // pairs with a later control
    const tagEnd = window.indexOf(">", ctrl.index);
    const tag = window.slice(ctrl.index, tagEnd + 1);
    if (/\bid=/.test(tag)) continue;
    const line = text.slice(0, m.index).split("\n").length;
    violations.push(`${rel}:${line}  "${m[2].trim().slice(0, 40)}"`);
  }
}

if (violations.length) {
  console.error(
    `check-label-association: ${violations.length} field label(s) not associated with a control.\n` +
      `A label that isn't tied to its input leaves the field unnamed for screen readers —\n` +
      `it announces "edit text, blank". Give the control an id and the label a matching\n` +
      `htmlFor. A placeholder is not a label.\n`
  );
  for (const v of violations) console.error("  " + v);
  process.exit(1);
}
console.log("check-label-association: every plain-text field label in a page is tied to its control.");
