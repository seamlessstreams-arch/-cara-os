// ══════════════════════════════════════════════════════════════════════════════
// Cara — REPORT GENERATION SERVICE
//
// Orchestrates the full report generation pipeline:
//   1. Validate request
//   2. Retrieve child profile + evidence
//   3. Build prompts (section templates + writing style + evidence context)
//   4. Call AI (structured JSON output)
//   5. Map AI output to ChildReportSection objects
//   6. Persist to database (or return demo objects)
//   7. Return ReportGenerationResult
//
// Also provides getReport, updateReportSection, and rewriteSection for
// downstream report editing and audience adaptation.
//
// Server-side only — never import in client components.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import type {
  ReportGenerationRequest,
  ReportGenerationResult,
  ChildReport,
  ChildReportSection,
  ChildReportEvidence,
  ChildReportEvidenceInsert,
  ReportAudience,
  NormalisedEvidence,
  RiskTier,
} from "@/types/cara-reports";
import { reportGenerationRequestSchema, reportOutputSchema } from "@/lib/cara/ai/schemas";
import type { ReportOutput } from "@/lib/cara/ai/schemas";
import { getAgent } from "@/lib/cara/agents/agent-registry";
import { classifyRisk } from "@/lib/cara/risk-tiers";
import {
  retrieveChildProfile,
  retrieveEvidence,
  groupEvidenceByType,
  summariseEvidence,
} from "@/lib/cara/evidence/evidence-retrieval";
import { getSectionsForReportType } from "@/lib/cara/reports/report-templates";
import type { SectionTemplate } from "@/lib/cara/reports/report-templates";
import { buildWritingPrompt, rewriteSection as buildRewritePrompt } from "@/lib/cara/writing/humanised-writing";
import { generateCaraJSON, generateCaraContent } from "@/lib/cara/ai/provider";
import { sanitiseOutput, validateOutputSafety } from "@/lib/cara/ai/safety";
import { writeCaraAudit } from "@/lib/cara/audit/cara-audit";

// ── Helpers ───────────────────────────────────────────────────────────────

function demoId(): string {
  return `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function computeOverallConfidence(sections: ChildReportSection[]): number {
  const scores = sections.map((s) => s.confidence_score ?? 0);
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function computeRiskTier(evidence: NormalisedEvidence[]): RiskTier {
  const hasHighRisk = evidence.some((e) => e.riskLevel === "high");
  const hasMediumRisk = evidence.some((e) => e.riskLevel === "medium");
  if (hasHighRisk) return "high";
  if (hasMediumRisk) return "medium";
  return "low";
}

function hasChildVoice(evidence: NormalisedEvidence[]): boolean {
  return evidence.some(
    (e) => e.tags.includes("child_voice") || e.type === "keywork",
  );
}

function countEvidenceGaps(sections: ChildReportSection[]): number {
  return sections.filter(
    (s) =>
      s.evidence_status === "not_enough_evidence" ||
      s.evidence_status === "manager_input_required",
  ).length;
}

// ══════════════════════════════════════════════════════════════════════════════
// GENERATE CHILD REPORT
// ══════════════════════════════════════════════════════════════════════════════

export async function generateChildReport(
  request: ReportGenerationRequest,
): Promise<ReportGenerationResult> {
  const startTime = Date.now();

  // ── 1. Validate request ─────────────────────────────────────────────────
  const validation = reportGenerationRequestSchema.safeParse(request);
  if (!validation.success) {
    const issues = validation.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid report generation request: ${issues}`);
  }

  // ── 2. Get the agent definition ─────────────────────────────────────────
  const agent = getAgent("report_generator_agent");

  // ── 3. Classify risk ────────────────────────────────────────────────────
  const riskClassification = classifyRisk("draft_report_analysis");

  // ── 4. Retrieve child profile ───────────────────────────────────────────
  const childProfile = await retrieveChildProfile(request.childId, request.homeId);
  if (!childProfile) {
    throw new Error(
      `Child profile not found for childId=${request.childId}, homeId=${request.homeId}`,
    );
  }

  // ── 5. Retrieve evidence ────────────────────────────────────────────────
  const evidence = await retrieveEvidence({
    homeId: request.homeId,
    childId: request.childId,
    dateRangeStart: request.dateRangeStart,
    dateRangeEnd: request.dateRangeEnd,
  });

  // ── 6. Group evidence by type ───────────────────────────────────────────
  const groupedEvidence = groupEvidenceByType(evidence);

  // ── 7. Build the prompt ─────────────────────────────────────────────────
  const sectionTemplates = getSectionsForReportType(request.reportType);
  const filteredTemplates = request.includeSections?.length
    ? sectionTemplates.filter((t) => request.includeSections!.includes(t.key))
    : sectionTemplates;

  const evidenceSummary = summariseEvidence(evidence);
  const writingInstructions = buildWritingPrompt(request.audience);

  const childContext = [
    `Child: ${childProfile.firstName} ${childProfile.lastName}`,
    childProfile.dateOfBirth ? `Date of birth: ${childProfile.dateOfBirth}` : null,
    `Status: ${childProfile.status}`,
    childProfile.placementStart ? `Placement start: ${childProfile.placementStart}` : null,
    childProfile.keyWorker ? `Key worker: ${childProfile.keyWorker}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const sectionInstructions = filteredTemplates
    .map(
      (t) =>
        `- Section key: "${t.key}", title: "${t.title}", order: ${t.order}, ` +
        `required: ${t.required}, needsChildVoice: ${t.needsChildVoice}, needsEvidence: ${t.needsEvidence}`,
    )
    .join("\n");

  const evidenceTypeBreakdown = Object.entries(groupedEvidence)
    .map(([type, items]) => `${type}: ${items.length} record(s)`)
    .join(", ");

  const systemPrompt = `You are generating a structured report for a child in a UK children's residential home.

${writingInstructions}

AGENT IDENTITY: ${agent.name} — ${agent.description}

RISK CLASSIFICATION: ${riskClassification.tier} risk. Requires evidence: ${riskClassification.requiresEvidence}. Requires confidence score: ${riskClassification.requiresConfidenceScore}.`;

  const userPrompt = `CHILD PROFILE:
${childContext}

REPORT TYPE: ${request.reportType}
DATE RANGE: ${request.dateRangeStart} to ${request.dateRangeEnd}
AUDIENCE: ${request.audience}

SECTIONS TO GENERATE:
${sectionInstructions}

AVAILABLE EVIDENCE (${evidence.length} records — ${evidenceTypeBreakdown}):
${evidenceSummary}

INSTRUCTIONS:
Generate the report as a JSON object with this structure:
{
  "summary": "A brief overall summary paragraph for the report.",
  "sections": [
    {
      "sectionKey": "the section key from the list above",
      "sectionTitle": "the section title",
      "content": "the section content — detailed, evidence-based, professional",
      "confidenceScore": 0-100,
      "evidenceStatus": "evidence_supported" | "partial_evidence" | "manager_input_required" | "not_enough_evidence",
      "needsManagerReview": true/false,
      "evidenceIds": ["source_table::source_record_id", ...]
    }
  ]
}

Rules:
- Generate one section object for each section listed above.
- Set evidenceStatus honestly — "evidence_supported" only when there are clear source records backing the content.
- Set confidenceScore based on evidence quality and coverage (0 = no evidence, 100 = fully evidenced with direct quotes).
- Reference evidence by their IDs in the evidenceIds array.
- If evidence is missing for a section, set evidenceStatus to "not_enough_evidence" and say so in the content.
- For sections marked needsChildVoice=true, include child voice if evidence contains it — otherwise flag evidenceStatus as "partial_evidence" or "not_enough_evidence".
- Use ${childProfile.firstName}'s name naturally in the text.
- Return ONLY valid JSON — no markdown fences, no explanation.`;

  // ── 8. Call AI ──────────────────────────────────────────────────────────
  const aiResult = await generateCaraJSON<ReportOutput>(
    { systemPrompt, userPrompt, temperature: 0.4 },
    reportOutputSchema,
  );

  // ── 9/10. Map AI output to sections (or create fallback) ───────────────
  let sections: ChildReportSection[];
  let evidenceLinks: ChildReportEvidence[];
  let overallSummary: string;
  const reportId = demoId();
  const now = nowISO();

  if (aiResult.data) {
    overallSummary = aiResult.data.summary;
    const aiSections = aiResult.data.sections;

    sections = filteredTemplates.map((template) => {
      const aiSection = aiSections.find((s) => s.sectionKey === template.key);

      if (aiSection) {
        return {
          id: demoId(),
          report_id: reportId,
          section_key: template.key,
          title: aiSection.sectionTitle || template.title,
          order: template.order,
          content: aiSection.content,
          structured_content: null,
          evidence_status: aiSection.evidenceStatus,
          confidence_score: aiSection.confidenceScore,
          evidence_count: aiSection.evidenceIds.length,
          child_voice_present:
            template.needsChildVoice &&
            aiSection.evidenceStatus !== "not_enough_evidence",
          manager_note: null,
          manager_edited: false,
          last_edited_by: null,
          last_edited_at: null,
          created_at: now,
          updated_at: now,
        };
      }

      // AI did not generate this section — fallback
      return buildFallbackSection(reportId, template, now);
    });

    // Build evidence links from AI output
    evidenceLinks = [];
    for (const aiSection of aiSections) {
      const matchingSection = sections.find(
        (s) => s.section_key === aiSection.sectionKey,
      );
      if (!matchingSection) continue;

      for (const evidenceId of aiSection.evidenceIds) {
        const parts = evidenceId.split("::");
        if (parts.length !== 2) continue;

        const sourceEvidence = evidence.find(
          (e) => e.sourceTable === parts[0] && e.sourceRecordId === parts[1],
        );

        evidenceLinks.push({
          id: demoId(),
          section_id: matchingSection.id,
          report_id: reportId,
          source_table: parts[0],
          source_record_id: parts[1],
          source_date: sourceEvidence?.date ?? now.slice(0, 10),
          excerpt: sourceEvidence?.summary?.slice(0, 200) ?? null,
          reasoning: null,
          relevance_score: sourceEvidence ? 0.8 : 0.5,
          is_child_voice: sourceEvidence?.tags.includes("child_voice") ?? false,
          is_primary: false,
          created_at: now,
        });
      }
    }
  } else {
    // AI failed — create fallback sections for all templates
    overallSummary =
      "Cara was unable to generate this report automatically. " +
      "All sections require manual completion by the reviewing manager. " +
      `AI error: ${aiResult.error ?? "Unknown error"}`;

    sections = filteredTemplates.map((template) =>
      buildFallbackSection(reportId, template, now),
    );
    evidenceLinks = [];
  }

  // ── 11. Create the ChildReport object ───────────────────────────────────
  const riskTier = computeRiskTier(evidence);
  const overallConfidence = computeOverallConfidence(sections);
  const evidenceGapCount = countEvidenceGaps(sections);
  const childVoiceIncluded = hasChildVoice(evidence);
  const durationMs = Date.now() - startTime;

  const report: ChildReport = {
    id: reportId,
    organisation_id: request.organisationId,
    home_id: request.homeId,
    child_id: request.childId,
    report_type: request.reportType,
    audience: request.audience,
    title: `${childProfile.firstName} ${childProfile.lastName} — ${request.reportType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
    status: "draft",
    version: 1,
    parent_report_id: null,
    date_range_start: request.dateRangeStart,
    date_range_end: request.dateRangeEnd,
    overall_summary: overallSummary,
    overall_confidence_score: overallConfidence,
    risk_tier: riskTier,
    child_voice_included: childVoiceIncluded,
    evidence_gap_count: evidenceGapCount,
    agent_run_id: null,
    requested_by: request.requestedBy,
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

  // ── 12. Persist to database ─────────────────────────────────────────────
  const sb = createServerClient();

  if (sb) {
    try {
      // Insert agent run
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: agentRunData } = await (sb.from("cara_agent_runs") as any)
        .insert({
          organisation_id: request.organisationId,
          home_id: request.homeId,
          agent_id: "report_generator_agent",
          status: "completed",
          triggered_by: request.requestedBy,
          trigger_type: "manual",
          input_params: {
            reportType: request.reportType,
            audience: request.audience,
            childId: request.childId,
            dateRangeStart: request.dateRangeStart,
            dateRangeEnd: request.dateRangeEnd,
          },
          output_summary: overallSummary.slice(0, 500),
          output_data: { sectionCount: sections.length, evidenceLinkCount: evidenceLinks.length },
          error_message: aiResult.error ?? null,
          tokens_used: null,
          duration_ms: durationMs,
          parent_run_id: null,
          child_id: request.childId,
          report_id: null, // updated after report insert
          risk_tier: riskTier,
          requires_approval: riskClassification.requiresApproval,
          approved_by: null,
          approved_at: null,
        })
        .select("id")
        .single();

      const agentRunId = agentRunData?.id ?? null;

      // Insert report
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: reportData } = await (sb.from("child_reports") as any)
        .insert({
          organisation_id: report.organisation_id,
          home_id: report.home_id,
          child_id: report.child_id,
          report_type: report.report_type,
          audience: report.audience,
          title: report.title,
          status: report.status,
          version: report.version,
          parent_report_id: null,
          date_range_start: report.date_range_start,
          date_range_end: report.date_range_end,
          overall_summary: report.overall_summary,
          overall_confidence_score: report.overall_confidence_score,
          risk_tier: report.risk_tier,
          child_voice_included: report.child_voice_included,
          evidence_gap_count: report.evidence_gap_count,
          agent_run_id: agentRunId,
          requested_by: report.requested_by,
          generated_at: report.generated_at,
          reviewed_by: null,
          reviewed_at: null,
          review_notes: null,
          approved_by: null,
          approved_at: null,
          rejection_reason: null,
          locked_by: null,
          locked_at: null,
        })
        .select("id, created_at, updated_at")
        .single();

      if (reportData) {
        report.id = reportData.id;
        report.agent_run_id = agentRunId;
        report.created_at = reportData.created_at;
        report.updated_at = reportData.updated_at;

        // Update agent run with report_id
        if (agentRunId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (sb.from("cara_agent_runs") as any)
            .update({ report_id: reportData.id })
            .eq("id", agentRunId);
        }

        // Insert sections
        const sectionInserts = sections.map((s) => ({
          report_id: reportData.id,
          section_key: s.section_key,
          title: s.title,
          order: s.order,
          content: s.content,
          structured_content: s.structured_content,
          evidence_status: s.evidence_status,
          confidence_score: s.confidence_score,
          evidence_count: s.evidence_count,
          child_voice_present: s.child_voice_present,
          manager_note: null,
          manager_edited: false,
          last_edited_by: null,
          last_edited_at: null,
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: sectionData } = await (sb.from("child_report_sections") as any)
          .insert(sectionInserts)
          .select("id, section_key, created_at, updated_at");

        if (sectionData) {
          // Map DB IDs back to our section objects
          for (const dbSection of sectionData) {
            const localSection = sections.find(
              (s) => s.section_key === dbSection.section_key,
            );
            if (localSection) {
              localSection.id = dbSection.id;
              localSection.report_id = reportData.id;
              localSection.created_at = dbSection.created_at;
              localSection.updated_at = dbSection.updated_at;
            }
          }

          // Insert evidence links with correct section/report IDs
          if (evidenceLinks.length > 0) {
            const evidenceInserts: ChildReportEvidenceInsert[] = evidenceLinks.map((el) => {
              const matchedSection = sections.find(
                (s) => s.section_key === sections.find((orig) => orig.id === el.section_id)?.section_key,
              );
              // Resolve the section_id via the section_key match
              const dbSectionRow = sectionData.find(
                (dbS: { section_key: string }) =>
                  dbS.section_key ===
                  sections.find((s) => s.id === el.section_id || s.id === matchedSection?.id)?.section_key,
              );

              return {
                section_id: dbSectionRow?.id ?? el.section_id,
                report_id: reportData.id,
                source_table: el.source_table,
                source_record_id: el.source_record_id,
                source_date: el.source_date,
                excerpt: el.excerpt,
                reasoning: el.reasoning,
                relevance_score: el.relevance_score,
                is_child_voice: el.is_child_voice,
                is_primary: el.is_primary,
              };
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: evidenceData } = await (sb.from("child_report_evidence") as any)
              .insert(evidenceInserts)
              .select("id, section_id, created_at");

            if (evidenceData) {
              for (let i = 0; i < evidenceData.length && i < evidenceLinks.length; i++) {
                evidenceLinks[i].id = evidenceData[i].id;
                evidenceLinks[i].report_id = reportData.id;
                evidenceLinks[i].section_id = evidenceData[i].section_id;
                evidenceLinks[i].created_at = evidenceData[i].created_at;
              }
            }
          }
        }
      }

      // Write audit event
      await writeCaraAudit({
        organisationId: request.organisationId,
        homeId: request.homeId,
        childId: request.childId,
        actorId: request.requestedBy,
        eventType: "report_generated",
        entityType: "report",
        entityId: report.id,
        summary: `Generated ${request.reportType} for ${childProfile.firstName} ${childProfile.lastName} (${request.dateRangeStart} to ${request.dateRangeEnd})`,
        metadata: {
          reportType: request.reportType,
          audience: request.audience,
          sectionCount: sections.length,
          evidenceLinkCount: evidenceLinks.length,
          overallConfidence: overallConfidence,
          riskTier: riskTier,
          durationMs: durationMs,
          aiError: aiResult.error ?? null,
        },
      });
    } catch (err) {
      console.error("[cara-report-generator] Database persistence failed:", err);
      // Fall through — return the in-memory objects with demo IDs
    }
  }

  // ── 13/14. Return result ────────────────────────────────────────────────
  return {
    report,
    sections,
    evidence: evidenceLinks,
    suggestedActions: [], // populated by challenge mode
    challenges: [],       // populated by challenge mode
  };
}

// ── Fallback Section Builder ──────────────────────────────────────────────

function buildFallbackSection(
  reportId: string,
  template: SectionTemplate,
  now: string,
): ChildReportSection {
  return {
    id: demoId(),
    report_id: reportId,
    section_key: template.key,
    title: template.title,
    order: template.order,
    content:
      "There is not enough recorded evidence to generate this section automatically. " +
      "Manager review required.",
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
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// GET REPORT
// ══════════════════════════════════════════════════════════════════════════════

export async function getReport(
  reportId: string,
): Promise<{
  report: ChildReport;
  sections: ChildReportSection[];
  evidence: ChildReportEvidence[];
} | null> {
  const sb = createServerClient();

  if (!sb) {
    return getDemoReportData(reportId);
  }

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

// ══════════════════════════════════════════════════════════════════════════════
// UPDATE REPORT SECTION
// ══════════════════════════════════════════════════════════════════════════════

export async function updateReportSection(
  sectionId: string,
  content: string,
  updatedBy: string,
): Promise<ChildReportSection | null> {
  const sb = createServerClient();
  const now = nowISO();

  if (!sb) {
    return {
      id: sectionId,
      report_id: "demo-report",
      section_key: "unknown",
      title: "Updated Section",
      order: 1,
      content,
      structured_content: null,
      evidence_status: "manager_input_required",
      confidence_score: null,
      evidence_count: 0,
      child_voice_present: false,
      manager_note: null,
      manager_edited: true,
      last_edited_by: updatedBy,
      last_edited_at: now,
      created_at: now,
      updated_at: now,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from("child_report_sections") as any)
    .update({
      content,
      manager_edited: true,
      last_edited_by: updatedBy,
      last_edited_at: now,
    })
    .eq("id", sectionId)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[cara-report-generator] Failed to update section:", error);
    return null;
  }

  return data as ChildReportSection;
}

// ══════════════════════════════════════════════════════════════════════════════
// REWRITE SECTION (AUDIENCE ADAPTATION)
// ══════════════════════════════════════════════════════════════════════════════

export async function rewriteSection(
  sectionId: string,
  reportId: string,
  audience: ReportAudience,
): Promise<{ content: string; wasSanitised: boolean } | null> {
  const sb = createServerClient();

  // Fetch the current section content
  let sectionContent: string | null = null;
  let sectionKey: string = "unknown";

  if (sb) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (sb.from("child_report_sections") as any)
      .select("content, section_key")
      .eq("id", sectionId)
      .eq("report_id", reportId)
      .single();

    if (!data) return null;
    sectionContent = data.content;
    sectionKey = data.section_key;
  } else {
    // Demo mode — use a placeholder
    sectionContent =
      "Jayden has had a positive week with several achievements. " +
      "He received a merit certificate for his artwork and has been engaging well with staff. " +
      "There was one low-level incident involving a verbal disagreement with a peer, " +
      "which was resolved quickly with de-escalation support.";
    sectionKey = "overview";
  }

  if (!sectionContent) return null;

  // Build the rewrite prompt using the humanised-writing module
  const rewritePromptText = buildRewritePrompt(sectionContent, audience, sectionKey);

  // Call AI
  const aiResponse = await generateCaraContent({
    systemPrompt:
      "You are rewriting a section of a UK children's home report for a different audience. " +
      "Preserve all facts and evidence. Adapt only the voice, tone, and style.",
    userPrompt: rewritePromptText,
    temperature: 0.3,
  });

  // Sanitise
  const sanitisedContent = sanitiseOutput(aiResponse.content);
  const wasSanitised = sanitisedContent !== aiResponse.content || aiResponse.wasSanitised;

  // Validate safety
  const safetyResult = validateOutputSafety(sanitisedContent);
  if (!safetyResult.safe) {
    console.warn("[cara-report-generator] Rewrite safety warnings:", safetyResult.warnings);
  }

  // Update in DB
  if (sb) {
    const now = nowISO();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (sb.from("child_report_sections") as any)
      .update({
        content: sanitisedContent,
        last_edited_at: now,
      })
      .eq("id", sectionId);
  }

  return { content: sanitisedContent, wasSanitised };
}

// ── Demo Data ─────────────────────────────────────────────────────────────

function getDemoReportData(reportId: string): {
  report: ChildReport;
  sections: ChildReportSection[];
  evidence: ChildReportEvidence[];
} {
  const now = nowISO();

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
    overall_summary:
      "Jayden has had a broadly positive week with a number of achievements and areas of progress. " +
      "There was one low-level incident which was managed well. Evidence is generally strong " +
      "across key areas with some gaps in health recording.",
    overall_confidence_score: 72,
    risk_tier: "low",
    child_voice_included: true,
    evidence_gap_count: 2,
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
      id: "demo-section-overview",
      report_id: reportId,
      section_key: "overview",
      title: "Overview",
      order: 1,
      content:
        "Jayden has had a settled and generally positive week. He has engaged well with his daily routines, " +
        "achieved a merit certificate at school for his artwork, and participated in a swimming session at the local leisure centre. " +
        "There was one low-level verbal altercation with a peer which was resolved quickly with de-escalation support from staff.",
      structured_content: null,
      evidence_status: "evidence_supported",
      confidence_score: 82,
      evidence_count: 6,
      child_voice_present: false,
      manager_note: null,
      manager_edited: false,
      last_edited_by: null,
      last_edited_at: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: "demo-section-childs-voice",
      report_id: reportId,
      section_key: "childs_voice",
      title: "Child's Voice",
      order: 4,
      content:
        "Jayden shared during his keywork session that he felt left out at school at lunchtime. " +
        "He also said he is looking forward to seeing his mum but feels nervous about the contact visit. " +
        "After his LAC review, Jayden said he feels safe and mostly happy at the home.",
      structured_content: null,
      evidence_status: "evidence_supported",
      confidence_score: 78,
      evidence_count: 3,
      child_voice_present: true,
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
      id: "demo-ev-1",
      section_id: "demo-section-overview",
      report_id: reportId,
      source_table: "daily_log_entries",
      source_record_id: "demo-dl-5",
      source_date: "2026-05-09",
      excerpt: "Jayden received a merit certificate at school for his artwork.",
      reasoning: null,
      relevance_score: 0.9,
      is_child_voice: false,
      is_primary: true,
      created_at: now,
    },
  ];

  return { report, sections, evidence };
}
