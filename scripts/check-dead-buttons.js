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

// Known-inert buttons. This list is a burn-down: delete a line when its
// button is wired, removed, or honestly disabled. Do not add to it.
// 56 → 43: 7 were false positives (an <a href> wrapper the first version
// could not see) and 6 were wired to PrintButton in the export batch.
// 43 → 31: the record/create batch. Eight got a real create or update
// (four workforce records, a safeguarding concern, a Reg 44 action and the
// two Reg 44 responses); two navigate to the page that actually stores the
// record (contact directory, admissions); two direct-work buttons open
// Cara's capture; and communications' New Draft is disabled with its reason
// on the page, because the table its service writes to does not exist.
// 31 → 19: the workflow-actions batch. Eight now write a real record (three
// task-shaped follow-ups on a learning review, three manager actions on the
// competence passport, two typed entries in the RI oversight log), two write
// through new fields on their own routes (attention-item oversight note), one
// navigates to the record the item points at, and one opens the risk-assessment
// register rather than filing a second copy of the same document.
// 19 → 4: the navigation/misc batch. What is LEFT is one group — the buttons
// that ask Cara to generate something, which cannot be honestly wired while
// the tenant's AI credits are exhausted. reg-45's "Auto-Link Evidence" belongs
// with them: its own panel says "Cara can automatically suggest evidence
// links". Those four keys cover five buttons, and they are Darren's call.
const BASELINE = new Set([
  "dashboard/manager-control-centre|Request Cara Draft",
  "quality/reg-45|Request Cara D",
  "quality/reg-45|Request Cara Draft",
  "quality/reg-45|Auto-Link Evidence",
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

/**
 * Is the <Button> at `index` wrapped by a parent that carries the action?
 *
 * Three wrappers count: <Link>, a Radix *Trigger, and a plain <a href>. Missing
 * the anchor cost the first baseline 7 false positives (#935).
 *
 * The tag is read with tagAt() rather than matched with `<Link[^>]*>`, because
 * `[^>]*` stops at the FIRST '>' — including the one inside an arrow function.
 * `<Link href={x} onClick={(e) => e.stop()}>` therefore looked unwrapped, and
 * the guard reported a working link as a dead button. Same `[^>]*` trap that
 * once broke the retrospective-date codemod; a JSX tag needs a real scanner.
 */
function isWrapped(text, index) {
  // Deliberately literal about `Link`: an ALIASED next/link import
  // (`import NextLink from "next/link"`) is invisible here and its button
  // reads as dead. That is the safe direction to be wrong — widening to
  // `\w*Link` would exempt SmartLinkBadge and SmartLinkPanel, which navigate
  // nowhere. Import next/link as `Link`, as every other page does.
  const OPENERS = /<(Link|a|\w*Trigger)\b/g;
  let last = null, o;
  OPENERS.lastIndex = 0;
  while ((o = OPENERS.exec(text)) && o.index < index) last = o;
  if (!last) return false;

  const wrapper = tagAt(text, last.index);
  if (wrapper.endsWith("/>")) return false; // self-closing wraps nothing
  const name = last[1];
  if (name === "a" && !/\bhref=/.test(wrapper)) return false;

  // Only whitespace (or a single {…} expression) may sit between the wrapper's
  // '>' and the button — anything else means the button is a later sibling,
  // not the wrapped child.
  const between = text.slice(last.index + wrapper.length, index);
  return /^\s*(\{[^}]*\}\s*)?$/s.test(between);
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

    if (isWrapped(text, m.index)) continue;

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
