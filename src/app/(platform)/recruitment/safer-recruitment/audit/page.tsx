"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity, AlertCircle, Loader2, Download, Clock, User,
  Filter, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useRecruitment,
  type RecruitmentAuditEntry,
  type CandidateDetail,
} from "@/hooks/use-recruitment";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";

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
  return "bg-slate-100 text-slate-600";
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
      <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-slate-200 shrink-0">
        <Activity className="h-3.5 w-3.5 text-slate-400" />
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0 pt-1">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn("text-[9px] rounded-full px-2 py-0.5", eventTypeColor(entry.event_type))}>
              {eventTypeLabel(entry.event_type)}
            </Badge>
            {candidateName && (
              <span className="text-xs font-medium text-slate-700">{candidateName}</span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3" />
            {formatDateTime(entry.performed_at)}
          </span>
        </div>
        <div className="mt-1.5 text-xs text-slate-700">{entry.summary}</div>
        {summary && (
          <div className="mt-1 text-[10px] text-slate-400 italic">{summary}</div>
        )}
        <div className="mt-1.5 flex items-center gap-1.5">
          <User className="h-3 w-3 text-slate-300" />
          <span className="text-[10px] text-slate-400">{entry.actor} · {entry.actor_role}</span>
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
      ariaContext={{ pageTitle: "Inspection bundles are generated from the Documents section. Contact your system administrator.", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Audit Log" subtitle="Oak House — Safer Recruitment Audit Trail" targetId="sr-audit-content" />
          <SmartUploadButton variant="inline" label="Upload Audit Document" uploadContext="Safer Recruitment — audit evidence or inspection bundle document upload" />
          <Button size="sm" variant="outline" className="gap-1.5" disabled title="Inspection bundles are generated from the Documents section. Contact your system administrator.">
            <Download className="h-3.5 w-3.5" />
            Generate Inspection Bundle
          </Button>
        </div>
      }
    >
      <div id="sr-audit-content" className="space-y-0">
      {/* Immutability notice */}
      <div className="rounded-2xl bg-slate-900 text-white p-4 flex gap-3 mb-6">
        <Lock className="h-5 w-5 text-slate-300 shrink-0 mt-0.5" />
        <div className="text-sm">
          <span className="font-semibold">This audit trail cannot be edited or deleted.</span>
          {" "}All recruitment actions are permanently logged and are available for inspection.
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-end gap-3 mb-6 flex-wrap">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1 block">Event Type</label>
          <select
            value={eventTypeFilter}
            onChange={e => setEventTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {ALL_EVENT_TYPES.map(t => (
              <option key={t} value={t}>{t === "all" ? "All Event Types" : eventTypeLabel(t)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1 block">Candidate</label>
          <select
            value={candidateFilter}
            onChange={e => setCandidateFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="all">All Candidates</option>
            {candidates.map((c: CandidateDetail) => (
              <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1 block">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1 block">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
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
        <div className="ml-auto text-xs text-slate-400">
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
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span className="text-sm">Loading audit log...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-400">
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
    </PageShell>
  );
}
