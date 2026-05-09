"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Mailbox,
  ArrowUpDown,
  Search,
  Activity,
  Clock,
  CalendarDays,
  Network,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useRegulatoryCorrespondenceLetters } from "@/hooks/use-regulatory-correspondence-letters";
import type {
  RegulatoryCorrespondenceLetter,
  RegulatoryCorrespondenceRegulator,
  RegulatoryCorrespondenceDirection,
  RegulatoryCorrespondenceUrgency,
  RegulatoryCorrespondenceStatus,
  RegulatoryCorrespondenceConfidentiality,
} from "@/types/extended";
import {
  REGULATORY_CORRESPONDENCE_REGULATOR_LABEL,
  REGULATORY_CORRESPONDENCE_DIRECTION_LABEL,
  REGULATORY_CORRESPONDENCE_URGENCY_LABEL,
  REGULATORY_CORRESPONDENCE_STATUS_LABEL,
  REGULATORY_CORRESPONDENCE_CONFIDENTIALITY_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── local colour maps ────────────────────────────────────────────── */

const STATUS_META: Record<RegulatoryCorrespondenceStatus, { colour: string }> = {
  open:            { colour: "bg-blue-100 text-blue-700" },
  closed:          { colour: "bg-gray-100 text-gray-700" },
  pending_action:  { colour: "bg-amber-100 text-amber-700" },
  awaiting_reply:  { colour: "bg-indigo-100 text-indigo-700" },
};

const URGENCY_META: Record<RegulatoryCorrespondenceUrgency, { colour: string }> = {
  routine:  { colour: "bg-gray-100 text-gray-700" },
  standard: { colour: "bg-blue-100 text-blue-700" },
  urgent:   { colour: "bg-red-100 text-red-700" },
};

const CONF_META: Record<RegulatoryCorrespondenceConfidentiality, { colour: string }> = {
  standard_conf: { colour: "bg-gray-100 text-gray-700" },
  sensitive:     { colour: "bg-amber-100 text-amber-700" },
  restricted:    { colour: "bg-red-100 text-red-700" },
};

const URGENCY_ORDER: RegulatoryCorrespondenceUrgency[] = ["routine", "standard", "urgent"];

/* ── component ────────────────────────────────────────────────────── */

export default function RegulatoryCorrespondenceTrackerPage() {
  const { data: records = [], isLoading } = useRegulatoryCorrespondenceLetters();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRegulator, setFilterRegulator] = useState("all");
  const [filterDirection, setFilterDirection] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const stats = useMemo(() => {
    const active = records.filter((r) => r.status === "open" || r.status === "pending_action" || r.status === "awaiting_reply").length;
    const awaiting = records.filter((r) => r.response_required && !r.response_sent).length;
    const thisYear = new Date().getFullYear();
    const yearCount = records.filter((r) => {
      const ref = r.date_received || r.date_sent;
      return ref && new Date(ref).getFullYear() === thisYear;
    }).length;
    const distinctRegulators = new Set(records.map((r) => r.regulator)).size;
    return { active, awaiting, yearCount, distinctRegulators };
  }, [records]);

  const filtered = useMemo(() => {
    let list = [...records];
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    if (filterRegulator !== "all") list = list.filter((r) => r.regulator === filterRegulator);
    if (filterDirection !== "all") list = list.filter((r) => r.direction === filterDirection);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        r.subject.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.reference.toLowerCase().includes(q) ||
        REGULATORY_CORRESPONDENCE_REGULATOR_LABEL[r.regulator].toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "urgency":    return URGENCY_ORDER.indexOf(b.urgency) - URGENCY_ORDER.indexOf(a.urgency);
        case "regulator":  return REGULATORY_CORRESPONDENCE_REGULATOR_LABEL[a.regulator].localeCompare(REGULATORY_CORRESPONDENCE_REGULATOR_LABEL[b.regulator]);
        case "deadline":   return (a.response_deadline || "9999").localeCompare(b.response_deadline || "9999");
        case "status":     return a.status.localeCompare(b.status);
        default:           return (b.date_received || b.date_sent).localeCompare(a.date_received || a.date_sent);
      }
    });
    return list;
  }, [records, filterStatus, filterRegulator, filterDirection, search, sortBy]);

  const exportCols: ExportColumn<RegulatoryCorrespondenceLetter>[] = [
    { header: "Date Sent",         accessor: (r) => r.date_sent },
    { header: "Date Received",     accessor: (r) => r.date_received },
    { header: "Regulator",         accessor: (r) => REGULATORY_CORRESPONDENCE_REGULATOR_LABEL[r.regulator] },
    { header: "Direction",         accessor: (r) => REGULATORY_CORRESPONDENCE_DIRECTION_LABEL[r.direction] },
    { header: "Reference",         accessor: (r) => r.reference },
    { header: "Subject",           accessor: (r) => r.subject },
    { header: "Summary",           accessor: (r) => r.summary },
    { header: "Our Response",      accessor: (r) => r.our_response },
    { header: "Documents",         accessor: (r) => r.documents_attached.join("; ") },
    { header: "Response Required", accessor: (r) => r.response_required ? "Yes" : "No" },
    { header: "Response Deadline", accessor: (r) => r.response_deadline },
    { header: "Response Sent",     accessor: (r) => r.response_sent ? "Yes" : "No" },
    { header: "Actions Agreed",    accessor: (r) => r.actions_agreed.join("; ") },
    { header: "Urgency",           accessor: (r) => REGULATORY_CORRESPONDENCE_URGENCY_LABEL[r.urgency] },
    { header: "Status",            accessor: (r) => REGULATORY_CORRESPONDENCE_STATUS_LABEL[r.status] },
    { header: "Confidentiality",   accessor: (r) => REGULATORY_CORRESPONDENCE_CONFIDENTIALITY_LABEL[r.confidentiality_level] },
    { header: "Recorded By",       accessor: (r) => getStaffName(r.recorded_by) },
  ];

  if (isLoading) {
    return (
      <PageShell title="Regulatory Correspondence Tracker" subtitle="Quality Standard 13 (Leadership and Management) — written correspondence with all regulators and statutory partners">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Regulatory Correspondence Tracker"
      subtitle="Quality Standard 13 (Leadership and Management) — written correspondence with all regulators and statutory partners"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="regulatory-correspondence" />
          <PrintButton title="Regulatory Correspondence Tracker" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: "Active Threads",            v: stats.active,             icon: Activity,     c: "text-blue-600" },
            { l: "Awaiting Response",         v: stats.awaiting,           icon: Clock,        c: "text-amber-600" },
            { l: "This Year",                 v: stats.yearCount,          icon: CalendarDays, c: "text-indigo-600" },
            { l: "Multi-Regulator Engagement", v: stats.distinctRegulators, icon: Network,      c: "text-green-600" },
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
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subject, summary, reference, regulator…"
              className="w-full rounded-md border pl-8 pr-3 py-2 text-sm"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {(Object.keys(REGULATORY_CORRESPONDENCE_STATUS_LABEL) as RegulatoryCorrespondenceStatus[]).map((k) => (
                <SelectItem key={k} value={k}>{REGULATORY_CORRESPONDENCE_STATUS_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterRegulator} onValueChange={setFilterRegulator}>
            <SelectTrigger className="w-[230px]"><SelectValue placeholder="Regulator" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regulators</SelectItem>
              {(Object.keys(REGULATORY_CORRESPONDENCE_REGULATOR_LABEL) as RegulatoryCorrespondenceRegulator[]).map((k) => (
                <SelectItem key={k} value={k}>{REGULATORY_CORRESPONDENCE_REGULATOR_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterDirection} onValueChange={setFilterDirection}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Direction" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Directions</SelectItem>
              {(Object.keys(REGULATORY_CORRESPONDENCE_DIRECTION_LABEL) as RegulatoryCorrespondenceDirection[]).map((k) => (
                <SelectItem key={k} value={k}>{REGULATORY_CORRESPONDENCE_DIRECTION_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded border px-2 py-1.5 text-sm"
            >
              <option value="date">Date</option>
              <option value="urgency">Urgency</option>
              <option value="regulator">Regulator</option>
              <option value="deadline">Response Deadline</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {filtered.map((rec) => (
          <div key={rec.id} className="rounded-lg border bg-white overflow-hidden">
            <button
              onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Mailbox className="h-5 w-5 text-brand" />
                <div className="text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{REGULATORY_CORRESPONDENCE_REGULATOR_LABEL[rec.regulator]}</h3>
                    <span className="text-sm text-muted-foreground">— {rec.reference}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium inline-flex items-center gap-1", rec.direction === "incoming" ? "bg-sky-100 text-sky-700" : "bg-emerald-100 text-emerald-700")}>
                      {rec.direction === "incoming"
                        ? <ArrowDownLeft className="h-3 w-3" />
                        : <ArrowUpRight className="h-3 w-3" />}
                      {REGULATORY_CORRESPONDENCE_DIRECTION_LABEL[rec.direction]}
                    </span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[rec.status].colour)}>
                      {REGULATORY_CORRESPONDENCE_STATUS_LABEL[rec.status]}
                    </span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", URGENCY_META[rec.urgency].colour)}>
                      {REGULATORY_CORRESPONDENCE_URGENCY_LABEL[rec.urgency]}
                    </span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", CONF_META[rec.confidentiality_level].colour)}>
                      {REGULATORY_CORRESPONDENCE_CONFIDENTIALITY_LABEL[rec.confidentiality_level]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {rec.subject}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sent {rec.date_sent} · Received {rec.date_received} · Logged by {getStaffName(rec.recorded_by)}
                  </p>
                </div>
              </div>
              {expandedId === rec.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expandedId === rec.id && (
              <div className="border-t p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Date Sent:</span> {rec.date_sent}</div>
                  <div><span className="text-muted-foreground">Date Received:</span> {rec.date_received}</div>
                  <div><span className="text-muted-foreground">Direction:</span> {REGULATORY_CORRESPONDENCE_DIRECTION_LABEL[rec.direction]}</div>
                  <div><span className="text-muted-foreground">Reference:</span> {rec.reference}</div>
                  <div><span className="text-muted-foreground">Response Required:</span> {rec.response_required ? "Yes" : "No"}</div>
                  <div><span className="text-muted-foreground">Response Deadline:</span> {rec.response_deadline}</div>
                  <div><span className="text-muted-foreground">Response Sent:</span> {rec.response_sent ? "Yes" : "No"}</div>
                  <div><span className="text-muted-foreground">Confidentiality:</span> {REGULATORY_CORRESPONDENCE_CONFIDENTIALITY_LABEL[rec.confidentiality_level]}</div>
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <h4 className="text-sm font-semibold mb-1">Subject</h4>
                  <p className="text-sm text-muted-foreground">{rec.subject}</p>
                </div>

                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">Summary of Correspondence</h4>
                  <p className="text-sm text-blue-900">{rec.summary}</p>
                </div>

                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                  <h4 className="text-sm font-semibold text-emerald-800 mb-1">Our Response</h4>
                  <p className="text-sm text-emerald-900">{rec.our_response}</p>
                </div>

                {rec.documents_attached.length > 0 && (
                  <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
                    <h4 className="text-sm font-semibold text-indigo-800 mb-1">Documents Attached / Referenced</h4>
                    <ul className="list-disc pl-5 text-sm text-indigo-900 space-y-0.5">
                      {rec.documents_attached.map((doc, i) => <li key={i}>{doc}</li>)}
                    </ul>
                  </div>
                )}

                {rec.actions_agreed.length > 0 && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <h4 className="text-sm font-semibold text-amber-800 mb-1">Actions Agreed / Outcomes</h4>
                    <ul className="list-disc pl-5 text-sm text-amber-900 space-y-0.5">
                      {rec.actions_agreed.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Quality Standard 13 (Leadership and Management) &amp; good governance</strong> — Registered providers must maintain a clear, auditable record of all written correspondence with regulators and statutory partners (Local Authorities, Ofsted, ICO, HMRC, HSE, Planning, Environmental Health, Fire Authority, ICB / NHS partners, DfE). Each thread should evidence the regulator&apos;s query, the home&apos;s response, any documents provided, agreed actions and the outcome. This tracker sits alongside &mdash; not in place of &mdash; the dedicated Ofsted log.
        </div>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
