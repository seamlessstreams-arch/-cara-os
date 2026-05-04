"use client";

import { useState, useMemo } from "react";
import {
  MessageSquare,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Pin,
} from "lucide-react";
import { PageShell }    from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ── types ─────────────────────────────────────────────────────────────── */

type Priority = "routine" | "important" | "urgent" | "info";
type Category = "general" | "maintenance" | "medication" | "appointments" | "visitors" | "safeguarding" | "handover_note" | "management" | "supplies";

interface Acknowledgement {
  staffId: string;
  date: string;
}

interface CommEntry {
  id: string;
  date: string;
  time: string;
  author: string;
  priority: Priority;
  category: Category;
  subject: string;
  message: string;
  pinned: boolean;
  acknowledgedBy: Acknowledgement[];
  relatedYP: string | null;
  actionRequired: boolean;
  actionCompletedBy: string | null;
  actionCompletedDate: string | null;
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: CommEntry[] = [
  {
    id: "cb1", date: d(0), time: "07:15", author: "staff_diane",
    priority: "urgent", category: "medication",
    subject: "Alex — morning medication NOT administered",
    message: "Alex refused medication this morning saying he doesn't need it anymore. I did not force the issue. Please follow up during the day shift. SW may need to be informed if this continues. Medication returned to cabinet — count still correct.",
    pinned: true, acknowledgedBy: [
      { staffId: "staff_anna", date: d(0) },
      { staffId: "staff_edward", date: d(0) },
    ],
    relatedYP: "yp_alex", actionRequired: true, actionCompletedBy: null, actionCompletedDate: null,
  },
  {
    id: "cb2", date: d(0), time: "06:55", author: "staff_diane",
    priority: "info", category: "handover_note",
    subject: "Quiet night — all YP slept well",
    message: "Peaceful night shift. All young people settled by 10:30pm. Night checks completed at 00:00, 02:00, and 04:00 — all in rooms. No disturbances. Jordan called out at 01:15 asking for water — provided and settled back immediately. Kitchen and communal areas clean.",
    pinned: false, acknowledgedBy: [
      { staffId: "staff_anna", date: d(0) },
      { staffId: "staff_edward", date: d(0) },
    ],
    relatedYP: null, actionRequired: false, actionCompletedBy: null, actionCompletedDate: null,
  },
  {
    id: "cb3", date: d(-1), time: "14:30", author: "staff_darren",
    priority: "important", category: "management",
    subject: "Ofsted — unannounced visit possible this week",
    message: "Intelligence suggests Ofsted may be conducting unannounced visits in our area this week. Please ensure all documentation is up to date, the home is presented well, and you are prepared to answer questions about the children in your care. Remind all staff to be confident and professional. Any questions, speak to me or Ryan.",
    pinned: true, acknowledgedBy: [
      { staffId: "staff_ryan", date: d(-1) },
      { staffId: "staff_anna", date: d(-1) },
      { staffId: "staff_edward", date: d(-1) },
      { staffId: "staff_chervelle", date: d(-1) },
      { staffId: "staff_diane", date: d(-1) },
      { staffId: "staff_lackson", date: d(-1) },
      { staffId: "staff_mirela", date: d(-1) },
    ],
    relatedYP: null, actionRequired: false, actionCompletedBy: null, actionCompletedDate: null,
  },
  {
    id: "cb4", date: d(-1), time: "10:00", author: "staff_anna",
    priority: "routine", category: "appointments",
    subject: "Jordan — CAMHS appointment rescheduled",
    message: "Jordan's CAMHS appointment originally scheduled for Thursday has been moved to next Tuesday at 2pm. Same venue. I've updated the calendar. Key worker to accompany. Please ensure whoever is on shift on Tuesday is aware.",
    pinned: false, acknowledgedBy: [
      { staffId: "staff_ryan", date: d(-1) },
      { staffId: "staff_darren", date: d(-1) },
    ],
    relatedYP: "yp_jordan", actionRequired: false, actionCompletedBy: null, actionCompletedDate: null,
  },
  {
    id: "cb5", date: d(-1), time: "16:00", author: "staff_edward",
    priority: "routine", category: "maintenance",
    subject: "Upstairs bathroom — hot water intermittent",
    message: "The upstairs shared bathroom hot water is running intermittently. It works sometimes but cuts out mid-shower. I've logged it with maintenance (ref: MAINT-2025-089). In the meantime, young people can use the downstairs bathroom. Please let YP know.",
    pinned: false, acknowledgedBy: [
      { staffId: "staff_diane", date: d(-1) },
      { staffId: "staff_anna", date: d(-1) },
    ],
    relatedYP: null, actionRequired: true, actionCompletedBy: "staff_lackson", actionCompletedDate: d(0),
  },
  {
    id: "cb6", date: d(-2), time: "09:00", author: "staff_ryan",
    priority: "important", category: "visitors",
    subject: "IRO visiting Thursday — Alex's review prep",
    message: "Lisa Morton (IRO) is visiting on Thursday for Alex's LAC review. Meeting at 10am in the lounge. Please ensure lounge is tidy and refreshments available. Alex has been asked if he wants to attend — he does. Alex's views form is completed and on file. All staff who know Alex well — please be available if needed.",
    pinned: false, acknowledgedBy: [
      { staffId: "staff_darren", date: d(-2) },
      { staffId: "staff_anna", date: d(-2) },
      { staffId: "staff_edward", date: d(-2) },
    ],
    relatedYP: "yp_alex", actionRequired: false, actionCompletedBy: null, actionCompletedDate: null,
  },
  {
    id: "cb7", date: d(-3), time: "11:30", author: "staff_chervelle",
    priority: "routine", category: "supplies",
    subject: "Shopping list for this week",
    message: "Weekly shop needed: milk (6 pints), bread (white + wholemeal), chicken breasts, mince, pasta, rice, cereal (Weetabix and Coco Pops — Casey's request), fruit, veg, washing up liquid, toilet rolls. Casey also asked for ingredients for banana bread — she wants to bake on Saturday. Budget: approx £60 from petty cash.",
    pinned: false, acknowledgedBy: [
      { staffId: "staff_lackson", date: d(-3) },
    ],
    relatedYP: null, actionRequired: true, actionCompletedBy: "staff_lackson", actionCompletedDate: d(-2),
  },
  {
    id: "cb8", date: d(-4), time: "20:00", author: "staff_anna",
    priority: "important", category: "safeguarding",
    subject: "Reminder — Jordan's online safety restrictions",
    message: "Just a reminder for all staff: Jordan's Snapchat is currently suspended following the online safety incident. If Jordan asks to use Snapchat or mentions any contact from unknown people online, please log immediately and inform the on-call manager. Do NOT reinstall the app — this is pending police guidance. Jordan knows the reason and has accepted it, but may test boundaries.",
    pinned: true, acknowledgedBy: [
      { staffId: "staff_darren", date: d(-4) },
      { staffId: "staff_ryan", date: d(-4) },
      { staffId: "staff_edward", date: d(-4) },
      { staffId: "staff_diane", date: d(-4) },
      { staffId: "staff_chervelle", date: d(-4) },
    ],
    relatedYP: "yp_jordan", actionRequired: false, actionCompletedBy: null, actionCompletedDate: null,
  },
];

/* ── constants ─────────────────────────────────────────────────────────── */

const PRIORITY_META: Record<Priority, { label: string; colour: string }> = {
  urgent:    { label: "Urgent",    colour: "bg-red-100 text-red-700" },
  important: { label: "Important", colour: "bg-amber-100 text-amber-700" },
  routine:   { label: "Routine",   colour: "bg-green-100 text-green-700" },
  info:      { label: "Info",      colour: "bg-blue-100 text-blue-700" },
};

const CAT_LABELS: Record<Category, string> = {
  general: "General", maintenance: "Maintenance", medication: "Medication",
  appointments: "Appointments", visitors: "Visitors", safeguarding: "Safeguarding",
  handover_note: "Handover Note", management: "Management", supplies: "Supplies",
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function CommunicationBookPage() {
  const [data] = useState<CommEntry[]>(SEED);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showDialog, setShowDialog] = useState(false);

  const stats = useMemo(() => ({
    total: data.length,
    pinned: data.filter((e) => e.pinned).length,
    urgent: data.filter((e) => e.priority === "urgent").length,
    actionsPending: data.filter((e) => e.actionRequired && !e.actionCompletedBy).length,
    today: data.filter((e) => e.date === d(0)).length,
  }), [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterPriority !== "all") list = list.filter((e) => e.priority === filterPriority);
    if (filterCat !== "all") list = list.filter((e) => e.category === filterCat);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.subject.toLowerCase().includes(q) || e.message.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "priority": return Object.keys(PRIORITY_META).indexOf(a.priority) - Object.keys(PRIORITY_META).indexOf(b.priority);
        default: {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return b.date.localeCompare(a.date) || b.time.localeCompare(a.time);
        }
      }
    });
    return list;
  }, [data, filterPriority, filterCat, search, sortBy]);

  const exportData = useMemo(() => data.map((e) => ({
    date: e.date,
    time: e.time,
    author: getStaffName(e.author),
    priority: PRIORITY_META[e.priority].label,
    category: CAT_LABELS[e.category],
    subject: e.subject,
    message: e.message,
    pinned: e.pinned ? "Yes" : "No",
    acknowledgedBy: e.acknowledgedBy.map((a) => getStaffName(a.staffId)).join(", "),
    actionRequired: e.actionRequired ? "Yes" : "No",
    actionCompleted: e.actionCompletedBy ? `${getStaffName(e.actionCompletedBy)} on ${e.actionCompletedDate}` : "",
  })), [data]);

  const exportCols: ExportColumn<typeof exportData[number]>[] = [
    { header: "Date",           accessor: (r: typeof exportData[number]) => r.date },
    { header: "Time",           accessor: (r: typeof exportData[number]) => r.time },
    { header: "Author",         accessor: (r: typeof exportData[number]) => r.author },
    { header: "Priority",       accessor: (r: typeof exportData[number]) => r.priority },
    { header: "Category",       accessor: (r: typeof exportData[number]) => r.category },
    { header: "Subject",        accessor: (r: typeof exportData[number]) => r.subject },
    { header: "Message",        accessor: (r: typeof exportData[number]) => r.message },
    { header: "Pinned",         accessor: (r: typeof exportData[number]) => r.pinned },
    { header: "Acknowledged By",accessor: (r: typeof exportData[number]) => r.acknowledgedBy },
    { header: "Action Required", accessor: (r: typeof exportData[number]) => r.actionRequired },
    { header: "Action Completed",accessor: (r: typeof exportData[number]) => r.actionCompleted },
  ];

  return (
    <PageShell
      title="Communication Book"
      subtitle="Shift-to-shift communications, updates and action items"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="communication-book" />
          <PrintButton title="Communication Book" />
          <button onClick={() => setShowDialog(true)} className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand/90">
            <Plus className="h-4 w-4" /> New Entry
          </button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { l: "Total Entries", v: stats.total, icon: MessageSquare, c: "text-blue-600" },
            { l: "Pinned",        v: stats.pinned, icon: Pin, c: "text-purple-600" },
            { l: "Urgent",        v: stats.urgent, icon: AlertTriangle, c: stats.urgent > 0 ? "text-red-600" : "text-gray-400" },
            { l: "Actions Pending",v: stats.actionsPending, icon: Clock, c: stats.actionsPending > 0 ? "text-amber-600" : "text-gray-400" },
            { l: "Today",         v: stats.today, icon: MessageSquare, c: "text-green-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {stats.actionsPending > 0 && (
          <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800"><strong>{stats.actionsPending} action{stats.actionsPending > 1 ? "s" : ""}</strong> still pending — please check and complete.</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search entries…" className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
          </div>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {Object.entries(PRIORITY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CAT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
              <option value="date">Date (pinned first)</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>

        {filtered.map((entry) => (
          <div key={entry.id} className={cn("rounded-lg border bg-white p-4 space-y-3", entry.pinned ? "border-l-4 border-l-purple-400" : "", entry.priority === "urgent" ? "border-l-4 border-l-red-400" : "")}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                {entry.pinned && <Pin className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{entry.subject}</h3>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", PRIORITY_META[entry.priority].colour)}>{PRIORITY_META[entry.priority].label}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{CAT_LABELS[entry.category]}</span>
                    {entry.actionRequired && !entry.actionCompletedBy && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Action Required</span>}
                    {entry.actionCompletedBy && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Action Done</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{getStaffName(entry.author)} · {entry.date} at {entry.time}</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{entry.message}</p>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span className="text-muted-foreground">Read by: {entry.acknowledgedBy.length > 0 ? entry.acknowledgedBy.map((a) => getStaffName(a.staffId)).join(", ") : "None yet"}</span>
              </div>
              {entry.actionCompletedBy && (
                <span className="text-green-600">Completed by {getStaffName(entry.actionCompletedBy)} on {entry.actionCompletedDate}</span>
              )}
            </div>
          </div>
        ))}

        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Good Practice</strong> — The communication book ensures critical information is shared between shifts reliably. All staff should read and acknowledge entries at the start of every shift. Urgent and safeguarding entries must be read immediately. This supports Reg 22 (record keeping) and consistent care delivery.
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Communication Entry</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <input placeholder="Subject" className="rounded border px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <select className="rounded border px-3 py-2 text-sm"><option value="">Priority…</option>{Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
              <select className="rounded border px-3 py-2 text-sm"><option value="">Category…</option>{Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            </div>
            <textarea placeholder="Message" rows={4} className="rounded border px-3 py-2 text-sm" />
            <div className="flex gap-4">
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" className="rounded border" /> Pin this entry</label>
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" className="rounded border" /> Action required</label>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
            <button onClick={() => setShowDialog(false)} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90">Post Entry</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
