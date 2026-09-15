// ══════════════════════════════════════════════════════════════════════════════
// The Supabase client with its generated table types deliberately dropped.
//
// This is the one place in the codebase where that escape hatch is declared.
// Before this file it was redeclared as `type SB = any` in 390 separate
// modules — 356 of them carrying their own eslint-disable comment — so the
// same decision was made 390 times, reviewed once, and documented nowhere.
//
// ── Why it exists ────────────────────────────────────────────────────────────
// Supabase's generated types describe the tables as they are declared, and much
// of this codebase queries them dynamically: table names chosen at runtime,
// selects built from column lists, jsonb columns read as their nested shapes.
// The generated client rejects those calls. Four modules tried the honest
// alternative —
//
//   type SB = ReturnType<typeof createServerClient> extends Promise<infer R> ? R : never
//
// — and every call site there still needs `as unknown as SB` to get past the
// same mismatch, with one reading `(… as unknown as SB) as any`. That form is
// ceremony around the identical hole, so it is not the fix; naming the hole is.
//
// ── Why it is not suppressed ─────────────────────────────────────────────────
// No eslint-disable here on purpose. This `any` stays in the lint baseline
// where the ratchet can see it, because an escape hatch that has been made
// invisible stops being reviewed. One counted `any` in one file, with the
// reasoning attached, is the honest shape.
//
// ── What would retire it ─────────────────────────────────────────────────────
// Narrowing the dynamic query sites onto the generated types, table by table,
// so the cast is no longer load-bearing. That is real work on the data layer,
// not a lint change, and it can proceed file by file: each one that stops
// importing this type is progress.
// ══════════════════════════════════════════════════════════════════════════════

/**
 * The Supabase client, untyped. Use only where a dynamically-built query
 * cannot satisfy the generated table types — and prefer narrowing the query.
 */
export type LooseSupabaseClient = any;

/**
 * Short alias. `SB` is the established spelling at the call sites this
 * replaced, so importing it keeps `(sb.from("x") as SB)` reading as before.
 */
export type SB = LooseSupabaseClient;

/**
 * The narrowest loose shape: something with `.from(table)`. The persist
 * modules take this instead of the full client so tests can hand them a stub.
 * The builder it returns is untyped for the same reason SB is — see above.
 */
export type RawClient = { from(table: string): SB };
