"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Users, Search, Filter, Plus, ChevronRight, AlertTriangle,
  CheckCircle2, Clock, Shield, FileCheck, User, Star,
  ArrowUpDown, Eye, MoreHorizontal, Calendar, Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecruitment } from "@/hooks/use-recruitment";
import type { CandidateDetail } from "@/hooks/use-recruitment";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";

// ── Status helpers ────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  enquiry: "Enquiry",
  application_received: "Application",
  sift: "Sift",
  shortlisted: "Shortlisted",
  interview_scheduled: "Interview Scheduled",
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
  started: "Started",
  unsuccessful: "Unsuccessful",
  withdrawn: "Withdrawn",
  rejected: "Rejected",
  offer_made: "Offer Made",
};

const STAGE_COLORS: Record<string, string> = {
  enquiry: "bg-slate-100 text-[var(--cs-text-secondary)]",
  application_received: "bg-blue-100 text-blue-700",
  sift: "bg-blue-100 text-blue-700",
  shortlisted: "bg-blue-100 text-blue-700",
  interview_scheduled: "bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)]",
  interview_completed: "bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)]",
  references_requested: "bg-amber-100 text-amber-700",
  references_received: "bg-amber-100 text-amber-700",
  dbs_submitted: "bg-orange-100 text-orange-700",
  dbs_received: "bg-orange-100 text-orange-700",
  conditional_offer: "bg-emerald-100 text-emerald-700",
  pre_start_checks: "bg-emerald-100 text-emerald-700",
  final_clearance: "bg-emerald-100 text-emerald-700",
  onboarding: "bg-teal-100 text-teal-700",
  appointed: "bg-teal-100 text-teal-700",
  started: "bg-teal-100 text-teal-700",
  unsuccessful: "bg-red-100 text-red-700",
  withdrawn: "bg-red-100 text-red-700",
  rejected: "bg-red-100 text-red-700",
  offer_made: "bg-emerald-100 text-emerald-700",
};

const RISK_COLORS: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
  critical: "bg-red-900 text-white",
};

function ComplianceRing({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const radius = size === "sm" ? 14 : size === "md" ? 18 : 22;
  const stroke = size === "sm" ? 2.5 : 3;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const dim = (radius + stroke) * 2;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={dim} height={dim} className="-rotate-90">
        <circle cx={dim / 2} cy={dim / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={dim / 2} cy={dim / 2} r={radius} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className={cn(
        "absolute font-bold tabular-nums",
        size === "sm" ? "text-[9px]" : size === "md" ? "text-[10px]" : "text-xs"
      )} style={{ color }}>
        {score}%
      </span>
    </div>
  );
}

// ── Candidates page ───────────────────────────────────────────────────────────

type SortField = "name" | "stage" | "compliance" | "risk" | "days";
type SortDir = "asc" | "desc";

const STAGE_GROUPS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Pre-offer", value: "pre_offer" },
  { label: "Offered", value: "offered" },
  { label: "Appointed", value: "appointed" },
  { label: "Closed", value: "closed" },
];

const ACTIVE_STAGES = new Set(["enquiry", "application_received", "sift", "shortlisted", "interview_scheduled", "interview_completed"]);
const PRE_OFFER_STAGES = new Set(["references_requested", "references_received", "dbs_submitted", "dbs_received"]);
const OFFERED_STAGES = new Set(["conditional_offer", "pre_start_checks", "final_clearance"]);
const APPOINTED_STAGES = new Set(["onboarding", "appointed", "started"]);
const CLOSED_STAGES = new Set(["unsuccessful", "withdrawn", "rejected"]);

export default function CandidatesPage() {
  const { data, isLoading, error } = useRecruitment();
  const [search, setSearch] = useState("");
  const [stageGroup, setStageGroup] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("days");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const candidates = useMemo<CandidateDetail[]>(() => {
    const all = data?.candidates ?? [];
    return all
      .filter((c) => {
        const q = search.toLowerCase();
        if (q && !`${c.first_name} ${c.last_name} ${c.email} ${c.role_applied}`.toLowerCase().includes(q)) return false;
        if (riskFilter !== "all" && c.risk_level !== riskFilter) return false;
        if (stageGroup === "all") return true;
        if (stageGroup === "active") return ACTIVE_STAGES.has(c.stage);
        if (stageGroup === "pre_offer") return PRE_OFFER_STAGES.has(c.stage);
        if (stageGroup === "offered") return OFFERED_STAGES.has(c.stage);
        if (stageGroup === "appointed") return APPOINTED_STAGES.has(c.stage);
        if (stageGroup === "closed") return CLOSED_STAGES.has(c.stage);
        return true;
      })
      .sort((a, b) => {
        let av = 0, bv = 0;
        if (sortField === "name") {
          av = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
          return sortDir === "asc" ? av : -av;
        }
        if (sortField === "compliance") { av = a.compliance_score; bv = b.compliance_score; }
        if (sortField === "days") { av = a.days_in_stage; bv = b.days_in_stage; }
        return sortDir === "asc" ? av - bv : bv - av;
      });
  }, [data, search, stageGroup, riskFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  if (isLoading) return (
    <PageShell title="Candidates" subtitle="Loading...">
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    </PageShell>
  );

  if (error) return (
    <PageShell title="Candidates" subtitle="Error loading data">
      <Card className="rounded-2xl border-red-100 bg-red-50">
        <CardContent className="py-8 text-center text-red-600">
          <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
          Failed to load candidates. Please refresh.
        </CardContent>
      </Card>
    </PageShell>
  );

  const total = data?.candidates?.length ?? 0;
  const blocked = candidates.filter(c => c.blocker_summary?.length > 0).length;
  const exceptional = candidates.filter(c => c.offer?.exceptional_start).length;
  const active = candidates.filter(c => !CLOSED_STAGES.has(c.stage)).length;

  return (
    <PageShell
      title="All Candidates"
      subtitle="Manage your recruitment pipeline with full compliance visibility"
      ariaContext={{ pageTitle: "Recruitment Candidates", sourceType: "staff" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="All Candidates" subtitle="Chamberlain House — Recruitment Pipeline" targetId="candidates-content" />
          <SmartUploadButton variant="inline" label="Upload Document" uploadContext="Recruitment Candidates — CV or application upload" />
          <Button className="bg-slate-900 text-white hover:bg-slate-700 rounded-xl" size="sm" disabled title="New candidates are added when they apply via your recruitment portal or are entered by HR.">
            <Plus className="h-4 w-4 mr-1.5" /> Add Candidate
          </Button>
        </div>
      }
    >
      <div id="candidates-content" className="space-y-0">
      {/* Summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Total", value: total, color: "text-[var(--cs-text-secondary)]" },
          { label: "Active", value: active, color: "text-blue-700" },
          { label: "Compliance Blockers", value: blocked, color: blocked > 0 ? "text-red-600" : "text-emerald-600" },
          { label: "Exceptional Starts", value: exceptional, color: exceptional > 0 ? "text-purple-700" : "text-[var(--cs-text-muted)]" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="rounded-2xl border-[var(--cs-border-subtle)]">
            <CardContent className="py-3 px-4">
              <div className={cn("text-2xl font-bold", color)}>{value}</div>
              <div className="text-[11px] text-[var(--cs-text-muted)] mt-0.5">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-4">
        {/* Stage group tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {STAGE_GROUPS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setStageGroup(value)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                stageGroup === value
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-[var(--cs-text-secondary)] hover:bg-slate-200"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search + risk filter */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
            <Input
              placeholder="Search by name, email, role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-xl border-[var(--cs-border)] text-sm"
            />
          </div>
          <select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            className="h-9 rounded-xl border border-[var(--cs-border)] bg-white px-3 text-xs text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <option value="all">All risk levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {candidates.length === 0 ? (
        <Card className="rounded-2xl border-[var(--cs-border-subtle)]">
          <CardContent className="py-12 text-center">
            <Users className="h-8 w-8 mx-auto mb-3 text-slate-200" />
            <div className="text-sm font-medium text-[var(--cs-text-muted)]">No candidates match your filters</div>
            <div className="text-xs text-[var(--cs-text-muted)] mt-1">Try adjusting the stage group or clearing the search</div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl border-[var(--cs-border-subtle)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--cs-border-subtle)] bg-slate-50">
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => toggleSort("name")} className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]">
                      Candidate <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-text-muted)]">Stage</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-text-muted)]">Role</th>
                  <th className="px-4 py-3 text-center">
                    <button onClick={() => toggleSort("compliance")} className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] mx-auto">
                      Compliance <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-text-muted)]">Risk</th>
                  <th className="px-4 py-3 text-center">
                    <button onClick={() => toggleSort("days")} className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] mx-auto">
                      Days <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-text-muted)]">Blockers</th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-text-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {candidates.map((c) => {
                  const hasBlockers = c.blocker_summary?.length > 0;
                  const stageLabel = STAGE_LABELS[c.stage] ?? c.stage;
                  const stageColor = STAGE_COLORS[c.stage] ?? "bg-slate-100 text-[var(--cs-text-secondary)]";
                  const riskColor = RISK_COLORS[c.risk_level] ?? "bg-slate-100 text-[var(--cs-text-secondary)]";
                  return (
                    <tr key={c.id} className={cn(
                      "hover:bg-[var(--cs-surface)] transition-colors group",
                      hasBlockers && "bg-red-50/40"
                    )}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ComplianceRing score={c.compliance_score} size="sm" />
                          <div>
                            <div className="font-semibold text-[var(--cs-navy)] group-hover:text-blue-700 transition-colors">
                              {c.first_name} {c.last_name}
                            </div>
                            <div className="text-[10px] text-[var(--cs-text-muted)] flex items-center gap-1">
                              <Mail className="h-2.5 w-2.5" />{c.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] rounded-full px-2.5 py-1 font-semibold", stageColor)}>
                          {stageLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--cs-text-secondary)]">{c.role_applied}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "text-xs font-bold tabular-nums",
                          c.compliance_score >= 80 ? "text-emerald-600" :
                          c.compliance_score >= 50 ? "text-amber-600" : "text-red-600"
                        )}>
                          {c.compliance_score}%
                        </span>
                        <Progress
                          value={c.compliance_score}
                          className="h-1 mt-1 rounded-full"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] rounded-full px-2.5 py-1 font-semibold uppercase", riskColor)}>
                          {c.risk_level}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "text-xs font-semibold tabular-nums",
                          c.days_in_stage > 14 ? "text-amber-600" : "text-[var(--cs-text-secondary)]"
                        )}>
                          {c.days_in_stage}d
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {hasBlockers ? (
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                            <span className="text-[10px] text-red-600 font-medium">
                              {c.blocker_summary.length} blocker{c.blocker_summary.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" /> Clear
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/recruitment/candidates/${c.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 px-2.5 rounded-lg text-xs">
                              <Eye className="h-3.5 w-3.5 mr-1" /> View
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-slate-50 bg-slate-50 text-[10px] text-[var(--cs-text-muted)]">
            Showing {candidates.length} of {total} candidates
          </div>
        </Card>
      )}
      </div>{/* close #candidates-content */}
      <AriaPanel
        mode="assist"
        pageContext="Recruitment Candidates — candidate pipeline, applications, interviews, DBS checks, references, safer recruitment, shortlisting, offer status, HR compliance, staff onboarding"
        recordType="staff_training"
        className="mt-6"
      />
    </PageShell>
  );
}
