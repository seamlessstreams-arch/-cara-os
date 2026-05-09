"use client";

import { useState, useMemo } from "react";
import {
  FileText, CheckCircle2, AlertTriangle, Shield,
  Calendar, Search, ChevronDown, ChevronUp,
  Database, Archive, MapPin, XCircle,
  ClipboardCheck, X, Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useReg22Records } from "@/hooks/use-reg22-records";
import type { Reg22Record, Reg22ComplianceStatus } from "@/types/extended";
import { REG22_COMPLIANCE_STATUS_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── helpers ─────────────────────────────────────────────────────────── */

const fmt = (iso: string) => {
  const [y, m, day] = iso.split("-");
  return `${day}/${m}/${y}`;
};

/* ── local colour config ─────────────────────────────────────────────── */

const STATUS_CONFIG: Record<Reg22ComplianceStatus, { colour: string; icon: typeof CheckCircle2 }> = {
  compliant:           { colour: "bg-green-100 text-green-800",  icon: CheckCircle2   },
  partially_compliant: { colour: "bg-amber-100 text-amber-800",  icon: AlertTriangle  },
  non_compliant:       { colour: "bg-red-100 text-red-800",      icon: XCircle        },
};

/* ── page ───────────────────────────────────────────────────────────── */

export default function Reg22RecordsPage() {
  const { data: records = [], isLoading } = useReg22Records();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Reg22ComplianceStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...records];
    if (statusFilter !== "all") list = list.filter(r => r.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.record_category.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.schedule_ref.toLowerCase().includes(q) ||
        r.where_stored.toLowerCase().includes(q)
      );
    }
    return list;
  }, [records, search, statusFilter]);

  const stats = useMemo(() => {
    const total = records.length;
    const compliant = records.filter(r => r.status === "compliant").length;
    const partial = records.filter(r => r.status === "partially_compliant").length;
    const nonCompliant = records.filter(r => r.status === "non_compliant").length;
    const dates = records.map(r => r.last_audit_date).sort();
    const lastFullAudit = dates[0] || "";
    return { total, compliant, partial, nonCompliant, lastFullAudit };
  }, [records]);

  const hasIssues = stats.partial > 0 || stats.nonCompliant > 0;

  if (isLoading) {
    return (
      <PageShell title="Regulation 22 Records" subtitle="Schedule 3 statutory records — compliance tracker">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Regulation 22 Records"
      subtitle="Schedule 3 statutory records — compliance tracker"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Regulation 22 Records" subtitle="Oak House — Schedule 3 Compliance" />
        </div>
      }
    >
      <div className="space-y-6" id="reg22-print">

        {/* ── Summary cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Records",        value: stats.total,        icon: Database,       c: "text-slate-600"  },
            { label: "Compliant",             value: stats.compliant,    icon: CheckCircle2,   c: "text-green-600"  },
            { label: "Partially Compliant",   value: stats.partial,      icon: AlertTriangle,  c: "text-amber-600"  },
            { label: "Non-Compliant",         value: stats.nonCompliant, icon: XCircle,        c: "text-red-600"    },
            { label: "Last Full Audit",       value: stats.lastFullAudit ? fmt(stats.lastFullAudit) : "—", icon: Calendar, c: "text-indigo-600" },
          ].map(s => (
            <div key={s.label} className="rounded-lg border bg-card p-3 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5 shrink-0", s.c)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Alert banner ─────────────────────────────────────────────── */}
        {hasIssues && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-3 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-300">
              <p className="font-semibold">Compliance action required</p>
              <p className="mt-0.5">
                {stats.nonCompliant > 0 && (
                  <span><strong>{stats.nonCompliant}</strong> record categor{stats.nonCompliant === 1 ? "y is" : "ies are"} non-compliant. </span>
                )}
                {stats.partial > 0 && (
                  <span><strong>{stats.partial}</strong> record categor{stats.partial === 1 ? "y" : "ies"} partially compliant — review and resolve outstanding actions before next Reg 44 visit or Ofsted inspection.</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* ── Filters ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search records..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <div className="flex gap-1">
            {(["all", "compliant", "partially_compliant", "non_compliant"] as const).map(f => {
              const labels: Record<string, string> = {
                all: "All", compliant: "Compliant",
                partially_compliant: "Partial", non_compliant: "Non-Compliant",
              };
              return (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium",
                    statusFilter === f
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                  )}
                >
                  {labels[f]}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {filtered.length} record categor{filtered.length !== 1 ? "ies" : "y"}
        </p>

        {/* ── Record categories ────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="font-medium">No records match your search</p>
            </div>
          )}

          {filtered.map(record => {
            const isOpen = expandedId === record.id;
            const sc = STATUS_CONFIG[record.status];
            const StatusIcon = sc.icon;

            return (
              <div
                key={record.id}
                className={cn(
                  "rounded-lg border bg-card overflow-hidden",
                  record.status === "non_compliant" && "border-red-200",
                  record.status === "partially_compliant" && "border-amber-200",
                )}
              >
                <button
                  onClick={() => setExpandedId(isOpen ? null : record.id)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className={cn("rounded-full p-1.5 shrink-0", sc.colour)}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{record.record_category}</span>
                      <Badge variant="outline" className={cn("text-xs", sc.colour)}>
                        {REG22_COMPLIANCE_STATUS_LABEL[record.status]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {record.schedule_ref} · Audited {fmt(record.last_audit_date)} by {getStaffName(record.audited_by)}
                    </p>
                  </div>
                  {isOpen
                    ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  }
                </button>

                {isOpen && (
                  <div className="border-t px-4 py-3 space-y-3 bg-muted/30">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Description</p>
                      <p className="text-sm">{record.description}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Where Stored
                        </p>
                        <p className="text-sm">{record.where_stored}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                          <Archive className="h-3 w-3" /> Retention Period
                        </p>
                        <p className="text-sm">{record.retention_period}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                          <ClipboardCheck className="h-3 w-3" /> Last Audited
                        </p>
                        <p className="text-sm">{fmt(record.last_audit_date)} — {getStaffName(record.audited_by)}</p>
                      </div>
                    </div>
                    {record.notes && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Notes</p>
                        <p className="text-sm">{record.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Regulatory note ──────────────────────────────────────────── */}
        <div className="rounded-lg border border-dashed p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-semibold">Regulatory Context</p>
              <p>
                <strong>Regulation 22</strong> of the Children&apos;s Homes (England) Regulations 2015 requires the
                registered person to maintain records specified in <strong>Schedule 3</strong> and ensure they are kept
                up to date. Records must be retained for the period specified in Schedule 3 (typically 15 years for
                operational records, 75 years from date of birth for children&apos;s records). The <strong>Data
                Protection Act 2018</strong> and UK GDPR govern how personal data within these records is processed,
                stored, and shared. Ofsted inspectors routinely check the completeness and quality of Schedule 3 records
                as part of the social care common inspection framework. Failure to maintain required records may result
                in a compliance notice or enforcement action.
              </p>
            </div>
          </div>
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
