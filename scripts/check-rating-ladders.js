#!/usr/bin/env node
/*
 * check-rating-ladders.js — a rating band must be reachable.
 *
 * The class this guards: `score >= 60 ? "good" : score >= 80 ? "outstanding"`.
 * Nothing scoring 80 ever reaches the second branch, because 80 already
 * satisfied the first. The ladder compiles, lints, and renders — it simply can
 * never award its own top band, and the surface it feeds is the one an
 * inspector reads.
 *
 * Only a chain walked through the FALSE branch is one ladder. Textual
 * proximity is not enough: two correct ladders written next to each other
 * (a colour ternary beside a label ternary) read as one broken one, which is
 * exactly what a regex version of this reported before it was thrown away.
 *
 * There are no violations today, so there is no baseline — any hit is new.
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

const findings = [];
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  if (!src.includes("?")) continue;
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, /\.tsx$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

  const cmp = (n) => {
    if (!ts.isBinaryExpression(n)) return null;
    const op = n.operatorToken.kind;
    const GE = ts.SyntaxKind.GreaterThanEqualsToken, GT = ts.SyntaxKind.GreaterThanToken;
    const LE = ts.SyntaxKind.LessThanEqualsToken, LT = ts.SyntaxKind.LessThanToken;
    if (![GE, GT, LE, LT].includes(op)) return null;
    if (!ts.isNumericLiteral(n.right)) return null;
    return { subject: n.left.getText(), dir: (op === GE || op === GT) ? "desc" : "asc", value: Number(n.right.text) };
  };

  ts.forEachChild(sf, function visit(node) {
    if (ts.isConditionalExpression(node)) {
      const chain = [];
      let cur = node;
      while (cur && ts.isConditionalExpression(cur)) {
        const c = cmp(cur.condition);
        if (!c) break;
        if (chain.length && (chain[0].subject !== c.subject || chain[0].dir !== c.dir)) break;
        chain.push(c);
        cur = cur.whenFalse;   // the ladder continues in the FALSE branch only
      }
      if (chain.length >= 2) {
        const vs = chain.map((c) => c.value);
        const ordered = chain[0].dir === "desc"
          ? vs.every((v, i) => i === 0 || vs[i - 1] > v)
          : vs.every((v, i) => i === 0 || vs[i - 1] < v);
        if (!ordered) {
          const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
          findings.push(`${path.relative(ROOT, file)}:${line + 1}  ${chain[0].subject} ${chain[0].dir} ladder ${JSON.stringify(vs)}`);
        }
      }
    }
    ts.forEachChild(node, visit);
  });
}
// Non-vacuity: a walk that saw almost nothing must not read as a clean tree.
if (files.length < 2000) {
  console.error(`check-rating-ladders: only ${files.length} files scanned — the walk is broken, not the code clean.`);
  process.exit(1);
}

if (findings.length) {
  console.error(
    `\ncheck-rating-ladders: ${findings.length} rating ladder(s) have an unreachable band.\n` +
      `A threshold that is not strictly ordered means a later branch can never be taken —\n` +
      `the band exists in the code and cannot be awarded.\n`,
  );
  for (const f of findings) console.error("  " + f);
  process.exit(1);
}

console.log(`check-rating-ladders: every rating ladder is strictly ordered across ${files.length} files ✓`);
