"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Users,
  ArrowUpDown,
  Search,
  Clock,
  CheckCircle2,
  Calendar,
  FileText,
  Video,
  MapPin,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useProfessionalMeetingAttendances } from "@/hooks/use-professional-meeting-attendances";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type {
  ProfessionalMeetingAttendance,
  ProfMeetingType,
  ProfMeetingActionStatus,
  ProfMeetingAction,
} from "@/types/extended";
import {
  PROF_MEETING_TYPE_LABEL,
  PROF_MEETING_ACTION_STATUS_LABEL,
  PROF_MEETING_MODE_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── local colour maps ─────────────────────────────────────────────────── */

const TYPE_COLOUR: Record<ProfMeetingType, string> = {
  lac_review: "bg-blue-100 text-blue-700",
  cp_conference: "bg-red-100 text-red-700",
  strategy_meeting: "bg-orange-100 text-orange-700",
  mappa: "bg-purple-100 text-purple-700",
  taf: "bg-teal-100 text-teal-700",
  pep: "bg-indigo-100 text-indigo-700",
  ehcp_review: "bg-violet-100 text-violet-700",
  health: "bg-emerald-100 text-emerald-700",
  multi_agency: "bg-amber-100 text-amber-700",
  external_consultation: "bg-slate-100 text-slate-700",
};

const ACTION_COLOUR: Record<ProfMeetingActionStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function ProfessionalMeetingAttendancePage() {
  const { data: records = [], isLoading } = useProfessionalMeetingAttendances();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const stats = useMemo(() => {
    const today = new Date();
    const quarterStart = new Date(today);
    quarterStart.setDate(today.getDate() - 90);
    const thisQuarter = records.filter((m) => new Date(m.meeting_date) >= quarterStart);
    const allActions = records.flatMap((m) => m.actions_for_home);
    const childAttendedCount = records.filter((m) => m.child_attended).length;
    return {
      thisQuarter: thisQuarter.length,
      childAttendedPct: records.length === 0 ? 0 : Math.round((childAttendedCount / records.length) * 100),
      openActions: allActions.filter((a) => a.status === "pending" || a.status === "overdue").length,
      reportsSubmitted: records.filter((m) => m.report_submitted).length,
    };
  }, [records]);

  const filtered = useMemo(() => {
    let list = [...records];
    if (filterType !== "all") list = list.filter((m) => m.meeting_type === filterType);
    if (filterYP !== "all") list = list.filter((m) => m.child_id === filterYP);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          PROF_MEETING_TYPE_LABEL[m.meeting_type].toLowerCase().includes(q) ||
          m.organised_by.toLowerCase().includes(q) ||
          m.location.toLowerCase().includes(q) ||
          m.home_contribution.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "type":
          return PROF_MEETING_TYPE_LABEL[a.meeting_type].localeCompare(PROF_MEETING_TYPE_LABEL[b.meeting_type]);
        case "child":
          return a.child_id.localeCompare(b.child_id);
        case "duration":
          return b.duration_minutes - a.duration_minutes;
        default:
          return b.meeting_date.localeCompare(a.meeting_date);
      }
    });
    return list;
  }, [records, filterType, filterYP, search, sortBy]);

  const exportCols: ExportColumn<ProfessionalMeetingAttendance>[] = [
    { header: "Meeting Date", accessor: (r) => r.meeting_date },
    { header: "Meeting Type", accessor: (r) => PROF_MEETING_TYPE_LABEL[r.meeting_type] },
    { header: "Child", accessor: (r) => getYPName(r.child_id) },
    { header: "Location", accessor: (r) => r.location },
    { header: "Mode", accessor: (r) => PROF_MEETING_MODE_LABEL[r.virtual_or_in_person] },
    { header: "Duration (mins)", accessor: (r) => String(r.duration_minutes) },
    { header: "Organised By", accessor: (r) => r.organised_by },
    { header: "Our Representative", accessor: (r) => getStaffName(r.our_representative) },
    { header: "Home Contribution", accessor: (r) => r.home_contribution },
    { header: "Child Attended", accessor: (r) => (r.child_attended ? "Yes" : "No") },
    { header: "Child Contribution", accessor: (r) => r.child_contribution },
    { header: "Agencies Present", accessor: (r) => r.agencies_present.join("; ") },
    { header: "Key Decisions", accessor: (r) => r.key_decisions.join("; ") },
    {
      header: "Actions for Home",
      accessor: (r) =>
        r.actions_for_home.map((a) => `${a.action} (due ${a.deadline}, ${a.status})`).join("; "),
    },
    { header: "Next Meeting", accessor: (r) => r.next_meeting ?? "" },
    { header: "Report Submitted", accessor: (r) => (r.report_submitted ? "Yes" : "No") },
    { header: "Report Submitted Date", accessor: (r) => r.report_submitted_date ?? "" },
    { header: "Recorded By", accessor: (r) => getStaffName(r.recorded_by) },
  ];

  const ypIds = [...new Set(records.map((m) => m.child_id))];

  if (isLoading) {
    return (
      <PageShell title="Professional Meeting Attendance" subtitle="Home representation at multi-agency professional meetings — Quality Standard 4 & 13, Working Together 2023">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Professional Meeting Attendance"
      subtitle="Home representation at multi-agency professional meetings — Quality Standard 4 & 13, Working Together 2023"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "contact_log" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="professional-meeting-attendance" />
          <PrintButton title="Professional Meeting Attendance" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: "Meetings This Quarter", v: stats.thisQuarter, icon: Calendar, c: "text-blue-600" },
            { l: "Child Attended %", v: `${stats.childAttendedPct}%`, icon: Users, c: "text-pink-600" },
            { l: "Open Actions", v: stats.openActions, icon: Clock, c: stats.openActions > 0 ? "text-amber-600" : "text-gray-400" },
            { l: "Reports Submitted", v: `${stats.reportsSubmitted}/${records.length}`, icon: FileText, c: "text-green-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* filters / sort */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search meetings…"
              className="w-full rounded-md border pl-8 pr-3 py-2 text-sm"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[210px]">
              <SelectValue placeholder="Meeting Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {(Object.entries(PROF_MEETING_TYPE_LABEL) as [ProfMeetingType, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterYP} onValueChange={setFilterYP}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Child" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {ypIds.map((id) => (
                <SelectItem key={id} value={id}>
                  {getYPName(id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded border px-2 py-1.5 text-sm"
            >
              <option value="date">Most recent</option>
              <option value="type">Meeting type</option>
              <option value="child">Child</option>
              <option value="duration">Duration</option>
            </select>
          </div>
        </div>

        {/* card list */}
        {filtered.map((m) => {
          const open = expandedId === m.id;
          const openActionCount = m.actions_for_home.filter(
            (a) => a.status === "pending" || a.status === "overdue",
          ).length;

          return (
            <div key={m.id} className="rounded-lg border bg-white overflow-hidden">
              <button
                onClick={() => setExpandedId(open ? null : m.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-brand" />
                  <div className="text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{PROF_MEETING_TYPE_LABEL[m.meeting_type]}</h3>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", TYPE_COLOUR[m.meeting_type])}>
                        {PROF_MEETING_TYPE_LABEL[m.meeting_type]}
                      </span>
                      <span className="text-sm text-muted-foreground">— {getYPName(m.child_id)}</span>
                      {m.child_attended && (
                        <span className="rounded-full bg-pink-100 text-pink-700 px-2 py-0.5 text-xs font-medium">
                          Child attended
                        </span>
                      )}
                      {!m.report_submitted && (
                        <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium inline-flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Report pending
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {m.meeting_date} · {m.duration_minutes} mins · Organised by {m.organised_by} · Rep:{" "}
                      {getStaffName(m.our_representative)}
                    </p>
                  </div>
                </div>
                {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {open && (
                <div className="border-t p-4 space-y-4">
                  {/* meta */}
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      {m.virtual_or_in_person === "virtual" ? (
                        <Video className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      ) : (
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">{m.location}</p>
                        <p className="text-xs text-muted-foreground capitalize">{PROF_MEETING_MODE_LABEL[m.virtual_or_in_person]}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{m.duration_minutes} minutes</p>
                        {m.next_meeting && (
                          <p className="text-xs text-muted-foreground">Next meeting: {m.next_meeting}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* home contribution */}
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <h4 className="text-sm font-semibold text-blue-800 mb-1">Home Contribution</h4>
                    <p className="text-sm text-blue-900">{m.home_contribution}</p>
                  </div>

                  {/* child voice */}
                  <div
                    className={cn(
                      "rounded-lg border p-3",
                      m.child_attended ? "bg-pink-50 border-pink-200" : "bg-gray-50",
                    )}
                  >
                    <h4 className="text-sm font-semibold mb-1">
                      {m.child_attended ? "Child Attended & Contributed" : "Child Did Not Attend"}
                    </h4>
                    <p className="text-sm text-muted-foreground">{m.child_contribution}</p>
                  </div>

                  {/* agencies */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Agencies Present</h4>
                    <div className="flex flex-wrap gap-2">
                      {m.agencies_present.map((a) => (
                        <span key={a} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* decisions */}
                  {m.key_decisions.length > 0 && (
                    <div className="rounded-lg bg-indigo-50 p-3">
                      <h4 className="text-sm font-semibold text-indigo-800 mb-2">Key Decisions</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-indigo-900">
                        {m.key_decisions.map((dec, i) => (
                          <li key={i}>{dec}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* actions for home */}
                  {m.actions_for_home.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">
                        Actions for Home ({openActionCount} open)
                      </h4>
                      <div className="space-y-2">
                        {m.actions_for_home.map((a, i) => (
                          <div
                            key={i}
                            className="rounded border p-2 flex items-start justify-between gap-2"
                          >
                            <div>
                              <p className="text-sm">{a.action}</p>
                              <p className="text-xs text-muted-foreground">Due {a.deadline}</p>
                            </div>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
                                ACTION_COLOUR[a.status],
                              )}
                            >
                              {PROF_MEETING_ACTION_STATUS_LABEL[a.status]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* report status */}
                  <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-3 text-sm">
                    <div className="flex items-center gap-2">
                      {m.report_submitted ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                      )}
                      <span className="font-medium">
                        {m.report_submitted
                          ? `Home report submitted ${m.report_submitted_date ?? ""}`
                          : "Home report not yet submitted"}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Recorded by {getStaffName(m.recorded_by)}
                    </span>
                  </div>

                  <SmartLinkPanel sourceType="professional_meeting_attendance" sourceId={m.id} childId={m.child_id} compact />
                </div>
              )}
            </div>
          );
        })}

        {/* regulatory note */}
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Quality Standards 4 (Education) &amp; 13 (Leadership and Management) · Working Together to Safeguard Children 2023</strong>{" "}
          — The home must ensure that children are represented effectively at all multi-agency meetings concerning them, that the child&apos;s voice is heard or sensitively represented, that decisions and actions are tracked, and that the home submits its written contribution within agreed timescales.
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
