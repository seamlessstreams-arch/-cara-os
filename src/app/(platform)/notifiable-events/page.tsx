"use client";

import { useState, useMemo } from "react";
import {
  Bell, Plus, Search, ArrowUpDown, Filter,
  AlertTriangle, CheckCircle2, Clock, Send,
  ChevronDown, ChevronUp, Shield, FileText,
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

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ───────────────────────────────────────────────────────────── */
const EVENT_TYPES = [
  "death", "serious_illness", "serious_injury", "serious_incident",
  "child_protection", "police_involvement", "absconding",
  "allegation_against_staff", "restraint", "exclusion_from_school",
  "fire", "outbreak", "significant_complaint", "ofsted_referral",
] as const;
type EventType = typeof EVENT_TYPES[number];
const EVENT_LABELS: Record<EventType, string> = {
  death: "Death of a Child", serious_illness: "Serious Illness",
  serious_injury: "Serious Injury", serious_incident: "Serious Incident",
  child_protection: "Child Protection Issue", police_involvement: "Police Involvement",
  absconding: "Child Absconding", allegation_against_staff: "Allegation Against Staff",
  restraint: "Use of Restraint", exclusion_from_school: "School Exclusion",
  fire: "Fire at the Home", outbreak: "Infectious Disease Outbreak",
  significant_complaint: "Significant Complaint", ofsted_referral: "Ofsted Referral",
};

const NOTIFICATION_STATUS = ["pending", "notified_within_24h", "notified_late", "not_required"] as const;
type NotificationStatus = typeof NOTIFICATION_STATUS[number];
const STATUS_COLORS: Record<NotificationStatus, string> = {
  pending: "bg-red-100 text-red-800",
  notified_within_24h: "bg-green-100 text-green-800",
  notified_late: "bg-orange-100 text-orange-800",
  not_required: "bg-slate-100 text-slate-800",
};
const STATUS_LABELS: Record<NotificationStatus, string> = {
  pending: "Pending Notification",
  notified_within_24h: "Notified (Within 24h)",
  notified_late: "Notified (Late)",
  not_required: "Not Required",
};

interface Notification {
  body: string;
  notifiedDate: string | null;
  method: string;
  reference: string | null;
}

interface NotifiableEvent {
  id: string;
  date: string;
  eventType: EventType;
  youngPersonId: string | null;
  summary: string;
  detail: string;
  immediateAction: string;
  reportedBy: string;
  ofstedStatus: NotificationStatus;
  ofsted: Notification;
  localAuthority: Notification;
  placing: Notification;
  followUp: string;
  lessonLearned: string;
}

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: NotifiableEvent[] = [
  {
    id: "ne_1", date: d(-4), eventType: "restraint",
    youngPersonId: "yp_alex",
    summary: "Physical restraint used following escalation — Alex attempted to leave building at night in distressed state.",
    detail: "Alex received upsetting social media messages at approximately 02:15. Became highly distressed and attempted to leave the building barefoot in cold weather. De-escalation attempted for 15 minutes. Two staff used team-teach hold for approximately 4 minutes until Alex calmed.",
    immediateAction: "Post-incident debrief conducted. Alex checked by staff (no injuries). Parents notified next morning. Body map completed. Restraint log entry made.",
    reportedBy: "staff_darren",
    ofstedStatus: "notified_within_24h",
    ofsted: { body: "Ofsted", notifiedDate: d(-3), method: "Online Form", reference: "OFST-2026-4412" },
    localAuthority: { body: "Designated Officer", notifiedDate: d(-3), method: "Email", reference: null },
    placing: { body: "Sarah Mitchell (SW)", notifiedDate: d(-4), method: "Phone", reference: null },
    followUp: "Key work session completed. Phone boundaries reviewed. CAMHS referral being considered. Team debrief scheduled.",
    lessonLearned: "Earlier intervention on phone use may have prevented escalation. Evening routine adjusted to collect phones by 21:00.",
  },
  {
    id: "ne_2", date: d(-15), eventType: "absconding",
    youngPersonId: "yp_alex",
    summary: "Alex left school without permission and was located at local park approximately 90 minutes later.",
    detail: "Alex left school at approximately 10:00 without staff knowledge. School contacted the home at 10:30 when absence was noticed during lesson. Staff located Alex at nearby park at 11:00. Alex returned voluntarily. Reason given: bullying concerns in a specific class.",
    immediateAction: "Alex returned to home safely. Welfare check completed. School meeting arranged. Missing from education protocol reviewed.",
    reportedBy: "staff_anna",
    ofstedStatus: "not_required",
    ofsted: { body: "Ofsted", notifiedDate: null, method: "", reference: null },
    localAuthority: { body: "Local Authority", notifiedDate: d(-15), method: "Email", reference: null },
    placing: { body: "Sarah Mitchell (SW)", notifiedDate: d(-15), method: "Phone", reference: null },
    followUp: "Meeting with school held. Class change being arranged. Anti-bullying plan developed. Alex's views recorded.",
    lessonLearned: "School communication protocol reviewed to ensure faster notification. Alex given safe phrase to use if feeling unsafe at school.",
  },
  {
    id: "ne_3", date: d(-30), eventType: "allegation_against_staff",
    youngPersonId: null,
    summary: "Anonymous allegation received via Ofsted — alleged shouting by staff member. Investigation found no evidence to support claim.",
    detail: "Ofsted forwarded an anonymous complaint alleging a staff member shouted at a young person during a mealtime. Internal investigation conducted. CCTV reviewed (kitchen area covered). All three young people interviewed individually. No corroborating evidence found. Staff member cooperated fully.",
    immediateAction: "Staff member supported during investigation. Young people spoken to individually. LADO consulted. Investigation completed within 10 working days.",
    reportedBy: "staff_darren",
    ofstedStatus: "notified_within_24h",
    ofsted: { body: "Ofsted", notifiedDate: d(-29), method: "Online Form + Phone", reference: "OFST-2026-3890" },
    localAuthority: { body: "LADO", notifiedDate: d(-30), method: "Phone + Email", reference: "LADO-2026-0221" },
    placing: { body: "All placing SWs", notifiedDate: d(-29), method: "Email", reference: null },
    followUp: "Investigation report filed. Staff member's supervision record updated. LADO confirmed no further action. Ofsted satisfied with response.",
    lessonLearned: "All staff reminded of professional conduct expectations. Additional awareness training on managing mealtimes positively.",
  },
  {
    id: "ne_4", date: d(-2), eventType: "serious_illness",
    youngPersonId: "yp_casey",
    summary: "Casey experienced severe anxiety episode requiring assessment at A&E. Discharged same day with follow-up plan.",
    detail: "Casey experienced an acute anxiety episode during the evening. Hyperventilating, chest pains, and inability to communicate. First aid administered. As symptoms did not resolve within 20 minutes, decision made to take Casey to A&E for assessment.",
    immediateAction: "Staff accompanied Casey to hospital. Mother notified and attended. A&E assessed — anxiety-related, no physical cause. Discharged with advice to contact CAMHS urgently.",
    reportedBy: "staff_chervelle",
    ofstedStatus: "pending",
    ofsted: { body: "Ofsted", notifiedDate: null, method: "", reference: null },
    localAuthority: { body: "Local Authority", notifiedDate: d(-2), method: "Phone", reference: null },
    placing: { body: "Lisa Park (SW)", notifiedDate: d(-2), method: "Phone", reference: null },
    followUp: "Urgent CAMHS appointment requested. Care plan updated. Staff debrief held. Casey's anxiety support plan to be reviewed.",
    lessonLearned: "Team to receive refresher training on supporting acute anxiety. Emergency medication discussion with CAMHS.",
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function NotifiableEventsPage() {
  const [events] = useState<NotifiableEvent[]>(SEED);
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
          (e.youngPersonId && getYPName(e.youngPersonId).toLowerCase().includes(q))
      );
    }
    if (filterType !== "all") list = list.filter((e) => e.eventType === filterType);
    if (filterStatus !== "all") list = list.filter((e) => e.ofstedStatus === filterStatus);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.date.localeCompare(a.date);
        case "type": return a.eventType.localeCompare(b.eventType);
        case "status": return NOTIFICATION_STATUS.indexOf(a.ofstedStatus) - NOTIFICATION_STATUS.indexOf(b.ofstedStatus);
        default: return 0;
      }
    });
    return list;
  }, [events, search, filterType, filterStatus, sortBy]);

  const total = events.length;
  const pending = events.filter((e) => e.ofstedStatus === "pending").length;
  const notifiedOnTime = events.filter((e) => e.ofstedStatus === "notified_within_24h").length;
  const late = events.filter((e) => e.ofstedStatus === "notified_late").length;

  const exportCols: ExportColumn<NotifiableEvent>[] = [
    { header: "ID", accessor: (r: NotifiableEvent) => r.id },
    { header: "Date", accessor: (r: NotifiableEvent) => r.date },
    { header: "Event Type", accessor: (r: NotifiableEvent) => EVENT_LABELS[r.eventType] },
    { header: "Young Person", accessor: (r: NotifiableEvent) => r.youngPersonId ? getYPName(r.youngPersonId) : "General" },
    { header: "Summary", accessor: (r: NotifiableEvent) => r.summary },
    { header: "Ofsted Status", accessor: (r: NotifiableEvent) => STATUS_LABELS[r.ofstedStatus] },
    { header: "Ofsted Ref", accessor: (r: NotifiableEvent) => r.ofsted.reference ?? "" },
    { header: "Ofsted Notified", accessor: (r: NotifiableEvent) => r.ofsted.notifiedDate ?? "Pending" },
    { header: "LA Notified", accessor: (r: NotifiableEvent) => r.localAuthority.notifiedDate ?? "Pending" },
    { header: "SW Notified", accessor: (r: NotifiableEvent) => r.placing.notifiedDate ?? "Pending" },
    { header: "Immediate Action", accessor: (r: NotifiableEvent) => r.immediateAction },
    { header: "Follow-Up", accessor: (r: NotifiableEvent) => r.followUp },
    { header: "Lessons Learned", accessor: (r: NotifiableEvent) => r.lessonLearned },
    { header: "Reported By", accessor: (r: NotifiableEvent) => getStaffName(r.reportedBy) },
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
                      evt.ofstedStatus === "pending" ? "text-red-600" :
                      evt.ofstedStatus === "notified_late" ? "text-orange-600" : "text-blue-600"
                    )} />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{EVENT_LABELS[evt.eventType]}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {evt.date} · {evt.youngPersonId ? getYPName(evt.youngPersonId) : "General"} · {getStaffName(evt.reportedBy)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-xs", STATUS_COLORS[evt.ofstedStatus])}>
                      {STATUS_LABELS[evt.ofstedStatus]}
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
                      <p className="text-sm">{evt.immediateAction}</p>
                    </div>

                    {/* notification tracker */}
                    <div>
                      <p className="text-sm font-medium mb-2">Notification Tracker</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {[
                          { label: "Ofsted", data: evt.ofsted },
                          { label: "Local Authority / LADO", data: evt.localAuthority },
                          { label: "Placing Authority / SW", data: evt.placing },
                        ].map((n) => (
                          <div key={n.label} className={cn("rounded-lg border p-2.5 text-sm",
                            n.data.notifiedDate ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                          )}>
                            <div className="flex items-center gap-1 mb-1">
                              {n.data.notifiedDate ? (
                                <Send className="h-3 w-3 text-green-600" />
                              ) : (
                                <Clock className="h-3 w-3 text-red-600" />
                              )}
                              <span className="font-medium">{n.label}</span>
                            </div>
                            {n.data.notifiedDate ? (
                              <div className="text-xs text-muted-foreground">
                                <p>Notified: {n.data.notifiedDate}</p>
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
                      <p className="text-sm">{evt.followUp}</p>
                    </div>

                    <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <FileText className="h-4 w-4 text-green-600" />
                        <p className="text-xs font-medium text-green-700">Lessons Learned</p>
                      </div>
                      <p className="text-sm">{evt.lessonLearned}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

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
