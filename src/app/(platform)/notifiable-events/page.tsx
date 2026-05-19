"use client";

import { useState, useMemo } from "react";
import {
  Bell, Plus, Search, ArrowUpDown, Filter,
  AlertTriangle, CheckCircle2, Clock, Send,
  ChevronDown, ChevronUp, Shield, FileText, Loader2, Save,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName, STAFF, YOUNG_PEOPLE } from "@/lib/seed-data";
import { useNotifiableEvents, useCreateNotifiableEvent } from "@/hooks/use-notifiable-events";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type { NotifiableEventType, NotifiableStatus, NotifiableNotification, NotifiableEvent } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { toast } from "sonner";

/* ── create form ─────────────────────────────────────────────────────── */

const EMPTY_NOTIFICATION: NotifiableNotification = {
  body: "",
  notified_date: null,
  method: "",
  reference: null,
};

function CreateNotifiableEventDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const createMutation = useCreateNotifiableEvent();
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    date: today,
    event_type: "" as NotifiableEventType | "",
    child_id: "none",
    summary: "",
    detail: "",
    immediate_action: "",
    reported_by: "staff_darren",
    follow_up: "",
    lesson_learned: "",
    ofsted_notified: false,
    ofsted_date: "",
    ofsted_method: "Phone",
    ofsted_reference: "",
    la_notified: false,
    la_date: "",
    la_method: "Phone",
    placing_notified: false,
    placing_date: "",
    placing_method: "Phone",
  });

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.event_type || !form.summary.trim() || !form.detail.trim() || !form.immediate_action.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const ofstedStatus: NotifiableStatus =
      form.ofsted_notified ? "notified_within_24h" : "pending";

    await createMutation.mutateAsync({
      date: form.date,
      event_type: form.event_type as NotifiableEventType,
      child_id: form.child_id === "none" ? null : form.child_id,
      summary: form.summary.trim(),
      detail: form.detail.trim(),
      immediate_action: form.immediate_action.trim(),
      reported_by: form.reported_by,
      ofsted_status: ofstedStatus,
      ofsted: {
        body: form.detail.trim(),
        notified_date: form.ofsted_notified ? form.ofsted_date || today : null,
        method: form.ofsted_method,
        reference: form.ofsted_reference || null,
      },
      local_authority: {
        body: form.detail.trim(),
        notified_date: form.la_notified ? form.la_date || today : null,
        method: form.la_method,
        reference: null,
      },
      placing: {
        body: form.detail.trim(),
        notified_date: form.placing_notified ? form.placing_date || today : null,
        method: form.placing_method,
        reference: null,
      },
      follow_up: form.follow_up.trim(),
      lesson_learned: form.lesson_learned.trim(),
    });

    toast.success("Notifiable event recorded. Notification tracking updated.");
    setForm({
      date: today,
      event_type: "",
      child_id: "none",
      summary: "",
      detail: "",
      immediate_action: "",
      reported_by: "staff_darren",
      follow_up: "",
      lesson_learned: "",
      ofsted_notified: false,
      ofsted_date: "",
      ofsted_method: "Phone",
      ofsted_reference: "",
      la_notified: false,
      la_date: "",
      la_method: "Phone",
      placing_notified: false,
      placing_date: "",
      placing_method: "Phone",
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-red-600" />
            Record Notifiable Event
          </DialogTitle>
          <p className="text-xs text-muted-foreground pt-1">
            Regulation 40 — Ofsted and placing authorities must be notified without delay, and within 24 hours.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* Core details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="ne-date">Date *</Label>
              <Input
                id="ne-date"
                type="date"
                value={form.date}
                max={today}
                onChange={(e) => set("date", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ne-type">Event Type *</Label>
              <Select value={form.event_type} onValueChange={(v) => set("event_type", v)}>
                <SelectTrigger id="ne-type">
                  <SelectValue placeholder="Select event type…" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{EVENT_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="ne-child">Young Person (if applicable)</Label>
              <Select value={form.child_id} onValueChange={(v) => set("child_id", v)}>
                <SelectTrigger id="ne-child">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Not child-specific —</SelectItem>
                  {YOUNG_PEOPLE.filter((y) => y.status === "current").map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.first_name} {y.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ne-reporter">Reported By *</Label>
              <Select value={form.reported_by} onValueChange={(v) => set("reported_by", v)}>
                <SelectTrigger id="ne-reporter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAFF.filter((s) => s.employment_status === "active").map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="ne-summary">Summary *</Label>
            <Input
              id="ne-summary"
              placeholder="One-sentence summary of the event…"
              value={form.summary}
              onChange={(e) => set("summary", e.target.value)}
              required
              maxLength={250}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="ne-detail">Full Detail *</Label>
            <Textarea
              id="ne-detail"
              placeholder="Full account of what happened, who was involved, where, and when…"
              value={form.detail}
              onChange={(e) => set("detail", e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="ne-action">Immediate Action Taken *</Label>
            <Textarea
              id="ne-action"
              placeholder="What immediate steps were taken to ensure the safety and welfare of the child(ren)?"
              value={form.immediate_action}
              onChange={(e) => set("immediate_action", e.target.value)}
              rows={3}
              required
            />
          </div>

          {/* Notification tracking */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-4">
            <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
              <Send className="h-4 w-4" /> Notification Tracker
            </p>

            {[
              {
                label: "Ofsted",
                notified: form.ofsted_notified,
                setNotified: (v: boolean) => set("ofsted_notified", v),
                date: form.ofsted_date,
                setDate: (v: string) => set("ofsted_date", v),
                method: form.ofsted_method,
                setMethod: (v: string) => set("ofsted_method", v),
                refField: true,
                ref: form.ofsted_reference,
                setRef: (v: string) => set("ofsted_reference", v),
              },
              {
                label: "Local Authority / LADO",
                notified: form.la_notified,
                setNotified: (v: boolean) => set("la_notified", v),
                date: form.la_date,
                setDate: (v: string) => set("la_date", v),
                method: form.la_method,
                setMethod: (v: string) => set("la_method", v),
                refField: false,
                ref: "",
                setRef: () => {},
              },
              {
                label: "Placing Authority / Social Worker",
                notified: form.placing_notified,
                setNotified: (v: boolean) => set("placing_notified", v),
                date: form.placing_date,
                setDate: (v: string) => set("placing_date", v),
                method: form.placing_method,
                setMethod: (v: string) => set("placing_method", v),
                refField: false,
                ref: "",
                setRef: () => {},
              },
            ].map((n) => (
              <div key={n.label} className="rounded-md bg-white border p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={`notified-${n.label}`}
                    checked={n.notified}
                    onChange={(e) => n.setNotified(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <label htmlFor={`notified-${n.label}`} className="text-sm font-medium cursor-pointer">
                    {n.label} notified
                  </label>
                  {n.notified ? (
                    <Badge className="ml-auto bg-green-100 text-green-800 text-xs">Notified</Badge>
                  ) : (
                    <Badge className="ml-auto bg-red-100 text-red-800 text-xs">Pending</Badge>
                  )}
                </div>
                {n.notified && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="space-y-1">
                      <Label className="text-xs">Date notified</Label>
                      <Input
                        type="date"
                        value={n.date}
                        max={today}
                        onChange={(e) => n.setDate(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Method</Label>
                      <Select value={n.method} onValueChange={n.setMethod}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["Phone", "Email", "Portal", "Letter", "In person"].map((m) => (
                            <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {n.refField && (
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Reference / Case number (optional)</Label>
                        <Input
                          value={n.ref}
                          placeholder="Ofsted reference number…"
                          onChange={(e) => n.setRef(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Follow-up and lessons */}
          <div className="space-y-1">
            <Label htmlFor="ne-followup">Follow-Up Actions</Label>
            <Textarea
              id="ne-followup"
              placeholder="What follow-up actions are required? Who is responsible? By when?"
              value={form.follow_up}
              onChange={(e) => set("follow_up", e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="ne-lessons">Lessons Learned</Label>
            <Textarea
              id="ne-lessons"
              placeholder="What have we learned? How can we prevent recurrence or improve response?"
              value={form.lesson_learned}
              onChange={(e) => set("lesson_learned", e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="bg-red-600 hover:bg-red-700">
              {createMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</>
              ) : (
                <><Save className="h-4 w-4 mr-2" /> Record Event</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
const EVENT_TYPES = [
  "death", "serious_illness", "serious_injury", "serious_incident",
  "child_protection", "police_involvement", "absconding",
  "allegation_against_staff", "restraint", "exclusion_from_school",
  "fire", "outbreak", "significant_complaint", "ofsted_referral",
] as const;
const EVENT_LABELS: Record<NotifiableEventType, string> = {
  death: "Death of a Child", serious_illness: "Serious Illness",
  serious_injury: "Serious Injury", serious_incident: "Serious Incident",
  child_protection: "Child Protection Issue", police_involvement: "Police Involvement",
  absconding: "Child Absconding", allegation_against_staff: "Allegation Against Staff",
  restraint: "Use of Restraint", exclusion_from_school: "School Exclusion",
  fire: "Fire at the Home", outbreak: "Infectious Disease Outbreak",
  significant_complaint: "Significant Complaint", ofsted_referral: "Ofsted Referral",
};

const NOTIFICATION_STATUS = ["pending", "notified_within_24h", "notified_late", "not_required"] as const;
const STATUS_COLORS: Record<NotifiableStatus, string> = {
  pending: "bg-red-100 text-red-800",
  notified_within_24h: "bg-green-100 text-green-800",
  notified_late: "bg-orange-100 text-orange-800",
  not_required: "bg-slate-100 text-[var(--cs-navy)]",
};
const STATUS_LABELS: Record<NotifiableStatus, string> = {
  pending: "Pending Notification",
  notified_within_24h: "Notified (Within 24h)",
  notified_late: "Notified (Late)",
  not_required: "Not Required",
};

/* ── component ───────────────────────────────────────────────────────── */
export default function NotifiableEventsPage() {
  const { data: neData, isLoading } = useNotifiableEvents();
  const events = neData?.data ?? [];
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    let list = [...events];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.summary.toLowerCase().includes(q) ||
          e.detail.toLowerCase().includes(q) ||
          (e.child_id && getYPName(e.child_id).toLowerCase().includes(q))
      );
    }
    if (filterType !== "all") list = list.filter((e) => e.event_type === filterType);
    if (filterStatus !== "all") list = list.filter((e) => e.ofsted_status === filterStatus);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.date.localeCompare(a.date);
        case "type": return a.event_type.localeCompare(b.event_type);
        case "status": return NOTIFICATION_STATUS.indexOf(a.ofsted_status) - NOTIFICATION_STATUS.indexOf(b.ofsted_status);
        default: return 0;
      }
    });
    return list;
  }, [events, search, filterType, filterStatus, sortBy]);

  const total = events.length;
  const pending = events.filter((e) => e.ofsted_status === "pending").length;
  const notifiedOnTime = events.filter((e) => e.ofsted_status === "notified_within_24h").length;
  const late = events.filter((e) => e.ofsted_status === "notified_late").length;

  const exportCols: ExportColumn<NotifiableEvent>[] = [
    { header: "ID", accessor: (r: NotifiableEvent) => r.id },
    { header: "Date", accessor: (r: NotifiableEvent) => r.date },
    { header: "Event Type", accessor: (r: NotifiableEvent) => EVENT_LABELS[r.event_type] },
    { header: "Young Person", accessor: (r: NotifiableEvent) => r.child_id ? getYPName(r.child_id) : "General" },
    { header: "Summary", accessor: (r: NotifiableEvent) => r.summary },
    { header: "Ofsted Status", accessor: (r: NotifiableEvent) => STATUS_LABELS[r.ofsted_status] },
    { header: "Ofsted Ref", accessor: (r: NotifiableEvent) => r.ofsted.reference ?? "" },
    { header: "Ofsted Notified", accessor: (r: NotifiableEvent) => r.ofsted.notified_date ?? "Pending" },
    { header: "LA Notified", accessor: (r: NotifiableEvent) => r.local_authority.notified_date ?? "Pending" },
    { header: "SW Notified", accessor: (r: NotifiableEvent) => r.placing.notified_date ?? "Pending" },
    { header: "Immediate Action", accessor: (r: NotifiableEvent) => r.immediate_action },
    { header: "Follow-Up", accessor: (r: NotifiableEvent) => r.follow_up },
    { header: "Lessons Learned", accessor: (r: NotifiableEvent) => r.lesson_learned },
    { header: "Reported By", accessor: (r: NotifiableEvent) => getStaffName(r.reported_by) },
  ];

  return (
    <PageShell
      title="Notifiable Events"
      subtitle="Regulation 40 — events requiring notification to Ofsted and authorities"
      ariaContext={{ pageTitle: "Notifiable Events", sourceType: "incident" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Notifiable Events" />
          <ExportButton data={filtered} columns={exportCols} filename="notifiable-events" />
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-2" /> Record Event
          </Button>
          <AriaStudioQuickActionButton context={{ record_type: "management_oversight", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <AriaPanel mode="assist" pageContext="Notifiable Events — Regulation 40 events requiring potential Ofsted notification, serious incidents, missing episodes, injuries" recordType="notifiable_event" userRole="registered_manager" className="mb-2" />
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Events", value: total, icon: Bell, colour: "text-blue-600" },
            { label: "Pending Notification", value: pending, icon: Clock, colour: pending > 0 ? "text-red-600" : "text-green-600" },
            { label: "Notified On Time", value: notifiedOnTime, icon: CheckCircle2, colour: "text-green-600" },
            { label: "Notified Late", value: late, icon: AlertTriangle, colour: late > 0 ? "text-orange-600" : "text-[var(--cs-text-muted)]" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── alerts ────────────────────────────────────────────── */}
        {pending > 0 && (
          <div className="rounded-lg border-l-4 border-red-400 bg-red-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800">
                <strong>{pending}</strong> event(s) pending Ofsted notification — Regulation 40 requires
                notification without delay and within 24 hours.
              </p>
            </div>
          </div>
        )}

        {/* ── filters ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events, young people…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Event Types</SelectItem>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{EVENT_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {NOTIFICATION_STATUS.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Recent)</SelectItem>
                <SelectItem value="type">Event Type</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── list ──────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading events…</span>
          </div>
        ) : (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No events match your filters.</div>
          )}
          {filtered.map((evt) => {
            const isExpanded = expanded === evt.id;
            return (
              <div key={evt.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : evt.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Shield className={cn("h-5 w-5 shrink-0",
                      evt.ofsted_status === "pending" ? "text-red-600" :
                      evt.ofsted_status === "notified_late" ? "text-orange-600" : "text-blue-600"
                    )} />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{EVENT_LABELS[evt.event_type]}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {evt.date} · {evt.child_id ? getYPName(evt.child_id) : "General"} · {getStaffName(evt.reported_by)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-xs", STATUS_COLORS[evt.ofsted_status])}>
                      {STATUS_LABELS[evt.ofsted_status]}
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Summary</p>
                      <p className="text-sm">{evt.summary}</p>
                    </div>
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Full Detail</p>
                      <p className="text-sm">{evt.detail}</p>
                    </div>
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs font-medium text-blue-700 mb-1">Immediate Action Taken</p>
                      <p className="text-sm">{evt.immediate_action}</p>
                    </div>

                    {/* notification tracker */}
                    <div>
                      <p className="text-sm font-medium mb-2">Notification Tracker</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {[
                          { label: "Ofsted", data: evt.ofsted },
                          { label: "Local Authority / LADO", data: evt.local_authority },
                          { label: "Placing Authority / SW", data: evt.placing },
                        ].map((n) => (
                          <div key={n.label} className={cn("rounded-lg border p-2.5 text-sm",
                            n.data.notified_date ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                          )}>
                            <div className="flex items-center gap-1 mb-1">
                              {n.data.notified_date ? (
                                <Send className="h-3 w-3 text-green-600" />
                              ) : (
                                <Clock className="h-3 w-3 text-red-600" />
                              )}
                              <span className="font-medium">{n.label}</span>
                            </div>
                            {n.data.notified_date ? (
                              <div className="text-xs text-muted-foreground">
                                <p>Notified: {n.data.notified_date}</p>
                                <p>Method: {n.data.method}</p>
                                {n.data.reference && <p>Ref: {n.data.reference}</p>}
                              </div>
                            ) : (
                              <p className="text-xs text-red-700 font-medium">Pending</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <p className="text-xs font-medium text-amber-700 mb-1">Follow-Up Actions</p>
                      <p className="text-sm">{evt.follow_up}</p>
                    </div>

                    <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <FileText className="h-4 w-4 text-green-600" />
                        <p className="text-xs font-medium text-green-700">Lessons Learned</p>
                      </div>
                      <p className="text-sm">{evt.lesson_learned}</p>
                    </div>

                    {evt.child_id && <SmartLinkPanel sourceType="notifiable_event" sourceId={evt.id} childId={evt.child_id} compact />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Regulation 40:</strong> The registered person must notify Ofsted and relevant authorities
          without delay (and within 24 hours) of any event listed in Schedule 5 of the Children&apos;s Homes
          (England) Regulations 2015. This includes death, serious harm, involvement of police, use of
          restraint, allegations against staff, and any event that significantly affects the welfare of a child.
        </div>
      </div>

      <CreateNotifiableEventDialog open={showNew} onClose={() => setShowNew(false)} />
      <CareEventsPanel
        title="Care Events — Safeguarding & Behaviour"
        category={["safeguarding", "behaviour", "missing_episode", "physical_intervention"]}
        days={90}
        defaultCollapsed
      />
    </PageShell>
  );
}
