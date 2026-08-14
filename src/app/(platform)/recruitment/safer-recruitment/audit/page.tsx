"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity, AlertCircle, Loader2, Download, Clock, User,
  Filter, Lock,
} from "lucide-react";
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

function formatDateTime(d: string): string {
  const dt = new Date(d);
  return dt.toLocaleDateString("en-GB") + " " + dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function eventTypeLabel(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function eventTypeColor(type: string): string {
  if (type.includes("verified") || type.includes("cleared") || type.includes("appointed")) return "bg-emerald-100 text-emerald-700";
  if (type.includes("concern") || type.includes("flag") || type.includes("block")) return "bg-red-100 text-red-700";
  if (type.includes("stage")) return "bg-blue-100 text-blue-700";
  if (type.includes("reference")) return "bg-purple-100 text-purple-700";
  if (type.includes("dbs") || type.includes("check")) return "bg-indigo-100 text-indigo-700";
  if (type.includes("offer")) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-[var(--cs-text-secondary)]";
}

function changesSummary(changes: Record<string, { old: unknown; new: unknown }> | null): string | null {
  if (!changes) return null;
  const parts = Object.entries(changes).map(([field, { old: oldVal, new: newVal }]) => {
    const fieldLabel = field.replace(/_/g, " ");
    const oldStr = oldVal != null ? String(oldVal) : "—";
    const newStr = newVal != null ? String(newVal) : "—";
    return `${fieldLabel}: "${oldStr}" → "${newStr}"`;
  });
  return parts.join(" · ");
}

// ── Audit Entry Item ──────────────────────────────────────────────────────────

interface AuditItemProps {
  entry: RecruitmentAuditEntry;
  candidateName: string | null;
  isLast: boolean;
}

function AuditItem({ entry, candidateName, isLast }: AuditItemProps) {
  const summary = changesSummary(entry.changes);

  return (
    <div className="relative flex gap-4 pb-6">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-4 top-8 bottom-0 w-px bg-slate-100" />
      )}
      {/* Dot */}
      <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-[var(--cs-border)] shrink-0">
        <Activity className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0 pt-1">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn("text-[9px] rounded-full px-2 py-0.5", eventTypeColor(entry.event_type))}>
              {eventTypeLabel(entry.event_type)}
            </Badge>
            {candidateName && (
              <span className="text-xs font-medium text-[var(--cs-text-secondary)]">{candidateName}</span>
            )}
          </div>
          <span className="text-[10px] text-[var(--cs-text-muted)] flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3" />
            {formatDateTime(entry.performed_at)}
          </span>
        </div>
        <div className="mt-1.5 text-xs text-[var(--cs-text-secondary)]">{entry.summary}</div>
        {summary && (
          <div className="mt-1 text-[10px] text-[var(--cs-text-muted)] italic">{summary}</div>
        )}
        <div className="mt-1.5 flex items-center gap-1.5">
          <User className="h-3 w-3 text-[var(--cs-text-gentle)]" />
          <span className="text-[10px] text-[var(--cs-text-muted)]">{entry.actor} · {entry.actor_role}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

interface AuditWithCandidate extends RecruitmentAuditEntry {
  candidateName: string | null;
}

const ALL_EVENT_TYPES = [
  "all", "stage_changed", "check_verified", "reference_received",
  "dbs_submitted", "offer_made", "concern_flagged",
];

export default function AuditLogPage() {
  const { data, isLoading, isError, error } = useRecruitment();
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [candidateFilter, setCandidateFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const allAudit = useMemo<AuditWithCandidate[]>(() => {
    if (!data?.candidates) return [];
    return data.candidates
      .flatMap((c: CandidateDetail) =>
        c.audit.map(entry => ({
          ...entry,
          candidateName: `${c.first_name} ${c.last_name}`,
        }))
      )
      .sort((a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime());
  }, [data]);

  const filtered = useMemo(() => {
    let list = allAudit;
    if (eventTypeFilter !== "all") {
      list = list.filter(e => e.event_type === eventTypeFilter);
    }
    if (candidateFilter !== "all") {
      list = list.filter(e => e.candidate_id === candidateFilter);
    }
    if (dateFrom) {
      list = list.filter(e => new Date(e.performed_at) >= new Date(dateFrom));
    }
    if (dateTo) {
      list = list.filter(e => new Date(e.performed_at) <= new Date(dateTo + "T23:59:59"));
    }
    return list;
  }, [allAudit, eventTypeFilter, candidateFilter, dateFrom, dateTo]);

  const candidates = data?.candidates ?? [];

  return (
    <PageShell
      title="Audit Log"
      subtitle="Complete record of all safer recruitment actions — inspection-ready"
      caraContext={{ pageTitle: "Safer Recruitment Audit Trail", sourceType: "staff" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Audit Log" subtitle="Safer Recruitment Audit Trail" targetId="sr-audit-content" />
          <SmartUploadButton variant="inline" label="Upload Audit Document" uploadContext="Safer Recruitment — audit evidence or inspection bundle document upload" />
          <a href="/api/v1/recruitment/export?type=audit" download>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Generate Inspection Bundle
            </Button>
          </a>
          <CaraStudioQuickActionButton context={{ record_type: "staff_training", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="sr-audit-content" className="space-y-0">
      {/* Immutability notice */}
      <div className="rounded-2xl bg-slate-900 text-white p-4 flex gap-3 mb-6">
        <Lock className="h-5 w-5 text-[var(--cs-text-gentle)] shrink-0 mt-0.5" />
        <div className="text-sm">
          <span className="font-semibold">This audit trail cannot be edited or deleted.</span>
          {" "}All recruitment actions are permanently logged and are available for inspection.
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-end gap-3 mb-6 flex-wrap">
        <div>
          <label htmlFor="f45a-event-type" className="text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)] mb-1 block">Event Type</label>
          <select id="f45a-event-type"
            value={eventTypeFilter}
            onChange={e => setEventTypeFilter(e.target.value)}
            className="rounded-xl border border-[var(--cs-border)] px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {ALL_EVENT_TYPES.map(t => (
              <option key={t} value={t}>{t === "all" ? "All Event Types" : eventTypeLabel(t)}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f45a-candidate" className="text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)] mb-1 block">Candidate</label>
          <select id="f45a-candidate"
            value={candidateFilter}
            onChange={e => setCandidateFilter(e.target.value)}
            className="rounded-xl border border-[var(--cs-border)] px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="all">All Candidates</option>
            {candidates.map((c: CandidateDetail) => (
              <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f45a-from" className="text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)] mb-1 block">From</label>
          <input id="f45a-from"
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="rounded-xl border border-[var(--cs-border)] px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div>
          <label htmlFor="f45a-to" className="text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)] mb-1 block">To</label>
          <input id="f45a-to"
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="rounded-xl border border-[var(--cs-border)] px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        {(eventTypeFilter !== "all" || candidateFilter !== "all" || dateFrom || dateTo) && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => { setEventTypeFilter("all"); setCandidateFilter("all"); setDateFrom(""); setDateTo(""); }}
          >
            Clear Filters
          </Button>
        )}
        <div className="ml-auto text-xs text-[var(--cs-text-muted)]">
          {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center gap-3 text-red-600 mb-5">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{(error as Error)?.message || "Failed to load audit data"}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-[var(--cs-text-muted)]">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span className="text-sm">Loading audit log...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--cs-border)] p-12 text-center text-[var(--cs-text-muted)]">
          <Activity className="h-10 w-10 mx-auto mb-3 text-slate-200" />
          <div className="text-sm font-medium">No audit entries match this filter</div>
          <div className="text-xs mt-1">Try adjusting the filters above</div>
        </div>
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="pt-6 pb-2">
            <div className="space-y-0">
              {filtered.map((entry, i) => (
                <AuditItem
                  key={entry.id}
                  entry={entry}
                  candidateName={entry.candidateName}
                  isLast={i === filtered.length - 1}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </div>{/* close #sr-audit-content */}
      <CaraPanel
        mode="assist"
        pageContext="Safer Recruitment Audit Trail — immutable audit log, SCR evidence, safer recruitment compliance, Ofsted inspection readiness, DBS checks audit, references audit, right to work audit"
        recordType="staff_training"
        className="mt-6"
      />
    </PageShell>
  );
}
