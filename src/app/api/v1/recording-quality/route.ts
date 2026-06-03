// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RECORDING QUALITY API ROUTE
// GET /api/v1/recording-quality
//
// Scores the WRITING of the home's narrative records (daily logs, incidents,
// key-working) across six Ofsted-relevant dimensions, with per-record suggestions
// and a home-level QA view. Distinct from the record-quality (workflow) engine.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { computeRecordingQuality, type RecordInput } from "@/lib/recording-quality/recording-quality-engine";

export async function GET() {
  const store = getStore();
  const nameById = new Map(((store.youngPeople ?? []) as any[]).map((yp: any) => [yp.id, yp.preferred_name || `${yp.first_name ?? ""} ${yp.last_name ?? ""}`.trim()]));

  const records: RecordInput[] = [
    ...((store.dailyLog ?? []) as any[]).map((l: any): RecordInput => {
      const present: string[] = [];
      if ((l.content ?? "").trim()) present.push("content");
      if (l.mood_score != null) present.push("mood_score");
      if (l.entry_type) present.push("entry_type");
      return {
        id: l.id, type: "daily_log", text: l.content ?? "",
        expected_fields: ["content", "mood_score", "entry_type"], present_fields: present,
        child_name: nameById.get(l.child_id), staff_id: l.staff_id, date: l.date,
        is_risk_related: !!l.is_significant || l.entry_type === "behaviour",
      };
    }),
    ...((store.incidents ?? []) as any[]).map((i: any): RecordInput => {
      const present: string[] = [];
      if ((i.description ?? "").trim()) present.push("description");
      if ((i.immediate_action ?? "").trim()) present.push("immediate_action");
      if ((i.outcome ?? "").toString().trim()) present.push("outcome");
      return {
        id: i.id, type: "incident", text: `${i.description ?? ""} ${i.immediate_action ?? ""}`.trim(),
        expected_fields: ["description", "immediate_action", "outcome"], present_fields: present,
        child_name: nameById.get(i.child_id), staff_id: i.reported_by, date: i.date, is_risk_related: true,
      };
    }),
    ...((store.keyWorkingSessions ?? []) as any[]).map((k: any): RecordInput => {
      const present: string[] = [];
      if ((k.worker_observations ?? "").trim()) present.push("worker_observations");
      if ((k.child_voice ?? "").trim()) present.push("child_voice");
      if (Array.isArray(k.actions_agreed) && k.actions_agreed.length) present.push("actions_agreed");
      return {
        id: k.id, type: "keywork", text: `${k.worker_observations ?? ""} ${k.child_voice ?? ""}`.trim(),
        expected_fields: ["worker_observations", "child_voice", "actions_agreed"], present_fields: present,
        child_name: nameById.get(k.child_id), staff_id: k.staff_id, date: k.date,
      };
    }),
  ];

  const result = computeRecordingQuality({ records });
  return NextResponse.json({ data: result });
}
