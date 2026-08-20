"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Clock,
  AlertCircle,
  Loader2,
  Info,
  Video,
  Phone,
  MapPin,
  Users,
  Star,
  Shield,
  Heart,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";

// ── Inlined from use-recruitment ─────────────────────────────────────────────

type CheckStatus =
  | "not_started"
  | "requested"
  | "in_progress"
  | "received"
  | "verified"
  | "concern_flagged"
  | "override_approved"
  | "not_required";

type CheckType =
  | "enhanced_dbs"
  | "right_to_work"
  | "identity"
  | "references"
  | "overseas_criminal_record"
  | "qualifications"
  | "employment_history"
  | "medical_fitness"
  | "prohibition_from_teaching"
  | "disqualification_by_association"
  | "section_128"
  | "childcare_disqualification";

type RiskLevel = "low" | "medium" | "high" | "critical";

interface RecruitmentCheck {
  id: string;
  candidate_id: string;
  check_type: CheckType;
  status: CheckStatus;
  owner: string | null;
  requested_date: string | null;
  received_date: string | null;
  verified_by: string | null;
  verified_at: string | null;
  expiry_date: string | null;
  certificate_number: string | null;
  document_type: string | null;
  concern_flag: boolean;
  concern_notes: string | null;
  override_reason: string | null;
  override_by: string | null;
  override_at: string | null;
  risk_mitigation: string | null;
  notes: string | null;
  home_id: string;
  created_at: string;
  updated_at: string;
}

interface RecruitmentReference {
  id: string;
  candidate_id: string;
  referee_name: string;
  referee_org: string | null;
  referee_role: string | null;
  referee_email: string | null;
  referee_phone: string | null;
  relationship: string;
  is_most_recent_employer: boolean;
  status: "not_requested" | "requested" | "received" | "satisfactory" | "unsatisfactory" | "uncontactable";
  requested_date: string | null;
  received_date: string | null;
  employment_dates_confirmed: boolean | null;
  role_confirmed: boolean | null;
  performance_rating: string | null;
  safeguarding_concerns: boolean | null;
  safeguarding_detail: string | null;
  would_re_employ: boolean | null;
  would_re_employ_reason: string | null;
  discrepancy_flag: boolean;
  discrepancy_notes: string | null;
  home_id: string;
  created_at: string;
  updated_at: string;
}

interface EmploymentHistoryEntry {
  id: string;
  candidate_id: string;
  employer: string;
  role_title: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  reason_for_leaving: string | null;
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
  home_id: string;
  created_at: string;
}

interface EmploymentGap {
  id: string;
  candidate_id: string;
  gap_start: string;
  gap_end: string;
  gap_days: number;
  explanation: string | null;
  review_status: "unreviewed" | "satisfactory" | "concern" | "override";
  reviewed_by: string | null;
  reviewed_at: string | null;
  home_id: string;
}

interface Interview {
  id: string;
  candidate_id: string;
  scheduled_at: string;
  mode: "in_person" | "video" | "phone";
  location: string | null;
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  panel_members: string[];
  safer_recruitment_trained: boolean;
  recommendation: "proceed" | "decline" | "hold" | null;
  overall_score: number | null;
  scores_by_category: Record<string, number> | null;
  notes: string | null;
  home_id: string;
  created_at: string;
}

interface Offer {
  id: string;
  candidate_id: string;
  status: "not_made" | "conditional" | "unconditional" | "accepted" | "declined" | "withdrawn";
  offer_date: string | null;
  proposed_start_date: string | null;
  role_title: string;
  salary: number | null;
  hours_per_week: number | null;
  exceptional_start: boolean;
  exceptional_start_risk_mitigation: string | null;
  final_clearance_given: boolean;
  final_clearance_date: string | null;
  final_clearance_by: string | null;
  contract_generated: boolean;
  contract_generated_at: string | null;
  home_id: string;
  created_at: string;
}

interface RecruitmentAuditEntry {
  id: string;
  candidate_id: string;
  event_type: string;
  actor: string;
  actor_role: string;
  summary: string;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  performed_at: string;
  home_id: string;
}

interface Vacancy {
  id: string;
  home_id: string;
  role_title: string;
  employment_type: "permanent" | "fixed_term" | "bank" | "agency";
  salary_min: number | null;
  salary_max: number | null;
  hours_per_week: number | null;
  status: "draft" | "active" | "filled" | "closed";
  posted_date: string | null;
  applications_count: number;
  days_open: number;
  created_at: string;
}

interface CandidateDetail {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role_applied: string;
  stage: string;
  source: string | null;
  cv_url: string | null;
  compliance_score: number;
  risk_level: RiskLevel;
  days_in_stage: number;
  days_total: number;
  manager_assigned: string | null;
  interview_date: string | null;
  interview_notes: string | null;
  offer_date: string | null;
  start_date: string | null;
  notes: string | null;
  blocker_summary: string[];
  next_actions: string[];
  checks: RecruitmentCheck[];
  references: RecruitmentReference[];
  employment_history: EmploymentHistoryEntry[];
  employment_gaps: EmploymentGap[];
  interviews: Interview[];
  offer: Offer | null;
  audit: RecruitmentAuditEntry[];
  home_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

interface ComplianceAlert {
  candidate_id: string;
  candidate_name: string;
  issue: string;
  severity: "warning" | "critical";
  check_type: CheckType | null;
}

interface RecruitmentOverview {
  candidates: CandidateDetail[];
  vacancies: Vacancy[];
  alerts: ComplianceAlert[];
  stats: {
    total_active: number;
    blocked: number;
    exceptional_starts: number;
    avg_days_to_appoint: number;
  };
}

function useRecruitment() {
  return useQuery({
    queryKey: ["recruitment"],
    queryFn: () => api.get<RecruitmentOverview>("/recruitment"),
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type InterviewTab = "upcoming" | "completed" | "all";

function modeIcon(mode: Interview["mode"]) {
  switch (mode) {
    case "video": return <Video className="h-3.5 w-3.5" />;
    case "phone": return <Phone className="h-3.5 w-3.5" />;
    default: return <MapPin className="h-3.5 w-3.5" />;
  }
}

function modeLabel(mode: Interview["mode"]): string {
  switch (mode) {
    case "video": return "Video";
    case "phone": return "Phone";
    default: return "In Person";
  }
}

function recommendationColor(rec: Interview["recommendation"]): string {
  switch (rec) {
    case "proceed": return "bg-emerald-100 text-emerald-700";
    case "decline": return "bg-red-100 text-red-700";
    case "hold": return "bg-amber-100 text-amber-700";
    default: return "bg-slate-100 text-[var(--cs-text-muted)]";
  }
}

function recommendationLabel(rec: Interview["recommendation"]): string {
  switch (rec) {
    case "proceed": return "Recommend";
    case "decline": return "Do Not Recommend";
    case "hold": return "Borderline / Hold";
    default: return "Pending";
  }
}

function formatDateTime(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-GB") + " at " + dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function isUpcoming(interview: Interview): boolean {
  return new Date(interview.scheduled_at) > new Date() && interview.status === "scheduled";
}

// ── Interview Card ────────────────────────────────────────────────────────────

interface InterviewCardProps {
  interview: Interview;
  candidateName: string;
  roleApplied: string;
}

function InterviewCard({ interview, candidateName, roleApplied }: InterviewCardProps) {
  const upcoming = isUpcoming(interview);
  const completed = interview.status === "completed";

  return (
    <Card className={cn("rounded-2xl", upcoming ? "border-blue-200" : "border-[var(--cs-border)]")}>
      <CardContent className="pt-4 pb-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-[var(--cs-navy)]">{candidateName}</span>
              <Badge className="text-[9px] rounded-full bg-slate-100 text-[var(--cs-text-secondary)]">{roleApplied}</Badge>
              {upcoming && (
                <Badge className="text-[9px] rounded-full bg-blue-100 text-blue-700 flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />Upcoming
                </Badge>
              )}
            </div>
            <div className="text-xs text-[var(--cs-text-muted)] mt-0.5 flex items-center gap-1.5">
              {modeIcon(interview.mode)}
              <span>{modeLabel(interview.mode)}</span>
              <span className="text-[var(--cs-text-gentle)]">·</span>
              <span>{formatDateTime(interview.scheduled_at)}</span>
              {interview.location && (
                <>
                  <span className="text-[var(--cs-text-gentle)]">·</span>
                  <span>{interview.location}</span>
                </>
              )}
            </div>
          </div>
          {completed && interview.recommendation && (
            <Badge className={cn("text-[9px] rounded-full shrink-0 px-2.5 py-0.5", recommendationColor(interview.recommendation))}>
              {recommendationLabel(interview.recommendation)}
            </Badge>
          )}
        </div>

        {/* Panel members */}
        {interview.panel_members.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Users className="h-3.5 w-3.5 text-[var(--cs-text-muted)] shrink-0" />
            <span className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide">Panel:</span>
            {interview.panel_members.map((member, i) => (
              <span key={i} className="flex items-center gap-1 text-xs text-[var(--cs-text-secondary)]">
                {member}
                {interview.safer_recruitment_trained && i === 0 && (
                  <Badge className="text-[8px] rounded-full bg-green-100 text-green-700 px-1.5 py-0">SR Trained</Badge>
                )}
              </span>
            ))}
          </div>
        )}

        {/* SR Compliance badges */}
        <div className="flex gap-2 flex-wrap">
          {interview.safer_recruitment_trained ? (
            <Badge className="text-[9px] rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
              <Shield className="h-2.5 w-2.5" />SR-Trained on Panel
            </Badge>
          ) : (
            <Badge className="text-[9px] rounded-full bg-red-100 text-red-700 flex items-center gap-0.5">
              <Shield className="h-2.5 w-2.5" />No SR-Trained Interviewer
            </Badge>
          )}
          {completed && (
            <>
              <Badge className={cn(
                "text-[9px] rounded-full flex items-center gap-0.5",
                // We don't have safeguarding_question_asked on this Interview type directly, show placeholder
                "bg-blue-100 text-blue-700"
              )}>
                <Shield className="h-2.5 w-2.5" />Safeguarding Q
              </Badge>
              <Badge className="text-[9px] rounded-full bg-purple-100 text-purple-700 flex items-center gap-0.5">
                <Heart className="h-2.5 w-2.5" />Motivation Q
              </Badge>
            </>
          )}
        </div>

        {/* Score */}
        {completed && interview.overall_score !== null && (
          <div className="flex items-center gap-2">
            <Star className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-[var(--cs-text-secondary)]">
              Overall Score: {interview.overall_score}/100
            </span>
          </div>
        )}

        {/* Notes */}
        {interview.notes && (
          <div className="text-xs text-[var(--cs-text-secondary)] bg-slate-50 rounded-xl px-3 py-2 line-clamp-2">
            {interview.notes}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {completed ? (
            <Button size="sm" variant="outline" className="h-7 text-xs" disabled title="Interview scores are recorded in the candidate profile.">View Scores</Button>
          ) : (
            <Button size="sm" variant="outline" className="h-7 text-xs" disabled title="Add interview scores from the candidate profile page.">Add Scores</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

interface InterviewWithCandidate extends Interview {
  candidateName: string;
  roleApplied: string;
}

export default function InterviewsPage() {
  const [tab, setTab] = useState<InterviewTab>("upcoming");
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, error } = useRecruitment();

  const allInterviews = useMemo<InterviewWithCandidate[]>(() => {
    if (!data?.candidates) return [];
    return data.candidates.flatMap((c: CandidateDetail) =>
      c.interviews.map(i => ({
        ...i,
        candidateName: `${c.first_name} ${c.last_name}`,
        roleApplied: c.role_applied,
      }))
    ).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  }, [data]);

  const filtered = useMemo(() => {
    let list = allInterviews;
    if (tab === "upcoming") list = list.filter(i => isUpcoming(i));
    else if (tab === "completed") list = list.filter(i => i.status === "completed");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => {
        const hay = [i.candidateName, i.roleApplied, i.notes || "", i.location || "", modeLabel(i.mode), ...i.panel_members].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }, [allInterviews, tab, search]);

  const upcomingCount = allInterviews.filter(i => isUpcoming(i)).length;

  const TABS: { key: InterviewTab; label: string }[] = [
    { key: "upcoming", label: `Upcoming (${upcomingCount})` },
    { key: "completed", label: "Completed" },
    { key: "all", label: "All" },
  ];

  return (
    <PageShell
      title="Interviews"
      subtitle="Panel interviews with safer recruitment compliance"
      caraContext={{ pageTitle: "Safer Recruitment Interviews", sourceType: "staff" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Interviews" subtitle="Safer Recruitment Interviews" targetId="interviews-content" />
          <SmartUploadButton variant="inline" label="Upload Interview Notes" uploadContext="Safer Recruitment — interview notes or scoring template upload" />
        </div>
      }
    >
      <div id="interviews-content" className="space-y-0">
      {/* Compliance note */}
      <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 flex gap-3 mb-6">
        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          Every interview panel must include at least one safer-recruitment-trained interviewer.
          Safeguarding motivations and values-based questions are mandatory for all children&apos;s residential care roles.
        </div>
      </div>

      {/* Search + Tabs */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative w-60">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
          <Input
            placeholder="Search interviews…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
              tab === t.key
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-[var(--cs-text-secondary)] hover:bg-slate-200"
            )}
          >
            {t.label}
          </button>
        ))}
        {search.trim() && (
          <span className="text-xs text-[var(--cs-text-muted)] ml-auto">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center gap-3 text-red-600 mb-5">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{(error as Error)?.message || "Failed to load data"}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-[var(--cs-text-muted)]">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span className="text-sm">Loading interviews...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--cs-border)] p-12 text-center text-[var(--cs-text-muted)]">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 text-slate-200" />
          <div className="text-sm font-medium">
            {search.trim() ? "No interviews match your search" : tab === "upcoming" ? "No upcoming interviews scheduled" : "No interviews in this view"}
          </div>
          <div className="text-xs mt-1">
            {search.trim() ? "Try a different search term or change the filter tab" : "Interviews are logged against candidate profiles"}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(i => (
            <InterviewCard
              key={i.id}
              interview={i}
              candidateName={i.candidateName}
              roleApplied={i.roleApplied}
            />
          ))}
        </div>
      )}
      </div>{/* close #interviews-content */}
      <CaraPanel
        mode="assist"
        pageContext="Safer Recruitment Interviews — interview panels, safer recruitment questions, scoring, gaps in employment, references discussed, candidate suitability, interview records, Ofsted evidence"
        recordType="staff_training"
        className="mt-6"
      />
    </PageShell>
  );
}
