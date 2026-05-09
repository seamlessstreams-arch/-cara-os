"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { useDisclosures } from "@/hooks/use-disclosures";
import type { Disclosure } from "@/types/extended";
import {
  DISCLOSURE_TYPE_LABEL,
  DISCLOSURE_SEVERITY_LABEL,
  QUESTIONS_ASKED_LABEL,
  DISCLOSURE_STATUS_LABEL,
} from "@/types/extended";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Shield,
  AlertTriangle,
  CheckCircle,
  Lock,
  Ear,
  MessageCircle,
  Heart,
  Phone,
  FileText,
  Clock,
  Eye,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── config ──────────────────────────────────────────────────────────────────
const severityColour: Record<string, string> = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800",
  crisis: "bg-red-100 text-red-800",
};

const statusColour: Record<string, string> = {
  active_investigation: "bg-red-100 text-red-800",
  external_agency_leading: "bg-purple-100 text-purple-800",
  closed_actioned: "bg-green-100 text-green-800",
  monitoring: "bg-blue-100 text-blue-800",
};

const questionsColour: Record<string, string> = {
  none_listened_only: "bg-green-100 text-green-800",
  open_clarifying: "bg-blue-100 text-blue-800",
  closed_leading_flagged: "bg-amber-100 text-amber-800",
};

// ── export columns ──────────────────────────────────────────────────────────
const exportCols: ExportColumn<Disclosure>[] = [
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Date", accessor: (r) => r.disclosure_date },
  { header: "Time", accessor: (r) => r.disclosure_time },
  { header: "Type", accessor: (r) => DISCLOSURE_TYPE_LABEL[r.disclosure_type] },
  { header: "Severity", accessor: (r) => DISCLOSURE_SEVERITY_LABEL[r.disclosure_severity] },
  { header: "Heard By", accessor: (r) => getStaffName(r.heard_by) },
  { header: "Location", accessor: (r) => r.location },
  { header: "Questions Asked", accessor: (r) => QUESTIONS_ASKED_LABEL[r.questions_asked] },
  { header: "DSL Reported", accessor: (r) => (r.reported_to_dsl ? "Yes" : "No") },
  { header: "Police Reported", accessor: (r) => (r.reported_to_police ? "Yes" : "No") },
  { header: "LADO Reported", accessor: (r) => (r.reported_to_lado ? "Yes" : "No") },
  { header: "Status", accessor: (r) => DISCLOSURE_STATUS_LABEL[r.status] },
];

// ── component ───────────────────────────────────────────────────────────────
export default function DisclosureLogPage() {
  const { data: res, isLoading } = useDisclosures();
  const records = useMemo(() => res?.data ?? [], [res]);

  const [filterYP, setFilterYP] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...records];
    if (filterYP !== "all") items = items.filter((r) => r.child_id === filterYP);
    if (filterType !== "all") items = items.filter((r) => r.disclosure_type === filterType);
    if (filterSeverity !== "all") items = items.filter((r) => r.disclosure_severity === filterSeverity);

    const severityOrder: Record<string, number> = { crisis: 0, high: 1, medium: 2, low: 3 };

    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.disclosure_date.localeCompare(a.disclosure_date);
        case "severity":
          return (severityOrder[a.disclosure_severity] ?? 4) - (severityOrder[b.disclosure_severity] ?? 4);
        case "child":
          return a.child_id.localeCompare(b.child_id);
        default:
          return 0;
      }
    });
    return items;
  }, [records, filterYP, filterType, filterSeverity, sortBy]);

  // ── stats ─────────────────────────────────────────────────────────────────
  const activeDisclosures = records.filter(
    (r) => r.status === "active_investigation" || r.status === "external_agency_leading",
  ).length;
  const policeReported = records.filter((r) => r.reported_to_police).length;
  const externalAgencies = records.filter((r) => r.referrals_made.length > 0).length;

  if (isLoading) {
    return (
      <PageShell title="Disclosure Log" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Disclosure Log"
      subtitle="Safeguarding disclosures by children — what was said, the context, and how staff responded"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="disclosure-log" />
          <PrintButton title="Disclosure Log" />
        </div>
      }
    >
      {/* ── confidentiality banner ────────────────────────────────────── */}
      <div className="rounded-lg bg-red-50 border-2 border-red-300 p-4 mb-6 flex items-start gap-3">
        <Lock className="h-5 w-5 text-red-700 mt-0.5 shrink-0" />
        <div className="text-sm text-red-900 space-y-1">
          <p className="font-semibold">Strictly Confidential — Sensitive Content</p>
          <p>
            This log contains anonymised summaries of safeguarding disclosures made by children. Detail is
            recorded sensitively, on a need-to-know basis, and the child&apos;s actual words are preserved only
            where it supports their voice and the safeguarding response. Full case detail is held in secure
            records shared only with the allocated social worker, DSL, and statutory agencies. Children are
            informed about who knows what, in age-appropriate terms.
          </p>
        </div>
      </div>

      {/* ── summary stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{activeDisclosures}</p>
          <p className="text-xs text-muted-foreground">Active Disclosures</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{records.length}</p>
          <p className="text-xs text-muted-foreground">Total Recorded</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{policeReported}</p>
          <p className="text-xs text-muted-foreground">Police-Reported</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{externalAgencies}</p>
          <p className="text-xs text-muted-foreground">External Agencies Involved</p>
        </div>
      </div>

      {/* ── practice reminder banner ──────────────────────────────────── */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-6 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          <strong>Practice reminder:</strong> Listen, do not lead. Believe the child. Record verbatim as soon as
          possible. Tell the DSL. Keep the child informed in age-appropriate terms. Never promise confidentiality
          you cannot keep.
        </p>
      </div>

      {/* ── filters/sort ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Children" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            {[...new Set(records.map((r) => r.child_id))].map((id) => (
              <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(DISCLOSURE_TYPE_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Severities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            {Object.entries(DISCLOSURE_SEVERITY_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="severity">By Severity</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── disclosure cards ──────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No disclosures match your filters.</div>
        )}
        {filtered.map((rec) => {
          const isExpanded = expandedId === rec.id;

          return (
            <div key={rec.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : rec.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Ear className="h-5 w-5 text-red-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {DISCLOSURE_TYPE_LABEL[rec.disclosure_type]} &middot; {getYPName(rec.child_id)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {rec.disclosure_date} {rec.disclosure_time} &middot; {rec.location.split(" — ")[0]} &middot;
                      Heard by {getStaffName(rec.heard_by)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      severityColour[rec.disclosure_severity],
                    )}
                  >
                    {DISCLOSURE_SEVERITY_LABEL[rec.disclosure_severity]}
                  </span>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium hidden sm:inline-block",
                      statusColour[rec.status],
                    )}
                  >
                    {DISCLOSURE_STATUS_LABEL[rec.status]}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {/* context */}
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <Eye className="h-3 w-3 inline mr-1" />
                      Context of Disclosure
                    </p>
                    <p className="text-sm">{rec.context_of_disclosure}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Location: {rec.location} &middot; Time: {rec.disclosure_time}
                    </p>
                  </div>

                  {/* what child said */}
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-1">
                      <MessageCircle className="h-3 w-3 inline mr-1" />
                      Child&apos;s Own Words (recorded with sensitivity)
                    </p>
                    <p className="text-sm italic text-blue-900">{rec.child_words_used}</p>
                    <p className="text-xs text-blue-800 mt-2">
                      <strong>Anonymised summary:</strong> {rec.disclosure_summary}
                    </p>
                  </div>

                  {/* staff response */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Staff Response at the Time
                      </p>
                      <p className="text-sm">{rec.staff_response_at_time}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <Heart className="h-3 w-3 inline mr-1" />
                        Reassurance Given
                      </p>
                      <p className="text-sm">{rec.reassurance_given}</p>
                    </div>
                  </div>

                  {/* questions / severity / type chips */}
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium",
                        questionsColour[rec.questions_asked],
                      )}
                    >
                      Questions: {QUESTIONS_ASKED_LABEL[rec.questions_asked]}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                      Type: {DISCLOSURE_TYPE_LABEL[rec.disclosure_type]}
                    </span>
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium",
                        severityColour[rec.disclosure_severity],
                      )}
                    >
                      Severity: {DISCLOSURE_SEVERITY_LABEL[rec.disclosure_severity]}
                    </span>
                  </div>

                  {/* immediate actions */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Immediate Actions Taken
                    </p>
                    <ul className="space-y-1">
                      {rec.immediate_actions_taken.map((a, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* reporting */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div
                      className={cn(
                        "rounded-lg p-2 text-center text-xs border",
                        rec.reported_to_dsl ? "bg-green-50 border-green-200" : "bg-slate-50",
                      )}
                    >
                      <Shield className="h-4 w-4 mx-auto mb-1" />
                      <p className="font-medium">DSL</p>
                      <p className="text-muted-foreground">
                        {rec.reported_to_dsl ? rec.reported_to_dsl_date : "—"}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "rounded-lg p-2 text-center text-xs border",
                        rec.reported_to_police ? "bg-purple-50 border-purple-200" : "bg-slate-50",
                      )}
                    >
                      <Phone className="h-4 w-4 mx-auto mb-1" />
                      <p className="font-medium">Police</p>
                      <p className="text-muted-foreground">{rec.reported_to_police ? "Reported" : "—"}</p>
                    </div>
                    <div
                      className={cn(
                        "rounded-lg p-2 text-center text-xs border",
                        rec.reported_to_lado ? "bg-amber-50 border-amber-200" : "bg-slate-50",
                      )}
                    >
                      <FileText className="h-4 w-4 mx-auto mb-1" />
                      <p className="font-medium">LADO</p>
                      <p className="text-muted-foreground">{rec.reported_to_lado ? "Reported" : "—"}</p>
                    </div>
                    <div
                      className={cn(
                        "rounded-lg p-2 text-center text-xs border",
                        rec.child_informed_of_actions ? "bg-blue-50 border-blue-200" : "bg-slate-50",
                      )}
                    >
                      <MessageCircle className="h-4 w-4 mx-auto mb-1" />
                      <p className="font-medium">Child Informed</p>
                      <p className="text-muted-foreground">
                        {rec.child_informed_of_actions ? "Yes" : "—"}
                      </p>
                    </div>
                  </div>

                  {/* referrals */}
                  {rec.referrals_made.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Referrals Made
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {rec.referrals_made.map((r, i) => (
                          <span
                            key={i}
                            className="text-xs bg-purple-50 text-purple-800 px-2 py-1 rounded-full"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* child agency */}
                  <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                    <p className="text-xs font-semibold text-green-900 uppercase tracking-wide mb-1">
                      <Heart className="h-3 w-3 inline mr-1" />
                      Child&apos;s Voice &amp; Agency
                    </p>
                    <p className="text-sm text-green-900">{rec.child_given_agency}</p>
                  </div>

                  {/* support */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Support Provided to Child
                    </p>
                    <ul className="space-y-1">
                      {rec.support_provided_to_child.map((s, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Heart className="h-3 w-3 text-pink-500 mt-1 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* parallel process / staff debrief */}
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Staff Debrief &amp; Parallel Process
                    </p>
                    <p className="text-sm">{rec.parallel_process_noted}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Formal debrief held: {rec.staff_debrief ? "Yes" : "No"}
                    </p>
                  </div>

                  {/* metadata */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>
                      <Clock className="h-3 w-3 inline mr-1" />
                      Recorded: {rec.disclosure_date} {rec.disclosure_time}
                    </span>
                    <span>Heard by: {getStaffName(rec.heard_by)}</span>
                    <span>Status: {DISCLOSURE_STATUS_LABEL[rec.status]}</span>
                  </div>

                  {/* smart link panel */}
                  <SmartLinkPanel sourceType="disclosures" sourceId={rec.id} childId={rec.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Disclosure recording supports Working Together to Safeguard
          Children 2023, Children&apos;s Homes (England) Regulations 2015 Quality Standard 5 (protection of
          children), and Keeping Children Safe in Education principles for safeguarding response. Records
          capture the child&apos;s voice verbatim where appropriate, the staff response, the actions taken, and
          how the child was kept informed and given agency throughout. Detail is shared on a need-to-know basis
          with the DSL, allocated social worker, and statutory agencies only.
        </p>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
