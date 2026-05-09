"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Flame,
  Zap,
  Shield,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  AlertTriangle,
  CheckCircle,
  Calendar,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  SafetyCheckRecord,
  SafetyCheckCategory,
  SafetyCheckScope,
  SafetyCheckOutcome,
  RemedialWorkStatus,
  RemedialWork,
} from "@/types/extended";
import {
  SAFETY_CHECK_CATEGORY_LABEL,
  SAFETY_CHECK_SCOPE_LABEL,
  SAFETY_CHECK_OUTCOME_LABEL,
  REMEDIAL_WORK_STATUS_LABEL,
} from "@/types/extended";
import { useSafetyCheckRecords } from "@/hooks/use-safety-check-records";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── helpers ───────────────────────────────────────────────────────────── */

const daysFromNow = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const outcomeColour: Record<SafetyCheckOutcome, string> = {
  pass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  pass_with_advisories: "bg-blue-100 text-blue-800 border-blue-200",
  remedial_works_required: "bg-amber-100 text-amber-800 border-amber-200",
  failed_urgent: "bg-red-100 text-red-800 border-red-200",
};

const remedialStatusColour: Record<RemedialWorkStatus, string> = {
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  booked: "bg-sky-100 text-sky-800 border-sky-200",
  open: "bg-amber-100 text-amber-800 border-amber-200",
};

/* ── export columns ────────────────────────────────────────────────────── */

const exportCols: ExportColumn<SafetyCheckRecord>[] = [
  { header: "Category", accessor: (r) => SAFETY_CHECK_CATEGORY_LABEL[r.category] },
  { header: "Scope", accessor: (r) => SAFETY_CHECK_SCOPE_LABEL[r.scope_area] },
  { header: "Specific Item", accessor: (r) => r.specific_item ?? "—" },
  { header: "Contractor", accessor: (r) => r.contractor },
  { header: "Accreditation", accessor: (r) => r.contractor_accreditation },
  { header: "Certificate Number", accessor: (r) => r.certificate_number ?? "—" },
  { header: "Inspection Date", accessor: (r) => r.inspection_date },
  { header: "Expiry Date", accessor: (r) => r.expiry_date },
  { header: "Outcome", accessor: (r) => SAFETY_CHECK_OUTCOME_LABEL[r.outcome] },
  { header: "Advisories", accessor: (r) => r.advisories.join("; ") },
  { header: "Remedial Open", accessor: (r) => r.remedial_works.filter((w) => w.status !== "completed").map((w) => w.description).join("; ") },
  { header: "Cost", accessor: (r) => (r.cost_paid !== undefined ? `£${r.cost_paid.toFixed(2)}` : "—") },
  { header: "Certificate Location", accessor: (r) => r.certificate_location },
  { header: "Recorded By", accessor: (r) => getStaffName(r.recorded_by) },
];

/* ── component ─────────────────────────────────────────────────────────── */

export default function GasElectricalSafetyChecksPage() {
  const { data: res, isLoading } = useSafetyCheckRecords();
  const records = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "expiry" | "category" | "outcome">("expiry");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const label = SAFETY_CHECK_CATEGORY_LABEL[rec.category];
      const matchesSearch =
        !search ||
        label.toLowerCase().includes(search.toLowerCase()) ||
        rec.contractor.toLowerCase().includes(search.toLowerCase());
      const matchesCat = categoryFilter === "all" || rec.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "date") return b.inspection_date.localeCompare(a.inspection_date);
      if (sortBy === "category") return a.category.localeCompare(b.category);
      if (sortBy === "outcome") return a.outcome.localeCompare(b.outcome);
      return a.expiry_date.localeCompare(b.expiry_date);
    });
    return r;
  }, [search, categoryFilter, sortBy, records]);

  const stats = useMemo(() => {
    const expiringSoon = records.filter((r) => r.expiry_date <= daysFromNow(60)).length;
    const remedialOpen = records.reduce((acc, r) => acc + r.remedial_works.filter((w) => w.status !== "completed").length, 0);
    const passingPct = records.length
      ? Math.round((records.filter((r) => r.outcome === "pass" || r.outcome === "pass_with_advisories").length / records.length) * 100)
      : 0;
    const totalCost = records.reduce((acc, r) => acc + (r.cost_paid ?? 0), 0);
    return { expiringSoon, remedialOpen, passingPct, totalCost };
  }, [records]);

  if (isLoading) {
    return (
      <PageShell title="Gas & Electrical Safety Checks" subtitle="Loading…">
        <div />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Gas & Electrical Safety Checks"
      subtitle="Statutory and routine building safety checks — annual gas safety (CP12), boiler service, EICR (5-yearly), PAT testing, weekly smoke and CO alarm tests, emergency lighting. Reg 25 (premises and grounds) compliance evidenced."
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "home_check" }}
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="gas-electrical-safety-checks" />
          <PrintButton title="Gas & Electrical Safety Checks" />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Calendar className="h-4 w-4" />
            <span>Expiring (60d)</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.expiringSoon}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <AlertTriangle className="h-4 w-4" />
            <span>Open remedials</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.remedialOpen}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <CheckCircle className="h-4 w-4" />
            <span>Pass rate</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.passingPct}%</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Shield className="h-4 w-4" />
            <span>Annual cost</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">£{stats.totalCost.toFixed(0)}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search category or contractor..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="annual_gas_safety">Gas safety (CP12)</SelectItem>
            <SelectItem value="boiler_service">Boiler service</SelectItem>
            <SelectItem value="eicr">EICR</SelectItem>
            <SelectItem value="pat_testing">PAT testing</SelectItem>
            <SelectItem value="smoke_alarm_test">Smoke alarm test</SelectItem>
            <SelectItem value="co_detector_test">CO detector test</SelectItem>
            <SelectItem value="emergency_lighting">Emergency lighting</SelectItem>
            <SelectItem value="rcd_test">RCD test</SelectItem>
            <SelectItem value="solar_inverter_inspection">Solar / inverter</SelectItem>
            <SelectItem value="fixed_wire_inspection">Fixed wire inspection</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-48">
            <ArrowUpDown className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expiry">Expiry soonest</SelectItem>
            <SelectItem value="date">Most recent</SelectItem>
            <SelectItem value="category">Category</SelectItem>
            <SelectItem value="outcome">Outcome</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isOpen = expandedId === r.id;
          const expiringSoon = r.expiry_date <= daysFromNow(60) && r.expiry_date >= daysFromNow(0);
          const expired = r.expiry_date < daysFromNow(0);
          return (
            <div key={r.id} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : r.id)}
                className="w-full p-4 flex items-start justify-between gap-3 hover:bg-slate-50 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {r.category === "annual_gas_safety" || r.category === "boiler_service" ? (
                      <Flame className="h-4 w-4 text-orange-500" />
                    ) : (
                      <Zap className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className="font-semibold text-slate-900">{SAFETY_CHECK_CATEGORY_LABEL[r.category]}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", outcomeColour[r.outcome])}>
                      {SAFETY_CHECK_OUTCOME_LABEL[r.outcome]}
                    </span>
                    {expired ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-red-100 text-red-800 border-red-200">
                        Expired
                      </span>
                    ) : expiringSoon ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-100 text-amber-800 border-amber-200">
                        Expiring in {Math.ceil((new Date(r.expiry_date).getTime() - Date.now()) / 86400000)}d
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-slate-600">
                    Inspected {r.inspection_date} · expires {r.expiry_date} · {r.contractor}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Inspection</div>
                      <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                        <div><span className="text-slate-500">Scope:</span> {SAFETY_CHECK_SCOPE_LABEL[r.scope_area]}</div>
                        {r.specific_item ? <div><span className="text-slate-500">Item:</span> {r.specific_item}</div> : null}
                        <div><span className="text-slate-500">Contractor:</span> {r.contractor}</div>
                        <div><span className="text-slate-500">Accreditation:</span> {r.contractor_accreditation}</div>
                        {r.certificate_number ? <div><span className="text-slate-500">Certificate:</span> {r.certificate_number}</div> : null}
                        {r.cost_paid !== undefined ? <div><span className="text-slate-500">Cost:</span> £{r.cost_paid.toFixed(2)}</div> : null}
                        <div className="col-span-2"><span className="text-slate-500">Certificate kept:</span> {r.certificate_location}</div>
                      </div>
                    </div>
                    {r.advisories.length ? (
                      <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                        <div className="text-xs font-semibold text-blue-800 uppercase mb-2">Advisories</div>
                        <ul className="text-sm text-blue-900 space-y-1">
                          {r.advisories.map((a, i) => (
                            <li key={i} className="flex gap-2"><span>·</span><span>{a}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {r.remedial_works.length ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2">Remedial works</div>
                        <ul className="text-sm text-amber-900 space-y-1.5">
                          {r.remedial_works.map((w, i) => (
                            <li key={i} className="flex justify-between gap-2">
                              <span className="flex-1">{w.description}</span>
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full border shrink-0",
                                remedialStatusColour[w.status]
                              )}>
                                {REMEDIAL_WORK_STATUS_LABEL[w.status]} · {w.deadline}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {r.notes ? (
                      <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Notes</div>
                        <p className="text-sm text-slate-700">{r.notes}</p>
                      </div>
                    ) : null}
                    {r.flags_concerns.length ? (
                      <div className="rounded-md border border-red-200 bg-red-50 p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-red-800 uppercase mb-2">Flags / concerns</div>
                        <ul className="text-sm text-red-900 space-y-1">
                          {r.flags_concerns.map((f, i) => (
                            <li key={i} className="flex gap-2"><span>!</span><span>{f}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2 text-xs text-slate-500">
                      Recorded by {getStaffName(r.recorded_by)}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="font-semibold mb-1">Regulatory framework</div>
        <p>
          Gas Safety (Installation and Use) Regulations 1998 (annual CP12 by Gas Safe registered engineer);
          Electrical Safety Standards in the Private Rented Sector (England) Regulations 2020 (EICR every 5 years);
          IET Code of Practice for In-Service Inspection (PAT); BS 5266 emergency lighting; BS 5839 fire alarms;
          Children&rsquo;s Homes (England) Regulations 2015 Reg 25 (premises and grounds), Reg 31 (records). All
          certificates retained 7+ years; copies available to Ofsted on request.
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
