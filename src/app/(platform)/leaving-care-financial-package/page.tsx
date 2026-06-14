"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  PiggyBank,
  Wallet,
  ArrowUpDown,
  Search,
  Home,
  Info,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  AlertTriangle,
  Sparkles,
  PoundSterling,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { useLeavingCarePackages } from "@/hooks/use-leaving-care-packages";
import type { LeavingCarePackage, TransitionStage } from "@/types/extended";
import { TRANSITION_STAGE_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── helpers ──────────────────────────────────────────────────────────────── */

const fmtMoney = (n: number) =>
  n.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });

/* ── UI metadata ──────────────────────────────────────────────────────────── */

const STAGE_META: Record<TransitionStage, { colour: string }> = {
  pre_pathway:          { colour: "bg-blue-100 text-blue-700" },
  building_16_17:       { colour: "bg-amber-100 text-amber-700" },
  active_leaving_17_18: { colour: "bg-orange-100 text-orange-700" },
  post_care_18_plus:    { colour: "bg-green-100 text-green-700" },
};

const SKILL_COLOUR: Record<string, string> = {
  "Confident":           "bg-green-100 text-green-700",
  "Developing":          "bg-amber-100 text-amber-700",
  "Emerging":            "bg-orange-100 text-orange-700",
  "Not yet introduced":  "bg-gray-100 text-gray-600",
};

const STAGE_ORDER: Record<TransitionStage, number> = {
  pre_pathway: 0,
  building_16_17: 1,
  active_leaving_17_18: 2,
  post_care_18_plus: 3,
};

export default function LeavingCareFinancialPackagePage() {
  const { data: res, isLoading } = useLeavingCarePackages();
  const data: LeavingCarePackage[] = res?.data ?? [];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [sortBy, setSortBy] = useState("stage");

  const stats = useMemo(() => {
    return {
      activePackages: data.length,
      totalSavings: data.reduce((s, r) => s + r.junior_isa_balance + r.savings_balance, 0),
      settingUpSpend: data.reduce((s, r) => s + r.setting_up_home_allowance_used, 0),
      livingIndependently: data.filter((r) => r.transition_stage === "post_care_18_plus").length,
    };
  }, [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterStage !== "all")
      list = list.filter((r) => r.transition_stage === filterStage);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.child_initials.toLowerCase().includes(q) ||
          r.junior_isa_provider.toLowerCase().includes(q) ||
          r.housing_pathway.toLowerCase().includes(q) ||
          r.employment_status.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "age":      return a.age - b.age;
        case "savings":  return (b.junior_isa_balance + b.savings_balance) - (a.junior_isa_balance + a.savings_balance);
        case "review":   return a.reviewed_date.localeCompare(b.reviewed_date);
        default:         return STAGE_ORDER[a.transition_stage] - STAGE_ORDER[b.transition_stage];
      }
    });
    return list;
  }, [data, filterStage, search, sortBy]);

  const exportCols: ExportColumn<LeavingCarePackage>[] = [
    { header: "Child", accessor: (r: LeavingCarePackage) => r.child_id ? getYPName(r.child_id) : r.child_initials },
    { header: "Age", accessor: (r: LeavingCarePackage) => r.age },
    { header: "Transition Stage", accessor: (r: LeavingCarePackage) => TRANSITION_STAGE_LABEL[r.transition_stage] },
    { header: "Junior ISA Balance", accessor: (r: LeavingCarePackage) => fmtMoney(r.junior_isa_balance) },
    { header: "Junior ISA Provider", accessor: (r: LeavingCarePackage) => r.junior_isa_provider },
    { header: "Junior ISA Contributions", accessor: (r: LeavingCarePackage) => r.junior_isa_contributions_to_date },
    { header: "Savings Balance", accessor: (r: LeavingCarePackage) => fmtMoney(r.savings_balance) },
    { header: "Setting Up Home Allowance", accessor: (r: LeavingCarePackage) => fmtMoney(r.setting_up_home_allowance) },
    { header: "Setting Up Home Allowance Used", accessor: (r: LeavingCarePackage) => fmtMoney(r.setting_up_home_allowance_used) },
    { header: "Setting Up Items", accessor: (r: LeavingCarePackage) => r.setting_up_home_allowance_items.join("; ") },
    { header: "Monthly Allowance", accessor: (r: LeavingCarePackage) => fmtMoney(r.monthly_allowance_current) },
    { header: "Bank Account Status", accessor: (r: LeavingCarePackage) => r.bank_account_status },
    { header: "Debt & Credit", accessor: (r: LeavingCarePackage) => r.debt_and_credit },
    { header: "Employment Status", accessor: (r: LeavingCarePackage) => r.employment_status },
    { header: "Benefits Applied", accessor: (r: LeavingCarePackage) => r.benefits_applied.join("; ") },
    { header: "Housing Pathway", accessor: (r: LeavingCarePackage) => r.housing_pathway },
    { header: "Cost of Living Costings", accessor: (r: LeavingCarePackage) => r.cost_of_living_costings },
    { header: "Future Risk Factors", accessor: (r: LeavingCarePackage) => r.future_risk_factors.join("; ") },
    { header: "Protective Financial Factors", accessor: (r: LeavingCarePackage) => r.protective_financial_factors.join("; ") },
    { header: "Reviewed Date", accessor: (r: LeavingCarePackage) => r.reviewed_date },
    { header: "Reviewed By", accessor: (r: LeavingCarePackage) => getStaffName(r.reviewed_by) },
  ];

  const stages: TransitionStage[] = ["pre_pathway", "building_16_17", "active_leaving_17_18", "post_care_18_plus"];

  if (isLoading) return <PageShell title="Leaving Care Financial Package" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Leaving Care Financial Package"
      subtitle="Children (Leaving Care) Act 2000 — Setting Up Home Allowance · Junior ISA · savings · financial literacy progression"
      caraContext={{ pageTitle: "Leaving Care Financial Package", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="leaving-care-financial-package" />
          <PrintButton title="Leaving Care Financial Package" />
          <CaraStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* Banner */}
        <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <strong>Statutory financial duty to care leavers.</strong> Under the Children (Leaving Care) Act 2000 the local authority — as corporate parent — must prepare each looked-after child for adulthood, including a Setting Up Home Allowance (typically £2,000+), Junior ISA top-ups, ring-fenced savings, and progressive financial literacy. Cara tracks each young person&apos;s package from pre-pathway through to post-care aftercare. <em>All account balances shown are illustrative for review purposes only — no real account numbers, sort codes, or credentials are stored. Anonymised initials used for former residents.</em>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: "Active Packages",        v: stats.activePackages,                icon: Wallet,        c: "text-blue-600" },
            { l: "Total Savings (illus.)", v: fmtMoney(stats.totalSavings),        icon: PiggyBank,     c: "text-green-600" },
            { l: "Setting Up Spend",       v: fmtMoney(stats.settingUpSpend),      icon: Home,          c: "text-purple-600" },
            { l: "Living Independently",   v: stats.livingIndependently,           icon: Sparkles,      c: "text-amber-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Filters / sort */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search initials, provider, pathway, employment…"
              className="w-full rounded-md border pl-8 pr-3 py-2 text-sm"
            />
          </div>
          <Select value={filterStage} onValueChange={setFilterStage}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Transition stage" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {stages.map((s) => <SelectItem key={s} value={s}>{TRANSITION_STAGE_LABEL[s]}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded border px-2 py-1.5 text-sm"
            >
              <option value="stage">Stage (pre → post-care)</option>
              <option value="age">Age (low → high)</option>
              <option value="savings">Total savings (high → low)</option>
              <option value="review">Last reviewed</option>
            </select>
          </div>
        </div>

        {/* Cards */}
        {filtered.map((rec) => {
          const open = expandedId === rec.id;
          const totalSavings = rec.junior_isa_balance + rec.savings_balance;
          const sehaPct = rec.setting_up_home_allowance > 0
            ? Math.min(100, Math.round((rec.setting_up_home_allowance_used / rec.setting_up_home_allowance) * 100))
            : 0;
          const displayName = rec.child_id ? getYPName(rec.child_id) : rec.child_initials;

          return (
            <div key={rec.id} className="rounded-lg border bg-white overflow-hidden">
              <button
                onClick={() => setExpandedId(open ? null : rec.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <PoundSterling className="h-5 w-5 text-brand" />
                  <div className="text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{displayName}</h3>
                      <span className="text-sm text-muted-foreground">— age {rec.age}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STAGE_META[rec.transition_stage].colour)}>
                        {TRANSITION_STAGE_LABEL[rec.transition_stage]}
                      </span>
                      {rec.child_id && (
                        <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs text-pink-700">Current resident</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Junior ISA {fmtMoney(rec.junior_isa_balance)} · Savings {fmtMoney(rec.savings_balance)} · SUHA used {fmtMoney(rec.setting_up_home_allowance_used)}/{fmtMoney(rec.setting_up_home_allowance)} · Total {fmtMoney(totalSavings)}
                    </p>
                  </div>
                </div>
                {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {open && (
                <div className="border-t p-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Age:</span> {rec.age}</div>
                    <div><span className="text-muted-foreground">Stage:</span> {TRANSITION_STAGE_LABEL[rec.transition_stage]}</div>
                    <div><span className="text-muted-foreground">Monthly allowance:</span> {fmtMoney(rec.monthly_allowance_current)}</div>
                    <div><span className="text-muted-foreground">Reviewed:</span> {rec.reviewed_date} ({getStaffName(rec.reviewed_by)})</div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 text-sm space-y-1">
                    <p className="flex items-center gap-1 font-semibold"><PiggyBank className="h-4 w-4" /> Junior ISA</p>
                    <p><span className="text-muted-foreground">Provider:</span> {rec.junior_isa_provider}</p>
                    <p><span className="text-muted-foreground">Balance (illustrative):</span> {fmtMoney(rec.junior_isa_balance)}</p>
                    <p><span className="text-muted-foreground">Contributions to date:</span> {rec.junior_isa_contributions_to_date}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1 text-sm">
                      <span className="font-semibold flex items-center gap-1"><Home className="h-4 w-4" /> Setting Up Home Allowance</span>
                      <span className="text-muted-foreground">{fmtMoney(rec.setting_up_home_allowance_used)} / {fmtMoney(rec.setting_up_home_allowance)} used ({sehaPct}%)</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded bg-gray-100 mb-2">
                      <div className="h-full bg-brand" style={{ width: `${sehaPct}%` }} />
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {rec.setting_up_home_allowance_items.map((i, idx) => <li key={idx}>{i}</li>)}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1"><TrendingUp className="h-4 w-4" /> Savings history (illustrative — current balance {fmtMoney(rec.savings_balance)})</h4>
                    <div className="space-y-2">
                      {rec.savings_history.map((s, i) => (
                        <div key={i} className="rounded border p-2 text-sm flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm">{s.source}</p>
                            <p className="text-xs text-muted-foreground">{s.date}</p>
                          </div>
                          <span className={cn("font-semibold whitespace-nowrap", s.amount < 0 ? "text-red-700" : "text-green-700")}>
                            {s.amount < 0 ? "−" : "+"}{fmtMoney(Math.abs(s.amount))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1"><GraduationCap className="h-4 w-4" /> Financial literacy progression</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(rec.financial_literacy_progression).map(([skill, level]) => (
                        <div key={skill} className="flex items-center justify-between rounded border px-3 py-1.5 text-sm">
                          <span>{skill}</span>
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", SKILL_COLOUR[level] || "bg-gray-100 text-gray-700")}>
                            {level}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="rounded-lg bg-blue-50 p-3">
                      <h4 className="text-sm font-semibold text-blue-800 mb-1 flex items-center gap-1"><Wallet className="h-4 w-4" /> Bank account status</h4>
                      <p className="text-blue-900">{rec.bank_account_status}</p>
                    </div>
                    <div className="rounded-lg bg-purple-50 p-3">
                      <h4 className="text-sm font-semibold text-purple-800 mb-1">Debt &amp; credit</h4>
                      <p className="text-purple-900">{rec.debt_and_credit}</p>
                    </div>
                    <div className="rounded-lg bg-green-50 p-3">
                      <h4 className="text-sm font-semibold text-green-800 mb-1 flex items-center gap-1"><Briefcase className="h-4 w-4" /> Employment status</h4>
                      <p className="text-green-900">{rec.employment_status}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border p-3 space-y-2 text-sm">
                    <div>
                      <h4 className="font-semibold">Benefits applied / care leaver entitlements</h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {rec.benefits_applied.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold">Housing pathway</h4>
                      <p className="text-muted-foreground">{rec.housing_pathway}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Cost-of-living costings</h4>
                      <p className="text-muted-foreground">{rec.cost_of_living_costings}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg bg-red-50 p-3">
                      <h4 className="text-sm font-semibold text-red-800 mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" /> Future financial risk factors
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-red-900">
                        {rec.future_risk_factors.map((r2, i) => <li key={i}>{r2}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-lg bg-green-50 p-3">
                      <h4 className="text-sm font-semibold text-green-800 mb-1 flex items-center gap-1">
                        <ShieldCheck className="h-4 w-4" /> Protective financial factors
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-green-900">
                        {rec.protective_financial_factors.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm rounded-lg border p-3">
                    <div><span className="text-muted-foreground">Last review:</span> {rec.reviewed_date}</div>
                    <div><span className="text-muted-foreground">Reviewed by:</span> {getStaffName(rec.reviewed_by)}</div>
                    <div><span className="text-muted-foreground">Identifier:</span> {rec.child_initials}</div>
                  </div>

                  {rec.child_id && (
                    <SmartLinkPanel sourceType="leaving-care-packages" sourceId={rec.id} childId={rec.child_id} compact />
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Regulatory note */}
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Children (Leaving Care) Act 2000 &amp; Quality Standard 1.</strong> The corporate parent must give every eligible looked-after child a personal advisor, a pathway plan, and a financial package that includes the Setting Up Home Allowance, ring-fenced savings (Junior ISA top-ups while in care), and progressive financial-literacy support — covering banking, budgeting, tenancy, payslips, debt awareness and scam recognition. Aftercare duties continue to age 21 (or 25 in education). Cara tracks each young person&apos;s journey from pre-pathway through to post-care so transitions are planned, not reactive. <em>All balances shown are illustrative — Cara never stores real account numbers, sort codes, or credentials. Former residents are referenced by anonymised initials only.</em>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Finance"
        category="finance"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Leaving Care Financial Package — personal allowance, setting up home allowance, education bursary, employment grant, pathway plan finances, financial literacy, Reg 45 care leaver evidence"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
