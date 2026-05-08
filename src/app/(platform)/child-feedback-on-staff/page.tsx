"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Heart,
  MessageCircle,
  Star,
  Lock,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ChildStaffFeedback } from "@/types/extended";
import type { StaffFeedbackSentiment } from "@/types/extended";
import {
  STAFF_FEEDBACK_ATTRIBUTION_LABEL,
  STAFF_FEEDBACK_CHANNEL_LABEL,
  STAFF_FEEDBACK_SENTIMENT_LABEL,
  STAFF_FEEDBACK_TOPIC_LABEL,
} from "@/types/extended";
import { useChildStaffFeedback } from "@/hooks/use-child-staff-feedback";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";

const sentimentColour: Record<StaffFeedbackSentiment, string> = {
  positive: "bg-green-100 text-green-800",
  mixed: "bg-blue-100 text-blue-800",
  constructive: "bg-amber-100 text-amber-800",
  concern: "bg-red-100 text-red-800",
};

const exportCols: ExportColumn<ChildStaffFeedback>[] = [
  { header: "Date", accessor: (r: ChildStaffFeedback) => r.feedback_date },
  { header: "Child", accessor: (r: ChildStaffFeedback) => getYPName(r.child_id) },
  { header: "Attribution", accessor: (r: ChildStaffFeedback) => STAFF_FEEDBACK_ATTRIBUTION_LABEL[r.attribution] },
  { header: "Subject", accessor: (r: ChildStaffFeedback) => r.staff_subject.startsWith("staff_") ? getStaffName(r.staff_subject) : r.staff_subject },
  { header: "Topic", accessor: (r: ChildStaffFeedback) => STAFF_FEEDBACK_TOPIC_LABEL[r.feedback_topic] },
  { header: "Sentiment", accessor: (r: ChildStaffFeedback) => STAFF_FEEDBACK_SENTIMENT_LABEL[r.feedback_sentiment] },
  { header: "Channel", accessor: (r: ChildStaffFeedback) => STAFF_FEEDBACK_CHANNEL_LABEL[r.channel] },
  { header: "Staff Informed", accessor: (r: ChildStaffFeedback) => r.staff_member_informed ? "Yes" : "No" },
];

export default function ChildFeedbackOnStaffPage() {
  const { data: res, isLoading } = useChildStaffFeedback();
  const items = res?.data ?? [];

  const [filterSentiment, setFilterSentiment] = useState("all");
  const [filterChild, setFilterChild] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...items];
    if (filterSentiment !== "all") list = list.filter((r) => r.feedback_sentiment === filterSentiment);
    if (filterChild !== "all") list = list.filter((r) => r.child_id === filterChild);
    list.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.feedback_date.localeCompare(a.feedback_date);
        case "sentiment":
          return a.feedback_sentiment.localeCompare(b.feedback_sentiment);
        default:
          return 0;
      }
    });
    return list;
  }, [items, filterSentiment, filterChild, sortBy]);

  if (isLoading) {
    return (
      <PageShell
        title="Child Feedback on Staff"
        subtitle="Children's voice about individual staff — celebrated, addressed, never dismissed"
      >
        <p>Loading…</p>
      </PageShell>
    );
  }

  const total = items.length;
  const positive = items.filter((r) => r.feedback_sentiment === "positive").length;
  const constructive = items.filter((r) => r.feedback_sentiment === "constructive").length;
  const allInformed = items.every((r) => r.staff_member_informed);

  return (
    <PageShell
      title="Child Feedback on Staff"
      subtitle="Children's voice about individual staff — celebrated, addressed, never dismissed"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={items} columns={exportCols} filename="child-feedback-on-staff" />
          <PrintButton title="Child Feedback on Staff" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Feedback Records</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{positive}</p>
          <p className="text-xs text-muted-foreground">Positive</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{constructive}</p>
          <p className="text-xs text-muted-foreground">Constructive</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{allInformed ? "100%" : `${items.filter((r) => r.staff_member_informed).length}/${total}`}</p>
          <p className="text-xs text-muted-foreground">Staff Informed</p>
        </div>
      </div>

      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 mb-6 flex items-start gap-2">
        <Lock className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
        <p className="text-sm text-purple-800">
          Children must be able to give feedback about staff freely — including critical feedback —
          without fear. Anonymous channels exist. Children control attribution. Retaliation is never
          tolerated. Positive feedback is celebrated; constructive feedback is addressed.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterChild} onValueChange={setFilterChild}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSentiment} onValueChange={setFilterSentiment}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Sentiments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sentiments</SelectItem>
            <SelectItem value="positive">{STAFF_FEEDBACK_SENTIMENT_LABEL.positive}</SelectItem>
            <SelectItem value="mixed">{STAFF_FEEDBACK_SENTIMENT_LABEL.mixed}</SelectItem>
            <SelectItem value="constructive">{STAFF_FEEDBACK_SENTIMENT_LABEL.constructive}</SelectItem>
            <SelectItem value="concern">{STAFF_FEEDBACK_SENTIMENT_LABEL.concern}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="sentiment">By Sentiment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isExpanded = expandedId === r.id;

          return (
            <div key={r.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Heart className="h-5 w-5 text-purple-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(r.child_id)} on {r.staff_subject.startsWith("staff_") ? getStaffName(r.staff_subject) : r.staff_subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.feedback_date} &middot; {STAFF_FEEDBACK_CHANNEL_LABEL[r.channel]} &middot; {STAFF_FEEDBACK_TOPIC_LABEL[r.feedback_topic]} &middot; {STAFF_FEEDBACK_ATTRIBUTION_LABEL[r.attribution]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", sentimentColour[r.feedback_sentiment])}>
                    {STAFF_FEEDBACK_SENTIMENT_LABEL[r.feedback_sentiment]}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                      <MessageCircle className="h-3 w-3 inline mr-1" />Child&apos;s Words
                    </p>
                    <p className="text-sm italic">&ldquo;{r.child_words}&rdquo;</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Context</p>
                    <p className="text-sm">{r.context_of_feedback}</p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                      <Sparkles className="h-3 w-3 inline mr-1" />Staff Response
                    </p>
                    <p className="text-sm italic">&ldquo;{r.staff_response}&rdquo;</p>
                  </div>

                  {r.manager_actions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Manager Actions</p>
                      <ul className="space-y-1">
                        {r.manager_actions.map((a, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Star className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">Child Wishes For Response</p>
                    <p className="text-sm">{r.child_wishes_for_response}</p>
                  </div>

                  {r.pattern_indicator && (
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Pattern Indicator</p>
                      <p className="text-sm">{r.pattern_indicator}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Lock className="h-3 w-3 inline mr-1" />Attribution: {STAFF_FEEDBACK_ATTRIBUTION_LABEL[r.attribution]}</span>
                    <span>Recorded: {getStaffName(r.recorded_by)}</span>
                    {r.protected_from_retaliation && <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">Anti-Retaliation Protected</span>}
                    {r.staff_member_informed && <span>Staff informed: {r.staff_member_informed_date}</span>}
                  </div>

                  {r.feedback_sentiment === "concern" && (
                    <div className="bg-red-50 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-sm">Concern logged — see manager actions and follow-up.</p>
                    </div>
                  )}

                  <SmartLinkPanel sourceType="child-staff-feedback" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Feedback on staff supports UNCRC Article 12 (right to be
          heard about all matters affecting them), Quality Standard 1 (child-centred care), and Quality
          Standard 13 (leadership and management). Anti-retaliation principle is absolute. Linked to
          Staff Recognition Log, Voice of Child, Reg 44 visits, and Children&apos;s Pledges.
        </p>
      </div>
    </PageShell>
  );
}
