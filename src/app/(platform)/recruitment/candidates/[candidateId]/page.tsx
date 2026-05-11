"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AriaPanel } from "@/components/aria/aria-panel";
import {
  ChevronLeft, AlertTriangle, CheckCircle2, Clock, Shield,
  FileCheck, User, Users, Globe, GraduationCap, Briefcase, Heart,
  ChevronRight, Star, Mail, Phone, Calendar, Sparkles, Activity,
  FileText, Eye, Flag, Fingerprint, Building2, Zap, Copy,
  ExternalLink, MoreHorizontal, RefreshCw, ClipboardCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn, formatDate } from "@/lib/utils";
import {
  useCandidate, useUpdateCheck, useUpdateReference,
  useCreateReference, useUpdateOffer,
} from "@/hooks/use-recruitment";
import type { RecruitmentCheck, RecruitmentReference, Interview, Offer, RecruitmentAuditEntry } from "@/hooks/use-recruitment";
import { useAuthContext } from "@/contexts/auth-context";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STAGE_ORDER = [
  "enquiry", "application_received", "sift", "interview_scheduled",
  "interview_completed", "references_requested", "references_received",
  "dbs_submitted", "dbs_received", "conditional_offer", "pre_start_checks",
  "final_clearance", "onboarding", "appointed",
];

const STAGE_LABELS: Record<string, string> = {
  enquiry: "Enquiry", application_received: "Application", sift: "Sift",
  interview_scheduled: "Interview Scheduled", interview_completed: "Interview Done",
  references_requested: "References Out", references_received: "References In",
  dbs_submitted: "DBS Submitted", dbs_received: "DBS Received",
  conditional_offer: "Conditional Offer", pre_start_checks: "Pre-Start Checks",
  final_clearance: "Final Clearance", onboarding: "Onboarding", appointed: "Appointed",
  unsuccessful: "Unsuccessful", withdrawn: "Withdrawn", offer_made: "Offer Made", started: "Started",
};

const CHECK_META: Record<string, { label: string; icon: React.ElementType; description: string }> = {
  enhanced_dbs: { label: "Enhanced DBS", icon: Fingerprint, description: "Enhanced Disclosure and Barring Service check (Children's Barred List)" },
  barred_list: { label: "Barred List", icon: Shield, description: "DBS Children's Barred List check" },
  right_to_work: { label: "Right to Work", icon: FileCheck, description: "Legal verification of right to work in the UK" },
  identity: { label: "Identity", icon: User, description: "Photo ID and proof of address verified in person" },
  overseas_criminal_record: { label: "Overseas Record", icon: Globe, description: "Criminal record check for time spent abroad (3+ months)" },
  professional_qualifications: { label: "Qualifications", icon: GraduationCap, description: "Level 3 in Children & Young People or equivalent" },
  employment_history: { label: "Employment History", icon: Briefcase, description: "5-year employment history verified including gap explanations" },
  medical_fitness: { label: "Medical Fitness", icon: Heart, description: "Occupational health clearance" },
  social_media: { label: "Social Media", icon: ExternalLink, description: "Publicly accessible social media reviewed" },
  references: { label: "References", icon: Users, description: "2 references, one from most recent employer" },
  driving_licence: { label: "Driving Licence", icon: FileText, description: "Driving licence checked if driving role" },
  safeguarding_training_check: { label: "Safeguarding Training", icon: ClipboardCheck, description: "Evidence of prior safeguarding training/awareness" },
};

const CHECK_STATUS_DISPLAY: Record<string, { label: string; color: string; ring: string }> = {
  not_started: { label: "Not Started", color: "bg-slate-100 text-[var(--cs-text-muted)]", ring: "ring-slate-200" },
  requested: { label: "Requested", color: "bg-blue-100 text-blue-700", ring: "ring-blue-200" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700", ring: "ring-blue-300" },
  received: { label: "Received", color: "bg-amber-100 text-amber-700", ring: "ring-amber-200" },
  verified: { label: "Verified", color: "bg-emerald-100 text-emerald-700", ring: "ring-emerald-300" },
  concern_flagged: { label: "Concern Flagged", color: "bg-red-100 text-red-700", ring: "ring-red-300" },
  override_approved: { label: "Override Approved", color: "bg-purple-100 text-purple-700", ring: "ring-purple-300" },
  not_required: { label: "Not Required", color: "bg-slate-100 text-[var(--cs-text-muted)]", ring: "ring-slate-100" },
};

const REF_STATUS_DISPLAY: Record<string, { label: string; color: string }> = {
  not_requested: { label: "Not Requested", color: "bg-slate-100 text-[var(--cs-text-muted)]" },
  requested: { label: "Requested", color: "bg-blue-100 text-blue-700" },
  chased: { label: "Chased", color: "bg-amber-100 text-amber-700" },
  received: { label: "Received", color: "bg-amber-100 text-amber-700" },
  satisfactory: { label: "Satisfactory", color: "bg-emerald-100 text-emerald-700" },
  unsatisfactory: { label: "Unsatisfactory", color: "bg-red-100 text-red-700" },
  concerns_noted: { label: "Concerns Noted", color: "bg-red-100 text-red-700" },
  verbal_only: { label: "Verbal Only", color: "bg-amber-100 text-amber-700" },
  uncontactable: { label: "Uncontactable", color: "bg-slate-100 text-[var(--cs-text-muted)]" },
};

function ComplianceRing({ score }: { score: number }) {
  const radius = 32;
  const stroke = 4;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const dim = (radius + stroke) * 2;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={dim} height={dim} className="-rotate-90">
        <circle cx={dim / 2} cy={dim / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle cx={dim / 2} cy={dim / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute text-center">
        <div className="text-lg font-bold" style={{ color }}>{score}</div>
        <div className="text-[9px] text-[var(--cs-text-muted)] -mt-0.5">%</div>
      </div>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = "overview" | "checks" | "references" | "history" | "interviews" | "offer" | "audit";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "checks", label: "Checks" },
  { id: "references", label: "References" },
  { id: "history", label: "Employment History" },
  { id: "interviews", label: "Interviews" },
  { id: "offer", label: "Offer" },
  { id: "audit", label: "Audit" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CandidateDetailPage() {
  const { currentUser } = useAuthContext();
  const params = useParams();
  const candidateId = params?.candidateId as string;
  const { data, isLoading, error } = useCandidate(candidateId);
  const updateCheck = useUpdateCheck();
  const updateReference = useUpdateReference();
  const createReference = useCreateReference();
  const updateOffer = useUpdateOffer();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [expandedCheck, setExpandedCheck] = useState<string | null>(null);
  const [showAria, setShowAria] = useState(false);

  // Check action modals
  const [flagConcern, setFlagConcern] = useState<{ checkId: string; notes: string } | null>(null);
  const [requestOverride, setRequestOverride] = useState<{ checkId: string; reason: string } | null>(null);

  // Reference modals
  const [showAddRef, setShowAddRef] = useState(false);
  const [addRefForm, setAddRefForm] = useState({
    referee_name: "", referee_org: "", referee_role: "",
    referee_email: "", relationship: "employer", is_most_recent_employer: false,
  });
  const [addRefError, setAddRefError] = useState("");

  function handleMarkVerified(check: RecruitmentCheck) {
    updateCheck.mutate({
      checkId: check.id,
      candidateId,
      data: {
        status: "verified",
        verified_by: currentUser?.id ?? "staff_darren",
        verified_at: new Date().toISOString(),
      },
    });
  }

  function handleFlagConcernSubmit() {
    if (!flagConcern) return;
    updateCheck.mutate({
      checkId: flagConcern.checkId,
      candidateId,
      data: {
        status: "concern_flagged",
        concern_flag: true,
        concern_notes: flagConcern.notes,
      },
    });
    setFlagConcern(null);
  }

  function handleOverrideSubmit() {
    if (!requestOverride) return;
    updateCheck.mutate({
      checkId: requestOverride.checkId,
      candidateId,
      data: {
        status: "override_approved",
        override_reason: requestOverride.reason,
      },
    });
    setRequestOverride(null);
  }

  function handleChaseReference(ref: RecruitmentReference) {
    // Records the chase as an audit event — status stays "requested"
    updateReference.mutate({
      referenceId: ref.id,
      candidateId,
      data: { status: "requested" },
    });
  }

  function handleMarkSatisfactory(ref: RecruitmentReference) {
    updateReference.mutate({
      referenceId: ref.id,
      candidateId,
      data: {
        status: "satisfactory",
        received_date: new Date().toISOString().slice(0, 10),
      },
    });
  }

  function handleAddRefSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!addRefForm.referee_name.trim()) {
      setAddRefError("Referee name is required");
      return;
    }
    if (!addRefForm.relationship.trim()) {
      setAddRefError("Relationship is required");
      return;
    }
    createReference.mutate(
      {
        candidate_id: candidateId,
        referee_name: addRefForm.referee_name,
        referee_org: addRefForm.referee_org || undefined,
        referee_role: addRefForm.referee_role || undefined,
        referee_email: addRefForm.referee_email || undefined,
        relationship: addRefForm.relationship,
        is_most_recent_employer: addRefForm.is_most_recent_employer,
      },
      {
        onSuccess: () => {
          setShowAddRef(false);
          setAddRefForm({ referee_name: "", referee_org: "", referee_role: "", referee_email: "", relationship: "employer", is_most_recent_employer: false });
          setAddRefError("");
        },
        onError: () => setAddRefError("Failed to add reference. Please try again."),
      }
    );
  }

  function handleGrantFinalClearance() {
    updateOffer.mutate({ candidateId, action: "grant_final_clearance", by: currentUser?.id ?? "staff_darren" });
  }

  if (isLoading) return (
    <PageShell title="Loading..." subtitle="" showQuickCreate={false}>
      <div className="space-y-4 animate-pulse">
        <div className="h-20 rounded-2xl bg-slate-100" />
        <div className="h-64 rounded-2xl bg-slate-100" />
      </div>
    </PageShell>
  );

  if (error || !data) return (
    <PageShell title="Candidate" subtitle="" showQuickCreate={false}>
      <Card className="rounded-2xl border-red-100 bg-red-50">
        <CardContent className="py-8 text-center text-red-600">
          <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
          Failed to load candidate. The candidate may not exist.
          <div className="mt-4">
            <Link href="/recruitment/candidates">
              <Button variant="outline" size="sm">Back to Candidates</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );

  const candidate = data.data;
  const stageIdx = STAGE_ORDER.indexOf(candidate.stage);
  const hasBlockers = candidate.blocker_summary?.length > 0;

  const RISK_COLORS: Record<string, string> = {
    low: "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-red-100 text-red-700",
    critical: "bg-red-900 text-white",
  };

  return (
    <>
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-[var(--cs-border)] px-6 py-3">
        <div className="flex items-center gap-4 flex-wrap">
          <Link href="/recruitment/candidates" className="text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-lg font-bold text-[var(--cs-navy)]">
                {candidate.first_name} {candidate.last_name}
              </h1>
              <span className={cn("text-[10px] rounded-full px-2.5 py-1 font-semibold",
                "bg-blue-100 text-blue-700"
              )}>
                {STAGE_LABELS[candidate.stage] ?? candidate.stage}
              </span>
              <span className={cn("text-[10px] rounded-full px-2.5 py-1 font-semibold uppercase",
                RISK_COLORS[candidate.risk_level] ?? "bg-slate-100 text-[var(--cs-text-muted)]"
              )}>
                {candidate.risk_level} risk
              </span>
              {hasBlockers && (
                <span className="flex items-center gap-1 text-[10px] bg-red-100 text-red-700 rounded-full px-2.5 py-1 font-semibold">
                  <AlertTriangle className="h-3 w-3" />
                  {candidate.blocker_summary.length} blocker{candidate.blocker_summary.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="text-xs text-[var(--cs-text-muted)] mt-0.5">{candidate.role_applied} · {candidate.email}</div>
          </div>

          <div className="flex items-center gap-2">
            <PrintButton title={`${candidate.first_name} ${candidate.last_name}`} subtitle="Oak House — Candidate Profile" targetId="candidate-detail-content" />
            <ComplianceRing score={candidate.compliance_score} />
            <SmartUploadButton
              variant="icon"
              uploadContext={`Candidate ${candidate.first_name} ${candidate.last_name} — DBS/reference/right to work upload`}
            />
            <Button
              variant="outline" size="sm"
              className="rounded-xl border-[var(--cs-aria-gold-soft)] text-[var(--cs-aria-gold)]"
              onClick={() => setShowAria(s => !s)}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Aria
            </Button>
          </div>
        </div>

        {/* Tab strip */}
        <div className="flex gap-0.5 mt-3 -mb-3">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "px-4 py-2 text-xs font-medium border-b-2 transition-all",
                activeTab === id
                  ? "border-slate-900 text-[var(--cs-navy)]"
                  : "border-transparent text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div id="candidate-detail-content" className="flex flex-1 gap-4 p-6">
        {/* Left column */}
        <div className="w-[220px] shrink-0 space-y-4">
          {/* Stage progress */}
          <Card className="rounded-2xl border-[var(--cs-border-subtle)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">Stage</CardTitle>
            </CardHeader>
            <CardContent className="py-0 pb-3">
              <div className="space-y-1">
                {STAGE_ORDER.map((stage, idx) => {
                  const isDone = idx < stageIdx;
                  const isCurrent = idx === stageIdx;
                  return (
                    <div key={stage} className="flex items-center gap-2">
                      <div className={cn(
                        "h-4 w-4 rounded-full flex items-center justify-center shrink-0",
                        isDone ? "bg-emerald-500" : isCurrent ? "bg-blue-600" : "bg-slate-200"
                      )}>
                        {isDone && <CheckCircle2 className="h-3 w-3 text-white" />}
                        {isCurrent && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                      <span className={cn(
                        "text-[10px]",
                        isCurrent ? "font-semibold text-[var(--cs-navy)]" : isDone ? "text-emerald-700" : "text-[var(--cs-text-muted)]"
                      )}>
                        {STAGE_LABELS[stage]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Blockers */}
          {hasBlockers && (
            <Card className="rounded-2xl border-red-100 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Blockers
                </CardTitle>
              </CardHeader>
              <CardContent className="py-0 pb-3">
                <div className="space-y-2">
                  {candidate.blocker_summary.map((b, i) => (
                    <p key={i} className="text-[10px] text-red-700 leading-relaxed">{b}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next actions */}
          {candidate.next_actions?.length > 0 && (
            <Card className="rounded-2xl border-amber-100 bg-amber-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" /> Next 3 Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="py-0 pb-3">
                <div className="space-y-2">
                  {candidate.next_actions.slice(0, 3).map((a, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <ChevronRight className="h-3 w-3 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-800 leading-relaxed">{a}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Checks Verified", value: `${candidate.checks?.filter(c => c.status === "verified").length ?? 0}/${candidate.checks?.length ?? 0}`, icon: CheckCircle2, color: "text-emerald-600" },
                  { label: "Refs Received", value: `${candidate.references?.filter(r => ["received", "satisfactory", "verbal_only"].includes(r.status)).length ?? 0}/2`, icon: Users, color: "text-blue-600" },
                  { label: "Days in Stage", value: candidate.days_in_stage, icon: Clock, color: candidate.days_in_stage > 14 ? "text-amber-600" : "text-[var(--cs-text-secondary)]" },
                  { label: "Proposed Start", value: candidate.start_date ? formatDate(candidate.start_date) : "TBC", icon: Calendar, color: "text-[var(--cs-text-secondary)]" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <Card key={label} className="rounded-2xl border-[var(--cs-border-subtle)]">
                    <CardContent className="py-3 px-4 flex items-center gap-3">
                      <Icon className={cn("h-5 w-5 shrink-0", color)} />
                      <div>
                        <div className={cn("text-lg font-bold", color)}>{value}</div>
                        <div className="text-[10px] text-[var(--cs-text-muted)]">{label}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Checks grid */}
              <Card className="rounded-2xl border-[var(--cs-border-subtle)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-[var(--cs-text-secondary)]">Compliance Checks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(candidate.checks ?? []).map((check) => {
                      const meta = CHECK_META[check.check_type];
                      const Icon = meta?.icon ?? Shield;
                      const status = CHECK_STATUS_DISPLAY[check.status] ?? CHECK_STATUS_DISPLAY.not_started;
                      return (
                        <button
                          key={check.id}
                          onClick={() => { setActiveTab("checks"); setExpandedCheck(check.id); }}
                          className={cn(
                            "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all hover:shadow-sm",
                            check.status === "verified" ? "border-emerald-200 bg-emerald-50" :
                            check.concern_flag ? "border-red-200 bg-red-50" :
                            check.override_reason != null ? "border-purple-200 bg-purple-50" :
                            "border-[var(--cs-border-subtle)] bg-white hover:border-[var(--cs-border)]"
                          )}
                        >
                          <Icon className={cn("h-4 w-4 shrink-0",
                            check.status === "verified" ? "text-emerald-500" :
                            check.concern_flag ? "text-red-500" :
                            "text-[var(--cs-text-muted)]"
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-semibold text-[var(--cs-text-secondary)] truncate">{meta?.label ?? check.check_type}</div>
                            <span className={cn("text-[9px] rounded-full px-1.5 py-0.5 font-medium", status.color)}>
                              {status.label}
                            </span>
                          </div>
                          {check.concern_flag && <Flag className="h-3 w-3 text-red-500 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Employment overview */}
              {(candidate.employment_history ?? []).length > 0 && (
                <Card className="rounded-2xl border-[var(--cs-border-subtle)]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-[var(--cs-text-secondary)]">Employment Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {candidate.employment_history.slice(0, 3).map((e, i) => (
                        <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                          <Briefcase className="h-4 w-4 text-[var(--cs-text-gentle)] shrink-0" />
                          <div className="flex-1">
                            <div className="text-xs font-medium text-[var(--cs-text-secondary)]">{e.role_title} · {e.employer}</div>
                            <div className="text-[10px] text-[var(--cs-text-muted)]">
                              {formatDate(e.start_date)} – {e.end_date ? formatDate(e.end_date) : "Present"}
                            </div>
                          </div>
                          {e.verified ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Clock className="h-3.5 w-3.5 text-[var(--cs-text-gentle)]" />
                          )}
                        </div>
                      ))}
                      {candidate.employment_gaps?.length > 0 && (
                        <div className="mt-2 flex items-center gap-2 p-2 rounded-xl bg-amber-50 border border-amber-100">
                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                          <span className="text-xs text-amber-700">
                            {candidate.employment_gaps.length} employment gap{candidate.employment_gaps.length !== 1 ? "s" : ""} detected — click Employment History tab to review
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* CHECKS TAB */}
          {activeTab === "checks" && (
            <div className="space-y-3">
              {(candidate.checks ?? []).map((check) => {
                const meta = CHECK_META[check.check_type];
                const Icon = meta?.icon ?? Shield;
                const status = CHECK_STATUS_DISPLAY[check.status] ?? CHECK_STATUS_DISPLAY.not_started;
                const isExpanded = expandedCheck === check.id;
                return (
                  <Card key={check.id} className={cn(
                    "rounded-2xl border transition-all",
                    check.concern_flag ? "border-red-200" :
                    check.status === "verified" ? "border-emerald-100" :
                    check.override_reason ? "border-purple-100" :
                    "border-[var(--cs-border-subtle)]"
                  )}>
                    <button
                      className="w-full flex items-center gap-4 p-4 text-left"
                      onClick={() => setExpandedCheck(isExpanded ? null : check.id)}
                    >
                      <div className={cn(
                        "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
                        check.status === "verified" ? "bg-emerald-100" :
                        check.concern_flag ? "bg-red-100" :
                        check.override_reason ? "bg-purple-100" :
                        "bg-slate-100"
                      )}>
                        <Icon className={cn("h-4 w-4",
                          check.status === "verified" ? "text-emerald-600" :
                          check.concern_flag ? "text-red-600" :
                          check.override_reason ? "text-purple-600" :
                          "text-[var(--cs-text-muted)]"
                        )} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--cs-navy)]">{meta?.label ?? check.check_type}</span>
                          {check.concern_flag && <span className="text-[9px] bg-red-100 text-red-600 rounded-full px-1.5 py-0.5 font-semibold flex items-center gap-0.5"><Flag className="h-2.5 w-2.5" /> Concern</span>}
                          {check.override_reason && <span className="text-[9px] bg-purple-100 text-purple-700 rounded-full px-1.5 py-0.5 font-semibold">Override</span>}
                        </div>
                        <div className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">{meta?.description}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn("text-[10px] rounded-full px-2.5 py-1 font-semibold", status.color)}>
                          {status.label}
                        </span>
                        <ChevronRight className={cn("h-4 w-4 text-[var(--cs-text-gentle)] transition-transform", isExpanded && "rotate-90")} />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-slate-50 pt-3 space-y-3">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-[11px]">
                          {check.requested_date && (
                            <div><span className="text-[var(--cs-text-muted)]">Requested</span><div className="font-medium text-[var(--cs-text-secondary)]">{formatDate(check.requested_date)}</div></div>
                          )}
                          {check.received_date && (
                            <div><span className="text-[var(--cs-text-muted)]">Received</span><div className="font-medium text-[var(--cs-text-secondary)]">{formatDate(check.received_date)}</div></div>
                          )}
                          {check.verified_at && (
                            <div><span className="text-[var(--cs-text-muted)]">Verified</span><div className="font-medium text-[var(--cs-text-secondary)]">{formatDate(check.verified_at)} by {check.verified_by}</div></div>
                          )}
                          {check.certificate_number && (
                            <div><span className="text-[var(--cs-text-muted)]">Certificate #</span><div className="font-mono font-medium text-[var(--cs-text-secondary)]">{check.certificate_number}</div></div>
                          )}
                          {check.document_type && (
                            <div><span className="text-[var(--cs-text-muted)]">Document</span><div className="font-medium text-[var(--cs-text-secondary)]">{check.document_type}</div></div>
                          )}
                          {check.expiry_date && (
                            <div><span className="text-[var(--cs-text-muted)]">Expiry</span><div className="font-medium text-[var(--cs-text-secondary)]">{formatDate(check.expiry_date)}</div></div>
                          )}
                        </div>
                        {check.concern_notes && (
                          <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700">
                            <Flag className="h-3 w-3 inline mr-1.5" />{check.concern_notes}
                          </div>
                        )}
                        {check.override_reason && (
                          <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-xs text-purple-700">
                            Override: {check.override_reason}
                          </div>
                        )}
                        <div className="flex gap-2 flex-wrap">
                          {check.status !== "verified" && check.status !== "override_approved" && (
                            <Button
                              size="sm"
                              disabled={updateCheck.isPending}
                              onClick={() => handleMarkVerified(check)}
                              className="h-7 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px]"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {updateCheck.isPending ? "Saving…" : "Mark Verified"}
                            </Button>
                          )}
                          {!check.concern_flag && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setFlagConcern({ checkId: check.id, notes: "" })}
                              className="h-7 rounded-xl border-red-200 text-red-600 text-[10px]"
                            >
                              <Flag className="h-3 w-3 mr-1" /> Flag Concern
                            </Button>
                          )}
                          {check.status !== "verified" && check.status !== "override_approved" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setRequestOverride({ checkId: check.id, reason: "" })}
                              className="h-7 rounded-xl text-purple-700 text-[10px]"
                            >
                              Request Override
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
              {(candidate.checks ?? []).length === 0 && (
                <Card className="rounded-2xl border-[var(--cs-border-subtle)]">
                  <CardContent className="py-10 text-center text-[var(--cs-text-muted)]">
                    <Shield className="h-8 w-8 mx-auto mb-3 text-slate-200" />
                    <div className="text-sm">No checks recorded yet</div>
                    <div className="text-xs mt-1">Checks are created automatically when a candidate is added</div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* REFERENCES TAB */}
          {activeTab === "references" && (
            <div className="space-y-3">
              {(candidate.references ?? []).length > 0 && (
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => setShowAddRef(true)} className="rounded-xl bg-slate-900 text-white text-xs">
                    <Users className="h-3 w-3 mr-1" /> Add Reference
                  </Button>
                </div>
              )}
              {(candidate.references ?? []).length === 0 ? (
                <Card className="rounded-2xl border-[var(--cs-border-subtle)]">
                  <CardContent className="py-10 text-center text-[var(--cs-text-muted)]">
                    <Users className="h-8 w-8 mx-auto mb-3 text-slate-200" />
                    <div className="text-sm">No references on record</div>
                    <Button
                      size="sm"
                      onClick={() => setShowAddRef(true)}
                      className="mt-3 rounded-xl bg-slate-900 text-white text-xs"
                    >
                      Add Reference
                    </Button>
                  </CardContent>
                </Card>
              ) : (candidate.references ?? []).map((ref) => {
                const status = REF_STATUS_DISPLAY[ref.status] ?? REF_STATUS_DISPLAY.not_requested;
                return (
                  <Card key={ref.id} className={cn(
                    "rounded-2xl border",
                    ref.discrepancy_flag ? "border-red-200" :
                    ref.status === "satisfactory" ? "border-emerald-100" :
                    ref.status === "unsatisfactory" ? "border-red-200" :
                    "border-[var(--cs-border-subtle)]"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-semibold text-[var(--cs-navy)]">{ref.referee_name}</div>
                            {ref.is_most_recent_employer && (
                              <span className="text-[9px] bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5 font-semibold flex items-center gap-0.5">
                                <Star className="h-2.5 w-2.5" /> Most Recent Employer
                              </span>
                            )}
                            {ref.discrepancy_flag && (
                              <span className="text-[9px] bg-red-100 text-red-700 rounded-full px-1.5 py-0.5 font-semibold flex items-center gap-0.5">
                                <AlertTriangle className="h-2.5 w-2.5" /> Discrepancy
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[var(--cs-text-muted)] mt-0.5">
                            {ref.referee_role} · {ref.referee_org ?? "Unknown organisation"}
                          </div>
                          <div className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">{ref.relationship}</div>
                        </div>
                        <span className={cn("text-[10px] rounded-full px-2.5 py-1 font-semibold shrink-0", status.color)}>
                          {status.label}
                        </span>
                      </div>

                      {/* Dates */}
                      <div className="flex gap-4 mt-3 text-[10px] text-[var(--cs-text-muted)]">
                        {ref.requested_date && <span>Requested: {formatDate(ref.requested_date)}</span>}
                        {ref.received_date && <span>Received: {formatDate(ref.received_date)}</span>}
                      </div>

                      {/* Structured response */}
                      {ref.employment_dates_confirmed !== null && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {[
                            { label: "Dates confirmed", value: ref.employment_dates_confirmed },
                            { label: "Role confirmed", value: ref.role_confirmed },
                            { label: "Would re-employ", value: ref.would_re_employ },
                            { label: "Safeguarding concerns", value: ref.safeguarding_concerns === false ? "None" : ref.safeguarding_concerns ? "YES" : null },
                          ].map(({ label, value }) => value !== null && (
                            <div key={label} className="flex items-center gap-1.5">
                              {value === true ? (
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                              ) : value === "None" ? (
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                              ) : value === "YES" ? (
                                <AlertTriangle className="h-3 w-3 text-red-500" />
                              ) : (
                                <div className="h-3 w-3 rounded-full border border-[var(--cs-border)]" />
                              )}
                              <span className="text-[10px] text-[var(--cs-text-secondary)]">{label}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {ref.discrepancy_notes && (
                        <div className="mt-3 p-2.5 rounded-xl bg-red-50 border border-red-100 text-[10px] text-red-700">
                          {ref.discrepancy_notes}
                        </div>
                      )}

                      <div className="flex gap-2 mt-3 flex-wrap">
                        {ref.status === "requested" && (
                          <Button
                            size="sm"
                            disabled={updateReference.isPending}
                            onClick={() => handleChaseReference(ref)}
                            className="h-7 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10px]"
                          >
                            {updateReference.isPending ? "Saving…" : "Chase Reference"}
                          </Button>
                        )}
                        {ref.status === "received" && (
                          <Button
                            size="sm"
                            disabled={updateReference.isPending}
                            onClick={() => handleMarkSatisfactory(ref)}
                            className="h-7 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px]"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {updateReference.isPending ? "Saving…" : "Mark Satisfactory"}
                          </Button>
                        )}
                        {(ref.status === "not_requested") && (
                          <Button
                            size="sm"
                            disabled={updateReference.isPending}
                            onClick={() => updateReference.mutate({ referenceId: ref.id, candidateId, data: { status: "requested", received_date: undefined } })}
                            className="h-7 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[10px]"
                          >
                            {updateReference.isPending ? "Saving…" : "Mark as Requested"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* EMPLOYMENT HISTORY TAB */}
          {activeTab === "history" && (
            <div className="space-y-3">
              <Card className="rounded-2xl border-[var(--cs-border-subtle)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Employment History</span>
                    <span className="text-xs font-normal text-[var(--cs-text-muted)]">Most recent first</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(candidate.employment_history ?? []).length === 0 ? (
                    <div className="py-8 text-center text-[var(--cs-text-muted)]">
                      <Briefcase className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                      <div className="text-sm">No employment history recorded</div>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {(candidate.employment_history ?? []).map((entry, idx) => {
                        const histLen = candidate.employment_history?.length ?? 0;
                        const gap = candidate.employment_gaps?.find(g =>
                          idx + 1 < histLen &&
                          g.gap_start === candidate.employment_history[idx + 1]?.end_date
                        );
                        return (
                          <React.Fragment key={entry.id}>
                            <div className="flex gap-3 py-3 border-b border-slate-50 last:border-0">
                              <div className="flex flex-col items-center pt-1">
                                <div className={cn(
                                  "h-4 w-4 rounded-full flex items-center justify-center",
                                  entry.verified ? "bg-emerald-500" : "bg-slate-200"
                                )}>
                                  {entry.verified && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                                </div>
                                {idx < (candidate.employment_history?.length ?? 0) - 1 && (
                                  <div className="w-0.5 flex-1 bg-slate-100 mt-1" />
                                )}
                              </div>
                              <div className="flex-1 pb-2">
                                <div className="font-semibold text-[var(--cs-navy)] text-sm">{entry.role_title}</div>
                                <div className="text-xs text-[var(--cs-text-muted)]">{entry.employer}</div>
                                <div className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">
                                  {formatDate(entry.start_date)} – {entry.end_date ? formatDate(entry.end_date) : "Present"}
                                </div>
                                {entry.reason_for_leaving && (
                                  <div className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">Left: {entry.reason_for_leaving}</div>
                                )}
                              </div>
                            </div>
                            {gap && (
                              <div className={cn(
                                "mx-7 my-1 p-2.5 rounded-xl text-[10px] flex items-start gap-2",
                                gap.review_status === "satisfactory" ? "bg-emerald-50 border border-emerald-100 text-emerald-700" :
                                gap.review_status === "concern" ? "bg-red-50 border border-red-100 text-red-700" :
                                "bg-amber-50 border border-amber-100 text-amber-700"
                              )}>
                                <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-semibold">Gap: {gap.gap_days} days</span>
                                  {gap.explanation && <span className="ml-2 text-[10px]">— {gap.explanation}</span>}
                                  {!gap.explanation && <span className="ml-2 italic">No explanation provided</span>}
                                </div>
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* INTERVIEWS TAB */}
          {activeTab === "interviews" && (
            <div className="space-y-3">
              {(candidate.interviews ?? []).length === 0 ? (
                <Card className="rounded-2xl border-[var(--cs-border-subtle)]">
                  <CardContent className="py-10 text-center text-[var(--cs-text-muted)]">
                    <Calendar className="h-8 w-8 mx-auto mb-3 text-slate-200" />
                    <div className="text-sm">No interviews scheduled</div>
                    <div className="text-xs mt-1 text-[var(--cs-text-muted)]">Use the Interviews page to schedule</div>
                    <Link href="/recruitment/safer-recruitment/interviews">
                      <Button size="sm" className="mt-3 rounded-xl bg-slate-900 text-white text-xs">
                        Go to Interviews
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : candidate.interviews.map((interview) => (
                <Card key={interview.id} className="rounded-2xl border-[var(--cs-border-subtle)]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold text-[var(--cs-navy)]">{interview.mode === "in_person" ? "In-Person" : interview.mode === "video" ? "Video" : "Phone"} Interview</div>
                        <div className="text-xs text-[var(--cs-text-muted)] mt-0.5">
                          {formatDate(interview.scheduled_at)} · {interview.location ?? "Location TBC"}
                        </div>
                      </div>
                      <span className={cn(
                        "text-[10px] rounded-full px-2.5 py-1 font-semibold",
                        interview.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                        interview.status === "scheduled" ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-[var(--cs-text-muted)]"
                      )}>
                        {interview.status}
                      </span>
                    </div>
                    {interview.safer_recruitment_trained && (
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> Safer-recruitment-trained interviewer on panel
                      </div>
                    )}
                    {interview.recommendation && (
                      <div className={cn(
                        "mt-2 p-2.5 rounded-xl text-xs font-semibold",
                        interview.recommendation === "proceed" ? "bg-emerald-50 text-emerald-700" :
                        interview.recommendation === "decline" ? "bg-red-50 text-red-700" :
                        "bg-amber-50 text-amber-700"
                      )}>
                        Recommendation: {interview.recommendation?.toUpperCase()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* OFFER TAB */}
          {activeTab === "offer" && (
            <div className="space-y-3">
              {!candidate.offer ? (
                <Card className="rounded-2xl border-[var(--cs-border-subtle)]">
                  <CardContent className="py-10 text-center text-[var(--cs-text-muted)]">
                    <FileText className="h-8 w-8 mx-auto mb-3 text-slate-200" />
                    <div className="text-sm">No offer on record</div>
                    <div className="text-xs mt-1">An offer can be created once the candidate reaches conditional_offer stage</div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="rounded-2xl border-[var(--cs-border-subtle)]">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-[var(--cs-navy)]">Conditional Offer</div>
                      <span className={cn(
                        "text-[10px] rounded-full px-2.5 py-1 font-semibold",
                        candidate.offer.status === "accepted" ? "bg-emerald-100 text-emerald-700" :
                        candidate.offer.status === "conditional" ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-[var(--cs-text-muted)]"
                      )}>
                        {candidate.offer.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      {candidate.offer.proposed_start_date && (
                        <div><span className="text-[var(--cs-text-muted)]">Proposed Start</span><div className="font-medium">{formatDate(candidate.offer.proposed_start_date)}</div></div>
                      )}
                      {candidate.offer.salary && (
                        <div><span className="text-[var(--cs-text-muted)]">Salary</span><div className="font-medium">£{candidate.offer.salary.toLocaleString()}</div></div>
                      )}
                      {candidate.offer.hours_per_week && (
                        <div><span className="text-[var(--cs-text-muted)]">Hours</span><div className="font-medium">{candidate.offer.hours_per_week} hrs/wk</div></div>
                      )}
                    </div>
                    {candidate.offer.exceptional_start && (
                      <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                        <div className="text-xs font-semibold text-purple-800 flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" /> Exceptional Start Approved
                        </div>
                        {candidate.offer.exceptional_start_risk_mitigation ? (
                          <div className="text-[10px] text-purple-700 mt-1">{candidate.offer.exceptional_start_risk_mitigation}</div>
                        ) : (
                          <div className="text-[10px] text-red-700 mt-1 font-semibold">Risk mitigation plan not yet documented — required before start</div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      {candidate.offer.final_clearance_given ? (
                        <div className="flex items-center gap-2 text-emerald-700 text-xs">
                          <CheckCircle2 className="h-4 w-4" /> Final clearance given {candidate.offer.final_clearance_date ? `on ${formatDate(candidate.offer.final_clearance_date)}` : ""}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Button
                            size="sm"
                            disabled={hasBlockers || updateOffer.isPending}
                            onClick={handleGrantFinalClearance}
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs disabled:opacity-50"
                          >
                            {updateOffer.isPending ? "Saving…" : "Grant Final Clearance"}
                          </Button>
                          {hasBlockers && (
                            <p className="text-[10px] text-red-600">Resolve all compliance blockers before granting clearance</p>
                          )}
                        </div>
                      )}
                      {!candidate.offer.contract_generated && candidate.offer.final_clearance_given && (
                        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => window.print()}>
                          <FileText className="h-3.5 w-3.5 mr-1" /> Print Contract Pack
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* AUDIT TAB */}
          {activeTab === "audit" && (
            <Card className="rounded-2xl border-[var(--cs-border-subtle)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Audit Trail</span>
                  <Button size="sm" variant="outline" className="rounded-xl text-xs" disabled title="Audit trail export is available from the Recruitment Audit page.">
                    <FileText className="h-3.5 w-3.5 mr-1" /> Export
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(candidate.audit ?? []).length === 0 ? (
                  <div className="py-8 text-center text-[var(--cs-text-muted)]">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                    <div className="text-sm">No audit entries yet</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {candidate.audit.map((entry) => (
                      <div key={entry.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-4 w-4 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                            <Activity className="h-2.5 w-2.5 text-[var(--cs-text-muted)]" />
                          </div>
                          <div className="w-0.5 flex-1 bg-slate-100 mt-1" />
                        </div>
                        <div className="flex-1 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[var(--cs-text-secondary)]">{entry.event_type.replace(/_/g, " ")}</span>
                            <span className="text-[10px] text-[var(--cs-text-muted)]">{formatDate(entry.performed_at)}</span>
                          </div>
                          <div className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">{entry.summary}</div>
                          <div className="text-[10px] text-[var(--cs-text-muted)]">{entry.actor}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[9px] text-[var(--cs-text-gentle)] mt-4 text-center">This audit trail cannot be edited or deleted. All actions are permanently logged.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column */}
        {showAria && (
          <div className="w-[280px] shrink-0">
            <div className="sticky top-24">
              <AriaPanel
                pageContext="safer_recruitment_candidate"
                sourceContent={`Candidate: ${candidate.first_name} ${candidate.last_name} | Stage: ${candidate.stage} | Compliance: ${candidate.compliance_score}% | Blockers: ${candidate.blocker_summary?.join(", ") ?? "none"}`}
                userRole="registered_manager"
                mode="assist"
              />
            </div>
          </div>
        )}
      </div>
    </div>

    {/* ── Flag Concern Modal ─────────────────────────────────────────────────── */}
    {flagConcern && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-[var(--cs-shadow-elevated)] w-full max-w-md p-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--cs-navy)] flex items-center gap-2">
            <Flag className="h-4 w-4 text-red-500" /> Flag Concern
          </h2>
          <p className="text-xs text-[var(--cs-text-muted)]">Describe the concern. This will be logged in the audit trail and the check will be escalated for RM review.</p>
          <textarea
            value={flagConcern.notes}
            onChange={(e) => setFlagConcern({ ...flagConcern, notes: e.target.value })}
            placeholder="Describe the concern in detail…"
            className="w-full rounded-xl border border-[var(--cs-border)] p-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-red-300"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setFlagConcern(null)}>Cancel</Button>
            <Button
              size="sm"
              disabled={!flagConcern.notes.trim() || updateCheck.isPending}
              onClick={handleFlagConcernSubmit}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              {updateCheck.isPending ? "Saving…" : "Flag Concern"}
            </Button>
          </div>
        </div>
      </div>
    )}

    {/* ── Request Override Modal ─────────────────────────────────────────────── */}
    {requestOverride && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-[var(--cs-shadow-elevated)] w-full max-w-md p-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--cs-navy)] flex items-center gap-2">
            <Shield className="h-4 w-4 text-purple-500" /> Request Override
          </h2>
          <p className="text-xs text-[var(--cs-text-muted)]">Document the reason for approving this check despite the outcome. This is permanently recorded and must satisfy Regulation 32.</p>
          <textarea
            value={requestOverride.reason}
            onChange={(e) => setRequestOverride({ ...requestOverride, reason: e.target.value })}
            placeholder="State the reason for override and risk mitigation in place…"
            className="w-full rounded-xl border border-[var(--cs-border)] p-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-purple-300"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setRequestOverride(null)}>Cancel</Button>
            <Button
              size="sm"
              disabled={!requestOverride.reason.trim() || updateCheck.isPending}
              onClick={handleOverrideSubmit}
              className="bg-purple-700 hover:bg-purple-800 text-white rounded-xl"
            >
              {updateCheck.isPending ? "Saving…" : "Confirm Override"}
            </Button>
          </div>
        </div>
      </div>
    )}

    {/* ── Add Reference Modal ────────────────────────────────────────────────── */}
    {showAddRef && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-[var(--cs-shadow-elevated)] w-full max-w-md p-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--cs-navy)] flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" /> Add Reference
          </h2>
          <form onSubmit={handleAddRefSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[var(--cs-text-secondary)] block mb-1">Referee name <span className="text-red-500">*</span></label>
              <Input
                value={addRefForm.referee_name}
                onChange={(e) => setAddRefForm({ ...addRefForm, referee_name: e.target.value })}
                placeholder="Full name"
                className="h-9 rounded-xl"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[var(--cs-text-secondary)] block mb-1">Organisation</label>
                <Input
                  value={addRefForm.referee_org}
                  onChange={(e) => setAddRefForm({ ...addRefForm, referee_org: e.target.value })}
                  placeholder="Employer name"
                  className="h-9 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--cs-text-secondary)] block mb-1">Role/Title</label>
                <Input
                  value={addRefForm.referee_role}
                  onChange={(e) => setAddRefForm({ ...addRefForm, referee_role: e.target.value })}
                  placeholder="Job title"
                  className="h-9 rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--cs-text-secondary)] block mb-1">Email</label>
              <Input
                type="email"
                value={addRefForm.referee_email}
                onChange={(e) => setAddRefForm({ ...addRefForm, referee_email: e.target.value })}
                placeholder="referee@example.com"
                className="h-9 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--cs-text-secondary)] block mb-1">Relationship <span className="text-red-500">*</span></label>
              <select
                value={addRefForm.relationship}
                onChange={(e) => setAddRefForm({ ...addRefForm, relationship: e.target.value })}
                className="w-full h-9 rounded-xl border border-[var(--cs-border)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="employer">Previous employer</option>
                <option value="line_manager">Line manager</option>
                <option value="professional">Professional contact</option>
                <option value="character">Character referee</option>
                <option value="volunteer">Voluntary work</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="most_recent"
                checked={addRefForm.is_most_recent_employer}
                onChange={(e) => setAddRefForm({ ...addRefForm, is_most_recent_employer: e.target.checked })}
                className="h-4 w-4 rounded"
              />
              <label htmlFor="most_recent" className="text-xs text-[var(--cs-text-secondary)]">This is the most recent employer</label>
            </div>
            {addRefError && (
              <p className="text-xs text-red-600">{addRefError}</p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => { setShowAddRef(false); setAddRefError(""); }}>Cancel</Button>
              <Button type="submit" size="sm" disabled={createReference.isPending} className="rounded-xl bg-slate-900 text-white">
                {createReference.isPending ? "Adding…" : "Add Reference"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}
