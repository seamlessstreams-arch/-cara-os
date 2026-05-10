"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, ChevronDown, ChevronUp, ArrowUpDown, AlertTriangle, CheckCircle2,
  Clock, Search, Bell, FileText, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useReg35Notifications, useCreateReg35Notification } from "@/hooks/use-reg35-notifications";
import { toast } from "sonner";
import { YOUNG_PEOPLE, STAFF } from "@/lib/seed-data";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type {
  Reg35Notification,
  Reg35NotificationType,
  Reg35NotificationMethod,
  Reg35OfstedResponse,
} from "@/types/extended";
import {
  REG35_NOTIFICATION_TYPE_LABEL,
  REG35_NOTIFICATION_METHOD_LABEL,
  REG35_OFSTED_RESPONSE_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── local colour maps ────────────────────────────────────────────────── */

const RESPONSE_CLR: Record<Reg35OfstedResponse, string> = {
  acknowledged: "bg-blue-100 text-blue-800",
  no_further_action: "bg-green-100 text-green-800",
  monitoring: "bg-amber-100 text-amber-800",
  inspection_brought_forward: "bg-red-100 text-red-800",
  awaiting_response: "bg-slate-100 text-slate-700",
};

/* ── page ─────────────────────────────────────────────────────────────── */

export default function Reg35NotificationsPage() {
  const { data: records = [], isLoading } = useReg35Notifications();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterResponse, setFilterResponse] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showNew, setShowNew] = useState(false);

  const createNotif = useCreateReg35Notification();
  const [r35Form, setR35Form] = useState({ date_of_event: new Date().toISOString().slice(0, 10), notification_type: "serious_injury" as Reg35NotificationType, child_id: "", method: "phone" as Reg35NotificationMethod, ofsted_ref: "", summary: "" });
  const setR35 = (k: keyof typeof r35Form, v: string) => setR35Form((p) => ({ ...p, [k]: v }));

  const handleLogNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!r35Form.summary.trim()) { toast.error("Summary is required."); return; }
    await createNotif.mutateAsync({ date_of_event: r35Form.date_of_event, date_notified: new Date().toISOString().slice(0, 10), notification_type: r35Form.notification_type, notified_to_ofsted: true, notified_to_la: false, notified_to_police: false, notified_to_other: [], method: r35Form.method, ofsted_ref: r35Form.ofsted_ref.trim(), child_id: r35Form.child_id || null, summary: r35Form.summary.trim(), actions_taken: [], notified_by_id: "staff_darren", timeliness_compliant: true, ofsted_response: "awaiting_response", follow_up_required: false, follow_up_details: "", linked_records: [], notes: "" });
    toast.success("Reg 35 notification logged.");
    setR35Form({ date_of_event: new Date().toISOString().slice(0, 10), notification_type: "serious_injury", child_id: "", method: "phone", ofsted_ref: "", summary: "" });
    setShowNew(false);
  };

  const filtered = useMemo(() => {
    let rows = [...records];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        r.summary.toLowerCase().includes(q) ||
        r.ofsted_ref.toLowerCase().includes(q) ||
        (r.child_id && getYPName(r.child_id).toLowerCase().includes(q))
      );
    }
    if (filterType !== "all") rows = rows.filter((r) => r.notification_type === filterType);
    if (filterResponse !== "all") rows = rows.filter((r) => r.ofsted_response === filterResponse);
    rows.sort((a, b) => sortBy === "newest" ? b.date_of_event.localeCompare(a.date_of_event) : a.date_of_event.localeCompare(b.date_of_event));
    return rows;
  }, [records, search, filterType, filterResponse, sortBy]);

  const total = records.length;
  const compliant = records.filter((r) => r.timeliness_compliant).length;
  const pending = records.filter((r) => r.ofsted_response === "awaiting_response" || r.ofsted_response === "monitoring").length;
  const followUps = records.filter((r) => r.follow_up_required).length;

  const exportCols: ExportColumn<Reg35Notification>[] = [
    { header: "Event Date", accessor: (r) => r.date_of_event },
    { header: "Notified", accessor: (r) => r.date_notified },
    { header: "Type", accessor: (r) => REG35_NOTIFICATION_TYPE_LABEL[r.notification_type] },
    { header: "Ofsted Ref", accessor: (r) => r.ofsted_ref },
    { header: "Young Person", accessor: (r) => r.child_id ? getYPName(r.child_id) : "N/A" },
    { header: "Method", accessor: (r) => REG35_NOTIFICATION_METHOD_LABEL[r.method] },
    { header: "Timely", accessor: (r) => r.timeliness_compliant ? "Yes" : "No" },
    { header: "Ofsted Response", accessor: (r) => REG35_OFSTED_RESPONSE_LABEL[r.ofsted_response] },
    { header: "Follow-Up", accessor: (r) => r.follow_up_required ? "Yes" : "No" },
  ];

  if (isLoading) {
    return (
      <PageShell title="Reg 35 Notifications" subtitle="Children's Homes Regulations 2015 · Reg 40 · Statutory Notifications to Ofsted">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Reg 35 Notifications"
      subtitle="Children's Homes Regulations 2015 · Reg 40 · Statutory Notifications to Ofsted"
      ariaContext={{ pageTitle: "Reg 35 Notifications", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Reg 35 Notifications" />
          <ExportButton data={records} columns={exportCols} filename="reg35-notifications" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />Log Notification</Button>
          <AriaStudioQuickActionButton context={{ record_type: "reg45", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area">
        {/* stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Notifications", value: total, icon: Bell, clr: "text-blue-600" },
            { label: "Timely (Compliant)", value: `${compliant}/${total}`, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Pending / Monitoring", value: pending, icon: Clock, clr: "text-amber-600" },
            { label: "Follow-Ups Required", value: followUps, icon: AlertTriangle, clr: "text-red-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search notifications..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {(Object.entries(REG35_NOTIFICATION_TYPE_LABEL) as [Reg35NotificationType, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterResponse} onValueChange={setFilterResponse}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Response" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Responses</SelectItem>
              {(Object.entries(REG35_OFSTED_RESPONSE_LABEL) as [Reg35OfstedResponse, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}>
            <ArrowUpDown className="h-4 w-4 mr-1" />{sortBy === "newest" ? "Newest" : "Oldest"}
          </Button>
        </div>

        {/* follow-up alert */}
        {followUps > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">{followUps} notification(s) require follow-up with Ofsted</p>
              <p className="text-amber-700">Outstanding follow-ups must be completed promptly. Ofsted may request additional information or updates. Failure to respond to Ofsted requests may result in regulatory action.</p>
            </div>
          </div>
        )}

        {/* notification cards */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            return (
              <Card key={r.id} className={cn("border-l-4", r.follow_up_required ? "border-l-amber-500" : r.timeliness_compliant ? "border-l-green-400" : "border-l-red-500")}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {REG35_NOTIFICATION_TYPE_LABEL[r.notification_type]}
                        <Badge variant="outline" className={RESPONSE_CLR[r.ofsted_response]}>{REG35_OFSTED_RESPONSE_LABEL[r.ofsted_response]}</Badge>
                        {r.timeliness_compliant ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800">Timely</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-100 text-red-800">Late</Badge>
                        )}
                        {r.follow_up_required && <Badge variant="outline" className="bg-amber-100 text-amber-800">Follow-Up</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Event: {r.date_of_event} · Notified: {r.date_notified} · Ref: {r.ofsted_ref}
                        {r.child_id && ` · ${getYPName(r.child_id)}`}
                        {" "}· By: {getStaffName(r.notified_by_id)} · {REG35_NOTIFICATION_METHOD_LABEL[r.method]}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    <div>
                      <p className="font-medium mb-1">Event Summary</p>
                      <p className="text-muted-foreground text-xs">{r.summary}</p>
                    </div>

                    <div>
                      <p className="font-medium mb-1">Notifications Sent To</p>
                      <div className="flex flex-wrap gap-1">
                        {r.notified_to_ofsted && <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">Ofsted</Badge>}
                        {r.notified_to_la && <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs">Local Authority</Badge>}
                        {r.notified_to_police && <Badge variant="outline" className="bg-red-50 text-red-700 text-xs">Police</Badge>}
                        {r.notified_to_other.map((o, i) => (
                          <Badge key={i} variant="outline" className="bg-muted/50 text-xs">{o}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="font-medium mb-1">Actions Taken</p>
                      <ul className="space-y-1">
                        {r.actions_taken.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {r.linked_records.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Linked Records</p>
                        <div className="flex flex-wrap gap-1">
                          {r.linked_records.map((lr, i) => (
                            <Badge key={i} variant="outline" className="bg-muted/30 text-xs">
                              <FileText className="h-3 w-3 mr-1" />{lr}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {r.follow_up_required && (
                      <div className="bg-amber-50 border border-amber-200 rounded p-2">
                        <p className="font-medium text-xs text-amber-800 mb-1">Follow-Up Required</p>
                        <p className="text-xs text-amber-700">{r.follow_up_details}</p>
                      </div>
                    )}

                    <div><p className="font-medium mb-1">Notes</p><p className="text-muted-foreground text-xs">{r.notes}</p></div>

                    {r.child_id && (
                      <SmartLinkPanel sourceType="reg35_notification" sourceId={r.id} childId={r.child_id} compact />
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Children&apos;s Homes (England) Regulations 2015, Reg 40 (formerly Reg 35 under 2001 Regs, commonly still referred to as &quot;Reg 35 notifications&quot;). The registered person must notify Ofsted without delay of events including: death or serious injury/illness, restraint, allegations against staff, child protection referrals, police involvement, absconding, serious complaints, and any other significant event. Notifications must be made by the quickest practicable means (telephone for deaths, allegations, serious injuries) with written confirmation within 24 hours. Ofsted may request further information or take regulatory action based on notifications. Timeliness and completeness of notifications are monitored during inspections.</p>
        </div>
      </div>

      {/* new notification dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Reg 35 Notification</DialogTitle></DialogHeader>
          <form onSubmit={handleLogNotification} className="space-y-3">
            <div><Label>Date of Event</Label><Input type="date" value={r35Form.date_of_event} onChange={(e) => setR35("date_of_event", e.target.value)} /></div>
            <div>
              <Label>Notification Type</Label>
              <Select value={r35Form.notification_type} onValueChange={(v) => setR35("notification_type", v)}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(REG35_NOTIFICATION_TYPE_LABEL) as [Reg35NotificationType, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Related Young Person</Label>
              <Select value={r35Form.child_id} onValueChange={(v) => setR35("child_id", v)}><SelectTrigger><SelectValue placeholder="Select YP (optional)" /></SelectTrigger>
                <SelectContent>
                  {YOUNG_PEOPLE.filter((y) => y.status === "current").map((y) => <SelectItem key={y.id} value={y.id}>{y.preferred_name ?? y.first_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Method</Label>
              <Select value={r35Form.method} onValueChange={(v) => setR35("method", v)}><SelectTrigger><SelectValue placeholder="How was Ofsted notified?" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(REG35_NOTIFICATION_METHOD_LABEL) as [Reg35NotificationMethod, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Ofsted Reference</Label><Input placeholder="e.g. OFS-2025-..." value={r35Form.ofsted_ref} onChange={(e) => setR35("ofsted_ref", e.target.value)} /></div>
            <div><Label>Summary *</Label><Textarea placeholder="Describe the event and actions taken..." value={r35Form.summary} onChange={(e) => setR35("summary", e.target.value)} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createNotif.isPending}>{createNotif.isPending ? "Saving…" : "Log Notification"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Regulatory Notifications"
        category="general"
        days={90}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Reg 35 Notifications — Regulation 35 notification requirements, notifications to Ofsted, significant events, care episode notifications, regulatory reporting, compliance records"
        recordType="reg45"
        className="mt-6"
      />
    </PageShell>
  );
}
