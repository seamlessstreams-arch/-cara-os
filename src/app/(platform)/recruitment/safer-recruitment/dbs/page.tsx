"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Fingerprint, AlertTriangle, CheckCircle2, Clock, AlertCircle,
  Loader2, Info, ShieldAlert, Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  useRecruitment,
  type RecruitmentCheck,
  type CandidateDetail,
} from "@/hooks/use-recruitment";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";

// ── Helpers ───────────────────────────────────────────────────────────────────

function dbsStatusLabel(status: RecruitmentCheck["status"]): string {
  const map: Record<string, string> = {
    not_started: "Not Started",
    in_progress: "In Progress",
    received: "Needs Attention",
    verified: "Verified",
    blocked: "Blocked",
    override: "Override",
  };
  return map[status] ?? status;
}

function dbsStatusColor(status: RecruitmentCheck["status"]): string {
  switch (status) {
    case "verified": return "bg-emerald-100 text-emerald-700";
    case "in_progress": return "bg-blue-100 text-blue-700";
    case "received": return "bg-amber-100 text-amber-700";
    case "concern_flagged": return "bg-red-100 text-red-700";
    case "override_approved": return "bg-purple-100 text-purple-700";
    default: return "bg-slate-100 text-[var(--cs-text-muted)]";
  }
}

function stageLabel(stage: string): string {
  return stage.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB");
}

// ── Candidate DBS row ─────────────────────────────────────────────────────────

interface CandidateDBSRowProps {
  candidate: CandidateDetail;
  dbsCheck: RecruitmentCheck;
}

function CandidateDBSRow({ candidate, dbsCheck }: CandidateDBSRowProps) {
  return (
    <tr className="border-b border-[var(--cs-border-subtle)] last:border-0 hover:bg-[var(--cs-surface)] transition-colors">
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-[var(--cs-navy)]">
          {candidate.first_name} {candidate.last_name}
        </div>
        <div className="text-[10px] text-[var(--cs-text-muted)]">{candidate.role_applied}</div>
      </td>
      <td className="px-4 py-3">
        <Badge className="text-[9px] rounded-full bg-slate-100 text-[var(--cs-text-secondary)]">
          {stageLabel(candidate.stage)}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <Badge className={cn("text-[10px] rounded-full px-2.5 py-0.5", dbsStatusColor(dbsCheck.status))}>
          {dbsStatusLabel(dbsCheck.status)}
        </Badge>
      </td>
      <td className="px-4 py-3 text-xs text-[var(--cs-text-secondary)]">
        {formatDate(dbsCheck.requested_date)}
      </td>
      <td className="px-4 py-3 text-xs text-[var(--cs-text-secondary)] font-mono">
        {dbsCheck.certificate_number ?? "—"}
      </td>
      <td className="px-4 py-3">
        <Badge className="text-[9px] rounded-full bg-indigo-100 text-indigo-700">
          Children&apos;s Barred List
        </Badge>
      </td>
      <td className="px-4 py-3">
        {dbsCheck.concern_flag ? (
          <Badge className="text-[9px] rounded-full bg-red-100 text-red-700 flex items-center gap-0.5 w-fit">
            <ShieldAlert className="h-2.5 w-2.5" />Concern
          </Badge>
        ) : (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        )}
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DBSTrackerPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, error } = useRecruitment();

  const { candidatesWithDBS, stats } = useMemo(() => {
    const candidates = data?.candidates ?? [];
    const withDBS = candidates
      .map((c: CandidateDetail) => ({
        candidate: c,
        dbsCheck: c.checks.find(ch => ch.check_type === "enhanced_dbs") ?? null,
      }))
      .filter(item => item.dbsCheck !== null) as { candidate: CandidateDetail; dbsCheck: RecruitmentCheck }[];

    const activeStatuses = ["appointed", "unsuccessful", "withdrawn"];
    const activeCandidates = withDBS.filter(
      item => !activeStatuses.includes(item.candidate.stage)
    );

    const st = {
      verified: withDBS.filter(i => i.dbsCheck.status === "verified").length,
      submitted: withDBS.filter(i => i.dbsCheck.status === "in_progress").length,
      not_started: candidates.filter((c: CandidateDetail) =>
        !c.checks.find(ch => ch.check_type === "enhanced_dbs") ||
        c.checks.find(ch => ch.check_type === "enhanced_dbs")?.status === "not_started"
      ).length,
      concern_flags: withDBS.filter(i => i.dbsCheck.concern_flag).length,
    };

    return { candidatesWithDBS: activeCandidates, stats: st };
  }, [data]);

  const allCandidates = data?.candidates ?? [];
  const matchesSearch = (c: CandidateDetail) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return `${c.first_name} ${c.last_name} ${c.role_applied} ${c.stage}`.toLowerCase().includes(q);
  };
  const candidatesWithoutDBS = allCandidates.filter((c: CandidateDetail) =>
    !c.checks.find(ch => ch.check_type === "enhanced_dbs") && matchesSearch(c)
  );
  const allWithDBS = (data?.candidates ?? [])
    .filter(matchesSearch)
    .map((c: CandidateDetail) => ({
      candidate: c,
      dbsCheck: c.checks.find(ch => ch.check_type === "enhanced_dbs") ?? null,
    }))
    .filter(item => item.dbsCheck !== null) as { candidate: CandidateDetail; dbsCheck: RecruitmentCheck }[];

  return (
    <PageShell
      title="DBS Tracker"
      subtitle="Enhanced DBS certificate management — Schedule 7 compliant"
      ariaContext={{ pageTitle: "DBS Certificate Management", sourceType: "staff" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="DBS Tracker" subtitle="Chamberlain House — DBS Certificate Management" targetId="dbs-content" />
          <SmartUploadButton variant="inline" label="Upload DBS Certificate" uploadContext="Safer Recruitment — DBS certificate upload" />
        </div>
      }
    >
      <div id="dbs-content" className="space-y-0">
      {/* Compliance notice */}
      <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 flex gap-3 mb-6">
        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          DBS certificates must be reviewed by an authorised person before the candidate starts work.
          Certificate number and disclosure date must be recorded. The DBS Update Service should be
          checked if the candidate is subscribed.
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
            <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
            <div className="text-xs text-[var(--cs-text-muted)] mt-0.5">Submitted / In Progress</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-[var(--cs-text-muted)]">{stats.not_started}</div>
            <div className="text-xs text-[var(--cs-text-muted)] mt-0.5">Not Started</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-4 pb-4">
            <div className={cn("text-2xl font-bold", stats.concern_flags > 0 ? "text-red-600" : "text-[var(--cs-text-muted)]")}>
              {stats.concern_flags}
            </div>
            <div className="text-xs text-[var(--cs-text-muted)] mt-0.5">Concern Flags</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
        <Input
          placeholder="Search candidates by name or role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-xs rounded-lg"
        />
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
          <span className="text-sm">Loading DBS data...</span>
        </div>
      ) : (
        <>
          {/* Section 1: Active candidates */}
          <Card className="rounded-2xl mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-blue-500" />
                Active Candidates
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {allWithDBS.length === 0 && candidatesWithoutDBS.length === 0 ? (
                <div className="py-10 text-center text-[var(--cs-text-muted)]">
                  <Fingerprint className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                  <div className="text-sm">No candidate DBS records yet</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--cs-border-subtle)]">
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Candidate</th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Stage</th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">DBS Status</th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Submitted</th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Certificate #</th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Workforce Category</th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Concern</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allWithDBS.map(({ candidate, dbsCheck }) => (
                        <CandidateDBSRow key={candidate.id} candidate={candidate} dbsCheck={dbsCheck} />
                      ))}
                      {candidatesWithoutDBS.map((c: CandidateDetail) => (
                        <tr key={c.id} className="border-b border-[var(--cs-border-subtle)] last:border-0 hover:bg-[var(--cs-surface)] transition-colors">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-[var(--cs-navy)]">{c.first_name} {c.last_name}</div>
                            <div className="text-[10px] text-[var(--cs-text-muted)]">{c.role_applied}</div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className="text-[9px] rounded-full bg-slate-100 text-[var(--cs-text-secondary)]">{stageLabel(c.stage)}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className="text-[10px] rounded-full bg-slate-100 text-[var(--cs-text-muted)]">Not Started</Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-[var(--cs-text-muted)]">—</td>
                          <td className="px-4 py-3 text-xs text-[var(--cs-text-muted)]">—</td>
                          <td className="px-4 py-3">
                            <Badge className="text-[9px] rounded-full bg-indigo-100 text-indigo-700">Children&apos;s Barred List</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Clock className="h-4 w-4 text-[var(--cs-text-gentle)]" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 2: Staff DBS refresh */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Appointed Staff — DBS Refresh Due
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Appointed staff DBS review placeholder */}
              {(() => {
                const appointedWithDBS = allWithDBS.filter(i => i.candidate.stage === "appointed" && i.dbsCheck.status === "verified");
                if (appointedWithDBS.length === 0) {
                  return (
                    <div className="py-6 text-center text-[var(--cs-text-muted)]">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-200" />
                      <div className="text-sm">No DBS renewals currently due for appointed staff</div>
                      <div className="text-xs mt-1 text-[var(--cs-text-muted)]">Staff DBS records are reviewed on a 3-year cycle</div>
                    </div>
                  );
                }
                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--cs-border-subtle)]">
                          <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Staff Member</th>
                          <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">DBS Number</th>
                          <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Issue Date</th>
                          <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Update Service</th>
                          <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Next Review</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointedWithDBS.map(({ candidate, dbsCheck }) => {
                          const issueDate = dbsCheck.verified_at ? new Date(dbsCheck.verified_at) : null;
                          const nextReview = issueDate ? new Date(issueDate.getFullYear() + 3, issueDate.getMonth(), issueDate.getDate()) : null;
                          const daysToReview = nextReview ? Math.floor((nextReview.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                          return (
                            <tr key={candidate.id} className="border-b border-[var(--cs-border-subtle)] last:border-0 hover:bg-[var(--cs-surface)]">
                              <td className="px-4 py-3 text-sm font-medium text-[var(--cs-navy)]">
                                {candidate.first_name} {candidate.last_name}
                              </td>
                              <td className="px-4 py-3 text-xs text-[var(--cs-text-secondary)] font-mono">
                                {dbsCheck.certificate_number ?? "—"}
                              </td>
                              <td className="px-4 py-3 text-xs text-[var(--cs-text-secondary)]">
                                {formatDate(dbsCheck.verified_at)}
                              </td>
                              <td className="px-4 py-3">
                                <Badge className="text-[9px] rounded-full bg-slate-100 text-[var(--cs-text-muted)]">Not recorded</Badge>
                              </td>
                              <td className="px-4 py-3">
                                {nextReview ? (
                                  <Badge className={cn(
                                    "text-[9px] rounded-full",
                                    daysToReview !== null && daysToReview < 30 ? "bg-red-100 text-red-700" :
                                    daysToReview !== null && daysToReview < 90 ? "bg-amber-100 text-amber-700" :
                                    "bg-slate-100 text-[var(--cs-text-secondary)]"
                                  )}>
                                    {nextReview.toLocaleDateString("en-GB")}
                                    {daysToReview !== null && daysToReview < 90 && ` (${daysToReview}d)`}
                                  </Badge>
                                ) : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </>
      )}
      </div>{/* close #dbs-content */}
      <AriaPanel
        mode="assist"
        pageContext="DBS Certificate Management — enhanced DBS checks, DBS update service, renewal tracking, barred list checks, certificate dates, staff DBS compliance, safer recruitment, Ofsted evidence"
        recordType="staff_training"
        className="mt-6"
      />
    </PageShell>
  );
}
