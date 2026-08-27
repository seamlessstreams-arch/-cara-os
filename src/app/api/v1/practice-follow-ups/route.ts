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
import { dal } from "@/lib/db";
import {
  buildPracticeFollowUps,
  type FollowUpSourceRecord,
} from "@/lib/practice-intelligence/workflow-suggestion-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [youngPeopleList, incidentsList, missingEpisodesList, restraintsList, disclosuresList, complaintsList, dailyLogList] = await Promise.all([
      dal.youngPeople.findAll(),
      dal.incidents.findAll(),
      dal.missingEpisodes.findAll(),
      dal.restraints.findAll(),
      dal.disclosures.findAll(),
      dal.complaints.findAll(),
      dal.dailyLog.findAll(),
    ]);
    const now = new Date().toISOString();
    const day = (d: unknown) => String(d ?? now).slice(0, 10);

    const children = (youngPeopleList ?? [])
      .filter((yp) => yp.status === "current")
      .map((yp) => ({ id: yp.id, name: yp.preferred_name || yp.first_name || "Child" }));

    const records: FollowUpSourceRecord[] = [];
    const add = (r: FollowUpSourceRecord) => { if (r.source_id) records.push(r); };

    for (const i of incidentsList ?? []) {
      // The `?? i.young_person_id ?? i.summary ?? i.incident_type ?? i.incident_date`
      // fallbacks that used to sit here name fields Incident does not have, so
      // the first branch always won. Typing the dal surfaced them as dead.
      add({ event: "incident_created", source_table: "incidents", source_id: i.id, child_id: i.child_id ?? null, content: `${i.type ?? ""} ${i.description ?? ""}`.trim(), label: `Incident — ${i.type ?? "general"}`, date: day(i.date ?? i.created_at) });
    }
    for (const m of missingEpisodesList ?? []) {
      // `m.circumstances ?? m.notes` named two fields MissingEpisode has
      // NEITHER of, so content was always "". Latent rather than live — the
      // missing_episode rule ignores content — but any rule that starts
      // reading it would have seen nothing. Built from the fields that exist.
      const missingContent = [
        m.location_last_seen ? `last seen ${m.location_last_seen}` : "",
        m.return_interview_notes ?? "",
        m.pattern_notes ?? "",
      ].filter(Boolean).join(" · ");
      add({ event: "missing_episode_created", source_table: "missing_episodes", source_id: m.id, child_id: m.child_id ?? null, content: missingContent, label: "Missing from care episode", date: day(m.date_missing ?? m.created_at) });
    }
    for (const r of restraintsList ?? []) {
      add({ event: "restraint_recorded", source_table: "restraints", source_id: r.id, child_id: r.child_id ?? null, content: `physical intervention ${r.description ?? ""}`.trim(), label: "Physical intervention / restraint", date: day(r.date ?? r.created_at) });
    }
    for (const d of disclosuresList ?? []) {
      add({ event: "safeguarding_concern_raised", source_table: "disclosures", source_id: d.id, child_id: d.child_id ?? null, content: d.disclosure_summary ?? "", label: "Safeguarding concern", date: day(d.disclosure_date ?? d.created_at) });
    }
    for (const c of complaintsList ?? []) {
      add({ event: "complaint_created", source_table: "complaints", source_id: c.id, child_id: c.child_id ?? null, content: c.summary ?? c.full_detail ?? "", label: "Complaint", date: day(c.date_received ?? c.created_at) });
    }
    for (const e of dailyLogList ?? []) {
      add({ event: "daily_log_created", source_table: "daily_log", source_id: e.id, child_id: e.child_id ?? null, content: e.content ?? "", label: `Daily log — ${e.entry_type ?? "note"}`, date: day(e.date ?? e.created_at) });
    }

    const followUps = buildPracticeFollowUps({ now, children, records });
    return NextResponse.json({
      data: { generated_at: now, total: followUps.length, follow_ups: followUps },
    });
  } catch (err) {
    console.error("[api] server error:", err); return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
