// ══════════════════════════════════════════════════════════════════════════════
// Cara — CHALLENGE MODE SERVICE
//
// Runs a comprehensive set of quality checks against a completed draft
// report. Challenges surface missing evidence, weak sections, absent child
// voice, safeguarding gaps, and patterns that a human reviewer should
// investigate before the report moves to approval.
//
// Checks are split into two passes:
//   1. Rule-based checks — deterministic, fast, always run
//   2. AI-assisted deep analysis — runs only when Supabase + AI are available
//
// Also provides generateSuggestedActions, which analyses the report and
// evidence to recommend follow-up tasks.
//
// Server-side only — never import in client components.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import type {
  ChallengeItem,
  ChallengeType,
  ChallengeSeverity,
  ChildReport,
  ChildReportSection,
  ChildReportEvidence,
  ChildReportAction,
  NormalisedEvidence,
} from "@/types/cara-reports";
import { getSectionsForReportType } from "@/lib/cara/reports/report-templates";
import type { SectionTemplate } from "@/lib/cara/reports/report-templates";
import { generateCaraJSON, generateCaraContent } from "@/lib/cara/ai/provider";
import { challengeOutputSchema } from "@/lib/cara/ai/schemas";

// ── Severity ordering for sort ────────────────────────────────────────────

const SEVERITY_ORDER: Record<ChallengeSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

function sortChallenges(items: ChallengeItem[]): ChallengeItem[] {
  return [...items].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
}

// ── Safeguarding Keywords ─────────────────────────────────────────────────

const SAFEGUARDING_KEYWORDS = [
  "safeguarding",
  "disclosure",
  "allegation",
  "exploitation",
  "CSE",
  "CCE",
  "county lines",
  "radicalisation",
  "FGM",
  "forced marriage",
  "trafficking",
  "grooming",
  "self-harm",
  "suicidal",
  "overdose",
  "sexual",
  "abuse",
  "neglect",
  "bruising",
  "injury",
  "restraint",
  "physical intervention",
];

// ── Vague / Generic Phrases ───────────────────────────────────────────────

const VAGUE_PHRASES = [
  "had a good week",
  "doing well",
  "no concerns",
  "all fine",
  "nothing to report",
  "no issues",
  "settled well",
  "continuing to progress",
  "making progress",
  "same as usual",
  "no change",
  "as expected",
];

// ══════════════════════════════════════════════════════════════════════════════
// RUN CHALLENGE MODE
// ══════════════════════════════════════════════════════════════════════════════

export async function runChallengeMode(
  reportId: string,
): Promise<ChallengeItem[]> {
  // ── Fetch report data ───────────────────────────────────────────────────
  const reportData = await fetchReportData(reportId);
  if (!reportData) {
    return [
      {
        type: "missing_evidence",
        severity: "critical",
        message: `Report ${reportId} could not be loaded for challenge analysis.`,
      },
    ];
  }

  const { report, sections, evidence } = reportData;

  // Get section templates for this report type
  const templates = getSectionsForReportType(report.report_type);

  // ── Rule-based checks ───────────────────────────────────────────────────
  const challenges: ChallengeItem[] = [];

  checkMissingChildVoice(challenges, sections, templates);
  checkWeakEvidence(challenges, sections);
  checkManagerOversight(challenges, sections, templates);
  checkIncidentsWithoutFollowUp(challenges, sections, evidence);
  checkRisksWithoutAssessment(challenges, sections, evidence);
  checkMissingSocialWorkerNotification(challenges, evidence);
  checkNoCarePlanImplications(challenges, sections);
  checkRepeatedPatterns(challenges, evidence);
  checkSafeguardingConcerns(challenges, evidence);
  checkMissingActions(challenges, sections, templates);
  checkOverlyVagueWording(challenges, sections);
  checkUnsupportedClaims(challenges, sections);

  // ── AI-assisted deep analysis (optional) ────────────────────────────────
  const sb = createServerClient();
  if (sb) {
    try {
      const aiChallenges = await runAIDeepAnalysis(report, sections, evidence);
      challenges.push(...aiChallenges);
    } catch (err) {
      console.error("[cara-challenge] AI deep analysis failed:", err);
      // Continue with rule-based challenges only
    }
  }

  // Deduplicate by message similarity
  const seen = new Set<string>();
  const deduplicated = challenges.filter((c) => {
    const key = `${c.type}::${c.sectionKey ?? "global"}::${c.message.slice(0, 80)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return sortChallenges(deduplicated);
}

// ══════════════════════════════════════════════════════════════════════════════
// RULE-BASED CHALLENGE CHECKS
// ══════════════════════════════════════════════════════════════════════════════

function checkMissingChildVoice(
  challenges: ChallengeItem[],
  sections: ChildReportSection[],
  templates: SectionTemplate[],
): void {
  const childVoiceTemplates = templates.filter((t) => t.needsChildVoice);

  for (const template of childVoiceTemplates) {
    const section = sections.find((s) => s.section_key === template.key);
    if (!section) continue;

    if (!section.child_voice_present) {
      const contentLower = (section.content ?? "").toLowerCase();
      const hasQuote = /["'“”]/.test(section.content ?? "");
      const hasChildPerspective =
        contentLower.includes("said") ||
        contentLower.includes("told") ||
        contentLower.includes("expressed") ||
        contentLower.includes("shared") ||
        contentLower.includes("in their words") ||
        contentLower.includes("in his words") ||
        contentLower.includes("in her words");

      if (!hasQuote && !hasChildPerspective) {
        challenges.push({
          type: "missing_child_voice",
          severity: "warning",
          message: `The "${template.title}" section is marked as requiring child voice but does not appear to contain any direct quotes or child perspective.`,
          sectionKey: template.key,
          suggestion:
            "Review daily logs and keywork sessions for direct quotes or child perspective to include in this section.",
        });
      }
    }
  }
}

function checkWeakEvidence(
  challenges: ChallengeItem[],
  sections: ChildReportSection[],
): void {
  for (const section of sections) {
    if (
      section.evidence_status === "not_enough_evidence" ||
      section.evidence_status === "manager_input_required"
    ) {
      challenges.push({
        type: "missing_evidence",
        severity:
          section.evidence_status === "not_enough_evidence" ? "warning" : "info",
        message: `The "${section.title}" section has evidence status "${section.evidence_status}". Content may be incomplete or require manual input.`,
        sectionKey: section.section_key,
        suggestion:
          section.evidence_status === "not_enough_evidence"
            ? "Check whether additional records exist for this period that were not captured. Consider adding manual observations."
            : "A manager should review and supplement this section with their own knowledge and observations.",
      });
    }

    if (
      section.evidence_status === "partial_evidence" &&
      (section.confidence_score ?? 0) < 40
    ) {
      challenges.push({
        type: "weak_confidence",
        severity: "warning",
        message: `The "${section.title}" section has a low confidence score of ${section.confidence_score ?? 0}% with only partial evidence.`,
        sectionKey: section.section_key,
        suggestion:
          "This section needs strengthening. Look for additional evidence or add manager observations to increase confidence.",
      });
    }
  }
}

function checkManagerOversight(
  challenges: ChallengeItem[],
  sections: ChildReportSection[],
  templates: SectionTemplate[],
): void {
  const oversightTemplate = templates.find(
    (t) => t.key === "manager_oversight" || t.key === "manager_sign_off" || t.key === "manager_analysis",
  );
  if (!oversightTemplate) return;

  const oversightSection = sections.find(
    (s) => s.section_key === oversightTemplate.key,
  );

  if (!oversightSection || !oversightSection.content || oversightSection.content.trim().length < 20) {
    challenges.push({
      type: "missing_section",
      severity: "critical",
      message:
        "The manager oversight section is empty or missing. Reports must include documented management oversight before submission.",
      sectionKey: oversightTemplate.key,
      suggestion:
        "Add manager commentary covering: quality of recording, evidence gaps identified, actions taken or planned, and any risk considerations.",
    });
  }
}

function checkIncidentsWithoutFollowUp(
  challenges: ChallengeItem[],
  sections: ChildReportSection[],
  evidence: ChildReportEvidence[],
): void {
  const incidentEvidence = evidence.filter(
    (e) => e.source_table === "incidents",
  );
  if (incidentEvidence.length === 0) return;

  // Check whether an actions section exists and has content
  const actionsSection = sections.find(
    (s) =>
      s.section_key === "actions" ||
      s.section_key === "actions_required" ||
      s.section_key === "recommended_actions" ||
      s.section_key === "recommended_next_steps",
  );

  if (!actionsSection || !actionsSection.content || actionsSection.content.trim().length < 20) {
    challenges.push({
      type: "risk_not_addressed",
      severity: "warning",
      message: `There are ${incidentEvidence.length} incident(s) linked to this report but the actions section is empty or missing. Incidents should have documented follow-up actions.`,
      sectionKey: actionsSection?.section_key ?? "actions",
      suggestion:
        "Review each incident and add follow-up actions: debrief, risk assessment update, key worker session, notification requirements, and any changes to care approach.",
    });
  }
}

function checkRisksWithoutAssessment(
  challenges: ChallengeItem[],
  sections: ChildReportSection[],
  evidence: ChildReportEvidence[],
): void {
  const incidentEvidence = evidence.filter(
    (e) => e.source_table === "incidents",
  );
  if (incidentEvidence.length === 0) return;

  const riskSection = sections.find(
    (s) =>
      s.section_key === "risk_assessment" ||
      s.section_key === "risk_and_safeguarding" ||
      s.section_key === "current_risk_profile" ||
      s.section_key === "risk_factors",
  );

  const riskEvidence = evidence.filter(
    (e) => e.source_table === "care_forms",
  );

  if (
    riskEvidence.length === 0 &&
    (!riskSection || !riskSection.content || riskSection.content.includes("not enough recorded evidence"))
  ) {
    challenges.push({
      type: "risk_not_addressed",
      severity: "critical",
      message:
        "Incidents are present in the evidence but no risk assessment evidence was found. The risk assessment section may need updating.",
      sectionKey: riskSection?.section_key ?? "risk_assessment",
      suggestion:
        "Check whether the child's risk assessment has been reviewed following recent incidents. If not, schedule a risk assessment review.",
    });
  }
}

function checkMissingSocialWorkerNotification(
  challenges: ChallengeItem[],
  evidence: ChildReportEvidence[],
): void {
  // Look for high-severity incidents
  const highSeverityIncidents = evidence.filter(
    (e) =>
      e.source_table === "incidents" &&
      (e.excerpt?.toLowerCase().includes("high") ||
        e.excerpt?.toLowerCase().includes("critical") ||
        e.excerpt?.toLowerCase().includes("serious")),
  );

  if (highSeverityIncidents.length === 0) return;

  // Check if there is any social worker communication evidence
  const swEvidence = evidence.filter(
    (e) =>
      e.source_table === "generic_records" &&
      (e.excerpt?.toLowerCase().includes("social worker") ||
        e.excerpt?.toLowerCase().includes("sw notified") ||
        e.excerpt?.toLowerCase().includes("placing authority")),
  );

  if (swEvidence.length === 0) {
    challenges.push({
      type: "safeguarding_gap",
      severity: "critical",
      message:
        "High-severity incidents are present but there is no evidence of social worker notification. Placing authorities must be informed of significant incidents.",
      suggestion:
        "Verify whether the social worker was notified. If so, add the notification record. If not, notify immediately and document the communication.",
    });
  }
}

function checkNoCarePlanImplications(
  challenges: ChallengeItem[],
  sections: ChildReportSection[],
): void {
  // Check if there are incidents/concerns but care plan section is empty
  const incidentSection = sections.find(
    (s) =>
      s.section_key === "incidents_concerns" ||
      s.section_key === "incidents_and_concerns" ||
      s.section_key === "concerns_and_risks" ||
      s.section_key === "behaviour_risk_safeguarding",
  );

  const carePlanSection = sections.find(
    (s) =>
      s.section_key === "care_plan" ||
      s.section_key === "care_plan_progress" ||
      s.section_key === "placement_plan_update" ||
      s.section_key === "care_plan_alignment",
  );

  if (!incidentSection || !carePlanSection) return;

  const hasIncidents =
    incidentSection.content &&
    incidentSection.content.trim().length > 50 &&
    !incidentSection.content.includes("no incidents") &&
    !incidentSection.content.includes("not enough recorded evidence");

  const carePlanEmpty =
    !carePlanSection.content ||
    carePlanSection.content.trim().length < 30 ||
    carePlanSection.content.includes("not enough recorded evidence");

  if (hasIncidents && carePlanEmpty) {
    challenges.push({
      type: "plan_drift",
      severity: "warning",
      message:
        "Incidents or concerns are documented in this report but the care plan section is empty. Consider whether the care plan needs updating to reflect recent events.",
      sectionKey: carePlanSection.section_key,
      suggestion:
        "Review whether the current care plan adequately addresses the incidents and concerns raised. Update targets or strategies if needed.",
    });
  }
}

function checkRepeatedPatterns(
  challenges: ChallengeItem[],
  evidence: ChildReportEvidence[],
): void {
  // Look for multiple incidents of similar type
  const incidentExcerpts = evidence
    .filter((e) => e.source_table === "incidents")
    .map((e) => (e.excerpt ?? "").toLowerCase());

  if (incidentExcerpts.length < 2) return;

  // Check for pattern keywords
  const patternKeywords = [
    "verbal",
    "physical",
    "missing",
    "absconding",
    "refusal",
    "self-harm",
    "property damage",
    "aggression",
    "substance",
  ];

  for (const keyword of patternKeywords) {
    const matchCount = incidentExcerpts.filter((e) => e.includes(keyword)).length;
    if (matchCount >= 2) {
      challenges.push({
        type: "risk_not_addressed",
        severity: "warning",
        message: `A repeated pattern of "${keyword}" incidents has been detected (${matchCount} occurrences). This may indicate an escalating concern that requires a targeted response.`,
        suggestion:
          `Review the pattern of ${keyword} incidents and consider: whether the behaviour management plan needs updating, whether a multi-agency discussion is warranted, and whether there are underlying triggers that need addressing.`,
      });
      break; // One pattern challenge per run to avoid noise
    }
  }
}

function checkSafeguardingConcerns(
  challenges: ChallengeItem[],
  evidence: ChildReportEvidence[],
): void {
  for (const item of evidence) {
    const text = ((item.excerpt ?? "") + " " + (item.reasoning ?? "")).toLowerCase();
    for (const keyword of SAFEGUARDING_KEYWORDS) {
      if (text.includes(keyword.toLowerCase())) {
        challenges.push({
          type: "safeguarding_gap",
          severity: "critical",
          message: `Safeguarding-related content detected in evidence (keyword: "${keyword}"). Ensure this has been properly assessed, documented, and escalated where required.`,
          suggestion:
            "Verify that safeguarding procedures have been followed: designated safeguarding lead informed, threshold assessment completed, referral made if required, and outcome recorded.",
        });
        return; // One safeguarding flag is enough — manager must review
      }
    }
  }
}

function checkMissingActions(
  challenges: ChallengeItem[],
  sections: ChildReportSection[],
  templates: SectionTemplate[],
): void {
  const actionsTemplate = templates.find(
    (t) =>
      t.key === "actions" ||
      t.key === "actions_required" ||
      t.key === "recommended_actions" ||
      t.key === "recommended_next_steps",
  );
  if (!actionsTemplate) return;

  const actionsSection = sections.find(
    (s) => s.section_key === actionsTemplate.key,
  );

  if (
    !actionsSection ||
    !actionsSection.content ||
    actionsSection.content.trim().length < 20 ||
    actionsSection.content.includes("not enough recorded evidence")
  ) {
    challenges.push({
      type: "missing_section",
      severity: "warning",
      message:
        "The actions section is empty or missing. Every report should include clear, assigned follow-up actions.",
      sectionKey: actionsTemplate.key,
      suggestion:
        "Add specific, measurable actions with assigned owners and due dates. Consider what needs to happen before the next reporting period.",
    });
  }
}

function checkOverlyVagueWording(
  challenges: ChallengeItem[],
  sections: ChildReportSection[],
): void {
  for (const section of sections) {
    if (!section.content) continue;

    const contentLower = section.content.toLowerCase();

    // Check for very short content (under 50 characters is suspiciously thin)
    if (
      section.content.trim().length > 0 &&
      section.content.trim().length < 50 &&
      !section.content.includes("not enough recorded evidence")
    ) {
      challenges.push({
        type: "unsupported_claim",
        severity: "info",
        message: `The "${section.title}" section is very short (${section.content.trim().length} characters). Consider whether it provides sufficient detail for the reader.`,
        sectionKey: section.section_key,
        suggestion:
          "Expand this section with specific evidence, dates, and observations. Short sections suggest missing detail.",
      });
      continue;
    }

    // Check for vague phrases
    for (const phrase of VAGUE_PHRASES) {
      if (contentLower.includes(phrase)) {
        challenges.push({
          type: "unsupported_claim",
          severity: "info",
          message: `The "${section.title}" section contains vague wording ("${phrase}"). Reports should be specific and evidence-based rather than relying on general statements.`,
          sectionKey: section.section_key,
          suggestion: `Replace "${phrase}" with specific evidence: what happened, when, who was involved, and what was the outcome.`,
        });
        break; // One vague wording flag per section
      }
    }
  }
}

function checkUnsupportedClaims(
  challenges: ChallengeItem[],
  sections: ChildReportSection[],
): void {
  const progressKeywords = [
    "progress",
    "improved",
    "improvement",
    "better",
    "growth",
    "developing",
    "advancing",
    "achieving",
    "excelling",
  ];

  for (const section of sections) {
    if (!section.content) continue;

    const contentLower = section.content.toLowerCase();
    const claimsProgress = progressKeywords.some((kw) => contentLower.includes(kw));

    if (
      claimsProgress &&
      section.evidence_status !== "evidence_supported"
    ) {
      challenges.push({
        type: "unsupported_claim",
        severity: "warning",
        message: `The "${section.title}" section claims progress or improvement but evidence status is "${section.evidence_status}". Claims of progress must be grounded in verifiable evidence.`,
        sectionKey: section.section_key,
        suggestion:
          "Either link specific evidence that supports the progress claim, or soften the language to reflect the evidence level (e.g. 'the records suggest some positive movement').",
      });
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// AI-ASSISTED DEEP ANALYSIS
// ══════════════════════════════════════════════════════════════════════════════

async function runAIDeepAnalysis(
  report: ChildReport,
  sections: ChildReportSection[],
  evidence: ChildReportEvidence[],
): Promise<ChallengeItem[]> {
  const sectionSummaries = sections
    .map(
      (s) =>
        `[${s.section_key}] "${s.title}" — evidence: ${s.evidence_status}, confidence: ${s.confidence_score ?? "N/A"}%, content length: ${(s.content ?? "").length} chars`,
    )
    .join("\n");

  const evidenceSummaries = evidence
    .slice(0, 30) // Limit to avoid token overflow
    .map(
      (e) =>
        `Source: ${e.source_table}::${e.source_record_id} (${e.source_date}) — ${(e.excerpt ?? "").slice(0, 100)}`,
    )
    .join("\n");

  const systemPrompt =
    "You are a quality assurance reviewer for a UK children's home report. " +
    "Identify gaps, contradictions, missing perspectives, and areas that need strengthening. " +
    "Focus on child safety, evidence quality, and regulatory compliance.";

  const userPrompt = `Analyse this report for a child in a UK children's residential home.

REPORT: ${report.report_type} (${report.date_range_start} to ${report.date_range_end})
RISK TIER: ${report.risk_tier}
OVERALL CONFIDENCE: ${report.overall_confidence_score ?? "N/A"}%
CHILD VOICE INCLUDED: ${report.child_voice_included}
EVIDENCE GAPS: ${report.evidence_gap_count}

SECTIONS:
${sectionSummaries}

EVIDENCE LINKED:
${evidenceSummaries}

Respond with a JSON object:
{
  "challenges": [
    {
      "type": "missing_evidence" | "weak_confidence" | "missing_child_voice" | "contradictory_evidence" | "outdated_evidence" | "unsupported_claim" | "risk_not_addressed" | "plan_drift" | "missing_section" | "safeguarding_gap",
      "severity": "info" | "warning" | "critical",
      "message": "clear description of the issue",
      "sectionKey": "optional section key",
      "suggestion": "optional suggestion for resolution"
    }
  ]
}

Only flag genuine issues. Do not invent problems. If the report looks solid, return an empty challenges array.
Return ONLY valid JSON.`;

  const result = await generateCaraJSON(
    { systemPrompt, userPrompt, temperature: 0.2 },
    challengeOutputSchema,
  );

  if (!result.data) return [];

  // Map to typed ChallengeItem objects
  return result.data.challenges.map((c) => ({
    type: (c.type as ChallengeType) || "missing_evidence",
    severity: (c.severity as ChallengeSeverity) || "info",
    message: c.message,
    sectionKey: c.sectionKey,
    suggestion: c.suggestion,
  }));
}

// ══════════════════════════════════════════════════════════════════════════════
// GENERATE SUGGESTED ACTIONS
// ══════════════════════════════════════════════════════════════════════════════

export async function generateSuggestedActions(
  reportId: string,
): Promise<ChildReportAction[]> {
  const reportData = await fetchReportData(reportId);
  if (!reportData) return [];

  const { report, sections, evidence } = reportData;
  const now = new Date().toISOString();
  const actions: ChildReportAction[] = [];

  // ── Rule-based action suggestions ───────────────────────────────────────

  // Incidents present — suggest risk assessment review
  const hasIncidents = evidence.some((e) => e.source_table === "incidents");
  if (hasIncidents) {
    actions.push({
      id: `demo-action-${Date.now()}-1`,
      report_id: reportId,
      section_key: "risk_assessment",
      action_title: "Review and update risk assessment",
      action_description:
        "Incidents have been recorded during this period. The risk assessment should be reviewed to ensure it reflects current risks and mitigations.",
      assigned_to: null,
      assigned_role: "registered_manager",
      due_date: null,
      priority: "high",
      status: "suggested",
      linked_task_id: null,
      created_by: "cara",
      created_at: now,
      updated_at: now,
    });
  }

  // Missing child voice — suggest keywork session
  const missingSections = sections.filter(
    (s) => !s.child_voice_present && s.section_key.includes("voice"),
  );
  if (missingSections.length > 0) {
    actions.push({
      id: `demo-action-${Date.now()}-2`,
      report_id: reportId,
      section_key: "childs_voice",
      action_title: "Schedule keywork session to capture child's views",
      action_description:
        "The child's voice is missing or under-represented in this report. A keywork session should be arranged to capture their views and wishes.",
      assigned_to: null,
      assigned_role: "key_worker",
      due_date: null,
      priority: "medium",
      status: "suggested",
      linked_task_id: null,
      created_by: "cara",
      created_at: now,
      updated_at: now,
    });
  }

  // Low overall confidence — suggest evidence review
  if ((report.overall_confidence_score ?? 0) < 50) {
    actions.push({
      id: `demo-action-${Date.now()}-3`,
      report_id: reportId,
      section_key: null,
      action_title: "Review recording practice for the period",
      action_description:
        "The overall evidence confidence score is low. Review whether daily recording is being completed consistently and whether significant events are being captured.",
      assigned_to: null,
      assigned_role: "registered_manager",
      due_date: null,
      priority: "medium",
      status: "suggested",
      linked_task_id: null,
      created_by: "cara",
      created_at: now,
      updated_at: now,
    });
  }

  // Evidence gaps — suggest team briefing
  if (report.evidence_gap_count > 3) {
    actions.push({
      id: `demo-action-${Date.now()}-4`,
      report_id: reportId,
      section_key: null,
      action_title: "Brief team on recording expectations",
      action_description:
        `There are ${report.evidence_gap_count} evidence gaps in this report. Consider a team briefing to reinforce recording expectations and ensure all areas of the child's life are being documented.`,
      assigned_to: null,
      assigned_role: "registered_manager",
      due_date: null,
      priority: "low",
      status: "suggested",
      linked_task_id: null,
      created_by: "cara",
      created_at: now,
      updated_at: now,
    });
  }

  // High risk — suggest social worker update
  if (report.risk_tier === "high") {
    actions.push({
      id: `demo-action-${Date.now()}-5`,
      report_id: reportId,
      section_key: null,
      action_title: "Notify social worker of high-risk period",
      action_description:
        "This report covers a period with elevated risk. Ensure the allocated social worker has been updated and any multi-agency response is coordinated.",
      assigned_to: null,
      assigned_role: "registered_manager",
      due_date: null,
      priority: "urgent",
      status: "suggested",
      linked_task_id: null,
      created_by: "cara",
      created_at: now,
      updated_at: now,
    });
  }

  // ── AI-assisted action suggestions (optional) ───────────────────────────
  const sb = createServerClient();
  if (sb) {
    try {
      const aiActions = await generateAIActions(report, sections, evidence);
      actions.push(...aiActions);
    } catch (err) {
      console.error("[cara-challenge] AI action generation failed:", err);
    }
  }

  return actions;
}

// ── AI Action Generation ──────────────────────────────────────────────────

async function generateAIActions(
  report: ChildReport,
  sections: ChildReportSection[],
  evidence: ChildReportEvidence[],
): Promise<ChildReportAction[]> {
  const sectionContext = sections
    .map((s) => `[${s.section_key}] ${s.title}: evidence=${s.evidence_status}, confidence=${s.confidence_score ?? 0}%`)
    .join("\n");

  const response = await generateCaraContent({
    systemPrompt:
      "You are suggesting follow-up actions for a UK children's home report. " +
      "Suggest practical, specific actions that a Registered Manager or key worker should take.",
    userPrompt: `Based on this report analysis, suggest 2-5 specific follow-up actions.

REPORT: ${report.report_type}, risk: ${report.risk_tier}, confidence: ${report.overall_confidence_score ?? 0}%
EVIDENCE GAPS: ${report.evidence_gap_count}

SECTIONS:
${sectionContext}

For each action provide:
- A clear title (under 80 characters)
- A brief description
- Priority: low, medium, high, or urgent
- Who it should be assigned to (role, not name)

Respond as a JSON array:
[{"title": "...", "description": "...", "priority": "...", "assignedRole": "...", "sectionKey": "..."}]

Return ONLY valid JSON.`,
    temperature: 0.3,
  });

  // Parse AI response
  let parsed: Array<{
    title: string;
    description: string;
    priority: string;
    assignedRole: string;
    sectionKey?: string;
  }>;

  try {
    let jsonStr = response.content.trim();
    const fenceMatch = jsonStr.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();
    parsed = JSON.parse(jsonStr);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  const now = new Date().toISOString();
  return parsed.slice(0, 5).map((item, i) => ({
    id: `demo-action-ai-${Date.now()}-${i}`,
    report_id: report.id,
    section_key: item.sectionKey ?? null,
    action_title: item.title,
    action_description: item.description ?? null,
    assigned_to: null,
    assigned_role: item.assignedRole ?? null,
    due_date: null,
    priority: (["low", "medium", "high", "urgent"].includes(item.priority)
      ? item.priority
      : "medium") as "low" | "medium" | "high" | "urgent",
    status: "suggested" as const,
    linked_task_id: null,
    created_by: "cara",
    created_at: now,
    updated_at: now,
  }));
}

// ══════════════════════════════════════════════════════════════════════════════
// DATA FETCHING
// ══════════════════════════════════════════════════════════════════════════════

async function fetchReportData(reportId: string): Promise<{
  report: ChildReport;
  sections: ChildReportSection[];
  evidence: ChildReportEvidence[];
} | null> {
  const sb = createServerClient();

  if (!sb) return getDemoReportDataForChallenge(reportId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: report, error: reportError } = await (sb.from("child_reports") as any)
    .select("*")
    .eq("id", reportId)
    .single();

  if (reportError || !report) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sections } = await (sb.from("child_report_sections") as any)
    .select("*")
    .eq("report_id", reportId)
    .order("order", { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: evidence } = await (sb.from("child_report_evidence") as any)
    .select("*")
    .eq("report_id", reportId);

  return {
    report: report as ChildReport,
    sections: (sections ?? []) as ChildReportSection[],
    evidence: (evidence ?? []) as ChildReportEvidence[],
  };
}

// ── Demo Data ─────────────────────────────────────────────────────────────

function getDemoReportDataForChallenge(reportId: string): {
  report: ChildReport;
  sections: ChildReportSection[];
  evidence: ChildReportEvidence[];
} {
  const now = new Date().toISOString();

  const report: ChildReport = {
    id: reportId,
    organisation_id: "demo-org",
    home_id: "demo-home",
    child_id: "demo-child",
    report_type: "weekly_child_report",
    audience: "internal_manager",
    title: "Jayden Mitchell — Weekly Child Report",
    status: "draft",
    version: 1,
    parent_report_id: null,
    date_range_start: "2026-05-05",
    date_range_end: "2026-05-11",
    overall_summary: "Jayden has had a broadly positive week.",
    overall_confidence_score: 68,
    risk_tier: "low",
    child_voice_included: true,
    evidence_gap_count: 3,
    agent_run_id: null,
    requested_by: "demo-user",
    generated_at: now,
    reviewed_by: null,
    reviewed_at: null,
    review_notes: null,
    approved_by: null,
    approved_at: null,
    rejection_reason: null,
    locked_by: null,
    locked_at: null,
    created_at: now,
    updated_at: now,
  };

  const sections: ChildReportSection[] = [
    {
      id: "demo-sec-1",
      report_id: reportId,
      section_key: "overview",
      title: "Overview",
      order: 1,
      content: "Jayden has had a good week with no major concerns.",
      structured_content: null,
      evidence_status: "partial_evidence",
      confidence_score: 65,
      evidence_count: 3,
      child_voice_present: false,
      manager_note: null,
      manager_edited: false,
      last_edited_by: null,
      last_edited_at: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: "demo-sec-2",
      report_id: reportId,
      section_key: "childs_voice",
      title: "Child's Voice",
      order: 4,
      content: "No child voice content was captured for this period.",
      structured_content: null,
      evidence_status: "not_enough_evidence",
      confidence_score: 10,
      evidence_count: 0,
      child_voice_present: false,
      manager_note: null,
      manager_edited: false,
      last_edited_by: null,
      last_edited_at: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: "demo-sec-3",
      report_id: reportId,
      section_key: "incidents_concerns",
      title: "Incidents / Concerns",
      order: 5,
      content: "One verbal altercation occurred during the period. Jayden argued with a peer over the TV remote.",
      structured_content: null,
      evidence_status: "evidence_supported",
      confidence_score: 80,
      evidence_count: 1,
      child_voice_present: false,
      manager_note: null,
      manager_edited: false,
      last_edited_by: null,
      last_edited_at: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: "demo-sec-4",
      report_id: reportId,
      section_key: "manager_oversight",
      title: "Manager Oversight",
      order: 13,
      content: "",
      structured_content: null,
      evidence_status: "not_enough_evidence",
      confidence_score: 0,
      evidence_count: 0,
      child_voice_present: false,
      manager_note: null,
      manager_edited: false,
      last_edited_by: null,
      last_edited_at: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: "demo-sec-5",
      report_id: reportId,
      section_key: "actions",
      title: "Actions",
      order: 14,
      content: "",
      structured_content: null,
      evidence_status: "not_enough_evidence",
      confidence_score: 0,
      evidence_count: 0,
      child_voice_present: false,
      manager_note: null,
      manager_edited: false,
      last_edited_by: null,
      last_edited_at: null,
      created_at: now,
      updated_at: now,
    },
  ];

  const evidence: ChildReportEvidence[] = [
    {
      id: "demo-ev-ch-1",
      section_id: "demo-sec-3",
      report_id: reportId,
      source_table: "incidents",
      source_record_id: "demo-inc-1",
      source_date: "2026-05-08",
      excerpt: "Verbal altercation — low severity — Jayden argued with a peer over the TV remote.",
      reasoning: null,
      relevance_score: 0.9,
      is_child_voice: false,
      is_primary: true,
      created_at: now,
    },
  ];

  return { report, sections, evidence };
}
