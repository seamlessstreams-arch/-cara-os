"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MEDICATION ADMINISTRATION RECORD (MAR SHEET)
// Daily formal record of every medication dose given, signed by the
// administering staff member. Required by Quality Standard 7 (health) and
// the home's medication policy. Each entry represents a single dose event.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Filter, ArrowUpDown, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, XCircle, Clock, Pill, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

// ── Types ─────────────────────────────────────────────────────────────────────

type Route = "Oral" | "Topical" | "Inhaler" | "Injection";
type PrnOrScheduled = "PRN" | "Scheduled";

interface MarEntry {
  id: string;
  date: string;            // YYYY-MM-DD
  time: string;            // HH:mm
  youngPerson: string;     // yp_*
  medicationName: string;
  dose: string;            // e.g. "10mg", "5ml"
  route: Route;
  prnOrScheduled: PrnOrScheduled;
  administeredBy: string;  // staff_*
  witnessedBy: string;     // staff_*
  signature: string;       // staff_*
  refused: boolean;
  refusalReason: string;
  missedDose: boolean;
  missedReason: string;
  notes: string;
  batchNumber: string;
  expiryCheck: boolean;
}

// ── Config ────────────────────────────────────────────────────────────────────

const ROUTE_CONFIG: Record<Route, { color: string; bg: string; border: string }> = {
  Oral:      { color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  Topical:   { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  Inhaler:   { color: "text-cyan-700",    bg: "bg-cyan-50",    border: "border-cyan-200" },
  Injection: { color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200" },
};

const TYPE_CONFIG: Record<PrnOrScheduled, { color: string; bg: string; border: string }> = {
  Scheduled: { color: "text-slate-700",   bg: "bg-slate-100",  border: "border-slate-200" },
  PRN:       { color: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200" },
};

// ── Seed Data ────────────────────────────────────────────────────────────────

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const SEED_ENTRIES: MarEntry[] = [
  // ── Today ───────────────────────────────────────────────────────────────
  {
    id: "mar_001",
    date: d(0),
    time: "08:00",
    youngPerson: "yp_alex",
    medicationName: "Melatonin",
    dose: "3mg",
    route: "Oral",
    prnOrScheduled: "Scheduled",
    administeredBy: "staff_anna",
    witnessedBy: "staff_ryan",
    signature: "staff_anna",
    refused: false,
    refusalReason: "",
    missedDose: false,
    missedReason: "",
    notes: "Taken without issue with breakfast. Alex compliant.",
    batchNumber: "MEL-2026-04-A12",
    expiryCheck: true,
  },
  {
    id: "mar_002",
    date: d(0),
    time: "08:15",
    youngPerson: "yp_jordan",
    medicationName: "Methylphenidate (Concerta XL)",
    dose: "36mg",
    route: "Oral",
    prnOrScheduled: "Scheduled",
    administeredBy: "staff_anna",
    witnessedBy: "staff_ryan",
    signature: "staff_anna",
    refused: false,
    refusalReason: "",
    missedDose: false,
    missedReason: "",
    notes: "Morning dose taken before school. Eaten breakfast first as per protocol.",
    batchNumber: "CON-2026-03-B07",
    expiryCheck: true,
  },
  {
    id: "mar_003",
    date: d(0),
    time: "08:30",
    youngPerson: "yp_casey",
    medicationName: "Fluoxetine",
    dose: "20mg",
    route: "Oral",
    prnOrScheduled: "Scheduled",
    administeredBy: "staff_anna",
    witnessedBy: "staff_ryan",
    signature: "staff_anna",
    refused: false,
    refusalReason: "",
    missedDose: false,
    missedReason: "",
    notes: "Taken with water. No side effects reported.",
    batchNumber: "FLX-2026-02-C44",
    expiryCheck: true,
  },
  {
    id: "mar_004",
    date: d(0),
    time: "07:45",
    youngPerson: "yp_alex",
    medicationName: "Salbutamol Inhaler",
    dose: "2 puffs",
    route: "Inhaler",
    prnOrScheduled: "PRN",
    administeredBy: "staff_anna",
    witnessedBy: "staff_ryan",
    signature: "staff_anna",
    refused: false,
    refusalReason: "",
    missedDose: false,
    missedReason: "",
    notes: "Pre-PE inhaler as per asthma plan. Good technique with spacer.",
    batchNumber: "SAL-2026-01-D19",
    expiryCheck: true,
  },

  // ── Yesterday ───────────────────────────────────────────────────────────
  {
    id: "mar_005",
    date: d(-1),
    time: "21:00",
    youngPerson: "yp_alex",
    medicationName: "Melatonin",
    dose: "3mg",
    route: "Oral",
    prnOrScheduled: "Scheduled",
    administeredBy: "staff_edward",
    witnessedBy: "staff_chervelle",
    signature: "staff_edward",
    refused: false,
    refusalReason: "",
    missedDose: false,
    missedReason: "",
    notes: "Taken at usual bedtime routine. Settled to sleep within 30 minutes.",
    batchNumber: "MEL-2026-04-A12",
    expiryCheck: true,
  },
  {
    id: "mar_006",
    date: d(-1),
    time: "20:30",
    youngPerson: "yp_casey",
    medicationName: "Fluoxetine",
    dose: "20mg",
    route: "Oral",
    prnOrScheduled: "Scheduled",
    administeredBy: "staff_edward",
    witnessedBy: "staff_chervelle",
    signature: "staff_edward",
    refused: true,
    refusalReason: "Casey refused medication stating she 'doesn't want to take it tonight'. Spoke calmly with her, offered again 20 mins later — still refused. Recorded on care plan, GP to be informed in morning. Casey settled but low mood noted.",
    missedDose: false,
    missedReason: "",
    notes: "Refusal logged. Manager and GP to follow up. Casey's keyworker session brought forward.",
    batchNumber: "FLX-2026-02-C44",
    expiryCheck: true,
  },
  {
    id: "mar_007",
    date: d(-1),
    time: "08:15",
    youngPerson: "yp_jordan",
    medicationName: "Methylphenidate (Concerta XL)",
    dose: "36mg",
    route: "Oral",
    prnOrScheduled: "Scheduled",
    administeredBy: "staff_mirela",
    witnessedBy: "staff_lackson",
    signature: "staff_mirela",
    refused: false,
    refusalReason: "",
    missedDose: false,
    missedReason: "",
    notes: "Taken with toast. Jordan in good spirits before school.",
    batchNumber: "CON-2026-03-B07",
    expiryCheck: true,
  },

  // ── 2 days ago ──────────────────────────────────────────────────────────
  {
    id: "mar_008",
    date: d(-2),
    time: "08:00",
    youngPerson: "yp_alex",
    medicationName: "Melatonin",
    dose: "3mg",
    route: "Oral",
    prnOrScheduled: "Scheduled",
    administeredBy: "staff_ryan",
    witnessedBy: "staff_anna",
    signature: "staff_ryan",
    refused: false,
    refusalReason: "",
    missedDose: false,
    missedReason: "",
    notes: "Taken with juice. No issues.",
    batchNumber: "MEL-2026-04-A12",
    expiryCheck: true,
  },
  {
    id: "mar_009",
    date: d(-2),
    time: "08:15",
    youngPerson: "yp_jordan",
    medicationName: "Methylphenidate (Concerta XL)",
    dose: "36mg",
    route: "Oral",
    prnOrScheduled: "Scheduled",
    administeredBy: "staff_ryan",
    witnessedBy: "staff_anna",
    signature: "staff_ryan",
    refused: false,
    refusalReason: "",
    missedDose: true,
    missedReason: "Jordan was unwell with stomach bug overnight and vomiting in early morning. GP advised on the phone to skip morning dose to avoid further upset. School informed Jordan would be off and that medication had not been given. Late dose not given as would interfere with sleep. Documented in health record.",
    notes: "Missed dose due to illness. GP-advised omission. Returned to normal schedule next day.",
    batchNumber: "CON-2026-03-B07",
    expiryCheck: true,
  },
  {
    id: "mar_010",
    date: d(-2),
    time: "19:00",
    youngPerson: "yp_casey",
    medicationName: "Hydrocortisone Cream 1%",
    dose: "Thin layer to affected area",
    route: "Topical",
    prnOrScheduled: "PRN",
    administeredBy: "staff_chervelle",
    witnessedBy: "staff_edward",
    signature: "staff_chervelle",
    refused: false,
    refusalReason: "",
    missedDose: false,
    missedReason: "",
    notes: "Applied to eczema patch on inner elbow as per dermatology plan. Casey self-applied with supervision.",
    batchNumber: "HYD-2026-05-E22",
    expiryCheck: true,
  },

  // ── 3 days ago ──────────────────────────────────────────────────────────
  {
    id: "mar_011",
    date: d(-3),
    time: "20:30",
    youngPerson: "yp_casey",
    medicationName: "Fluoxetine",
    dose: "20mg",
    route: "Oral",
    prnOrScheduled: "Scheduled",
    administeredBy: "staff_lackson",
    witnessedBy: "staff_mirela",
    signature: "staff_lackson",
    refused: true,
    refusalReason: "Casey refused initially after disagreement during evening routine. Re-offered 30 minutes after de-escalation — accepted and took medication willingly. Witnessed and recorded.",
    missedDose: false,
    missedReason: "",
    notes: "Initial refusal then accepted after support. Keyworker discussion booked.",
    batchNumber: "FLX-2026-02-C44",
    expiryCheck: true,
  },
  {
    id: "mar_012",
    date: d(-3),
    time: "08:00",
    youngPerson: "yp_alex",
    medicationName: "Melatonin",
    dose: "3mg",
    route: "Oral",
    prnOrScheduled: "Scheduled",
    administeredBy: "staff_anna",
    witnessedBy: "staff_ryan",
    signature: "staff_anna",
    refused: false,
    refusalReason: "",
    missedDose: false,
    missedReason: "",
    notes: "Routine morning dose.",
    batchNumber: "MEL-2026-04-A12",
    expiryCheck: true,
  },

  // ── 4 days ago ──────────────────────────────────────────────────────────
  {
    id: "mar_013",
    date: d(-4),
    time: "12:30",
    youngPerson: "yp_jordan",
    medicationName: "Paracetamol",
    dose: "500mg",
    route: "Oral",
    prnOrScheduled: "PRN",
    administeredBy: "staff_darren",
    witnessedBy: "staff_anna",
    signature: "staff_darren",
    refused: false,
    refusalReason: "",
    missedDose: false,
    missedReason: "",
    notes: "Headache reported after school. PRN protocol followed — last dose >6 hours prior. Effective within 40 mins.",
    batchNumber: "PAR-2026-06-F11",
    expiryCheck: true,
  },
  {
    id: "mar_014",
    date: d(-4),
    time: "21:00",
    youngPerson: "yp_alex",
    medicationName: "Melatonin",
    dose: "3mg",
    route: "Oral",
    prnOrScheduled: "Scheduled",
    administeredBy: "staff_edward",
    witnessedBy: "staff_chervelle",
    signature: "staff_edward",
    refused: false,
    refusalReason: "",
    missedDose: false,
    missedReason: "",
    notes: "Bedtime dose. Settled within 25 minutes.",
    batchNumber: "MEL-2026-04-A12",
    expiryCheck: true,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Status helpers ────────────────────────────────────────────────────────────

type EntryStatus = "given" | "refused" | "missed";

function getStatus(e: MarEntry): EntryStatus {
  if (e.refused) return "refused";
  if (e.missedDose) return "missed";
  return "given";
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function MarSheetPage() {
  const [entries] = useState<MarEntry[]>(SEED_ENTRIES);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [ypFilter, setYpFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<EntryStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "young_person">("newest");

  const today = todayStr();

  // ── Filtered + sorted list ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...entries];

    if (ypFilter !== "all") {
      list = list.filter((e) => e.youngPerson === ypFilter);
    }
    if (dateFilter !== "all") {
      list = list.filter((e) => e.date === dateFilter);
    }
    if (statusFilter !== "all") {
      list = list.filter((e) => getStatus(e) === statusFilter);
    }

    switch (sortBy) {
      case "newest":
        list.sort((a, b) =>
          (b.date + b.time).localeCompare(a.date + a.time)
        );
        break;
      case "oldest":
        list.sort((a, b) =>
          (a.date + a.time).localeCompare(b.date + b.time)
        );
        break;
      case "young_person":
        list.sort((a, b) => {
          const cmp = getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
          if (cmp !== 0) return cmp;
          return (b.date + b.time).localeCompare(a.date + a.time);
        });
        break;
    }

    return list;
  }, [entries, ypFilter, dateFilter, statusFilter, sortBy]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const dosesToday = entries.filter(
      (e) => e.date === today && !e.refused && !e.missedDose
    ).length;
    const refusalsThisWeek = entries.filter(
      (e) => e.refused && isWithinLastDays(e.date, 7)
    ).length;
    const missedThisWeek = entries.filter(
      (e) => e.missedDose && isWithinLastDays(e.date, 7)
    ).length;

    // Audit compliance: percentage of entries with all required fields
    // (signature, witness, expiryCheck, batch number)
    const auditCompliant = entries.filter(
      (e) =>
        e.signature &&
        e.administeredBy &&
        e.witnessedBy &&
        e.expiryCheck &&
        e.batchNumber.trim() !== ""
    ).length;
    const auditPct =
      entries.length > 0
        ? Math.round((auditCompliant / entries.length) * 100)
        : 100;

    return { dosesToday, refusalsThisWeek, missedThisWeek, auditPct };
  }, [entries, today]);

  // ── Distinct dates for date filter ────────────────────────────────────────
  const distinctDates = useMemo(() => {
    const set = new Set(entries.map((e) => e.date));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [entries]);

  // ── Export columns ────────────────────────────────────────────────────────
  const exportColumns = useMemo<ExportColumn<MarEntry>[]>(() => [
    { header: "Date",            accessor: (r: MarEntry) => r.date },
    { header: "Time",            accessor: (r: MarEntry) => r.time },
    { header: "Young Person",    accessor: (r: MarEntry) => getYPName(r.youngPerson) },
    { header: "Medication",      accessor: (r: MarEntry) => r.medicationName },
    { header: "Dose",            accessor: (r: MarEntry) => r.dose },
    { header: "Route",           accessor: (r: MarEntry) => r.route },
    { header: "Type",            accessor: (r: MarEntry) => r.prnOrScheduled },
    { header: "Administered By", accessor: (r: MarEntry) => getStaffName(r.administeredBy) },
    { header: "Witnessed By",    accessor: (r: MarEntry) => getStaffName(r.witnessedBy) },
    { header: "Signature",       accessor: (r: MarEntry) => getStaffName(r.signature) },
    { header: "Status",          accessor: (r: MarEntry) => r.refused ? "Refused" : r.missedDose ? "Missed" : "Given" },
    { header: "Refusal Reason",  accessor: (r: MarEntry) => r.refusalReason },
    { header: "Missed Reason",   accessor: (r: MarEntry) => r.missedReason },
    { header: "Notes",           accessor: (r: MarEntry) => r.notes },
    { header: "Batch Number",    accessor: (r: MarEntry) => r.batchNumber },
    { header: "Expiry Verified", accessor: (r: MarEntry) => r.expiryCheck ? "Yes" : "No" },
  ], []);

  // ── Follow-up alerts ──────────────────────────────────────────────────────
  const followUps = entries.filter(
    (e) => (e.refused || e.missedDose) && isWithinLastDays(e.date, 7)
  );

  const hasFilters =
    ypFilter !== "all" || dateFilter !== "all" || statusFilter !== "all";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PageShell
      title="MAR Sheet — Medication Administration Records"
      subtitle="Quality Standard 7 — Daily record of every medication dose given"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Medication Administration Record" />
          <ExportButton<MarEntry>
            data={filtered}
            columns={exportColumns}
            filename="mar-sheet"
          />
        </div>
      }
    >
      {/* ── Summary Strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Doses Today</div>
            <div className="text-2xl font-bold text-emerald-600 mt-0.5">{stats.dosesToday}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Refusals (7d)</div>
            <div className={cn("text-2xl font-bold mt-0.5", stats.refusalsThisWeek > 0 ? "text-rose-600" : "text-slate-900")}>
              {stats.refusalsThisWeek}
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Missed Doses (7d)</div>
            <div className={cn("text-2xl font-bold mt-0.5", stats.missedThisWeek > 0 ? "text-amber-600" : "text-slate-900")}>
              {stats.missedThisWeek}
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Audit Compliance</div>
            <div className={cn("text-2xl font-bold mt-0.5", stats.auditPct === 100 ? "text-emerald-600" : "text-amber-600")}>
              {stats.auditPct}<span className="text-sm font-normal text-slate-400">%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Alert Banner ──────────────────────────────────────────────────── */}
      {followUps.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-amber-800">
              {followUps.length} entr{followUps.length !== 1 ? "ies" : "y"} require follow-up
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              {followUps
                .map(
                  (f) =>
                    `${getYPName(f.youngPerson)} — ${f.medicationName} (${f.refused ? "refused" : "missed"}, ${formatDate(f.date)})`
                )
                .join(" | ")}
            </p>
          </div>
        </div>
      )}

      {/* ── Filter Bar ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Select value={ypFilter} onValueChange={setYpFilter}>
          <SelectTrigger className="h-8 text-xs w-[160px]">
            <Filter className="h-3 w-3 mr-1 text-slate-400" />
            <SelectValue placeholder="Young person" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Young People</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="h-8 text-xs w-[160px]">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            {distinctDates.map((dt) => (
              <SelectItem key={dt} value={dt}>
                {formatDate(dt)}{dt === today ? " (Today)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as EntryStatus | "all")}>
          <SelectTrigger className="h-8 text-xs w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="given">Given</SelectItem>
            <SelectItem value="refused">Refused</SelectItem>
            <SelectItem value="missed">Missed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="h-8 text-xs w-[150px]">
            <ArrowUpDown className="h-3 w-3 mr-1 text-slate-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="young_person">By young person</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-slate-400 hover:text-slate-600"
            onClick={() => { setYpFilter("all"); setDateFilter("all"); setStatusFilter("all"); }}
          >
            <XCircle className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* ── Results count ─────────────────────────────────────────────────── */}
      <p className="text-[11px] text-slate-400 mb-3">
        Showing {filtered.length} of {entries.length} record{entries.length !== 1 ? "s" : ""}
      </p>

      {/* ── MAR Entries ───────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-slate-400">
            No MAR entries match the current filters.
          </div>
        )}

        {filtered.map((entry) => {
          const isExpanded = expandedId === entry.id;
          const status = getStatus(entry);
          const routeCfg = ROUTE_CONFIG[entry.route];
          const typeCfg = TYPE_CONFIG[entry.prnOrScheduled];

          // Audit compliance for this row
          const isCompliant =
            entry.signature &&
            entry.administeredBy &&
            entry.witnessedBy &&
            entry.expiryCheck &&
            entry.batchNumber.trim() !== "";

          return (
            <div
              key={entry.id}
              className={cn(
                "rounded-lg border bg-white transition-all",
                status === "refused" && "border-rose-300",
                status === "missed" && "border-amber-300",
                !isCompliant && status === "given" && "border-orange-300",
              )}
            >
              {/* Compact Row */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50/50"
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
              >
                {/* Status icon */}
                <div className="flex-shrink-0">
                  {status === "given" && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  )}
                  {status === "refused" && (
                    <XCircle className="h-5 w-5 text-rose-600" />
                  )}
                  {status === "missed" && (
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  )}
                </div>

                {/* Date / time */}
                <div className="flex-shrink-0 w-[110px]">
                  <div className="text-xs font-medium text-slate-700">
                    {formatDate(entry.date)}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {entry.time}
                  </div>
                </div>

                {/* Young person */}
                <div className="flex-shrink-0 w-[110px]">
                  <div className="text-xs font-semibold text-slate-900">
                    {getYPName(entry.youngPerson)}
                  </div>
                </div>

                {/* Medication + dose */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate flex items-center gap-1.5">
                    <Pill className="h-3 w-3 text-slate-400 flex-shrink-0" />
                    {entry.medicationName}
                    <span className="text-slate-500 font-normal">— {entry.dose}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge className={cn("text-[9px] px-1.5 py-0 border", routeCfg.bg, routeCfg.color, routeCfg.border)}>
                      {entry.route}
                    </Badge>
                    <Badge className={cn("text-[9px] px-1.5 py-0 border", typeCfg.bg, typeCfg.color, typeCfg.border)}>
                      {entry.prnOrScheduled}
                    </Badge>
                    {status === "refused" && (
                      <Badge className="text-[9px] px-1.5 py-0 bg-rose-50 text-rose-700 border border-rose-200">
                        Refused
                      </Badge>
                    )}
                    {status === "missed" && (
                      <Badge className="text-[9px] px-1.5 py-0 bg-amber-50 text-amber-700 border border-amber-200">
                        Missed
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Signature */}
                <div className="flex-shrink-0 hidden md:block text-right">
                  <div className="text-[10px] text-slate-400">Signed</div>
                  <div className="text-xs font-medium text-slate-700">
                    {getStaffName(entry.signature)}
                  </div>
                </div>

                {/* Expand */}
                <div className="flex-shrink-0">
                  {isExpanded
                    ? <ChevronUp className="h-4 w-4 text-slate-400" />
                    : <ChevronDown className="h-4 w-4 text-slate-400" />
                  }
                </div>
              </div>

              {/* Expanded Body */}
              {isExpanded && (
                <div className="border-t px-4 pb-4 pt-3 space-y-3">
                  {/* Refusal panel */}
                  {entry.refused && (
                    <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
                      <h4 className="text-[11px] font-semibold text-rose-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> Refusal Reason
                      </h4>
                      <p className="text-xs text-rose-900 leading-relaxed">{entry.refusalReason}</p>
                    </div>
                  )}

                  {/* Missed panel */}
                  {entry.missedDose && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <h4 className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Missed Dose Reason
                      </h4>
                      <p className="text-xs text-amber-900 leading-relaxed">{entry.missedReason}</p>
                    </div>
                  )}

                  {/* Administration grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Administered By</div>
                      <div className="text-xs text-slate-800">{getStaffName(entry.administeredBy)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Witnessed By</div>
                      <div className="text-xs text-slate-800">{getStaffName(entry.witnessedBy)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Signature</div>
                      <div className="text-xs text-slate-800 font-medium">{getStaffName(entry.signature)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Route / Type</div>
                      <div className="text-xs text-slate-800">{entry.route} — {entry.prnOrScheduled}</div>
                    </div>
                  </div>

                  {/* Notes */}
                  {entry.notes && (
                    <div>
                      <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</h4>
                      <p className="text-xs text-slate-700 leading-relaxed">{entry.notes}</p>
                    </div>
                  )}

                  {/* Batch / expiry */}
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={cn("h-4 w-4", entry.expiryCheck ? "text-emerald-600" : "text-amber-600")} />
                      <div>
                        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Batch Number</div>
                        <div className="text-xs font-mono text-slate-800">{entry.batchNumber || "—"}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Expiry Verified</div>
                      <div className={cn("text-xs font-medium", entry.expiryCheck ? "text-emerald-700" : "text-amber-700")}>
                        {entry.expiryCheck ? "Yes — checked at administration" : "Not verified"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Regulatory Note ───────────────────────────────────────────────── */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-[10px] text-slate-500 leading-relaxed">
          <strong>Regulatory context:</strong> The Medication Administration Record supports compliance with{" "}
          <strong>Quality Standard 7 (Health and wellbeing)</strong> of the Children's Homes (England)
          Regulations 2015 and the home's medication policy. Every dose — given, refused, or missed —
          must be contemporaneously recorded and signed by the administering staff member, with a
          witness for controlled drugs and as required by policy. Refusals and missed doses must be
          followed up with the GP and recorded in the young person's health record. Records are subject
          to Ofsted inspection and pharmacy audit.
        </p>
      </div>
    </PageShell>
  );
}
