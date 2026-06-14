"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ClipboardCheck, AlertTriangle, CheckCircle2, Clock, Mail, Phone,
  Loader2, AlertCircle, Search, Building2, User, Flag, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useRecruitment,
  type RecruitmentReference,
  type CandidateDetail,
} from "@/hooks/use-recruitment";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";

// ── Helpers ───────────────────────────────────────────────────────────────────

type RefFilter = "all" | "requested" | "received" | "satisfactory" | "concerns" | "overdue";

function statusLabel(status: RecruitmentReference["status"]): string {
  const map: Record<RecruitmentReference["status"], string> = {
    not_requested: "Not Requested",
    requested: "Requested",
    received: "Received",
    satisfactory: "Satisfactory",
    unsatisfactory: "Unsatisfactory",
    uncontactable: "Uncontactable",
  };
  return map[status] ?? status;
}

function statusColor(status: RecruitmentReference["status"]): string {
  switch (status) {
    case "satisfactory": return "bg-emerald-100 text-emerald-700";
    case "received": return "bg-blue-100 text-blue-700";
    case "requested": return "bg-amber-100 text-amber-700";
    case "unsatisfactory": return "bg-red-100 text-red-700";
    case "uncontactable": return "bg-orange-100 text-orange-700";
    default: return "bg-slate-100 text-[var(--cs-text-muted)]";
  }
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 0;
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function isOverdue(ref: RecruitmentReference): boolean {
  if (ref.status === "satisfactory" || ref.status === "received" || ref.status === "unsatisfactory") return false;
  if (!ref.requested_date) return false;
  return daysSince(ref.requested_date) > 14;
}

// ── Reference Row ─────────────────────────────────────────────────────────────

interface RefRowProps {
  ref: RecruitmentReference;
  candidateName: string;
  candidateStage: string;
}

function ReferenceRow({ ref: r, candidateName, candidateStage }: RefRowProps) {
  const overdue = isOverdue(r);
  const daysPending = r.requested_date ? daysSince(r.requested_date) : null;
  const daysReceived = r.received_date ? daysSince(r.received_date) : null;

  return (
    <div className={cn(
      "rounded-2xl border bg-white p-4 space-y-3",
      r.discrepancy_flag ? "border-red-200" : overdue ? "border-amber-200" : "border-[var(--cs-border)]"
    )}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[var(--cs-navy)]">{candidateName}</span>
            <Badge className="text-[9px] rounded-full bg-slate-100 text-[var(--cs-text-secondary)]">{candidateStage.replace(/_/g, " ")}</Badge>
            {r.is_most_recent_employer && (
              <Badge className="text-[9px] rounded-full bg-purple-100 text-purple-700">Most Recent Employer</Badge>
            )}
            {r.discrepancy_flag && (
              <Badge className="text-[9px] rounded-full bg-red-100 text-red-700 flex items-center gap-0.5">
                <Flag className="h-2.5 w-2.5" />Discrepancy
              </Badge>
            )}
            {overdue && (
              <Badge className="text-[9px] rounded-full bg-amber-100 text-amber-700 flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />Overdue
              </Badge>
            )}
          </div>
        </div>
        <Badge className={cn("text-[10px] rounded-full shrink-0 px-2.5 py-0.5", statusColor(r.status))}>
          {statusLabel(r.status)}
        </Badge>
      </div>

      {/* Referee details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-[var(--cs-text-secondary)]">
        <div className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-[var(--cs-text-muted)] shrink-0" />
          <span className="font-medium text-[var(--cs-navy)]">{r.referee_name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-[var(--cs-text-muted)] shrink-0" />
          <span>{r.referee_org ?? "—"}</span>
          {r.referee_role && <span className="text-[var(--cs-text-muted)]">· {r.referee_role}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5 text-[var(--cs-text-muted)] shrink-0" />
          <span className="truncate">{r.referee_email ?? "—"}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex items-center gap-3 text-xs text-[var(--cs-text-muted)]">
        {r.requested_date ? (
          <span>
            Requested <span className="font-medium text-[var(--cs-text-secondary)]">{new Date(r.requested_date).toLocaleDateString("en-GB")}</span>
          </span>
        ) : (
          <span className="text-[var(--cs-text-muted)]">Not yet requested</span>
        )}
        {r.received_date ? (
          <>
            <span className="text-[var(--cs-text-gentle)]">→</span>
            <span>
              Received <span className="font-medium text-[var(--cs-text-secondary)]">{new Date(r.received_date).toLocaleDateString("en-GB")}</span>
            </span>
            {daysReceived !== null && daysReceived > 0 && (
              <span className="text-[var(--cs-text-muted)]">({daysReceived} days ago)</span>
            )}
          </>
        ) : daysPending !== null ? (
          <>
            <span className="text-[var(--cs-text-gentle)]">→</span>
            <span className={cn("font-medium", daysPending > 14 ? "text-amber-600" : "text-[var(--cs-text-secondary)]")}>
              Outstanding {daysPending} day{daysPending !== 1 ? "s" : ""}
            </span>
          </>
        ) : null}
      </div>

      {/* Discrepancy notes */}
      {r.discrepancy_flag && r.discrepancy_notes && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">
          <span className="font-semibold">Discrepancy: </span>{r.discrepancy_notes}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {(r.status === "requested" || r.status === "not_requested") && (
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" disabled title="Reference chase emails require the email integration to be configured.">
            <Mail className="h-3 w-3" />Chase
          </Button>
        )}
        {r.status !== "satisfactory" && r.status !== "unsatisfactory" && r.status !== "received" && (
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" disabled title="Mark references as received once the response is in hand. Update status in the candidate profile.">
            <CheckCircle2 className="h-3 w-3" />Mark Received
          </Button>
        )}
        {(r.status === "received" || r.status === "satisfactory" || r.status === "unsatisfactory") && (
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" disabled title="Reference responses are stored in the Documents section under the candidate's file.">
            <ExternalLink className="h-3 w-3" />View Response
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type RefWithCandidate = RecruitmentReference & {
  candidateName: string;
  candidateStage: string;
};

export default function ReferencesPage() {
  const [filter, setFilter] = useState<RefFilter>("all");
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, error } = useRecruitment();

  const allRefs = useMemo<RefWithCandidate[]>(() => {
    if (!data?.candidates) return [];
    return data.candidates.flatMap((c: CandidateDetail) =>
      c.references.map(r => ({
        ...r,
        candidateName: `${c.first_name} ${c.last_name}`,
        candidateStage: c.stage,
      }))
    );
  }, [data]);

  const stats = useMemo(() => ({
    total: allRefs.length,
    received: allRefs.filter(r => ["received", "satisfactory", "unsatisfactory"].includes(r.status)).length,
    outstanding: allRefs.filter(r => ["requested", "not_requested"].includes(r.status)).length,
  }), [allRefs]);

  const filtered = useMemo(() => {
    let list = allRefs;
    if (filter === "requested") list = list.filter(r => r.status === "requested");
    else if (filter === "received") list = list.filter(r => r.status === "received");
    else if (filter === "satisfactory") list = list.filter(r => r.status === "satisfactory");
    else if (filter === "concerns") list = list.filter(r => r.discrepancy_flag || r.status === "unsatisfactory");
    else if (filter === "overdue") list = list.filter(r => isOverdue(r));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.candidateName.toLowerCase().includes(q) ||
        r.referee_name.toLowerCase().includes(q) ||
        (r.referee_org ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [allRefs, filter, search]);

  const FILTERS: { key: RefFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "requested", label: "Requested" },
    { key: "received", label: "Received" },
    { key: "satisfactory", label: "Satisfactory" },
    { key: "concerns", label: "Concerns" },
    { key: "overdue", label: "Overdue" },
  ];

  return (
    <PageShell
      title="References"
      subtitle="Track and verify all candidate references"
      caraContext={{ pageTitle: "Candidate Reference Tracker", sourceType: "staff" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="References" subtitle="Chamberlain House — Candidate Reference Tracker" targetId="references-content" />
          <SmartUploadButton variant="inline" label="Upload Reference" uploadContext="Safer Recruitment — candidate reference document upload" />
        </div>
      }
    >
      <div id="references-content" className="space-y-0">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="rounded-2xl">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-[var(--cs-navy)]">{stats.total}</div>
            <div className="text-xs text-[var(--cs-text-muted)] mt-0.5">Total Requested</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-emerald-600">{stats.received}</div>
            <div className="text-xs text-[var(--cs-text-muted)] mt-0.5">Received</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-amber-600">{stats.outstanding}</div>
            <div className="text-xs text-[var(--cs-text-muted)] mt-0.5">Outstanding</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + search */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filter === f.key
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-[var(--cs-text-secondary)] hover:bg-slate-200"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
          <input
            type="text"
            placeholder="Search candidate or referee..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="rounded-full border border-[var(--cs-border)] pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 w-56"
          />
        </div>
      </div>

      {/* Content */}
      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center gap-3 text-red-600 mb-5">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{(error as Error)?.message || "Failed to load data"}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-[var(--cs-text-muted)]">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span className="text-sm">Loading references...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--cs-border)] p-12 text-center text-[var(--cs-text-muted)]">
          <ClipboardCheck className="h-10 w-10 mx-auto mb-3 text-slate-200" />
          <div className="text-sm font-medium">No references match this filter</div>
          <div className="text-xs mt-1">Try changing the filter or search term</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <ReferenceRow
              key={r.id}
              ref={r}
              candidateName={r.candidateName}
              candidateStage={r.candidateStage}
            />
          ))}
        </div>
      )}
      </div>{/* close #references-content */}
      <CaraPanel
        mode="assist"
        pageContext="Candidate Reference Tracker — reference requests, reference responses, employment history verification, character references, safer recruitment standards, open references, Ofsted evidence"
        recordType="staff_training"
        className="mt-6"
      />
    </PageShell>
  );
}
