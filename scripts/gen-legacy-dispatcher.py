#!/usr/bin/env python3
"""
Generate src/lib/legacy-api/dispatcher.ts + src/app/api/[...segments]/route.ts
from the 252 top-level flat API route files.

Strategy:
  - Extract imports (dedup by exact string)
  - Extract module-level const/let/var/function declarations (NON-export, NON-import)
    and prefix them with slug_safe name to avoid conflicts
  - Replace all references to original names in GET/POST bodies with prefixed names
  - Combine into one dispatcher file

Usage:
  python3 scripts/gen-legacy-dispatcher.py
"""

import os
import re
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROUTES_FILE = "/tmp/legacy_routes.txt"
OUT_DISPATCHER = os.path.join(REPO_ROOT, "src", "lib", "legacy-api", "dispatcher.ts")
OUT_CATCHALL   = os.path.join(REPO_ROOT, "src", "app", "api", "[...segments]", "route.ts")

def read_route_files():
    with open(ROUTES_FILE) as f:
        return [p.strip() for p in f if p.strip()]

def slug_for_path(path):
    return path.replace("src/app/api/", "").replace("/route.ts", "")

def safe_name(slug):
    return re.sub(r"[^a-zA-Z0-9]", "_", slug)

# ── Extraction helpers ────────────────────────────────────────────────────────

def extract_imports(content):
    """Return full import STATEMENTS (single- or multi-line), excluding next/server.

    A multi-line import —
        import {
          analyzeCohort,
          evaluateChildProgress,
        } from "@/lib/children-outcomes";
    — has no `from` on its first line, so the old single-line scan silently
    DROPPED it, leaving those names undefined at runtime (the reference lives
    inside a handler body, so the build never catches it — only a 500 at
    request time does).  Collect every line of the statement up to and
    including the line carrying ` from `.
    """
    result = []
    lines = content.split("\n")
    # The statement ends on the line carrying the module specifier `from "…"`.
    # Match THAT (not a bare " from ", which can appear in a comment or name
    # inside the brace list and would truncate the statement, leaving `{` open).
    from_re = re.compile(r'\bfrom\s+["\']')
    i, n = 0, len(lines)
    while i < n:
        s = lines[i].strip()
        if s.startswith("import "):
            stmt = [lines[i]]
            while not from_re.search(lines[i]) and i + 1 < n:
                i += 1
                stmt.append(lines[i])
            full = "\n".join(stmt)
            if "next/server" not in full:
                result.append(full)
        i += 1
    return result


def alias_for(name, module):
    """Deterministic per-module alias for a colliding value import.

    The same identifier is exported (with different implementations) from
    several modules — e.g. `generateLeavingCareIntelligence` from both the
    barrel `@/lib/leaving-care` and the engine `@/lib/leaving-care/…-engine`.
    In separate route files that's fine; concatenated into one dispatcher it's
    a single binding, so whichever import wins, every other route calls the
    WRONG function (→ `e.filter is not a function`).  Alias each colliding name
    by its module so all versions coexist, and rewrite each route's body to the
    alias matching ITS import.
    """
    return f"{name}__{re.sub(r'[^A-Za-z0-9]', '_', module)}"


def parse_value_imports(statements):
    """Return {bound_name: module} for VALUE (non-type) named imports."""
    out = {}
    mod_re = re.compile(r'from\s+["\']([^"\']+)["\']')
    for stmt in statements:
        flat = " ".join(re.sub(r'//.*', '', p) for p in stmt.split("\n"))
        if re.match(r'\s*import\s+type\b', flat):
            continue
        m = mod_re.search(flat)
        br = re.search(r'\{([^}]*)\}', flat)
        if not (m and br):
            continue
        module = m.group(1)
        for raw in br.group(1).split(","):
            nm = raw.strip()
            if nm:
                bound = nm.split(" as ")[-1].strip()
                out[bound] = module
    return out


def consolidate_imports(statements, collisions=frozenset()):
    """Merge imports per (module, type-or-value) so no name is bound twice.

    Many routes import overlapping names from the same shared lib module; emitting
    each statement verbatim would produce duplicate bindings (`import { X } …;
    import { X, Y } …;`) — a SyntaxError.  Group named imports by module + kind
    (`import {…}` vs `import type {…}`), union the names, and re-emit one line each.
    Default / namespace / side-effect imports are passed through, de-duped by text.
    """
    # module -> {"value": set(names), "type": set(names)}
    named = {}
    passthrough = []
    seen_pass = set()
    mod_re = re.compile(r'from\s+["\']([^"\']+)["\']')

    def strip_line_comment(s):
        # Drop a // comment (outside quotes).  A multi-line import can carry a
        # `// NB: …` note after `import {`; flattening to one line would
        # otherwise comment out the rest of the statement (closing } + from).
        out, j, q = [], 0, None
        while j < len(s):
            c = s[j]
            if q:
                out.append(c)
                if c == q:
                    q = None
            elif c in "\"'`":
                q = c
                out.append(c)
            elif c == "/" and j + 1 < len(s) and s[j + 1] == "/":
                break
            else:
                out.append(c)
            j += 1
        return "".join(out)

    for stmt in statements:
        flat = " ".join(strip_line_comment(part).strip() for part in stmt.split("\n"))
        m = mod_re.search(flat)
        module = m.group(1) if m else None
        brace = re.search(r'\{([^}]*)\}', flat)
        if module and brace:
            is_type = bool(re.match(r'import\s+type\b', flat))
            kind = "type" if is_type else "value"
            slot = named.setdefault(module, {"value": set(), "type": set()})
            for raw in brace.group(1).split(","):
                name = raw.strip()
                if name:
                    slot[kind].add(name)
            # A mixed `import Default, { … }` keeps its default via passthrough below.
            head = flat[: brace.start()]
            if re.search(r'import\s+(?:type\s+)?\w+\s*,', head):
                # default + named — emit the default separately
                dm = re.match(r'import\s+(?:type\s+)?(\w+)\s*,', head)
                if dm and module:
                    line = f'import {dm.group(1)} from "{module}";'
                    if line not in seen_pass:
                        seen_pass.add(line)
                        passthrough.append(line)
        else:
            # default-only, namespace, or side-effect import — pass through verbatim
            line = flat.rstrip(";") + ";"
            if line not in seen_pass:
                seen_pass.add(line)
                passthrough.append(line)

    # Emit with GLOBAL name de-dup so no identifier is ever bound twice
    # (which is a SyntaxError).  De-dup key is the BOUND name — for `X as Y`
    # that is `Y`.  Value imports are emitted first so they win the name over a
    # same-named type import (values are needed at runtime; types are erased).
    def bound_name(spec):
        return spec.split(" as ")[-1].strip()

    out = list(passthrough)
    emitted = set()
    for line in passthrough:
        m = re.match(r'import\s+(\w+)\s', line)
        if m:
            emitted.add(m.group(1))

    for kind, type_kw in (("value", ""), ("type", "type ")):
        for module in sorted(named):
            names = []
            for spec in sorted(named[module][kind]):
                bn = bound_name(spec)
                if kind == "value" and bn in collisions:
                    # Colliding value name → import under a per-module alias so
                    # all module versions coexist (route bodies are rewritten to
                    # the matching alias via name_map).
                    alias = alias_for(bn, module)
                    if alias in emitted:
                        continue
                    emitted.add(alias)
                    orig = spec.split(" as ")[0].strip()
                    names.append(f"{orig} as {alias}")
                else:
                    if bn in emitted:
                        continue
                    emitted.add(bn)
                    names.append(spec)
            if names:
                out.append(f'import {type_kw}{{ {", ".join(names)} }} from "{module}";')
    return out

def _find_block_end(content, open_pos):
    """Find the closing } for the { at open_pos."""
    depth = 0
    i = open_pos
    while i < len(content):
        if content[i] == '{':
            depth += 1
        elif content[i] == '}':
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return len(content) - 1

def extract_module_consts(content, safe_prefix, seed_name_map=None):
    """
    Find all module-level non-export, non-import statements (const/let/function/type).
    Returns (blocks, name_map) where blocks is a list of prefixed declarations,
    and name_map maps original name → prefixed name.

    seed_name_map seeds name_map with per-route import aliases (colliding value
    imports) so the second pass rewrites BOTH const blocks and (via the returned
    map) function bodies to the right per-module alias.
    """
    lines = content.split("\n")
    name_map = dict(seed_name_map) if seed_name_map else {}
    blocks = []

    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Skip import lines
        if stripped.startswith("import "):
            i += 1
            continue
        # Skip export function/async function/class (we handle separately)
        if re.match(r'export\s+(async\s+)?function\b', stripped):
            # Skip entire function block
            # Find opening {
            j = i
            while j < len(lines) and '{' not in lines[j]:
                j += 1
            if j < len(lines):
                # Find block start
                full_so_far = "\n".join(lines[:j+1])
                brace_pos = len("\n".join(lines[:j])) + lines[j].index('{')
                end = _find_block_end("\n".join(lines), brace_pos)
                # Count lines up to end
                content_so_far = "\n".join(lines)
                end_line = content_so_far[:end].count('\n')
                i = end_line + 1
            else:
                i += 1
            continue

        # Skip export const (top-level exports we don't need)
        if re.match(r'export\s+(const|let|var)\b', stripped):
            # Skip this line and possible continuation
            while i < len(lines) and not lines[i].rstrip().endswith(';') and '{' not in lines[i] and '[' not in lines[i]:
                i += 1
            i += 1
            continue

        # Match: const/let/var NAME = ...  /  [async] function NAME(
        # NOTE: `async function` MUST be matched here too — a non-exported async
        # helper (e.g. `async function handleLiveData(sb, …)`) must be collected
        # as a whole block.  Previously only sync `function` matched, so async
        # helpers fell through and their bodies were shredded into module-level
        # statements (orphaned `let query = sb.from(…)` etc.).
        m_const = re.match(r'^(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\b', stripped)
        m_func  = re.match(r'^(?:async\s+)?function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(', stripped)
        m = m_const or m_func

        if m:
            orig_name = m.group(1)

            prefixed = f"{safe_prefix}_{orig_name}"
            name_map[orig_name] = prefixed

            # Collect the whole declaration (may span multiple lines / have nested {})
            j = i
            decl_lines = []
            is_func = m_func is not None

            if is_func:
                # Functions: a signature can span multiple lines AND contain { } / [ ]
                # in parameter types or destructuring (e.g.
                #   function rec(
                #     overrides: Partial<T> & { id: string; … },
                #   ): T { … }
                # ).  So walk the PARAM PARENS to the end of the signature first,
                # then track BODY BRACES.  This prevents param-type braces from
                # being mistaken for the body's closing brace (which truncated the
                # function and orphaned everything after it).
                paren_depth = 0
                seen_paren = False
                sig_done = False
                brace_depth = 0
                seen_body_brace = False
                while j < len(lines):
                    dl = lines[j]
                    decl_lines.append(dl)
                    if not sig_done:
                        paren_depth += dl.count('(') - dl.count(')')
                        if '(' in dl:
                            seen_paren = True
                        if seen_paren and paren_depth <= 0:
                            sig_done = True  # body brace may follow on this line
                    if sig_done:
                        brace_depth += dl.count('{') - dl.count('}')
                        if '{' in dl:
                            seen_body_brace = True
                        if seen_body_brace and brace_depth <= 0:
                            j += 1
                            break
                    j += 1
                i = j
            else:
                # const/let/var.  Brace/bracket depths ACCUMULATE across lines
                # (per-line reset was the bug that cut multi-line array literals
                # short, orphaning their tail elements).
                brace_depth = 0
                sq_depth = 0
                seen_open = False
                in_decl = True
                while j < len(lines) and in_decl:
                    dl = lines[j]
                    decl_lines.append(dl)
                    brace_depth += dl.count('{') - dl.count('}')
                    sq_depth   += dl.count('[') - dl.count(']')
                    if '{' in dl or '[' in dl:
                        seen_open = True

                    if seen_open:
                        # object/array initialiser (possibly multi-line): end when
                        # every brace AND bracket has closed.  No `j > i` guard:
                        # a genuine multi-line literal always has an unbalanced
                        # FIRST line (its opening `{`/`[`), so it can't terminate
                        # early — whereas a single-line `const X = [...];` IS
                        # balanced on line one and must end there, not swallow the
                        # next declaration (the bug that left `const CHILD_NAMES`
                        # unprefixed → duplicate-identifier crashes).
                        if brace_depth <= 0 and sq_depth <= 0:
                            in_decl = False
                    else:
                        # simple one-liner: end at ';' (or a non-continuation line)
                        if dl.rstrip().endswith(';') or (j > i and not dl.rstrip().endswith(',')):
                            in_decl = False
                    j += 1
                i = j
            # Replace const/let/var/function NAME with prefixed
            decl_text = "\n".join(decl_lines)
            decl_text = re.sub(
                r'\b' + re.escape(orig_name) + r'\b',
                prefixed,
                decl_text,
                count=1  # only the first occurrence (the declaration)
            )
            blocks.append(decl_text)
            continue

        i += 1

    # Second pass: apply name_map to EVERY block so const-to-const references
    # (e.g. `const history = [...ALEX_ATTENDANCE]`) pick up the same prefix as
    # their declaration.  The first pass only renamed each block's own
    # declaration name, leaving cross-references unprefixed → "X is not defined".
    # `\b` boundaries + underscore-joined prefixes mean a block's own (already
    # prefixed) name is never double-prefixed.
    remapped = []
    for block in blocks:
        for orig, prefixed in name_map.items():
            block = re.sub(r'\b' + re.escape(orig) + r'\b', prefixed, block)
        remapped.append(block)

    return remapped, name_map

def extract_function(content, fname, safe_prefix, name_map):
    """Extract body of function named fname (GET/POST), apply name_map renames."""
    m = re.search(rf'export\s+async\s+function\s+{fname}\s*\(([^)]*)\)\s*\{{', content)
    if not m:
        return None, None
    params = m.group(1).strip()
    open_brace = m.end() - 1
    close_brace = _find_block_end(content, open_brace)
    body = content[open_brace+1:close_brace]

    # Apply name_map: replace original const names with prefixed ones
    for orig, prefixed in name_map.items():
        body = re.sub(r'\b' + re.escape(orig) + r'\b', prefixed, body)

    # Extract original req param name
    req_param = "req"
    if params:
        pm = re.match(r'(_?\w+)\s*(?::\s*[\w<>, ]+)?', params)
        if pm:
            req_param = pm.group(1)

    return body.rstrip(), req_param

def main():
    route_paths = read_route_files()

    all_imports_set = []  # ordered, deduplicated
    seen_imports = set()

    # ── Pre-pass: detect value-import name collisions across all routes ──────
    # A bound name imported from >1 module collides when the routes are merged
    # into one file; those get per-module aliases so every route calls the
    # version IT imported.
    name_modules = {}
    contents = {}
    for rp in route_paths:
        try:
            with open(os.path.join(REPO_ROOT, rp), 'r') as f:
                contents[rp] = f.read()
        except FileNotFoundError:
            continue
        for bound, module in parse_value_imports(extract_imports(contents[rp])).items():
            name_modules.setdefault(bound, set()).add(module)
    collisions = frozenset(n for n, mods in name_modules.items() if len(mods) > 1)
    print(f"Value-import name collisions aliased: {len(collisions)}")

    route_data = []
    for rp in route_paths:
        full_path = os.path.join(REPO_ROOT, rp)
        slug = slug_for_path(rp)
        name = safe_name(slug)

        content = contents.get(rp)
        if content is None:
            print(f"WARNING: not found: {full_path}", file=sys.stderr)
            continue

        # Imports
        imports = extract_imports(content)
        for imp in imports:
            if imp not in seen_imports:
                seen_imports.add(imp)
                all_imports_set.append(imp)

        # Per-route aliases for colliding value imports (rewrite body to the
        # alias matching THIS route's module).
        import_aliases = {
            bound: alias_for(bound, module)
            for bound, module in parse_value_imports(imports).items()
            if bound in collisions
        }

        # Module-level constants
        const_blocks, name_map = extract_module_consts(content, name, seed_name_map=import_aliases)

        # GET and POST
        get_body, get_req = extract_function(content, "GET", name, name_map)
        post_body, post_req = extract_function(content, "POST", name, name_map)

        if get_body is None and post_body is None:
            print(f"WARNING: no GET or POST in {slug}", file=sys.stderr)
            continue

        route_data.append({
            "slug": slug,
            "name": name,
            "const_blocks": const_blocks,
            "get_body": get_body,
            "get_req": get_req,
            "post_body": post_body,
            "post_req": post_req,
            "file": full_path,
        })

    print(f"Parsed {len(route_data)} routes")

    # ── Write dispatcher ──────────────────────────────────────────────────────
    os.makedirs(os.path.dirname(OUT_DISPATCHER), exist_ok=True)
    with open(OUT_DISPATCHER, 'w') as f:
        f.write("// AUTO-GENERATED — see scripts/gen-legacy-dispatcher.py\n")
        f.write("// DO NOT EDIT MANUALLY. Re-run the script to regenerate.\n\n")
        f.write("/* eslint-disable */\n")
        f.write("// @ts-nocheck\n\n")
        f.write('import { NextRequest, NextResponse } from "next/server";\n\n')

        for imp in consolidate_imports(all_imports_set, collisions):
            f.write(imp + "\n")
        f.write("\n")

        f.write("type LegacyHandler = {\n")
        f.write("  GET?: (req: NextRequest) => Promise<Response>;\n")
        f.write("  POST?: (req: NextRequest) => Promise<Response>;\n")
        f.write("};\n\n")

        for rd in route_data:
            slug = rd["slug"]
            name = rd["name"]

            f.write(f"// ─── {slug} {'─' * max(1, 65-len(slug))}─\n")

            # Module-level constants
            for block in rd["const_blocks"]:
                f.write(block + "\n")
            if rd["const_blocks"]:
                f.write("\n")

            if rd["get_body"] is not None:
                req_param = rd["get_req"] or "req"
                f.write(f"async function get_{name}({req_param}: NextRequest): Promise<Response> {{\n")
                f.write(rd["get_body"] + "\n")
                f.write("}\n\n")

            if rd["post_body"] is not None:
                req_param = rd["post_req"] or "req"
                f.write(f"async function post_{name}({req_param}: NextRequest): Promise<Response> {{\n")
                f.write(rd["post_body"] + "\n")
                f.write("}\n\n")

        # Dispatch map
        f.write("export const LEGACY_HANDLERS: Record<string, LegacyHandler> = {\n")
        for rd in route_data:
            slug = rd["slug"]
            name = rd["name"]
            parts = []
            if rd["get_body"] is not None:
                parts.append(f"GET: get_{name}")
            if rd["post_body"] is not None:
                parts.append(f"POST: post_{name}")
            f.write(f'  "{slug}": {{ {", ".join(parts)} }},\n')
        f.write("};\n")

    print(f"Written dispatcher to {OUT_DISPATCHER} ({os.path.getsize(OUT_DISPATCHER)//1024}KB)")

    # ── Write catch-all route ─────────────────────────────────────────────────
    os.makedirs(os.path.dirname(OUT_CATCHALL), exist_ok=True)
    with open(OUT_CATCHALL, 'w') as f:
        f.write('import { NextRequest, NextResponse } from "next/server";\n')
        f.write('import { LEGACY_HANDLERS } from "@/lib/legacy-api/dispatcher";\n\n')
        f.write('export const dynamic = "force-dynamic";\n\n')
        f.write("function resolveHandler(segments: string[]) {\n")
        f.write('  return LEGACY_HANDLERS[segments.join("/")];\n')
        f.write("}\n\n")
        f.write("export async function GET(\n")
        f.write("  req: NextRequest,\n")
        f.write("  ctx: { params: Promise<{ segments: string[] }> },\n")
        f.write(") {\n")
        f.write("  try {\n")
        f.write("    const { segments } = await ctx.params;\n")
        f.write("    const handler = resolveHandler(segments);\n")
        f.write('    if (!handler?.GET) return NextResponse.json({ error: "Not found" }, { status: 404 });\n')
        f.write("    return handler.GET(req);\n")
        f.write("  } catch (err) {\n")
        f.write("    const msg = err instanceof Error ? err.message : \"Internal error\";\n")
        f.write('    return NextResponse.json({ error: msg }, { status: 500 });\n')
        f.write("  }\n")
        f.write("}\n\n")
        f.write("export async function POST(\n")
        f.write("  req: NextRequest,\n")
        f.write("  ctx: { params: Promise<{ segments: string[] }> },\n")
        f.write(") {\n")
        f.write("  try {\n")
        f.write("    const { segments } = await ctx.params;\n")
        f.write("    const handler = resolveHandler(segments);\n")
        f.write('    if (!handler?.POST) return NextResponse.json({ error: "Method not allowed" }, { status: 405 });\n')
        f.write("    return handler.POST(req);\n")
        f.write("  } catch (err) {\n")
        f.write("    const msg = err instanceof Error ? err.message : \"Internal error\";\n")
        f.write('    return NextResponse.json({ error: msg }, { status: 500 });\n')
        f.write("  }\n")
        f.write("}\n")

    print(f"Written catch-all to {OUT_CATCHALL}")

    # ── Delete script ─────────────────────────────────────────────────────────
    delete_script = os.path.join(REPO_ROOT, "scripts", "_delete_legacy_routes.sh")
    with open(delete_script, 'w') as f:
        f.write("#!/bin/bash\n")
        f.write("# Delete the 252 legacy route files replaced by the dispatcher.\n")
        f.write("# Run from repo root: bash scripts/_delete_legacy_routes.sh\n\n")
        for rd in route_data:
            f.write(f'rm "{rd["file"]}"\n')
        f.write("\n# Remove now-empty directories\n")
        dirs_seen = set()
        for rd in route_data:
            d = os.path.dirname(rd["file"])
            if d not in dirs_seen:
                dirs_seen.add(d)
                f.write(f'rmdir --ignore-fail-on-non-empty "{d}" 2>/dev/null || true\n')
    os.chmod(delete_script, 0o755)
    print(f"Written delete script to {delete_script}")

    print(f"\nSummary: {len(route_data)} routes -> 1 catch-all")

if __name__ == "__main__":
    main()
