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
  Utensils,
  Thermometer,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Clock,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useKitchenHygieneChecks } from "@/hooks/use-kitchen-hygiene-checks";
import type { KitchenHygieneCheck, HygieneShiftType, HygieneVerdict, FridgeOrganisation } from "@/types/extended";
import { HYGIENE_SHIFT_TYPE_LABEL, HYGIENE_VERDICT_LABEL, FRIDGE_ORGANISATION_LABEL } from "@/types/extended";

const verdictColour: Record<HygieneVerdict, string> = {
  pass: "bg-green-100 text-green-800",
  pass_with_minor_actions: "bg-amber-100 text-amber-800",
  fail: "bg-red-100 text-red-800",
};

const cleanColour: Record<FridgeOrganisation, string> = {
  excellent: "bg-emerald-100 text-emerald-800",
  good: "bg-blue-100 text-blue-800",
  adequate: "bg-amber-100 text-amber-800",
  needs_attention: "bg-red-100 text-red-800",
};

export default function KitchenHygieneMonitoringPage() {
  const { data: res, isLoading } = useKitchenHygieneChecks();
  const data: KitchenHygieneCheck[] = res?.data ?? [];

  const [filterShift, setFilterShift] = useState("all");
  const [filterVerdict, setFilterVerdict] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterShift !== "all") items = items.filter((c) => c.shift_type === filterShift);
    if (filterVerdict !== "all") items = items.filter((c) => c.overall_verdict === filterVerdict);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return (b.date + b.time).localeCompare(a.date + a.time);
        case "verdict": {
          const ord: Record<HygieneVerdict, number> = { fail: 0, pass_with_minor_actions: 1, pass: 2 };
          return ord[a.overall_verdict] - ord[b.overall_verdict];
        }
        default:
          return 0;
      }
    });
    return items;
  }, [data, filterShift, filterVerdict, sortBy]);

  const total = data.length;
  const passed = data.filter((c) => c.overall_verdict === "pass").length;
  const tempIssues = data.filter((c) => !c.fridge_within_range || !c.freezer_within_range).length;
  const expiredFound = data.reduce((sum, c) => sum + c.expired_items_found.length, 0);

  const exportCols: ExportColumn<KitchenHygieneCheck>[] = [
    { header: "Date", accessor: (r: KitchenHygieneCheck) => r.date },
    { header: "Time", accessor: (r: KitchenHygieneCheck) => r.time },
    { header: "Staff", accessor: (r: KitchenHygieneCheck) => getStaffName(r.staff_member) },
    { header: "Fridge °C", accessor: (r: KitchenHygieneCheck) => `${r.fridge_temperature}°C` },
    { header: "Freezer °C", accessor: (r: KitchenHygieneCheck) => `${r.freezer_temperature}°C` },
    { header: "Verdict", accessor: (r: KitchenHygieneCheck) => HYGIENE_VERDICT_LABEL[r.overall_verdict] },
    { header: "Cleanliness", accessor: (r: KitchenHygieneCheck) => FRIDGE_ORGANISATION_LABEL[r.fridge_organisation] },
  ];

  if (isLoading) return <PageShell title="Kitchen Hygiene Monitoring" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Kitchen Hygiene Monitoring"
      subtitle="Daily kitchen hygiene checks — temperatures, cleanliness, food safety, child cooking supervision"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="kitchen-hygiene-monitoring" />
          <PrintButton title="Kitchen Hygiene Monitoring" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Recent Checks</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{total > 0 ? Math.round((passed / total) * 100) : 0}%</p>
          <p className="text-xs text-muted-foreground">Full Pass Rate</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", tempIssues > 0 ? "text-amber-600" : "text-green-600")}>{tempIssues}</p>
          <p className="text-xs text-muted-foreground">Temp Deviations</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", expiredFound > 0 ? "text-amber-600" : "text-green-600")}>{expiredFound}</p>
          <p className="text-xs text-muted-foreground">Expired Items Caught</p>
        </div>
      </div>

      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 mb-6 flex items-start gap-2">
        <Utensils className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
        <p className="text-sm text-emerald-800">
          Kitchen hygiene is checked at every shift handover and before any food preparation. Temperatures
          recorded, cleanliness verified, child-led cooking supported safely. Aligned with Food Standards
          Agency &lsquo;Safer Food, Better Business&rsquo; framework.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterShift} onValueChange={setFilterShift}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Shifts" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Shifts</SelectItem>
            {(Object.entries(HYGIENE_SHIFT_TYPE_LABEL) as [string, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterVerdict} onValueChange={setFilterVerdict}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Verdicts" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Verdicts</SelectItem>
            {(Object.entries(HYGIENE_VERDICT_LABEL) as [string, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
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
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((c) => {
          const isExpanded = expandedId === c.id;
          const hasIssues = !c.fridge_within_range || !c.freezer_within_range || c.expired_items_found.length > 0;

          return (
            <div key={c.id} className={cn("rounded-xl border bg-white overflow-hidden",
              hasIssues && "border-l-4 border-l-amber-500"
            )}>
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Utensils className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.date} {c.time} — {HYGIENE_SHIFT_TYPE_LABEL[c.shift_type]} ({getStaffName(c.staff_member)})</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Fridge {c.fridge_temperature}°C &middot; Freezer {c.freezer_temperature}°C
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", verdictColour[c.overall_verdict])}>
                    {HYGIENE_VERDICT_LABEL[c.overall_verdict]}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className={cn("rounded-lg p-2 text-center text-sm", c.fridge_within_range ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800")}>
                      <Thermometer className="h-3 w-3 inline mr-1" />Fridge {c.fridge_temperature}°C
                      <p className="text-xs">(2-8°C target)</p>
                    </div>
                    <div className={cn("rounded-lg p-2 text-center text-sm", c.freezer_within_range ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800")}>
                      <Thermometer className="h-3 w-3 inline mr-1" />Freezer {c.freezer_temperature}°C
                      <p className="text-xs">(-18°C+)</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Cleanliness</p>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", cleanColour[c.fridge_organisation])}>{FRIDGE_ORGANISATION_LABEL[c.fridge_organisation]}</span>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Bins</p>
                      <p className="font-medium">{c.bins}</p>
                    </div>
                  </div>

                  {c.cooking_temps_recorded.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Cooking Temperatures</p>
                      <div className="space-y-1">
                        {c.cooking_temps_recorded.map((t, i) => (
                          <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-center justify-between">
                            <span>{t.meal}</span>
                            <span className={cn("text-sm font-medium", t.pass ? "text-green-600" : "text-red-600")}>
                              {t.temp_reading}°C (min {t.min_required}°C)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {c.hot_holding_temps.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Hot Holding</p>
                      <div className="space-y-1">
                        {c.hot_holding_temps.map((h, i) => (
                          <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-center justify-between">
                            <span>{h.item}</span>
                            <span className={cn("text-sm font-medium", h.pass ? "text-green-600" : "text-red-600")}>
                              {h.temp}°C
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border space-y-1 text-sm">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">General Hygiene</p>
                      <p className="flex items-center gap-1">{c.surfaces_cleaned ? <CheckCircle className="h-3 w-3 text-green-500" /> : <AlertTriangle className="h-3 w-3 text-amber-500" />} Surfaces cleaned</p>
                      <p className="flex items-center gap-1">{c.cleaning_products_correct ? <CheckCircle className="h-3 w-3 text-green-500" /> : <AlertTriangle className="h-3 w-3 text-amber-500" />} Correct products used</p>
                      <p className="flex items-center gap-1">{c.handwashing_observed ? <CheckCircle className="h-3 w-3 text-green-500" /> : <AlertTriangle className="h-3 w-3 text-amber-500" />} Handwashing observed</p>
                      <p className="flex items-center gap-1">{c.cutting_board_segregation ? <CheckCircle className="h-3 w-3 text-green-500" /> : <AlertTriangle className="h-3 w-3 text-amber-500" />} Board segregation</p>
                      <p className="flex items-center gap-1">{c.allergen_labelling ? <CheckCircle className="h-3 w-3 text-green-500" /> : <AlertTriangle className="h-3 w-3 text-amber-500" />} Allergen labelling</p>
                      <p className="flex items-center gap-1">{c.fridge_rotation ? <CheckCircle className="h-3 w-3 text-green-500" /> : <AlertTriangle className="h-3 w-3 text-amber-500" />} Stock rotation</p>
                      <p className="flex items-center gap-1">{!c.pests_observed ? <CheckCircle className="h-3 w-3 text-green-500" /> : <AlertTriangle className="h-3 w-3 text-red-500" />} No pests</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border space-y-1 text-sm">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Children Cooking</p>
                      <p>{c.children_preparing_food_supervision || "No children preparing food this check"}</p>
                      {c.cooking_activity_safety_briefing_done && (
                        <p className="text-xs text-green-700 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Safety briefing done</p>
                      )}
                    </div>
                  </div>

                  {c.expired_items_found.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />Expired Items Caught &amp; Disposed
                      </p>
                      <ul className="space-y-1">
                        {c.expired_items_found.map((e, i) => (
                          <li key={i} className="text-sm">
                            <strong>{e.item}</strong> (expired {e.expiry_date}) — {e.disposed ? "disposed" : "pending disposal"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {c.immediate_actions.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Immediate Actions</p>
                      <ul className="space-y-1">
                        {c.immediate_actions.map((a, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {c.follow_up_actions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Follow-Up Actions</p>
                      <ul className="space-y-1">
                        {c.follow_up_actions.map((a, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Clock className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {c.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm">{c.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Sparkles className="h-3 w-3 inline mr-1" />Bins: {c.bins} (emptied {c.bin_emptied_time})</span>
                    <span>Dishwasher: {c.dishwasher_cycle_notes}</span>
                    <span>Defrosting: {c.defrosting_practice}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Kitchen hygiene monitoring supports Food Hygiene Regulations
          (EC) No 852/2004, Food Safety Act 1990, FSA &lsquo;Safer Food, Better Business&rsquo; framework,
          and Quality Standard 7 (health and wellbeing). Linked to Food Hygiene, Menu Planning, and Health
          and Safety records.
        </p>
      </div>
    </PageShell>
  );
}
