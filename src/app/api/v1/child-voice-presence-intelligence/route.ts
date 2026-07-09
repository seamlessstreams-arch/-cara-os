// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD VOICE PRESENCE INTELLIGENCE
// GET /api/v1/child-voice-presence-intelligence
//
// Analyses how consistently children's own perspectives are captured across
// five recording types: Incidents, Daily Log, Key Working Sessions, YP
// Feedback, and LAC Reviews.
//
// Voice presence = child's words, views, or choices appear in the record.
// Not just records ABOUT the child, but records HEARING the child.
//
// Grounds supervision prompts in UN CRC Article 12 and the "Children as
// Experts" principle from the Cara Knowledge Base.
//
// All deterministic. No LLM calls. All pure compute lives in the importable
// builder at src/lib/child-voice-presence/child-voice-presence-engine.ts.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { buildChildVoicePresence } from "@/lib/child-voice-presence/child-voice-presence-engine";

export async function GET() {
  return NextResponse.json({ data: buildChildVoicePresence(getStore()) });
}
