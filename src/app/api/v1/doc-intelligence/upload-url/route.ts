// ══════════════════════════════════════════════════════════════════════════════
// DOC INTELLIGENCE — SIGNED UPLOAD TARGET
//
// POST /api/v1/doc-intelligence/upload-url  { file_name }
// Returns { enabled:false } in demo mode (no Supabase) so the client falls
// back to the inline-base64 path, or { enabled:true, path, token } for a
// direct browser→bucket upload via uploadToSignedUrl. The server never sees
// the file bytes, so the serverless body limit stops mattering.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http/read-json";
import { createDocumentUploadTarget, isDocumentStorageEnabled } from "@/lib/supabase/document-storage";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const fileName = typeof parsed.data?.file_name === "string" ? parsed.data.file_name : "";

  if (!isDocumentStorageEnabled()) {
    return NextResponse.json({ data: { enabled: false } });
  }
  const target = await createDocumentUploadTarget(fileName);
  if (!target) {
    // Storage configured but the bucket refused (missing, outage) — the client
    // degrades to inline exactly as in demo mode.
    return NextResponse.json({ data: { enabled: false } });
  }
  return NextResponse.json({ data: { enabled: true, path: target.path, token: target.token } });
}
