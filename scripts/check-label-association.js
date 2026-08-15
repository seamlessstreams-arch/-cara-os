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
// 1,251 pairs across 205 pages (#926) then 67 more across components and the
// six files that pass deferred (#927). Nothing is excluded now.
//
// A label is a violation when it has no htmlFor, contains plain text (not a
// JSX expression), wraps no control of its own, and is immediately followed
// by a control that has no id. Two correct fixes, and which one depends on
// whether the markup can render more than once:
//   - Page body (renders once per route): a file-scoped literal id is fine.
//       <Label htmlFor="a1b2-visit-date">Visit Date *</Label>
//       <Input id="a1b2-visit-date" type="date" … />
//   - Anything reusable (a component, a card rendered per row): the id MUST
//     be instance-scoped, or one instance's label focuses another's field.
//       const uid = useId();
//       <Label htmlFor={`${uid}-visit-date`}>Visit Date *</Label>
//       <Input id={`${uid}-visit-date`} type="date" … />
//
// NOT a violation, and must not be "fixed": a real <label> element that
// WRAPS its own control is implicitly associated already (23 such sites in
// young-person-edit-dialog). Wrapping prose captions in <label> is also
// wrong — it announces read-only text as a form field.
const DEFERRED = new Set([]);
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
    } else if (/\.tsx$/.test(entry.name) && !/\.(test|spec)\.tsx$/.test(entry.name)) {
      yield full;
    }
  }
}

const violations = [];
for (const file of [...walk("src/app"), ...walk("src/components")]) {
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
    // Implicit association: a real <label> that opens before this and closes
    // after the control already names it — leave it alone.
    const back = text.slice(Math.max(0, m.index - 300), m.index);
    const open = back.lastIndexOf("<label");
    if (open !== -1) {
      const span = text.slice(Math.max(0, m.index - 300) + open, m.index + m[0].length + ctrl.index + 200);
      const close = span.indexOf("</label>");
      const cm = CONTROL.exec(span);
      if (cm && (close === -1 || close > cm.index)) continue;
    }
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
