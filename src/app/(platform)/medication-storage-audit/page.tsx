"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown, ChevronUp, ArrowUpDown, Pill, Lock,
  Thermometer, CheckCircle, AlertTriangle, Clock, Loader2,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useMedicationStorageAudits } from "@/hooks/use-medication-storage-audits";
import type {
  MedicationStorageAudit, StorageAuditCabinetType, StorageAuditVerdict,
  CleanlinessRating, StorageAuditCheckItem, StorageAuditExpiringItem,
  StorageAuditExpiredItem, StorageAuditFollowUp, FollowUpStatus,
} from "@/types/extended";
import {
  STORAGE_AUDIT_CABINET_TYPE_LABEL, STORAGE_AUDIT_VERDICT_LABEL,
  CLEANLINESS_RATING_LABEL, FOLLOW_UP_STATUS_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const verdictColour: Record<StorageAuditVerdict, string> = {
  pass: "bg-green-100 text-green-800",
  pass_with_minor_actions: "bg-amber-100 text-amber-800",
  fail_immediate_action: "bg-red-100 text-red-800",
};

const cleanColour: Record<CleanlinessRating, string> = {
  excellent: "bg-emerald-100 text-emerald-800",
  good: "bg-blue-100 text-blue-800",
  adequate: "bg-amber-100 text-amber-800",
  needs_attention: "bg-red-100 text-red-800",
};

export default function MedicationStorageAuditPage() {
  const { data: res, isLoading } = useMedicationStorageAudits();
  const data: MedicationStorageAudit[] = res?.data ?? [];

  const [filterCabinet, setFilterCabinet] = useState("all");
  const [filterVerdict, setFilterVerdict] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterCabinet !== "all") items = items.filter((a) => a.cabinet_type === filterCabinet);
    if (filterVerdict !== "all") items = items.filter((a) => a.overall_verdict === filterVerdict);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.audit_date.localeCompare(a.audit_date);
        case "verdict": {
          const ord: Record<StorageAuditVerdict, number> = { fail_immediate_action: 0, pass_with_minor_actions: 1, pass: 2 };
          return ord[a.overall_verdict] - ord[b.overall_verdict];
        }
        case "next":
          return a.next_audit_due.localeCompare(b.next_audit_due);
        default:
          return 0;
      }
    });
    return items;
  }, [data, filterCabinet, filterVerdict, sortBy]);

  const total = data.length;
  const passed = data.filter((a) => a.overall_verdict === "pass").length;
  const expiredFound = data.reduce((sum, a) => sum + a.expired_found.length, 0);
  const overdueAudits = data.filter((a) => a.next_audit_due < d(0)).length;

  const exportCols: ExportColumn<MedicationStorageAudit>[] = [
    { header: "Date", accessor: (r) => r.audit_date },
    { header: "Auditor", accessor: (r) => getStaffName(r.auditor) },
    { header: "Cabinet", accessor: (r) => r.cabinet_location },
    { header: "Type", accessor: (r) => STORAGE_AUDIT_CABINET_TYPE_LABEL[r.cabinet_type] },
    { header: "Temp Recorded", accessor: (r) => `${r.temperature_recorded}°C` },
    { header: "Verdict", accessor: (r) => STORAGE_AUDIT_VERDICT_LABEL[r.overall_verdict] },
    { header: "Cleanliness", accessor: (r) => CLEANLINESS_RATING_LABEL[r.cleanliness_rating] },
    { header: "Expired Found", accessor: (r) => String(r.expired_found.length) },
    { header: "Next Audit", accessor: (r) => r.next_audit_due },
  ];

  if (isLoading) return <PageShell title="Medication Storage Audit" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Medication Storage Audit"
      subtitle="Regular audits of all medication storage locations — security, temperature, expiry, records"
      caraContext={{ pageTitle: "Medication Storage Audit", sourceType: "medication" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="medication-storage-audit" />
          <PrintButton title="Medication Storage Audits" />
          <CaraStudioQuickActionButton context={{ record_type: "medication", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Recent Audits</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{total > 0 ? Math.round((passed / total) * 100) : 0}%</p>
          <p className="text-xs text-muted-foreground">Full Pass Rate</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", expiredFound > 0 ? "text-amber-600" : "text-green-600")}>{expiredFound}</p>
          <p className="text-xs text-muted-foreground">Expired Items Caught</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", overdueAudits > 0 ? "text-red-600" : "text-green-600")}>{overdueAudits}</p>
          <p className="text-xs text-muted-foreground">Audits Overdue</p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6 flex items-start gap-2">
        <Pill className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          Medication storage is audited on a rolling 4-weekly schedule across all cabinets, with controlled
          drug safe audited weekly. Audits check security, temperature, expiry, stock balance, and record
          keeping. Findings inform learning, not blame.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterCabinet} onValueChange={setFilterCabinet}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="All Cabinets" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cabinet Types</SelectItem>
            {(Object.keys(STORAGE_AUDIT_CABINET_TYPE_LABEL) as StorageAuditCabinetType[]).map((k) => (
              <SelectItem key={k} value={k}>{STORAGE_AUDIT_CABINET_TYPE_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterVerdict} onValueChange={setFilterVerdict}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="All Verdicts" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Verdicts</SelectItem>
            {(Object.keys(STORAGE_AUDIT_VERDICT_LABEL) as StorageAuditVerdict[]).map((k) => (
              <SelectItem key={k} value={k}>{STORAGE_AUDIT_VERDICT_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="verdict">By Verdict</SelectItem>
              <SelectItem value="next">Earliest Next</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((a) => {
          const isExpanded = expandedId === a.id;
          const passedChecks = a.checks.filter((c: StorageAuditCheckItem) => c.pass).length;

          return (
            <div key={a.id} className={cn("rounded-xl border bg-white overflow-hidden",
              a.overall_verdict === "fail_immediate_action" && "border-l-4 border-l-red-500"
            )}>
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : a.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Lock className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{a.cabinet_location}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.audit_date} &middot; {STORAGE_AUDIT_CABINET_TYPE_LABEL[a.cabinet_type]} &middot; {passedChecks}/{a.checks.length} checks &middot; {a.temperature_recorded}°C
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", verdictColour[a.overall_verdict])}>
                    {STORAGE_AUDIT_VERDICT_LABEL[a.overall_verdict]}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-white rounded-lg p-2 border text-center">
                      <p className="text-xs text-muted-foreground">Cleanliness</p>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", cleanColour[a.cleanliness_rating])}>{CLEANLINESS_RATING_LABEL[a.cleanliness_rating]}</span>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center">
                      <p className="text-xs text-muted-foreground">Security</p>
                      <p className="text-sm font-medium text-green-600">{a.security_check_pass ? "Pass" : "Fail"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center">
                      <p className="text-xs text-muted-foreground">Temperature</p>
                      <p className="text-sm font-medium">{a.temperature_recorded}°C ({a.temperature_range})</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center">
                      <p className="text-xs text-muted-foreground">CD Balance</p>
                      <p className="text-sm font-medium text-green-600">{a.controlled_drugs_balance_correct ? "Correct" : "Discrepancy"}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Audit Checks</p>
                    <div className="space-y-1">
                      {a.checks.map((c: StorageAuditCheckItem, i: number) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-start gap-2">
                          {c.pass ? <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> : <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />}
                          <div className="flex-1">
                            <p className="font-medium">{c.item}</p>
                            <p className="text-xs text-muted-foreground">{c.observation}</p>
                            {c.action_required && <p className="text-xs text-amber-700 mt-1"><strong>Action:</strong> {c.action_required}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {a.expiring_soon.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        <Clock className="h-3 w-3 inline mr-1" />Expiring Soon (within 60 days)
                      </p>
                      <ul className="space-y-1">
                        {a.expiring_soon.map((e: StorageAuditExpiringItem, i: number) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span><strong>{e.medication}</strong> — expires {e.expiry_date}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {a.expired_found.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />Expired Items Found &amp; Disposed
                      </p>
                      <ul className="space-y-1">
                        {a.expired_found.map((e: StorageAuditExpiredItem, i: number) => (
                          <li key={i} className="text-sm">
                            <strong>{e.medication}</strong> (expired {e.expiry_date}) — disposed {e.disposal_date}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {a.immediate_actions_taken.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Immediate Actions Taken</p>
                      <ul className="space-y-1">
                        {a.immediate_actions_taken.map((act: string, i: number) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(a.follow_up_actions?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Follow-Up Actions</p>
                      <div className="space-y-1">
                        {(a.follow_up_actions ?? []).map((f: StorageAuditFollowUp, i: number) => (
                          <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-start justify-between gap-2">
                            <span className="flex-1">{f.action}</span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {getStaffName(f.owner)} &middot; {f.deadline}
                            </span>
                            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                              f.status === "done" ? "bg-green-100 text-green-800" :
                              f.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                              "bg-amber-100 text-amber-800"
                            )}>
                              {FOLLOW_UP_STATUS_LABEL[f.status]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Thermometer className="h-3 w-3 inline mr-1" />{a.temperature_recorded}°C / range {a.temperature_range}</span>
                    <span>Audited by: {getStaffName(a.auditor)}</span>
                    <span>Signed off: {getStaffName(a.signed_off_by)}</span>
                    <span>Next audit: {a.next_audit_due}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Medication storage audits support Quality Standard 7 (health
          and wellbeing), Care Quality Commission medication standards, NICE NG5 (managing medicines), and
          MHRA Yellow Card scheme. Audited rolling 4-weekly minimum; controlled drugs safe weekly. Linked
          to MAR Sheet, Medication Audit, Medication Stock Check, and Medication Near-Miss Log.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Medication"
        category="medication"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Medication Storage Audit — safe storage checks, controlled drug cabinet, fridge temperatures, expiry dates, stock counts, disposal records, CQC compliance, Annex A evidence"
        recordType="medication"
        className="mt-6"
      />
    </PageShell>
  );
}
