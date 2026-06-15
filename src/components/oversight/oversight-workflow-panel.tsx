"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Oversight workflow panel.
// The manager's single view of the WHOLE professional response to an event:
// scores + risk, complete workflow visibility, Cara Intelligence, the editable
// professional oversight, a safe child-addressed version, required actions, and
// final role-gated sign-off. Deterministic — no AI calls.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Workflow,
  Brain,
  FileText,
  FileWarning,
  Heart,
  ListChecks,
  ClipboardCheck,
  AlertTriangle,
  Tag,
  ShieldCheck,
} from "lucide-react";
import { OversightScoreBar } from "./oversight-score-bar";
import { OversightRecordingGaps } from "./oversight-recording-gaps";
import { OversightTaskList } from "./oversight-task-list";
import { ChildAddressedPreview } from "./child-addressed-preview";
import { OversightSignOffPanel } from "./oversight-sign-off-panel";
import { InlinePracticeReasoning } from "@/components/cara-reasoning/inline-practice-reasoning";
import { InlinePracticeLearning } from "@/components/practice-learning/inline-practice-learning";
import { KnowledgeGraphInsights } from "@/components/knowledge-graph/knowledge-graph-insights";
import { CaraWritingField } from "@/components/writing-assistant/cara-writing-field";
import type { OversightInput, OversightResult, OversightAction } from "@/lib/oversight/types";

function FindingGroup({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="py-2">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">{title}</p>
      <ul className="space-y-1">
        {items.map((t, i) => (
          <li key={i} className="text-sm leading-relaxed text-[var(--cs-text)]">
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActionList({ title, actions }: { title: string; actions: OversightAction[] }) {
  if (!actions?.length) return null;
  return (
    <div className="py-2">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">{title}</p>
      <ul className="space-y-2">
        {actions.map((a, i) => (
          <li key={i} className="rounded-lg border border-[var(--cs-border-subtle)] bg-[var(--cs-surface)] p-3">
            <p className="text-sm text-[var(--cs-text)]">{a.action}</p>
            <p className="mt-1 text-xs text-[var(--cs-text-muted)]">
              Responsible: {a.responsibleRole.replace(/_/g, " ")} · By: {a.timescale} · Priority: {a.priority}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TagRow({ tags }: { tags: string[] }) {
  if (!tags?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t, i) => (
        <span
          key={i}
          className="inline-flex items-center rounded-full border border-[var(--cs-border-subtle)] bg-[var(--cs-surface)] px-2.5 py-0.5 text-xs text-[var(--cs-text-muted)]"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-[var(--cs-teal,#0d9488)]" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function OversightWorkflowPanel({
  input,
  result,
  recordId,
  childId,
}: {
  input?: OversightInput;
  result: OversightResult;
  recordId?: string;
  childId?: string;
}) {
  const [professional, setProfessional] = useState(result.professionalOversight ?? "");
  const [childText, setChildText] = useState(result.childAddressedOversight ?? "");

  const hasWorkflowVisibility =
    result.workflowFindings.length ||
    result.associatedPaperworkFindings.length ||
    result.staffDebriefFindings.length ||
    result.childDebriefFindings.length ||
    result.keyWorkFollowUpFindings.length ||
    result.referralFindings.length ||
    result.planAdherenceFindings.length ||
    result.policyComplianceFindings.length;

  const hasIntelligence =
    result.livedExperienceConsiderations.length ||
    result.patternFindings.length ||
    result.professionalCuriosityFindings.length ||
    result.therapeuticTags.length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <SectionCard icon={ShieldCheck} title="Oversight summary" description="Deterministic assurance across the whole workflow.">
        <OversightScoreBar result={result} />
      </SectionCard>

      {/* The OS spine at the point of oversight: reasoning (now) · learning (past) · wider home patterns */}
      {childId && <InlinePracticeReasoning childId={childId} childName={input?.childName} />}
      {childId && <InlinePracticeLearning childId={childId} childName={input?.childName} />}
      <KnowledgeGraphInsights />

      {/* Recording gaps */}
      <SectionCard
        icon={FileWarning}
        title="Recording gaps"
        description="Documentation gaps identified across the record and connected workflow."
      >
        <OversightRecordingGaps gaps={result.recordingGaps} />
      </SectionCard>

      {/* Task-by-task oversight */}
      {result.taskOversights.length > 0 && (
        <SectionCard
          icon={ClipboardCheck}
          title="Task-by-task oversight"
          description="Every task in the workflow, with its own oversight status and suggested comment."
        >
          <OversightTaskList tasks={result.taskOversights} />
        </SectionCard>
      )}

      {/* Complete workflow visibility */}
      {!!hasWorkflowVisibility && (
        <SectionCard
          icon={Workflow}
          title="Complete workflow visibility"
          description="Every task, record, debrief, referral and plan connected to this event."
        >
          <div className="divide-y divide-[var(--cs-border-subtle)]">
            <FindingGroup title="Workflow steps" items={result.workflowFindings} />
            <FindingGroup title="Associated paperwork" items={result.associatedPaperworkFindings} />
            <FindingGroup title="Staff debrief" items={result.staffDebriefFindings} />
            <FindingGroup title="Child debrief" items={result.childDebriefFindings} />
            <FindingGroup title="Key-work / direct work" items={result.keyWorkFollowUpFindings} />
            <FindingGroup title="Referrals & notifications" items={result.referralFindings} />
            <FindingGroup title="Plan adherence" items={result.planAdherenceFindings} />
            <FindingGroup title="Policy compliance" items={result.policyComplianceFindings} />
          </div>
        </SectionCard>
      )}

      {/* Cara Intelligence */}
      {!!hasIntelligence && (
        <SectionCard
          icon={Brain}
          title="Cara Intelligence"
          description="Lived experience, recent context, patterns and therapeutic curiosity."
        >
          <div className="divide-y divide-[var(--cs-border-subtle)]">
            <FindingGroup title="Lived experience & context" items={result.livedExperienceConsiderations} />
            <FindingGroup title="Pattern analysis" items={result.patternFindings} />
            <FindingGroup title="Professional curiosity" items={result.professionalCuriosityFindings} />
          </div>
          {result.therapeuticTags.length > 0 && (
            <div className="mt-3">
              <TagRow tags={result.therapeuticTags} />
            </div>
          )}
        </SectionCard>
      )}

      {/* Actions + escalation */}
      {(result.requiredActions.length ||
        result.staffPracticeActions.length ||
        result.supportRecommendations.length ||
        result.outstandingWorkflowActions.length ||
        result.escalationReasons.length) > 0 && (
        <SectionCard icon={ListChecks} title="Actions & escalation" description="What needs to happen, by whom and by when.">
          {result.escalationReasons.length > 0 && (
            <div className="mb-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
              <ul className="space-y-0.5 text-sm text-red-800">
                {result.escalationReasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="divide-y divide-[var(--cs-border-subtle)]">
            <ActionList title="Required actions" actions={result.requiredActions} />
            <ActionList title="Staff practice actions" actions={result.staffPracticeActions} />
            <ActionList title="Outstanding workflow actions" actions={result.outstandingWorkflowActions} />
            <ActionList title="Support recommendations" actions={result.supportRecommendations} />
          </div>
        </SectionCard>
      )}

      {/* Professional oversight (editable) */}
      <SectionCard
        icon={FileText}
        title="Professional management oversight"
        description="Inspection-ready. Edit to add your professional judgement before sign-off."
      >
        <CaraWritingField
          value={professional}
          onChange={setProfessional}
          mode="management-oversight"
          recordType="management_oversight"
          fieldName="professional_oversight"
          childId={childId}
          knownNames={input?.childName ? [input.childName] : undefined}
          minHeight={320}
          aria-label="Professional management oversight"
        />
      </SectionCard>

      {/* Child-addressed oversight */}
      <SectionCard
        icon={Heart}
        title="Child-addressed oversight"
        description="A warm, plain-English version written to the child — only where it is safe to do so."
      >
        {!result.childAddressedSuppressed && childText && (
          <div className="mb-3">
            <CaraWritingField
              value={childText}
              onChange={setChildText}
              mode="writing-to-child"
              recordType="child_addressed_oversight"
              fieldName="child_addressed"
              childId={childId}
              knownNames={input?.childName ? [input.childName] : undefined}
              minHeight={120}
              aria-label="Child-addressed oversight"
            />
          </div>
        )}
        <ChildAddressedPreview
          text={childText}
          suppressed={result.childAddressedSuppressed}
          suppressionReason={result.childAddressedSuppressionReason}
        />
      </SectionCard>

      {/* Regulatory + QA routing */}
      {(result.regulatoryTags.length > 0 || result.qualityAssuranceRoutes.length > 0) && (
        <SectionCard icon={Tag} title="Regulatory & quality assurance" description="How this oversight feeds the home's evidence.">
          {result.regulatoryTags.length > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">
                Regulatory relevance
              </p>
              <TagRow tags={result.regulatoryTags} />
            </div>
          )}
          {result.qualityAssuranceRoutes.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Routed to</p>
              <TagRow tags={result.qualityAssuranceRoutes} />
            </div>
          )}
        </SectionCard>
      )}

      {/* Sign-off */}
      <SectionCard
        icon={ShieldCheck}
        title="Management sign-off"
        description="Final professional oversight and accountability. The role gate is enforced server-side."
      >
        <OversightSignOffPanel
          input={input}
          result={result}
          recordId={recordId}
          finalProfessionalOversight={professional}
          childAddressedOversight={result.childAddressedSuppressed ? undefined : childText || undefined}
        />
      </SectionCard>
    </div>
  );
}
