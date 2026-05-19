"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ArrowUpDown,
  Search,
  Lock,
  FileText,
  Eye,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type {
  DataBreachRecord, DataBreachType, DataBreachSeverity, DataBreachRiskLevel, DataBreachStatus,
} from "@/types/extended";
import {
  DATA_BREACH_TYPE_LABEL, DATA_BREACH_SEVERITY_LABEL,
  DATA_BREACH_RISK_LEVEL_LABEL, DATA_BREACH_STATUS_LABEL,
} from "@/types/extended";
import { useDataBreachRecords } from "@/hooks/use-data-breach-records";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────── */

const SEVERITY_COLOURS: Record<DataBreachSeverity, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const RISK_COLOURS: Record<DataBreachRiskLevel, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

const STATUS_COLOURS: Record<DataBreachStatus, string> = {
  investigating: "bg-amber-100 text-amber-800",
  closed_resolved: "bg-green-100 text-green-800",
  reported_awaiting_ico: "bg-blue-100 text-blue-800",
  monitoring: "bg-purple-100 text-purple-800",
};

/* ── flat row for export ──────────────────────────────────────────────── */

interface FlatRow {
  date_discovered: string;
  date_incident: string;
  breach_type: string;
  severity: string;
  near_miss: string;
  summary: string;
  data_subjects: string;
  special_category_data: string;
  risk_to_individuals: string;
  reported_to_ico: string;
  status: string;
  reviewed_by: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Date Discovered", accessor: (r: FlatRow) => r.date_discovered },
  { header: "Date of Incident", accessor: (r: FlatRow) => r.date_incident },
  { header: "Breach Type", accessor: (r: FlatRow) => r.breach_type },
  { header: "Severity", accessor: (r: FlatRow) => r.severity },
  { header: "Near-Miss", accessor: (r: FlatRow) => r.near_miss },
  { header: "Summary", accessor: (r: FlatRow) => r.summary },
  { header: "Data Subjects", accessor: (r: FlatRow) => r.data_subjects },
  { header: "Special Category Data", accessor: (r: FlatRow) => r.special_category_data },
  { header: "Risk to Individuals", accessor: (r: FlatRow) => r.risk_to_individuals },
  { header: "Reported to ICO", accessor: (r: FlatRow) => r.reported_to_ico },
  { header: "Status", accessor: (r: FlatRow) => r.status },
  { header: "Reviewed By", accessor: (r: FlatRow) => r.reviewed_by },
];

/* ── component ─────────────────────────────────────────────────────────── */

export default function DataBreachLogPage() {
  const { data: raw, isLoading } = useDataBreachRecords();
  const records = raw?.data ?? [];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");

  const toggle = (id: string) => setExpandedId((curr) => (curr === id ? null : id));

  const BREACH_TYPES: DataBreachType[] = [
    "lost_device", "lost_paper", "email_to_wrong_recipient", "unauthorised_access",
    "unauthorised_disclosure", "verbal_disclosure", "system_error", "phishing_social_engineering", "other",
  ];
  const STATUSES: DataBreachStatus[] = ["investigating", "closed_resolved", "reported_awaiting_ico", "monitoring"];

  const stats = useMemo(() => {
    const total = records.length;
    const nearMisses = records.filter((b) => b.near_miss).length;
    const icoReported = records.filter((b) => b.reported_to_ico).length;
    const resolved = records.filter((b) => b.status === "closed_resolved").length;
    return { total, nearMisses, icoReported, resolved };
  }, [records]);

  const filtered = useMemo(() => {
    let list = records;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.summary_of_breach.toLowerCase().includes(q) ||
          DATA_BREACH_TYPE_LABEL[b.breach_type].toLowerCase().includes(q) ||
          b.data_subjects.toLowerCase().includes(q),
      );
    }
    if (filterType !== "all") list = list.filter((b) => b.breach_type === filterType);
    if (filterStatus !== "all") list = list.filter((b) => b.status === filterStatus);
    const out = [...list];
    switch (sortBy) {
      case "date":
        out.sort((a, b) => b.date_discovered.localeCompare(a.date_discovered));
        break;
      case "severity": {
        const order: Record<DataBreachSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        out.sort((a, b) => order[a.severity] - order[b.severity]);
        break;
      }
      case "type":
        out.sort((a, b) => DATA_BREACH_TYPE_LABEL[a.breach_type].localeCompare(DATA_BREACH_TYPE_LABEL[b.breach_type]));
        break;
      case "status":
        out.sort((a, b) => DATA_BREACH_STATUS_LABEL[a.status].localeCompare(DATA_BREACH_STATUS_LABEL[b.status]));
        break;
    }
    return out;
  }, [records, search, filterType, filterStatus, sortBy]);

  const exportData = useMemo<FlatRow[]>(
    () =>
      records.map((b) => ({
        date_discovered: b.date_discovered,
        date_incident: b.date_incident,
        breach_type: DATA_BREACH_TYPE_LABEL[b.breach_type],
        severity: DATA_BREACH_SEVERITY_LABEL[b.severity],
        near_miss: b.near_miss ? "Yes" : "No",
        summary: b.summary_of_breach,
        data_subjects: b.data_subjects,
        special_category_data: b.special_category_data ? "Yes" : "No",
        risk_to_individuals: DATA_BREACH_RISK_LEVEL_LABEL[b.risk_to_individuals],
        reported_to_ico: b.reported_to_ico ? "Yes" : "No",
        status: DATA_BREACH_STATUS_LABEL[b.status],
        reviewed_by: getStaffName(b.reviewed_by),
      })),
    [records],
  );

  if (isLoading) return <PageShell title="Data Breach Log" subtitle="Breach and near-miss register — GDPR Article 33-34 incident management (Data Protection Act 2018, UK GDPR)"><div /></PageShell>;

  return (
    <PageShell
      title="Data Breach Log"
      subtitle="Breach and near-miss register — GDPR Article 33-34 incident management (Data Protection Act 2018, UK GDPR)"
      ariaContext={{ pageTitle: "Data Breach Log", sourceType: "document" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Data Breach Log" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="data-breach-log" />
          <AriaStudioQuickActionButton context={{ record_type: "policy", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total incidents", value: stats.total, icon: ShieldAlert, colour: "text-blue-600" },
          { label: "Near-misses caught", value: stats.nearMisses, icon: Eye, colour: "text-amber-600" },
          { label: "ICO-notified", value: stats.icoReported, icon: AlertTriangle, colour: stats.icoReported > 0 ? "text-red-600" : "text-gray-400" },
          { label: "Resolved", value: stats.resolved, icon: CheckCircle2, colour: "text-green-600" },
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

      {/* confidentiality banner */}
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
        <Lock className="h-5 w-5 text-amber-700 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-900">Confidentiality notice</p>
          <p className="text-sm text-amber-800">
            All entries below are anonymised. Names of young people, staff and third parties are
            replaced with role identifiers. Full unredacted incident files are held securely by the
            Registered Manager and Data Protection Officer. Access is on a strict need-to-know basis
            for safeguarding, audit and regulatory purposes only.
          </p>
        </div>
      </div>

      {/* filters / sort */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search breaches…"
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {BREACH_TYPES.map((t) => <SelectItem key={t} value={t}>{DATA_BREACH_TYPE_LABEL[t]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{DATA_BREACH_STATUS_LABEL[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="severity">Severity</SelectItem>
              <SelectItem value="type">Type</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* breach cards */}
      <div className="space-y-4 mb-8">
        {filtered.map((b) => {
          const open = expandedId === b.id;
          return (
            <div key={b.id} className="rounded-lg border bg-white">
              <button
                onClick={() => toggle(b.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ShieldAlert className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold">{DATA_BREACH_TYPE_LABEL[b.breach_type]}</h3>
                    {b.near_miss && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        Near-miss
                      </span>
                    )}
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", SEVERITY_COLOURS[b.severity])}>
                      {DATA_BREACH_SEVERITY_LABEL[b.severity]}
                    </span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLOURS[b.status])}>
                      {DATA_BREACH_STATUS_LABEL[b.status]}
                    </span>
                    {b.special_category_data && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Special category
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Discovered {b.date_discovered} · Incident {b.date_incident} · {b.data_subjects} · Reviewed by {getStaffName(b.reviewed_by)}
                  </p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  <p className="mt-3 text-sm">{b.summary_of_breach}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-gray-500">Discovered:</span> <span className="font-medium">{b.date_discovered}</span></div>
                    <div><span className="text-gray-500">Incident:</span> <span className="font-medium">{b.date_incident}</span></div>
                    <div><span className="text-gray-500">Subjects:</span> <span className="font-medium">{b.data_subjects}</span></div>
                    <div>
                      <span className="text-gray-500">Risk:</span>{" "}
                      <span className={cn("px-2 py-0.5 rounded text-xs font-medium", RISK_COLOURS[b.risk_to_individuals])}>{DATA_BREACH_RISK_LEVEL_LABEL[b.risk_to_individuals]}</span>
                    </div>
                  </div>

                  <div className="rounded-md bg-gray-50 p-3">
                    <h4 className="text-xs font-semibold text-gray-700 mb-1">Data categories affected</h4>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {b.data_categories_affected.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={cn("px-2 py-1 rounded text-xs font-medium", b.reported_to_ico ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800")}>
                      {b.reported_to_ico ? `ICO notified ${b.ico_reported_date || ""}${b.ico_reference ? ` · Ref ${b.ico_reference}` : ""}` : "ICO notification not required"}
                    </span>
                    <span className={cn("px-2 py-1 rounded text-xs font-medium", b.data_subjects_notified ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700")}>
                      {b.data_subjects_notified ? `Data subjects notified ${b.notification_date || ""}` : "Data subjects not notified"}
                    </span>
                  </div>

                  <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                    <h4 className="text-xs font-semibold text-amber-700 mb-1">Root cause analysis</h4>
                    <p className="text-sm text-amber-800">{b.root_cause_analysis}</p>
                  </div>

                  <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                    <h4 className="text-xs font-semibold text-blue-700 mb-1">Immediate actions taken</h4>
                    <ul className="list-disc list-inside text-sm text-blue-800 space-y-0.5">
                      {b.immediate_actions_taken.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-purple-50 border border-purple-200 p-3">
                      <h4 className="text-xs font-semibold text-purple-700 mb-1">Lessons learned</h4>
                      <ul className="list-disc list-inside text-sm text-purple-800 space-y-0.5">
                        {b.lessons_learned.map((l, i) => <li key={i}>{l}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3">
                      <h4 className="text-xs font-semibold text-emerald-700 mb-1">Preventive actions</h4>
                      <ul className="list-disc list-inside text-sm text-emerald-800 space-y-0.5">
                        {b.preventive_actions.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-indigo-50 border border-indigo-200 p-3">
                      <h4 className="text-xs font-semibold text-indigo-700 mb-1 flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Training arising
                      </h4>
                      <ul className="list-disc list-inside text-sm text-indigo-800 space-y-0.5">
                        {b.training_arising.map((t, i) => <li key={i}>{t}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-md bg-slate-50 border border-[var(--cs-border)] p-3">
                      <h4 className="text-xs font-semibold text-[var(--cs-text-secondary)] mb-1 flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Policy arising
                      </h4>
                      <p className="text-sm text-[var(--cs-navy)]">{b.policy_arising}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Reported to</h4>
                      <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                        {b.reported_to.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Reviewed by</h4>
                      <p className="text-gray-700">{getStaffName(b.reviewed_by)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* regulatory note */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>UK GDPR Articles 33-34 &amp; Data Protection Act 2018:</strong> Personal data
        breaches must be assessed within 72 hours of becoming aware. Breaches likely to result in a
        risk to the rights and freedoms of individuals must be reported to the ICO without undue
        delay (Article 33). Where the risk is high, affected individuals must also be informed
        without undue delay (Article 34). All breaches and near-misses are recorded in this
        register, regardless of reportability, to support root cause analysis, lessons learned and
        preventive action. The register is reviewed monthly by the Registered Manager and quarterly
        by the Responsible Individual.
      </div>
      <CareEventsPanel
        title="Care Events — Safeguarding"
        category="safeguarding"
        days={90}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Data Breach Log — GDPR, ICO notification, personal data incidents, breach reporting, DPO, containment, notification to data subjects, Ofsted, risk rating, remediation"
        recordType="policy"
        className="mt-6"
      />
    </PageShell>
  );
}
