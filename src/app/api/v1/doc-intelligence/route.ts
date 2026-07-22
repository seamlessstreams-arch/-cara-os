// ══════════════════════════════════════════════════════════════════════════════
// DOC INTELLIGENCE — UPLOAD (deterministic, no AI required)
//
// POST /api/v1/doc-intelligence  — the "smart upload" endpoint behind the
// SmartUploadButton used across the app (documents, referrals, care records…).
//
// It USED to fall through to the catch-all dispatcher, which wrote to the
// in-memory `uploadedDocuments` collection — gated empty and never persisted on
// a live tenant, so every upload silently vanished. And the AI analysis it
// implied needs API credits the live tenant does not have.
//
// This route makes upload work DETERMINISTICALLY without any AI: it persists a
// real Document to the documents table via the dual-mode dal (so it shows in the
// Documents library on a live tenant and survives a cold start), classifying the
// category by keyword. Cara's auto-analysis (suggested tasks/dates) is an
// optional enhancement that simply doesn't run here — the response carries a
// note to that effect and an empty task list, which the upload modal already
// handles. No credits, no dependency, always saves.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import { readJsonBody } from "@/lib/http/read-json";

// Deterministic category from the file name + upload context (no AI).
function classify(name: string, ctx: string): string {
  const s = `${name} ${ctx}`.toLowerCase();
  if (/risk.?assess/.test(s)) return "risk_assessment";
  if (/care.?plan/.test(s)) return "care_plan";
  if (/placement|referral|admission/.test(s)) return "placement_plan";
  if (/missing/.test(s)) return "missing_protocol";
  if (/behaviou?r/.test(s)) return "behaviour_support";
  if (/health|medical|medication/.test(s)) return "health_plan";
  if (/education|\bpep\b|school/.test(s)) return "education_plan";
  if (/reg.?44/.test(s)) return "reg44_report";
  if (/reg.?45/.test(s)) return "reg45_report";
  if (/ofsted/.test(s)) return "ofsted_correspondence";
  if (/supervision/.test(s)) return "supervision_record";
  if (/training|certificate/.test(s)) return "training_certificate";
  if (/procedure/.test(s)) return "procedure";
  return "policy";
}

export async function GET() {
  // No base list is consumed today; keep a stable empty response rather than
  // 405 in case a future caller GETs this path.
  return NextResponse.json({ data: [] });
}

export async function POST(req: NextRequest) {
  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data as Record<string, unknown>;

  const name = (b.original_file_name as string) || "Uploaded document";
  const ctx = (b.upload_context as string) || "";
  const text = (b.extracted_text as string) || "";

  const doc = await dal.documents.create({
    title: name,
    category: classify(name, ctx),
    description: text ? text.slice(0, 2000) : null,
    file_name: name,
    file_size: (b.file_size as number) || 0,
    mime_type: (b.file_type as string) || "",
    file_url: "",
    version: 1,
    requires_read_sign: false,
    linked_child_id: (b.linked_child_id as string) ?? null,
    linked_staff_id: (b.linked_staff_id as string) ?? null,
    linked_incident_id: (b.linked_incident_id as string) ?? null,
    tags: ctx ? [ctx] : [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  // Shape the response the upload modal expects: a record with id + an empty
  // Cara analysis, plus a note that auto-analysis was skipped (deterministic mode).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = doc as any;
  return NextResponse.json({
    data: {
      ...d,
      original_file_name: name,
      status: "saved",
      ai_result: { suggested_tasks: [], summary: "", key_dates: [] },
    },
    cara_error:
      "Cara auto-analysis is off, so no tasks were suggested — the document has been saved to the Documents library. Add any follow-up tasks manually.",
  });
}
