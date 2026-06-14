"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap, Droplets, Flame, Wifi, TrendingUp, TrendingDown, AlertTriangle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUtilityMonitoringRecords } from "@/hooks/use-utility-monitoring-records";
import type { UtilityMonitoringRecord, UtilityMonitoringType } from "@/types/extended";
import { UTILITY_MONITORING_TYPE_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── local config (icons / colours — not serialisable) ─────────────────── */

const TYPE_ICON: Record<UtilityMonitoringType, React.ElementType> = { electricity: Zap, gas: Flame, water: Droplets, broadband: Wifi };
const TYPE_CLR: Record<UtilityMonitoringType, string> = { electricity: "text-yellow-600", gas: "text-orange-600", water: "text-blue-600", broadband: "text-purple-600" };

/* ── helpers ───────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

/* ── page ──────────────────────────────────────────────────────────────── */

export default function UtilityMonitoringPage() {
  const { data: records = [], isLoading } = useUtilityMonitoringRecords();

  const latestByType = useMemo(() => {
    const map = new Map<UtilityMonitoringType, UtilityMonitoringRecord>();
    for (const r of records) {
      if (!map.has(r.utility_type) || r.period > (map.get(r.utility_type)?.period || "")) {
        map.set(r.utility_type, r);
      }
    }
    return map;
  }, [records]);

  const totalMonthlyCost = Array.from(latestByType.values()).reduce((s, r) => s + r.cost, 0);
  const totalBudget = Array.from(latestByType.values()).reduce((s, r) => s + r.budget_allocation, 0);
  const totalVariance = totalMonthlyCost - totalBudget;

  const exportCols: ExportColumn<UtilityMonitoringRecord>[] = [
    { header: "Utility", accessor: (r: UtilityMonitoringRecord) => UTILITY_MONITORING_TYPE_LABEL[r.utility_type] },
    { header: "Period", accessor: (r: UtilityMonitoringRecord) => r.period },
    { header: "Usage", accessor: (r: UtilityMonitoringRecord) => r.usage > 0 ? `${r.usage} ${r.unit}` : "N/A" },
    { header: "Cost", accessor: (r: UtilityMonitoringRecord) => `£${r.cost.toFixed(2)}` },
    { header: "Budget", accessor: (r: UtilityMonitoringRecord) => `£${r.budget_allocation.toFixed(2)}` },
    { header: "Variance", accessor: (r: UtilityMonitoringRecord) => `£${r.variance.toFixed(2)}` },
    { header: "Supplier", accessor: (r: UtilityMonitoringRecord) => r.supplier },
    { header: "Contract End", accessor: (r: UtilityMonitoringRecord) => r.contract_end },
  ];

  if (isLoading) {
    return (
      <PageShell title="Utility Monitoring" subtitle="Gas · Electric · Water · Broadband · Cost Management">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Utility Monitoring"
      subtitle="Gas · Electric · Water · Broadband · Cost Management"
      caraContext={{ pageTitle: "Utility Monitoring", sourceType: "home_check" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Utility Monitoring" />
          <ExportButton data={records} columns={exportCols} filename="utility-monitoring" />
          <CaraStudioQuickActionButton context={{ record_type: "ofsted_evidence", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area">
        {/* summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {(["electricity", "gas", "water", "broadband"] as UtilityMonitoringType[]).map((type) => {
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
                  <p className="text-xs text-muted-foreground">{UTILITY_MONITORING_TYPE_LABEL[type]} — {latest.period}</p>
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
        {(["electricity", "gas", "water", "broadband"] as UtilityMonitoringType[]).map((type) => {
          const readings = records.filter((r) => r.utility_type === type).sort((a, b) => b.period.localeCompare(a.period));
          const latest = readings[0];
          if (!latest) return null;
          const Icon = TYPE_ICON[type];

          return (
            <Card key={type} className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className={cn("h-5 w-5", TYPE_CLR[type])} />
                  {UTILITY_MONITORING_TYPE_LABEL[type]}
                  <Badge variant="outline" className="bg-muted/50 text-xs">{latest.supplier}</Badge>
                  <Badge variant="outline" className="bg-muted/50 text-xs">Contract ends: {latest.contract_end}</Badge>
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
                          <td className="text-right py-2 px-2">£{r.budget_allocation.toFixed(2)}</td>
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
        {Array.from(latestByType.values()).some((r) => r.contract_end <= d(90)) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">Contract renewal approaching</p>
              <p className="text-amber-700">
                {Array.from(latestByType.values()).filter((r) => r.contract_end <= d(90)).map((r) => `${UTILITY_MONITORING_TYPE_LABEL[r.utility_type]} (${r.supplier}) expires ${r.contract_end}`).join(". ")}. Review quotes and renegotiate in good time.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Financial Management</p>
          <p>Children&apos;s home utility costs are monitored monthly as part of the home&apos;s financial management. Readings are submitted to the finance team for budget tracking. Significant variances (±10%) must be investigated and explained. Energy efficiency measures should be implemented where practical. Contract renewals are managed centrally with quotes obtained at least 3 months before expiry. Smart meters are installed where available for accurate monitoring. Young people are encouraged to understand utility usage as part of independence skills development.</p>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Utility Monitoring — electricity, gas, water, broadband usage and costs, budget variances, supplier contracts, contract renewals, energy efficiency, independence skills"
        recordType="ofsted_evidence"
        className="mt-6"
      />
    </PageShell>
  );
}
