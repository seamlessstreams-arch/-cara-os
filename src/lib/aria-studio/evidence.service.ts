// ══════════════════════════════════════════════════════════════════════════════
// ARIA STUDIO — EVIDENCE CONFIDENCE SERVICE
// Scores evidence quality for transparency and trust.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import type { AriaStudioEvidenceAssessment, AriaStudioConfidenceLevel, AriaStudioSource } from "@/types/aria-studio";

export async function assessEvidence(source: AriaStudioSource): Promise<AriaStudioEvidenceAssessment> {
  // Relevance: has meaningful content
  const relevance = source.content || source.summary ? 80 : 30;

  // Recency: how recent is the source
  let recency = 50;
  if (source.source_date) {
    const daysSince = Math.floor((Date.now() - new Date(source.source_date).getTime()) / 86400000);
    if (daysSince <= 7) recency = 100;
    else if (daysSince <= 30) recency = 80;
    else if (daysSince <= 90) recency = 60;
    else if (daysSince <= 180) recency = 40;
    else recency = 20;
  }

  // Reliability: based on source type
  const reliabilityMap: Record<string, number> = {
    incident: 90, safeguarding: 95, risk_assessment: 90,
    care_plan: 85, placement_plan: 85, daily_log: 75,
    keywork: 80, direct_work: 80, management_oversight: 90,
    supervision: 85, team_meeting: 70, complaint: 85,
    reg45: 90, annex_a: 90, medication: 85, health: 80,
    education: 75, missing_from_care: 90, staff_training: 70,
    handover: 65, rota: 60, task: 60, policy: 70,
    uploaded_document: 50, ofsted_evidence: 85,
  };
  const reliability = reliabilityMap[source.source_type] ?? 50;

  // Approval: is it approved
  const approval = source.approval_status === "approved" ? 100 : source.approval_status === "pending" ? 50 : 20;

  // Child voice: does it contain child voice
  const hasChildVoice = [source.summary, source.content, source.extracted_text]
    .filter(Boolean).join(" ").toLowerCase();
  const childVoice = (hasChildVoice.includes("child said") || hasChildVoice.includes("child voice") ||
    hasChildVoice.includes("wishes") || hasChildVoice.includes("feelings") ||
    hasChildVoice.includes("young person said")) ? 100 : 0;

  // Contradiction: none detected by default
  const contradiction = 0;
  const corroboration = 50; // Default — would need cross-reference to calculate properly

  const overall = Math.round(
    (relevance * 0.2) + (recency * 0.2) + (reliability * 0.2) +
    (approval * 0.15) + (corroboration * 0.1) + (childVoice * 0.1) +
    ((100 - contradiction) * 0.05),
  );

  const level = calculateLevel(overall);

  const assessment: AriaStudioEvidenceAssessment = {
    id: crypto.randomUUID(),
    source_id: source.id,
    relevance_score: relevance,
    recency_score: recency,
    reliability_score: reliability,
    approval_score: approval,
    corroboration_score: corroboration,
    child_voice_score: childVoice,
    contradiction_score: contradiction,
    overall_confidence_score: overall,
    evidence_level: level,
    assessment_notes: buildAssessmentNotes(level, childVoice, recency),
    created_at: new Date().toISOString(),
  };

  // Persist if possible
  const sb = createServerClient();
  if (sb) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (sb.from("aria_studio_evidence_assessments") as any).insert({
        source_id: source.id,
        relevance_score: assessment.relevance_score,
        recency_score: assessment.recency_score,
        reliability_score: assessment.reliability_score,
        approval_score: assessment.approval_score,
        corroboration_score: assessment.corroboration_score,
        child_voice_score: assessment.child_voice_score,
        contradiction_score: assessment.contradiction_score,
        overall_confidence_score: assessment.overall_confidence_score,
        evidence_level: assessment.evidence_level,
        assessment_notes: assessment.assessment_notes,
      });
    } catch { /* non-blocking */ }
  }

  return assessment;
}

export async function assessMultipleSources(
  sources: AriaStudioSource[],
): Promise<AriaStudioEvidenceAssessment[]> {
  return Promise.all(sources.map((s) => assessEvidence(s)));
}

export function calculateOverallConfidence(
  assessments: AriaStudioEvidenceAssessment[],
): AriaStudioConfidenceLevel {
  if (!assessments.length) return "missing";
  const avg = assessments.reduce((sum, a) => sum + (a.overall_confidence_score ?? 0), 0) / assessments.length;
  return calculateLevel(avg);
}

function calculateLevel(score: number): AriaStudioConfidenceLevel {
  if (score >= 80) return "high";
  if (score >= 60) return "medium";
  if (score >= 40) return "low";
  return "unverified";
}

function buildAssessmentNotes(level: AriaStudioConfidenceLevel, childVoice: number, recency: number): string {
  const parts: string[] = [];
  if (level === "high") parts.push("High confidence: this evidence is recent, approved, and relevant.");
  else if (level === "medium") parts.push("Medium confidence: this evidence has some limitations — review for completeness.");
  else parts.push("Low confidence: this evidence may be outdated, unapproved, or incomplete.");

  if (childVoice === 0) parts.push("The child's own view has not yet been recorded in this source.");
  if (recency < 40) parts.push("This evidence is more than 6 months old — check if it is still current.");

  return parts.join(" ");
}
