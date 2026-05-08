"use client";

import { useState, useMemo } from "react";
import {
  MessageSquare, Search, ArrowUpDown, Filter, Users, Home,
  AlertCircle, ThumbsUp, ChevronDown, ChevronUp, Building2,
  Sparkles, MapPin, ShieldCheck,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import type {
  CommunityFeedbackRecord,
  CommunityFeedbackSource,
  CommunityFeedbackType,
} from "@/types/extended";
import {
  COMMUNITY_FEEDBACK_SOURCE_LABEL,
  COMMUNITY_FEEDBACK_TYPE_LABEL,
} from "@/types/extended";
import { useCommunityFeedbackRecords } from "@/hooks/use-community-feedback-records";

/* ── local lookup maps ──────────────────────────────────────────────── */
const TYPE_COLOURS: Record<CommunityFeedbackType, string> = {
  compliment: "bg-green-100 text-green-800",
  concern: "bg-amber-100 text-amber-800",
  suggestion: "bg-blue-100 text-blue-800",
  question: "bg-slate-100 text-slate-800",
  complaint: "bg-red-100 text-red-800",
  recognition: "bg-purple-100 text-purple-800",
};

const SOURCE_ICON: Record<CommunityFeedbackSource, typeof Home> = {
  neighbour: Home,
  local_business: Building2,
  member_of_public: Users,
  local_councillor: ShieldCheck,
  police_community_team: ShieldCheck,
  place_of_worship: MapPin,
  school: Building2,
  anonymous: MessageSquare,
};

/* ── component ───────────────────────────────────────────────────────── */
export default function CommunityFeedbackPage() {
  const { data, isLoading } = useCommunityFeedbackRecords();
  const records = data?.data ?? [];

  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.summary.toLowerCase().includes(q) ||
          r.full_description.toLowerCase().includes(q) ||
          r.source_contact.toLowerCase().includes(q),
      );
    }
    if (filterSource !== "all") list = list.filter((r) => r.source === filterSource);
    if (filterType !== "all") list = list.filter((r) => r.feedback_type === filterType);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date_received.localeCompare(a.date_received);
        case "source":
          return a.source.localeCompare(b.source);
        case "type":
          return a.feedback_type.localeCompare(b.feedback_type);
        default:
          return 0;
      }
    });
    return list;
  }, [records, search, filterSource, filterType, sortBy]);

  /* stats */
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().slice(0, 10);

  const thisQuarter = records.filter((r) => r.date_received >= ninetyDaysAgoStr).length;
  const compliments = records.filter(
    (r) => r.feedback_type === "compliment" || r.feedback_type === "recognition",
  ).length;
  const concernsResolved = records.filter(
    (r) =>
      (r.feedback_type === "concern" || r.feedback_type === "complaint") &&
      r.response_sent,
  ).length;
  const sourceDiversity = new Set(records.map((r) => r.source)).size;

  const exportCols: ExportColumn<CommunityFeedbackRecord>[] = [
    { header: "ID", accessor: (r: CommunityFeedbackRecord) => r.id },
    { header: "Date Received", accessor: (r: CommunityFeedbackRecord) => r.date_received },
    { header: "Source", accessor: (r: CommunityFeedbackRecord) => r.source },
    { header: "Source Contact", accessor: (r: CommunityFeedbackRecord) => r.source_contact },
    { header: "Feedback Type", accessor: (r: CommunityFeedbackRecord) => r.feedback_type },
    { header: "Summary", accessor: (r: CommunityFeedbackRecord) => r.summary },
    { header: "Full Description", accessor: (r: CommunityFeedbackRecord) => r.full_description },
    { header: "Received By", accessor: (r: CommunityFeedbackRecord) => getStaffName(r.received_by) },
    { header: "Response Required", accessor: (r: CommunityFeedbackRecord) => r.response_required ? "Yes" : "No" },
    { header: "Response Sent", accessor: (r: CommunityFeedbackRecord) => r.response_sent ? "Yes" : "No" },
    { header: "Response Date", accessor: (r: CommunityFeedbackRecord) => r.response_date },
    { header: "Response Summary", accessor: (r: CommunityFeedbackRecord) => r.response_summary },
    { header: "Escalated To", accessor: (r: CommunityFeedbackRecord) => r.escalated_to },
    { header: "Pattern Indicator", accessor: (r: CommunityFeedbackRecord) => r.pattern_indicator },
    { header: "Children Informed (Positive)", accessor: (r: CommunityFeedbackRecord) => r.children_informed_of_positive_feedback ? "Yes" : "No" },
    { header: "Policy/Practice Arising", accessor: (r: CommunityFeedbackRecord) => r.policy_or_practice_arising },
    { header: "Reviewed Date", accessor: (r: CommunityFeedbackRecord) => r.reviewed_date },
  ];

  if (isLoading) return <PageShell title="Community Feedback" subtitle="Voices from our neighbours, local businesses, and the wider community"><div /></PageShell>;

  return (
    <PageShell
      title="Community Feedback"
      subtitle="Voices from our neighbours, local businesses, and the wider community"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Community Feedback" />
          <ExportButton data={filtered} columns={exportCols} filename="community-feedback" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── community banner ──────────────────────────────────── */}
        <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="h-6 w-6 text-emerald-600 mt-0.5" />
            <div>
              <h2 className="text-base font-semibold text-emerald-900">
                Part of the local community
              </h2>
              <p className="text-sm text-emerald-800 mt-1">
                Our home isn&apos;t a building set apart — it&apos;s part of this street, this
                neighbourhood, this town. We listen carefully to our neighbours, local
                businesses, councillors and visitors. Their feedback helps us keep the home
                welcoming, accountable, and rooted in the everyday life of the community our
                children share.
              </p>
            </div>
          </div>
        </div>

        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "This Quarter", value: thisQuarter, icon: MessageSquare, colour: "text-blue-600" },
            { label: "Compliments", value: compliments, icon: ThumbsUp, colour: "text-green-600" },
            { label: "Concerns Resolved", value: concernsResolved, icon: ShieldCheck, colour: "text-emerald-600" },
            { label: "Source Diversity", value: sourceDiversity, icon: Users, colour: "text-purple-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── filters / sort ────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search feedback, contacts, descriptions…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {Object.entries(COMMUNITY_FEEDBACK_SOURCE_LABEL).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(COMMUNITY_FEEDBACK_TYPE_LABEL).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Recent)</SelectItem>
                <SelectItem value="source">Source</SelectItem>
                <SelectItem value="type">Feedback Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── list ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No community feedback matches your filters.
            </div>
          )}
          {filtered.map((r) => {
            const isExpanded = expandedId === r.id;
            const SourceIcon = SOURCE_ICON[r.source];
            const isPositive =
              r.feedback_type === "compliment" ||
              r.feedback_type === "recognition";
            const isNegative =
              r.feedback_type === "concern" || r.feedback_type === "complaint";

            return (
              <div key={r.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <SourceIcon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        isPositive
                          ? "text-emerald-600"
                          : isNegative
                          ? "text-amber-600"
                          : "text-blue-600",
                      )}
                    />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{r.summary}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {r.date_received} · {COMMUNITY_FEEDBACK_SOURCE_LABEL[r.source]} · {r.source_contact}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.response_required && !r.response_sent && (
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                        Response pending
                      </Badge>
                    )}
                    <Badge className={cn("text-xs", TYPE_COLOURS[r.feedback_type])}>
                      {COMMUNITY_FEEDBACK_TYPE_LABEL[r.feedback_type]}
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
                    {/* description */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">
                        Full Description
                      </p>
                      <p className="text-sm">{r.full_description}</p>
                    </div>

                    {/* response */}
                    {r.response_sent && r.response_summary && (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <p className="text-xs font-medium text-green-700 mb-1">
                          Our Response · {r.response_date}
                        </p>
                        <p className="text-sm">{r.response_summary}</p>
                      </div>
                    )}

                    {/* pattern + escalation */}
                    {(r.pattern_indicator || r.escalated_to) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {r.pattern_indicator && (
                          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                            <div className="flex items-center gap-1 mb-1">
                              <AlertCircle className="h-4 w-4 text-blue-600" />
                              <p className="text-xs font-medium text-blue-700">
                                Pattern / Theme
                              </p>
                            </div>
                            <p className="text-sm">{r.pattern_indicator}</p>
                          </div>
                        )}
                        {r.escalated_to && (
                          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                            <p className="text-xs font-medium text-amber-700 mb-1">
                              Escalated To
                            </p>
                            <p className="text-sm">{r.escalated_to}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* policy / practice */}
                    {r.policy_or_practice_arising && (
                      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
                        <p className="text-xs font-medium text-purple-700 mb-1">
                          Policy / Practice Arising
                        </p>
                        <p className="text-sm">{r.policy_or_practice_arising}</p>
                      </div>
                    )}

                    {/* meta */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Received By:</span>{" "}
                        <span className="font-medium">{getStaffName(r.received_by)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Response Required:</span>{" "}
                        <span className="font-medium">
                          {r.response_required ? "Yes" : "No"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Children Informed:</span>{" "}
                        <span
                          className={cn(
                            "font-medium",
                            r.children_informed_of_positive_feedback
                              ? "text-green-600"
                              : "text-slate-500",
                          )}
                        >
                          {isPositive
                            ? r.children_informed_of_positive_feedback
                              ? "Yes"
                              : "Not yet"
                            : "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reviewed:</span>{" "}
                        <span className="font-medium">{r.reviewed_date}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── regulatory note ───────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Quality Standard 13 (Leadership &amp; Management):</strong> Registered
          providers and managers must understand the views of the local community and
          ensure the home contributes positively to it. Community feedback — compliments,
          concerns and suggestions — must be recorded, responded to, reviewed for patterns,
          and used to inform practice. Positive feedback should be shared with children to
          support self-esteem and a sense of belonging.
        </div>
      </div>
    </PageShell>
  );
}
