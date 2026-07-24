// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence Engine — Complaints & Representations
//
// Pure deterministic analysis of complaints for LAC in residential care.
// Tracks:
//   - Complaint frequency and resolution times
//   - Theme analysis (what children complain about)
//   - Satisfaction with outcomes
//   - Accessibility of complaints process
//   - Escalation patterns (to Ofsted, IRO, advocate)
//   - Representation quality (child's voice being heard)
//
// Regulatory alignment:
//   - CHR 2015 Reg 39 — Complaints and representations
//   - CHR 2015 Reg 39(3) — Accessible to children
//   - CHR 2015 Reg 39(4) — Records and monitoring
//   - SCCIF — Children's voice
//
// No AI calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────────────────────

import { meanOf } from "@/lib/metrics/rate";

export type ComplaintStatus = "open" | "investigating" | "resolved" | "escalated" | "withdrawn";

export type ComplaintCategory =
  | "food"
  | "privacy"
  | "peers"
  | "staff_behaviour"
  | "sanctions"
  | "contact_arrangements"
  | "activities"
  | "environment"
  | "education"
  | "personal_belongings"
  | "medication"
  | "safety"
  | "discrimination"
  | "other";

export type EscalationLevel = "internal" | "registered_manager" | "responsible_individual" | "ofsted" | "advocate" | "iro";

export interface Complaint {
  id: string;
  date: string; // ISO date filed
  category: ComplaintCategory;
  description: string;
  status: ComplaintStatus;
  resolvedDate?: string;
  resolutionDays?: number;
  outcome?: string;
  childSatisfied?: boolean;
  acknowledgedWithin24Hours: boolean;
  investigatedProperly: boolean;
  childKeptInformed: boolean;
  escalationLevel: EscalationLevel;
  escalatedToOfsted?: boolean;
  advocateInvolved: boolean;
  madeBy: "child" | "parent" | "social_worker" | "advocate" | "other";
  againstWhom?: string;
  actionTaken?: string;
  lessonLearned?: string;
}

export interface ComplaintsInput {
  childId: string;
  childName: string;
  age: number;
  complaints: Complaint[];
  complaintsProcessExplained: boolean;
  childKnowsHowToComplain: boolean;
  advocateAvailable: boolean;
  complaintsDisplayedAccessibly: boolean;
  independentVisitorAssigned: boolean;
  regulatoryBodyInfoProvided: boolean; // Ofsted contact info given
  complaintsReviewedByRM: boolean;
  lastComplaintsAuditDate?: string;
}

export interface ComplaintsAssessment {
  childName: string;
  overallScore: number | null;
  overallRating: "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate" | null;
  accessibilityScore: number;
  responsivenessScore: number | null;
  resolutionScore: number | null;
  voiceScore: number;
  totalComplaints: number;
  openComplaints: number;
  resolvedComplaints: number;
  averageResolutionDays: number;
  satisfactionRate: number;
  complaintsLast30Days: number;
  complaintsLast90Days: number;
  themes: ComplaintTheme[];
  concerns: ComplaintConcern[];
  strengths: ComplaintStrength[];
  regulatoryFlags: RegulatoryFlag[];
  recommendations: string[];
  summary: string;
}

export interface ComplaintTheme {
  category: ComplaintCategory;
  count: number;
  percentage: number;
  resolved: number;
  avgResolutionDays: number;
}

export interface ComplaintConcern {
  severity: "critical" | "significant" | "moderate" | "low";
  category: string;
  description: string;
}

export interface ComplaintStrength {
  category: string;
  description: string;
}

export interface RegulatoryFlag {
  regulation: string;
  area: string;
  status: "met" | "partially_met" | "not_met";
  detail: string;
}

// ── Main Engine ─────────────────────────────────────────────────────────────

export function analyseComplaints(input: ComplaintsInput): ComplaintsAssessment {
  const { childName, complaints } = input;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000).toISOString().slice(0, 10);

  // ── Counts ────────────────────────────────────────────────────────────
  const totalComplaints = complaints.length;
  const openComplaints = complaints.filter(c => c.status === "open" || c.status === "investigating").length;
  const resolvedComplaints = complaints.filter(c => c.status === "resolved").length;
  const complaintsLast30 = complaints.filter(c => c.date >= thirtyDaysAgo && c.date.slice(0, 10) <= today).length;
  const complaintsLast90 = complaints.filter(c => c.date >= ninetyDaysAgo && c.date.slice(0, 10) <= today).length;

  // ── Resolution times ──────────────────────────────────────────────────
  const resolved = complaints.filter(c => c.resolutionDays !== undefined);
  const avgResolutionDays = resolved.length > 0
    ? Math.round(resolved.reduce((a, c) => a + (c.resolutionDays ?? 0), 0) / resolved.length)
    : 0;

  // ── Satisfaction ──────────────────────────────────────────────────────
  const withSatisfaction = complaints.filter(c => c.childSatisfied !== undefined);
  const satisfiedCount = withSatisfaction.filter(c => c.childSatisfied).length;
  const satisfactionRate = withSatisfaction.length > 0
    ? satisfiedCount / withSatisfaction.length
    : 1; // no complaints = assume fine

  // ── Themes ────────────────────────────────────────────────────────────
  const themes = analyseThemes(complaints);

  // ── Scores ────────────────────────────────────────────────────────────
  const accessibilityScore = scoreAccessibility(input);
  const responsivenessScore = scoreResponsiveness(complaints);
  const resolutionScore = scoreResolution(complaints, avgResolutionDays, satisfactionRate);
  const voiceScore = scoreVoice(input, complaints);

  // ── Overall ───────────────────────────────────────────────────────────
  const overallScore = meanOf([accessibilityScore, responsivenessScore, resolutionScore, voiceScore]);
  const overallRating = scoreToRating(overallScore);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns = identifyConcerns(input, complaints, avgResolutionDays, satisfactionRate, openComplaints, themes);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths = identifyStrengths(input, complaints, satisfactionRate, avgResolutionDays);

  // ── Regulatory flags ──────────────────────────────────────────────────
  const regulatoryFlags = assessRegulatory(input, complaints, avgResolutionDays, openComplaints);

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations = buildRecommendations(input, complaints, avgResolutionDays, satisfactionRate, openComplaints, themes);

  // ── Summary ───────────────────────────────────────────────────────────
  const summary = buildSummary(childName, totalComplaints, openComplaints, avgResolutionDays, overallRating);

  return {
    childName,
    overallScore,
    overallRating,
    accessibilityScore,
    responsivenessScore,
    resolutionScore,
    voiceScore,
    totalComplaints,
    openComplaints,
    resolvedComplaints,
    averageResolutionDays: avgResolutionDays,
    satisfactionRate: Math.round(satisfactionRate * 100) / 100,
    complaintsLast30Days: complaintsLast30,
    complaintsLast90Days: complaintsLast90,
    themes,
    concerns,
    strengths,
    regulatoryFlags,
    recommendations,
    summary,
  };
}

// ── Theme Analysis ──────────────────────────────────────────────────────────

function analyseThemes(complaints: Complaint[]): ComplaintTheme[] {
  if (complaints.length === 0) return [];

  const categoryMap: Record<string, Complaint[]> = {};
  complaints.forEach(c => {
    if (!categoryMap[c.category]) categoryMap[c.category] = [];
    categoryMap[c.category].push(c);
  });

  return Object.entries(categoryMap)
    .map(([category, comps]) => {
      const resolved = comps.filter(c => c.status === "resolved");
      const withDays = resolved.filter(c => c.resolutionDays !== undefined);
      const avgDays = withDays.length > 0
        ? Math.round(withDays.reduce((a, c) => a + (c.resolutionDays ?? 0), 0) / withDays.length)
        : 0;
      return {
        category: category as ComplaintCategory,
        count: comps.length,
        percentage: Math.round((comps.length / complaints.length) * 100),
        resolved: resolved.length,
        avgResolutionDays: avgDays,
      };
    })
    .sort((a, b) => b.count - a.count);
}

// ── Scoring ─────────────────────────────────────────────────────────────────

function scoreAccessibility(input: ComplaintsInput): number {
  let score = 0;
  if (input.complaintsProcessExplained) score += 20;
  if (input.childKnowsHowToComplain) score += 25;
  if (input.advocateAvailable) score += 15;
  if (input.complaintsDisplayedAccessibly) score += 15;
  if (input.independentVisitorAssigned) score += 10;
  if (input.regulatoryBodyInfoProvided) score += 15;
  return Math.min(100, score);
}

function scoreResponsiveness(complaints: Complaint[]): number | null {
  if (complaints.length === 0) return null;

  let total = 0;
  for (const c of complaints) {
    let cScore = 100;
    if (!c.acknowledgedWithin24Hours) cScore -= 30;
    if (!c.childKeptInformed) cScore -= 25;
    if (!c.investigatedProperly) cScore -= 30;
    total += Math.max(0, cScore);
  }
  return Math.round(total / complaints.length);
}

function scoreResolution(complaints: Complaint[], avgDays: number, satisfactionRate: number): number | null {
  if (complaints.length === 0) return null;

  let score = 100;

  // Timeliness (aim for <14 days)
  if (avgDays > 28) score -= 40;
  else if (avgDays > 14) score -= 20;
  else if (avgDays > 7) score -= 5;

  // Open complaints lingering
  const open = complaints.filter(c => c.status === "open" || c.status === "investigating");
  const longOpen = open.filter(c => {
    const daysSince = Math.floor((Date.now() - new Date(c.date).getTime()) / 86400000);
    return daysSince > 14;
  });
  if (longOpen.length > 0) score -= longOpen.length * 10;

  // Satisfaction
  score -= Math.round((1 - satisfactionRate) * 30);

  return Math.max(0, Math.min(100, score));
}

function scoreVoice(input: ComplaintsInput, complaints: Complaint[]): number {
  let score = 0;

  // Child knows how to complain (30 pts)
  if (input.childKnowsHowToComplain) score += 30;

  // Advocate involved when needed (25 pts)
  if (input.advocateAvailable) score += 15;
  const advocateUsed = complaints.some(c => c.advocateInvolved);
  if (advocateUsed || complaints.length === 0) score += 10;

  // Child kept informed (25 pts)
  if (complaints.length > 0) {
    const informed = complaints.filter(c => c.childKeptInformed).length;
    score += Math.round((informed / complaints.length) * 25);
  } else {
    score += 25;
  }

  // Independent visitor (10 pts)
  if (input.independentVisitorAssigned) score += 10;

  // Child-made complaints exist (they feel able to) (10 pts)
  const childMade = complaints.filter(c => c.madeBy === "child").length;
  if (childMade > 0 || input.childKnowsHowToComplain) score += 10;

  return Math.min(100, score);
}

// ── Concerns ────────────────────────────────────────────────────────────────

function identifyConcerns(
  input: ComplaintsInput,
  complaints: Complaint[],
  avgDays: number,
  satisfactionRate: number,
  openCount: number,
  themes: ComplaintTheme[],
): ComplaintConcern[] {
  const concerns: ComplaintConcern[] = [];

  // Child doesn't know how to complain
  if (!input.childKnowsHowToComplain) {
    concerns.push({
      severity: "significant",
      category: "accessibility",
      description: "Child does not know how to make a complaint",
    });
  }

  // Slow resolution
  if (avgDays > 28) {
    concerns.push({
      severity: "significant",
      category: "timeliness",
      description: `Average resolution time of ${avgDays} days — exceeds good practice standard`,
    });
  } else if (avgDays > 14) {
    concerns.push({
      severity: "moderate",
      category: "timeliness",
      description: `Average resolution time of ${avgDays} days — room for improvement`,
    });
  }

  // Open complaints
  if (openCount >= 3) {
    concerns.push({
      severity: "significant",
      category: "backlog",
      description: `${openCount} complaints currently open/investigating`,
    });
  } else if (openCount >= 2) {
    concerns.push({
      severity: "moderate",
      category: "backlog",
      description: `${openCount} complaints currently open`,
    });
  }

  // Low satisfaction
  if (satisfactionRate < 0.5 && complaints.filter(c => c.childSatisfied !== undefined).length >= 3) {
    concerns.push({
      severity: "significant",
      category: "satisfaction",
      description: `Only ${Math.round(satisfactionRate * 100)}% satisfaction with complaint outcomes`,
    });
  }

  // Safety/discrimination themes
  const safetyTheme = themes.find(t => t.category === "safety");
  if (safetyTheme && safetyTheme.count >= 2) {
    concerns.push({
      severity: "critical",
      category: "safeguarding",
      description: `${safetyTheme.count} complaints about safety — requires immediate investigation`,
    });
  }

  const discrimTheme = themes.find(t => t.category === "discrimination");
  if (discrimTheme && discrimTheme.count >= 1) {
    concerns.push({
      severity: "significant",
      category: "equality",
      description: `${discrimTheme.count} complaint(s) about discrimination`,
    });
  }

  // Staff behaviour pattern
  const staffTheme = themes.find(t => t.category === "staff_behaviour");
  if (staffTheme && staffTheme.count >= 3) {
    concerns.push({
      severity: "significant",
      category: "staff",
      description: `Repeat complaints about staff behaviour (${staffTheme.count})`,
    });
  }

  // Not acknowledged within 24h
  const notAcknowledged = complaints.filter(c => !c.acknowledgedWithin24Hours).length;
  if (notAcknowledged > 0 && complaints.length > 0 && notAcknowledged / complaints.length > 0.3) {
    concerns.push({
      severity: "moderate",
      category: "responsiveness",
      description: `${Math.round(notAcknowledged / complaints.length * 100)}% of complaints not acknowledged within 24 hours`,
    });
  }

  // No complaints audit
  if (!input.lastComplaintsAuditDate && complaints.length >= 3) {
    concerns.push({
      severity: "moderate",
      category: "oversight",
      description: "No complaints audit recorded — patterns may be missed",
    });
  }

  // Regulatory body info not provided
  if (!input.regulatoryBodyInfoProvided) {
    concerns.push({
      severity: "moderate",
      category: "accessibility",
      description: "Child not informed of how to contact Ofsted directly",
    });
  }

  return concerns;
}

// ── Strengths ───────────────────────────────────────────────────────────────

function identifyStrengths(
  input: ComplaintsInput,
  complaints: Complaint[],
  satisfactionRate: number,
  avgDays: number,
): ComplaintStrength[] {
  const strengths: ComplaintStrength[] = [];

  if (input.childKnowsHowToComplain && input.complaintsProcessExplained) {
    strengths.push({
      category: "accessibility",
      description: "Child informed of and understands complaints process",
    });
  }

  if (avgDays > 0 && avgDays <= 7 && complaints.filter(c => c.status === "resolved").length > 0) {
    strengths.push({
      category: "timeliness",
      description: "Complaints resolved promptly (average under 7 days)",
    });
  }

  if (satisfactionRate >= 0.8 && complaints.filter(c => c.childSatisfied !== undefined).length >= 2) {
    strengths.push({
      category: "satisfaction",
      description: "High satisfaction with complaint outcomes",
    });
  }

  if (complaints.length > 0 && complaints.every(c => c.acknowledgedWithin24Hours)) {
    strengths.push({
      category: "responsiveness",
      description: "All complaints acknowledged within 24 hours",
    });
  }

  if (input.advocateAvailable && input.independentVisitorAssigned) {
    strengths.push({
      category: "independence",
      description: "Advocate and independent visitor in place",
    });
  }

  if (input.complaintsReviewedByRM) {
    strengths.push({
      category: "oversight",
      description: "Complaints reviewed by Registered Manager for patterns",
    });
  }

  // Child feels able to complain (evidence: they've made complaints)
  const childMade = complaints.filter(c => c.madeBy === "child").length;
  if (childMade > 0) {
    strengths.push({
      category: "empowerment",
      description: "Child feels able to make complaints directly",
    });
  }

  return strengths;
}

// ── Regulatory Flags ────────────────────────────────────────────────────────

function assessRegulatory(
  input: ComplaintsInput,
  complaints: Complaint[],
  avgDays: number,
  openCount: number,
): RegulatoryFlag[] {
  const flags: RegulatoryFlag[] = [];

  // Reg 39(3) — Accessible to children
  const accessible = input.childKnowsHowToComplain && input.complaintsProcessExplained && input.complaintsDisplayedAccessibly;
  flags.push({
    regulation: "CHR 2015 Reg 39(3)",
    area: "Accessibility",
    status: accessible ? "met" : input.childKnowsHowToComplain ? "partially_met" : "not_met",
    detail: accessible
      ? "Complaints process accessible to children"
      : "Complaints process not fully accessible — child awareness gaps",
  });

  // Reg 39 — Complaints handling
  const allAcknowledged = complaints.length === 0 || complaints.every(c => c.acknowledgedWithin24Hours);
  const allInvestigated = complaints.length === 0 || complaints.every(c => c.investigatedProperly);
  flags.push({
    regulation: "CHR 2015 Reg 39",
    area: "Complaints Handling",
    status: (allAcknowledged && allInvestigated && avgDays <= 28) ? "met" :
      (avgDays > 28 || openCount >= 3) ? "not_met" : "partially_met",
    detail: (allAcknowledged && allInvestigated && avgDays <= 28)
      ? "Complaints handled appropriately and timely"
      : "Complaints handling requires improvement",
  });

  // Reg 39(4) — Records
  flags.push({
    regulation: "CHR 2015 Reg 39(4)",
    area: "Records & Monitoring",
    status: input.complaintsReviewedByRM ? "met" : "partially_met",
    detail: input.complaintsReviewedByRM
      ? "Complaints records reviewed for patterns"
      : "Complaints not evidenced as reviewed for patterns",
  });

  // SCCIF — Children's voice
  const voiceGood = input.childKnowsHowToComplain && input.advocateAvailable;
  flags.push({
    regulation: "SCCIF",
    area: "Children's Voice",
    status: voiceGood ? "met" : input.childKnowsHowToComplain ? "partially_met" : "not_met",
    detail: voiceGood
      ? "Children's voice actively promoted through complaints process"
      : "Children's voice needs stronger support in complaints process",
  });

  return flags;
}

// ── Recommendations ─────────────────────────────────────────────────────────

function buildRecommendations(
  input: ComplaintsInput,
  complaints: Complaint[],
  avgDays: number,
  satisfactionRate: number,
  openCount: number,
  themes: ComplaintTheme[],
): string[] {
  const recs: string[] = [];

  if (!input.childKnowsHowToComplain) {
    recs.push("Explain complaints process to child in age-appropriate way");
  }

  if (!input.complaintsDisplayedAccessibly) {
    recs.push("Display complaints information accessibly in communal areas");
  }

  if (!input.regulatoryBodyInfoProvided) {
    recs.push("Provide child with Ofsted contact information");
  }

  if (!input.advocateAvailable) {
    recs.push("Ensure independent advocate is available to support with complaints");
  }

  if (avgDays > 14) {
    recs.push("Improve complaint resolution times — aim for under 14 days");
  }

  if (openCount >= 2) {
    recs.push("Address open complaints as priority — ensure timely resolution");
  }

  if (satisfactionRate < 0.6 && complaints.filter(c => c.childSatisfied !== undefined).length >= 2) {
    recs.push("Review why child is dissatisfied with outcomes — consider restorative approaches");
  }

  const staffTheme = themes.find(t => t.category === "staff_behaviour");
  if (staffTheme && staffTheme.count >= 2) {
    recs.push("Address repeat complaints about staff behaviour through supervision");
  }

  if (!input.complaintsReviewedByRM) {
    recs.push("Registered Manager to regularly review complaints for patterns");
  }

  if (!input.independentVisitorAssigned) {
    recs.push("Consider assigning independent visitor to support child's voice");
  }

  return recs;
}

// ── Summary ─────────────────────────────────────────────────────────────────

function buildSummary(
  childName: string,
  total: number,
  open: number,
  avgDays: number,
  rating: string | null,
): string {
  if (total === 0) {
    return `${childName}: No complaints recorded. Complaints process should remain accessible and child encouraged to raise concerns.`;
  }
  const openDesc = open > 0 ? `${open} currently open.` : "All resolved.";
  const timeDesc = avgDays > 0 ? `Average resolution: ${avgDays} days.` : "";
  const ratingDesc = rating ? ` Rating: ${rating.replace(/_/g, " ")}.` : "";
  return `${childName}: ${total} complaint${total > 1 ? "s" : ""} recorded. ${openDesc} ${timeDesc}${ratingDesc}`.trim();
}

// ── Utility ─────────────────────────────────────────────────────────────────

function scoreToRating(score: number | null): "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate" | null {
  if (score === null) return null;
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 55) return "adequate";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}
