// CARA — POST /api/v1/young-people/[id]/chronology/import
//
// Convert a pasted/uploaded prior-placement chronology into Cara's format.
// mode "preview" parses and returns structured entries (nothing saved);
// mode "commit" saves the (optionally edited) entries as chronology records
// marked `imported`, so they slot into the live per-child chronology by date.
// Deterministic parse always; the saved entries auto-merge with live sources.
import { NextResponse } from "next/server";
import { db, getStore } from "@/lib/db/store";
import { withShiftAccess } from "@/lib/permissions/with-shift-access";
import { parseChronologyText, type ParsedChronologyEntry } from "@/lib/chronology/chronology-import";
import type { ChronologyEntry } from "@/types/extended";
import { readJsonBody } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

const HOME_ID = "home_oak";

async function importChronology(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: childId } = await params;
  if (!childId) return NextResponse.json({ error: "Child ID required" }, { status: 400 });

  const store = getStore() as any;
  if (!store.youngPeople.some((y: any) => String(y.id) === String(childId))) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }

  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const mode: "preview" | "commit" = body?.mode === "commit" ? "commit" : "preview";
  const sourceLabel: string = typeof body?.source_label === "string" && body.source_label.trim()
    ? body.source_label.trim()
    : "Imported — prior chronology";

  // ── Preview: parse the pasted text ──
  if (mode === "preview") {
    const text = typeof body?.text === "string" ? body.text : "";
    const result = parseChronologyText(text);
    return NextResponse.json({ data: { ...result, source_label: sourceLabel } });
  }

  // ── Commit: save the confirmed entries (sent back from the preview) ──
  const entries: ParsedChronologyEntry[] = Array.isArray(body?.entries) ? body.entries : [];
  if (entries.length === 0) {
    return NextResponse.json({ error: "No entries to import" }, { status: 400 });
  }

  // Existing imported keys (date+title) to avoid duplicate re-imports.
  const existing = new Set(
    db.chronology
      .findByChild(childId)
      .filter((e) => e.imported)
      .map((e) => `${e.date}|${(e.title || "").slice(0, 60)}`),
  );

  let saved = 0;
  let skipped = 0;
  for (const e of entries) {
    if (!e?.date || !e?.title) continue;
    const key = `${e.date}|${String(e.title).slice(0, 60)}`;
    if (existing.has(key)) {
      skipped += 1;
      continue;
    }
    const record: Partial<ChronologyEntry> = {
      child_id: childId,
      date: String(e.date).slice(0, 10),
      time: null,
      category: e.category as ChronologyEntry["category"],
      title: String(e.title).slice(0, 200),
      description: String(e.description ?? "").slice(0, 2000),
      significance: e.significance,
      recorded_by: "import",
      linked_incident_id: null,
      home_id: HOME_ID,
      imported: true,
      source_label: sourceLabel,
    };
    db.chronology.create(record);
    existing.add(key);
    saved += 1;
  }

  return NextResponse.json({ data: { saved, skipped, total: entries.length } }, { status: 201 });
}

export const POST = withShiftAccess("child_record", "edit", importChronology);
