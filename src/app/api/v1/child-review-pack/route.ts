// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD REVIEW PACK API ROUTE
// GET /api/v1/child-review-pack?childId=yp_alex
//
// Returns the list of children (for the selector) and, when childId is given, a
// print-ready LAC review pack for that child — built by reusing the existing
// child-360-intelligence engine (fetched internally) + the child's profile.
//
// Pure read aggregation — no mutations, notifications, or external calls.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { getStaffName } from "@/lib/seed-data";
import {
  buildChildReviewPack,
  type ChildReviewPackInput,
  type ReviewDomainScore,
} from "@/lib/engines/child-review-pack-engine";
import { generateReportNarrative } from "@/lib/aria/report-narrative";

export const dynamic = "force-dynamic";

async function fetchChild360(baseUrl: string, childId: string): Promise<any | null> {
  try {
    const res = await fetch(`${baseUrl}/api/v1/child-360-intelligence?childId=${encodeURIComponent(childId)}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

function num(v: any): number {
  return typeof v === "number" && isFinite(v) ? v : 0;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const childId = url.searchParams.get("childId");
    const today = new Date().toISOString().slice(0, 10);

    const store = getStore();
    const youngPeople = (store.youngPeople ?? []) as any[];
    const current = youngPeople.filter((c) => c.status === "current");
    const list = (current.length ? current : youngPeople).map((c) => ({
      id: c.id,
      name: c.preferred_name || [c.first_name, c.last_name].filter(Boolean).join(" ") || c.id,
    }));

    let pack = null;
    if (childId) {
      const child = youngPeople.find((c) => c.id === childId);
      const d = await fetchChild360(baseUrl, childId);
      if (child && d) {
        const domain_scores: ReviewDomainScore[] = Array.isArray(d.domain_scores)
          ? d.domain_scores.map((s: any) => ({
              domain_label: String(s?.domain_label ?? s?.domain ?? ""),
              rag: String(s?.rag ?? ""),
              score: num(s?.score),
              trend: String(s?.trend ?? "stable"),
              summary: String(s?.summary ?? ""),
            }))
          : [];

        const input: ChildReviewPackInput = {
          child_id: childId,
          child_name: d.child_name || child.preferred_name || [child.first_name, child.last_name].filter(Boolean).join(" "),
          date_of_birth: child.date_of_birth ?? "—",
          age_years: num(d.age_years),
          legal_status: child.legal_status ?? "",
          placement_start: child.placement_start ?? "—",
          days_in_placement: num(d.days_in_placement),
          key_worker: child.key_worker_id ? getStaffName(child.key_worker_id) : "",
          social_worker: child.social_worker_name ?? "",
          iro: child.iro_name ?? "",

          overall_wellbeing: String(d.overall_wellbeing ?? "stable"),
          headline: String(d.headline ?? ""),
          domain_scores,

          voice_captured: !!d.emotional_wellbeing?.voice_captured,
          recent_themes: Array.isArray(d.emotional_wellbeing?.recent_themes)
            ? d.emotional_wellbeing.recent_themes.filter((t: any) => typeof t === "string" && t.trim())
            : [],
          mood_trend: String(d.emotional_wellbeing?.mood_trend ?? "stable"),

          risk_level: String(d.safety_profile?.risk_level ?? ""),
          active_risk_flags: Array.isArray(d.safety_profile?.active_risk_flags) ? d.safety_profile.active_risk_flags : [],
          open_incidents: num(d.safety_profile?.open_incidents_count),
          missing_90d: num(d.safety_profile?.missing_episodes_90d),

          school_name: d.education_profile?.school_name ?? null,
          attendance_rate_30d: typeof d.education_profile?.attendance_rate_30d === "number" ? d.education_profile.attendance_rate_30d : null,

          active_medications: num(d.health_profile?.active_medications),
          allergies: Array.isArray(d.health_profile?.allergies) ? d.health_profile.allergies : [],
          overdue_appointments: num(d.health_profile?.overdue_appointments),

          contact_consistency: String(d.relationships_profile?.contact_consistency ?? "no_data"),
          yp_voice_on_contact: !!d.relationships_profile?.yp_voice_on_contact,

          total_active_targets: num(d.outcomes_profile?.total_active_targets),
          targets_on_track: num(d.outcomes_profile?.targets_on_track),
          average_progress_pct: num(d.outcomes_profile?.average_progress_pct),

          strengths: Array.isArray(d.strengths) ? d.strengths.filter((x: any) => typeof x === "string") : [],
          concerns: Array.isArray(d.concerns) ? d.concerns.filter((x: any) => typeof x === "string") : [],
          priority_actions: Array.isArray(d.priority_actions)
            ? d.priority_actions.map((a: any) => ({ action: String(a?.action ?? ""), severity: String(a?.severity ?? "medium") })).filter((a: any) => a.action)
            : [],
          key_dates: Array.isArray(d.key_dates)
            ? d.key_dates
                .map((k: any) => ({ label: String(k?.label ?? k?.title ?? k?.description ?? ""), date: String(k?.date ?? k?.due_date ?? "") }))
                .filter((k: any) => k.label && k.date)
            : [],
          today,
        };

        const built = buildChildReviewPack(input);
        const facts = [
          `Child: ${built.child_name}, age ${built.age_years}. Overall wellbeing: ${built.overall_wellbeing}.`,
          ...built.sections.map((s) => `${s.title}: ${s.rag} — ${s.narrative}`),
          `Wishes & feelings: ${built.wishes_and_feelings.narrative}`,
          built.recommendations.length ? `Recommendations: ${built.recommendations.join("; ")}.` : "",
        ]
          .filter(Boolean)
          .join("\n");
        const ai_narrative = await generateReportNarrative({ kind: "LAC review pack", subject: built.child_name, facts });
        pack = { ...built, ai_narrative };
      }
    }

    return NextResponse.json({ data: { children: list, pack } });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}
