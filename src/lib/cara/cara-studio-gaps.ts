// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — GAP DETECTION ENGINE
// Detects recording and evidence gaps that need addressing.
// Results are presented to staff as suggestions, not automated alerts.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import type { CaraGenerationRequest, CaraGap, CaraGapType } from "@/types/cara-studio";

const HOME_ID = "home_oak";
const RISK_ASSESSMENT_STALE_DAYS = 90;
const OVERSIGHT_MISSING_DAYS = 28;
const KEYWORK_MISSING_DAYS = 14;

export async function detectGapsForRequest(
  request: CaraGenerationRequest
): Promise<Omit<CaraGap, "id" | "created_at">[]> {
  const gaps: Omit<CaraGap, "id" | "created_at">[] = [];
  const childId = request.child_id;
  const homeId = request.home_id ?? HOME_ID;

  // ── Check 1: Outdated risk assessment ────────────────────────────────────
  if (childId) {
    try {
      const risks = db.riskAssessments?.findAll?.()?.filter?.((r) => r.child_id === childId) ?? [];
      if (risks.length === 0) {
        gaps.push(buildGap({
          home_id: homeId,
          child_id: childId,
          gap_type: "outdated_risk_assessment",
          severity: "high",
          title: "No risk assessment found",
          description: "No risk assessment has been recorded for this child. A current risk assessment is required.",
          recommended_action: "Complete a risk assessment for this child as a matter of priority.",
        }));
      } else {
        const latest = risks.sort((a, b) => {
          const dateA = new Date(a.review_date ?? a.created_at ?? "").getTime();
          const dateB = new Date(b.review_date ?? b.created_at ?? "").getTime();
          return dateB - dateA;
        })[0];

        const reviewDate = new Date(latest.review_date ?? latest.created_at ?? "");
        const daysSinceReview = (Date.now() - reviewDate.getTime()) / 86400000;
        if (daysSinceReview > RISK_ASSESSMENT_STALE_DAYS) {
          gaps.push(buildGap({
            home_id: homeId,
            child_id: childId,
            gap_type: "outdated_risk_assessment",
            severity: "medium",
            title: `Risk assessment not reviewed for ${Math.round(daysSinceReview)} days`,
            description: `The last risk assessment review was ${Math.round(daysSinceReview)} days ago. The recommended review frequency is ${RISK_ASSESSMENT_STALE_DAYS} days.`,
            recommended_action: "Review and update the risk assessment within the next 7 days.",
          }));
        }
      }
    } catch { /* Risk assessments not available */ }
  }

  // ── Check 2: Missing management oversight ─────────────────────────────────
  if (request.artifact_type === "management_oversight" || !childId) {
    try {
      const recentArtifacts = db.caraArtifacts.findAll(homeId).filter(
        (a) => a.artifact_type === "management_oversight" && a.status !== "archived"
      );
      if (recentArtifacts.length === 0) {
        gaps.push(buildGap({
          home_id: homeId,
          child_id: null,
          gap_type: "missing_management_oversight",
          severity: "medium",
          title: "No recent management oversight recorded",
          description: `No management oversight has been recorded in Cara Studio. Regular management oversight is required by Regulation 45.`,
          recommended_action: "Record management oversight covering the past 28 days.",
        }));
      } else {
        const latest = recentArtifacts.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        const daysSince = (Date.now() - new Date(latest.created_at).getTime()) / 86400000;
        if (daysSince > OVERSIGHT_MISSING_DAYS) {
          gaps.push(buildGap({
            home_id: homeId,
            child_id: null,
            gap_type: "missing_management_oversight",
            severity: "medium",
            title: `Management oversight overdue by ${Math.round(daysSince - OVERSIGHT_MISSING_DAYS)} days`,
            description: `The last management oversight was ${Math.round(daysSince)} days ago.`,
            recommended_action: "Complete a management oversight review.",
          }));
        }
      }
    } catch { /* Not available */ }
  }

  // ── Check 3: Missing keywork sessions ─────────────────────────────────────
  if (childId) {
    try {
      const sessions = db.keyWorkingSessions?.findAll?.()?.filter?.((s) => s.child_id === childId) ?? [];
      if (sessions.length === 0) {
        gaps.push(buildGap({
          home_id: homeId,
          child_id: childId,
          gap_type: "missing_child_voice",
          severity: "medium",
          title: "No keywork sessions recorded",
          description: "No keywork sessions have been recorded for this child.",
          recommended_action: "Schedule and record a keywork session with this child.",
        }));
      } else {
        const latest = sessions.sort((a, b) =>
          new Date(b.date ?? b.created_at ?? "").getTime() - new Date(a.date ?? a.created_at ?? "").getTime()
        )[0];
        const daysSince = (Date.now() - new Date(latest.date ?? latest.created_at ?? "").getTime()) / 86400000;
        if (daysSince > KEYWORK_MISSING_DAYS) {
          gaps.push(buildGap({
            home_id: homeId,
            child_id: childId,
            gap_type: "missing_child_voice",
            severity: "low",
            title: `No keywork session in ${Math.round(daysSince)} days`,
            description: `The last keywork session was ${Math.round(daysSince)} days ago. Sessions are recommended at least fortnightly.`,
            recommended_action: "Schedule a keywork session within the next week.",
          }));
        }
      }
    } catch { /* Not available */ }
  }

  // ── Check 4: Missing return home conversations after missing episodes ─────
  if (childId) {
    try {
      const missingEpisodes = db.missingEpisodes.findAll().filter(
        (m) => m.child_id === childId && !m.return_interview_completed
      );
      if (missingEpisodes.length > 0) {
        gaps.push(buildGap({
          home_id: homeId,
          child_id: childId,
          gap_type: "missing_return_home_conversation",
          severity: "high",
          title: `${missingEpisodes.length} return home conversation(s) outstanding`,
          description: `${missingEpisodes.length} missing from care episode(s) do not have a completed return home conversation.`,
          recommended_action: "Complete return home conversations immediately for all outstanding missing episodes.",
        }));
      }
    } catch { /* Not available */ }
  }

  // ── Check 5: Weak Reg 45 evidence ────────────────────────────────────────
  if (request.artifact_type === "reg45_summary") {
    try {
      const reg45Evidence = db.reg45EvidenceQueue?.findAll?.() ?? [];
      const approvedEvidence = (reg45Evidence as Array<{ status?: string }>).filter((e) => e.status === "approved" || e.status === "accepted");
      if (approvedEvidence.length < 3) {
        gaps.push(buildGap({
          home_id: homeId,
          child_id: null,
          gap_type: "weak_reg45_evidence",
          severity: "medium",
          title: "Limited approved Regulation 45 evidence",
          description: `Only ${approvedEvidence.length} approved evidence item(s) found. A stronger evidence base is needed for a credible Regulation 45 report.`,
          recommended_action: "Review and approve pending Regulation 45 evidence before generating the report.",
        }));
      }
    } catch { /* Not available */ }
  }

  return gaps;
}

export async function detectAllGaps(homeId: string): Promise<Omit<CaraGap, "id" | "created_at">[]> {
  const gaps: Omit<CaraGap, "id" | "created_at">[] = [];

  // Run checks for the home as a whole
  const fakeRequest: CaraGenerationRequest = {
    artifact_type: "management_oversight",
    title: "Gap detection scan",
    child_id: null,
    home_id: homeId,
    staff_id: null,
    incident_id: null,
    linked_record_id: null,
    linked_record_type: null,
    framework: "none",
    tone: "professional",
    creative_mode: "balanced",
    source_ids: [],
    additional_context: "",
    requested_by: "system",
    date_range_from: null,
    date_range_to: null,
  };

  const homeGaps = await detectGapsForRequest(fakeRequest);
  gaps.push(...homeGaps);

  // Run checks for each child
  try {
    const children = db.youngPeople.findAll?.() ?? db.youngPeople ?? [];
    const childList = Array.isArray(children) ? children : [];
    for (const child of childList.slice(0, 10)) { // Cap to avoid performance issues
      const childRequest = { ...fakeRequest, child_id: child.id };
      const childGaps = await detectGapsForRequest(childRequest);
      gaps.push(...childGaps);
    }
  } catch { /* Not available */ }

  return gaps;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildGap(data: {
  home_id: string;
  child_id: string | null;
  gap_type: CaraGapType;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  recommended_action: string;
}): Omit<CaraGap, "id" | "created_at"> {
  return {
    ...data,
    staff_id: null,
    linked_record_id: null,
    linked_record_type: null,
    status: "open",
    assigned_to: null,
    due_date: null,
    resolved_at: null,
  };
}
