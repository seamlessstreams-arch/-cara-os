// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME RECORDING QUALITY INTELLIGENCE API ROUTE
// GET /api/v1/home-recording-quality-intelligence
// Synthesises care form completion, review workflows, approval rates,
// and timeliness to assess recording quality.
// CHR 2015 Reg 36 (Record Keeping). SCCIF: "Well-Led."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeRecordingQuality,
  type CareFormInput,
} from "@/lib/engines/home-recording-quality-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  const care_forms: CareFormInput[] = ((store.careForms ?? []) as any[])
    .map((f: any) => ({
      id: f.id ?? "",
      form_type: f.form_type ?? "",
      status: f.status ?? "draft",
      priority: f.priority ?? "medium",
      has_linked_child: !!(f.linked_child_id),
      has_linked_incident: !!(f.linked_incident_id),
      submitted_at: f.submitted_at ?? null,
      reviewed_at: f.reviewed_at ?? null,
      approved_at: f.approved_at ?? null,
      due_date: (f.due_date ?? today).toString().slice(0, 10),
      created_date: (f.created_at ?? "").toString().slice(0, 10),
    }));

  const result = computeHomeRecordingQuality({
    today,
    care_forms,
  });

  return NextResponse.json({ data: result });
}
