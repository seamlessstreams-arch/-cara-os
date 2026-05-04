"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap, Droplets, Flame, Wifi, TrendingUp, TrendingDown, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── types ─────────────────────────────────────────────────────────────────── */

type UtilityType = "electricity" | "gas" | "water" | "broadband";

interface UtilityReading {
  id: string;
  utilityType: UtilityType;
  period: string;
  meterReading: number;
  previousReading: number;
  usage: number;
  unit: string;
  cost: number;
  budgetAllocation: number;
  variance: number;
  supplier: string;
  contractEnd: string;
  notes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const TYPE_ICON: Record<UtilityType, React.ElementType> = { electricity: Zap, gas: Flame, water: Droplets, broadband: Wifi };
const TYPE_CLR: Record<UtilityType, string> = { electricity: "text-yellow-600", gas: "text-orange-600", water: "text-blue-600", broadband: "text-purple-600" };
const TYPE_LABEL: Record<UtilityType, string> = { electricity: "Electricity", gas: "Gas", water: "Water", broadband: "Broadband" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: UtilityReading[] = [
  { id: "ut_001", utilityType: "electricity", period: "April 2025", meterReading: 45821, previousReading: 45340, usage: 481, unit: "kWh", cost: 168.35, budgetAllocation: 175, variance: -6.65, supplier: "British Gas Business", contractEnd: d(210), notes: "Usage within budget. Smart meter installed — accurate readings. LED lighting upgrade completed last quarter has reduced consumption by approximately 12%." },
  { id: "ut_002", utilityType: "electricity", period: "March 2025", meterReading: 45340, previousReading: 44820, usage: 520, unit: "kWh", cost: 182, budgetAllocation: 175, variance: 7, supplier: "British Gas Business", contractEnd: d(210), notes: "Slightly over budget. Increased heating use due to cold snap in late March. Tumble dryer use was higher than average (wet weather preventing outdoor drying)." },
  { id: "ut_003", utilityType: "gas", period: "April 2025", meterReading: 12450, previousReading: 12180, usage: 270, unit: "m³", cost: 145.80, budgetAllocation: 160, variance: -14.20, supplier: "EDF Energy", contractEnd: d(150), notes: "Under budget. Milder weather reduced heating demand. Boiler serviced in March — running efficiently. Timer settings reviewed — heating off between 09:00-15:00 when children are at school." },
  { id: "ut_004", utilityType: "gas", period: "March 2025", meterReading: 12180, previousReading: 11850, usage: 330, unit: "m³", cost: 178.20, budgetAllocation: 160, variance: 18.20, supplier: "EDF Energy", contractEnd: d(150), notes: "Over budget due to cold spell. Heating required throughout the day on 3 occasions when Alex was off school (chickenpox) and needed to stay warm." },
  { id: "ut_005", utilityType: "water", period: "April 2025", meterReading: 3421, previousReading: 3389, usage: 32, unit: "m³", cost: 85.60, budgetAllocation: 90, variance: -4.40, supplier: "Severn Trent", contractEnd: d(365), notes: "Within budget. Water-saving showerheads installed in February. Washing machine runs reduced to full loads only policy. No leaks detected in quarterly check." },
  { id: "ut_006", utilityType: "water", period: "March 2025", meterReading: 3389, previousReading: 3354, usage: 35, unit: "m³", cost: 93.80, budgetAllocation: 90, variance: 3.80, supplier: "Severn Trent", contractEnd: d(365), notes: "Marginally over budget. Increased laundry during chickenpox period (daily bedding washes). One toilet cistern running continuously — repaired on 15th March." },
  { id: "ut_007", utilityType: "broadband", period: "April 2025", meterReading: 0, previousReading: 0, usage: 0, unit: "N/A", cost: 65, budgetAllocation: 65, variance: 0, supplier: "BT Business Fibre", contractEnd: d(420), notes: "Fixed monthly cost. 500Mbps fibre connection. Wi-Fi extender installed in Alex's bedroom area following his complaint about signal dropouts. Coverage now good throughout the building." },
  { id: "ut_008", utilityType: "broadband", period: "March 2025", meterReading: 0, previousReading: 0, usage: 0, unit: "N/A", cost: 65, budgetAllocation: 65, variance: 0, supplier: "BT Business Fibre", contractEnd: d(420), notes: "Fixed monthly cost. No connectivity issues this month. Content filter operating correctly. Parental controls in place per online safety policy." },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function UtilityMonitoringPage() {
  const [data] = useState(SEED);

  const latestByType = useMemo(() => {
    const map = new Map<UtilityType, UtilityReading>();
    for (const r of data) {
      if (!map.has(r.utilityType) || r.period > (map.get(r.utilityType)?.period || "")) {
        map.set(r.utilityType, r);
      }
    }
    return map;
  }, [data]);

  const totalMonthlyCost = Array.from(latestByType.values()).reduce((s, r) => s + r.cost, 0);
  const totalBudget = Array.from(latestByType.values()).reduce((s, r) => s + r.budgetAllocation, 0);
  const totalVariance = totalMonthlyCost - totalBudget;

  const exportCols: ExportColumn<UtilityReading>[] = [
    { header: "Utility", accessor: (r: UtilityReading) => TYPE_LABEL[r.utilityType] },
    { header: "Period", accessor: (r: UtilityReading) => r.period },
    { header: "Usage", accessor: (r: UtilityReading) => r.usage > 0 ? `${r.usage} ${r.unit}` : "N/A" },
    { header: "Cost", accessor: (r: UtilityReading) => `£${r.cost.toFixed(2)}` },
    { header: "Budget", accessor: (r: UtilityReading) => `£${r.budgetAllocation.toFixed(2)}` },
    { header: "Variance", accessor: (r: UtilityReading) => `£${r.variance.toFixed(2)}` },
    { header: "Supplier", accessor: (r: UtilityReading) => r.supplier },
    { header: "Contract End", accessor: (r: UtilityReading) => r.contractEnd },
  ];

  return (
    <PageShell
      title="Utility Monitoring"
      subtitle="Gas · Electric · Water · Broadband · Cost Management"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Utility Monitoring" />
          <ExportButton data={data} columns={exportCols} filename="utility-monitoring" />
        </div>
      }
    >
      <div id="print-area">
        {/* summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {(["electricity", "gas", "water", "broadband"] as UtilityType[]).map((type) => {
            const latest = latestByType.get(type);
            if (!latest) return null;
            const Icon = TYPE_ICON[type];
            return (
              <Card key={type}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={cn("h-5 w-5", TYPE_CLR[type])} />
                    {latest.variance > 0 ? (
                      <Badge variant="outline" className="bg-red-100 text-red-800 text-xs">+£{latest.variance.toFixed(0)}</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">-£{Math.abs(latest.variance).toFixed(0)}</Badge>
                    )}
                  </div>
                  <p className="text-lg font-bold">£{latest.cost.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">{TYPE_LABEL[type]} — {latest.period}</p>
                  {latest.usage > 0 && <p className="text-xs text-muted-foreground">{latest.usage} {latest.unit}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* total summary */}
        <div className={cn("rounded-lg p-3 mb-6 flex items-start gap-2", totalVariance > 0 ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200")}>
          {totalVariance > 0 ? (
            <TrendingUp className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          ) : (
            <TrendingDown className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          )}
          <div className="text-sm">
            <p className={cn("font-semibold", totalVariance > 0 ? "text-red-800" : "text-green-800")}>
              Monthly Total: £{totalMonthlyCost.toFixed(2)} (Budget: £{totalBudget.toFixed(2)}) — {totalVariance > 0 ? `£${totalVariance.toFixed(2)} over` : `£${Math.abs(totalVariance).toFixed(2)} under`} budget
            </p>
          </div>
        </div>

        {/* per-utility detailed cards */}
        {(["electricity", "gas", "water", "broadband"] as UtilityType[]).map((type) => {
          const readings = data.filter((r) => r.utilityType === type).sort((a, b) => b.period.localeCompare(a.period));
          const latest = readings[0];
          if (!latest) return null;
          const Icon = TYPE_ICON[type];

          return (
            <Card key={type} className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className={cn("h-5 w-5", TYPE_CLR[type])} />
                  {TYPE_LABEL[type]}
                  <Badge variant="outline" className="bg-muted/50 text-xs">{latest.supplier}</Badge>
                  <Badge variant="outline" className="bg-muted/50 text-xs">Contract ends: {latest.contractEnd}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* month-by-month table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1 pr-4 font-medium">Period</th>
                        {type !== "broadband" && <th className="text-right py-1 px-2 font-medium">Usage</th>}
                        <th className="text-right py-1 px-2 font-medium">Cost</th>
                        <th className="text-right py-1 px-2 font-medium">Budget</th>
                        <th className="text-right py-1 px-2 font-medium">Variance</th>
                        <th className="text-left py-1 pl-4 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {readings.map((r) => (
                        <tr key={r.id} className="border-b border-muted/30">
                          <td className="py-2 pr-4 font-medium">{r.period}</td>
                          {type !== "broadband" && <td className="text-right py-2 px-2">{r.usage} {r.unit}</td>}
                          <td className="text-right py-2 px-2">£{r.cost.toFixed(2)}</td>
                          <td className="text-right py-2 px-2">£{r.budgetAllocation.toFixed(2)}</td>
                          <td className={cn("text-right py-2 px-2 font-medium", r.variance > 0 ? "text-red-700" : "text-green-700")}>
                            {r.variance > 0 ? "+" : ""}£{r.variance.toFixed(2)}
                          </td>
                          <td className="py-2 pl-4 text-muted-foreground max-w-[300px] truncate">{r.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* contract renewal alert */}
        {Array.from(latestByType.values()).some((r) => r.contractEnd <= d(90)) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">Contract renewal approaching</p>
              <p className="text-amber-700">
                {Array.from(latestByType.values()).filter((r) => r.contractEnd <= d(90)).map((r) => `${TYPE_LABEL[r.utilityType]} (${r.supplier}) expires ${r.contractEnd}`).join(". ")}. Review quotes and renegotiate in good time.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Financial Management</p>
          <p>Children&apos;s home utility costs are monitored monthly as part of the home&apos;s financial management. Readings are submitted to the finance team for budget tracking. Significant variances (±10%) must be investigated and explained. Energy efficiency measures should be implemented where practical. Contract renewals are managed centrally with quotes obtained at least 3 months before expiry. Smart meters are installed where available for accurate monitoring. Young people are encouraged to understand utility usage as part of independence skills development.</p>
        </div>
      </div>
    </PageShell>
  );
}
