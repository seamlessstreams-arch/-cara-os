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
    """Return import lines, excluding next/server."""
    result = []
    for line in content.split("\n"):
        s = line.strip()
        if s.startswith("import ") and "from " in s and "next/server" not in s:
            result.append(line)
    return result

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

def extract_module_consts(content, safe_prefix):
    """
    Find all module-level non-export, non-import statements (const/let/function/type).
    Returns (blocks, name_map) where blocks is a list of prefixed declarations,
    and name_map maps original name → prefixed name.
    """
    lines = content.split("\n")
    name_map = {}
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

    route_data = []
    for rp in route_paths:
        full_path = os.path.join(REPO_ROOT, rp)
        slug = slug_for_path(rp)
        name = safe_name(slug)

        try:
            with open(full_path, 'r') as f:
                content = f.read()
        except FileNotFoundError:
            print(f"WARNING: not found: {full_path}", file=sys.stderr)
            continue

        # Imports
        imports = extract_imports(content)
        for imp in imports:
            if imp not in seen_imports:
                seen_imports.add(imp)
                all_imports_set.append(imp)

        # Module-level constants
        const_blocks, name_map = extract_module_consts(content, name)

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

        for imp in all_imports_set:
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
