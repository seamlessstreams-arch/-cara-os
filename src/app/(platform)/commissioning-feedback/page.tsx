"use client";

import { useState, useMemo } from "react";
import {
  Building2, Star, ArrowUpDown, Filter, Search,
  AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  ThumbsUp, MessageSquare, ClipboardCheck,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import type { CommissioningFeedbackRecord, CommissioningFeedbackType } from "@/types/extended";
import { COMMISSIONING_FEEDBACK_TYPE_LABEL } from "@/types/extended";
import { useCommissioningFeedbackRecords } from "@/hooks/use-commissioning-feedback-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── colour map ─────────────────────────────────────────────────────── */
const TYPE_COLORS: Record<CommissioningFeedbackType, string> = {
  annual_review: "bg-blue-100 text-blue-800",
  placement_update: "bg-slate-100 text-slate-800",
  quality_concern: "bg-red-100 text-red-800",
  compliment: "bg-green-100 text-green-800",
  statutory_visit: "bg-purple-100 text-purple-800",
};

/* ── component ───────────────────────────────────────────────────────── */
export default function CommissioningFeedbackPage() {
  const { data: res, isLoading } = useCommissioningFeedbackRecords();
  const entries = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterLA, setFilterLA] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const localAuthorities = useMemo(
    () => Array.from(new Set(entries.map((e) => e.local_authority))).sort(),
    [entries],
  );

  const filtered = useMemo(() => {
    let list = [...entries];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.commissioner.toLowerCase().includes(q) ||
          e.local_authority.toLowerCase().includes(q) ||
          e.specific_comments.toLowerCase().includes(q),
      );
    }
    if (filterType !== "all") list = list.filter((e) => e.feedback_type === filterType);
    if (filterLA !== "all") list = list.filter((e) => e.local_authority === filterLA);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date_received.localeCompare(a.date_received);
        case "rating":
          return b.overall_rating - a.overall_rating;
        case "la":
          return a.local_authority.localeCompare(b.local_authority);
        case "type":
          return a.feedback_type.localeCompare(b.feedback_type);
        default:
          return 0;
      }
    });
    return list;
  }, [entries, search, filterType, filterLA, sortBy]);

  /* stats */
  const avgRating =
    entries.length === 0
      ? 0
      : entries.reduce((sum, e) => sum + e.overall_rating, 0) / entries.length;
  const compliments = entries.filter((e) => e.feedback_type === "compliment").length;
  const concernsToResolve = entries.filter(
    (e) => e.response_required && !e.response_date,
  ).length;
  const lasEngaged = localAuthorities.length;

  const exportCols: ExportColumn<CommissioningFeedbackRecord>[] = [
    { header: "ID", accessor: (r) => r.id },
    { header: "Date Received", accessor: (r) => r.date_received },
    { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
    { header: "Local Authority", accessor: (r) => r.local_authority },
    { header: "Commissioner", accessor: (r) => r.commissioner },
    { header: "Feedback Type", accessor: (r) => COMMISSIONING_FEEDBACK_TYPE_LABEL[r.feedback_type] },
    { header: "Overall Rating", accessor: (r) => `${r.overall_rating}/5` },
    { header: "Strengths", accessor: (r) => r.strengths.join("; ") },
    { header: "Areas for Development", accessor: (r) => r.areas_for_development.join("; ") },
    { header: "Specific Comments", accessor: (r) => r.specific_comments },
    { header: "Response Required", accessor: (r) => (r.response_required ? "Yes" : "No") },
    { header: "Response Date", accessor: (r) => r.response_date || "Pending" },
    { header: "Response Given By", accessor: (r) => (r.response_given_by ? getStaffName(r.response_given_by) : "") },
    { header: "Response Summary", accessor: (r) => r.response_summary },
    { header: "Next Review Date", accessor: (r) => r.next_review_date },
  ];

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "h-4 w-4",
            n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300",
          )}
        />
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <PageShell
        title="Commissioning Feedback"
        subtitle="Feedback from placing local authorities on placement quality, communication, and outcomes"
      >
        <div />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Commissioning Feedback"
      subtitle="Feedback from placing local authorities on placement quality, communication, and outcomes"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Commissioning Feedback" />
          <ExportButton data={filtered} columns={exportCols} filename="commissioning-feedback" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Average Rating",
              value: avgRating.toFixed(1) + " / 5",
              icon: Star,
              colour: "text-amber-500",
            },
            {
              label: "Compliments Received",
              value: compliments,
              icon: ThumbsUp,
              colour: "text-green-600",
            },
            {
              label: "Concerns to Resolve",
              value: concernsToResolve,
              icon: AlertTriangle,
              colour: concernsToResolve > 0 ? "text-red-600" : "text-slate-400",
            },
            {
              label: "LAs Engaged",
              value: lasEngaged,
              icon: Building2,
              colour: "text-blue-600",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border bg-white p-4 flex items-center gap-3"
            >
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── alerts ────────────────────────────────────────────── */}
        {concernsToResolve > 0 && (
          <div className="rounded-lg border-l-4 border-red-400 bg-red-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800">
                <strong>{concernsToResolve}</strong> commissioner feedback item(s)
                require a formal response. Track and clear within agreed timescales
                to maintain commissioning relationships.
              </p>
            </div>
          </div>
        )}

        {/* ── filters ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search commissioner, LA, comments…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {(Object.entries(COMMISSIONING_FEEDBACK_TYPE_LABEL) as [CommissioningFeedbackType, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={filterLA} onValueChange={setFilterLA}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Local Authorities</SelectItem>
              {localAuthorities.map((la) => (
                <SelectItem key={la} value={la}>{la}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Recent)</SelectItem>
                <SelectItem value="rating">Rating (High–Low)</SelectItem>
                <SelectItem value="la">Local Authority</SelectItem>
                <SelectItem value="type">Feedback Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── list ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No commissioning feedback matches your filters.
            </div>
          )}
          {filtered.map((entry) => {
            const isExpanded = expandedId === entry.id;
            const unresolved = entry.response_required && !entry.response_date;
            return (
              <div
                key={entry.id}
                className={cn(
                  "rounded-xl border bg-white overflow-hidden",
                  unresolved && "border-red-300 ring-1 ring-red-200",
                )}
              >
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Building2 className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {entry.local_authority}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {entry.date_received} · {entry.commissioner} · Re: {getYPName(entry.child_id)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {unresolved && (
                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                        Response due
                      </Badge>
                    )}
                    {renderStars(entry.overall_rating)}
                    <Badge className={cn("text-xs", TYPE_COLORS[entry.feedback_type])}>
                      {COMMISSIONING_FEEDBACK_TYPE_LABEL[entry.feedback_type]}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* meta */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Young Person</p>
                        <p className="font-medium">{getYPName(entry.child_id)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Commissioner</p>
                        <p className="font-medium">{entry.commissioner}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Date Received</p>
                        <p className="font-medium">{entry.date_received}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Next Review</p>
                        <p className="font-medium">{entry.next_review_date}</p>
                      </div>
                    </div>

                    {/* comments */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">
                        Specific Comments
                      </p>
                      <p className="text-sm">{entry.specific_comments}</p>
                    </div>

                    {/* strengths */}
                    {entry.strengths.length > 0 && (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <div className="flex items-center gap-1 mb-2">
                          <ThumbsUp className="h-4 w-4 text-green-700" />
                          <p className="text-xs font-medium text-green-800">Strengths</p>
                        </div>
                        <ul className="text-sm list-disc pl-5 space-y-1">
                          {entry.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* development */}
                    {entry.areas_for_development.length > 0 && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <div className="flex items-center gap-1 mb-2">
                          <ClipboardCheck className="h-4 w-4 text-amber-700" />
                          <p className="text-xs font-medium text-amber-800">
                            Areas for Development
                          </p>
                        </div>
                        <ul className="text-sm list-disc pl-5 space-y-1">
                          {entry.areas_for_development.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* response */}
                    <div
                      className={cn(
                        "rounded-lg border p-3",
                        unresolved
                          ? "bg-red-50 border-red-200"
                          : "bg-blue-50 border-blue-200",
                      )}
                    >
                      <div className="flex items-center gap-1 mb-2">
                        {unresolved ? (
                          <AlertTriangle className="h-4 w-4 text-red-700" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-blue-700" />
                        )}
                        <p
                          className={cn(
                            "text-xs font-medium",
                            unresolved ? "text-red-800" : "text-blue-800",
                          )}
                        >
                          Provider Response
                        </p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-2">
                        <div>
                          <span className="text-muted-foreground">Required:</span>{" "}
                          <span className="font-medium">
                            {entry.response_required ? "Yes" : "No"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Given By:</span>{" "}
                          <span className="font-medium">
                            {entry.response_given_by
                              ? getStaffName(entry.response_given_by)
                              : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date:</span>{" "}
                          <span
                            className={cn(
                              "font-medium",
                              unresolved ? "text-red-700" : "",
                            )}
                          >
                            {entry.response_date || "Pending"}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm">
                        {entry.response_summary || (
                          <span className="italic text-muted-foreground">
                            No response recorded yet.
                          </span>
                        )}
                      </p>
                    </div>

                    {/* smart links */}
                    <SmartLinkPanel sourceType="commissioning-feedback" sourceId={entry.id} childId={entry.child_id} compact />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <div className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              <strong>Quality Standard 13 &amp; Reg 45:</strong> Feedback from placing
              local authorities is a key indicator of placement quality and leadership
              effectiveness. All commissioner concerns must receive a formal written
              response within agreed timescales, and themes must inform the Reg 45
              quality of care review and Statement of Purpose updates.
            </p>
          </div>
        </div>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
