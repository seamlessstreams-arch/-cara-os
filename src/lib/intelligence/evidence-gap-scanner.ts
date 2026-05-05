// ══════════════════════════════════════════════════════════════════════════════
// EVIDENCE GAP SCANNER
//
// Deterministic scanner that identifies gaps in inspection evidence.
// Works entirely from data — no AI dependency. Used by the Ofsted Evidence
// Room and the Manager Control Centre.
// ══════════════════════════════════════════════════════════════════════════════

import type { EvidenceGap, EvidenceGapType, Urgency } from "@/types/intelligence.layer";

export interface EvidenceGapScanInput {
  homeId: string;
  children: { id: string; name: string; lastKeyWorkDate?: string; lastVoiceDate?: string }[];
  incidents: { id: string; childId?: string; date: string; hasOversight: boolean; hasFollowUp: boolean; severity: string }[];
  reg44: { lastVisitDate?: string; overdueActions: number }[];
  reg45: { lastReviewDate?: string; periodEnd?: string }[];
  riskAssessments: { id: string; childId: string; lastReviewDate?: string; lastIncidentDate?: string }[];
  placementPlans: { id: string; childId: string; lastUpdated?: string }[];
  staffSupervisions: { staffId: string; staffName: string; lastDate?: string; frequencyWeeks: number }[];
  training: { staffId: string; staffName: string; expiryDate?: string; course: string }[];
  complaints: { id: string; status: string; openedDate: string }[];
  patterns: { id: string; hasLearningReview: boolean }[];
}

export interface EvidenceGapScanResult {
  gaps: EvidenceGap[];
  totalGaps: number;
  criticalCount: number;
  highCount: number;
  gapsByType: Record<EvidenceGapType, number>;
}

export function scanEvidenceGaps(input: EvidenceGapScanInput): EvidenceGapScanResult {
  const gaps: EvidenceGap[] = [];
  const now = new Date();
  const daysSince = (dateStr?: string) => {
    if (!dateStr) return Infinity;
    return Math.floor((now.getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  };

  // Key work gaps
  for (const child of input.children) {
    const days = daysSince(child.lastKeyWorkDate);
    if (days > 14) {
      gaps.push({
        type: "no_recent_key_work",
        title: `No recent key work — ${child.name}`,
        description: child.lastKeyWorkDate
          ? `Last key work was ${days} days ago. Children should have regular key work sessions.`
          : `No key work recorded for ${child.name}. Key work is essential for building trust and understanding the child's needs.`,
        severity: days > 30 ? "high" : "medium",
        childId: child.id,
        recommendation: "Schedule a key work session and record the child's voice.",
      });
    }
  }

  // Child voice gaps
  for (const child of input.children) {
    const days = daysSince(child.lastVoiceDate);
    if (days > 30) {
      gaps.push({
        type: "no_child_voice",
        title: `No recent child voice — ${child.name}`,
        description: child.lastVoiceDate
          ? `Last voice entry was ${days} days ago. An inspector will ask how the child's views are captured.`
          : `No voice entries recorded for ${child.name}. The child's voice must be visible in the records.`,
        severity: days > 60 ? "critical" : "high",
        childId: child.id,
        recommendation: "Capture the child's wishes and feelings through key work, daily interaction, or a direct conversation.",
      });
    }
  }

  // Incidents without oversight
  for (const incident of input.incidents) {
    if (!incident.hasOversight && daysSince(incident.date) > 2) {
      gaps.push({
        type: "incident_no_oversight",
        title: "Incident missing management oversight",
        description: `Incident on ${incident.date} has no management oversight recorded. Oversight should be added within 48 hours.`,
        severity: incident.severity === "serious" || incident.severity === "high" ? "critical" : "high",
        childId: incident.childId,
        sourceRecordType: "incident",
        sourceRecordId: incident.id,
        recommendation: "Add management oversight to the incident record.",
      });
    }
  }

  // Incidents without follow-up
  for (const incident of input.incidents) {
    if (!incident.hasFollowUp && daysSince(incident.date) > 5) {
      gaps.push({
        type: "incident_no_follow_up",
        title: "Incident missing follow-up action",
        description: `Incident on ${incident.date} has no follow-up action recorded.`,
        severity: "medium",
        childId: incident.childId,
        sourceRecordType: "incident",
        sourceRecordId: incident.id,
        recommendation: "Review the incident and record what action was taken or why no further action was needed.",
      });
    }
  }

  // Reg 44 overdue
  for (const reg of input.reg44) {
    const days = daysSince(reg.lastVisitDate);
    if (days > 35) {
      gaps.push({
        type: "reg44_overdue",
        title: "Regulation 44 visit overdue",
        description: reg.lastVisitDate
          ? `Last Reg 44 visit was ${days} days ago. Visits must happen monthly.`
          : "No Regulation 44 visit recorded. Monthly independent visits are a regulatory requirement.",
        severity: days > 60 ? "critical" : "high",
        recommendation: "Arrange an independent person's visit as soon as possible.",
      });
    }
    if (reg.overdueActions > 0) {
      gaps.push({
        type: "reg44_overdue",
        title: `${reg.overdueActions} Reg 44 action(s) overdue`,
        description: `There are ${reg.overdueActions} overdue actions from Regulation 44 visits.`,
        severity: "high",
        recommendation: "Complete or reassign overdue Reg 44 actions.",
      });
    }
  }

  // Reg 45 gaps
  for (const reg of input.reg45) {
    const days = daysSince(reg.lastReviewDate);
    if (days > 180) {
      gaps.push({
        type: "reg45_missing",
        title: "Regulation 45 review overdue",
        description: reg.lastReviewDate
          ? `Last Reg 45 review was ${days} days ago. Reviews must happen every 6 months.`
          : "No Regulation 45 quality of care review recorded.",
        severity: "critical",
        recommendation: "The RI must arrange a quality of care review covering the period.",
      });
    }
  }

  // Risk assessments not reviewed after incidents
  for (const ra of input.riskAssessments) {
    if (ra.lastIncidentDate && ra.lastReviewDate) {
      if (new Date(ra.lastIncidentDate) > new Date(ra.lastReviewDate)) {
        gaps.push({
          type: "risk_not_reviewed",
          title: "Risk assessment not reviewed since last incident",
          description: `A risk assessment has not been reviewed since the last incident for this child.`,
          severity: "high",
          childId: ra.childId,
          sourceRecordType: "risk_assessment",
          sourceRecordId: ra.id,
          recommendation: "Review and update the risk assessment in light of the recent incident.",
        });
      }
    }
  }

  // Placement plans stale
  for (const plan of input.placementPlans) {
    const days = daysSince(plan.lastUpdated);
    if (days > 90) {
      gaps.push({
        type: "placement_plan_stale",
        title: "Placement plan not updated recently",
        description: plan.lastUpdated
          ? `Placement plan last updated ${days} days ago.`
          : "Placement plan has no recorded update date.",
        severity: days > 180 ? "high" : "medium",
        childId: plan.childId,
        sourceRecordType: "placement_plan",
        sourceRecordId: plan.id,
        recommendation: "Review and update the placement plan, incorporating the child's current needs and views.",
      });
    }
  }

  // Supervision overdue
  for (const sup of input.staffSupervisions) {
    const days = daysSince(sup.lastDate);
    const maxDays = sup.frequencyWeeks * 7;
    if (days > maxDays) {
      gaps.push({
        type: "supervision_overdue",
        title: `Supervision overdue — ${sup.staffName}`,
        description: sup.lastDate
          ? `Last supervision was ${days} days ago (due every ${sup.frequencyWeeks} weeks).`
          : `No supervision recorded for ${sup.staffName}.`,
        severity: days > maxDays * 2 ? "high" : "medium",
        staffId: sup.staffId,
        recommendation: "Schedule supervision as soon as possible.",
      });
    }
  }

  // Training expired
  for (const t of input.training) {
    if (t.expiryDate && new Date(t.expiryDate) < now) {
      const daysExpired = daysSince(t.expiryDate);
      gaps.push({
        type: "training_expired",
        title: `Training expired — ${t.staffName}: ${t.course}`,
        description: `${t.course} expired ${daysExpired} days ago.`,
        severity: daysExpired > 30 ? "high" : "medium",
        staffId: t.staffId,
        recommendation: "Book refresher training or verify if completed elsewhere.",
      });
    }
  }

  // Complaints not closed
  for (const c of input.complaints) {
    if (c.status !== "closed" && c.status !== "resolved") {
      const days = daysSince(c.openedDate);
      if (days > 28) {
        gaps.push({
          type: "complaint_not_closed",
          title: "Complaint open beyond 28 days",
          description: `A complaint has been open for ${days} days. Complaints should be resolved promptly.`,
          severity: days > 56 ? "high" : "medium",
          sourceRecordType: "complaint",
          sourceRecordId: c.id,
          recommendation: "Review the complaint and either resolve or record why it remains open.",
        });
      }
    }
  }

  // Repeated patterns without learning review
  for (const p of input.patterns) {
    if (!p.hasLearningReview) {
      gaps.push({
        type: "repeated_pattern_no_review",
        title: "Pattern detected without learning review",
        description: "ARIA has detected a repeated pattern that has no associated learning review.",
        severity: "medium",
        sourceRecordType: "pattern",
        sourceRecordId: p.id,
        recommendation: "Complete a learning review to capture what the pattern tells you and what action is needed.",
      });
    }
  }

  // Build summary
  const gapsByType = {} as Record<EvidenceGapType, number>;
  for (const g of gaps) {
    gapsByType[g.type] = (gapsByType[g.type] ?? 0) + 1;
  }

  return {
    gaps,
    totalGaps: gaps.length,
    criticalCount: gaps.filter((g) => g.severity === "critical").length,
    highCount: gaps.filter((g) => g.severity === "high").length,
    gapsByType,
  };
}
