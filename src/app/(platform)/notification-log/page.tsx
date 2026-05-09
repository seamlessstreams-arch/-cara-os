"use client";

import { useState, useMemo } from "react";
import {
  Send, Search, ArrowUpDown, Filter,
  AlertTriangle, CheckCircle2, Clock, Phone,
  ChevronDown, ChevronUp, Shield, FileText,
  Building2, Users, Siren, Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useNotificationLog } from "@/hooks/use-notification-log";
import type { NotificationLogEntry } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const RECIPIENTS = ["Ofsted", "Placing Authority", "LADO", "Police"] as const;

/* ── component ───────────────────────────────────────────────────────── */
export default function NotificationLogPage() {
  const { data: res, isLoading } = useNotificationLog();
  const records: NotificationLogEntry[] = res?.data ?? [];
  const [search, setSearch] = useState("");
  const [filterRecipient, setFilterRecipient] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterCompliance, setFilterCompliance] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ── derived data ────────────────────────────────────────────────── */
  const notificationTypes = useMemo(
    () => Array.from(new Set(records.map((r) => r.notification_type))),
    [records]
  );

  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.event_summary.toLowerCase().includes(q) ||
          r.notified_to.toLowerCase().includes(q) ||
          r.notification_type.toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q)
      );
    }
    if (filterRecipient !== "all") {
      list = list.filter((r) => r.notified_to.startsWith(filterRecipient));
    }
    if (filterType !== "all") {
      list = list.filter((r) => r.notification_type === filterType);
    }
    if (filterCompliance === "on_time") list = list.filter((r) => r.within_timeframe);
    if (filterCompliance === "late") list = list.filter((r) => !r.within_timeframe);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.date.localeCompare(a.date);
        case "recipient": return a.notified_to.localeCompare(b.notified_to);
        case "type": return a.notification_type.localeCompare(b.notification_type);
        default: return 0;
      }
    });
    return list;
  }, [records, search, filterRecipient, filterType, filterCompliance, sortBy]);

  /* ── stats ───────────────────────────────────────────────────────── */
  const total = records.length;
  const onTime = records.filter((r) => r.within_timeframe).length;
  const onTimePct = total > 0 ? Math.round((onTime / total) * 100) : 0;
  const ofstedCount = records.filter((r) => r.notified_to === "Ofsted").length;
  const lateCount = records.filter((r) => !r.within_timeframe).length;

  /* ── export columns ──────────────────────────────────────────────── */
  const exportCols: ExportColumn<NotificationLogEntry>[] = [
    { header: "ID", accessor: (r: NotificationLogEntry) => r.id },
    { header: "Date", accessor: (r: NotificationLogEntry) => r.date },
    { header: "Notified To", accessor: (r: NotificationLogEntry) => r.notified_to },
    { header: "Method", accessor: (r: NotificationLogEntry) => r.method },
    { header: "Type", accessor: (r: NotificationLogEntry) => r.notification_type },
    { header: "Regulation", accessor: (r: NotificationLogEntry) => r.regulation },
    { header: "Event Summary", accessor: (r: NotificationLogEntry) => r.event_summary },
    { header: "Sent By", accessor: (r: NotificationLogEntry) => getStaffName(r.sent_by) },
    { header: "Within Timeframe", accessor: (r: NotificationLogEntry) => r.within_timeframe ? "Yes" : "LATE" },
    { header: "Required Timeframe", accessor: (r: NotificationLogEntry) => r.required_timeframe },
    { header: "Actual Timeframe", accessor: (r: NotificationLogEntry) => r.actual_timeframe },
    { header: "Acknowledgement", accessor: (r: NotificationLogEntry) => r.acknowledgement_received ? "Yes" : "No" },
    { header: "Linked Event", accessor: (r: NotificationLogEntry) => r.linked_event },
    { header: "Notes", accessor: (r: NotificationLogEntry) => r.notes },
  ];

  if (isLoading) {
    return (
      <PageShell
        title="Notification Log"
        subtitle="Statutory notifications to regulatory bodies — tracking compliance with Regulation 40 and related requirements"
      >
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Notification Log"
      subtitle="Statutory notifications to regulatory bodies — tracking compliance with Regulation 40 and related requirements"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Notification Log" />
          <ExportButton data={filtered} columns={exportCols} filename="notification-log" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── summary stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Notifications", value: total, icon: Send, colour: "text-blue-600" },
            { label: "Within Timeframe", value: `${onTimePct}%`, icon: CheckCircle2, colour: "text-green-600" },
            { label: "Ofsted Notifications", value: ofstedCount, icon: Building2, colour: "text-indigo-600" },
            { label: "Late Notifications", value: lateCount, icon: AlertTriangle, colour: lateCount > 0 ? "text-red-600" : "text-slate-400" },
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

        {/* ── late alert ──────────────────────────────────────────── */}
        {lateCount > 0 && (
          <div className="rounded-lg border-l-4 border-red-400 bg-red-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-semibold">
                  {lateCount} notification{lateCount > 1 ? "s were" : " was"} sent outside the required timeframe.
                </p>
                <p className="mt-1">
                  Late notifications are a regulatory compliance concern. Ensure learning points are actioned and
                  reflected in Reg 44 and Reg 45 reporting.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── filters ────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterRecipient} onValueChange={setFilterRecipient}>
              <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Recipients</SelectItem>
                {RECIPIENTS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {notificationTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCompliance} onValueChange={setFilterCompliance}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Compliance</SelectItem>
              <SelectItem value="on_time">On Time</SelectItem>
              <SelectItem value="late">Late</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Recent)</SelectItem>
                <SelectItem value="recipient">Recipient</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── notification cards ──────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No notifications match your filters.</div>
          )}
          {filtered.map((rec) => {
            const isExpanded = expandedId === rec.id;
            const RecipientIcon = rec.notified_to === "Ofsted" ? Building2
              : rec.notified_to === "Police" ? Siren
              : rec.notified_to === "LADO" ? Shield
              : Users;

            return (
              <div key={rec.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <RecipientIcon className={cn("h-5 w-5 shrink-0",
                      !rec.within_timeframe ? "text-red-600" : "text-blue-600"
                    )} />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{rec.notification_type}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {rec.date} &middot; To: {rec.notified_to} &middot; {getStaffName(rec.sent_by)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-xs",
                      rec.within_timeframe
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    )}>
                      {rec.within_timeframe ? "On Time" : "LATE"}
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* event summary */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Event Summary</p>
                      <p className="text-sm">{rec.event_summary}</p>
                    </div>

                    {/* notification details grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Recipient</p>
                        <p className="text-sm font-medium">{rec.notified_to}</p>
                        <p className="text-xs text-muted-foreground mt-1">Method: {rec.method}</p>
                      </div>
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Regulation</p>
                        <p className="text-sm">{rec.regulation}</p>
                      </div>
                      <div className={cn("rounded-lg border p-3",
                        rec.within_timeframe ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                      )}>
                        <p className={cn("text-xs font-medium mb-1",
                          rec.within_timeframe ? "text-green-700" : "text-red-700"
                        )}>
                          Timeframe Compliance
                        </p>
                        <p className="text-sm">Required: {rec.required_timeframe}</p>
                        <p className="text-sm">Actual: {rec.actual_timeframe}</p>
                        {!rec.within_timeframe && (
                          <p className="text-xs text-red-700 font-semibold mt-1">LATE — outside required window</p>
                        )}
                      </div>
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Acknowledgement</p>
                        <div className="flex items-center gap-1.5">
                          {rec.acknowledgement_received ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-700">Received</span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-4 w-4 text-amber-600" />
                              <span className="text-sm text-amber-700">Awaiting</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* linked event */}
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <p className="text-xs font-medium text-blue-700">Linked Event</p>
                      </div>
                      <p className="text-sm">{rec.linked_event}</p>
                    </div>

                    {/* notes */}
                    {rec.notes && (
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Notes</p>
                        <p className="text-sm">{rec.notes}</p>
                      </div>
                    )}

                    {/* sent by */}
                    <div className="text-xs text-muted-foreground">
                      Sent by: {getStaffName(rec.sent_by)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── regulatory guidance ────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              Regulation 40 — Notification Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3 text-muted-foreground">
            <p>
              The Children&apos;s Homes (England) Regulations 2015, Regulation 40, requires the registered
              person to notify HMCI (Ofsted) and other relevant persons of specified events without delay.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 border p-3">
                <p className="font-medium text-slate-900 mb-1">Required Timeframes</p>
                <ul className="space-y-1 text-xs">
                  <li><span className="font-medium">Death / serious harm:</span> Immediately + within 24 hours (written)</li>
                  <li><span className="font-medium">Serious incident / restraint:</span> Within 24 hours</li>
                  <li><span className="font-medium">Child protection enquiry:</span> Within 24 hours</li>
                  <li><span className="font-medium">Police involvement:</span> Within 24 hours</li>
                  <li><span className="font-medium">Allegation against staff:</span> Within 24 hours (also LADO referral same day)</li>
                  <li><span className="font-medium">Missing person (police):</span> At risk-assessed threshold</li>
                  <li><span className="font-medium">Placing authority (significant events):</span> Same working day</li>
                </ul>
              </div>
              <div className="rounded-lg bg-slate-50 border p-3">
                <p className="font-medium text-slate-900 mb-1">Ofsted Expectations</p>
                <ul className="space-y-1 text-xs">
                  <li>Notify on <span className="font-medium">awareness</span> of the event, not on confirmation or conclusion</li>
                  <li>Use the online notification portal for all written notifications</li>
                  <li>Phone Ofsted in addition for deaths, serious harm, or child protection concerns</li>
                  <li>Keep a clear audit trail of all notifications sent — this log serves that purpose</li>
                  <li>Late notifications will be noted in inspection and Reg 44 reports</li>
                  <li>Demonstrate learning when delays occur — what has changed to prevent recurrence</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
