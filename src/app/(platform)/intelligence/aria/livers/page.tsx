"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA L.I.V.E.R.S. INTERVENTION INTELLIGENCE
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { useYoungPeople } from "@/hooks/use-young-people";
import { getYPName } from "@/lib/seed-data";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useLiversAnalyses,
  useCreateLiversAnalysis,
  useUpdateLiversAnalysis,
  useInterventionSessions,
  useCreateInterventionSession,
  useCreateLiversOutcome,
} from "@/hooks/use-livers";
import { api } from "@/hooks/use-api";
import { cn, formatDate } from "@/lib/utils";
import type {
  LiversAnalysis,
  InterventionSession,
  LiversOutcomeRecord,
  LiversStatus,
  InterventionSessionStatus,
} from "@/types/extended";
import {
  Layers, Plus, Sparkles, Loader2, AlertTriangle,
  CheckCircle2, ChevronDown, ChevronUp, ShieldAlert,
  Activity, Eye, Zap, Wind, Heart, ArrowUpRight,
  ClipboardList, BookOpen, X,
} from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";
import type { AppRole } from "@/lib/permissions";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";

// ── Constants ─────────────────────────────────────────────────────────────────

const DOMAIN_META: Array<{
  key: keyof LiversAnalysis;
  label: string;
  letter: string;
  icon: React.ElementType;
  colour: string;
  ratingKey?: keyof LiversAnalysis;
}> = [
  {
    key: "lived_experience_summary",
    label: "Lived Experience",
    letter: "L",
    icon: Heart,
    colour: "text-rose-600 bg-rose-50 border-rose-200",
  },
  {
    key: "immediate_cumulative_risk",
    label: "Immediate & Cumulative Risk",
    letter: "I",
    icon: ShieldAlert,
    colour: "text-orange-600 bg-orange-50 border-orange-200",
  },
  {
    key: "viability_of_change",
    label: "Viability of Change",
    letter: "V",
    icon: Activity,
    colour: "text-yellow-600 bg-yellow-50 border-yellow-200",
    ratingKey: "viability_rating",
  },
  {
    key: "environment_system_forces",
    label: "Environment & System Forces",
    letter: "E",
    icon: Wind,
    colour: "text-sky-600 bg-sky-50 border-sky-200",
  },
  {
    key: "relational_psychological_drivers",
    label: "Relational & Psychological Drivers",
    letter: "R",
    icon: Eye,
    colour: "text-violet-600 bg-violet-50 border-violet-200",
  },
  {
    key: "sustainability_independence_safety",
    label: "Sustainability & Independence",
    letter: "S",
    icon: Zap,
    colour: "text-emerald-600 bg-emerald-50 border-emerald-200",
    ratingKey: "sustainability_rating",
  },
];

const SESSION_TYPE_LABELS: Record<string, string> = {
  key_work_session: "Key Work",
  restorative_conversation: "Restorative Conversation",
  direct_work_activity: "Direct Work Activity",
  safety_planning_session: "Safety Planning",
  missing_return_conversation: "Missing Return",
  education_engagement_session: "Education Engagement",
  family_time_preparation: "Family Time Prep",
  emotional_regulation_session: "Emotional Regulation",
  identity_self_esteem_session: "Identity & Self-Esteem",
  independence_life_skills: "Independence & Life Skills",
  online_safety_session: "Online Safety",
  exploitation_awareness: "Exploitation Awareness",
  relationship_boundaries: "Relationship Boundaries",
  staff_guidance_note: "Staff Guidance Note",
  team_reflective_briefing: "Team Briefing",
  management_oversight_analysis: "Management Oversight",
  child_friendly_worksheet: "Worksheet",
  flashcards: "Flashcards",
  quiz: "Quiz",
  infographic: "Infographic",
  workshop_plan: "Workshop Plan",
  micro_training_staff: "Micro-Training",
};

const CONFIDENCE_COLOURS = {
  high: "bg-emerald-100 text-emerald-800",
  possible: "bg-yellow-100 text-yellow-800",
  needs_human_review: "bg-orange-100 text-orange-800",
  insufficient_information: "bg-slate-100 text-slate-700",
};

const STATUS_COLOURS: Record<LiversStatus | InterventionSessionStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  reviewed: "bg-violet-100 text-violet-800",
  approved: "bg-emerald-100 text-emerald-700",
  archived: "bg-slate-200 text-slate-500",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-700",
};

const RATING_COLOURS = {
  low: "bg-red-100 text-red-700",
  moderate: "bg-yellow-100 text-yellow-700",
  high: "bg-emerald-100 text-emerald-700",
};

type LiversRoleAccess = {
  canCreateAnalysis: boolean;
  canGenerateActions: boolean;
  canReviewSustainability: boolean;
  canSubmitReview: boolean;
  canApprove: boolean;
  canRecordOutcome: boolean;
  canAuditComment: boolean;
};

function getLiversRoleAccess(role: AppRole): LiversRoleAccess {
  switch (role) {
    case "registered_manager":
    case "admin":
      return {
        canCreateAnalysis: true,
        canGenerateActions: true,
        canReviewSustainability: true,
        canSubmitReview: true,
        canApprove: true,
        canRecordOutcome: true,
        canAuditComment: true,
      };
    case "deputy_manager":
      return {
        canCreateAnalysis: true,
        canGenerateActions: true,
        canReviewSustainability: true,
        canSubmitReview: true,
        canApprove: false,
        canRecordOutcome: true,
        canAuditComment: true,
      };
    case "team_leader":
      return {
        canCreateAnalysis: true,
        canGenerateActions: true,
        canReviewSustainability: false,
        canSubmitReview: false,
        canApprove: false,
        canRecordOutcome: true,
        canAuditComment: false,
      };
    case "residential_care_worker":
      return {
        canCreateAnalysis: false,
        canGenerateActions: false,
        canReviewSustainability: false,
        canSubmitReview: false,
        canApprove: false,
        canRecordOutcome: true,
        canAuditComment: false,
      };
    case "responsible_individual":
      return {
        canCreateAnalysis: false,
        canGenerateActions: false,
        canReviewSustainability: false,
        canSubmitReview: false,
        canApprove: false,
        canRecordOutcome: false,
        canAuditComment: true,
      };
    default:
      return {
        canCreateAnalysis: false,
        canGenerateActions: false,
        canReviewSustainability: false,
        canSubmitReview: false,
        canApprove: false,
        canRecordOutcome: false,
        canAuditComment: false,
      };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("text-[10px] font-semibold uppercase tracking-wider", className)}>
      {children}
    </span>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", className)}>
      {children}
    </span>
  );
}

// ── Domain Card ───────────────────────────────────────────────────────────────

function DomainCard({
  domain,
  analysis,
}: {
  domain: typeof DOMAIN_META[number];
  analysis: LiversAnalysis;
}) {
  const [open, setOpen] = useState(false);
  const content = analysis[domain.key] as string | undefined;
  const rating = domain.ratingKey
    ? (analysis[domain.ratingKey] as string | undefined)
    : undefined;
  const Icon = domain.icon;

  return (
    <div className={cn("rounded-xl border p-4 transition-all", domain.colour)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/70 border border-current/20 shrink-0">
            <span className="font-black text-sm">{domain.letter}</span>
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm">{domain.label}</p>
            {rating && (
              <Badge className={cn("mt-0.5", RATING_COLOURS[rating as keyof typeof RATING_COLOURS] ?? "bg-slate-100 text-slate-700")}>
                {rating.charAt(0).toUpperCase() + rating.slice(1)} viability
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 opacity-60" />
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {open && (
        <div className="mt-3 pt-3 border-t border-current/10">
          {content ? (
            <p className="text-sm leading-relaxed">{content}</p>
          ) : (
            <p className="text-sm opacity-60 italic">No analysis available for this domain.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Analysis Card ─────────────────────────────────────────────────────────────

function AnalysisCard({
  analysis,
  onGenerateAction,
  onReviewSustainability,
  generatingKey,
  access,
}: {
  analysis: LiversAnalysis;
  onGenerateAction: (
    a: LiversAnalysis,
    action: "intervention" | "child" | "staff" | "resource" | "management"
  ) => void;
  onReviewSustainability: (a: LiversAnalysis) => void;
  generatingKey: string | null;
  access: LiversRoleAccess;
}) {
  const updateAnalysis = useUpdateLiversAnalysis();
  const { currentUser, currentRole } = useAuthContext();
  const [auditComment, setAuditComment] = useState("");
  const isGenerating = (action: string) => generatingKey === `${analysis.id}:${action}`;

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">L.I.V.E.R.S. Analysis</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">{formatDate(analysis.created_at)}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {analysis.aria_confidence && (
              <Badge className={CONFIDENCE_COLOURS[analysis.aria_confidence]}>
                {analysis.aria_confidence.replace(/_/g, " ")}
              </Badge>
            )}
            <Badge className={STATUS_COLOURS[analysis.status]}>
              {analysis.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Escalation alert */}
        {analysis.escalation_required && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Escalation Required</p>
              {analysis.escalation_actions?.length ? (
                <ul className="mt-1 space-y-1">
                  {analysis.escalation_actions.map((a, i) => (
                    <li key={i} className="text-xs text-red-600">• {a}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        )}

        {/* ARIA Summary */}
        {analysis.aria_summary && (
          <div className="rounded-lg bg-violet-50 border border-violet-100 p-3">
            <Label className="text-violet-600">ARIA Summary</Label>
            <p className="text-sm text-slate-800 mt-1 leading-relaxed">{analysis.aria_summary}</p>
          </div>
        )}

        {/* Domain cards */}
        <div className="space-y-2">
          {DOMAIN_META.map((d) => (
            <DomainCard key={d.key} domain={d} analysis={analysis} />
          ))}
        </div>

        {/* Recommended intervention + generate buttons */}
        {analysis.recommended_intervention_type && (
          <div className="rounded-lg bg-slate-50 border p-3">
            <Label className="text-slate-500">Recommended Intervention</Label>
            <p className="text-sm font-medium text-slate-800 mt-1">
              {SESSION_TYPE_LABELS[analysis.recommended_intervention_type] ?? analysis.recommended_intervention_type}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onGenerateAction(analysis, "intervention")}
            disabled={!access.canGenerateActions || isGenerating("intervention")}
          >
            {isGenerating("intervention") ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            )}
            Generate Intervention
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onGenerateAction(analysis, "child")}
            disabled={!access.canGenerateActions || isGenerating("child")}
          >
            {isGenerating("child") ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
            Generate Child-Friendly Version
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onGenerateAction(analysis, "staff")}
            disabled={!access.canGenerateActions || isGenerating("staff")}
          >
            {isGenerating("staff") ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
            Generate Staff Guidance
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onGenerateAction(analysis, "resource")}
            disabled={!access.canGenerateActions || isGenerating("resource")}
          >
            {isGenerating("resource") ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
            Generate Resource
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onGenerateAction(analysis, "management")}
            disabled={!access.canGenerateActions || isGenerating("management")}
          >
            {isGenerating("management") ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
            Generate Management Oversight
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onReviewSustainability(analysis)}
            disabled={!access.canReviewSustainability || isGenerating("sustainability")}
          >
            {isGenerating("sustainability") ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
            Review Sustainability
          </Button>

          {analysis.status === "draft" && access.canSubmitReview && (
            <Button
              size="sm"
              variant="ghost"
              className="text-slate-600"
              onClick={() =>
                updateAnalysis.mutate({ id: analysis.id, status: "reviewed" as LiversStatus, user_role: currentRole })
              }
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Mark Reviewed
            </Button>
          )}

          {analysis.status === "reviewed" && access.canApprove && (
            <Button
              size="sm"
              variant="ghost"
              className="text-emerald-700"
              onClick={() =>
                updateAnalysis.mutate({ id: analysis.id, status: "approved" as LiversStatus, approved_by: currentUser?.id, user_role: currentRole })
              }
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Approve Analysis
            </Button>
          )}
        </div>

        {access.canAuditComment && (
          <div className="rounded-lg border bg-white p-3 space-y-2">
            <Label className="text-slate-500">Audit Comment</Label>
            <textarea
              rows={2}
              value={auditComment}
              onChange={(e) => setAuditComment(e.target.value)}
              placeholder="Add audit observation or challenge..."
              className="w-full rounded-lg border border-slate-200 text-sm p-2 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!auditComment.trim()}
              onClick={() => {
                const nextNotes = [analysis.quality_check_notes, auditComment.trim()]
                  .filter(Boolean)
                  .join("\n\n");
                updateAnalysis.mutate({
                  id: analysis.id,
                  quality_check_notes: nextNotes,
                  reviewed_by: currentUser?.id,
                  user_role: currentRole,
                });
                setAuditComment("");
              }}
            >
              Save Audit Comment
            </Button>
          </div>
        )}

        {/* Management oversight */}
        {analysis.management_oversight && (
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
            <Label className="text-amber-700">Management Oversight Note</Label>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">{analysis.management_oversight}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Session Card ──────────────────────────────────────────────────────────────

function SessionCard({ session, canRecordOutcome }: { session: InterventionSession; canRecordOutcome: boolean }) {
  const [open, setOpen] = useState(false);
  const createOutcome = useCreateLiversOutcome();
  const [outcomeForm, setOutcomeForm] = useState({
    child_response: "",
    what_worked: "",
    what_did_not_work: "",
    emotional_presentation: "",
    risk_change: "unknown" as string,
    sustainability_change: "unknown" as string,
    further_action_required: false,
    further_action_notes: "",
  });
  const [showOutcomeForm, setShowOutcomeForm] = useState(false);
  const { currentUser, currentRole } = useAuthContext();

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <button onClick={() => setOpen((v) => !v)} className="flex items-start justify-between gap-3 text-left w-full">
          <div>
            <CardTitle className="text-sm font-semibold">{session.title}</CardTitle>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge className="bg-blue-50 text-blue-700">
                {SESSION_TYPE_LABELS[session.session_type] ?? session.session_type}
              </Badge>
              <Badge className={STATUS_COLOURS[session.status]}>
                {session.status}
              </Badge>
              <span className="text-xs text-slate-400">{formatDate(session.created_at)}</span>
            </div>
          </div>
          {open ? <ChevronUp className="w-4 h-4 shrink-0 mt-1 text-slate-400" /> : <ChevronDown className="w-4 h-4 shrink-0 mt-1 text-slate-400" />}
        </button>
      </CardHeader>

      {open && (
        <CardContent className="pt-0 space-y-4">
          {session.aim && (
            <div>
              <Label className="text-slate-500">Aim</Label>
              <p className="text-sm text-slate-800 mt-1">{session.aim}</p>
            </div>
          )}

          {session.pace_opening_script && (
            <div>
              <Label className="text-slate-500">Opening Script (PACE)</Label>
              <p className="text-sm text-slate-700 italic mt-1 leading-relaxed">{session.pace_opening_script}</p>
            </div>
          )}

          {session.session_steps?.length > 0 && (
            <div>
              <Label className="text-slate-500">Session Steps</Label>
              <div className="mt-2 space-y-2">
                {session.session_steps.map((step) => (
                  <div key={step.step_number} className="rounded-lg bg-slate-50 border p-3">
                    <p className="text-xs font-semibold text-slate-700">
                      Step {step.step_number}: {step.title}
                      {step.duration_minutes && (
                        <span className="font-normal text-slate-400 ml-2">({step.duration_minutes} min)</span>
                      )}
                    </p>
                    <p className="text-sm text-slate-700 mt-1">{step.description}</p>
                    {step.facilitator_prompt && (
                      <p className="text-xs text-violet-700 mt-1 italic">Prompt: {step.facilitator_prompt}</p>
                    )}
                    {step.child_activity && (
                      <p className="text-xs text-sky-700 mt-1">Activity: {step.child_activity}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {session.reflective_questions_staff?.length > 0 && (
            <div>
              <Label className="text-slate-500">Reflective Questions for Staff</Label>
              <ul className="mt-1 space-y-1">
                {session.reflective_questions_staff.map((q, i) => (
                  <li key={i} className="text-xs text-slate-700">• {q}</li>
                ))}
              </ul>
            </div>
          )}

          {session.child_friendly_version && (
            <div className="rounded-lg bg-sky-50 border border-sky-100 p-3">
              <Label className="text-sky-700">Child-Friendly Version</Label>
              <p className="text-sm text-slate-700 mt-1 leading-relaxed">{session.child_friendly_version}</p>
            </div>
          )}

          {session.status !== "completed" && canRecordOutcome && !showOutcomeForm && (
            <Button size="sm" variant="outline" onClick={() => setShowOutcomeForm(true)}>
              <ClipboardList className="w-3.5 h-3.5 mr-1.5" />
              Record Outcome
            </Button>
          )}

          {showOutcomeForm && (
            <div className="rounded-xl border bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-slate-700">Record Outcome</Label>
                <button onClick={() => setShowOutcomeForm(false)}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              {(
                [
                  { key: "child_response", label: "Child's Response" },
                  { key: "what_worked", label: "What Worked" },
                  { key: "what_did_not_work", label: "What Did Not Work" },
                  { key: "emotional_presentation", label: "Emotional Presentation" },
                ] as const
              ).map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                  <textarea
                    rows={2}
                    value={outcomeForm[key]}
                    onChange={(e) => setOutcomeForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 text-sm p-2 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
              ))}
              <div className="flex gap-3">
                {(["risk_change", "sustainability_change"] as const).map((field) => (
                  <div key={field} className="flex-1">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      {field === "risk_change" ? "Risk Change" : "Sustainability Change"}
                    </label>
                    <select
                      value={outcomeForm[field]}
                      onChange={(e) => setOutcomeForm((f) => ({ ...f, [field]: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 text-sm p-2 focus:outline-none focus:ring-2 focus:ring-violet-400"
                    >
                      <option value="unknown">Unknown</option>
                      <option value="improved">Improved</option>
                      <option value="unchanged">Unchanged</option>
                      <option value="deteriorated">Deteriorated</option>
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`far-${session.id}`}
                  checked={outcomeForm.further_action_required}
                  onChange={(e) => setOutcomeForm((f) => ({ ...f, further_action_required: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor={`far-${session.id}`} className="text-xs text-slate-700">
                  Further action required
                </label>
              </div>
              {outcomeForm.further_action_required && (
                <textarea
                  rows={2}
                  placeholder="Describe further action needed..."
                  value={outcomeForm.further_action_notes}
                  onChange={(e) => setOutcomeForm((f) => ({ ...f, further_action_notes: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 text-sm p-2 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              )}
              <Button
                size="sm"
                disabled={createOutcome.isPending}
                onClick={() => {
                  createOutcome.mutate({
                    home_id: session.home_id,
                    intervention_session_id: session.id,
                    child_id: session.child_id,
                    child_response: outcomeForm.child_response,
                    what_worked: outcomeForm.what_worked,
                    what_did_not_work: outcomeForm.what_did_not_work,
                    emotional_presentation: outcomeForm.emotional_presentation,
                    risk_change: outcomeForm.risk_change as LiversOutcomeRecord["risk_change"],
                    sustainability_change: outcomeForm.sustainability_change as LiversOutcomeRecord["sustainability_change"],
                    further_action_required: outcomeForm.further_action_required,
                    further_action_notes: outcomeForm.further_action_notes,
                    created_by: currentUser?.id ?? "staff_darren",
                    user_role: currentRole,
                  });
                  setShowOutcomeForm(false);
                }}
              >
                {createOutcome.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
                Save Outcome
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ── Generator Form ────────────────────────────────────────────────────────────

function LiversGeneratorForm({
  childId,
  homeId,
  youngPersonName,
  existingRecords,
  onAnalysisCreated,
  canCreateAnalysis,
}: {
  childId: string;
  homeId: string;
  youngPersonName: string;
  existingRecords: string;
  onAnalysisCreated: (a: LiversAnalysis) => void;
  canCreateAnalysis: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createAnalysis = useCreateLiversAnalysis();
  const { currentUser, currentRole } = useAuthContext();

  async function handleGenerate() {
    if (!canCreateAnalysis) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ data: { parsed: Record<string, unknown> } }>("/aria", {
        mode: "livers_analysis",
        page_context: `Child: ${youngPersonName}\nHome: ${homeId}`,
        source_content: existingRecords || `No records provided. Perform analysis from available context only and flag insufficient_information where needed.`,
        max_tokens: 3000,
      });

      const parsed = res.data?.parsed;
      if (!parsed) throw new Error("ARIA did not return a valid analysis.");

      createAnalysis.mutate(
        {
          home_id: homeId,
          child_id: childId,
          lived_experience_summary: parsed.lived_experience_summary as string,
          immediate_cumulative_risk: parsed.immediate_cumulative_risk as string,
          risk_pattern: parsed.risk_pattern as string,
          viability_of_change: parsed.viability_of_change as string,
          viability_rating: parsed.viability_rating as "low" | "moderate" | "high",
          environment_system_forces: parsed.environment_system_forces as string,
          relational_psychological_drivers: parsed.relational_psychological_drivers as string,
          sustainability_independence_safety: parsed.sustainability_independence_safety as string,
          sustainability_rating: parsed.sustainability_rating as "low" | "moderate" | "high",
          aria_summary: parsed.aria_summary as string,
          aria_confidence: parsed.aria_confidence as "high" | "possible" | "needs_human_review" | "insufficient_information",
          recommended_intervention_type: parsed.recommended_intervention_type as string,
          escalation_required: parsed.escalation_required as boolean,
          escalation_actions: parsed.escalation_actions as string[],
          management_oversight: parsed.management_oversight as string,
          status: "draft",
          created_by: currentUser?.id ?? "staff_darren",
          user_role: currentRole,
        },
        {
          onSuccess: (r) => {
            onAnalysisCreated(r.data);
          },
          onError: () => setError("Failed to save analysis."),
        }
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <Button onClick={handleGenerate} disabled={loading || !canCreateAnalysis} className="gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        Generate L.I.V.E.R.S. Analysis with ARIA
      </Button>
      {!canCreateAnalysis && (
        <p className="text-xs text-slate-500">Your role has view-only access for analysis generation.</p>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LiversPage() {
  const { currentUser, currentRole } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const access = getLiversRoleAccess(currentRole);

  const { data: ypData } = useYoungPeople();
  const youngPeople = (ypData?.data ?? []).filter((yp) => yp.home_id === homeId);

  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [recordsInput, setRecordsInput] = useState("");
  const [generatingActionKey, setGeneratingActionKey] = useState<string | null>(null);

  const createSession = useCreateInterventionSession();
  const updateAnalysis = useUpdateLiversAnalysis();

  const { data: analysesData } = useLiversAnalyses({
    childId: selectedChildId || undefined,
    homeId: selectedChildId ? undefined : homeId,
  });
  const analyses = analysesData?.data ?? [];

  const { data: sessionsData } = useInterventionSessions({
    childId: selectedChildId || undefined,
    homeId: selectedChildId ? undefined : homeId,
  });
  const sessions = sessionsData?.data ?? [];

  const youngPersonName = useMemo(
    () => (selectedChildId ? getYPName(selectedChildId) : ""),
    [selectedChildId]
  );

  const sessionsByAnalysis = useMemo(() => {
    const map: Record<string, InterventionSession[]> = {};
    for (const s of sessions) {
      if (!s.livers_analysis_id) continue;
      if (!map[s.livers_analysis_id]) map[s.livers_analysis_id] = [];
      map[s.livers_analysis_id].push(s);
    }
    return map;
  }, [sessions]);

  async function handleGenerateIntervention(analysis: LiversAnalysis, sessionType: string, action: string) {
    if (!access.canGenerateActions) return;
    setGeneratingActionKey(`${analysis.id}:${action}`);
    try {
      const res = await api.post<{ data: { parsed: Record<string, unknown> } }>("/aria", {
        mode: "livers_intervention",
        page_context: `Child: ${youngPersonName}\nSession type: ${sessionType}\nL.I.V.E.R.S. Analysis ID: ${analysis.id}`,
        source_content: [
          `L - Lived Experience: ${analysis.lived_experience_summary ?? ""}`,
          `I - Immediate Risk: ${analysis.immediate_cumulative_risk ?? ""}`,
          `V - Viability: ${analysis.viability_of_change ?? ""} (${analysis.viability_rating ?? ""})`,
          `E - Environment: ${analysis.environment_system_forces ?? ""}`,
          `R - Relational Drivers: ${analysis.relational_psychological_drivers ?? ""}`,
          `S - Sustainability: ${analysis.sustainability_independence_safety ?? ""} (${analysis.sustainability_rating ?? ""})`,
          `ARIA Summary: ${analysis.aria_summary ?? ""}`,
          `Recommended intervention: ${analysis.recommended_intervention_type ?? ""}`,
        ].join("\n"),
        max_tokens: 4000,
      });

      const parsed = res.data?.parsed;
      if (!parsed) return;

      createSession.mutate({
        home_id: homeId,
        child_id: analysis.child_id,
        livers_analysis_id: analysis.id,
        title: parsed.title as string,
        session_type: (parsed.session_type ?? sessionType) as InterventionSession["session_type"],
        reason_for_session: parsed.reason_for_session as string,
        aim: parsed.aim as string,
        staff_preparation: parsed.staff_preparation as string,
        emotional_safety_notes: parsed.emotional_safety_notes as string,
        pace_opening_script: parsed.pace_opening_script as string,
        session_steps: (parsed.session_steps ?? []) as InterventionSession["session_steps"],
        child_friendly_version: parsed.child_friendly_version as string,
        reflective_questions_child: (parsed.reflective_questions_child ?? []) as string[],
        reflective_questions_staff: (parsed.reflective_questions_staff ?? []) as string[],
        follow_up_actions: (parsed.follow_up_actions ?? []) as string[],
        management_oversight_note: parsed.management_oversight_note as string,
        status: "draft",
        created_by: currentUser?.id ?? "staff_darren",
        user_role: currentRole,
      });
    } finally {
      setGeneratingActionKey(null);
    }
  }

  async function handleReviewSustainability(analysis: LiversAnalysis) {
    if (!access.canReviewSustainability) return;
    setGeneratingActionKey(`${analysis.id}:sustainability`);
    try {
      const res = await api.post<{ data: { parsed: Record<string, unknown> } }>("/aria", {
        mode: "livers_escalation",
        page_context: `Child: ${youngPersonName}\nL.I.V.E.R.S. Analysis ID: ${analysis.id}`,
        source_content: [
          `L - Lived Experience: ${analysis.lived_experience_summary ?? ""}`,
          `I - Immediate Risk: ${analysis.immediate_cumulative_risk ?? ""}`,
          `V - Viability: ${analysis.viability_of_change ?? ""} (${analysis.viability_rating ?? ""})`,
          `E - Environment: ${analysis.environment_system_forces ?? ""}`,
          `R - Relational Drivers: ${analysis.relational_psychological_drivers ?? ""}`,
          `S - Sustainability: ${analysis.sustainability_independence_safety ?? ""} (${analysis.sustainability_rating ?? ""})`,
          `Current escalation_required: ${analysis.escalation_required ? "true" : "false"}`,
        ].join("\n"),
        max_tokens: 1800,
      });

      const parsed = res.data?.parsed;
      if (!parsed) return;

      updateAnalysis.mutate({
        id: analysis.id,
        escalation_required: Boolean(parsed.escalation_required),
        escalation_actions: Array.isArray(parsed.escalation_actions)
          ? (parsed.escalation_actions as string[])
          : analysis.escalation_actions,
        management_oversight:
          (parsed.management_oversight_note as string | undefined) ??
          analysis.management_oversight,
        user_role: currentRole,
      });
    } finally {
      setGeneratingActionKey(null);
    }
  }

  function handleGenerateAction(
    analysis: LiversAnalysis,
    action: "intervention" | "child" | "staff" | "resource" | "management"
  ) {
    const typeByAction: Record<typeof action, InterventionSession["session_type"]> = {
      intervention:
        (analysis.recommended_intervention_type as InterventionSession["session_type"]) ??
        "key_work_session",
      child: "child_friendly_worksheet",
      staff: "staff_guidance_note",
      resource: "infographic",
      management: "management_oversight_analysis",
    };

    void handleGenerateIntervention(analysis, typeByAction[action], action);
  }

  const escalationCount = analyses.filter((a) => a.escalation_required).length;

  return (
    <PageShell
      title="L.I.V.E.R.S. Intervention Intelligence"
      subtitle="Structured, trauma-informed analysis and intervention planning rooted in the child's lived experience."
      actions={<SmartUploadButton variant="inline" label="Upload Intervention Document" uploadContext="ARIA Intelligence — LIVERS intervention supporting document upload" />}
    >
      <div className="space-y-6 max-w-4xl">
        {/* Escalation banner */}
        {escalationCount > 0 && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <p className="font-semibold text-red-700 text-sm">
                {escalationCount} analysis{escalationCount > 1 ? "es" : ""} flagged for escalation
              </p>
              <p className="text-xs text-red-600 mt-0.5">Review escalation actions below before proceeding.</p>
            </div>
          </div>
        )}

        {/* Child selector */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Select Child</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <select
              value={selectedChildId}
              onChange={(e) => {
                setSelectedChildId(e.target.value);
                setRecordsInput("");
              }}
              className="w-full rounded-lg border border-slate-200 text-sm p-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              <option value="">— Select a young person —</option>
              {youngPeople.map((yp) => (
                <option key={yp.id} value={yp.id}>
                  {getYPName(yp.id)}
                </option>
              ))}
            </select>

            {selectedChildId && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Paste records / context for ARIA to analyse (optional but recommended)
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Paste key work notes, incident records, missing episode details, risk assessment extracts, chronology entries..."
                    value={recordsInput}
                    onChange={(e) => setRecordsInput(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 text-sm p-2.5 resize-y focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    ARIA will use this alongside any existing analysis. The more context, the more accurate the output.
                  </p>
                </div>

                <LiversGeneratorForm
                  childId={selectedChildId}
                  homeId={homeId}
                  youngPersonName={youngPersonName}
                  existingRecords={recordsInput}
                  onAnalysisCreated={() => {}}
                  canCreateAnalysis={access.canCreateAnalysis}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Analyses */}
        {analyses.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet-500" />
                Analyses ({analyses.length})
                {selectedChildId && youngPersonName && (
                  <span className="text-slate-400 font-normal">— {youngPersonName}</span>
                )}
              </h2>
            </div>

            {analyses.map((analysis) => (
              <div key={analysis.id} className="space-y-3">
                <AnalysisCard
                  analysis={analysis}
                  onGenerateAction={handleGenerateAction}
                  onReviewSustainability={handleReviewSustainability}
                  generatingKey={generatingActionKey}
                  access={access}
                />

                {/* Sessions linked to this analysis */}
                {(sessionsByAnalysis[analysis.id]?.length ?? 0) > 0 && (
                  <div className="pl-4 border-l-2 border-violet-100 space-y-2">
                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                      <ArrowUpRight className="w-3 h-3" />
                      Intervention Sessions ({sessionsByAnalysis[analysis.id].length})
                    </p>
                    {sessionsByAnalysis[analysis.id].map((s) => (
                      <SessionCard key={s.id} session={s} canRecordOutcome={access.canRecordOutcome} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Unlinked sessions */}
        {sessions.filter((s) => !s.livers_analysis_id).length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-700">
              Other Intervention Sessions
            </h2>
            {sessions
              .filter((s) => !s.livers_analysis_id)
              .map((s) => (
                <SessionCard key={s.id} session={s} canRecordOutcome={access.canRecordOutcome} />
              ))}
          </div>
        )}

        {/* Empty state */}
        {analyses.length === 0 && sessions.length === 0 && selectedChildId && (
          <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center">
            <Layers className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No analyses yet for this child</p>
            <p className="text-xs text-slate-400 mt-1">
              Add context above and generate a L.I.V.E.R.S. Analysis with ARIA to get started.
            </p>
          </div>
        )}

        {!selectedChildId && analyses.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center">
            <Layers className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">Select a young person to begin</p>
            <p className="text-xs text-slate-400 mt-1">
              L.I.V.E.R.S. analysis ensures every intervention is rooted in the child&apos;s lived experience.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
