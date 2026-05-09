"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — GOVERNANCE MEETING MINUTES
// Records of governance meetings between the Responsible Individual and
// management team demonstrating oversight per Regulation 45 & Quality Standard 25.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import {
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  ClipboardList,
  Shield,
  Loader2,
} from "lucide-react";
import type { GovernanceMeeting, GovernanceAction } from "@/types/extended";
import { GOVERNANCE_ACTION_STATUS_LABEL } from "@/types/extended";
import { useGovernanceMeetings } from "@/hooks/use-governance-meetings";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ─── date helper (for overdue checks) ─── */
const today = () => new Date().toISOString().slice(0, 10);

/* ─── helpers ─── */
const getYPName = (id: string): string => {
  const map: Record<string, string> = { yp_alex: "Alex", yp_jordan: "Jordan", yp_casey: "Casey" };
  return map[id] ?? id;
};

/* ─── export columns ─── */
const exportCols: ExportColumn<GovernanceMeeting>[] = [
  { header: "Date", accessor: (r: GovernanceMeeting) => r.date },
  { header: "Meeting Type", accessor: (r: GovernanceMeeting) => r.meeting_type },
  { header: "Chair", accessor: (r: GovernanceMeeting) => getStaffName(r.chair) },
  { header: "Attendees", accessor: (r: GovernanceMeeting) => r.attendees.map(getStaffName).join(", ") },
  { header: "Key Decisions", accessor: (r: GovernanceMeeting) => r.key_decisions.join("; ") },
  { header: "Actions (Total)", accessor: (r: GovernanceMeeting) => r.actions.length.toString() },
  { header: "Actions (Open)", accessor: (r: GovernanceMeeting) => r.actions.filter((a) => a.status !== "completed").length.toString() },
  { header: "Regulatory Topics", accessor: (r: GovernanceMeeting) => r.regulatory_topics.join(", ") },
  { header: "Risk Items", accessor: (r: GovernanceMeeting) => r.risk_items.join("; ") },
  { header: "Next Meeting", accessor: (r: GovernanceMeeting) => r.next_meeting_date },
];

/* ─── component ─── */
export default function GovernanceMeetingMinutesPage() {
  const { data: res, isLoading } = useGovernanceMeetings();
  const records = res?.data ?? [];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  /* ─── filtered & sorted ─── */
  const filtered = useMemo(() => {
    let list = [...records];
    if (filterType !== "all") list = list.filter((m) => m.meeting_type === filterType);
    list.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "actions":
          return b.actions.filter((x) => x.status !== "completed").length - a.actions.filter((x) => x.status !== "completed").length;
        case "type":
          return a.meeting_type.localeCompare(b.meeting_type);
        default:
          return 0;
      }
    });
    return list;
  }, [records, filterType, sortBy]);

  /* ─── summary stats ─── */
  const stats = useMemo(() => {
    const allActions = records.flatMap((m) => m.actions);
    const totalMeetings = records.length;
    const openActions = allActions.filter((a) => a.status !== "completed").length;
    const overdueActions = allActions.filter((a) => a.status === "overdue" || (a.status !== "completed" && a.deadline < today())).length;
    const nextMeeting = records
      .map((m) => m.next_meeting_date)
      .filter((dt) => dt >= today())
      .sort()[0] ?? "Not scheduled";
    return { totalMeetings, openActions, overdueActions, nextMeeting };
  }, [records]);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const meetingTypeBadge = (type: string) => {
    switch (type) {
      case "Monthly Governance":
        return <Badge className="bg-blue-100 text-blue-800">{type}</Badge>;
      case "Quarterly Strategy":
        return <Badge className="bg-purple-100 text-purple-800">{type}</Badge>;
      case "Annual Review":
        return <Badge className="bg-amber-100 text-amber-800">{type}</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const actionStatusBadge = (status: string) => {
    const label = GOVERNANCE_ACTION_STATUS_LABEL[status as keyof typeof GOVERNANCE_ACTION_STATUS_LABEL] ?? status;
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 text-xs">{label}</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800 text-xs">{label}</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800 text-xs">{label}</Badge>;
      case "pending":
        return <Badge className="bg-gray-100 text-gray-800 text-xs">{label}</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{label}</Badge>;
    }
  };

  const getActionCompletionRate = (actions: GovernanceAction[]) => {
    if (actions.length === 0) return 100;
    return Math.round((actions.filter((a) => a.status === "completed").length / actions.length) * 100);
  };

  return (
    <PageShell
      title="Governance Meeting Minutes"
      subtitle="Records of RI and management governance meetings demonstrating oversight per Regulation 45 and Quality Standard 25"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="governance-meeting-minutes" />
          <PrintButton title="Governance Meeting Minutes" />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
      <>
      {/* ─── summary stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{stats.totalMeetings}</p>
            <p className="text-xs text-muted-foreground">Total Meetings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.openActions}</p>
            <p className="text-xs text-muted-foreground">Actions Open</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-red-700">{stats.overdueActions}</p>
            <p className="text-xs text-muted-foreground">Actions Overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.nextMeeting}</p>
            <p className="text-xs text-muted-foreground">Next Meeting</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── overdue alert ─── */}
      {stats.overdueActions > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">{stats.overdueActions} Overdue Action{stats.overdueActions > 1 ? "s" : ""}</p>
              <p className="text-xs text-red-700 mt-1">
                There {stats.overdueActions === 1 ? "is" : "are"} {stats.overdueActions} governance action{stats.overdueActions > 1 ? "s" : ""} past
                the agreed deadline. These require immediate attention to demonstrate effective oversight.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── filters / sort ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          className="border rounded-md px-3 py-1.5 text-sm"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Meeting Types</option>
          <option value="Monthly Governance">Monthly Governance</option>
          <option value="Quarterly Strategy">Quarterly Strategy</option>
          <option value="Annual Review">Annual Review</option>
        </select>

        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            className="border rounded-md px-3 py-1.5 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Most Recent</option>
            <option value="actions">Open Actions</option>
            <option value="type">Meeting Type</option>
          </select>
        </div>
      </div>

      {/* ─── meeting cards ─── */}
      <div className="space-y-4">
        {filtered.map((meeting) => {
          const expanded = expandedId === meeting.id;
          const completionRate = getActionCompletionRate(meeting.actions);
          const hasOverdue = meeting.actions.some((a) => a.status === "overdue" || (a.status !== "completed" && a.deadline < today()));

          return (
            <Card key={meeting.id} className={cn("overflow-hidden", hasOverdue && "border-red-200")}>
              <CardHeader
                className="cursor-pointer hover:bg-muted/40 transition-colors py-4"
                onClick={() => toggle(meeting.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      meeting.meeting_type === "Annual Review"
                        ? "bg-amber-100"
                        : meeting.meeting_type === "Quarterly Strategy"
                          ? "bg-purple-100"
                          : "bg-blue-100"
                    )}>
                      <ClipboardList className={cn(
                        "h-5 w-5",
                        meeting.meeting_type === "Annual Review"
                          ? "text-amber-600"
                          : meeting.meeting_type === "Quarterly Strategy"
                            ? "text-purple-600"
                            : "text-blue-600"
                      )} />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {meeting.meeting_type} — {meeting.date}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {meetingTypeBadge(meeting.meeting_type)}
                        <span className="text-xs text-muted-foreground">
                          Chaired by {getStaffName(meeting.chair)}
                        </span>
                        {hasOverdue && (
                          <Badge className="bg-red-100 text-red-800 text-xs">Overdue Actions</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className={cn(
                        "text-sm font-medium",
                        completionRate === 100 ? "text-green-700" : completionRate >= 50 ? "text-blue-700" : "text-amber-700"
                      )}>
                        {completionRate}%
                      </p>
                      <p className="text-xs text-muted-foreground">actions done</p>
                    </div>
                    {expanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expanded && (
                <CardContent className="pt-0 pb-4 space-y-5">
                  {/* attendees */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> Attendees
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {meeting.attendees.map((att, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {getStaffName(att)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* agenda */}
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                      <ClipboardList className="h-4 w-4 text-muted-foreground" /> Agenda
                    </p>
                    <ol className="space-y-1 list-decimal list-inside">
                      {meeting.agenda_items.map((item, i) => (
                        <li key={i} className="text-sm text-muted-foreground">{item}</li>
                      ))}
                    </ol>
                  </div>

                  {/* key decisions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Key Decisions
                    </p>
                    <ul className="space-y-1">
                      {meeting.key_decisions.map((dec, i) => (
                        <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                          <span className="text-blue-400 mt-1.5">•</span> {dec}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* actions tracker */}
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" /> Actions ({meeting.actions.filter((a) => a.status === "completed").length}/{meeting.actions.length} completed)
                    </p>
                    <div className="space-y-2">
                      {meeting.actions.map((action, i) => {
                        const isOverdue = action.status === "overdue" || (action.status !== "completed" && action.deadline < today());
                        return (
                          <div
                            key={i}
                            className={cn(
                              "border rounded-md p-2 flex items-center justify-between",
                              isOverdue && "border-red-200 bg-red-50/50"
                            )}
                          >
                            <div>
                              <p className="text-sm">{action.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {getStaffName(action.owner)} · by {action.deadline}
                              </p>
                            </div>
                            {actionStatusBadge(isOverdue ? "overdue" : action.status)}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* children discussed */}
                  {meeting.children_discussed.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Children Discussed</p>
                      <div className="flex flex-wrap gap-1">
                        {meeting.children_discussed.map((yp, i) => (
                          <Badge key={i} className="bg-green-100 text-green-800 text-xs">
                            {getYPName(yp)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* regulatory topics & risk items */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                        <Shield className="h-4 w-4" /> Regulatory Topics
                      </p>
                      <ul className="space-y-1">
                        {meeting.regulatory_topics.map((topic, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-slate-400 mt-1.5">•</span> {topic}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-700 mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" /> Risk Items
                      </p>
                      <ul className="space-y-1">
                        {meeting.risk_items.map((risk, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-amber-400 mt-1.5">•</span> {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* footer */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Chaired By</p>
                      <p className="text-sm font-medium">{getStaffName(meeting.chair)} (RI)</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Next Meeting
                      </p>
                      <p className="text-sm font-medium">{meeting.next_meeting_date}</p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* ─── regulatory note ─── */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm font-medium text-slate-700 mb-1">Regulatory Context</p>
        <p className="text-xs text-slate-600">
          Regulation 45 requires the registered person to review the quality of care provided at least
          every six months and produce a written report. Quality Standard 25 requires that governance
          and accountability arrangements are effective and ensure the home operates in line with its
          Statement of Purpose. Monthly governance meetings between the Responsible Individual and
          Registered Manager demonstrate active oversight, strategic direction, and organisational
          accountability. These records evidence that decisions are scrutinised, actions are tracked,
          and the welfare of children remains central to all governance activity.
        </p>
      </div>
      </>
      )}
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
