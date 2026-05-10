"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Wallet,
  TrendingUp,
  PiggyBank,
  AlertTriangle,
  CheckCircle2,
  Coins,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { PlacementBudgetTracker, PlacementBudgetCategory } from "@/types/extended";
import { PLACEMENT_BUDGET_CATEGORY_LABEL } from "@/types/extended";
import { usePlacementBudgetTrackers } from "@/hooks/use-placement-budget-trackers";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────── */

const SAVINGS_GOAL_MONTHLY = 25;

/* ── component ─────────────────────────────────────────────────────────── */

export default function PlacementBudgetTrackerPage() {
  const { data: res, isLoading } = usePlacementBudgetTrackers();
  const records = res?.data ?? [];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("youngPerson");

  /* summary stats */
  const stats = useMemo(() => {
    const totalAllocated = records.reduce((s, r) => s + r.total_annual_budget, 0);
    const totalSpent = records.reduce(
      (s, r) => s + r.breakdown.reduce((a, b) => a + b.spent, 0),
      0,
    );
    const monthsElapsed = 7; // illustrative — through November of FY
    const meetingSavingsGoal = records.filter((r) => {
      const ytdSavings = r.savings_history
        .filter((h) => h.target.toLowerCase().includes("isa") || h.source.toLowerCase().includes("monthly allowance"))
        .reduce((a, b) => a + b.amount, 0);
      return ytdSavings >= SAVINGS_GOAL_MONTHLY * monthsElapsed * 0.6;
    }).length;
    const exceptional = records.reduce((s, r) => s + r.exceptional_requests.length, 0);
    return { totalAllocated, totalSpent, meetingSavingsGoal, exceptional };
  }, [records]);

  /* sorted/filtered list */
  const list = useMemo(() => {
    let l = [...records];
    if (filterYP !== "all") l = l.filter((r) => r.child_id === filterYP);
    l.sort((a, b) => {
      switch (sortBy) {
        case "spent": {
          const aS = a.breakdown.reduce((s, x) => s + x.spent, 0);
          const bS = b.breakdown.reduce((s, x) => s + x.spent, 0);
          return bS - aS;
        }
        case "remaining": {
          const aR = a.total_annual_budget - a.breakdown.reduce((s, x) => s + x.spent, 0);
          const bR = b.total_annual_budget - b.breakdown.reduce((s, x) => s + x.spent, 0);
          return bR - aR;
        }
        case "reviewed":
          return b.reviewed_date.localeCompare(a.reviewed_date);
        default:
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
      }
    });
    return l;
  }, [records, filterYP, sortBy]);

  /* export — flatten breakdown rows */
  const exportData = useMemo(
    () =>
      records.flatMap((r) =>
        r.breakdown.map((b) => ({
          id: r.id,
          child_id: r.child_id,
          financial_year: r.financial_year,
          total_annual_budget: r.total_annual_budget,
          breakdown: r.breakdown,
          monthly_allowance: r.monthly_allowance,
          savings_history: r.savings_history,
          junior_isa_contribution_this_year: r.junior_isa_contribution_this_year,
          setting_up_home_allowance_progress: r.setting_up_home_allowance_progress,
          child_input_on_spend: r.child_input_on_spend,
          agreed_spending_priorities: r.agreed_spending_priorities,
          exceptional_requests: r.exceptional_requests,
          reviewed_date: r.reviewed_date,
          reviewed_by: r.reviewed_by,
          child_agreed: r.child_agreed,
          _category: b.category,
          _allocated: b.allocated,
          _spent: b.spent,
          _remaining: b.remaining,
          _last_spend: b.last_spend,
          _notes: b.notes,
        })),
      ),
    [records],
  );

  type ExportRow = typeof exportData[number];

  const exportCols: ExportColumn<ExportRow>[] = [
    { header: "Young Person",       accessor: (r: ExportRow) => getYPName(r.child_id) },
    { header: "Financial Year",     accessor: (r: ExportRow) => r.financial_year },
    { header: "Total Annual Budget",accessor: (r: ExportRow) => `£${r.total_annual_budget.toFixed(2)}` },
    { header: "Monthly Allowance",  accessor: (r: ExportRow) => `£${r.monthly_allowance.toFixed(2)}` },
    { header: "Category",           accessor: (r: ExportRow) => PLACEMENT_BUDGET_CATEGORY_LABEL[r._category] },
    { header: "Allocated",          accessor: (r: ExportRow) => `£${r._allocated.toFixed(2)}` },
    { header: "Spent",              accessor: (r: ExportRow) => `£${r._spent.toFixed(2)}` },
    { header: "Remaining",          accessor: (r: ExportRow) => `£${r._remaining.toFixed(2)}` },
    { header: "Last Spend",         accessor: (r: ExportRow) => r._last_spend },
    { header: "Notes",              accessor: (r: ExportRow) => r._notes },
    { header: "Junior ISA YTD",     accessor: (r: ExportRow) => `£${r.junior_isa_contribution_this_year.toFixed(2)}` },
    { header: "Setting Up Home £",  accessor: (r: ExportRow) => `£${r.setting_up_home_allowance_progress.toFixed(2)}` },
    { header: "Reviewed Date",      accessor: (r: ExportRow) => r.reviewed_date },
    { header: "Reviewed By",        accessor: (r: ExportRow) => getStaffName(r.reviewed_by) },
    { header: "Child Agreed",       accessor: (r: ExportRow) => (r.child_agreed ? "Yes" : "No") },
  ];

  return (
    <PageShell
      title="Placement Budget Tracker"
      subtitle="Each child's annual budget across categories — financial governance, transparency and corporate parenting (illustrative figures)"
      ariaContext={{ pageTitle: "Placement Budget Tracker", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="placement-budget-tracker" />
          <PrintButton title="Placement Budget Tracker" />
          <AriaStudioQuickActionButton context={{ record_type: "placement_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full" />
        </div>
      )}

      {!isLoading && (
      <div id="print-area" className="space-y-6">
        {/* summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: "Total Allocated",          v: `£${stats.totalAllocated.toLocaleString()}`, icon: Wallet,        c: "text-blue-600" },
            { l: "Total Spent YTD",          v: `£${stats.totalSpent.toFixed(2)}`,           icon: TrendingUp,    c: "text-amber-600" },
            { l: "Meeting Savings Goal",     v: `${stats.meetingSavingsGoal} / ${records.length}`, icon: PiggyBank,  c: "text-green-600" },
            { l: "Exceptional Requests",     v: stats.exceptional,                            icon: AlertTriangle, c: "text-purple-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* filters / sort */}
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={filterYP} onValueChange={setFilterYP}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Young Person" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {records.map((r) => (
                <SelectItem key={r.child_id} value={r.child_id}>{getYPName(r.child_id)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="youngPerson">Young Person (A–Z)</SelectItem>
                <SelectItem value="spent">Total Spent</SelectItem>
                <SelectItem value="remaining">Remaining</SelectItem>
                <SelectItem value="reviewed">Last Reviewed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* expandable per-child cards */}
        <div className="space-y-3">
          {list.map((rec) => {
            const totalSpent = rec.breakdown.reduce((s, x) => s + x.spent, 0);
            const remaining = rec.total_annual_budget - totalSpent;
            const pct = (totalSpent / rec.total_annual_budget) * 100;
            const isOpen = expandedId === rec.id;
            return (
              <div key={rec.id} className="rounded-lg border bg-white overflow-hidden">
                <button
                  onClick={() => setExpandedId(isOpen ? null : rec.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 text-left">
                    <Coins className="h-5 w-5 text-brand" />
                    <div>
                      <h3 className="font-semibold">{getYPName(rec.child_id)}</h3>
                      <p className="text-xs text-muted-foreground">
                        FY {rec.financial_year} · £{totalSpent.toFixed(2)} / £{rec.total_annual_budget.toLocaleString()} ·
                        {" "}Reviewed {rec.reviewed_date} by {getStaffName(rec.reviewed_by)}
                        {" "}{rec.child_agreed ? "· Child agreed" : "· Awaiting child sign-off"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:block w-40">
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            pct > 90 ? "bg-red-400" : pct > 70 ? "bg-amber-400" : "bg-green-400",
                          )}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-muted-foreground mt-0.5">
                        <span>£{remaining.toFixed(0)} left</span>
                        <span>{Math.round(pct)}%</span>
                      </div>
                    </div>
                    {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t p-4 space-y-5">
                    {/* breakdown table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-xs text-muted-foreground">
                            <th className="pb-2 pr-3">Category</th>
                            <th className="pb-2 pr-3">Allocated</th>
                            <th className="pb-2 pr-3">Spent</th>
                            <th className="pb-2 pr-3">Remaining</th>
                            <th className="pb-2 pr-3">Last Spend</th>
                            <th className="pb-2">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rec.breakdown.map((b) => {
                            const linePct = (b.spent / b.allocated) * 100;
                            return (
                              <tr key={b.category} className="border-b last:border-0">
                                <td className="py-2 pr-3 font-medium">{PLACEMENT_BUDGET_CATEGORY_LABEL[b.category]}</td>
                                <td className="py-2 pr-3">£{b.allocated.toFixed(2)}</td>
                                <td className="py-2 pr-3">£{b.spent.toFixed(2)}</td>
                                <td className="py-2 pr-3">
                                  <span
                                    className={cn(
                                      "font-medium",
                                      linePct > 90 ? "text-red-600" : linePct > 70 ? "text-amber-600" : "text-green-600",
                                    )}
                                  >
                                    £{b.remaining.toFixed(2)}
                                  </span>
                                </td>
                                <td className="py-2 pr-3 whitespace-nowrap">{b.last_spend}</td>
                                <td className="py-2 text-muted-foreground">{b.notes}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* summary boxes */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-lg bg-blue-50 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Wallet className="h-4 w-4 text-blue-700" />
                          <h4 className="text-sm font-semibold text-blue-900">Monthly Allowance</h4>
                        </div>
                        <p className="text-xl font-bold text-blue-900">£{rec.monthly_allowance.toFixed(2)}</p>
                        <p className="text-xs text-blue-800">paid weekly/monthly to young person</p>
                      </div>
                      <div className="rounded-lg bg-green-50 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <PiggyBank className="h-4 w-4 text-green-700" />
                          <h4 className="text-sm font-semibold text-green-900">Junior ISA — YTD</h4>
                        </div>
                        <p className="text-xl font-bold text-green-900">£{rec.junior_isa_contribution_this_year.toFixed(2)}</p>
                        <p className="text-xs text-green-800">contributions this financial year</p>
                      </div>
                      <div className="rounded-lg bg-purple-50 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="h-4 w-4 text-purple-700" />
                          <h4 className="text-sm font-semibold text-purple-900">Setting Up Home</h4>
                        </div>
                        <p className="text-xl font-bold text-purple-900">£{rec.setting_up_home_allowance_progress.toFixed(2)}</p>
                        <p className="text-xs text-purple-800">earned/accrued toward leaving-care grant</p>
                      </div>
                    </div>

                    {/* savings history */}
                    <div className="rounded-lg border p-3">
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-1"><PiggyBank className="h-4 w-4" /> Savings History</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left text-xs text-muted-foreground">
                              <th className="pb-2 pr-3">Date</th>
                              <th className="pb-2 pr-3">Amount</th>
                              <th className="pb-2 pr-3">Source</th>
                              <th className="pb-2">Target</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rec.savings_history.map((s, i) => (
                              <tr key={i} className="border-b last:border-0">
                                <td className="py-1.5 pr-3 whitespace-nowrap">{s.date}</td>
                                <td className="py-1.5 pr-3 font-medium">£{s.amount.toFixed(2)}</td>
                                <td className="py-1.5 pr-3">{s.source}</td>
                                <td className="py-1.5">{s.target}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* child input */}
                    <div className="rounded-lg bg-pink-50 p-3">
                      <h4 className="text-sm font-semibold text-pink-800 mb-1">Child's Input on Spend</h4>
                      <p className="text-sm text-pink-900">{rec.child_input_on_spend}</p>
                    </div>

                    {/* agreed priorities */}
                    <div className="rounded-lg bg-amber-50 p-3">
                      <h4 className="text-sm font-semibold text-amber-900 mb-1">Agreed Spending Priorities</h4>
                      <ul className="list-disc list-inside text-sm text-amber-900">
                        {rec.agreed_spending_priorities.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>

                    {/* exceptional requests */}
                    {rec.exceptional_requests.length > 0 && (
                      <div className="rounded-lg border p-3">
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-amber-600" /> Exceptional Requests this Year
                        </h4>
                        <ul className="space-y-2 text-sm">
                          {rec.exceptional_requests.map((er, i) => (
                            <li key={i} className="border-l-2 border-amber-300 pl-3">
                              <p className="font-medium">{er.request}</p>
                              <p className="text-xs text-muted-foreground">{er.date} — {er.decision}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* smart links */}
                    <SmartLinkPanel sourceType="placement-budget-tracker" sourceId={rec.id} childId={rec.child_id} compact />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Quality Standard 13 — Leadership &amp; management / financial governance.</strong>{" "}
          Each child's placement is properly funded and money is spent in their best interests, reflecting corporate
          parenting principles. Budgets must be transparent, agreed with the child where age-appropriate, regularly
          reviewed and recorded. Junior ISAs and Setting Up Home allowances should be tracked to ensure entitlements
          are protected. All figures shown are illustrative only (£ GBP).
        </div>
      </div>
      )}
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Placement Budget Tracker — placement costs, LA funding, top-up fees, activity allowance, clothing allowance, pocket money, total placement spend per child, commissioning"
        recordType="placement_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
