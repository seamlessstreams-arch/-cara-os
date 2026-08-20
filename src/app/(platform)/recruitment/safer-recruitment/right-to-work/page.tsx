"use client";

import React, { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileCheck,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Info,
  Plus,
  Calendar,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn, londonDayDiff } from "@/lib/utils";
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

function rtwStatusLabel(status: RecruitmentCheck["status"]): string {
  const map: Record<string, string> = {
    not_started: "Not Checked",
    in_progress: "In Progress",
    received: "Needs Attention",
    verified: "Verified",
    blocked: "Blocked",
    override: "Override",
  };
  return map[status] ?? status;
}

function rtwStatusColor(status: RecruitmentCheck["status"]): string {
  switch (status) {
    case "verified": return "bg-emerald-100 text-emerald-700";
    case "in_progress": return "bg-blue-100 text-blue-700";
    case "received": return "bg-amber-100 text-amber-700";
    case "concern_flagged": return "bg-red-100 text-red-700";
    default: return "bg-slate-100 text-[var(--cs-text-muted)]";
  }
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB");
}

function daysUntil(d: string | null): number | null {
  if (!d) return null;
  return londonDayDiff(d);
}

function expiryChipColor(days: number): string {
  if (days < 30) return "bg-red-100 text-red-700";
  if (days < 90) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

// ── Row ───────────────────────────────────────────────────────────────────────

interface RTWRowProps {
  candidate: CandidateDetail;
  rtwCheck: RecruitmentCheck | null;
}

function RTWRow({ candidate, rtwCheck }: RTWRowProps) {
  const status = rtwCheck?.status ?? "not_started";
  const expiryDays = rtwCheck?.expiry_date ? daysUntil(rtwCheck.expiry_date) : null;
  const isTimeLimited = rtwCheck?.expiry_date != null;

  return (
    <tr className="border-b border-[var(--cs-border-subtle)] last:border-0 hover:bg-[var(--cs-surface)] transition-colors">
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-[var(--cs-navy)]">
          {candidate.first_name} {candidate.last_name}
        </div>
        <div className="text-[10px] text-[var(--cs-text-muted)]">{candidate.role_applied}</div>
      </td>
      <td className="px-4 py-3 text-xs text-[var(--cs-text-secondary)]">
        {rtwCheck?.document_type ?? "—"}
      </td>
      <td className="px-4 py-3 text-xs text-[var(--cs-text-secondary)] font-mono">
        —
      </td>
      <td className="px-4 py-3 text-xs text-[var(--cs-text-secondary)]">
        {rtwCheck?.verified_by ?? "—"}
      </td>
      <td className="px-4 py-3 text-xs text-[var(--cs-text-secondary)]">
        {formatDate(rtwCheck?.verified_at ?? null)}
      </td>
      <td className="px-4 py-3">
        {isTimeLimited && expiryDays !== null ? (
          <Badge className={cn("text-[9px] rounded-full flex items-center gap-0.5 w-fit", expiryChipColor(expiryDays))}>
            <Calendar className="h-2.5 w-2.5" />
            {formatDate(rtwCheck!.expiry_date!)}
            {expiryDays < 90 && ` (${expiryDays}d)`}
          </Badge>
        ) : (
          <span className="text-[10px] text-[var(--cs-text-muted)]">N/A</span>
        )}
      </td>
      <td className="px-4 py-3">
        <Badge className={cn("text-[10px] rounded-full px-2.5 py-0.5", rtwStatusColor(status))}>
          {rtwStatusLabel(status)}
        </Badge>
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RightToWorkPage() {
  const { data, isLoading, isError, error } = useRecruitment();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  const { rows, stats } = useMemo(() => {
    const candidates = data?.candidates ?? [];
    const rs = candidates.map((c: CandidateDetail) => ({
      candidate: c,
      rtwCheck: c.checks.find(ch => ch.check_type === "right_to_work") ?? null,
    }));

    const st = {
      verified: rs.filter(r => r.rtwCheck?.status === "verified").length,
      pending: rs.filter(r => !r.rtwCheck || r.rtwCheck.status === "in_progress").length,
      time_limited: rs.filter(r => r.rtwCheck?.expiry_date != null).length,
      not_checked: rs.filter(r => !r.rtwCheck || r.rtwCheck.status === "not_started").length,
    };

    return { rows: rs, stats: st };
  }, [data]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(({ candidate, rtwCheck }) => {
      const hay = [candidate.first_name, candidate.last_name, candidate.role_applied, rtwCheck?.document_type || "", rtwCheck?.verified_by || "", rtwStatusLabel(rtwCheck?.status ?? "not_started")].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search]);

  return (
    <PageShell
      title="Right to Work"
      subtitle="Verify before first day of employment — legal requirement"
      caraContext={{ pageTitle: "Right to Work Verification", sourceType: "staff" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Right to Work" subtitle="RTW Verification" targetId="rtw-content" />
          <SmartUploadButton variant="inline" label="Upload RTW Evidence" uploadContext="Safer Recruitment — right to work evidence document upload" />
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Verification
          </Button>
        </div>
      }
    >
      <div id="rtw-content" className="space-y-0">
      {/* Critical compliance notice */}
      <div className="rounded-2xl bg-red-50 border border-red-200 p-4 flex gap-3 mb-6">
        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-semibold text-red-800 mb-0.5">Legal Requirement</div>
          <div className="text-sm text-red-700">
            Right to Work checks <strong>MUST</strong> be completed before the candidate&apos;s first day.
            Failure to do so may result in a civil penalty of up to <strong>£60,000 per illegal worker</strong>.
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="rounded-2xl">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-emerald-600">{stats.verified}</div>
            <div className="text-xs text-[var(--cs-text-muted)] mt-0.5">Verified</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            <div className="text-xs text-[var(--cs-text-muted)] mt-0.5">Pending</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-amber-600">{stats.time_limited}</div>
            <div className="text-xs text-[var(--cs-text-muted)] mt-0.5">Time-Limited (expiry tracking)</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-4 pb-4">
            <div className={cn("text-2xl font-bold", stats.not_checked > 0 ? "text-red-600" : "text-[var(--cs-text-muted)]")}>
              {stats.not_checked}
            </div>
            <div className="text-xs text-[var(--cs-text-muted)] mt-0.5">Not Checked</div>
          </CardContent>
        </Card>
      </div>

      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center gap-3 text-red-600 mb-5">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{(error as Error)?.message || "Failed to load data"}</p>
        </div>
      )}

      {/* Info about time-limited RTW */}
      {stats.time_limited > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 flex gap-2 mb-5">
          <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            {stats.time_limited} candidate(s) have time-limited right to work (e.g. visa). Follow-up checks required before expiry.
            Amber = expiring within 90 days. Red = expiring within 30 days.
          </div>
        </div>
      )}

      {/* Search */}
      {!isLoading && rows.length > 0 && (
        <div className="flex items-center gap-3 mb-5">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
            <Input
              placeholder="Search candidates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          {search.trim() && (
            <span className="text-xs text-[var(--cs-text-muted)]">{filteredRows.length} of {rows.length} candidates</span>
          )}
        </div>
      )}

      {/* Table */}
      <Card className="rounded-2xl">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-[var(--cs-text-muted)]">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span className="text-sm">Loading right to work data...</span>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="py-12 text-center text-[var(--cs-text-muted)]">
              <FileCheck className="h-10 w-10 mx-auto mb-3 text-slate-200" />
              <div className="text-sm">{search.trim() ? "No candidates match your search" : "No candidates to display"}</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--cs-border-subtle)]">
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Candidate</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Document Type</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Document Ref</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Verified By</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Verified Date</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Expiry</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map(({ candidate, rtwCheck }) => (
                    <RTWRow key={candidate.id} candidate={candidate} rtwCheck={rtwCheck} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add verification modal (simple inline) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 overflow-y-auto overflow-x-hidden max-h-[calc(100dvh-2rem)]">
            <div className="text-sm font-semibold text-[var(--cs-navy)] mb-4">Add Right to Work Verification</div>
            <div className="space-y-3">
              <div>
                <label htmlFor="fc5a-candidate" className="text-xs font-medium text-[var(--cs-text-muted)] mb-1 block">Candidate</label>
                <select id="fc5a-candidate" className="w-full rounded-xl border border-[var(--cs-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                  <option value="">Select candidate...</option>
                  {(data?.candidates ?? []).map((c: CandidateDetail) => (
                    <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="fc5a-document-type" className="text-xs font-medium text-[var(--cs-text-muted)] mb-1 block">Document Type</label>
                <select id="fc5a-document-type" className="w-full rounded-xl border border-[var(--cs-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                  <option>UK Passport</option>
                  <option>EU Settled Status</option>
                  <option>BRP Card</option>
                  <option>Birth Certificate + NI Evidence</option>
                  <option>Visa / Leave to Remain</option>
                </select>
              </div>
              <div>
                <label htmlFor="fc5a-verified-by" className="text-xs font-medium text-[var(--cs-text-muted)] mb-1 block">Verified By</label>
                <input id="fc5a-verified-by" type="text" placeholder="Name of person who verified" className="w-full rounded-xl border border-[var(--cs-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
              </div>
              <div>
                <label htmlFor="fc5a-verification-date" className="text-xs font-medium text-[var(--cs-text-muted)] mb-1 block">Verification Date</label>
                <input id="fc5a-verification-date" type="date" className="w-full rounded-xl border border-[var(--cs-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
              </div>
              <div>
                <label htmlFor="fc5a-expiry-date-if-time-limited" className="text-xs font-medium text-[var(--cs-text-muted)] mb-1 block">Expiry Date (if time-limited)</label>
                <input id="fc5a-expiry-date-if-time-limited" type="date" className="w-full rounded-xl border border-[var(--cs-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button size="sm" className="flex-1" onClick={() => setShowModal(false)}>Save Verification</Button>
              <Button size="sm" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
      </div>{/* close #rtw-content */}
      <CaraPanel
        mode="assist"
        pageContext="Right to Work Verification — right to work documents, identity checks, visa/biometric cards, share codes, expiry tracking, staff eligibility, Home Office compliance, Ofsted evidence"
        recordType="staff_training"
        className="mt-6"
      />
    </PageShell>
  );
}
