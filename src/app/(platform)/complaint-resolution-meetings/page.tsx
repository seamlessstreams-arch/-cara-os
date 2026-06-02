"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { useResolutionMeetings } from "@/hooks/use-resolution-meetings";
import type { ResolutionMeeting } from "@/types/extended";
import {
  COMPLAINANT_TYPE_LABEL, MEETING_TYPE_LABEL, MEETING_FORMAT_LABEL,
  COMPLAINANT_SATISFACTION_LABEL, FOLLOW_UP_ACTION_STATUS_LABEL,
} from "@/types/extended";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  MessageCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  Heart,
  Users,
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

const meetingTypeColour: Record<string, string> = {
  stage_1_informal: "bg-green-100 text-green-800",
  stage_2_formal: "bg-amber-100 text-amber-800",
  stage_3_external_review: "bg-red-100 text-red-800",
  restorative: "bg-purple-100 text-purple-800",
  apology_meeting: "bg-blue-100 text-blue-800",
};

const satisfactionColour: Record<string, string> = {
  satisfied: "bg-green-100 text-green-800",
  partially_satisfied: "bg-amber-100 text-amber-800",
  not_satisfied: "bg-red-100 text-red-800",
};

const actionStatusColour: Record<string, string> = {
  done: "bg-green-100 text-green-800",
  in_progress: "bg-blue-100 text-blue-800",
  open: "bg-amber-100 text-amber-800",
};

const exportCols: ExportColumn<ResolutionMeeting>[] = [
  { header: "Date", accessor: (r) => r.date },
  { header: "Complainant", accessor: (r) => COMPLAINANT_TYPE_LABEL[r.complainant_type] },
  { header: "Meeting Type", accessor: (r) => MEETING_TYPE_LABEL[r.meeting_type] },
  { header: "Original Complaint", accessor: (r) => r.original_complaint_ref },
  { header: "Resolution Achieved", accessor: (r) => r.resolution_achieved ? "Yes" : "No" },
  { header: "Satisfaction", accessor: (r) => COMPLAINANT_SATISFACTION_LABEL[r.complainant_satisfaction] },
  { header: "Apology Offered", accessor: (r) => r.apology_offered ? "Yes" : "No" },
  { header: "Will Escalate", accessor: (r) => r.will_escalate ? "Yes" : "No" },
  { header: "Facilitator", accessor: (r) => getStaffName(r.facilitator) },
];

export default function ComplaintResolutionMeetingsPage() {
  const { data: res, isLoading } = useResolutionMeetings();
  const records = useMemo(() => res?.data ?? [], [res]);

  const [filterType, setFilterType] = useState("all");
  const [filterSatisfaction, setFilterSatisfaction] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...records];
    if (filterType !== "all") items = items.filter((m) => m.meeting_type === filterType);
    if (filterSatisfaction !== "all") items = items.filter((m) => m.complainant_satisfaction === filterSatisfaction);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "satisfaction":
          return a.complainant_satisfaction.localeCompare(b.complainant_satisfaction);
        case "type":
          return a.meeting_type.localeCompare(b.meeting_type);
        default:
          return 0;
      }
    });
    return items;
  }, [records, filterType, filterSatisfaction, sortBy]);

  const total = records.length;
  const resolved = records.filter((m) => m.resolution_achieved).length;
  const satisfied = records.filter((m) => m.complainant_satisfaction === "satisfied").length;
  const escalating = records.filter((m) => m.will_escalate).length;

  if (isLoading) {
    return (
      <PageShell title="Complaint Resolution Meetings" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--cs-text-muted)]" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Complaint Resolution Meetings"
      subtitle="Records of meetings convened to resolve concerns — restorative, transparent, learning-focused"
      ariaContext={{ pageTitle: "Complaint Resolution Meetings", sourceType: "complaint" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="complaint-resolution-meetings" />
          <PrintButton title="Complaint Resolution Meetings" />
          <AriaStudioQuickActionButton context={{ record_type: "complaint", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Total Meetings</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{total > 0 ? Math.round((resolved / total) * 100) : 0}%</p>
          <p className="text-xs text-muted-foreground">Resolution Rate</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{satisfied}/{total}</p>
          <p className="text-xs text-muted-foreground">Fully Satisfied</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", escalating > 0 ? "text-red-600" : "text-green-600")}>{escalating}</p>
          <p className="text-xs text-muted-foreground">Escalating</p>
        </div>
      </div>

      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 mb-6 flex items-start gap-2">
        <Heart className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
        <p className="text-sm text-purple-800">
          We approach complaints restoratively — apology where appropriate, listening always, learning every time.
          A complaint is the start of a better relationship, not a transaction to be closed.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Meeting Types</SelectItem>
            {Object.entries(MEETING_TYPE_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSatisfaction} onValueChange={setFilterSatisfaction}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Outcomes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Outcomes</SelectItem>
            {Object.entries(COMPLAINANT_SATISFACTION_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="satisfaction">By Outcome</SelectItem>
              <SelectItem value="type">By Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((m) => {
          const isExpanded = expandedId === m.id;

          return (
            <div key={m.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : m.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <MessageCircle className="h-5 w-5 text-purple-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{m.complaint_summary}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {m.date} &middot; {COMPLAINANT_TYPE_LABEL[m.complainant_type]} &middot; Ref: {m.original_complaint_ref} &middot; {m.duration_minutes}min
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", meetingTypeColour[m.meeting_type])}>
                    {MEETING_TYPE_LABEL[m.meeting_type]}
                  </span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", satisfactionColour[m.complainant_satisfaction])}>
                    {COMPLAINANT_SATISFACTION_LABEL[m.complainant_satisfaction]}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Meeting Details</p>
                      <p className="text-sm">Format: {MEETING_FORMAT_LABEL[m.meeting_format]}</p>
                      <p className="text-sm">Facilitator: {getStaffName(m.facilitator)}</p>
                      <p className="text-sm">Duration: {m.duration_minutes} minutes</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Attendees</p>
                      <p className="text-sm font-medium">Home: {m.attendees_home.map(getStaffName).join(", ")}</p>
                      <p className="text-sm">External: {m.external_attendees.join("; ")}</p>
                      {m.child_present && (
                        <p className="text-xs text-emerald-700 mt-1">Child present (supported by {m.child_support_person})</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Complainant Opening</p>
                    <p className="text-sm">{m.complainant_opening}</p>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Home Response</p>
                    <p className="text-sm">{m.home_response}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">Points of Agreement</p>
                      <ul className="space-y-1">
                        {m.points_of_agreement.map((p, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Points of Disagreement</p>
                      <ul className="space-y-1">
                        {m.points_of_disagreement.length === 0 ? (
                          <li className="text-sm text-muted-foreground">None — full agreement</li>
                        ) : (
                          m.points_of_disagreement.map((p, i) => (
                            <li key={i} className="text-sm flex items-start gap-1">
                              <span className="text-amber-600 mt-0.5">•</span>
                              <span>{p}</span>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>

                  {m.apology_offered && (
                    <div className="bg-purple-50 rounded-lg p-3 flex items-start gap-2">
                      <Heart className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Apology</p>
                        <p className="text-sm">Apology offered &middot; {m.apology_accepted_by_complainant ? "Accepted by complainant" : "Acknowledged by complainant"}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Practice Changes Agreed</p>
                    <ul className="space-y-1">
                      {m.practice_changes_agreed.map((c, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <CheckCircle className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Follow-Up Actions</p>
                    <div className="space-y-1">
                      {(m.follow_up_actions ?? []).map((a, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-start justify-between gap-2">
                          <span className="flex-1">{a.action}</span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {a.owner.startsWith("staff_") ? getStaffName(a.owner) : a.owner} &middot; {a.deadline}
                          </span>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                            actionStatusColour[a.status]
                          )}>
                            {FOLLOW_UP_ACTION_STATUS_LABEL[a.status]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Feedback on Process</p>
                    <p className="text-sm text-emerald-900 italic">&ldquo;{m.feedback_on_process}&rdquo;</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Users className="h-3 w-3 inline mr-1" />Minuted: {getStaffName(m.minuted_by)}</span>
                    {m.minutes_shared && <span><Clock className="h-3 w-3 inline mr-1" />Minutes shared: {m.minutes_shared_date}</span>}
                    {m.will_escalate && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-medium"><AlertTriangle className="h-3 w-3 inline mr-0.5" />Escalating</span>}
                    {m.resolution_achieved && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Resolved</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Resolution meetings support Children&apos;s Homes Regulations
          2015 Regulation 39 (complaints), Quality Standard 13 (leadership and management), and the home&apos;s
          restorative practice framework.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Complaints"
        category="complaint"
        days={90}
        defaultCollapsed
      />
    </PageShell>
  );
}
