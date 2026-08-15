#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Guard: a create form must submit what the user typed.
//
// accident-book's "Record Accident / Injury" dialog had thirteen fields and
// not one of them was bound. Save posted hardcoded blanks — person_name "",
// description "", injury_details "" — plus a severity "minor" and category
// "other" nobody had chosen, and then toasted "Accident record created".
// Staff recorded an accident, saw success, and the book held an empty entry
// asserting a severity. behaviour-support-plans did the same with
// child_id "yp_alex": every plan filed against one child regardless of who
// was selected.
//
// That is the fabricate-on-empty rule applied to a whole form: a record that
// asserts things nobody recorded, which then feeds every count, RIDDOR
// decision and compliance denominator downstream.
//
// The check: in a page that both renders a create Dialog and calls .mutate(),
// a mutate payload built from literal empty strings is a violation unless the
// payload also reads component state. Reading state is the evidence that the
// form reached the request at all.
//
// Not in scope: payloads made only of ids and enums (a status flip, an
// acknowledge, a sign-off) legitimately carry no typed text.
// ─────────────────────────────────────────────────────────────────────────────
const fs = require("node:fs");
const path = require("node:path");

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
  if (!text.includes("<Dialog") || !text.includes(".mutate(")) continue;
  const rel = file.split(path.sep).join("/");

  const re = /\.mutate\(\s*\{/g;
  let m;
  while ((m = re.exec(text))) {
    // Take the payload object by brace matching from the opening `{`.
    let i = m.index + m[0].length - 1;
    let depth = 0;
    let end = i;
    for (; end < text.length; end++) {
      if (text[end] === "{") depth++;
      else if (text[end] === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    const payload = text.slice(i, end + 1);
    const blanks = (payload.match(/:\s*""/g) || []).length;
    if (blanks < 3) continue;
    // Does any value read state, a form, or props rather than a literal?
    // Both idioms in this repo count: controlled state (`form.x`, `bsp.x`)
    // and uncontrolled FormData (`fd.get("x")` — annual-development-reviews
    // submits that way and is correctly wired).
    // Neutralise things that are NOT evidence of reading the form: clock
    // helpers, `new Date()`, and boolean/null literals. Replace them with a
    // digit — anything identifier-shaped would re-match the patterns below.
    const stateless = payload
      .replace(/\b(todayStr|generateId|now)\(/g, "0(")
      .replace(/new Date\(/g, "0(")
      .replace(/:\s*(true|false|null|undefined)\s*([,}])/g, ": 0$2");
    const readsState =
      /\.get\(/.test(payload) || // FormData (annual-development-reviews)
      /:\s*[A-Za-z_$][\w$]*\.[\w$]+/.test(stateless) || // form.x / bsp.x / draft.x
      /:\s*[A-Za-z_$][\w$]*\s*[,}]/.test(stateless); // a bare variable
    if (readsState) continue;
    const line = text.slice(0, m.index).split("\n").length;
    violations.push(
      `${rel}:${line}  create payload has ${blanks} empty-string literals and reads no form state — the dialog's fields are being discarded`
    );
  }
}

if (violations.length) {
  console.error(
    `check-wired-create-dialogs: ${violations.length} create form(s) discard what the user typed.\n` +
      `A dialog that posts hardcoded blanks and toasts success writes a record asserting\n` +
      `things nobody recorded. Bind the inputs to state and submit that state.\n`
  );
  for (const v of violations) console.error("  " + v);
  process.exit(1);
}
console.log("check-wired-create-dialogs: every create dialog submits the form it shows.");
