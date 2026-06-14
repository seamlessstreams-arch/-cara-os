"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn, todayStr } from "@/lib/utils";
import { usePestRecords } from "@/hooks/use-pest-records";
import type { PestRecord } from "@/types/extended";
import { PEST_RECORD_TYPE_LABEL, PEST_CATEGORY_LABEL } from "@/types/extended";
import {
  Bug,
  Shield,
  Sprout,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

const typeColour: Record<string, string> = {
  routine_preventive_treatment: "bg-teal-100 text-teal-800 border-teal-200",
  reactive_call_out: "bg-amber-100 text-amber-800 border-amber-200",
  annual_contract_review: "bg-indigo-100 text-indigo-800 border-indigo-200",
  bait_station_refresh: "bg-emerald-100 text-emerald-800 border-emerald-200",
  survey_only: "bg-slate-100 text-[var(--cs-navy)] border-[var(--cs-border)]",
  follow_up_monitoring: "bg-sky-100 text-sky-800 border-sky-200",
};

const pestColour: Record<string, string> = {
  mice: "bg-amber-100 text-amber-900 border-amber-200",
  rats: "bg-red-100 text-red-900 border-red-200",
  ants: "bg-orange-100 text-orange-900 border-orange-200",
  wasps_hornets: "bg-yellow-100 text-yellow-900 border-yellow-200",
  silverfish: "bg-cyan-100 text-cyan-900 border-cyan-200",
  bedbugs: "bg-rose-100 text-rose-900 border-rose-200",
  cockroaches: "bg-stone-200 text-stone-900 border-stone-300",
  moths: "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)] border-[var(--cs-cara-gold-soft)]",
  pigeons: "bg-zinc-100 text-zinc-900 border-zinc-200",
  mixed_general: "bg-slate-100 text-[var(--cs-navy)] border-[var(--cs-border)]",
  none_preventive_only: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const exportCols: ExportColumn<PestRecord>[] = [
  { header: "Date", accessor: (r) => r.record_date },
  { header: "Type", accessor: (r) => PEST_RECORD_TYPE_LABEL[r.record_type] },
  { header: "Pest", accessor: (r) => PEST_CATEGORY_LABEL[r.pest_category] },
  { header: "Affected Areas", accessor: (r) => r.affected_areas.join("; ") },
  { header: "Contractor", accessor: (r) => r.contractor },
  { header: "Accreditation", accessor: (r) => r.contractor_accreditation },
  { header: "Treatment Method", accessor: (r) => r.treatment_method.join("; ") },
  { header: "Chemicals Used", accessor: (r) => r.chemicals_used.join("; ") },
  { header: "Child Safety Measures", accessor: (r) => r.child_safety_measures.join("; ") },
  { header: "Child Informed", accessor: (r) => (r.child_informed_and_paced ? "Yes" : "No") },
  { header: "Prevention Advice", accessor: (r) => r.prevention_advice.join("; ") },
  { header: "Follow-up Required", accessor: (r) => (r.follow_up_required ? "Yes" : "No") },
  { header: "Follow-up Date", accessor: (r) => r.follow_up_date ?? "—" },
  { header: "Cost", accessor: (r) => (r.cost_paid !== undefined ? `£${r.cost_paid.toFixed(2)}` : "—") },
  { header: "Outcome / Evidence", accessor: (r) => r.outcome_evidence },
  { header: "Recorded By", accessor: (r) => getStaffName(r.recorded_by) },
  { header: "Flags / Concerns", accessor: (r) => r.flags_concerns.join("; ") },
];

export default function BuildingPestControlPage() {
  const { data: res, isLoading } = usePestRecords();
  const data = useMemo(() => res?.data ?? [], [res]);
  const [search, setSearch] = useState("");
  const [pestFilter, setPestFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "type" | "pest" | "followup">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <PageShell title="Building Pest Control & Prevention" subtitle="Proactive routine treatments and reactive call-outs">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  const today = todayStr();
  const thirtyDaysFromNow = (() => { const dt = new Date(); dt.setDate(dt.getDate() + 30); return dt.toISOString().slice(0, 10); })();
  const yearStart = (() => { const dt = new Date(); dt.setDate(dt.getDate() - 365); return dt.toISOString().slice(0, 10); })();

  const filtered = (() => {
    let r = data.filter((rec) => {
      const matchesSearch =
        !search ||
        PEST_CATEGORY_LABEL[rec.pest_category].toLowerCase().includes(search.toLowerCase()) ||
        rec.contractor.toLowerCase().includes(search.toLowerCase()) ||
        rec.affected_areas.some((a) => a.toLowerCase().includes(search.toLowerCase()));
      const matchesPest = pestFilter === "all" || rec.pest_category === pestFilter;
      return matchesSearch && matchesPest;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "type") return a.record_type.localeCompare(b.record_type);
      if (sortBy === "pest") return a.pest_category.localeCompare(b.pest_category);
      if (sortBy === "followup") {
        const aF = a.follow_up_date ?? "9999-99-99";
        const bF = b.follow_up_date ?? "9999-99-99";
        return aF.localeCompare(bF);
      }
      return b.record_date.localeCompare(a.record_date);
    });
    return r;
  })();

  const stats = (() => {
    const treatmentsYTD = data.filter(
      (r) => r.record_date >= yearStart && r.record_type !== "survey_only" && r.record_type !== "annual_contract_review",
    ).length;
    const followUpsOpen = data.filter((r) => r.follow_up_required && (r.follow_up_date ?? "9999-99-99") >= today).length;
    const infestationsResolved = data.filter((r) => r.record_type === "reactive_call_out" && !r.follow_up_required).length;
    const annualCost = data.filter((r) => r.record_date >= yearStart).reduce((acc, r) => acc + (r.cost_paid ?? 0), 0);
    return { treatmentsYTD, followUpsOpen, infestationsResolved, annualCost };
  })();

  return (
    <PageShell
      title="Building Pest Control & Prevention"
      subtitle="Proactive routine treatments and reactive call-outs — mice, rats, ants, wasps, silverfish, bedbugs, cockroaches, moths. Child-safety-first protocols: chemical-free options first, no rodenticide indoors with children resident, transparency with young people."
      caraContext={{ pageTitle: "Pest Control", sourceType: "home_check" }}
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="building-pest-control" />
          <PrintButton title="Pest Control & Prevention" />
          <CaraStudioQuickActionButton context={{ record_type: "ofsted_evidence", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-amber-800 text-sm mb-1"><Bug className="h-4 w-4" /><span>Treatments (12m)</span></div>
          <div className="text-2xl font-semibold text-amber-900">{stats.treatmentsYTD}</div>
        </div>
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
          <div className="flex items-center gap-2 text-teal-800 text-sm mb-1"><Calendar className="h-4 w-4" /><span>Follow-ups open</span></div>
          <div className="text-2xl font-semibold text-teal-900">{stats.followUpsOpen}</div>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-emerald-800 text-sm mb-1"><CheckCircle className="h-4 w-4" /><span>Infestations resolved</span></div>
          <div className="text-2xl font-semibold text-emerald-900">{stats.infestationsResolved}</div>
        </div>
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
          <div className="flex items-center gap-2 text-stone-700 text-sm mb-1"><Shield className="h-4 w-4" /><span>Annual cost</span></div>
          <div className="text-2xl font-semibold text-stone-900">£{stats.annualCost.toFixed(0)}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--cs-text-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pest, contractor or area..." className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--cs-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <Select value={pestFilter} onValueChange={setPestFilter}>
          <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Pest category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All pest categories</SelectItem>
            {(Object.keys(PEST_CATEGORY_LABEL) as Array<keyof typeof PEST_CATEGORY_LABEL>).map((k) => (
              <SelectItem key={k} value={k}>{PEST_CATEGORY_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-48"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Most recent</SelectItem>
            <SelectItem value="type">Record type</SelectItem>
            <SelectItem value="pest">Pest category</SelectItem>
            <SelectItem value="followup">Follow-up due</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isOpen = expandedId === r.id;
          const followUpSoon = r.follow_up_required && r.follow_up_date && r.follow_up_date >= today && r.follow_up_date <= thirtyDaysFromNow;
          const followUpOverdue = r.follow_up_required && r.follow_up_date && r.follow_up_date < today;
          return (
            <div key={r.id} className="rounded-lg border border-[var(--cs-border)] bg-white overflow-hidden">
              <button onClick={() => setExpandedId(isOpen ? null : r.id)} className="w-full p-4 flex items-start justify-between gap-3 hover:bg-amber-50/40 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Bug className="h-4 w-4 text-amber-600" />
                    <span className="font-semibold text-[var(--cs-navy)]">{r.record_date}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", typeColour[r.record_type])}>{PEST_RECORD_TYPE_LABEL[r.record_type]}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", pestColour[r.pest_category])}>{PEST_CATEGORY_LABEL[r.pest_category]}</span>
                    {r.follow_up_required ? (
                      followUpOverdue ? (
                        <span className="text-xs px-2 py-0.5 rounded-full border bg-red-100 text-red-800 border-red-200">Follow-up overdue · {r.follow_up_date}</span>
                      ) : followUpSoon ? (
                        <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-100 text-amber-800 border-amber-200">Follow-up {r.follow_up_date}</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full border bg-sky-100 text-sky-800 border-sky-200">Follow-up {r.follow_up_date}</span>
                      )
                    ) : null}
                  </div>
                  <div className="text-sm text-[var(--cs-text-secondary)]">
                    {r.affected_areas.slice(0, 2).join(" · ")}{r.affected_areas.length > 2 ? ` · +${r.affected_areas.length - 2} more` : ""} · {r.contractor}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-[var(--cs-text-muted)]" /> : <ChevronDown className="h-5 w-5 text-[var(--cs-text-muted)]" />}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 border-t border-[var(--cs-border-subtle)] bg-amber-50/20">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Affected areas</div>
                      <ul className="text-sm text-[var(--cs-text-secondary)] space-y-1">{r.affected_areas.map((a, i) => (<li key={i} className="flex gap-2"><span className="text-amber-600">·</span><span>{a}</span></li>))}</ul>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Contractor</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[var(--cs-text-secondary)]">
                        <div><span className="text-[var(--cs-text-muted)]">Provider:</span> {r.contractor}</div>
                        <div><span className="text-[var(--cs-text-muted)]">Accreditation:</span> {r.contractor_accreditation}</div>
                      </div>
                    </div>
                    <div className="rounded-md border border-teal-200 bg-teal-50 p-3">
                      <div className="text-xs font-semibold text-teal-800 uppercase mb-2">Treatment method</div>
                      <ul className="text-sm text-teal-900 space-y-1">{r.treatment_method.map((m, i) => (<li key={i} className="flex gap-2"><span>·</span><span>{m}</span></li>))}</ul>
                    </div>
                    <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
                      <div className="text-xs font-semibold text-stone-700 uppercase mb-2">Chemicals used (COSHH)</div>
                      <ul className="text-sm text-stone-800 space-y-1">{r.chemicals_used.map((c, i) => (<li key={i} className="flex gap-2"><span>·</span><span>{c}</span></li>))}</ul>
                    </div>
                    <div className="rounded-md border-2 border-emerald-300 bg-emerald-50 p-3 lg:col-span-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-emerald-700" />
                        <div className="text-xs font-semibold text-emerald-800 uppercase">
                          Child safety measures
                          {r.child_informed_and_paced && <span className="ml-2 text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded-full normal-case">Children informed &amp; paced</span>}
                        </div>
                      </div>
                      <ul className="text-sm text-emerald-900 space-y-1">{r.child_safety_measures.map((s, i) => (<li key={i} className="flex gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" /><span>{s}</span></li>))}</ul>
                    </div>
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 lg:col-span-2">
                      <div className="flex items-center gap-2 mb-2"><Sprout className="h-4 w-4 text-amber-700" /><div className="text-xs font-semibold text-amber-800 uppercase">Prevention advice</div></div>
                      <ul className="text-sm text-amber-900 space-y-1">{r.prevention_advice.map((p, i) => (<li key={i} className="flex gap-2"><span>·</span><span>{p}</span></li>))}</ul>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Outcome / evidence trail</div>
                      <p className="text-sm text-[var(--cs-text-secondary)]">{r.outcome_evidence}</p>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Follow-up</div>
                      <div className="text-sm text-[var(--cs-text-secondary)]">
                        {r.follow_up_required ? <>Required by <span className="font-medium">{r.follow_up_date ?? "TBC"}</span></> : <span className="text-emerald-700">No follow-up required — closed</span>}
                      </div>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Cost</div>
                      <div className="text-sm text-[var(--cs-text-secondary)]">{r.cost_paid !== undefined ? `£${r.cost_paid.toFixed(2)}` : "—"}</div>
                    </div>
                    {r.flags_concerns.length > 0 && (
                      <div className="rounded-md border border-red-200 bg-red-50 p-3 lg:col-span-2">
                        <div className="flex items-center gap-2 mb-2"><AlertTriangle className="h-4 w-4 text-red-700" /><div className="text-xs font-semibold text-red-800 uppercase">Flags / concerns</div></div>
                        <ul className="text-sm text-red-900 space-y-1">{r.flags_concerns.map((f, i) => (<li key={i} className="flex gap-2"><span>!</span><span>{f}</span></li>))}</ul>
                      </div>
                    )}
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2 text-xs text-[var(--cs-text-muted)]">
                      Recorded by {getStaffName(r.recorded_by)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="font-semibold mb-1">Regulatory framework</div>
        <p>
          Children&rsquo;s Homes (England) Regulations 2015 Reg 12 (protection from harm), Reg 25 (premises and grounds)
          and Reg 31 (records); Health &amp; Safety at Work etc. Act 1974; COSHH Regulations 2002; Wildlife &amp; Countryside
          Act 1981; BPCA / CEPA EN 16636 contractor standards; CRRU rodenticide stewardship. Child-safety-first principle:
          chemical-free measures are first-line, rodenticides are not used internally while children are resident.
          Records retained 7+ years; available to Ofsted on request.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Health & Safety"
        category="health"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Pest Control & Prevention — pest inspection schedule, treatment records, contractor visits, mice, rats, bedbugs, infestation response, regulatory compliance, Reg 44 evidence"
        recordType="ofsted_evidence"
        className="mt-6"
      />
    </PageShell>
  );
}
