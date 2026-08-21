#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Guard: `${...}` written inside a plain string literal is never interpolated.
//
// Backticks interpolate; quotes do not. Swap one for the other and the code
// still compiles, still lints, still renders — it just shows the source through
// to whoever is reading. Two independent instances were live before this guard:
//
//   an engine recommendation shown to a manager
//     "Extend savings account coverage beyond ${savingsAccountCoverage}% — …"
//
//   a prompt sent to the AI, where the fallback inside a template literal was
//     itself double-quoted
//     `… Additional context: ${context || "… context. ${homeName}."}`
//
// Neither raised anything. tsc sees a valid string; eslint sees a valid string.
// The only signal was that the interpolated variable then read as unused, which
// is how both were found — by a lint burn-down, not by anything watching output.
//
// ── Why a lexer and not a regex, and not the TypeScript AST ──────────────────
// The same characters inside a template literal interpolate correctly, so the
// question is purely "which kind of quote encloses this?". A line regex cannot
// answer it: a first pass reported 2,513 sites, of which 5 were real, because
// `'${role}'` inside a backticked string looks identical to a quoted one.
//
// The TypeScript AST answers it exactly — but the Repo guards CI job checks out
// and runs plain `node` with NO npm install, so every guard here must be
// dependency-free. Hence the small scanner below, which tracks exactly the
// states that matter: comments, the three quote kinds, and `${}` nesting inside
// templates (a template can contain an expression that contains a template).
//
// Scope: production source only. Tests are excluded by design — a string
// containing "${" there is almost always a fixture of sample source code or an
// assertion about this very bug class, and allowlisting each would be noise.
//
// There is no baseline. Production code should never contain one of these, so a
// new one fails the build.
// ─────────────────────────────────────────────────────────────────────────────
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const isTest = (p) => /__tests__|\.test\.tsx?$|\.spec\.tsx?$/.test(p);

function sourceFiles(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) sourceFiles(p, out);
    else if (/\.tsx?$/.test(e.name) && !isTest(p)) out.push(p);
  }
  return out;
}

/**
 * Report every `${` that appears inside a single- or double-quoted string.
 *
 * `stack` tracks template nesting: entering a template pushes it, entering its
 * `${` pushes an expression frame, and inside that frame quotes behave like
 * ordinary code again — which is precisely the guidance-page case, where a
 * quoted fallback sat inside a template's expression.
 */
function scan(text) {
  const hits = [];
  const stack = []; // "template" | "expr"
  let i = 0;
  let line = 1;

  while (i < text.length) {
    const c = text[i];
    const next = text[i + 1];

    if (c === "\n") { line++; i++; continue; }

    // comments
    if (c === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && next === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) {
        if (text[i] === "\n") line++;
        i++;
      }
      i += 2;
      continue;
    }

    // quoted string — the thing we are actually looking for
    if (c === '"' || c === "'") {
      const quote = c;
      const startLine = line;
      let body = "";
      let found = false;
      i++;
      while (i < text.length) {
        if (text[i] === "\\") { body += text[i + 1] ?? ""; i += 2; continue; }
        if (text[i] === quote) { i++; break; }
        if (text[i] === "\n") { line++; i++; break; } // unterminated; bail safely
        if (text[i] === "$" && text[i + 1] === "{") found = true;
        body += text[i];
        i++;
      }
      if (found) hits.push({ line: startLine, text: body });
      continue;
    }

    // template literal
    if (c === "`") {
      stack.push("template");
      i++;
      while (i < text.length) {
        if (text[i] === "\\") { i += 2; continue; }
        if (text[i] === "\n") { line++; i++; continue; }
        if (text[i] === "`") { stack.pop(); i++; break; }
        if (text[i] === "$" && text[i + 1] === "{") {
          stack.push("expr");
          i += 2;
          break; // hand control back to the main loop: this is ordinary code
        }
        i++;
      }
      continue;
    }

    // closing a template's expression frame returns us to the template body
    if (c === "}" && stack[stack.length - 1] === "expr") {
      stack.pop();
      i++;
      // resume scanning the enclosing template's literal part
      while (i < text.length) {
        if (text[i] === "\\") { i += 2; continue; }
        if (text[i] === "\n") { line++; i++; continue; }
        if (text[i] === "`") { stack.pop(); i++; break; }
        if (text[i] === "$" && text[i + 1] === "{") { stack.push("expr"); i += 2; break; }
        i++;
      }
      continue;
    }

    i++;
  }
  return hits;
}

const findings = [];
for (const file of sourceFiles(SRC)) {
  const text = fs.readFileSync(file, "utf8");
  if (!text.includes("${")) continue; // cheap pre-filter; the scanner decides
  for (const h of scan(text)) {
    findings.push({
      file: path.relative(ROOT, file),
      line: h.line,
      text: h.text.length > 120 ? `${h.text.slice(0, 120)}…` : h.text,
    });
  }
}

if (findings.length > 0) {
  console.error(
    `\ncheck-literal-interpolation: ${findings.length} string literal(s) contain an ` +
      "un-interpolated ${…}.\nThe characters reach the reader verbatim. Use backticks:\n",
  );
  for (const f of findings) {
    console.error(`  ✗ ${f.file}:${f.line}`);
    console.error(`      ${f.text}`);
  }
  console.error(
    "\nIf the literal text is genuinely wanted (documenting the syntax itself), " +
      "escape the dollar as \\${…}, or move it into a test — this guard does not scan tests.\n",
  );
  process.exit(1);
}

console.log(
  "check-literal-interpolation: no un-interpolated ${…} in production strings ✓",
);
