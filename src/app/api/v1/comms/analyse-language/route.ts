import { NextRequest, NextResponse } from "next/server";
import { resolveCommsUser } from "@/lib/comms/comms-service";
import { analyseMessageLanguage, detectRecordableContent } from "@/lib/comms/comms-governance";

export const dynamic = "force-dynamic";

// POST /api/v1/comms/analyse-language
// Advisory analysis of a DRAFT message: professional-language nudge (Cara scorer)
// + recordable-content detection. Read-only — never stores or sends anything, so it
// is safe to call as the user types. Identity is resolved only for consistency.
export async function POST(req: NextRequest) {
  await resolveCommsUser(req); // identity resolved (no side effects) — keeps parity with other routes
  let body: { text?: string; has_linked_child?: boolean; has_linked_incident?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = (body.text ?? "").toString();
  const language = analyseMessageLanguage(text, {
    hasLinkedChild: !!body.has_linked_child,
    hasLinkedIncident: !!body.has_linked_incident,
  });
  const recordable = detectRecordableContent(text);

  return NextResponse.json({ data: { language, recordable } });
}
