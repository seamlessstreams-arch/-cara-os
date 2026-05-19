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
  Users,
  CheckCircle,
  Clock,
  FileText,
  Star,
  AlertTriangle,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PlacementMeeting, PlacementMeetingType, PlacementMeetingActionStatus } from "@/types/extended";
import { PLACEMENT_MEETING_TYPE_LABEL, PLACEMENT_MEETING_ACTION_STATUS_LABEL } from "@/types/extended";
import { usePlacementMeetings } from "@/hooks/use-placement-meetings";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

const typeColour: Record<PlacementMeetingType, string> = {
  weekly_review: "bg-blue-100 text-blue-800",
  monthly_review: "bg-purple-100 text-purple-800",
  crisis_meeting: "bg-red-100 text-red-800",
  pre_placement_plan: "bg-emerald-100 text-emerald-800",
  pre_lac_prep: "bg-amber-100 text-amber-800",
  multi_agency_update: "bg-indigo-100 text-indigo-800",
  transition_planning: "bg-pink-100 text-pink-800",
};

const exportCols: ExportColumn<PlacementMeeting>[] = [
  { header: "Young Person", accessor: (r: PlacementMeeting) => getYPName(r.child_id) },
  { header: "Type", accessor: (r: PlacementMeeting) => PLACEMENT_MEETING_TYPE_LABEL[r.meeting_type] },
  { header: "Date", accessor: (r: PlacementMeeting) => r.date },
  { header: "Duration (min)", accessor: (r: PlacementMeeting) => String(r.duration_minutes) },
  { header: "Chair", accessor: (r: PlacementMeeting) => getStaffName(r.chair) },
  { header: "Child Attended", accessor: (r: PlacementMeeting) => r.child_attended ? "Yes" : "No" },
  { header: "Care Plan Reviewed", accessor: (r: PlacementMeeting) => r.care_plan_reviewed ? "Yes" : "No" },
  { header: "Open Actions", accessor: (r: PlacementMeeting) => String(r.actions.filter((a) => a.status !== "done").length) },
  { header: "Next Meeting", accessor: (r: PlacementMeeting) => r.next_meeting },
];

export default function PlacementMeetingMinutesPage() {
  const { data: res, isLoading } = usePlacementMeetings();
  const entries = res?.data ?? [];

  const [filterYP, setFilterYP] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const childIds = useMemo(() => [...new Set(entries.map(e => e.child_id))], [entries]);

  const filtered = useMemo(() => {
    let items = [...entries];
    if (filterYP !== "all") items = items.filter((m) => m.child_id === filterYP);
    if (filterType !== "all") items = items.filter((m) => m.meeting_type === filterType);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "next":
          return a.next_meeting.localeCompare(b.next_meeting);
        case "child":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        default:
          return 0;
      }
    });
    return items;
  }, [entries, filterYP, filterType, sortBy]);

  if (isLoading) {
    return (
      <PageShell title="Placement Meeting Minutes" subtitle="Internal placement reviews — multi-disciplinary discussion, decisions, and actions per child">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  const total = entries.length;
  const openActions = entries.reduce((sum, m) => sum + m.actions.filter((a) => a.status !== "done").length, 0);
  const childAttendedCount = entries.filter((m) => m.child_attended).length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const in14 = new Date();
  in14.setDate(in14.getDate() + 14);
  const in14Str = in14.toISOString().slice(0, 10);
  const upcomingNext = entries.filter((m) => m.next_meeting >= todayStr && m.next_meeting <= in14Str).length;

  return (
    <PageShell
      title="Placement Meeting Minutes"
      subtitle="Internal placement reviews — multi-disciplinary discussion, decisions, and actions per child"
      ariaContext={{ pageTitle: "Placement Meeting Minutes", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={entries} columns={exportCols} filename="placement-meeting-minutes" />
          <PrintButton title="Placement Meeting Minutes" />
          <AriaStudioQuickActionButton context={{ record_type: "placement_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Total Meetings</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{openActions}</p>
          <p className="text-xs text-muted-foreground">Open Actions</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{childAttendedCount}</p>
          <p className="text-xs text-muted-foreground">Child Attended</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{upcomingNext}</p>
          <p className="text-xs text-muted-foreground">Due Next 14 Days</p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6 flex items-start gap-2">
        <Users className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          Placement meetings are held weekly per child as standard, with monthly multi-agency reviews and
          crisis meetings as needed. Children&apos;s views are always represented — directly where appropriate.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            {childIds.map((cid) => (
              <SelectItem key={cid} value={cid}>{getYPName(cid)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(Object.entries(PLACEMENT_MEETING_TYPE_LABEL) as [PlacementMeetingType, string][]).map(([k, v]) => (
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
              <SelectItem value="next">Next Meeting</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((meeting) => {
          const isExpanded = expandedId === meeting.id;
          const openActionCount = meeting.actions.filter((a) => a.status !== "done").length;

          return (
            <div key={meeting.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : meeting.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Users className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(meeting.child_id)} &middot; {PLACEMENT_MEETING_TYPE_LABEL[meeting.meeting_type]}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {meeting.date} &middot; {meeting.duration_minutes}min &middot; Chair: {getStaffName(meeting.chair)} &middot; {meeting.attendees.length + meeting.external_attendees.length} attendees
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", typeColour[meeting.meeting_type])}>
                    {PLACEMENT_MEETING_TYPE_LABEL[meeting.meeting_type]}
                  </span>
                  {openActionCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">{openActionCount} open</span>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Internal Attendees</p>
                      <ul className="space-y-1">
                        {meeting.attendees.map((a, i) => (
                          <li key={i} className="text-sm">{getStaffName(a)}{a === meeting.chair ? " (Chair)" : ""}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">External Attendees</p>
                      {meeting.external_attendees.length > 0 ? (
                        <ul className="space-y-1">
                          {meeting.external_attendees.map((a, i) => (
                            <li key={i} className="text-sm">{a}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">None</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Child Contribution</p>
                    <p className="text-sm text-purple-900">{meeting.child_attended ? "Child attended in person. " : "Child did not attend. "}{meeting.child_contribution}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Agenda</p>
                    <ul className="space-y-1">
                      {meeting.agenda.map((a, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <FileText className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">
                        <Star className="h-3 w-3 inline mr-1" />Progress Since Last
                      </p>
                      <ul className="space-y-1">
                        {meeting.progress_since_last.map((p, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />Current Concerns
                      </p>
                      <ul className="space-y-1">
                        {meeting.current_concerns.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Decisions Agreed</p>
                    <ul className="space-y-1">
                      {meeting.decisions_agreed.map((dec, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                          {dec}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Actions ({meeting.actions.length})</p>
                    <div className="space-y-1">
                      {meeting.actions.map((act, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-start justify-between gap-2">
                          <span className="flex-1">{act.action}</span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {act.owner.startsWith("staff_") ? getStaffName(act.owner) : act.owner} &middot; {act.deadline}
                          </span>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                            act.status === "done" ? "bg-green-100 text-green-800" :
                            act.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                            "bg-amber-100 text-amber-800"
                          )}>
                            {PLACEMENT_MEETING_ACTION_STATUS_LABEL[act.status]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {meeting.risk_updates && (
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-1">Risk Updates</p>
                      <p className="text-sm text-red-900">{meeting.risk_updates}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Calendar className="h-3 w-3 inline mr-1" />Next: {meeting.next_meeting}</span>
                    <span>Minuted by: {getStaffName(meeting.minuted_by)}</span>
                    <span>Approved by: {getStaffName(meeting.approved_by)}</span>
                    {meeting.care_plan_reviewed && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Care Plan Reviewed</span>}
                  </div>

                  <SmartLinkPanel sourceType="placement-meeting" sourceId={meeting.id} childId={meeting.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Internal placement meetings support Quality Standard 4 (the
          child&apos;s plan), Quality Standard 13 (leadership and management), and Regulation 13. They feed
          directly into LAC reviews, CP conferences, and Reg 45 quality of care reviews. Children&apos;s
          views are central per UNCRC Article 12.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Professional Contact"
        category="professional_contact"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Placement Meeting Minutes — placement planning meetings, review meetings, multi-agency meetings, action points, attendees, decisions made, next steps, placement support, Reg 45 governance"
        recordType="placement_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
