import { readJsonBody } from "@/lib/http/read-json";
import { enumParam } from "@/lib/http/enum-param";
import { OVERSIGHT_RECORD_TYPE_VALUES } from "@/types/operations";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listOversightNotes, createOversightNote,
  getOversightStats, getRecordsNeedingOversight,
  generateOversightPrompts, OVERSIGHT_REGULATION_REFS,
} from "@/lib/services/oversight-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  // Stats
  if (type === "stats") {
    const result = await getOversightStats(homeId);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Records needing oversight
  if (type === "needed") {
    const recordType = enumParam(
      "recordType", searchParams.get("recordType"), OVERSIGHT_RECORD_TYPE_VALUES,
    );
    if (!recordType.ok) return recordType.response;
    if (!recordType.value) return NextResponse.json({ error: "recordType required" }, { status: 400 });
    const result = await getRecordsNeedingOversight(homeId, recordType.value);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Cara prompts (client-side generation — no DB needed)
  if (type === "prompts") {
    const recordType = enumParam(
      "recordType", searchParams.get("recordType"), OVERSIGHT_RECORD_TYPE_VALUES,
    );
    if (!recordType.ok) return recordType.response;
    const recordSummary = searchParams.get("summary") ?? "";
    const childName = searchParams.get("childName") ?? undefined;
    const childAge = searchParams.get("childAge") ? parseInt(searchParams.get("childAge")!) : undefined;

    if (!recordType.value) return NextResponse.json({ error: "recordType required" }, { status: 400 });

    const prompts = generateOversightPrompts({
      recordType: recordType.value,
      recordSummary,
      childName,
      childAge,
      regulationRefs: OVERSIGHT_REGULATION_REFS[recordType.value],
    });
    return NextResponse.json({ ok: true, data: prompts });
  }

  // List notes
  const listRecordType = enumParam(
    "recordType", searchParams.get("recordType"), OVERSIGHT_RECORD_TYPE_VALUES,
  );
  if (!listRecordType.ok) return listRecordType.response;

  const result = await listOversightNotes(homeId, {
    recordType: listRecordType.value,
    recordId: searchParams.get("recordId") ?? undefined,
    oversightBy: searchParams.get("oversightBy") ?? undefined,
    limit: parseInt(searchParams.get("limit") ?? "50"),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  try {
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const {
      homeId, recordType, recordId, recordReference,
      oversightText, qualityScore, qualityDimensions,
      caraPrompted, caraPromptUsed, caraSuggestions,
      actionsIdentified, regulationRefs, oversightBy,
    } = body;

    if (!homeId || !recordType || !recordId || !oversightText || !oversightBy) {
      return NextResponse.json({ error: "homeId, recordType, recordId, oversightText, oversightBy required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    const result = await createOversightNote({
      homeId, recordType, recordId, recordReference,
      oversightText, qualityScore, qualityDimensions,
      caraPrompted, caraPromptUsed, caraSuggestions,
      actionsIdentified, regulationRefs, oversightBy,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
