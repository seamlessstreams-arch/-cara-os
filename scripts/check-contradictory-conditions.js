#!/usr/bin/env node
/*
 * check-contradictory-conditions.js — a condition that cannot hold.
 *
 * `x === "a" && x === "b"` can never hold, so the filter it guards never
 * matches. tsc cannot see it: both literals are valid members of the union.
 * The mirror, `x !== "a" || x !== "b"`, is always TRUE — the guard never bites.
 *
 * This is the #981 always-false family, which has cost this codebase real
 * numbers before, in the one shape a type-checker cannot reach.
 *
 * No violations today, so there is no baseline — any hit is new.
 */
const ts = require("../node_modules/typescript6");
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!/__tests__|node_modules/.test(e.name)) walk(p); }
    else if (/\.tsx?$/.test(e.name) && !/\.(test|spec)\./.test(e.name)) files.push(p);
  }
})(path.join(ROOT, "src"));

const lit = (n) =>
  ts.isStringLiteral(n) ? JSON.stringify(n.text)
  : ts.isNumericLiteral(n) ? n.text
  : n.kind === ts.SyntaxKind.TrueKeyword ? "true"
  : n.kind === ts.SyntaxKind.FalseKeyword ? "false"
  : n.kind === ts.SyntaxKind.NullKeyword ? "null"
  : null;

// one side of an equality against a literal -> { subject, value, eq }
function eqTest(n) {
  if (!ts.isBinaryExpression(n)) return null;
  const k = n.operatorToken.kind;
  const EQ = [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken];
  const NE = [ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken];
  if (![...EQ, ...NE].includes(k)) return null;
  const l = lit(n.right), r = lit(n.left);
  if (l !== null) return { subject: n.left.getText(), value: l, eq: EQ.includes(k) };
  if (r !== null) return { subject: n.right.getText(), value: r, eq: EQ.includes(k) };
  return null;
}

function flatten(n, op, out = []) {
  if (ts.isBinaryExpression(n) && n.operatorToken.kind === op) {
    flatten(n.left, op, out); flatten(n.right, op, out);
  } else out.push(n);
  return out;
}

const findings = [];
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  if (!/&&|\|\|/.test(src)) continue;
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, /\.tsx$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

  ts.forEachChild(sf, function visit(node) {
    if (ts.isBinaryExpression(node)) {
      const AND = ts.SyntaxKind.AmpersandAmpersandToken, OR = ts.SyntaxKind.BarBarToken;
      const op = node.operatorToken.kind;
      if (op === AND || op === OR) {
        const parts = flatten(node, op).map(eqTest).filter(Boolean);
        const bySubject = {};
        for (const p of parts) (bySubject[p.subject] ??= []).push(p);
        for (const [subject, tests] of Object.entries(bySubject)) {
          // AND of two different === on one subject  -> never true
          // OR  of two different !== on one subject  -> never false
          const same = op === AND ? tests.filter((t) => t.eq) : tests.filter((t) => !t.eq);
          const values = [...new Set(same.map((t) => t.value))];
          if (same.length >= 2 && values.length >= 2) {
            const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
            findings.push(
              `${path.relative(ROOT, file)}:${line + 1}  ${subject} ${op === AND ? "&&-chain never true" : "||-chain never false"}: ${values.join(" , ")}`,
            );
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  });
}
// Non-vacuity: a walk that saw almost nothing must not read as a clean tree.
if (files.length < 2000) {
  console.error(`check-contradictory-conditions: only ${files.length} files scanned — the walk is broken, not the code clean.`);
  process.exit(1);
}

const unique = [...new Set(findings)];
if (unique.length) {
  console.error(
    `\ncheck-contradictory-conditions: ${unique.length} condition(s) can never do anything.\n` +
      `An &&-chain comparing one value to two different literals is never true — the filter\n` +
      `it guards returns nothing. The ||-chain mirror is never false — the guard never bites.\n` +
      `tsc cannot see either: both literals are valid members of the union.\n`,
  );
  for (const f of unique) console.error("  " + f);
  process.exit(1);
}

console.log(`check-contradictory-conditions: no condition contradicts itself across ${files.length} files ✓`);
