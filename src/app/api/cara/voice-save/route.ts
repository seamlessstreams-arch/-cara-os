// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/voice-save
//
// POST endpoint that saves structured voice output into the appropriate record
// table (daily_log, supervision_note, handover, reflective_journal,
// management_oversight). Uses the ServiceResult<T> pattern.
//
// Body: { recordType, content, homeId, userId, childId?, sessionId?,
//         metadata? }
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type VoiceRecordType =
  | "daily_log"
  | "supervision_note"
  | "handover"
  | "reflective_journal"
  | "management_oversight";

export interface VoiceSaveRequest {
  recordType: VoiceRecordType;
  content: string;
  homeId: string;
  userId: string;
  childId?: string;
  sessionId?: string;
  metadata?: {
    riskLevel?: string;
    agentUsed?: string;
    inputType?: string;
    auditId?: string;
  };
}

export interface VoiceSaveResponse {
  recordId: string;
  recordType: VoiceRecordType;
  savedAt: string;
}

// ── Table mapping for each record type ───────────────────────────────────────

const RECORD_TABLE_MAP: Record<VoiceRecordType, string> = {
  daily_log: "daily_log_entries",
  supervision_note: "supervision_notes",
  handover: "handover_records",
  reflective_journal: "reflective_journal_entries",
  management_oversight: "management_oversight_records",
};

// ── Build row data for each record type ──────────────────────────────────────

function buildRowData(body: VoiceSaveRequest): Record<string, unknown> {
  const now = new Date().toISOString();
  const base = {
    home_id: body.homeId,
    created_by: body.userId,
    created_at: now,
    updated_at: now,
    source: "voice_intelligence",
    cara_session_id: body.sessionId ?? null,
  };

  switch (body.recordType) {
    case "daily_log":
      return {
        ...base,
        child_id: body.childId ?? null,
        entry_type: "general",
        content: body.content,
        date: now.slice(0, 10),
        time: now.slice(11, 16),
        is_significant: false,
        status: "draft",
      };

    case "supervision_note":
      return {
        ...base,
        staff_id: body.userId,
        content: body.content,
        session_date: now.slice(0, 10),
        status: "draft",
        supervision_type: "formal",
      };

    case "handover":
      return {
        ...base,
        content: body.content,
        shift_date: now.slice(0, 10),
        status: "draft",
        handover_type: "shift_end",
      };

    case "reflective_journal":
      return {
        ...base,
        staff_id: body.userId,
        content: body.content,
        reflection_date: now.slice(0, 10),
        status: "draft",
        reflection_type: "general",
      };

    case "management_oversight":
      return {
        ...base,
        manager_id: body.userId,
        child_id: body.childId ?? null,
        content: body.content,
        oversight_date: now.slice(0, 10),
        status: "draft",
        oversight_type: "voice_capture",
      };

    default:
      return base;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as VoiceSaveRequest;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!body.recordType || !body.content || !body.homeId || !body.userId) {
      const result: ServiceResult<never> = {
        ok: false,
        error: "Missing required fields: recordType, content, homeId, userId",
      };
      return NextResponse.json(result, { status: 400 });
    }

    if (!RECORD_TABLE_MAP[body.recordType]) {
      const result: ServiceResult<never> = {
        ok: false,
        error: `Invalid record type: ${body.recordType}. Valid types: ${Object.keys(RECORD_TABLE_MAP).join(", ")}`,
      };
      return NextResponse.json(result, { status: 400 });
    }

    // ── Attempt save ────────────────────────────────────────────────────────
    if (!isSupabaseEnabled()) {
      // Graceful degradation — return a demo save response
      const demoId = `voice-save-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const result: ServiceResult<VoiceSaveResponse> = {
        ok: true,
        data: {
          recordId: demoId,
          recordType: body.recordType,
          savedAt: new Date().toISOString(),
        },
      };
      return NextResponse.json(result);
    }

    const sb = createServerClient();
    if (!sb) {
      const result: ServiceResult<never> = {
        ok: false,
        error: "Database client unavailable.",
      };
      return NextResponse.json(result, { status: 503 });
    }

    const table = RECORD_TABLE_MAP[body.recordType];
    const rowData = buildRowData(body);

    const { data, error } = await (sb.from(table) as SB)
      .insert(rowData)
      .select("id")
      .single();

    if (error || !data) {
      console.error("[api/cara/voice-save] Insert error:", error?.message);
      const result: ServiceResult<never> = {
        ok: false,
        error: error?.message ?? "Failed to save record.",
      };
      return NextResponse.json(result, { status: 500 });
    }

    // ── Mark session as saved (if sessionId provided) ────────────────────────
    if (body.sessionId) {
      await (sb.from("cara_sessions") as SB)
        .update({
          status: "saved",
          saved_record_type: body.recordType,
          saved_record_id: data.id,
        })
        .eq("id", body.sessionId)
        .catch((err: Error) => {
          console.error("[api/cara/voice-save] Session update error:", err.message);
        });
    }

    const result: ServiceResult<VoiceSaveResponse> = {
      ok: true,
      data: {
        recordId: data.id,
        recordType: body.recordType,
        savedAt: new Date().toISOString(),
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/cara/voice-save] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const result: ServiceResult<never> = {
      ok: false,
      error: message,
    };
    return NextResponse.json(result, { status: 500 });
  }
}
