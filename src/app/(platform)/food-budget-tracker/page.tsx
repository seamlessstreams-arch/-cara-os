"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Wallet,
  Utensils,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Loader2,
} from "lucide-react";
import type { FoodBudgetWeekRecord, FoodBudgetSpendItem, FoodBudgetTreatItem } from "@/types/extended";
import { useFoodBudgetWeekRecords } from "@/hooks/use-food-budget-week-records";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const exportCols: ExportColumn<FoodBudgetWeekRecord>[] = [
  { header: "Week", accessor: (r: FoodBudgetWeekRecord) => r.week_starting },
  { header: "Budget £", accessor: (r: FoodBudgetWeekRecord) => `£${r.weekly_budget}` },
  { header: "Spent £", accessor: (r: FoodBudgetWeekRecord) => `£${r.total_spent}` },
  { header: "Variance £", accessor: (r: FoodBudgetWeekRecord) => `${r.variance > 0 ? "+" : ""}£${r.variance}` },
  { header: "Cook-from-scratch %", accessor: (r: FoodBudgetWeekRecord) => `${r.cook_from_scratch_proportion}%` },
  { header: "Cultural", accessor: (r: FoodBudgetWeekRecord) => r.cultural_ingredients_included ? "Yes" : "No" },
  { header: "Sensory-friendly", accessor: (r: FoodBudgetWeekRecord) => r.sensory_friendly_options_included ? "Yes" : "No" },
];

export default function FoodBudgetTrackerPage() {
  const { data: res, isLoading } = useFoodBudgetWeekRecords();
  const records = res?.data ?? [];
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const items = [...records];
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.week_starting.localeCompare(a.week_starting);
        case "spend":
          return b.total_spent - a.total_spent;
        case "variance":
          return Math.abs(b.variance) - Math.abs(a.variance);
        default:
          return 0;
      }
    });
    return items;
  }, [sortBy, records]);

  const total = records.length;
  const totalSpend = records.reduce((sum, w) => sum + w.total_spent, 0);
  const totalBudget = records.reduce((sum, w) => sum + w.weekly_budget, 0);
  const avgVariance = records.length ? (records.reduce((sum, w) => sum + w.variance, 0) / records.length).toFixed(0) : "0";
  const culturalWeeks = records.filter((w) => w.cultural_ingredients_included).length;

  return (
    <PageShell
      title="Food Budget Tracker"
      subtitle="Weekly food budget — child involvement, cultural representation, sensory inclusion, and value"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="food-budget-tracker" />
          <PrintButton title="Food Budget Tracker" />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl border bg-white p-4 text-center">
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-muted-foreground">Weeks Logged</p>
            </div>
            <div className="rounded-xl border bg-white p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">£{totalSpend}</p>
              <p className="text-xs text-muted-foreground">Spent (of £{totalBudget})</p>
            </div>
            <div className="rounded-xl border bg-white p-4 text-center">
              <p className={cn("text-2xl font-bold flex items-center justify-center gap-1", parseInt(avgVariance) > 0 ? "text-amber-600" : "text-green-600")}>
                {parseInt(avgVariance) > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                {parseInt(avgVariance) > 0 ? "+" : ""}£{avgVariance}
              </p>
              <p className="text-xs text-muted-foreground">Avg Weekly Variance</p>
            </div>
            <div className="rounded-xl border bg-white p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{culturalWeeks}/{total}</p>
              <p className="text-xs text-muted-foreground">Cultural Weeks</p>
            </div>
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-6 flex items-start gap-2">
            <Utensils className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">
              Food is care, identity, and culture. We track the budget but also what it represents — children
              involved in planning, cultural meals normal, sensory needs respected, and special moments
              celebrated even when they push the line. Figures illustrative.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex items-center gap-1">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Most Recent</SelectItem>
                  <SelectItem value="spend">Highest Spend</SelectItem>
                  <SelectItem value="variance">Largest Variance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            {filtered.map((w) => {
              const isExpanded = expandedId === w.id;

              return (
                <div key={w.id} className="rounded-xl border bg-white overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : w.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Utensils className="h-5 w-5 text-amber-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">Week starting {w.week_starting}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Spent £{w.total_spent} of £{w.weekly_budget} &middot; {w.cook_from_scratch_proportion}% cook-from-scratch
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className={cn("text-sm font-bold", w.variance < 0 ? "text-green-600" : w.variance > 50 ? "text-red-600" : "text-amber-600")}>
                        {w.variance > 0 ? "+" : ""}£{w.variance}
                      </span>
                      {w.cultural_ingredients_included && <Sparkles className="h-4 w-4 text-purple-500" />}
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Spend Breakdown</p>
                        <div className="space-y-1">
                          {w.spend.map((s, i) => (
                            <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-center justify-between">
                              <div>
                                <p className="font-medium">{s.category}</p>
                                <p className="text-xs text-muted-foreground">{s.supplier}</p>
                              </div>
                              <span className="font-medium">£{s.amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-pink-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">Children&apos;s Meal Requests Honoured</p>
                        <ul className="space-y-1">
                          {w.child_meal_requests_honoured.map((m, i) => (
                            <li key={i} className="text-sm flex items-start gap-1">
                              <Sparkles className="h-3 w-3 text-pink-500 mt-1 shrink-0" />
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Child Involvement — Planning</p>
                          <p className="text-sm">{w.child_involvement_in_planning}</p>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Child Involvement — Shopping</p>
                          <p className="text-sm">{w.child_involvement_in_shopping}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className={cn("rounded-lg p-2 text-center text-sm", w.cultural_ingredients_included ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600")}>
                          Cultural: {w.cultural_ingredients_included ? "Yes" : "No"}
                        </div>
                        <div className={cn("rounded-lg p-2 text-center text-sm", w.sensory_friendly_options_included ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800")}>
                          Sensory: {w.sensory_friendly_options_included ? "Yes" : "Check"}
                        </div>
                        <div className="bg-blue-50 text-blue-800 rounded-lg p-2 text-center text-sm">
                          Cook %: {w.cook_from_scratch_proportion}%
                        </div>
                        <div className="bg-purple-50 text-purple-800 rounded-lg p-2 text-center text-sm">
                          Treats: {w.takeaways_or_treats.length}
                        </div>
                      </div>

                      {w.takeaways_or_treats.length > 0 && (
                        <div className="bg-amber-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Takeaways &amp; Treats</p>
                          <div className="space-y-1">
                            {w.takeaways_or_treats.map((t, i) => (
                              <div key={i} className="text-sm">
                                <p className="font-medium">{t.date}: {t.item} (£{t.cost})</p>
                                <p className="text-xs text-muted-foreground">{t.reason}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="bg-slate-50 rounded-lg p-3 border text-sm">
                        <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Waste &amp; Efficiency</p>
                        <p>{w.waste_noted}</p>
                      </div>

                      {w.notes && (
                        <div className="bg-slate-50 rounded-lg p-3 border">
                          <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Notes</p>
                          <p className="text-sm">{w.notes}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                        <span><Wallet className="h-3 w-3 inline mr-1" />Budget £{w.weekly_budget}</span>
                        <span>Shopped: {w.shopped_by}</span>
                        <span>Cooked: {w.cooked_by}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-lg bg-muted/50 border p-4">
            <p className="text-xs text-muted-foreground">
              <strong>Regulatory Context:</strong> Food budget tracking supports Quality Standard 7 (health
              and wellbeing — nutrition), Quality Standard 1 (child-centred care — preferences), Quality
              Standard 6 (relationships — shared meals), and financial governance. Linked to Menu Planning,
              Dietary Requirements, Kitchen Hygiene Monitoring, Cultural Identity, and Sensory Profiles.
            </p>
          </div>
        </>
      )}
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
