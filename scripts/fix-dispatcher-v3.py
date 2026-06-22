#!/usr/bin/env python3
"""
Fix dispatcher.ts Turbopack/tsc parse errors — v3 (search-from-top pops).

Root cause of previous fixer failures:
  The `([...] as const).map(...)` pattern produces interleaved '[' and '('
  entries on the stack.  The old code used a strict-LIFO check
  (`open_stack[-1][0] == '['`) that silently skipped pops when the top entry
  was the wrong type, leaving accumulated entries that later triggered spurious
  ');' insertions deep inside function bodies.

Fix: search from the TOP of the stack for the nearest matching entry when
  popping, rather than only checking the immediate top.  This correctly handles
  interleaved '[' / '(' entries produced by the multi-line pattern.

Strategy:
  • Track open_stack: list of (kind, brace_depth_at_open, is_ternary) for
    every unclosed '[' or '('.
  • When a declaration line (DECL_RE) is encountered, close all open
    brackets/parens whose open-depth == current brace_depth.
  • Use search-from-top for pops so interleaved entries don't block closes.
  • Ternary true-branch brackets (line ends with `? [`) get `] : []` closure
    instead of `]` so the ternary expression stays syntactically valid.
  • Comment out genuine module-level `return` statements (SyntaxError in ESM).
"""

import re
import os

REPO   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = os.path.join(REPO, "src", "lib", "legacy-api", "dispatcher.ts")

# Declaration trigger: optional indent for keyword tokens; section separators
# must be at column-0 (to avoid matching embedded "// ── note ──" inside arrays).
DECL_RE = re.compile(
    r"^\s*(const |let |var |async function |function |export const |export async )|^// ─"
)

# Matches a line that ends with `? [` — the last bracket on the line is the
# true branch of a ternary expression, so closure needs `] : []` not just `]`.
TERNARY_BRACKET_RE = re.compile(r"\?\s*\[\s*$")

# Module-level export — must be at depth 0.  When the gen-script leaves unclosed
# function bodies, brace_depth can be > 0 here; we emit the missing `}` closers.
EXPORT_RE = re.compile(r"^export ")

# Matches a const/let/var declaration line, capturing the keyword prefix and name.
# Used to detect duplicate declarations that SWC rejects ("defined multiple times").
CONST_DECL_RE = re.compile(r"^(\s*(?:const|let|var)\s+)(\w+)")


def parse_line(raw: str):
    """Return (net_brace, net_bracket, net_paren) ignoring strings + // comments."""
    in_dq = in_sq = in_bt = False
    nb = nbrk = np = 0
    j = 0
    while j < len(raw):
        ch = raw[j]
        if in_dq:
            if ch == "\\":
                j += 2
                continue
            if ch == '"':
                in_dq = False
        elif in_sq:
            if ch == "\\":
                j += 2
                continue
            if ch == "'":
                in_sq = False
        elif in_bt:
            if ch == "\\":
                j += 2
                continue
            if ch == "`":
                in_bt = False
        else:
            if ch == '"':
                in_dq = True
            elif ch == "'":
                in_sq = True
            elif ch == "`":
                in_bt = True
            elif ch == "/" and j + 1 < len(raw) and raw[j + 1] == "/":
                break  # line comment — stop
            elif ch == "[":
                nbrk += 1
            elif ch == "]":
                nbrk -= 1
            elif ch == "{":
                nb += 1
            elif ch == "}":
                nb -= 1
            elif ch == "(":
                np += 1
            elif ch == ")":
                np -= 1
        j += 1
    return nb, nbrk, np


def has_module_level_return(raw: str) -> bool:
    """True if the line contains `return` outside strings/comments."""
    in_dq = in_sq = in_bt = False
    j = 0
    while j < len(raw):
        ch = raw[j]
        if in_dq:
            if ch == "\\":
                j += 2
                continue
            if ch == '"':
                in_dq = False
        elif in_sq:
            if ch == "\\":
                j += 2
                continue
            if ch == "'":
                in_sq = False
        elif in_bt:
            if ch == "\\":
                j += 2
                continue
            if ch == "`":
                in_bt = False
        else:
            if ch == '"':
                in_dq = True
            elif ch == "'":
                in_sq = True
            elif ch == "`":
                in_bt = True
            elif ch == "/" and j + 1 < len(raw) and raw[j + 1] == "/":
                break
            elif raw[j : j + 7] in ("return ", "return\n", "return;"):
                return True
        j += 1
    return False


def pop_nearest(stack, kind: str) -> bool:
    """Remove the nearest entry of `kind` searching from the top.  Returns True if found."""
    for i in range(len(stack) - 1, -1, -1):
        if stack[i][0] == kind:
            del stack[i]
            return True
    return False


def build_closure(entries) -> str:
    """Build the closing token string for a list of stack entries.

    Stack entries are (kind, brace_depth, is_ternary).
    Ternary-bracket entries (is_ternary=True) get `] : []` so the ternary
    expression is complete; plain bracket entries get `]`; paren entries get `)`.
    """
    plain_brackets  = sum(1 for e in entries if e[0] == "[" and not e[2])
    ternary_brackets = sum(1 for e in entries if e[0] == "[" and e[2])
    parens          = sum(1 for e in entries if e[0] == "(")

    parts = "]" * plain_brackets
    for _ in range(ternary_brackets):
        parts += "] : []"
    parts += ")" * parens + ";\n"
    return parts


def fix(path: str):
    with open(path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    out: list = []
    brace_depth = 0

    # Stack entries: (kind, brace_depth_at_open, is_ternary)
    # kind ∈ {'[', '('}; is_ternary=True when bracket opens a ternary true branch.
    open_stack: list = []

    array_fixes = 0
    return_fixes = 0
    brace_fixes = 0
    dup_fixes   = 0

    # Track declared identifier names per brace_depth to detect duplicates.
    # Maps brace_depth → {name: count_of_declarations}.
    # Cleared for a depth when brace_depth decreases past that depth.
    scope_names: dict = {}

    for line in lines:
        nb, nbrk, np = parse_line(line)

        # ── 0. Close unclosed function bodies before a module-level export ──
        # The gen-script left 4 function bodies without closing `}`, causing
        # brace_depth > 0 when `export const LEGACY_HANDLERS` is reached.
        # Turbopack rejects `export` inside a block scope.
        if brace_depth > 0 and EXPORT_RE.match(line):
            out.append("}" * brace_depth + "\n")
            brace_depth = 0
            brace_fixes += 1

        # ── 1. Close open brackets/parens before a new declaration ─────────
        if open_stack and DECL_RE.match(line):
            to_close = [e for e in open_stack if e[1] == brace_depth]
            if to_close:
                out.append(build_closure(to_close))
                open_stack = [e for e in open_stack if e[1] != brace_depth]
                array_fixes += 1

        # ── 2. Comment out module-level `return` ────────────────────────────
        if brace_depth == 0 and has_module_level_return(line):
            out.append("// [gen-fix-return] " + line)
            return_fixes += 1
            # Still update depths (the line is treated as a comment going forward)
            brace_depth = max(0, brace_depth + nb)
            is_ternary_line = bool(TERNARY_BRACKET_RE.search(line.rstrip()))
            if nbrk > 0:
                for i in range(nbrk):
                    t = is_ternary_line and (i == nbrk - 1)
                    open_stack.append(("[", brace_depth, t))
            elif nbrk < 0:
                for _ in range(-nbrk):
                    pop_nearest(open_stack, "[")
            if np > 0:
                for _ in range(np):
                    open_stack.append(("(", brace_depth, False))
            elif np < 0:
                for _ in range(-np):
                    pop_nearest(open_stack, "(")
            continue

        # ── 2.5. Rename duplicate const/let/var declarations ────────────────
        # SWC (Turbopack) rejects the same identifier being declared twice in
        # the same scope.  The gen-script emits duplicates in two cases:
        #   • Literal adjacent duplicates (same line twice in a row).
        #   • Unclosed inner blocks: a declaration inside an if-block appears at
        #     the same tracked brace_depth as the outer function-scope declaration.
        # Renaming the 2nd+ occurrence to `name_dup{n}` keeps the file parseable
        # without removing multi-line object/array bodies.
        m_decl = CONST_DECL_RE.match(line)
        if m_decl:
            name = m_decl.group(2)
            depth_dict = scope_names.setdefault(brace_depth, {})
            count = depth_dict.get(name, 0)
            if count > 0:
                new_name = f"{name}_dup{count}"
                line = m_decl.group(1) + new_name + line[m_decl.end():]
                dup_fixes += 1
            depth_dict[name] = count + 1

        # ── 3. Update open_stack using search-from-top pops ─────────────────
        is_ternary_line = bool(TERNARY_BRACKET_RE.search(line.rstrip()))

        if nbrk > 0:
            for i in range(nbrk):
                # Only the LAST bracket opened on a ternary line is the true branch.
                t = is_ternary_line and (i == nbrk - 1)
                open_stack.append(("[", brace_depth, t))
        elif nbrk < 0:
            for _ in range(-nbrk):
                pop_nearest(open_stack, "[")

        if np > 0:
            for _ in range(np):
                open_stack.append(("(", brace_depth, False))
        elif np < 0:
            for _ in range(-np):
                pop_nearest(open_stack, "(")

        prev_brace_depth = brace_depth
        brace_depth = max(0, brace_depth + nb)
        # Clear scope names for depths we just exited so sibling scopes don't conflict.
        if brace_depth < prev_brace_depth:
            for d in range(brace_depth + 1, prev_brace_depth + 1):
                scope_names.pop(d, None)

        out.append(line)

    # ── 4. Close any remaining open brackets/parens at EOF ──────────────────
    if open_stack:
        out.append(build_closure(open_stack))
        array_fixes += 1

    with open(path, "w", encoding="utf-8") as f:
        f.writelines(out)

    print(f"Bracket/paren closures inserted: {array_fixes}")
    print(f"Brace closures inserted:         {brace_fixes}")
    print(f"Duplicate declarations renamed:  {dup_fixes}")
    print(f"Module-level returns commented:  {return_fixes}")
    print(f"Lines in fixed file:             {len(out)}")


if __name__ == "__main__":
    fix(TARGET)
    print("Done.")
