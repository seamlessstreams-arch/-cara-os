// ══════════════════════════════════════════════════════════════════════════════
// DOC INTELLIGENCE — STORED FILE DOWNLOAD
//
// GET /api/v1/doc-intelligence/file?path=storage:docs/…
// Redirects to a short-lived signed URL for a storage-backed document. Only
// paths under docs/ are ever resolved (normaliseStoredObjectPath rejects
// traversal and out-of-prefix paths), so this cannot be used to read arbitrary
// bucket objects. Inline data: files never come here — their href is the data
// URL itself.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createDocumentDownloadUrl, normaliseStoredObjectPath } from "@/lib/supabase/document-storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("path") ?? "";
  if (!normaliseStoredObjectPath(raw)) {
    return NextResponse.json({ error: "A storage-backed document path is required." }, { status: 400 });
  }
  const url = await createDocumentDownloadUrl(raw);
  if (!url) {
    return NextResponse.json(
      { error: "This file is not available from object storage right now." },
      { status: 404 },
    );
  }
  return NextResponse.redirect(url, 302);
}
