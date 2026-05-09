"use client";

import { useState, useMemo, useRef } from "react";
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
import type {
  CommunicationBookEntry,
  CommunicationPriority,
  CommunicationCategory,
} from "@/types/extended";
import {
  useCommunicationBookEntries,
  useCreateCommunicationBookEntry,
} from "@/hooks/use-communication-book-entries";
import { toast } from "sonner";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── constants ─────────────────────────────────────────────────────────── */

const PRIORITY_META: Record<CommunicationPriority, { label: string; colour: string }> = {
  urgent:    { label: "Urgent",    colour: "bg-red-100 text-red-700" },
  important: { label: "Important", colour: "bg-amber-100 text-amber-700" },
  routine:   { label: "Routine",   colour: "bg-green-100 text-green-700" },
  info:      { label: "Info",      colour: "bg-blue-100 text-blue-700" },
};

const CAT_LABELS: Record<CommunicationCategory, string> = {
  general: "General", maintenance: "Maintenance", medication: "Medication",
  appointments: "Appointments", visitors: "Visitors", safeguarding: "Safeguarding",
  handover_note: "Handover Note", management: "Management", supplies: "Supplies",
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function CommunicationBookPage() {
  const { data: res, isLoading } = useCommunicationBookEntries();
  const items = res?.data ?? [];
  const createMut = useCreateCommunicationBookEntry();

  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showDialog, setShowDialog] = useState(false);

  /* form refs */
  const subjectRef   = useRef<HTMLInputElement>(null);
  const priorityRef  = useRef<HTMLSelectElement>(null);
  const categoryRef  = useRef<HTMLSelectElement>(null);
  const messageRef   = useRef<HTMLTextAreaElement>(null);
  const pinnedRef    = useRef<HTMLInputElement>(null);
  const actionRef    = useRef<HTMLInputElement>(null);

  const todayStr = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => ({
    total: items.length,
    pinned: items.filter((e) => e.pinned).length,
    urgent: items.filter((e) => e.priority === "urgent").length,
    actionsPending: items.filter((e) => e.action_required && !e.action_completed_by).length,
    today: items.filter((e) => e.date === todayStr).length,
  }), [items, todayStr]);

  const filtered = useMemo(() => {
    let list = [...items];
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
  }, [items, filterPriority, filterCat, search, sortBy]);

  const exportData = useMemo(() => items.map((e) => ({
    date: e.date,
    time: e.time,
    author: getStaffName(e.author),
    priority: PRIORITY_META[e.priority].label,
    category: CAT_LABELS[e.category],
    subject: e.subject,
    message: e.message,
    pinned: e.pinned ? "Yes" : "No",
    acknowledgedBy: e.acknowledged_by.map((a) => getStaffName(a.staff_id)).join(", "),
    actionRequired: e.action_required ? "Yes" : "No",
    actionCompleted: e.action_completed_by ? `${getStaffName(e.action_completed_by)} on ${e.action_completed_date}` : "",
  })), [items]);

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

  async function handleCreate() {
    const subject  = subjectRef.current?.value.trim();
    const priority = priorityRef.current?.value as CommunicationPriority | undefined;
    const category = categoryRef.current?.value as CommunicationCategory | undefined;
    const message  = messageRef.current?.value.trim();
    const pinned   = pinnedRef.current?.checked ?? false;
    const actionRequired = actionRef.current?.checked ?? false;

    if (!subject || !priority || !category || !message) return;

    await createMut.mutateAsync({
      subject,
      priority,
      category,
      message,
      pinned,
      action_required: actionRequired,
    });
    toast.success("Entry posted");
    setShowDialog(false);
  }

  if (isLoading) {
    return <PageShell title="Communication Book" subtitle="Shift-to-shift communications, updates and action items"><div /></PageShell>;
  }

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
                    {entry.action_required && !entry.action_completed_by && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Action Required</span>}
                    {entry.action_completed_by && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Action Done</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{getStaffName(entry.author)} · {entry.date} at {entry.time}</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{entry.message}</p>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span className="text-muted-foreground">Read by: {entry.acknowledged_by.length > 0 ? entry.acknowledged_by.map((a) => getStaffName(a.staff_id)).join(", ") : "None yet"}</span>
              </div>
              {entry.action_completed_by && (
                <span className="text-green-600">Completed by {getStaffName(entry.action_completed_by)} on {entry.action_completed_date}</span>
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
            <input ref={subjectRef} placeholder="Subject" className="rounded border px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <select ref={priorityRef} className="rounded border px-3 py-2 text-sm"><option value="">Priority…</option>{Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
              <select ref={categoryRef} className="rounded border px-3 py-2 text-sm"><option value="">Category…</option>{Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            </div>
            <textarea ref={messageRef} placeholder="Message" rows={4} className="rounded border px-3 py-2 text-sm" />
            <div className="flex gap-4">
              <label className="flex items-center gap-1 text-sm"><input ref={pinnedRef} type="checkbox" className="rounded border" /> Pin this entry</label>
              <label className="flex items-center gap-1 text-sm"><input ref={actionRef} type="checkbox" className="rounded border" /> Action required</label>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
            <button onClick={handleCreate} disabled={createMut.isPending} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90">
              {createMut.isPending ? "Posting…" : "Post Entry"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
