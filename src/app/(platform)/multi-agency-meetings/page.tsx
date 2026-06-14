"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown, ChevronUp, Users, Plus, ArrowUpDown, Search,
  Clock, CheckCircle2, Calendar, AlertTriangle, Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName, YOUNG_PEOPLE, STAFF } from "@/lib/seed-data";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useMultiAgencyMeetings, useCreateMultiAgencyMeeting } from "@/hooks/use-multi-agency-meetings";
import type {
  MultiAgencyMeeting, MultiAgencyMeetingType, MultiAgencyMeetingStatus,
  MeetingAttendee, MultiAgencyActionItem, MeetingActionStatus,
} from "@/types/extended";
import {
  MULTI_AGENCY_MEETING_TYPE_LABEL, MULTI_AGENCY_MEETING_STATUS_LABEL,
  MEETING_ACTION_STATUS_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

const STATUS_CLR: Record<MultiAgencyMeetingStatus, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  postponed: "bg-amber-100 text-amber-700",
};

const ACTION_CLR: Record<MeetingActionStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  carried_forward: "bg-slate-100 text-[var(--cs-text-secondary)]",
  overdue: "bg-red-100 text-red-700",
};

export default function MultiAgencyMeetingsPage() {
  const { data: res, isLoading } = useMultiAgencyMeetings();
  const data: MultiAgencyMeeting[] = res?.data ?? [];

  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showDialog, setShowDialog] = useState(false);

  const createMeeting = useCreateMultiAgencyMeeting();
  const [mamForm, setMamForm] = useState({ child_id: "", meeting_type: "professionals" as MultiAgencyMeetingType, date: new Date().toISOString().slice(0, 10), time: "10:00", venue: "", chaired_by: "" });
  const setMAM = (k: keyof typeof mamForm, v: string) => setMamForm((p) => ({ ...p, [k]: v }));

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mamForm.child_id) { toast.error("Please select a young person."); return; }
    if (!mamForm.venue.trim()) { toast.error("Venue is required."); return; }
    await createMeeting.mutateAsync({ child_id: mamForm.child_id, meeting_type: mamForm.meeting_type, meeting_status: "scheduled", date: mamForm.date, time: mamForm.time, venue: mamForm.venue.trim(), chaired_by: mamForm.chaired_by || "External chair", home_representative: "staff_darren", attendees: [], key_discussion_points: [], decisions_reached: [], child_participation: "", action_items: [], next_meeting_date: null, notes: "", created_at: new Date().toISOString() });
    toast.success("Meeting scheduled.");
    setMamForm({ child_id: "", meeting_type: "professionals", date: new Date().toISOString().slice(0, 10), time: "10:00", venue: "", chaired_by: "" });
    setShowDialog(false);
  };

  const stats = useMemo(() => {
    const allActions = data.flatMap((m) => m.action_items);
    return {
      total: data.length,
      upcoming: data.filter((m) => m.meeting_status === "scheduled").length,
      completed: data.filter((m) => m.meeting_status === "completed").length,
      pendingActions: allActions.filter((a) => a.status === "pending").length,
      overdueActions: allActions.filter((a) => a.status === "overdue").length,
    };
  }, [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterType !== "all") list = list.filter((m) => m.meeting_type === filterType);
    if (filterYP !== "all") list = list.filter((m) => m.child_id === filterYP);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((m) =>
        MULTI_AGENCY_MEETING_TYPE_LABEL[m.meeting_type].toLowerCase().includes(q) ||
        m.chaired_by.toLowerCase().includes(q) ||
        m.notes.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "type": return MULTI_AGENCY_MEETING_TYPE_LABEL[a.meeting_type].localeCompare(MULTI_AGENCY_MEETING_TYPE_LABEL[b.meeting_type]);
        case "yp": return a.child_id.localeCompare(b.child_id);
        default: return b.date.localeCompare(a.date);
      }
    });
    return list;
  }, [data, filterType, filterYP, search, sortBy]);

  interface FlatMeeting {
    youngPerson: string;
    type: string;
    status: string;
    date: string;
    time: string;
    venue: string;
    chairedBy: string;
    homeRep: string;
    attendeeCount: string;
    decisions: string;
    childParticipation: string;
    pendingActions: number;
    nextMeeting: string;
    notes: string;
  }

  const exportData = useMemo<FlatMeeting[]>(() => data.map((m) => ({
    youngPerson: getYPName(m.child_id),
    type: MULTI_AGENCY_MEETING_TYPE_LABEL[m.meeting_type],
    status: MULTI_AGENCY_MEETING_STATUS_LABEL[m.meeting_status],
    date: m.date,
    time: m.time,
    venue: m.venue,
    chairedBy: m.chaired_by,
    homeRep: getStaffName(m.home_representative),
    attendeeCount: m.attendees.filter((a: MeetingAttendee) => a.attended).length + "/" + m.attendees.length,
    decisions: m.decisions_reached.join("; "),
    childParticipation: m.child_participation,
    pendingActions: (m.action_items ?? []).filter((a: MultiAgencyActionItem) => a.status === "pending").length,
    nextMeeting: m.next_meeting_date || "TBC",
    notes: m.notes,
  })), [data]);

  const exportCols: ExportColumn<FlatMeeting>[] = [
    { header: "Young Person", accessor: (r) => r.youngPerson },
    { header: "Meeting Type", accessor: (r) => r.type },
    { header: "Status", accessor: (r) => r.status },
    { header: "Date", accessor: (r) => r.date },
    { header: "Time", accessor: (r) => r.time },
    { header: "Venue", accessor: (r) => r.venue },
    { header: "Chaired By", accessor: (r) => r.chairedBy },
    { header: "Home Rep", accessor: (r) => r.homeRep },
    { header: "Attendance", accessor: (r) => r.attendeeCount },
    { header: "Decisions", accessor: (r) => r.decisions },
    { header: "Child Participation", accessor: (r) => r.childParticipation },
    { header: "Pending Actions", accessor: (r) => String(r.pendingActions) },
    { header: "Next Meeting", accessor: (r) => r.nextMeeting },
    { header: "Notes", accessor: (r) => r.notes },
  ];

  const ypIds = [...new Set(data.map((m) => m.child_id))];

  if (isLoading) return <PageShell title="Multi-Agency Meetings" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Multi-Agency Meetings"
      subtitle="LAC reviews, PEPs, strategy meetings, CIN/CPP conferences and professionals meetings"
      caraContext={{ pageTitle: "Multi-Agency Meetings", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="multi-agency-meetings" />
          <PrintButton title="Multi-Agency Meetings" />
          <CaraStudioQuickActionButton context={{ record_type: "management_oversight", record_id: "home_oak", home_id: "home_oak" }} />
          <Button size="sm" onClick={() => setShowDialog(true)}><Plus className="h-4 w-4 mr-1" /> New Meeting</Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { l: "Total Meetings", v: stats.total, icon: Users, c: "text-blue-600" },
            { l: "Upcoming", v: stats.upcoming, icon: Calendar, c: "text-purple-600" },
            { l: "Completed", v: stats.completed, icon: CheckCircle2, c: "text-green-600" },
            { l: "Pending Actions", v: stats.pendingActions, icon: Clock, c: "text-amber-600" },
            { l: "Overdue Actions", v: stats.overdueActions, icon: AlertTriangle, c: stats.overdueActions > 0 ? "text-red-600" : "text-gray-400" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search meetings…" className="pl-8" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Meeting Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {(Object.keys(MULTI_AGENCY_MEETING_TYPE_LABEL) as MultiAgencyMeetingType[]).map((k) => <SelectItem key={k} value={k}>{MULTI_AGENCY_MEETING_TYPE_LABEL[k]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterYP} onValueChange={setFilterYP}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Young Person" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {ypIds.map((id) => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="type">Meeting Type</SelectItem>
                <SelectItem value="yp">Young Person</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.map((meeting) => (
          <div key={meeting.id} className="rounded-lg border bg-white overflow-hidden">
            <button onClick={() => setExpanded(expanded === meeting.id ? null : meeting.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-600" />
                <div className="text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{MULTI_AGENCY_MEETING_TYPE_LABEL[meeting.meeting_type]}</h3>
                    <span className="text-sm text-muted-foreground">— {getYPName(meeting.child_id)}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_CLR[meeting.meeting_status])}>{MULTI_AGENCY_MEETING_STATUS_LABEL[meeting.meeting_status]}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{meeting.date} at {meeting.time} · {meeting.venue} · Chaired by {meeting.chaired_by}</p>
                </div>
              </div>
              {expanded === meeting.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expanded === meeting.id && (
              <div className="border-t p-4 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Attendance ({meeting.attendees.filter((a: MeetingAttendee) => a.attended).length}/{meeting.attendees.length})</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="pb-2 pr-3">Name</th><th className="pb-2 pr-3">Role</th><th className="pb-2 pr-3">Organisation</th><th className="pb-2">Attended</th></tr></thead>
                      <tbody>
                        {meeting.attendees.map((a: MeetingAttendee, i: number) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-1.5 pr-3 font-medium">{a.name}</td>
                            <td className="py-1.5 pr-3">{a.role}</td>
                            <td className="py-1.5 pr-3 text-muted-foreground">{a.organisation}</td>
                            <td className="py-1.5">{a.attended ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <span className="text-red-500 text-xs">Absent</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {meeting.key_discussion_points.length > 0 && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <h4 className="text-sm font-semibold mb-2">Key Discussion Points</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">{meeting.key_discussion_points.map((p: string, i: number) => <li key={i}>{p}</li>)}</ul>
                  </div>
                )}

                {meeting.decisions_reached.length > 0 && (
                  <div className="rounded-lg bg-blue-50 p-3">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">Decisions Reached</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-900">{meeting.decisions_reached.map((d: string, i: number) => <li key={i}>{d}</li>)}</ol>
                  </div>
                )}

                {meeting.child_participation && (
                  <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                    <h4 className="text-sm font-semibold text-pink-800 mb-1">Child Participation</h4>
                    <p className="text-sm text-pink-900">{meeting.child_participation}</p>
                  </div>
                )}

                {meeting.action_items.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Action Items</h4>
                    <div className="space-y-2">
                      {meeting.action_items.map((a: MultiAgencyActionItem, i: number) => (
                        <div key={i} className="rounded border p-2 flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm">{a.action}</p>
                            <p className="text-xs text-muted-foreground">{a.owner} · Due {a.due_date}</p>
                          </div>
                          <Badge className={cn("text-xs whitespace-nowrap", ACTION_CLR[a.status])}>{MEETING_ACTION_STATUS_LABEL[a.status]}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {meeting.next_meeting_date && <p className="text-sm"><span className="text-muted-foreground">Next meeting:</span> {meeting.next_meeting_date}</p>}

                {meeting.notes && (
                  <div className="rounded-lg bg-gray-50 border p-3">
                    <h4 className="text-sm font-semibold mb-1">RM Notes</h4>
                    <p className="text-sm text-muted-foreground">{meeting.notes}</p>
                  </div>
                )}

                <SmartLinkPanel sourceType="multi-agency-meetings" sourceId={meeting.id} childId={meeting.child_id} compact />
              </div>
            )}
          </div>
        ))}

        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Reg 5 / IRO Handbook / SEND Code of Practice</strong> — The home must support the child&apos;s care plan including attendance at LAC reviews, PEP meetings, and all multi-agency forums. The child&apos;s participation must be facilitated and recorded.
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Multi-Agency Meeting</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateMeeting} className="space-y-3">
            <Select value={mamForm.child_id} onValueChange={(v) => setMAM("child_id", v)}><SelectTrigger><SelectValue placeholder="Young Person… *" /></SelectTrigger><SelectContent>{YOUNG_PEOPLE.filter((y) => y.status === "current").map((y) => <SelectItem key={y.id} value={y.id}>{y.preferred_name ?? y.first_name}</SelectItem>)}</SelectContent></Select>
            <Select value={mamForm.meeting_type} onValueChange={(v) => setMAM("meeting_type", v)}><SelectTrigger><SelectValue placeholder="Meeting type…" /></SelectTrigger><SelectContent>{(Object.keys(MULTI_AGENCY_MEETING_TYPE_LABEL) as MultiAgencyMeetingType[]).map((k) => <SelectItem key={k} value={k}>{MULTI_AGENCY_MEETING_TYPE_LABEL[k]}</SelectItem>)}</SelectContent></Select>
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" value={mamForm.date} onChange={(e) => setMAM("date", e.target.value)} />
              <Input type="time" value={mamForm.time} onChange={(e) => setMAM("time", e.target.value)} />
            </div>
            <Input placeholder="Venue *" value={mamForm.venue} onChange={(e) => setMAM("venue", e.target.value)} />
            <Input placeholder="Chaired by" value={mamForm.chaired_by} onChange={(e) => setMAM("chaired_by", e.target.value)} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={createMeeting.isPending}>{createMeeting.isPending ? "Creating…" : "Create Meeting"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Professional Contact"
        category="professional_contact"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Multi-Agency Meetings — CLA reviews, strategy meetings, CP conferences, EHCP reviews, TAC meetings, PLO, ICR, safeguarding strategy, professional coordination"
        recordType="management_oversight"
        className="mt-6"
      />
    </PageShell>
  );
}
