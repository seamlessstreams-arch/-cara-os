"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  CheckCircle2,
  Users,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell }    from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import type {
  ChildrensMeetingRecord,
  ChildrensMeetingType,
  MeetingMood,
  MeetingActionStatus,
} from "@/types/extended";
import {
  CHILDRENS_MEETING_TYPE_LABEL,
  MEETING_MOOD_LABEL,
  MEETING_ACTION_STATUS_LABEL,
} from "@/types/extended";
import {
  useChildrensMeetingRecords,
  useCreateChildrensMeetingRecord,
} from "@/hooks/use-childrens-meeting-records";

/* ── local colour maps ────────────────────────────────────────────────── */

const MOOD_COLOURS: Record<MeetingMood, string> = {
  positive: "bg-green-100 text-green-800",
  mixed: "bg-amber-100 text-amber-800",
  difficult: "bg-red-100 text-red-800",
};

const ACTION_COLOURS: Record<MeetingActionStatus, string> = {
  pending: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  carried_forward: "bg-amber-100 text-amber-800",
  overdue: "bg-red-100 text-red-800",
};

/* ── flat row for export ─────────────────────────────────────────────── */

interface FlatRow {
  date: string; type: string; facilitated_by: string; yp_present: string;
  yp_absent: string; agenda_topics: string; actions_count: string;
  actions_completed: string; mood: string; complaints: string;
  suggestions: string; notes: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Date",              accessor: (r: FlatRow) => r.date },
  { header: "Type",              accessor: (r: FlatRow) => r.type },
  { header: "Facilitated By",    accessor: (r: FlatRow) => r.facilitated_by },
  { header: "YP Present",        accessor: (r: FlatRow) => r.yp_present },
  { header: "YP Absent",         accessor: (r: FlatRow) => r.yp_absent },
  { header: "Agenda Topics",     accessor: (r: FlatRow) => r.agenda_topics },
  { header: "Actions",           accessor: (r: FlatRow) => r.actions_count },
  { header: "Completed",         accessor: (r: FlatRow) => r.actions_completed },
  { header: "Mood",              accessor: (r: FlatRow) => r.mood },
  { header: "Complaints",        accessor: (r: FlatRow) => r.complaints },
  { header: "Suggestions",       accessor: (r: FlatRow) => r.suggestions },
  { header: "Notes",             accessor: (r: FlatRow) => r.notes },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function ChildrensMeetingsPage() {
  const { data: res, isLoading } = useChildrensMeetingRecords();
  const items = res?.data ?? [];
  const createMut = useCreateChildrensMeetingRecord();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [dialogOpen, setDialogOpen] = useState(false);

  /* ── create form state ───────────────────────────────────────────── */
  const [formDate, setFormDate] = useState("");
  const [formType, setFormType] = useState<ChildrensMeetingType | "">("");
  const [formFacilitator, setFormFacilitator] = useState("");
  const [formSnack, setFormSnack] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const resetForm = () => { setFormDate(""); setFormType(""); setFormFacilitator(""); setFormSnack(""); setFormNotes(""); };

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* ── loading ─────────────────────────────────────────────────────── */
  if (isLoading) {
    return <PageShell title="Children's Meetings" subtitle="Child-led meetings — giving children a voice in how the home is run"><div /></PageShell>;
  }

  /* ── stats ────────────────────────────────────────────────────────── */
  const total = items.length;
  const totalActions = items.reduce((s, m) => s + m.actions.length, 0);
  const completedActions = items.reduce((s, m) => s + m.actions.filter((a) => a.status === "completed").length, 0);
  const pendingActions = totalActions - completedActions;

  /* ── filtered / sorted ────────────────────────────────────────────── */
  let list: ChildrensMeetingRecord[] = items;
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((m) =>
      m.agenda.some((a) => a.topic.toLowerCase().includes(q)) ||
      m.suggestions_box.some((s) => s.toLowerCase().includes(q))
    );
  }
  if (filterType !== "all") list = list.filter((m) => m.type === filterType);
  const filtered = [...list];
  switch (sortBy) {
    case "date": filtered.sort((a, b) => b.date.localeCompare(a.date)); break;
    case "type": filtered.sort((a, b) => a.type.localeCompare(b.type)); break;
  }

  /* ── export ───────────────────────────────────────────────────────── */
  const exportData: FlatRow[] = items.map((m) => ({
    date: m.date,
    type: CHILDRENS_MEETING_TYPE_LABEL[m.type],
    facilitated_by: getStaffName(m.facilitated_by),
    yp_present: m.yp_present.map(getYPName).join(", "),
    yp_absent: m.yp_absent.length ? m.yp_absent.map(getYPName).join(", ") : "None",
    agenda_topics: m.agenda.map((a) => a.topic).join("; "),
    actions_count: `${m.actions.length}`,
    actions_completed: `${m.actions.filter((a) => a.status === "completed").length}/${m.actions.length}`,
    mood: MEETING_MOOD_LABEL[m.overall_mood],
    complaints: m.complaints_raised ? m.complaints_details : "None",
    suggestions: m.suggestions_box.join("; "),
    notes: m.notes,
  }));

  /* ── submit handler ──────────────────────────────────────────────── */
  const onSubmit = async () => {
    if (!formDate || !formType || !formFacilitator) return;
    await createMut.mutateAsync({
      date: formDate,
      type: formType as ChildrensMeetingType,
      facilitated_by: formFacilitator,
      meal_or_snack: formSnack,
      notes: formNotes,
    });
    toast.success("Meeting created");
    resetForm();
    setDialogOpen(false);
  };

  return (
    <PageShell
      title="Children's Meetings"
      subtitle="Child-led meetings — giving children a voice in how the home is run"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Children's Meetings" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="childrens-meetings" />
          <button onClick={() => setDialogOpen(true)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> New Meeting
          </button>
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Meetings Held", value: total, icon: MessageCircle, colour: "text-blue-600" },
          { label: "Total Actions", value: totalActions, icon: CheckCircle2, colour: "text-green-600" },
          { label: "Actions Completed", value: completedActions, icon: Star, colour: "text-emerald-600" },
          { label: "Actions Pending", value: pendingActions, icon: AlertTriangle, colour: pendingActions > 0 ? "text-amber-600" : "text-gray-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-white p-4 flex items-center gap-3">
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── next meeting ───────────────────────────────────────────── */}
      {items[0]?.next_meeting_date && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-blue-300 bg-blue-50 p-4">
          <Users className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-800">Next Meeting: {items[0].next_meeting_date}</p>
            <p className="text-sm text-blue-700">Suggestions box items to discuss: {items[0].suggestions_box.length > 0 ? items[0].suggestions_box.length : "none yet"}. Encourage children to add items during the week.</p>
          </div>
        </div>
      )}

      {/* ── filters ────────────────────────────────────────────────── */}
      <div id="meetings-list" className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search topics or suggestions…" className="w-full rounded-md border py-2 pl-9 pr-3 text-sm" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(CHILDRENS_MEETING_TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── cards ──────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((m) => {
          const open = expanded[m.id] ?? false;
          const completedActs = m.actions.filter((a) => a.status === "completed").length;
          return (
            <div key={m.id} className="rounded-lg border bg-white">
              <button onClick={() => toggle(m.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <MessageCircle className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold">{CHILDRENS_MEETING_TYPE_LABEL[m.type]} Meeting — {m.date}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", MOOD_COLOURS[m.overall_mood])}>{MEETING_MOOD_LABEL[m.overall_mood]}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{m.agenda.length} agenda items · {completedActs}/{m.actions.length} actions complete · {m.yp_present.length} children present</p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  {/* meeting details */}
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-gray-500">Facilitated:</span> <span className="font-medium">{getStaffName(m.facilitated_by)}</span></div>
                    <div><span className="text-gray-500">Staff:</span> <span className="font-medium">{m.staff_present.map(getStaffName).join(", ")}</span></div>
                    {m.child_chair && <div><span className="text-gray-500">Chair:</span> <span className="font-medium">{getYPName(m.child_chair)} ⭐</span></div>}
                    {m.child_minute_taker && <div><span className="text-gray-500">Minutes:</span> <span className="font-medium">{getYPName(m.child_minute_taker)}</span></div>}
                    <div><span className="text-gray-500">Snack:</span> <span className="font-medium">{m.meal_or_snack}</span></div>
                  </div>

                  {/* attendance */}
                  <div className="flex flex-wrap gap-2">
                    {m.yp_present.map((yp) => (
                      <span key={yp} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">✓ {getYPName(yp)}</span>
                    ))}
                    {m.yp_absent.map((yp) => (
                      <span key={yp} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium" title={m.absent_reasons[yp] ?? ""}>
                        ○ {getYPName(yp)} {m.absent_reasons[yp] ? `(${m.absent_reasons[yp]})` : ""}
                      </span>
                    ))}
                  </div>

                  {/* agenda items */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Agenda &amp; Discussions</h4>
                    <div className="space-y-3">
                      {m.agenda.map((a, i) => (
                        <div key={i} className="rounded-md border p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{a.topic}</span>
                            <span className="text-xs text-gray-400">raised by {a.raised_by === "Staff" ? "Staff" : a.raised_by}</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-1">{a.discussion}</p>
                          <p className="text-xs text-gray-600"><span className="font-medium">Outcome:</span> {a.outcome}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* actions */}
                  {m.actions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-2">Actions</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs text-gray-500 border-b">
                              <th className="py-2 pr-3">Action</th>
                              <th className="py-2 pr-3">Owner</th>
                              <th className="py-2 pr-3">Due</th>
                              <th className="py-2 pr-3">Status</th>
                              <th className="py-2">Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {m.actions.map((a) => (
                              <tr key={a.id} className="border-b last:border-0">
                                <td className="py-2 pr-3">{a.action}</td>
                                <td className="py-2 pr-3">{a.owner.startsWith("yp_") ? getYPName(a.owner) : getStaffName(a.owner)}</td>
                                <td className="py-2 pr-3">{a.due_date}</td>
                                <td className="py-2 pr-3">
                                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", ACTION_COLOURS[a.status])}>
                                    {a.status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                                  </span>
                                </td>
                                <td className="py-2 text-xs text-gray-500">{a.notes}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* suggestions box */}
                  {m.suggestions_box.length > 0 && (
                    <div className="rounded-md bg-pink-50 border border-pink-200 p-3">
                      <h4 className="text-xs font-semibold text-pink-700 mb-1">Suggestions Box</h4>
                      <ul className="list-disc list-inside text-sm text-pink-800 space-y-0.5">
                        {m.suggestions_box.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* complaints */}
                  {m.complaints_raised && (
                    <div className="rounded-md bg-red-50 border border-red-200 p-3">
                      <h4 className="text-xs font-semibold text-red-700 mb-1">Complaints Raised</h4>
                      <p className="text-sm text-red-800">{m.complaints_details}</p>
                    </div>
                  )}

                  {/* notes */}
                  {m.notes && (
                    <div className="rounded-md bg-gray-50 p-3">
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Meeting Notes</h4>
                      <p className="text-sm">{m.notes}</p>
                    </div>
                  )}

                  {/* next meeting */}
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Next meeting:</span> {m.next_meeting_date}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Children&apos;s Meetings — Reg 7 &amp; Reg 16:</strong> Children must be given opportunity to influence how the home is run. Regular meetings provide a structured forum for children to raise concerns, make suggestions, and participate in decisions that affect them. Meetings should be child-led where possible, with actions followed through and reported back. Children who cannot attend should be offered alternative ways to contribute. The suggestions box provides a private route for raising issues.
      </div>

      {/* ── dialog ─────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Children&apos;s Meeting</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Date</label>
                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={formType} onValueChange={(v) => setFormType(v as ChildrensMeetingType)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(CHILDRENS_MEETING_TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Facilitated By</label>
              <Select value={formFacilitator} onValueChange={setFormFacilitator}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>{["staff_darren","staff_ryan","staff_anna","staff_chervelle","staff_edward"].map((id) => <SelectItem key={id} value={id}>{getStaffName(id)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Snack / Meal</label>
              <input value={formSnack} onChange={(e) => setFormSnack(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g. Pizza and juice" />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea rows={2} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Any preparation notes…" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => { resetForm(); setDialogOpen(false); }} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
            <button onClick={onSubmit} disabled={createMut.isPending} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
              {createMut.isPending ? "Creating…" : "Create Meeting"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
