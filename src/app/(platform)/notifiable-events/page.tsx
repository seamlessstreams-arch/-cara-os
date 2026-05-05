"use client";

import { useState, useMemo } from "react";
import {
  Bell, Plus, Search, ArrowUpDown, Filter,
  AlertTriangle, CheckCircle2, Clock, Send,
  ChevronDown, ChevronUp, Shield, FileText, Loader2,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
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
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useNotifiableEvents } from "@/hooks/use-notifiable-events";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type { NotifiableEventType, NotifiableStatus, NotifiableNotification, NotifiableEvent } from "@/types/extended";

/* ── types ───────────────────────────────────────────────────────────── */
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
  not_required: "bg-slate-100 text-slate-800",
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
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Notifiable Events" />
          <ExportButton data={filtered} columns={exportCols} filename="notifiable-events" />
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-2" /> Record Event
          </Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Events", value: total, icon: Bell, colour: "text-blue-600" },
            { label: "Pending Notification", value: pending, icon: Clock, colour: pending > 0 ? "text-red-600" : "text-green-600" },
            { label: "Notified On Time", value: notifiedOnTime, icon: CheckCircle2, colour: "text-green-600" },
            { label: "Notified Late", value: late, icon: AlertTriangle, colour: late > 0 ? "text-orange-600" : "text-slate-400" },
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
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
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

      {/* ── placeholder dialog ──────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Notifiable Event</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center text-muted-foreground text-sm">
            <Bell className="h-10 w-10 mx-auto mb-3 text-red-300" />
            <p>Full form will capture event type, details,</p>
            <p>notification tracking, and follow-up actions.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
