"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Award,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRegistrationChangeRecords } from "@/hooks/use-registration-change-records";
import type {
  RegistrationChangeRecord,
  RegistrationChangeType,
  RegistrationChangeStatus,
} from "@/types/extended";
import {
  REGISTRATION_CHANGE_TYPE_LABEL,
  REGISTRATION_CHANGE_STATUS_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── local colour map ────────────────────────────────────────────────── */

const STATUS_COLOUR: Record<RegistrationChangeStatus, string> = {
  submitted: "bg-blue-100 text-blue-800",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  refused: "bg-red-100 text-red-800",
  withdrawn: "bg-slate-100 text-slate-800",
  active: "bg-emerald-100 text-emerald-800",
};

/* ── page ────────────────────────────────────────────────────────────── */

export default function RegistrationChangesLogPage() {
  const { data: records = [], isLoading } = useRegistrationChangeRecords();
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...records];
    if (filterType !== "all") items = items.filter((r) => r.change_type === filterType);
    if (filterStatus !== "all") items = items.filter((r) => r.status === filterStatus);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date_applied.localeCompare(a.date_applied);
        case "type":
          return a.change_type.localeCompare(b.change_type);
        default:
          return 0;
      }
    });
    return items;
  }, [records, filterType, filterStatus, sortBy]);

  const total = records.length;
  const approved = records.filter((r) => r.status === "approved" || r.status === "active").length;
  const pending = records.filter((r) => r.status === "pending" || r.status === "submitted").length;
  const thisYear = records.filter((r) => r.date_applied.startsWith(new Date().getFullYear().toString())).length;

  const exportCols: ExportColumn<RegistrationChangeRecord>[] = [
    { header: "Type", accessor: (r) => REGISTRATION_CHANGE_TYPE_LABEL[r.change_type] },
    { header: "Date Applied", accessor: (r) => r.date_applied },
    { header: "Status", accessor: (r) => REGISTRATION_CHANGE_STATUS_LABEL[r.status] },
    { header: "Reference", accessor: (r) => r.ofsted_reference },
    { header: "Description", accessor: (r) => r.change_description },
    { header: "Effective Date", accessor: (r) => r.effective_date },
    { header: "Prepared By", accessor: (r) => getStaffName(r.prepared_by) },
  ];

  if (isLoading) {
    return (
      <PageShell title="Registration Changes Log" subtitle="History of all changes to the home's registration with Ofsted — initial registration, variations, notifications">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Registration Changes Log"
      subtitle="History of all changes to the home's registration with Ofsted — initial registration, variations, notifications"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="registration-changes-log" />
          <PrintButton title="Registration Changes Log" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Total Changes</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{approved}</p>
          <p className="text-xs text-muted-foreground">Approved</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", pending > 0 ? "text-amber-600" : "text-green-600")}>{pending}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{thisYear}</p>
          <p className="text-xs text-muted-foreground">This Year</p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6 flex items-start gap-2">
        <FileText className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          The home&apos;s registration with Ofsted is a living legal foundation. Every change — Statement
          of Purpose updates, manager changes, notifications, conditions — is tracked here with documents,
          rationale, response, and how children and staff were informed.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(Object.keys(REGISTRATION_CHANGE_TYPE_LABEL) as RegistrationChangeType[]).map((k) => (
              <SelectItem key={k} value={k}>{REGISTRATION_CHANGE_TYPE_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.keys(REGISTRATION_CHANGE_STATUS_LABEL) as RegistrationChangeStatus[]).map((k) => (
              <SelectItem key={k} value={k}>{REGISTRATION_CHANGE_STATUS_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="type">By Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isExpanded = expandedId === r.id;

          return (
            <div key={r.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Award className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{REGISTRATION_CHANGE_TYPE_LABEL[r.change_type]}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Applied {r.date_applied} &middot; {r.change_description.slice(0, 90)}{r.change_description.length > 90 ? "..." : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLOUR[r.status])}>{REGISTRATION_CHANGE_STATUS_LABEL[r.status]}</span>
                  {(r.status === "approved" || r.status === "active") && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {(r.status === "pending" || r.status === "submitted") && <Clock className="h-4 w-4 text-amber-500" />}
                  {r.status === "refused" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Description</p>
                    <p className="text-sm">{r.change_description}</p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Reason for Change</p>
                    <p className="text-sm">{r.reason_for_change}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Documents Submitted</p>
                    <ul className="space-y-1">
                      {r.documents_submitted.map((doc, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <FileText className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                          <span>{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {r.ofsted_response_summary && (
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Ofsted Response</p>
                      <p className="text-sm font-medium">{r.ofsted_response_date && `[${r.ofsted_response_date}] `}{r.ofsted_response_summary}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-pink-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">Children Affected</p>
                      <p className="text-sm">{r.children_affected}</p>
                      {r.children_informed_how && <p className="text-xs text-muted-foreground mt-1">Informed: {r.children_informed_how}</p>}
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Staff Informed</p>
                      <p className="text-sm">{r.staff_informed ? "Yes" : "No"}</p>
                      {r.staff_informed_how && <p className="text-xs text-muted-foreground mt-1">{r.staff_informed_how}</p>}
                    </div>
                  </div>

                  {r.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm">{r.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><FileText className="h-3 w-3 inline mr-1" />Ref: {r.ofsted_reference}</span>
                    <span>Prepared: {getStaffName(r.prepared_by)}</span>
                    {r.effective_date && <span>Effective: {r.effective_date}</span>}
                    {r.la_informed && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">LA Informed</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Registration changes log supports Children&apos;s Homes
          Regulations 2015 — registration regime, Quality Standard 13 (leadership and management), and
          Ofsted&apos;s Single Children&apos;s Homes (England) Inspection Framework. All variations,
          notifications, and SoP changes documented permanently. Linked to Statement of Purpose,
          Notification Log, and Reg 45 reports.
        </p>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
