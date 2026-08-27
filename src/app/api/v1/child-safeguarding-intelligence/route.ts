// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD SAFEGUARDING INTELLIGENCE API ROUTE
// GET /api/v1/child-safeguarding-intelligence?childId=yp_alex
// Per-child engine: holistic safeguarding profile combining risk assessments,
// incidents, missing episodes, restraints, and contextual safeguarding markers.
// CHR 2015 Reg 12, Reg 13, Reg 34, Reg 35. SCCIF: "Helped and protected."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse, type NextRequest } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { dal } from "@/lib/db";
import { todayStr } from "@/lib/utils";
import { ageFromDob } from "@/lib/cara-studio/cara-context-builder";
import {
  computeChildSafeguarding,
  type RiskAssessmentInput,
  type IncidentInput,
  type MissingEpisodeInput,
  type RestraintInput,
  type ContextualMarkerInput,
  type RiskLevel,
  type RiskTrend,
  type MitigationEffectiveness,
} from "@/lib/engines/child-safeguarding-intelligence-engine";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");

  const identity = await getRequestIdentity(request);
  if (identity instanceof NextResponse) return identity;
  const denied = assertChildHomeAccess(identity, childId);
  if (denied) return denied;
  if (!childId) {
    return NextResponse.json({ error: "childId is required" }, { status: 400 });
  }

  const [youngPeopleList, riskAssessmentsList, incidentsList, missingEpisodesList, restraintsList] = await Promise.all([
    dal.youngPeople.findAll(),
    dal.riskAssessments.findAll(),
    dal.incidents.findAll(),
    dal.missingEpisodes.findAll(),
    dal.restraints.findAll(),
  ]);

  const today = todayStr();

  // ── Child info ─────────────────────────────────────────────────────────
  const child = (youngPeopleList ?? []).find((yp) => yp.id === childId);
  const childName = `${child?.first_name ?? ""} ${child?.last_name ?? ""}`.trim() || childId;
  // YoungPerson has no age field — derive from date_of_birth (the old phantom
  // `.age` read meant every child was assessed as 15); 15 only if DOB missing
  const childAge = (child ? ageFromDob(child.date_of_birth, today) : null) ?? 15;

  // ── Risk Assessments ───────────────────────────────────────────────────
  const risk_assessments: RiskAssessmentInput[] = (riskAssessmentsList ?? [])
    .filter((r) => r.child_id === childId)
    .map((r) => ({
      id: r.id,
      domain: r.domain ?? "unknown",
      current_level: (r.current_level ?? "medium") as RiskLevel,
      previous_level: (r.previous_level ?? r.current_level ?? "medium") as RiskLevel,
      trend: (r.trend ?? "stable") as RiskTrend,
      status: r.status ?? "current",
      assessed_date: typeof r.assessed_date === "string" ? r.assessed_date.slice(0, 10) : r.assessed_date ?? today,
      review_date: typeof r.review_date === "string" ? r.review_date.slice(0, 10) : r.review_date ?? today,
      triggers: Array.isArray(r.triggers) ? r.triggers : [],
      indicators: Array.isArray(r.indicators) ? r.indicators : [],
      mitigations: Array.isArray(r.mitigations)
        ? r.mitigations.map((m) => ({
            strategy: m.strategy ?? "",
            effectiveness: (m.effectiveness ?? "not_yet_assessed") as MitigationEffectiveness,
          }))
        : [],
      child_views: r.child_views ?? "",
      linked_incidents: Array.isArray(r.linked_incidents) ? r.linked_incidents : [],
    }));

  // ── Incidents ──────────────────────────────────────────────────────────
  const incidents: IncidentInput[] = (incidentsList ?? [])
    .filter((i) => i.child_id === childId)
    .map((i) => ({
      id: i.id,
      date: (i.date ?? "").slice(0, 10),
      type: i.type ?? "other",
      severity: i.severity ?? "medium",
      involved_child: true,
    }));

  // ── Missing Episodes ───────────────────────────────────────────────────
  const missing_episodes: MissingEpisodeInput[] = (missingEpisodesList ?? [])
    .filter((m) => m.child_id === childId)
    .map((m) => ({
      id: m.id,
      date: (m.date_missing ?? "").slice(0, 10),
      duration_hours: m.duration_hours ?? null,
      risk_level: m.risk_level ?? "medium",
      returned: m.status === "returned" || m.status === "closed" || !!m.date_returned,
      return_interview_completed: !!m.return_interview_completed,
      contextual_safeguarding_risk: !!m.contextual_safeguarding_risk,
      pattern_notes: m.pattern_notes ?? null,
    }));

  // ── Restraints ─────────────────────────────────────────────────────────
  const restraints: RestraintInput[] = (restraintsList ?? [])
    .filter((r) => r.child_id === childId)
    .map((r) => ({
      id: r.id,
      date: typeof r.date === "string" ? r.date.slice(0, 10) : r.date,
      duration_minutes: r.duration ?? 0,
      reason: r.reason ?? "",
      de_escalation_attempts: Array.isArray(r.de_escalation_attempts) ? r.de_escalation_attempts : [],
      injuries_count: Array.isArray(r.injuries) ? r.injuries.length : 0,
      child_debriefed: !!r.child_debriefed,
      staff_debriefed: !!r.staff_debriefed,
      review_status: r.review_status ?? "pending",
    }));

  // ── Contextual Markers ─────────────────────────────────────────────────
  // Derived from exploitation-type risk assessments. (An earlier
  // `store.contextualSafeguarding` branch here was a phantom-collection read
  // that never fired — the actual store field is `contextualSafeguardingRisks`
  // and no consumer wired it; removed with the DAL migration.)
  const contextual_markers: ContextualMarkerInput[] = [];
  // Add exploitation-type risk assessments as contextual markers
  risk_assessments
    .filter((ra) => ["exploitation", "county_lines", "gangs", "radicalisation"].includes(ra.domain) && ra.status === "current")
    .forEach((ra) => {
      if (!contextual_markers.some((c) => c.domain === ra.domain)) {
        contextual_markers.push({
          id: `ctx_${ra.id}`,
          domain: ra.domain,
          risk_level: ra.current_level,
          date_identified: ra.assessed_date,
          status: "active",
        });
      }
    });

  // ── Compute ────────────────────────────────────────────────────────────
  const result = computeChildSafeguarding({
    today,
    child_id: childId,
    child_name: childName,
    child_age: childAge,
    risk_assessments,
    incidents,
    missing_episodes,
    restraints,
    contextual_markers,
  });

  return NextResponse.json({ data: result });
}
