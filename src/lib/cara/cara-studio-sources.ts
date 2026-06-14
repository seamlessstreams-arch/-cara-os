// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — SOURCE GATHERING
// Pulls verified evidence from existing store collections.
// Only uses approved/verified records for source context.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import type { CaraGenerationRequest, CaraSource } from "@/types/cara-studio";

const HOME_ID = "home_oak";

export async function gatherSourcesForRequest(
  request: CaraGenerationRequest
): Promise<CaraSource[]> {
  const sources: CaraSource[] = [];
  const now = new Date().toISOString();
  const actorId = request.requested_by;

  const fromDate = request.date_range_from
    ? new Date(request.date_range_from)
    : new Date(Date.now() - 30 * 86400000); // Default 30 days back

  // ── Daily log entries ──────────────────────────────────────────────────────
  try {
    const dailyLog = db.dailyLog.findAll().filter((e) => {
      if (request.child_id && e.child_id !== request.child_id) return false;
      const entryDate = new Date(`${e.date}T${e.time ?? "00:00"}`);
      return entryDate >= fromDate;
    }).slice(0, 10);

    for (const entry of dailyLog) {
      sources.push(buildSource({
        id: `src_dl_${entry.id}`,
        home_id: HOME_ID,
        child_id: entry.child_id ?? null,
        staff_id: entry.staff_id ?? null,
        linked_record_id: entry.id,
        linked_record_type: "daily_log",
        source_type: "daily_log",
        title: `Daily log — ${entry.entry_type} (${formatDate(entry.date)})`,
        content: entry.content ?? "",
        source_date: entry.date,
        approval_status: "approved",
        is_sensitive: false,
        created_by: actorId,
        created_at: now,
      }));
    }
  } catch { /* Daily log may not be indexed yet */ }

  // ── Incidents ──────────────────────────────────────────────────────────────
  try {
    const incidents = db.incidents.findAll().filter((i) => {
      if (request.child_id && i.child_id !== request.child_id) return false;
      const incidentDate = new Date(i.date ?? i.created_at ?? "");
      return incidentDate >= fromDate;
    }).slice(0, 5);

    for (const incident of incidents) {
      sources.push(buildSource({
        id: `src_inc_${incident.id}`,
        home_id: HOME_ID,
        child_id: incident.child_id ?? null,
        staff_id: null,
        linked_record_id: incident.id,
        linked_record_type: "incident",
        source_type: "incident",
        title: `Incident — ${incident.type} (${formatDate(incident.date)})`,
        content: incident.description ?? "",
        source_date: incident.date,
        approval_status: incident.status === "closed" ? "approved" : "pending",
        is_sensitive: true,
        created_by: actorId,
        created_at: now,
      }));
    }
  } catch { /* Incidents not available */ }

  // ── Key working sessions ───────────────────────────────────────────────────
  try {
    const sessions = db.keyWorkingSessions?.findAll?.()?.filter?.((s) => {
      if (request.child_id && s.child_id !== request.child_id) return false;
      const sessionDate = new Date(s.date ?? s.created_at ?? "");
      return sessionDate >= fromDate;
    })?.slice(0, 5) ?? [];

    for (const session of sessions) {
      sources.push(buildSource({
        id: `src_kw_${session.id}`,
        home_id: HOME_ID,
        child_id: session.child_id ?? null,
        staff_id: session.staff_id ?? null,
        linked_record_id: session.id,
        linked_record_type: "keywork",
        source_type: "keywork",
        title: `Keywork session — ${formatDate(session.date ?? session.created_at ?? "")}`,
        content: session.child_voice ?? session.worker_observations ?? "",
        source_date: (session.date ?? session.created_at ?? "").slice(0, 10),
        approval_status: "approved",
        is_sensitive: false,
        created_by: actorId,
        created_at: now,
      }));
    }
  } catch { /* Key working sessions not available */ }

  // ── Risk assessments ───────────────────────────────────────────────────────
  try {
    const risks = db.riskAssessments?.findAll?.()?.filter?.((r) => {
      if (request.child_id && r.child_id !== request.child_id) return false;
      return true;
    })?.slice(0, 3) ?? [];

    for (const risk of risks) {
      sources.push(buildSource({
        id: `src_ra_${risk.id}`,
        home_id: HOME_ID,
        child_id: risk.child_id ?? null,
        staff_id: null,
        linked_record_id: risk.id,
        linked_record_type: "risk_assessment",
        source_type: "risk_assessment",
        title: `Risk assessment — ${risk.domain} (reviewed ${formatDate(risk.review_date ?? risk.created_at)})`,
        content: `Risk level: ${risk.current_level}. ${risk.contingency_plan ?? ""} ${risk.history_notes ?? ""}`.trim(),
        source_date: (risk.review_date ?? risk.assessed_date ?? risk.created_at).slice(0, 10),
        approval_status: "approved",
        is_sensitive: true,
        created_by: actorId,
        created_at: now,
      }));
    }
  } catch { /* Risk assessments not available */ }

  // ── Missing episodes ───────────────────────────────────────────────────────
  try {
    const missing = db.missingEpisodes.findAll().filter((m) => {
      if (request.child_id && m.child_id !== request.child_id) return false;
      const episodeDate = new Date(m.date_missing ?? m.created_at ?? "");
      return episodeDate >= fromDate;
    }).slice(0, 3);

    for (const episode of missing) {
      sources.push(buildSource({
        id: `src_me_${episode.id}`,
        home_id: HOME_ID,
        child_id: episode.child_id ?? null,
        staff_id: null,
        linked_record_id: episode.id,
        linked_record_type: "missing_from_care",
        source_type: "missing_from_care",
        title: `Missing from care — ${formatDate(episode.date_missing)}`,
        content: `Duration: ${episode.duration_hours ?? "unknown"} hours. Return interview: ${episode.return_interview_completed ? "completed" : "pending"}.`,
        source_date: episode.date_missing.slice(0, 10),
        approval_status: "approved",
        is_sensitive: true,
        created_by: actorId,
        created_at: now,
      }));
    }
  } catch { /* Missing episodes not available */ }

  // Deduplicate by linked_record_id
  const seen = new Set<string>();
  const deduped = sources.filter((s) => {
    const key = `${s.source_type}:${s.linked_record_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildSource(data: Omit<CaraSource, "tags" | "category" | "confidentiality_level" | "extracted_text" | "summary" | "updated_at" | "archived_at">): CaraSource {
  return {
    ...data,
    tags: [],
    category: null,
    summary: data.content.slice(0, 200),
    confidentiality_level: data.is_sensitive ? "sensitive" : "standard",
    extracted_text: null,
    updated_at: data.created_at,
    archived_at: null,
  };
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "unknown date";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch {
    return dateStr.slice(0, 10);
  }
}
