// ══════════════════════════════════════════════════════════════════════════════
// VOICE OF THE CHILD INTELLIGENCE ENGINE
//
// Pure deterministic engine for aggregating and analysing how well children's
// wishes, feelings, and views are captured, recorded, and acted upon across
// all operational domains of the home.
//
// This is the single most important cross-cutting metric for Ofsted. Every
// SCCIF judgement area assesses whether children's voices are central to
// practice. This module provides a holistic view.
//
// Regulatory basis:
//   - CHR 2015, Reg 7 — Children's wishes and feelings
//   - CHR 2015, Reg 4(1)(a) — Quality of care: child's views central
//   - Children Act 1989, s22(4) — Duty to ascertain wishes/feelings
//   - UNCRC Article 12 — Right to be heard
//   - SCCIF — All judgement areas: child's voice evidence
//   - Working Together 2023 — Child-centred approach
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import { withinPeriod } from "@/lib/date-period";

// ── Types ──────────────────────────────────────────────────────────────────

export type VoiceDomain =
  | "daily_log"
  | "key_work_session"
  | "lac_review"
  | "care_plan_review"
  | "contact_session"
  | "incident_report"
  | "complaint"
  | "house_meeting"
  | "risk_assessment"
  | "placement_plan"
  | "behaviour_support"
  | "health_appointment"
  | "education_review"
  | "independence_planning"
  | "transition_planning";

export type VoiceMethod =
  | "direct_verbal"
  | "written_by_child"
  | "staff_observed"
  | "advocacy_supported"
  | "interpreter_assisted"
  | "picture_exchange"
  | "digital_tool"
  | "body_language"
  | "behaviour_as_communication"
  | "not_recorded";

export type VoiceInfluence =
  | "directly_influenced"
  | "partially_influenced"
  | "acknowledged_not_acted"
  | "not_acknowledged"
  | "not_applicable";

export type ParticipationLevel =
  | "full"
  | "partial"
  | "declined"
  | "not_invited"
  | "unable_to_attend"
  | "represented_by_advocate";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface VoiceEntry {
  id: string;
  childId: string;
  date: string;
  domain: VoiceDomain;
  voiceRecorded: boolean;
  method: VoiceMethod;
  influence: VoiceInfluence;
  summary?: string;
  actionTaken?: string;
  recordedBy: string;
}

export interface AdvocacyRecord {
  id: string;
  childId: string;
  hasAdvocate: boolean;
  advocateName?: string;
  advocateOrganisation?: string;
  lastContact?: string;
  hasIndependentVisitor: boolean;
  independentVisitorName?: string;
  lastIVVisit?: string;
  childAwareOfRights: boolean;
  complaintsProcessExplained: boolean;
}

export interface ParticipationRecord {
  id: string;
  childId: string;
  date: string;
  eventType: "lac_review" | "care_plan_review" | "house_meeting" | "pep_review" | "health_review" | "pathway_plan";
  participationLevel: ParticipationLevel;
  childViewsRecorded: boolean;
  childViewsInfluencedOutcome: boolean;
  advocatePresent: boolean;
}

export interface ChildVoiceProfile {
  childId: string;
  childName: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface DomainCaptureResult {
  domain: VoiceDomain;
  totalEntries: number;
  voiceRecordedCount: number;
  captureRate: number;
  influencedCount: number;
  influenceRate: number;
}

export interface ChildVoiceResult {
  childId: string;
  childName: string;
  totalEntries: number;
  voiceRecordedRate: number;
  influenceRate: number;
  preferredMethods: VoiceMethod[];
  domainsWithGaps: VoiceDomain[];
  hasAdvocate: boolean;
  hasIndependentVisitor: boolean;
  participationRate: number;
  concerns: string[];
}

export interface VoiceOfChildIntelligenceResult {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  // Overall
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";

  // Aggregate metrics
  totalVoiceEntries: number;
  overallCaptureRate: number;
  overallInfluenceRate: number;

  // Domain analysis
  domainCapture: DomainCaptureResult[];
  weakestDomains: VoiceDomain[];
  strongestDomains: VoiceDomain[];

  // Per-child
  childResults: ChildVoiceResult[];

  // Advocacy & participation
  advocacyAccessRate: number;
  independentVisitorRate: number;
  averageParticipationRate: number;
  childrenAwareOfRights: number;

  // Method diversity
  methodBreakdown: { method: VoiceMethod; count: number }[];

  // Insights
  strengths: string[];
  areasForDevelopment: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Core: Analyse Domain Capture ──────────────────────────────────────────

export function analyseDomainCapture(
  entries: VoiceEntry[],
  periodStart: string,
  periodEnd: string,
): DomainCaptureResult[] {
  const periodEntries = entries.filter(
    (e) => withinPeriod(e.date, periodStart, periodEnd),
  );

  const domainMap = new Map<VoiceDomain, VoiceEntry[]>();
  for (const entry of periodEntries) {
    const existing = domainMap.get(entry.domain) || [];
    existing.push(entry);
    domainMap.set(entry.domain, existing);
  }

  return [...domainMap.entries()].map(([domain, domainEntries]) => {
    const voiceRecordedCount = domainEntries.filter((e) => e.voiceRecorded).length;
    const influencedCount = domainEntries.filter(
      (e) => e.influence === "directly_influenced" || e.influence === "partially_influenced",
    ).length;

    return {
      domain,
      totalEntries: domainEntries.length,
      voiceRecordedCount,
      captureRate: domainEntries.length > 0
        ? Math.round((voiceRecordedCount / domainEntries.length) * 100) : 0,
      influencedCount,
      influenceRate: voiceRecordedCount > 0
        ? Math.round((influencedCount / voiceRecordedCount) * 100) : 0,
    };
  }).sort((a, b) => b.totalEntries - a.totalEntries);
}

// ── Core: Build Child Voice Results ───────────────────────────────────────

export function buildChildVoiceResults(
  entries: VoiceEntry[],
  children: ChildVoiceProfile[],
  advocacy: AdvocacyRecord[],
  participation: ParticipationRecord[],
  periodStart: string,
  periodEnd: string,
): ChildVoiceResult[] {
  const periodEntries = entries.filter(
    (e) => withinPeriod(e.date, periodStart, periodEnd),
  );
  const periodParticipation = participation.filter(
    (p) => withinPeriod(p.date, periodStart, periodEnd),
  );

  return children.map((child) => {
    const childEntries = periodEntries.filter((e) => e.childId === child.childId);
    const recorded = childEntries.filter((e) => e.voiceRecorded);
    const influenced = recorded.filter(
      (e) => e.influence === "directly_influenced" || e.influence === "partially_influenced",
    );

    // Preferred methods
    const methodCounts = new Map<VoiceMethod, number>();
    for (const entry of recorded) {
      if (entry.method !== "not_recorded") {
        methodCounts.set(entry.method, (methodCounts.get(entry.method) || 0) + 1);
      }
    }
    const preferredMethods = [...methodCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([method]) => method);

    // Domain gaps: domains where capture rate < 50%
    const childDomainMap = new Map<VoiceDomain, VoiceEntry[]>();
    for (const entry of childEntries) {
      const existing = childDomainMap.get(entry.domain) || [];
      existing.push(entry);
      childDomainMap.set(entry.domain, existing);
    }
    const domainsWithGaps: VoiceDomain[] = [];
    for (const [domain, domainEntries] of childDomainMap) {
      const recordedCount = domainEntries.filter((e) => e.voiceRecorded).length;
      if (domainEntries.length >= 2 && (recordedCount / domainEntries.length) < 0.5) {
        domainsWithGaps.push(domain);
      }
    }

    // Advocacy
    const childAdvocacy = advocacy.find((a) => a.childId === child.childId);

    // Participation
    const childParticipation = periodParticipation.filter((p) => p.childId === child.childId);
    const fullOrPartial = childParticipation.filter(
      (p) => p.participationLevel === "full" || p.participationLevel === "partial" || p.participationLevel === "represented_by_advocate",
    );
    const participationRate = childParticipation.length > 0
      ? Math.round((fullOrPartial.length / childParticipation.length) * 100) : 0;

    // Concerns
    const concerns: string[] = [];
    const captureRate = childEntries.length > 0
      ? Math.round((recorded.length / childEntries.length) * 100) : 0;

    if (captureRate < 50 && childEntries.length >= 3) {
      concerns.push(`Voice recorded in only ${captureRate}% of entries — child may not feel heard`);
    }
    if (influenced.length === 0 && recorded.length >= 3) {
      concerns.push("Voice recorded but never shown to influence decisions — tokenistic practice risk");
    }
    if (!childAdvocacy?.hasAdvocate) {
      concerns.push("No independent advocate assigned — Reg 7(2)(b) requires access");
    }
    if (!childAdvocacy?.childAwareOfRights) {
      concerns.push("Child not recorded as aware of their rights — review communication approach");
    }
    if (domainsWithGaps.length > 0) {
      concerns.push(`Voice capture gaps in: ${domainsWithGaps.map((d) => d.replace(/_/g, " ")).join(", ")}`);
    }
    if (childParticipation.some((p) => p.participationLevel === "not_invited")) {
      concerns.push("Child not invited to at least one review/meeting — participation rights not upheld");
    }

    return {
      childId: child.childId,
      childName: child.childName,
      totalEntries: childEntries.length,
      voiceRecordedRate: captureRate,
      influenceRate: recorded.length > 0
        ? Math.round((influenced.length / recorded.length) * 100) : 0,
      preferredMethods,
      domainsWithGaps,
      hasAdvocate: childAdvocacy?.hasAdvocate ?? false,
      hasIndependentVisitor: childAdvocacy?.hasIndependentVisitor ?? false,
      participationRate,
      concerns,
    };
  });
}

// ── Main: Generate Voice of the Child Intelligence ────────────────────────

export function generateVoiceOfChildIntelligence(
  entries: VoiceEntry[],
  children: ChildVoiceProfile[],
  advocacy: AdvocacyRecord[],
  participation: ParticipationRecord[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): VoiceOfChildIntelligenceResult {
  const assessedAt = new Date().toISOString();

  const periodEntries = entries.filter(
    (e) => withinPeriod(e.date, periodStart, periodEnd),
  );

  // Domain analysis
  const domainCapture = analyseDomainCapture(entries, periodStart, periodEnd);

  // Child results
  const childResults = buildChildVoiceResults(entries, children, advocacy, participation, periodStart, periodEnd);

  // Aggregate metrics
  const totalRecorded = periodEntries.filter((e) => e.voiceRecorded).length;
  const totalInfluenced = periodEntries.filter(
    (e) => e.influence === "directly_influenced" || e.influence === "partially_influenced",
  ).length;

  const overallCaptureRate = periodEntries.length > 0
    ? Math.round((totalRecorded / periodEntries.length) * 100) : 0;
  const overallInfluenceRate = totalRecorded > 0
    ? Math.round((totalInfluenced / totalRecorded) * 100) : 0;

  // Domain rankings
  const qualifiedDomains = domainCapture.filter((d) => d.totalEntries >= 2);
  const weakestDomains = qualifiedDomains
    .filter((d) => d.captureRate < 60)
    .sort((a, b) => a.captureRate - b.captureRate)
    .slice(0, 3)
    .map((d) => d.domain);
  const strongestDomains = qualifiedDomains
    .filter((d) => d.captureRate >= 80)
    .sort((a, b) => b.captureRate - a.captureRate)
    .slice(0, 3)
    .map((d) => d.domain);

  // Advocacy & participation
  const advocacyAccessRate = children.length > 0
    ? Math.round(
      (advocacy.filter((a) => a.hasAdvocate && children.some((c) => c.childId === a.childId)).length /
        children.length) * 100,
    ) : 0;

  const independentVisitorRate = children.length > 0
    ? Math.round(
      (advocacy.filter((a) => a.hasIndependentVisitor && children.some((c) => c.childId === a.childId)).length /
        children.length) * 100,
    ) : 0;

  const averageParticipationRate = childResults.length > 0
    ? Math.round(
      childResults.reduce((sum, c) => sum + c.participationRate, 0) / childResults.length,
    ) : 0;

  const childrenAwareOfRights = advocacy.filter(
    (a) => a.childAwareOfRights && children.some((c) => c.childId === a.childId),
  ).length;

  // Method breakdown
  const methodMap = new Map<VoiceMethod, number>();
  for (const entry of periodEntries.filter((e) => e.voiceRecorded)) {
    methodMap.set(entry.method, (methodMap.get(entry.method) || 0) + 1);
  }
  const methodBreakdown = [...methodMap.entries()]
    .map(([method, count]) => ({ method, count }))
    .sort((a, b) => b.count - a.count);

  // Score
  const overallScore = calculateVoiceScore(
    overallCaptureRate, overallInfluenceRate, advocacyAccessRate,
    averageParticipationRate, childrenAwareOfRights, children.length,
    weakestDomains, childResults,
  );
  const rating = getVoiceRating(overallScore);

  // Insights
  const strengths = generateVoiceStrengths(
    overallCaptureRate, overallInfluenceRate, advocacyAccessRate,
    averageParticipationRate, childrenAwareOfRights, children.length, strongestDomains, methodBreakdown,
  );
  const areasForDevelopment = generateVoiceDevelopment(
    overallCaptureRate, overallInfluenceRate, advocacyAccessRate,
    averageParticipationRate, childrenAwareOfRights, children.length, weakestDomains, childResults,
  );
  const immediateActions = generateVoiceActions(childResults, advocacyAccessRate, children.length, weakestDomains);
  const regulatoryLinks = generateVoiceRegulatoryLinks(
    advocacyAccessRate, childResults, overallCaptureRate,
  );

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    totalVoiceEntries: periodEntries.length,
    overallCaptureRate,
    overallInfluenceRate,
    domainCapture,
    weakestDomains,
    strongestDomains,
    childResults,
    advocacyAccessRate,
    independentVisitorRate,
    averageParticipationRate,
    childrenAwareOfRights,
    methodBreakdown,
    strengths,
    areasForDevelopment,
    immediateActions,
    regulatoryLinks,
  };
}

// ── Scoring ────────────────────────────────────────────────────────────────

function calculateVoiceScore(
  captureRate: number,
  influenceRate: number,
  advocacyRate: number,
  participationRate: number,
  childrenAware: number,
  totalChildren: number,
  weakestDomains: VoiceDomain[],
  childResults: ChildVoiceResult[],
): number {
  let score = 0;

  // Voice capture rate (max 30)
  score += (captureRate / 100) * 30;

  // Voice influence rate (max 25)
  score += (influenceRate / 100) * 25;

  // Advocacy access (max 15)
  score += (advocacyRate / 100) * 10;
  if (totalChildren > 0) {
    score += (childrenAware / totalChildren) * 5;
  }

  // Participation (max 15)
  score += (participationRate / 100) * 15;

  // Consistency bonus (max 15)
  if (weakestDomains.length === 0) score += 15;
  else if (weakestDomains.length <= 1) score += 10;
  else if (weakestDomains.length <= 2) score += 5;

  // Penalties
  const tokenistic = childResults.filter(
    (c) => c.voiceRecordedRate > 60 && c.influenceRate < 20 && c.totalEntries >= 3,
  );
  score -= tokenistic.length * 5;

  const noAdvocate = childResults.filter((c) => !c.hasAdvocate);
  score -= noAdvocate.length * 3;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getVoiceRating(score: number): "outstanding" | "good" | "requires_improvement" | "inadequate" {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Insight Generation ─────────────────────────────────────────────────────

function generateVoiceStrengths(
  captureRate: number,
  influenceRate: number,
  advocacyRate: number,
  participationRate: number,
  childrenAware: number,
  totalChildren: number,
  strongestDomains: VoiceDomain[],
  methodBreakdown: { method: VoiceMethod; count: number }[],
): string[] {
  const strengths: string[] = [];

  if (captureRate >= 85) {
    strengths.push("Children's voices are consistently captured across the home — embedded in daily practice");
  }
  if (influenceRate >= 70) {
    strengths.push("Children's views demonstrably influence decisions — evidence of child-centred practice");
  }
  if (advocacyRate === 100 && totalChildren > 0) {
    strengths.push("All children have access to an independent advocate — Reg 7(2)(b) fully met");
  }
  if (participationRate >= 90) {
    strengths.push("Excellent participation rates in reviews and meetings — children are active partners in their care");
  }
  if (childrenAware === totalChildren && totalChildren > 0) {
    strengths.push("All children are aware of their rights, including how to complain — empowering practice");
  }
  if (strongestDomains.length > 0) {
    strengths.push(
      `Strong voice capture in: ${strongestDomains.map((d) => d.replace(/_/g, " ")).join(", ")}`,
    );
  }
  if (methodBreakdown.length >= 3) {
    strengths.push("Multiple voice capture methods used — adapted to individual communication needs");
  }

  return strengths;
}

function generateVoiceDevelopment(
  captureRate: number,
  influenceRate: number,
  advocacyRate: number,
  participationRate: number,
  childrenAware: number,
  totalChildren: number,
  weakestDomains: VoiceDomain[],
  childResults: ChildVoiceResult[],
): string[] {
  const areas: string[] = [];

  if (captureRate < 70) {
    areas.push(`Overall voice capture rate is ${captureRate}% — embed routine voice recording in all interactions`);
  }
  if (influenceRate < 50) {
    areas.push(`Voice influence rate is ${influenceRate}% — ensure children's views are not just recorded but demonstrably acted upon`);
  }
  if (advocacyRate < 100 && totalChildren > 0) {
    areas.push("Not all children have access to an independent advocate — Reg 7(2)(b) compliance gap");
  }
  if (totalChildren > 0 && childrenAware < totalChildren) {
    areas.push(`${totalChildren - childrenAware} child(ren) not recorded as aware of their rights — review communication approach`);
  }
  if (participationRate < 75) {
    areas.push(`Average participation rate is ${participationRate}% — review barriers to attendance and engagement`);
  }
  if (weakestDomains.length > 0) {
    areas.push(
      `Voice capture below 60% in: ${weakestDomains.map((d) => d.replace(/_/g, " ")).join(", ")} — prioritise these domains`,
    );
  }

  const tokenistic = childResults.filter(
    (c) => c.voiceRecordedRate > 60 && c.influenceRate < 20 && c.totalEntries >= 3,
  );
  if (tokenistic.length > 0) {
    areas.push(
      `Tokenistic voice recording detected for ${tokenistic.map((c) => c.childName).join(", ")} — voice recorded but rarely influences decisions`,
    );
  }

  return areas;
}

function generateVoiceActions(
  childResults: ChildVoiceResult[],
  advocacyRate: number,
  totalChildren: number,
  weakestDomains: VoiceDomain[],
): string[] {
  const actions: string[] = [];

  // Children without advocates
  const noAdvocate = childResults.filter((c) => !c.hasAdvocate);
  if (noAdvocate.length > 0) {
    actions.push(
      `HIGH: ${noAdvocate.map((c) => c.childName).join(", ")} — no independent advocate assigned. Arrange advocacy access (Reg 7(2)(b)).`,
    );
  }

  // Children not aware of rights
  const notAware = childResults.filter((c) => c.concerns.some((con) => con.includes("not recorded as aware")));
  if (notAware.length > 0) {
    actions.push(
      `MEDIUM: ${notAware.map((c) => c.childName).join(", ")} — not recorded as aware of their rights. Schedule age-appropriate rights explanation.`,
    );
  }

  // Tokenistic practice
  const tokenistic = childResults.filter(
    (c) => c.voiceRecordedRate > 60 && c.influenceRate < 20 && c.totalEntries >= 3,
  );
  if (tokenistic.length > 0) {
    actions.push(
      `HIGH: Tokenistic voice practice for ${tokenistic.map((c) => c.childName).join(", ")} — voice recorded but not demonstrably influencing decisions. Review with supervising social worker.`,
    );
  }

  // Not invited to meetings
  const notInvited = childResults.filter(
    (c) => c.concerns.some((con) => con.includes("not invited")),
  );
  if (notInvited.length > 0) {
    actions.push(
      `MEDIUM: ${notInvited.map((c) => c.childName).join(", ")} — not invited to at least one review. Ensure participation rights upheld.`,
    );
  }

  // Weak domains
  if (weakestDomains.length > 0) {
    actions.push(
      `MEDIUM: Voice capture below 60% in ${weakestDomains.map((d) => d.replace(/_/g, " ")).join(", ")}. Embed voice prompts in recording templates.`,
    );
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Children's voices are well-captured, heard, and acted upon.");
  }

  return actions;
}

function generateVoiceRegulatoryLinks(
  advocacyRate: number,
  childResults: ChildVoiceResult[],
  captureRate: number,
): string[] {
  const links = new Set<string>();

  links.add("CHR 2015, Reg 7 — Children's wishes and feelings");
  links.add("SCCIF: All judgement areas — Evidence of child's voice");

  links.add("CHR 2015, Reg 4(1)(a) — Quality of care centred on child's views");
  links.add("Children Act 1989, s22(4) — Duty to ascertain wishes and feelings");

  if (advocacyRate < 100) {
    links.add("CHR 2015, Reg 7(2)(b) — Access to independent advocacy");
  }

  if (childResults.some((c) => c.concerns.some((con) => con.includes("not invited")))) {
    links.add("Care Planning Regulations 2010, Reg 7 — Child to participate in reviews");
  }

  if (captureRate < 70) {
    links.add("UNCRC Article 12 — Right to express views and be heard");
    links.add("Working Together 2023 — Child-centred approach");
  }

  return [...links];
}

// ── Utility: Labels ────────────────────────────────────────────────────────

export function getVoiceDomainLabel(domain: VoiceDomain): string {
  const labels: Record<VoiceDomain, string> = {
    daily_log: "Daily Log",
    key_work_session: "Key Work Session",
    lac_review: "LAC Review",
    care_plan_review: "Care Plan Review",
    contact_session: "Contact Session",
    incident_report: "Incident Report",
    complaint: "Complaint",
    house_meeting: "House Meeting",
    risk_assessment: "Risk Assessment",
    placement_plan: "Placement Plan",
    behaviour_support: "Behaviour Support",
    health_appointment: "Health Appointment",
    education_review: "Education Review",
    independence_planning: "Independence Planning",
    transition_planning: "Transition Planning",
  };
  return labels[domain];
}

export function getVoiceMethodLabel(method: VoiceMethod): string {
  const labels: Record<VoiceMethod, string> = {
    direct_verbal: "Direct Verbal",
    written_by_child: "Written by Child",
    staff_observed: "Staff Observed",
    advocacy_supported: "Advocacy Supported",
    interpreter_assisted: "Interpreter Assisted",
    picture_exchange: "Picture Exchange",
    digital_tool: "Digital Tool",
    body_language: "Body Language",
    behaviour_as_communication: "Behaviour as Communication",
    not_recorded: "Not Recorded",
  };
  return labels[method];
}

export function getInfluenceLabel(influence: VoiceInfluence): string {
  const labels: Record<VoiceInfluence, string> = {
    directly_influenced: "Directly Influenced",
    partially_influenced: "Partially Influenced",
    acknowledged_not_acted: "Acknowledged, Not Acted Upon",
    not_acknowledged: "Not Acknowledged",
    not_applicable: "N/A",
  };
  return labels[influence];
}
