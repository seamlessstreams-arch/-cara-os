"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { FlatList, FlatListRow, FlatListRowDetail, type RowSeverity } from "@/components/ui/list-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName, YOUNG_PEOPLE } from "@/lib/seed-data";
import {
  ArrowUpDown, ChevronDown, ChevronUp, Plus, Search,
  Flag, AlertTriangle, CheckCircle2, Clock, Calendar,
  Star, Heart, Shield, Bell, Users, Loader2
} from "lucide-react";
import { useSignificantEvents, useCreateSignificantEvent } from "@/hooks/use-significant-events";
import { toast } from "sonner";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type { SigEventCategory, SigEventSeverity, SigEventNotifyStatus, SignificantEvent } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";


const CATEGORY_META: Record<SigEventCategory, { label: string; icon: React.ReactNode; color: string }> = {
  positive_achievement: { label: "Positive Achievement", icon: <Star className="h-4 w-4" />,          color: "bg-green-100 text-green-800" },
  placement_change:     { label: "Placement Change",     icon: <Users className="h-4 w-4" />,         color: "bg-blue-100 text-blue-800" },
  health_event:         { label: "Health Event",         icon: <Heart className="h-4 w-4" />,         color: "bg-pink-100 text-pink-800" },
  safeguarding:         { label: "Safeguarding",         icon: <Shield className="h-4 w-4" />,        color: "bg-red-100 text-red-800" },
  legal_court:          { label: "Legal / Court",        icon: <Flag className="h-4 w-4" />,          color: "bg-purple-100 text-purple-800" },
  family_event:         { label: "Family Event",         icon: <Heart className="h-4 w-4" />,         color: "bg-amber-100 text-amber-800" },
  education_milestone:  { label: "Education Milestone",  icon: <Star className="h-4 w-4" />,          color: "bg-indigo-100 text-indigo-800" },
  behavioural:          { label: "Behavioural",          icon: <AlertTriangle className="h-4 w-4" />, color: "bg-orange-100 text-orange-800" },
  disclosure:           { label: "Disclosure",           icon: <Bell className="h-4 w-4" />,          color: "bg-rose-100 text-rose-800" },
  other:                { label: "Other",                icon: <Flag className="h-4 w-4" />,          color: "bg-gray-100 text-gray-800" },
};

const SEVERITY_META: Record<SigEventSeverity, { label: string; color: string }> = {
  positive:   { label: "Positive",    color: "bg-[--cs-success-bg] text-[--cs-success]" },
  routine:    { label: "Routine",     color: "bg-[--cs-info-bg] text-[--cs-info]" },
  concerning: { label: "Concerning",  color: "bg-[--cs-warning-bg] text-[--cs-warning]" },
  serious:    { label: "Serious",     color: "bg-orange-100 text-orange-700" },
  critical:   { label: "Critical",    color: "bg-[--cs-risk-bg] text-[--cs-risk]" },
};

const SEVERITY_ROW: Record<SigEventSeverity, RowSeverity> = {
  positive: "success", routine: "info", concerning: "warning", serious: "risk", critical: "risk",
};
const SEVERITY_TEXT: Record<SigEventSeverity, string> = {
  positive: "text-[--cs-success]", routine: "text-[--cs-info]", concerning: "text-[--cs-warning]",
  serious: "text-orange-700", critical: "text-[--cs-risk]",
};


// ── Export ────────────────────────────────────────────────────────────────────
const EXPORT_COLS: ExportColumn<SignificantEvent>[] = [
  { header: "ID",              accessor: (r: SignificantEvent) => r.id },
  { header: "Young Person",    accessor: (r: SignificantEvent) => getYPName(r.child_id) },
  { header: "Date",            accessor: (r: SignificantEvent) => r.date },
  { header: "Time",            accessor: (r: SignificantEvent) => r.time },
  { header: "Category",        accessor: (r: SignificantEvent) => CATEGORY_META[r.category].label },
  { header: "Severity",        accessor: (r: SignificantEvent) => SEVERITY_META[r.severity].label },
  { header: "Title",           accessor: (r: SignificantEvent) => r.title },
  { header: "Description",     accessor: (r: SignificantEvent) => r.description },
  { header: "Immediate Action",accessor: (r: SignificantEvent) => r.immediate_action },
  { header: "Child Response",  accessor: (r: SignificantEvent) => r.child_response },
  { header: "Outcome",         accessor: (r: SignificantEvent) => r.outcome },
  { header: "Staff Present",   accessor: (r: SignificantEvent) => r.staff_present.map(getStaffName).join(", ") },
  { header: "Notifications",   accessor: (r: SignificantEvent) => r.notifications.map((n: { party: string; status: string }) => `${n.party}: ${n.status}`).join("; ") },
  { header: "Follow Up",       accessor: (r: SignificantEvent) => r.follow_up_actions || "—" },
  { header: "Recorded By",     accessor: (r: SignificantEvent) => getStaffName(r.recorded_by) },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function SignificantEventsPage() {
  const { data: seData, isLoading } = useSignificantEvents();
  const createEvent = useCreateSignificantEvent();
  const events = seData?.data ?? [];
  const threeDaysOut = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const [seForm, setSeForm] = useState({ child_id: "", date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5), category: "other" as SigEventCategory, severity: "routine" as SigEventSeverity, title: "", description: "", immediate_action: "", child_response: "" });
  const setSEF = (k: keyof typeof seForm, v: string) => setSeForm((p) => ({ ...p, [k]: v }));

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seForm.child_id) { toast.error("Please select a young person."); return; }
    if (!seForm.title.trim()) { toast.error("Title is required."); return; }
    await createEvent.mutateAsync({ child_id: seForm.child_id, date: seForm.date, time: seForm.time, category: seForm.category, severity: seForm.severity, title: seForm.title.trim(), description: seForm.description.trim(), immediate_action: seForm.immediate_action.trim(), staff_present: ["staff_darren"], witnessed_by: [], child_response: seForm.child_response.trim(), outcome: "", notifications: [], follow_up_required: false, follow_up_actions: "", follow_up_date: "", linked_documents: [], recorded_by: "staff_darren", created_at: new Date().toISOString() });
    toast.success("Significant event recorded.");
    setSeForm({ child_id: "", date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5), category: "other", severity: "routine", title: "", description: "", immediate_action: "", child_response: "" });
    setShowNew(false);
  };

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const children = useMemo(() => {
    const ids = [...new Set(events.map((e) => e.child_id))];
    return ids.map((id) => ({ id, name: getYPName(id) }));
  }, [events]);

  const filtered = useMemo(() => {
    let list = [...events];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(s) || e.description.toLowerCase().includes(s));
    }
    if (childFilter !== "all") list = list.filter((e) => e.child_id === childFilter);
    if (categoryFilter !== "all") list = list.filter((e) => e.category === categoryFilter);
    if (severityFilter !== "all") list = list.filter((e) => e.severity === severityFilter);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date":     return b.date.localeCompare(a.date);
        case "category": return CATEGORY_META[a.category].label.localeCompare(CATEGORY_META[b.category].label);
        case "severity": return a.severity.localeCompare(b.severity);
        case "child":    return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        default:         return 0;
      }
    });
    return list;
  }, [events, search, childFilter, categoryFilter, severityFilter, sortBy]);

  const stats = useMemo(() => {
    const total = events.length;
    const positive = events.filter((e) => e.severity === "positive").length;
    const serious = events.filter((e) => e.severity === "serious" || e.severity === "critical").length;
    const pendingFollowUp = events.filter((e) => e.follow_up_required && e.follow_up_date && e.follow_up_date <= threeDaysOut).length;
    const pendingNotifications = events.flatMap((e) => e.notifications).filter((n) => n.status === "pending").length;
    return { total, positive, serious, pendingFollowUp, pendingNotifications };
  }, [events]);

  if (isLoading) {
    return (
      <PageShell title="Significant Events" subtitle="Recording and tracking important events in each child's journey">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Significant Events"
      subtitle="Recording and tracking important events in each child&apos;s journey"
      caraContext={{ pageTitle: "Significant Events", sourceType: "incident" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Significant Events" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="significant-events" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Record Event</Button>
          <CaraStudioQuickActionButton context={{ record_type: "incident", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <CaraPanel mode="assist" pageContext="Significant Events — important milestones, positive and negative events, statutory notifications, life story recording" recordType="significant_event" userRole="registered_manager" className="mb-2" />
        {/* ── Stats strip ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Events",        value: stats.total,                icon: <Flag className="h-4 w-4" />,          color: "text-blue-600" },
            { label: "Positive",            value: stats.positive,             icon: <Star className="h-4 w-4" />,          color: "text-[--cs-success]" },
            { label: "Serious / Critical",  value: stats.serious,              icon: <AlertTriangle className="h-4 w-4" />, color: "text-[--cs-risk]" },
            { label: "Follow-Up Due",       value: stats.pendingFollowUp,      icon: <Clock className="h-4 w-4" />,         color: "text-amber-600" },
            { label: "Pending Notifications",value: stats.pendingNotifications,icon: <Bell className="h-4 w-4" />,          color: "text-purple-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-muted", s.color)}>{s.icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Alert banner ─────────────────────────────────────────────────── */}
        {(stats.pendingNotifications > 0 || stats.pendingFollowUp > 0) && (
          <Card className="border-[--cs-warning-soft] bg-[--cs-warning-bg]">
            <CardContent className="p-3 flex items-center gap-2 text-sm text-[--cs-warning]">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                {stats.pendingNotifications > 0 && <><strong>{stats.pendingNotifications}</strong> notification{stats.pendingNotifications !== 1 && "s"} pending. </>}
                {stats.pendingFollowUp > 0 && <><strong>{stats.pendingFollowUp}</strong> follow-up action{stats.pendingFollowUp !== 1 && "s"} due within 3 days.</>}
              </span>
            </CardContent>
          </Card>
        )}

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search events…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={childFilter} onValueChange={setChildFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Child" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {children.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CATEGORY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {Object.entries(SEVERITY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="severity">Severity</SelectItem>
                <SelectItem value="child">Child</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Event list ───────────────────────────────────────────────────── */}
        <FlatList>
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No events match your filters.</p>}
          {filtered.map((e) => {
            const open = !!expanded[e.id];
            const catM = CATEGORY_META[e.category];
            const followUpDue = e.follow_up_required && e.follow_up_date && e.follow_up_date <= threeDaysOut;
            return (
              <div key={e.id}>
                <FlatListRow severity={SEVERITY_ROW[e.severity]} onClick={() => toggle(e.id)} aria-expanded={open}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge className={cn("text-xs", catM.color)}>{catM.icon}<span className="ml-1">{catM.label}</span></Badge>
                          <span className={cn("text-[11px] font-semibold uppercase tracking-wide", SEVERITY_TEXT[e.severity])}>{SEVERITY_META[e.severity].label}</span>
                          {followUpDue && <span className="text-[11px] font-semibold uppercase tracking-wide text-[--cs-risk]">Follow-up due</span>}
                        </div>
                        <p className="font-semibold">{e.title}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>{getYPName(e.child_id)}</span>
                          <span>{e.date} at {e.time}</span>
                          <span>By {getStaffName(e.recorded_by)}</span>
                        </div>
                      </div>
                      {open ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />}
                    </div>
                  </div>
                </FlatListRow>

                {open && (
                  <FlatListRowDetail>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Description</p>
                        <p>{e.description}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Immediate Action Taken</p>
                        <p>{e.immediate_action}</p>
                      </div>
                      {e.child_response && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Child&apos;s Response</p>
                          <div className="bg-pink-50 p-2 rounded border border-pink-200 italic text-pink-900 text-xs">{e.child_response}</div>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Outcome</p>
                        <p>{e.outcome}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Staff Present</p>
                          <div className="flex flex-wrap gap-1">{e.staff_present.map((s) => <Badge key={s} variant="secondary" className="text-xs">{getStaffName(s)}</Badge>)}</div>
                        </div>
                        {e.witnessed_by.length > 0 && (
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Witnessed By</p>
                            <div className="flex flex-wrap gap-1">{e.witnessed_by.map((w, i) => <Badge key={i} variant="outline" className="text-xs">{w}</Badge>)}</div>
                          </div>
                        )}
                      </div>
                      {/* Notifications */}
                      {e.notifications.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Notifications</p>
                          <div className="space-y-1">
                            {e.notifications.map((n, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                {n.status === "notified" ? <CheckCircle2 className="h-3.5 w-3.5 text-[--cs-success]" /> : <Clock className="h-3.5 w-3.5 text-[--cs-warning]" />}
                                <span>{n.party}</span>
                                <Badge variant="outline" className={cn("text-xs", n.status === "notified" ? "text-[--cs-success]" : "text-[--cs-warning]")}>{n.status}</Badge>
                                {n.date && <span className="text-muted-foreground">{n.date}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {e.follow_up_required && (
                        <div className="bg-[--cs-info-bg] p-2 rounded text-xs text-[--cs-info]">
                          <p className="font-medium mb-1">Follow-Up Required</p>
                          <p>{e.follow_up_actions}</p>
                          {e.follow_up_date && <p className="mt-1 text-muted-foreground">Due: {e.follow_up_date}</p>}
                        </div>
                      )}
                      {e.linked_documents.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Linked: {e.linked_documents.join(", ")}</span>
                        </div>
                      )}
                      <SmartLinkPanel sourceType="significant_event" sourceId={e.id} childId={e.child_id} compact />
                  </FlatListRowDetail>
                )}
              </div>
            );
          })}
        </FlatList>

        {/* ── Guidance ─────────────────────────────────────────────────────── */}
        <Card className="bg-muted/40">
          <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Significant events must be recorded within 24 hours. Serious and critical events require immediate notification to the Registered Manager and the placing authority. All events contribute to chronology and Reg 44/45 reporting. Positive events are equally important to record for evidencing progress and outcomes.
            </span>
          </CardContent>
        </Card>
      </div>

      {/* ── New event dialog ──────────────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record Significant Event</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateEvent} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Young Person *</label>
              <Select value={seForm.child_id} onValueChange={(v) => setSEF("child_id", v)}><SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>{YOUNG_PEOPLE.filter((y) => y.status === "current").map((y) => <SelectItem key={y.id} value={y.id}>{y.preferred_name ?? y.first_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input type="date" value={seForm.date} onChange={(e) => setSEF("date", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Time</label>
                <Input type="time" value={seForm.time} onChange={(e) => setSEF("time", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={seForm.category} onValueChange={(v) => setSEF("category", v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(CATEGORY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Severity</label>
                <Select value={seForm.severity} onValueChange={(v) => setSEF("severity", v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(SEVERITY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input placeholder="Brief title for the event" value={seForm.title} onChange={(e) => setSEF("title", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea placeholder="Full description of what happened…" rows={4} value={seForm.description} onChange={(e) => setSEF("description", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Immediate Action Taken</label>
              <Textarea placeholder="What was done in response?" rows={2} value={seForm.immediate_action} onChange={(e) => setSEF("immediate_action", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Child&apos;s Response</label>
              <Textarea placeholder="Record the child's response in their own words…" rows={2} value={seForm.child_response} onChange={(e) => setSEF("child_response", e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createEvent.isPending}>{createEvent.isPending ? "Saving…" : "Save Event"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Safeguarding & Incidents"
        category={["safeguarding", "behaviour", "missing_episode"]}
        days={90}
        defaultCollapsed
      />
    </PageShell>
  );
}
