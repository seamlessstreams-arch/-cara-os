"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { AriaPanel } from "@/components/aria/aria-panel";
import {
  UserPlus, Search, Plus, Filter, AlertTriangle, AlertCircle,
  Users, Clock, Zap, TrendingUp, Briefcase, Shield, FileCheck,
  User, Globe, GraduationCap, Heart, ChevronRight, Eye,
  BarChart3, Download, CheckCircle2, XCircle, ArrowUpDown,
} from "lucide-react";
import { cn, formatDate, daysFromNow } from "@/lib/utils";
import { useRecruitment, useCreateCandidate } from "@/hooks/use-recruitment";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import type { CandidateDetail, CheckStatus, CheckType, ComplianceAlert, Vacancy } from "@/hooks/use-recruitment";

const CANDIDATE_EXPORT_COLS: ExportColumn<CandidateDetail>[] = [
  { header: "Name", accessor: (c) => `${c.first_name} ${c.last_name}` },
  { header: "Email", accessor: (c) => c.email },
  { header: "Role Applied", accessor: (c) => c.role_applied },
  { header: "Stage", accessor: (c) => c.stage },
  { header: "Source", accessor: (c) => c.source ?? "" },
  { header: "Compliance Score", accessor: (c) => `${c.compliance_score}%` },
  { header: "Risk Level", accessor: (c) => c.risk_level },
  { header: "Days in Stage", accessor: (c) => String(c.days_in_stage) },
  { header: "Days Total", accessor: (c) => String(c.days_total) },
  { header: "Interview Date", accessor: (c) => c.interview_date ?? "" },
  { header: "Start Date", accessor: (c) => c.start_date ?? "" },
  { header: "Created", accessor: (c) => c.created_at },
];

// ── Types ─────────────────────────────────────────────────────────────────────

type MainTab = "pipeline" | "candidates" | "vacancies" | "safer_recruitment" | "reports";

// ── Colour helpers ────────────────────────────────────────────────────────────

function statusClasses(status: CheckStatus | string): string {
  switch (status) {
    case "not_started": return "bg-slate-100 text-[var(--cs-text-muted)]";
    case "in_progress": return "bg-blue-100 text-blue-700";
    case "received": return "bg-amber-100 text-amber-700";
    case "verified":
    case "cleared": return "bg-emerald-100 text-emerald-700";
    case "concern_flagged":
    case "concern": return "bg-red-100 text-red-700";
    case "override_approved":
    case "exceptional": return "bg-purple-100 text-purple-700";
    default: return "bg-slate-100 text-[var(--cs-text-muted)]";
  }
}

function stageBorderColor(status: CheckStatus | string): string {
  switch (status) {
    case "not_started": return "border-l-slate-300";
    case "in_progress": return "border-l-blue-400";
    case "received": return "border-l-amber-400";
    case "verified": return "border-l-emerald-400";
    case "concern_flagged": return "border-l-red-400";
    case "override_approved": return "border-l-purple-400";
    default: return "border-l-slate-300";
  }
}

const STAGE_ORDER: string[] = [
  "application_received",
  "sift",
  "interview_scheduled",
  "interview_completed",
  "references_requested",
  "references_received",
  "dbs_submitted",
  "dbs_received",
  "conditional_offer",
  "pre_start_checks",
  "final_clearance",
  "onboarding",
  "appointed",
];

const STAGE_LABELS: Record<string, string> = {
  application_received: "Application",
  sift: "Sift",
  interview_scheduled: "Interview",
  interview_completed: "Post-Interview",
  references_requested: "Refs Requested",
  references_received: "Refs Received",
  dbs_submitted: "DBS Submitted",
  dbs_received: "DBS Received",
  conditional_offer: "Conditional Offer",
  pre_start_checks: "Pre-Start",
  final_clearance: "Final Clearance",
  onboarding: "Onboarding",
  appointed: "Appointed",
  unsuccessful: "Unsuccessful",
  withdrawn: "Withdrawn",
  enquiry: "Enquiry",
};

const CHECK_TYPES: CheckType[] = [
  "enhanced_dbs",
  "right_to_work",
  "identity",
  "references",
  "qualifications",
  "employment_history",
  "medical_fitness",
  "overseas_criminal_record",
];

const CHECK_LABELS: Record<CheckType, string> = {
  enhanced_dbs: "Enhanced DBS",
  right_to_work: "Right to Work",
  identity: "Identity",
  references: "References",
  overseas_criminal_record: "Overseas Criminal Record",
  qualifications: "Qualifications",
  employment_history: "Employment History",
  medical_fitness: "Medical Fitness",
  prohibition_from_teaching: "Prohibition (Teaching)",
  disqualification_by_association: "Disqualification (Association)",
  section_128: "Section 128",
  childcare_disqualification: "Childcare Disqualification",
};


// ── Sub-components ────────────────────────────────────────────────────────────

function ComplianceRing({ score, size = "sm" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const r = size === "lg" ? 36 : size === "md" ? 20 : 14;
  const stroke = size === "lg" ? 5 : 3;
  const dim = (r + stroke) * 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const textSize = size === "lg" ? "text-2xl" : size === "md" ? "text-[10px]" : "text-[9px]";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: dim, height: dim }}>
      <svg width={dim} height={dim} className="-rotate-90">
        <circle cx={r + stroke} cy={r + stroke} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={r + stroke} cy={r + stroke} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className={cn("absolute font-bold tabular-nums", textSize)} style={{ color }}>
        {score}
      </span>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const classes: Record<string, string> = {
    low: "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-red-100 text-red-700",
    critical: "bg-red-200 text-red-800 font-bold",
  };
  return (
    <span className={cn("text-[9px] rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide", classes[level] || "bg-slate-100 text-[var(--cs-text-muted)]")}>
      {level}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4 space-y-3 animate-pulse">
      <div className="flex gap-3">
        <div className="h-10 w-10 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-32 bg-slate-200 rounded" />
          <div className="h-2 w-24 bg-slate-100 rounded" />
        </div>
      </div>
      <div className="h-2 bg-slate-100 rounded w-full" />
      <div className="h-2 bg-slate-100 rounded w-3/4" />
    </div>
  );
}

// ── Kanban Card ───────────────────────────────────────────────────────────────

function KanbanCard({ candidate }: { candidate: CandidateDetail }) {
  const fullName = `${candidate.first_name} ${candidate.last_name}`;
  const initials = candidate.first_name[0] + candidate.last_name[0];

  // Derive a rough per-candidate check status for the border colour
  const cardStatus: CheckStatus =
    candidate.compliance_score >= 80 ? "verified" :
    candidate.compliance_score >= 50 ? "in_progress" :
    candidate.blocker_summary.length > 0 ? "received" : "not_started";

  return (
    <Link href={`/recruitment/candidates/${candidate.id}`}>
      <div className={cn(
        "rounded-xl border bg-white border-l-4 p-3 space-y-2 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5",
        stageBorderColor(cardStatus)
      )}>
        <div className="flex items-start gap-2.5">
          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-[var(--cs-text-secondary)] shrink-0">
            {initials.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-[var(--cs-navy)] truncate">{fullName}</div>
            <div className="text-[10px] text-[var(--cs-text-muted)] truncate">{candidate.role_applied}</div>
          </div>
          <ComplianceRing score={candidate.compliance_score} size="sm" />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <RiskBadge level={candidate.risk_level} />
          <span className="text-[9px] text-[var(--cs-text-muted)] flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />{candidate.days_in_stage}d
          </span>
        </div>
        {candidate.blocker_summary.length > 0 && (
          <div className="text-[9px] text-amber-700 bg-amber-50 rounded px-1.5 py-1 flex items-center gap-1">
            <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{candidate.blocker_summary[0]}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

// ── Pipeline tab ──────────────────────────────────────────────────────────────

function PipelineTab({
  candidates,
  alerts,
  stats,
  loading,
}: {
  candidates: CandidateDetail[];
  alerts: ComplianceAlert[];
  stats: { total_active: number; blocked: number; exceptional_starts: number; avg_days_to_appoint: number };
  loading: boolean;
}) {
  const activeCandidates = candidates.filter(
    (c) => !["withdrawn", "rejected", "started"].includes(c.stage)
  );
  const pipelineStages: string[] = STAGE_ORDER.filter(
    (s) => !["appointed", "unsuccessful", "withdrawn"].includes(s)
  );

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Active", value: loading ? "–" : stats.total_active, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Blocked", value: loading ? "–" : stats.blocked, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
          { label: "Exceptional Starts", value: loading ? "–" : stats.exceptional_starts, icon: Zap, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Avg Days to Appoint", value: loading ? "–" : stats.avg_days_to_appoint, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl border border-[var(--cs-border)] bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">{label}</div>
                <div className={cn("mt-1 text-3xl font-bold tabular-nums", color)}>{value}</div>
              </div>
              <div className={cn("rounded-2xl p-3", bg)}>
                <Icon className={cn("h-5 w-5", color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />Compliance Alerts ({alerts.length})
          </div>
          {alerts.map((alert, i) => (
            <div key={i} className={cn(
              "rounded-xl border px-4 py-3 flex items-start gap-3",
              alert.severity === "critical" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
            )}>
              <AlertTriangle className={cn("h-4 w-4 shrink-0 mt-0.5", alert.severity === "critical" ? "text-red-500" : "text-amber-500")} />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-[var(--cs-navy)]">{alert.candidate_name}</span>
                <span className="text-xs text-[var(--cs-text-secondary)] ml-2">{alert.issue}</span>
              </div>
              <Link href={`/recruitment/candidates/${alert.candidate_id}`}>
                <Button size="sm" variant="outline" className="h-7 text-xs shrink-0">View</Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Kanban board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {pipelineStages.map((stage) => {
            const stageCandidates = activeCandidates.filter((c) => c.stage === stage);
            return (
              <div key={stage} className="w-60 flex-shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn("text-[10px] font-semibold rounded-full px-2.5 py-1",
                    stage === "application_received" ? "bg-slate-100 text-[var(--cs-text-secondary)]" :
                    stage === "shortlisted" ? "bg-blue-100 text-blue-700" :
                    stage === "interview_scheduled" ? "bg-amber-100 text-amber-700" :
                    stage === "interview_completed" ? "bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)]" :
                    stage === "references_requested" ? "bg-orange-100 text-orange-700" :
                    stage === "dbs_submitted" ? "bg-cyan-100 text-cyan-700" :
                    stage === "offer_made" ? "bg-emerald-100 text-emerald-700" :
                    "bg-teal-100 text-teal-700"
                  )}>
                    {STAGE_LABELS[stage]}
                  </span>
                  <span className="text-xs font-semibold text-[var(--cs-text-muted)]">{stageCandidates.length}</span>
                </div>
                <div className="space-y-2.5">
                  {loading && [1, 2].map((n) => <SkeletonCard key={n} />)}
                  {!loading && stageCandidates.map((c) => <KanbanCard key={c.id} candidate={c} />)}
                  {!loading && stageCandidates.length === 0 && (
                    <div className="rounded-xl border-2 border-dashed border-[var(--cs-border)] p-5 text-center text-[10px] text-[var(--cs-text-muted)]">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Candidates tab ────────────────────────────────────────────────────────────

function CandidatesTab({ candidates, loading }: { candidates: CandidateDetail[]; loading: boolean }) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "stage" | "compliance" | "days">("stage");

  const filtered = useMemo(() => {
    let list = candidates;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
        c.role_applied.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    }
    if (stageFilter !== "all") {
      list = list.filter((c) => c.stage === stageFilter);
    }
    // Sort
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
        case "compliance":
          return a.compliance_score - b.compliance_score;
        case "days":
          return b.days_total - a.days_total;
        case "stage":
        default: {
          const si = (s: string) => STAGE_ORDER.indexOf(s);
          return si(a.stage) - si(b.stage);
        }
      }
    });
    return list;
  }, [candidates, search, stageFilter, sortBy]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
          <Input
            placeholder="Search candidates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--cs-text-muted)] shrink-0">
          <ArrowUpDown className="h-3.5 w-3.5" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="bg-white border rounded-md px-2 py-1.5 text-xs">
            <option value="stage">Pipeline stage</option>
            <option value="name">Name A–Z</option>
            <option value="compliance">Compliance (lowest)</option>
            <option value="days">Days in pipeline (longest)</option>
          </select>
        </div>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="rounded-xl border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-text-secondary)] h-9 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="all">All stages</option>
          {STAGE_ORDER.map((s) => (
            <option key={s} value={s}>{STAGE_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--cs-border-subtle)] bg-slate-50">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">Stage</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">Role</th>
              <th className="text-center px-4 py-3 text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">Compliance%</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">Risk</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">Manager</th>
              <th className="text-center px-4 py-3 text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">Days</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && [1, 2, 3].map((n) => (
              <tr key={n} className="animate-pulse">
                <td className="px-4 py-3"><div className="h-3 w-32 bg-slate-200 rounded" /></td>
                <td className="px-4 py-3"><div className="h-3 w-20 bg-slate-200 rounded" /></td>
                <td className="px-4 py-3"><div className="h-3 w-28 bg-slate-200 rounded" /></td>
                <td className="px-4 py-3"><div className="h-3 w-10 bg-slate-200 rounded mx-auto" /></td>
                <td colSpan={4} />
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-[var(--cs-text-muted)] text-sm">
                  No candidates found
                </td>
              </tr>
            )}
            {!loading && filtered.map((c) => (
              <tr key={c.id} className="hover:bg-[var(--cs-surface)] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <ComplianceRing score={c.compliance_score} size="sm" />
                    <div>
                      <div className="font-medium text-[var(--cs-navy)]">{c.first_name} {c.last_name}</div>
                      <div className="text-[10px] text-[var(--cs-text-muted)]">{c.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("text-[10px] rounded-full px-2.5 py-1 font-semibold",
                    STAGE_LABELS[c.stage] ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-[var(--cs-text-muted)]"
                  )}>
                    {STAGE_LABELS[c.stage] || c.stage}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--cs-text-secondary)] text-xs">{c.role_applied}</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("text-xs font-bold tabular-nums",
                    c.compliance_score >= 80 ? "text-emerald-600" :
                    c.compliance_score >= 50 ? "text-amber-600" : "text-red-600"
                  )}>
                    {c.compliance_score}%
                  </span>
                </td>
                <td className="px-4 py-3"><RiskBadge level={c.risk_level} /></td>
                <td className="px-4 py-3 text-xs text-[var(--cs-text-muted)]">{c.manager_assigned || "—"}</td>
                <td className="px-4 py-3 text-center text-xs text-[var(--cs-text-muted)]">{c.days_total}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Link href={`/recruitment/candidates/${c.id}`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        <Eye className="h-3 w-3 mr-1" />View
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Vacancies tab ─────────────────────────────────────────────────────────────

function VacanciesTab({ vacancies }: { vacancies: import("@/hooks/use-recruitment").Vacancy[] }) {
  const router = useRouter();

  // Fall back to static data if the store is empty (dev convenience)
  const rows = vacancies.length > 0 ? vacancies : [];

  return (
    <div className="space-y-4">
      {rows.map((v) => {
        const salaryStr = v.salary_min && v.salary_max
          ? `£${v.salary_min.toLocaleString()} – £${v.salary_max.toLocaleString()}`
          : v.salary_min
          ? `From £${v.salary_min.toLocaleString()}`
          : "Salary on request";
        const typeLabel = v.employment_type === "permanent" ? "Permanent" : v.employment_type === "bank" ? "Bank" : v.employment_type;
        return (
          <div key={v.id} className="rounded-2xl border border-[var(--cs-border)] bg-white p-4 flex items-center gap-5">
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-semibold text-[var(--cs-navy)]">{v.role_title}</span>
                <Badge variant={v.employment_type === "permanent" ? "info" : "warning"} className="text-[9px]">{typeLabel}</Badge>
                <Badge variant="success" className="text-[9px]">{v.status}</Badge>
              </div>
              <div className="text-xs text-[var(--cs-text-muted)] mt-0.5">
                {salaryStr} · {v.days_open} days open · {v.applications_count} applications
              </div>
            </div>
            <div className="text-center shrink-0">
              <div className="text-xl font-bold text-[var(--cs-navy)]">{v.applications_count}</div>
              <div className="text-[10px] text-[var(--cs-text-muted)]">Applications</div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => router.push(`/recruitment/vacancies/${v.id}`)}>View</Button>
              <Button size="sm" variant="outline" className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50" disabled title="Vacancies are closed through your recruitment portal. Contact HR to close this posting.">Close</Button>
            </div>
          </div>
        );
      })}
      {rows.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-[var(--cs-border)] p-10 text-center text-sm text-[var(--cs-text-muted)]">
          No open vacancies at this time.
        </div>
      )}
      <Button variant="outline" className="w-full rounded-2xl border-dashed h-12 text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]" disabled title="New vacancies are posted through your recruitment portal. Contact HR to create a new posting.">
        <Plus className="h-4 w-4 mr-2" />Post New Vacancy
      </Button>
    </div>
  );
}

// ── Safer Recruitment tab ─────────────────────────────────────────────────────

const SCR_STATUSES: Record<string, CheckStatus> = {
  "cand_1_enhanced_dbs": "not_started",
  "cand_1_right_to_work": "in_progress",
  "cand_1_identity": "verified",
  "cand_1_references": "not_started",
  "cand_1_qualifications": "not_started",
  "cand_1_employment_history": "in_progress",
  "cand_1_medical_fitness": "not_started",
  "cand_1_overseas_criminal_record": "not_started",
  "cand_2_enhanced_dbs": "not_started",
  "cand_2_right_to_work": "verified",
  "cand_2_identity": "verified",
  "cand_2_references": "received",
  "cand_2_qualifications": "in_progress",
  "cand_2_employment_history": "verified",
  "cand_2_medical_fitness": "not_started",
  "cand_2_overseas_criminal_record": "not_started",
  "cand_3_enhanced_dbs": "in_progress",
  "cand_3_right_to_work": "verified",
  "cand_3_identity": "verified",
  "cand_3_references": "verified",
  "cand_3_qualifications": "verified",
  "cand_3_employment_history": "verified",
  "cand_3_medical_fitness": "received",
  "cand_3_overseas_criminal_record": "not_started",
  "cand_4_enhanced_dbs": "not_started",
  "cand_4_right_to_work": "not_started",
  "cand_4_identity": "not_started",
  "cand_4_references": "not_started",
  "cand_4_qualifications": "not_started",
  "cand_4_employment_history": "not_started",
  "cand_4_medical_fitness": "not_started",
  "cand_4_overseas_criminal_record": "not_started",
};

function StatusChip({ status }: { status: CheckStatus }) {
  const labels: Record<CheckStatus, string> = {
    not_started: "—",
    requested: "Requested",
    in_progress: "In Progress",
    received: "Received",
    verified: "Verified",
    concern_flagged: "Concern",
    override_approved: "Override",
    not_required: "N/A",
  };
  return (
    <span className={cn("text-[9px] rounded px-1.5 py-0.5 font-semibold whitespace-nowrap", statusClasses(status))}>
      {labels[status]}
    </span>
  );
}

function SaferRecruitmentTab({ candidates, loading }: { candidates: CandidateDetail[]; loading: boolean }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-[var(--cs-text-secondary)]">Single Central Record (SCR) — Compliance Grid</div>
        <Link href="/recruitment/safer-recruitment/checks">
          <Button size="sm" variant="outline" className="h-8 text-xs">
            <Eye className="h-3 w-3 mr-1" />Full Checks View
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="h-32 rounded-2xl border border-[var(--cs-border)] bg-slate-50 animate-pulse" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--cs-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-[var(--cs-border)]">
                <th className="sticky left-0 z-10 bg-slate-50 text-left px-4 py-3 text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider min-w-[180px]">
                  Candidate
                </th>
                {CHECK_TYPES.map((ct) => (
                  <th key={ct} className="text-center px-3 py-3 text-[10px] font-semibold text-[var(--cs-text-muted)] whitespace-nowrap">
                    {CHECK_LABELS[ct]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates.filter((c) => !["withdrawn", "rejected"].includes(c.stage)).map((c) => (
                <tr key={c.id} className="hover:bg-[var(--cs-surface)]">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 border-r border-[var(--cs-border-subtle)]">
                    <div className="font-medium text-[var(--cs-navy)] text-xs">{c.first_name} {c.last_name}</div>
                    <div className="text-[10px] text-[var(--cs-text-muted)]">{c.role_applied}</div>
                  </td>
                  {CHECK_TYPES.map((ct) => {
                    const key = `${c.id}_${ct}`;
                    const status = (SCR_STATUSES[key] as CheckStatus) || "not_started";
                    return (
                      <td key={ct} className="text-center px-3 py-3">
                        <StatusChip status={status} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px]">
        {(["not_started", "in_progress", "received", "verified", "blocked", "override"] as CheckStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <StatusChip status={s} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Reports tab ───────────────────────────────────────────────────────────────

function ReportsTab() {
  return (
    <div className="space-y-4 max-w-lg">
      <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-6 space-y-4">
        <div className="text-base font-semibold text-[var(--cs-navy)]">Export Reports</div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-[var(--cs-border)]">
            <div>
              <div className="text-sm font-medium text-[var(--cs-navy)]">Audit Bundle</div>
              <div className="text-xs text-[var(--cs-text-muted)]">All candidates, checks, and decisions for inspection</div>
            </div>
            <Button size="sm" className="h-8 text-xs" disabled title="Audit bundle export requires the reporting integration. Visit the Audit page to view the full log.">
              <Download className="h-3 w-3 mr-1" />Export
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-[var(--cs-border)]">
            <div>
              <div className="text-sm font-medium text-[var(--cs-navy)]">Time to Appoint Report</div>
              <div className="text-xs text-[var(--cs-text-muted)]">Average days per stage and overall pipeline velocity</div>
            </div>
            <Button size="sm" variant="outline" className="h-8 text-xs" disabled title="Time to appoint reporting requires the analytics integration to be configured.">
              <BarChart3 className="h-3 w-3 mr-1" />Generate
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-[var(--cs-border)]">
            <div>
              <div className="text-sm font-medium text-[var(--cs-navy)]">SCR Export (Ofsted)</div>
              <div className="text-xs text-[var(--cs-text-muted)]">Single Central Record in Ofsted-ready format</div>
            </div>
            <Button size="sm" variant="outline" className="h-8 text-xs" disabled title="SCR export is available from the Checks page. Contact your system administrator for the Ofsted-ready format.">
              <FileCheck className="h-3 w-3 mr-1" />Export
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RecruitmentPage() {
  const [activeTab, setActiveTab] = useState<MainTab>("pipeline");
  const { data, isLoading, isError } = useRecruitment();
  const createCandidate = useCreateCandidate();

  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [addCandidateForm, setAddCandidateForm] = useState({
    first_name: "", last_name: "", email: "", phone: "", source: "", role_applied: "",
  });
  const [addCandidateError, setAddCandidateError] = useState("");

  function handleAddCandidateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!addCandidateForm.first_name.trim() || !addCandidateForm.last_name.trim() || !addCandidateForm.email.trim()) {
      setAddCandidateError("First name, last name and email are required");
      return;
    }
    createCandidate.mutate(
      {
        first_name: addCandidateForm.first_name,
        last_name: addCandidateForm.last_name,
        email: addCandidateForm.email,
        phone: addCandidateForm.phone || undefined,
        source: addCandidateForm.source || undefined,
        role_applied: addCandidateForm.role_applied || "Care Worker",
      },
      {
        onSuccess: () => {
          setShowAddCandidate(false);
          setAddCandidateForm({ first_name: "", last_name: "", email: "", phone: "", source: "", role_applied: "" });
          setAddCandidateError("");
        },
        onError: () => setAddCandidateError("Failed to add candidate. Please try again."),
      }
    );
  }

  const candidates: CandidateDetail[] = data?.candidates ?? [];
  const alerts: ComplianceAlert[] = data?.alerts ?? [];
  const vacancies: Vacancy[] = data?.vacancies ?? [];
  const stats = data?.stats ?? {
    total_active: 0,
    blocked: 0,
    exceptional_starts: 0,
    avg_days_to_appoint: 0,
  };

  const tabs: { id: MainTab; label: string; icon: React.ElementType }[] = [
    { id: "pipeline", label: "Pipeline", icon: Users },
    { id: "candidates", label: "Candidates", icon: User },
    { id: "vacancies", label: "Vacancies", icon: Briefcase },
    { id: "safer_recruitment", label: "Safer Recruitment", icon: Shield },
    { id: "reports", label: "Reports", icon: BarChart3 },
  ];

  return (
    <>
    <PageShell
      title="Recruitment"
      subtitle="Safer recruitment command centre — applicants, compliance checks, and SCR"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={candidates} columns={CANDIDATE_EXPORT_COLS} filename="recruitment" />
          <PrintButton title="Recruitment" subtitle="Oak House — Safer Recruitment Pipeline" targetId="recruitment-content" />
          <Button variant="outline" size="sm" onClick={() => setActiveTab("candidates")}>
            <Filter className="h-3.5 w-3.5 mr-1" />Filter
          </Button>
          <SmartUploadButton variant="inline" label="Upload Document" uploadContext="Recruitment — DBS/reference/right to work upload" />
          <Button size="sm" onClick={() => setShowAddCandidate(true)}>
            <UserPlus className="h-3.5 w-3.5 mr-1" />Add Candidate
          </Button>
        </div>
      }
    >
      {isError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Failed to load recruitment data. Please refresh or contact support.
        </div>
      )}

      <div id="recruitment-content" className="space-y-6">
        {/* Sticky tab strip */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm -mx-6 px-6 py-3 border-b border-[var(--cs-border-subtle)]">
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  activeTab === id ? "bg-white text-[var(--cs-navy)] shadow-sm" : "text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab content + Aria panel */}
        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            {activeTab === "pipeline" && (
              <PipelineTab candidates={candidates} alerts={alerts} stats={stats} loading={isLoading} />
            )}
            {activeTab === "candidates" && (
              <CandidatesTab candidates={candidates} loading={isLoading} />
            )}
            {activeTab === "vacancies" && <VacanciesTab vacancies={vacancies} />}
            {activeTab === "safer_recruitment" && (
              <SaferRecruitmentTab candidates={candidates} loading={isLoading} />
            )}
            {activeTab === "reports" && <ReportsTab />}
          </div>

          {/* Aria panel */}
          <div className="w-72 shrink-0 sticky top-28">
            <AriaPanel
              pageContext="safer_recruitment"
              sourceContent="Recruitment pipeline overview"
              userRole="registered_manager"
              mode="assist"
            />
          </div>
        </div>
      </div>
    </PageShell>

    {/* ── Add Candidate Modal ────────────────────────────────────────────────── */}
    {showAddCandidate && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-[var(--cs-shadow-elevated)] w-full max-w-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--cs-navy)] flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-blue-600" /> Add Candidate
            </h2>
            <button onClick={() => setShowAddCandidate(false)} className="text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]">
              <XCircle className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-[var(--cs-text-muted)]">A candidate record will be created with 5 standard pre-employment checks auto-assigned.</p>
          <form onSubmit={handleAddCandidateSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[var(--cs-text-secondary)] block mb-1">First name <span className="text-red-500">*</span></label>
                <Input
                  value={addCandidateForm.first_name}
                  onChange={(e) => setAddCandidateForm({ ...addCandidateForm, first_name: e.target.value })}
                  placeholder="First name"
                  className="h-9 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--cs-text-secondary)] block mb-1">Last name <span className="text-red-500">*</span></label>
                <Input
                  value={addCandidateForm.last_name}
                  onChange={(e) => setAddCandidateForm({ ...addCandidateForm, last_name: e.target.value })}
                  placeholder="Last name"
                  className="h-9 rounded-xl"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--cs-text-secondary)] block mb-1">Email <span className="text-red-500">*</span></label>
              <Input
                type="email"
                value={addCandidateForm.email}
                onChange={(e) => setAddCandidateForm({ ...addCandidateForm, email: e.target.value })}
                placeholder="applicant@example.com"
                className="h-9 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--cs-text-secondary)] block mb-1">Phone</label>
              <Input
                value={addCandidateForm.phone}
                onChange={(e) => setAddCandidateForm({ ...addCandidateForm, phone: e.target.value })}
                placeholder="07700 000000"
                className="h-9 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--cs-text-secondary)] block mb-1">Role applied for</label>
              <Input
                value={addCandidateForm.role_applied}
                onChange={(e) => setAddCandidateForm({ ...addCandidateForm, role_applied: e.target.value })}
                placeholder="e.g. Residential Care Worker"
                className="h-9 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--cs-text-secondary)] block mb-1">Source</label>
              <select
                value={addCandidateForm.source}
                onChange={(e) => setAddCandidateForm({ ...addCandidateForm, source: e.target.value })}
                className="w-full h-9 rounded-xl border border-[var(--cs-border)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">Select source…</option>
                <option value="indeed">Indeed</option>
                <option value="totaljobs">TotalJobs</option>
                <option value="reed">Reed</option>
                <option value="staff_referral">Staff referral</option>
                <option value="agency">Agency</option>
                <option value="walk_in">Walk-in</option>
                <option value="linkedin">LinkedIn</option>
                <option value="other">Other</option>
              </select>
            </div>
            {addCandidateError && (
              <p className="text-xs text-red-600">{addCandidateError}</p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => { setShowAddCandidate(false); setAddCandidateError(""); }}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createCandidate.isPending} className="rounded-xl bg-slate-900 text-white">
                {createCandidate.isPending ? "Creating…" : "Create Candidate"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}
