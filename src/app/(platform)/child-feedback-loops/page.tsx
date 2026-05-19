"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  MessageCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  Heart,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ChildFeedbackLoop } from "@/types/extended";
import {
  FEEDBACK_LOOP_CHANNEL_LABEL,
  FEEDBACK_LOOP_TYPE_LABEL,
  FEEDBACK_DECISION_LABEL,
} from "@/types/extended";
import type { FeedbackDecision } from "@/types/extended";
import { useChildFeedbackLoops } from "@/hooks/use-child-feedback-loops";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

const decisionColour: Record<string, string> = {
  acted_on_in_full: "bg-green-100 text-green-800",
  acted_on_in_part: "bg-blue-100 text-blue-800",
  discussed_and_explored: "bg-purple-100 text-purple-800",
  cannot_do_explained: "bg-amber-100 text-amber-800",
  pending_consideration: "bg-slate-100 text-[var(--cs-navy)]",
};

const exportCols: ExportColumn<ChildFeedbackLoop>[] = [
  { header: "Child", accessor: (r: ChildFeedbackLoop) => getYPName(r.child_id) },
  { header: "Date", accessor: (r: ChildFeedbackLoop) => r.feedback_date },
  { header: "Topic", accessor: (r: ChildFeedbackLoop) => r.feedback_topic },
  { header: "Channel", accessor: (r: ChildFeedbackLoop) => FEEDBACK_LOOP_CHANNEL_LABEL[r.feedback_channel] },
  { header: "Type", accessor: (r: ChildFeedbackLoop) => FEEDBACK_LOOP_TYPE_LABEL[r.feedback_type] },
  { header: "Decision", accessor: (r: ChildFeedbackLoop) => FEEDBACK_DECISION_LABEL[r.decision_made] },
  { header: "Days to Close", accessor: (r: ChildFeedbackLoop) => String(r.duration_days_to_close) },
  { header: "Child Accepts", accessor: (r: ChildFeedbackLoop) => r.child_accepts ? "Yes" : "No" },
];

export default function ChildFeedbackLoopsPage() {
  const { data: res, isLoading } = useChildFeedbackLoops();
  const items = res?.data ?? [];

  const [filterYP, setFilterYP] = useState("all");
  const [filterDecision, setFilterDecision] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...items];
    if (filterYP !== "all") list = list.filter((f) => f.child_id === filterYP);
    if (filterDecision !== "all") list = list.filter((f) => f.decision_made === filterDecision);
    list.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.feedback_date.localeCompare(a.feedback_date);
        case "duration":
          return a.duration_days_to_close - b.duration_days_to_close;
        case "child":
          return a.child_id.localeCompare(b.child_id);
        default:
          return 0;
      }
    });
    return list;
  }, [items, filterYP, filterDecision, sortBy]);

  if (isLoading) {
    return <PageShell title="Child Feedback Loops" subtitle="Closing the loop on feedback children give — from raised to acknowledged to acted on to communicated back"><p>Loading…</p></PageShell>;
  }

  const total = items.length;
  const actedOn = items.filter((f) => f.decision_made === "acted_on_in_full" || f.decision_made === "acted_on_in_part").length;
  const childAccepts = items.filter((f) => f.child_accepts).length;
  const avgDays = total > 0 ? Math.round(items.reduce((sum, f) => sum + f.duration_days_to_close, 0) / total) : 0;

  return (
    <PageShell
      title="Child Feedback Loops"
      subtitle="Closing the loop on feedback children give — from raised to acknowledged to acted on to communicated back"
      ariaContext={{ pageTitle: "Child Feedback Loops", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={items} columns={exportCols} filename="child-feedback-loops" />
          <PrintButton title="Child Feedback Loops" />
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Feedback Loops</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{total > 0 ? Math.round((actedOn / total) * 100) : 0}%</p>
          <p className="text-xs text-muted-foreground">Acted On</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{childAccepts}/{total}</p>
          <p className="text-xs text-muted-foreground">Child Accepts Outcome</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{avgDays}d</p>
          <p className="text-xs text-muted-foreground">Avg Days to Close</p>
        </div>
      </div>

      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 mb-6 flex items-start gap-2">
        <RefreshCw className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
        <p className="text-sm text-emerald-800">
          Listening is necessary but insufficient. Closing the loop — telling children what we did, why,
          and how their voice changed something — is what makes participation real. We track every loop:
          when raised, when considered, when decided, when fed back.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterDecision} onValueChange={setFilterDecision}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Decisions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Decisions</SelectItem>
            <SelectItem value="acted_on_in_full">{FEEDBACK_DECISION_LABEL.acted_on_in_full}</SelectItem>
            <SelectItem value="acted_on_in_part">{FEEDBACK_DECISION_LABEL.acted_on_in_part}</SelectItem>
            <SelectItem value="discussed_and_explored">{FEEDBACK_DECISION_LABEL.discussed_and_explored}</SelectItem>
            <SelectItem value="cannot_do_explained">{FEEDBACK_DECISION_LABEL.cannot_do_explained}</SelectItem>
            <SelectItem value="pending_consideration">{FEEDBACK_DECISION_LABEL.pending_consideration}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="duration">Fastest Close</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((f) => {
          const isExpanded = expandedId === f.id;

          return (
            <div key={f.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : f.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <MessageCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{f.feedback_topic}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getYPName(f.child_id)} &middot; {f.feedback_date} &middot; {FEEDBACK_LOOP_CHANNEL_LABEL[f.feedback_channel]} &middot; {f.duration_days_to_close}d to close
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", decisionColour[f.decision_made])}>
                    {FEEDBACK_DECISION_LABEL[f.decision_made]}
                  </span>
                  {f.child_accepts && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Child&apos;s Words</p>
                    <p className="text-sm italic">&ldquo;{f.child_words}&rdquo;</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Decision Rationale</p>
                    <p className="text-sm">{f.decision_rationale}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Actions Taken</p>
                    <ul className="space-y-1">
                      {f.actions_taken.map((a, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">
                      <RefreshCw className="h-3 w-3 inline mr-1" />Loop Closed With Child
                    </p>
                    <p className="text-sm"><strong>When:</strong> {f.when_child_was_told}</p>
                    <p className="text-sm mt-1"><strong>How:</strong> {f.how_child_was_told}</p>
                  </div>

                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">
                      <Heart className="h-3 w-3 inline mr-1" />Child&apos;s Response To Outcome
                    </p>
                    <p className="text-sm italic">&ldquo;{f.child_response_to_outcome}&rdquo;</p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Visible Change</p>
                    <p className="text-sm">{f.visible_change}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><MessageCircle className="h-3 w-3 inline mr-1" />Type: {FEEDBACK_LOOP_TYPE_LABEL[f.feedback_type]}</span>
                    <span><Clock className="h-3 w-3 inline mr-1" />{f.duration_days_to_close} days to close</span>
                    <span>Decided by: {getStaffName(f.decision_maker)}</span>
                    <span>Recorded: {getStaffName(f.recorded_by)}</span>
                    {f.child_accepts && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Child Accepts</span>}
                    {!f.child_accepts && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">Child Disagrees — Continuing Dialogue</span>}
                  </div>

                  {!f.child_accepts && (
                    <div className="bg-amber-50 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-sm">Child does not yet accept the outcome. Open dialogue continues. Follow-up scheduled for {f.follow_up_date}.</p>
                    </div>
                  )}

                  <SmartLinkPanel sourceType="child-feedback-loop" sourceId={f.id} childId={f.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Feedback loops support UNCRC Article 12 (right to be heard
          AND be taken seriously), Quality Standard 1 (child-centred care), and the Lundy model of
          participation (space, voice, audience, influence). Linked to Children&apos;s Pledges, Voice of
          Child, and Children&apos;s Meetings.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Wellbeing"
        category="wellbeing"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Child Feedback Loops — children's views on placement, staff, home, services, complaints resolved, wishes and feelings, participation, review feedback, statutory voice"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
