// ══════════════════════════════════════════════════════════════════════════════
// CARA WRITING ASSISTANT — check API
//
// POST → positioned writing issues + a friendly quality score + summary for a
// piece of record text. Deterministic by default (no model calls, no external
// provider). Authenticated; size-capped; never logs record text.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { getWritingProvider, isWritingAssistantEnabled } from "@/lib/writing-assistant/engine";
import { MAX_CHECK_LENGTH, type WritingCheckInput, type WritingMode } from "@/lib/writing-assistant/types";

export const dynamic = "force-dynamic";

const VALID_MODES: WritingMode[] = ["standard", "safeguarding", "writing-to-child", "management-oversight"];

export async function POST(req: NextRequest) {
  if (!isWritingAssistantEnabled()) {
    return NextResponse.json({ error: "Writing Assistant is disabled" }, { status: 503 });
  }
  const auth = requirePermission(req, PERMISSIONS.USE_CARA_INTELLIGENCE);
  if (auth instanceof NextResponse) return auth;

  let body: Partial<WritingCheckInput>;
  try {
    body = (await req.json()) as Partial<WritingCheckInput>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text : "";
  if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });
  if (text.length > MAX_CHECK_LENGTH) {
    return NextResponse.json({ error: `text exceeds ${MAX_CHECK_LENGTH} characters` }, { status: 413 });
  }

  const mode: WritingMode = VALID_MODES.includes(body.mode as WritingMode) ? (body.mode as WritingMode) : "standard";
  const today = new Date().toISOString().slice(0, 10);

  try {
    const result = await getWritingProvider().checkText({
      text,
      recordType: body.recordType,
      fieldName: body.fieldName,
      childId: body.childId,
      workflowId: body.workflowId,
      mode,
      knownNames: Array.isArray(body.knownNames) ? body.knownNames : undefined,
    });
    return NextResponse.json({ data: { ...result, generatedAt: result.generatedAt || today } });
  } catch (error) {
    // Never log record text — only a length + bounded error note.
    console.error("[writing-assistant] check failed", { length: text.length, message: String(error).slice(0, 200) });
    return NextResponse.json({ error: "Writing check failed" }, { status: 500 });
  }
}
