"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Filter, ArrowUpDown, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, XCircle, Clock, Pill, ShieldCheck, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useMarEntries } from "@/hooks/use-mar-entries";
import type { MarEntry, MarRoute, MarScheduleType } from "@/types/extended";
import { MAR_ROUTE_LABEL, MAR_SCHEDULE_TYPE_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── UI metadata ──────────────────────────────────────────────────────── */

const ROUTE_CONFIG: Record<MarRoute, { color: string; bg: string; border: string }> = {
  oral:      { color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  topical:   { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  inhaler:   { color: "text-cyan-700",    bg: "bg-cyan-50",    border: "border-cyan-200" },
  injection: { color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200" },
};

const TYPE_CONFIG: Record<MarScheduleType, { color: string; bg: string; border: string }> = {
  scheduled: { color: "text-slate-700", bg: "bg-slate-100", border: "border-slate-200" },
  prn:       { color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" },
};

/* ── Helpers ──────────────────────────────────────────────────────────── */

function formatDate(dateStr: string): string {
  const dt = new Date(dateStr + "T00:00:00");
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function isWithinLastDays(dateStr: string, days: number): boolean {
  const target = new Date(dateStr + "T00:00:00").getTime();
  const now = new Date().getTime();
  const diffDays = (now - target) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
}

type EntryStatus = "given" | "refused" | "missed";

function getStatus(e: MarEntry): EntryStatus {
  if (e.refused) return "refused";
  if (e.missed_dose) return "missed";
  return "given";
}

/* ── Page ─────────────────────────────────────────────────────────────── */

export default function MarSheetPage() {
  const { data: res, isLoading } = useMarEntries();
  const entries: MarEntry[] = res?.data ?? [];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ypFilter, setYpFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<EntryStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "young_person">("newest");

  const today = todayStr();

  const filtered = useMemo(() => {
    let list = [...entries];
    if (ypFilter !== "all") list = list.filter((e) => e.child_id === ypFilter);
    if (dateFilter !== "all") list = list.filter((e) => e.date === dateFilter);
    if (statusFilter !== "all") list = list.filter((e) => getStatus(e) === statusFilter);

    switch (sortBy) {
      case "newest": list.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)); break;
      case "oldest": list.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)); break;
      case "young_person": list.sort((a, b) => {
        const cmp = getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        if (cmp !== 0) return cmp;
        return (b.date + b.time).localeCompare(a.date + a.time);
      }); break;
    }
    return list;
  }, [entries, ypFilter, dateFilter, statusFilter, sortBy]);

  const stats = useMemo(() => {
    const dosesToday = entries.filter((e) => e.date === today && !e.refused && !e.missed_dose).length;
    const refusalsThisWeek = entries.filter((e) => e.refused && isWithinLastDays(e.date, 7)).length;
    const missedThisWeek = entries.filter((e) => e.missed_dose && isWithinLastDays(e.date, 7)).length;
    const auditCompliant = entries.filter((e) => e.signature && e.administered_by && e.witnessed_by && e.expiry_check && e.batch_number.trim() !== "").length;
    const auditPct = entries.length > 0 ? Math.round((auditCompliant / entries.length) * 100) : 100;
    return { dosesToday, refusalsThisWeek, missedThisWeek, auditPct };
  }, [entries, today]);

  const distinctDates = useMemo(() => {
    const set = new Set(entries.map((e) => e.date));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [entries]);

  const exportColumns = useMemo<ExportColumn<MarEntry>[]>(() => [
    { header: "Date", accessor: (r) => r.date },
    { header: "Time", accessor: (r) => r.time },
    { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
    { header: "Medication", accessor: (r) => r.medication_name },
    { header: "Dose", accessor: (r) => r.dose },
    { header: "Route", accessor: (r) => MAR_ROUTE_LABEL[r.route] },
    { header: "Type", accessor: (r) => MAR_SCHEDULE_TYPE_LABEL[r.schedule_type] },
    { header: "Administered By", accessor: (r) => getStaffName(r.administered_by) },
    { header: "Witnessed By", accessor: (r) => getStaffName(r.witnessed_by) },
    { header: "Signature", accessor: (r) => getStaffName(r.signature) },
    { header: "Status", accessor: (r) => r.refused ? "Refused" : r.missed_dose ? "Missed" : "Given" },
    { header: "Refusal Reason", accessor: (r) => r.refusal_reason },
    { header: "Missed Reason", accessor: (r) => r.missed_reason },
    { header: "Notes", accessor: (r) => r.notes },
    { header: "Batch Number", accessor: (r) => r.batch_number },
    { header: "Expiry Verified", accessor: (r) => r.expiry_check ? "Yes" : "No" },
  ], []);

  const followUps = entries.filter((e) => (e.refused || e.missed_dose) && isWithinLastDays(e.date, 7));
  const hasFilters = ypFilter !== "all" || dateFilter !== "all" || statusFilter !== "all";

  if (isLoading) return <PageShell title="MAR Sheet" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="MAR Sheet — Medication Administration Records"
      subtitle="Quality Standard 7 — Daily record of every medication dose given"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Medication Administration Record" />
          <ExportButton<MarEntry> data={filtered} columns={exportColumns} filename="mar-sheet" />
        </div>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Card className="border-slate-200"><CardContent className="p-3"><div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Doses Today</div><div className="text-2xl font-bold text-emerald-600 mt-0.5">{stats.dosesToday}</div></CardContent></Card>
        <Card className="border-slate-200"><CardContent className="p-3"><div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Refusals (7d)</div><div className={cn("text-2xl font-bold mt-0.5", stats.refusalsThisWeek > 0 ? "text-rose-600" : "text-slate-900")}>{stats.refusalsThisWeek}</div></CardContent></Card>
        <Card className="border-slate-200"><CardContent className="p-3"><div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Missed Doses (7d)</div><div className={cn("text-2xl font-bold mt-0.5", stats.missedThisWeek > 0 ? "text-amber-600" : "text-slate-900")}>{stats.missedThisWeek}</div></CardContent></Card>
        <Card className="border-slate-200"><CardContent className="p-3"><div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Audit Compliance</div><div className={cn("text-2xl font-bold mt-0.5", stats.auditPct === 100 ? "text-emerald-600" : "text-amber-600")}>{stats.auditPct}<span className="text-sm font-normal text-slate-400">%</span></div></CardContent></Card>
      </div>

      {followUps.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-amber-800">{followUps.length} entr{followUps.length !== 1 ? "ies" : "y"} require follow-up</p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              {followUps.map((f) => `${getYPName(f.child_id)} — ${f.medication_name} (${f.refused ? "refused" : "missed"}, ${formatDate(f.date)})`).join(" | ")}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Select value={ypFilter} onValueChange={setYpFilter}>
          <SelectTrigger className="h-8 text-xs w-[160px]"><Filter className="h-3 w-3 mr-1 text-slate-400" /><SelectValue placeholder="Young person" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Young People</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="h-8 text-xs w-[160px]"><SelectValue placeholder="Date" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            {distinctDates.map((dt) => (<SelectItem key={dt} value={dt}>{formatDate(dt)}{dt === today ? " (Today)" : ""}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as EntryStatus | "all")}>
          <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="given">Given</SelectItem>
            <SelectItem value="refused">Refused</SelectItem>
            <SelectItem value="missed">Missed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="h-8 text-xs w-[150px]"><ArrowUpDown className="h-3 w-3 mr-1 text-slate-400" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="young_person">By young person</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-400 hover:text-slate-600" onClick={() => { setYpFilter("all"); setDateFilter("all"); setStatusFilter("all"); }}>
            <XCircle className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </div>

      <p className="text-[11px] text-slate-400 mb-3">Showing {filtered.length} of {entries.length} record{entries.length !== 1 ? "s" : ""}</p>

      <div className="space-y-2">
        {filtered.length === 0 && (<div className="text-center py-12 text-sm text-slate-400">No MAR entries match the current filters.</div>)}

        {filtered.map((entry) => {
          const isExpanded = expandedId === entry.id;
          const status = getStatus(entry);
          const routeCfg = ROUTE_CONFIG[entry.route];
          const typeCfg = TYPE_CONFIG[entry.schedule_type];
          const isCompliant = entry.signature && entry.administered_by && entry.witnessed_by && entry.expiry_check && entry.batch_number.trim() !== "";

          return (
            <div key={entry.id} className={cn("rounded-lg border bg-white transition-all", status === "refused" && "border-rose-300", status === "missed" && "border-amber-300", !isCompliant && status === "given" && "border-orange-300")}>
              <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50/50" onClick={() => setExpandedId(isExpanded ? null : entry.id)}>
                <div className="flex-shrink-0">
                  {status === "given" && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                  {status === "refused" && <XCircle className="h-5 w-5 text-rose-600" />}
                  {status === "missed" && <AlertTriangle className="h-5 w-5 text-amber-600" />}
                </div>
                <div className="flex-shrink-0 w-[110px]">
                  <div className="text-xs font-medium text-slate-700">{formatDate(entry.date)}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{entry.time}</div>
                </div>
                <div className="flex-shrink-0 w-[110px]"><div className="text-xs font-semibold text-slate-900">{getYPName(entry.child_id)}</div></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate flex items-center gap-1.5">
                    <Pill className="h-3 w-3 text-slate-400 flex-shrink-0" /> {entry.medication_name}
                    <span className="text-slate-500 font-normal">— {entry.dose}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge className={cn("text-[9px] px-1.5 py-0 border", routeCfg.bg, routeCfg.color, routeCfg.border)}>{MAR_ROUTE_LABEL[entry.route]}</Badge>
                    <Badge className={cn("text-[9px] px-1.5 py-0 border", typeCfg.bg, typeCfg.color, typeCfg.border)}>{MAR_SCHEDULE_TYPE_LABEL[entry.schedule_type]}</Badge>
                    {status === "refused" && <Badge className="text-[9px] px-1.5 py-0 bg-rose-50 text-rose-700 border border-rose-200">Refused</Badge>}
                    {status === "missed" && <Badge className="text-[9px] px-1.5 py-0 bg-amber-50 text-amber-700 border border-amber-200">Missed</Badge>}
                  </div>
                </div>
                <div className="flex-shrink-0 hidden md:block text-right">
                  <div className="text-[10px] text-slate-400">Signed</div>
                  <div className="text-xs font-medium text-slate-700">{getStaffName(entry.signature)}</div>
                </div>
                <div className="flex-shrink-0">{isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}</div>
              </div>

              {isExpanded && (
                <div className="border-t px-4 pb-4 pt-3 space-y-3">
                  {entry.refused && (
                    <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
                      <h4 className="text-[11px] font-semibold text-rose-700 uppercase tracking-wide mb-1 flex items-center gap-1"><XCircle className="h-3 w-3" /> Refusal Reason</h4>
                      <p className="text-xs text-rose-900 leading-relaxed">{entry.refusal_reason}</p>
                    </div>
                  )}
                  {entry.missed_dose && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <h4 className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide mb-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Missed Dose Reason</h4>
                      <p className="text-xs text-amber-900 leading-relaxed">{entry.missed_reason}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div><div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Administered By</div><div className="text-xs text-slate-800">{getStaffName(entry.administered_by)}</div></div>
                    <div><div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Witnessed By</div><div className="text-xs text-slate-800">{getStaffName(entry.witnessed_by)}</div></div>
                    <div><div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Signature</div><div className="text-xs text-slate-800 font-medium">{getStaffName(entry.signature)}</div></div>
                    <div><div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Route / Type</div><div className="text-xs text-slate-800">{MAR_ROUTE_LABEL[entry.route]} — {MAR_SCHEDULE_TYPE_LABEL[entry.schedule_type]}</div></div>
                  </div>
                  {entry.notes && (<div><h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</h4><p className="text-xs text-slate-700 leading-relaxed">{entry.notes}</p></div>)}
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={cn("h-4 w-4", entry.expiry_check ? "text-emerald-600" : "text-amber-600")} />
                      <div><div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Batch Number</div><div className="text-xs font-mono text-slate-800">{entry.batch_number || "—"}</div></div>
                    </div>
                    <div className="text-right"><div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Expiry Verified</div><div className={cn("text-xs font-medium", entry.expiry_check ? "text-emerald-700" : "text-amber-700")}>{entry.expiry_check ? "Yes — checked at administration" : "Not verified"}</div></div>
                  </div>
                  <SmartLinkPanel sourceType="mar-sheet" sourceId={entry.id} childId={entry.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-[10px] text-slate-500 leading-relaxed">
          <strong>Regulatory context:</strong> The Medication Administration Record supports compliance with{" "}
          <strong>Quality Standard 7 (Health and wellbeing)</strong> of the Children&apos;s Homes (England)
          Regulations 2015 and the home&apos;s medication policy. Every dose — given, refused, or missed —
          must be contemporaneously recorded and signed by the administering staff member, with a
          witness for controlled drugs and as required by policy. Refusals and missed doses must be
          followed up with the GP and recorded in the young person&apos;s health record. Records are subject
          to Ofsted inspection and pharmacy audit.
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
