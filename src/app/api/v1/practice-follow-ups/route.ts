// ══════════════════════════════════════════════════════════════════════════════
// CARA — PRACTICE FOLLOW-UPS API
// GET /api/v1/practice-follow-ups
//
// Runs the deterministic workflow-trigger rules over the home's recent records
// (incidents, missing episodes, restraints, safeguarding, complaints, daily logs)
// and returns the suggested follow-ups — each deep-linking into Cara Studio to
// draft it, grounded in the child's records. Pure read; no LLM; works with no AI.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  buildPracticeFollowUps,
  type FollowUpSourceRecord,
} from "@/lib/practice-intelligence/workflow-suggestion-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = getStore() as any;
    const now = new Date().toISOString();
    const day = (d: unknown) => String(d ?? now).slice(0, 10);

    const children = (store.youngPeople ?? [])
      .filter((yp: any) => yp.status === "current")
      .map((yp: any) => ({ id: yp.id, name: yp.preferred_name || yp.first_name || "Child" }));

    const records: FollowUpSourceRecord[] = [];
    const add = (r: FollowUpSourceRecord) => { if (r.source_id) records.push(r); };

    for (const i of store.incidents ?? []) {
      add({ event: "incident_created", source_table: "incidents", source_id: i.id, child_id: i.child_id ?? i.young_person_id ?? null, content: `${i.type ?? ""} ${i.description ?? i.summary ?? ""}`.trim(), label: `Incident — ${i.type ?? i.incident_type ?? "general"}`, date: day(i.date ?? i.incident_date ?? i.created_at) });
    }
    for (const m of store.missingEpisodes ?? []) {
      add({ event: "missing_episode_created", source_table: "missing_episodes", source_id: m.id, child_id: m.child_id ?? null, content: m.circumstances ?? m.notes ?? "", label: "Missing from care episode", date: day(m.date_missing ?? m.created_at) });
    }
    for (const r of store.restraints ?? []) {
      add({ event: "restraint_recorded", source_table: "restraints", source_id: r.id, child_id: r.child_id ?? null, content: `physical intervention ${r.description ?? r.technique ?? ""}`.trim(), label: "Physical intervention / restraint", date: day(r.date ?? r.created_at) });
    }
    for (const d of store.disclosures ?? []) {
      add({ event: "safeguarding_concern_raised", source_table: "disclosures", source_id: d.id, child_id: d.child_id ?? null, content: d.detail ?? d.description ?? "", label: "Safeguarding concern", date: day(d.date ?? d.disclosure_date ?? d.created_at) });
    }
    for (const c of store.complaints ?? []) {
      add({ event: "complaint_created", source_table: "complaints", source_id: c.id, child_id: c.child_id ?? null, content: c.summary ?? c.description ?? "", label: "Complaint", date: day(c.date ?? c.created_at) });
    }
    for (const e of store.dailyLog ?? []) {
      add({ event: "daily_log_created", source_table: "daily_log", source_id: e.id, child_id: e.child_id ?? null, content: e.content ?? "", label: `Daily log — ${e.entry_type ?? "note"}`, date: day(e.date ?? e.created_at) });
    }

    const followUps = buildPracticeFollowUps({ now, children, records });
    return NextResponse.json({
      data: { generated_at: now, total: followUps.length, follow_ups: followUps },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}
