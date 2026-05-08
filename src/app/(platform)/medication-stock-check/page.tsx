"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plus, Search, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, Clock, Package, ClipboardCheck,
  Calendar, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useMedicationStockChecks } from "@/hooks/use-medication-stock-checks";
import type { MedicationStockCheck, StockCheckType, StockCheckStatus, StockCheckItem } from "@/types/extended";
import { STOCK_CHECK_TYPE_LABEL, STOCK_CHECK_STATUS_LABEL } from "@/types/extended";

const CHECK_TYPE_CLR: Record<StockCheckType, string> = {
  weekly: "bg-blue-100 text-blue-800",
  monthly_audit: "bg-purple-100 text-purple-800",
};

const STATUS_CLR: Record<StockCheckStatus, string> = {
  balanced: "bg-green-100 text-green-800",
  discrepancy: "bg-red-100 text-red-800",
  action_required: "bg-amber-100 text-amber-800",
};
const BORDER_STATUS: Record<StockCheckStatus, string> = {
  balanced: "border-l-green-400",
  discrepancy: "border-l-red-600",
  action_required: "border-l-amber-400",
};

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

export default function MedicationStockCheckPage() {
  const { data: res, isLoading } = useMedicationStockChecks();
  const data: MedicationStockCheck[] = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let rows = data.filter((r) => {
      if (filterType !== "all" && r.check_type !== filterType) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.notes.toLowerCase().includes(q) ||
          r.items.some((i: StockCheckItem) =>
            i.medication.toLowerCase().includes(q) ||
            getYPName(i.yp).toLowerCase().includes(q)
          ) ||
          getStaffName(r.checked_by).toLowerCase().includes(q)
        );
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.date.localeCompare(a.date);
        case "date-asc": return a.date.localeCompare(b.date);
        case "status": {
          const order = ["discrepancy", "action_required", "balanced"];
          return order.indexOf(a.status) - order.indexOf(b.status);
        }
        default: return 0;
      }
    });
    return rows;
  }, [data, search, filterType, filterStatus, sortBy]);

  const today = d(0);
  const thisMonthPrefix = today.slice(0, 7);

  const lastCheckDate = data.length > 0
    ? [...data].sort((a, b) => b.date.localeCompare(a.date))[0].date
    : "—";

  const checksThisMonth = data.filter((r) => r.date.startsWith(thisMonthPrefix)).length;

  const discrepanciesThisMonth = data.filter(
    (r) => r.date.startsWith(thisMonthPrefix) && r.status === "discrepancy"
  ).length;

  const expiryThreshold = d(14);
  const expiringItems = data.flatMap((r) =>
    r.items.filter((i: StockCheckItem) => i.expiry_date <= expiryThreshold && i.expiry_date >= today)
  );
  const uniqueExpiring = expiringItems.filter(
    (item: StockCheckItem, idx: number, arr: StockCheckItem[]) =>
      arr.findIndex((x: StockCheckItem) => x.yp === item.yp && x.medication === item.medication) === idx
  );

  const exportCols: ExportColumn<MedicationStockCheck>[] = [
    { header: "Date", accessor: (r) => r.date },
    { header: "Type", accessor: (r) => STOCK_CHECK_TYPE_LABEL[r.check_type] },
    { header: "Status", accessor: (r) => STOCK_CHECK_STATUS_LABEL[r.status] },
    { header: "Checked By", accessor: (r) => getStaffName(r.checked_by) },
    { header: "Witnessed By", accessor: (r) => getStaffName(r.witnessed_by) },
    { header: "Items Checked", accessor: (r) => String(r.items.length) },
    { header: "Discrepancies", accessor: (r) => String(r.items.filter((i: StockCheckItem) => i.discrepancy).length) },
    { header: "Notes", accessor: (r) => r.notes },
  ];

  if (isLoading) return <PageShell title="Medication Stock Check" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Medication Stock Check"
      subtitle="Physical stock counts, reconciliation & expiry monitoring"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Medication Stock Check Records" />
          <ExportButton data={filtered} columns={exportCols} filename="medication-stock-check" />
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Stock Check</Button>
        </div>
      }
    >
      <div id="print-area">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Last Check", value: lastCheckDate, icon: Calendar, clr: "text-blue-600" },
            { label: "Checks This Month", value: checksThisMonth, icon: ClipboardCheck, clr: "text-green-600" },
            { label: "Discrepancies This Month", value: discrepanciesThisMonth, icon: AlertTriangle, clr: "text-red-600" },
            { label: "Expiry Warnings", value: uniqueExpiring.length, icon: Clock, clr: "text-amber-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {uniqueExpiring.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">
                {uniqueExpiring.length} medication(s) expiring within 14 days
              </p>
              <ul className="mt-1 space-y-0.5">
                {uniqueExpiring.map((item: StockCheckItem, idx: number) => (
                  <li key={idx} className="text-amber-700">
                    {getYPName(item.yp)} — {item.medication} (expires {item.expiry_date})
                  </li>
                ))}
              </ul>
              <p className="text-amber-700 mt-1">
                Review whether repeat prescriptions are needed or stock should be returned to pharmacy before expiry.
              </p>
            </div>
          </div>
        )}

        {discrepanciesThisMonth > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-800">
                {discrepanciesThisMonth} stock discrepancy(ies) recorded this month
              </p>
              <p className="text-red-700">
                All discrepancies must be investigated, documented, and reported to the Registered Manager.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search medication, staff, notes..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="weekly">Weekly</option>
            <option value="monthly_audit">Monthly Audit</option>
          </select>
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="balanced">Balanced</option>
            <option value="discrepancy">Discrepancy</option>
            <option value="action_required">Action Required</option>
          </select>
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="status">By Status</option>
          </select>
        </div>

        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expanded[r.id];
            const discrepancyCount = r.items.filter((i: StockCheckItem) => i.discrepancy).length;
            const itemExpiryWarnings = r.items.filter(
              (i: StockCheckItem) => i.expiry_date <= expiryThreshold && i.expiry_date >= today
            );

            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_STATUS[r.status])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {r.date}
                        <Badge variant="outline" className={CHECK_TYPE_CLR[r.check_type]}>
                          {STOCK_CHECK_TYPE_LABEL[r.check_type]}
                        </Badge>
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>
                          {STOCK_CHECK_STATUS_LABEL[r.status]}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Checked by {getStaffName(r.checked_by)} · Witnessed by {getStaffName(r.witnessed_by)} · {r.items.length} items
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {discrepancyCount > 0 && (
                        <Badge variant="destructive">{discrepancyCount} discrepancy</Badge>
                      )}
                      {itemExpiryWarnings.length > 0 && (
                        <Badge variant="outline" className="bg-amber-100 text-amber-800">
                          {itemExpiryWarnings.length} expiry warning
                        </Badge>
                      )}
                      {open ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-xs text-muted-foreground">
                            <th className="py-2 pr-3">Young Person</th>
                            <th className="py-2 pr-3">Medication</th>
                            <th className="py-2 pr-3 text-center">Expected</th>
                            <th className="py-2 pr-3 text-center">Actual</th>
                            <th className="py-2 pr-3 text-center">Unit</th>
                            <th className="py-2 pr-3 text-center">Expiry</th>
                            <th className="py-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.items.map((item: StockCheckItem, idx: number) => {
                            const expiringSoon = item.expiry_date <= expiryThreshold && item.expiry_date >= today;
                            return (
                              <tr
                                key={idx}
                                className={cn(
                                  "border-b last:border-0",
                                  item.discrepancy && "bg-red-50",
                                  expiringSoon && !item.discrepancy && "bg-amber-50"
                                )}
                              >
                                <td className="py-2 pr-3">{getYPName(item.yp)}</td>
                                <td className="py-2 pr-3 font-medium">{item.medication}</td>
                                <td className="py-2 pr-3 text-center">{item.expected_count}</td>
                                <td className={cn(
                                  "py-2 pr-3 text-center font-medium",
                                  item.discrepancy ? "text-red-700" : "text-green-700"
                                )}>
                                  {item.actual_count}
                                </td>
                                <td className="py-2 pr-3 text-center text-muted-foreground">{item.unit}</td>
                                <td className={cn(
                                  "py-2 pr-3 text-center",
                                  expiringSoon && "text-amber-700 font-medium"
                                )}>
                                  {item.expiry_date}
                                  {expiringSoon && <span className="ml-1">⚠</span>}
                                </td>
                                <td className="py-2 text-center">
                                  {item.discrepancy ? (
                                    <Badge variant="destructive" className="text-xs">Discrepancy</Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                                      <CheckCircle2 className="h-3 w-3 mr-1" /> Match
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">Total Items</p>
                        <p className="text-lg font-bold">{r.items.length}</p>
                      </div>
                      <div className={cn("rounded p-2 text-center", discrepancyCount > 0 ? "bg-red-50" : "bg-green-50")}>
                        <p className="font-medium text-xs">Discrepancies</p>
                        <p className="text-lg font-bold">{discrepancyCount}</p>
                      </div>
                      <div className={cn("rounded p-2 text-center", itemExpiryWarnings.length > 0 ? "bg-amber-50" : "bg-muted/40")}>
                        <p className="font-medium text-xs">Expiry Warnings</p>
                        <p className="text-lg font-bold">{itemExpiryWarnings.length}</p>
                      </div>
                      <div className={cn("rounded p-2 text-center", r.status === "balanced" ? "bg-green-50" : r.status === "discrepancy" ? "bg-red-50" : "bg-amber-50")}>
                        <p className="font-medium text-xs">Overall</p>
                        <p className="text-sm font-bold">{STOCK_CHECK_STATUS_LABEL[r.status]}</p>
                      </div>
                    </div>

                    <div>
                      <p className="font-medium mb-1">Notes</p>
                      <p className="text-muted-foreground">{r.notes}</p>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                      <span>Checked by: {getStaffName(r.checked_by)} · Witnessed: {getStaffName(r.witnessed_by)}</span>
                      <span>{r.date}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>
            Children&apos;s Homes (England) Regulations 2015, Reg 23 — the registered person must make arrangements for the handling, recording, safekeeping, safe administration and disposal of medicines received into the children&apos;s home. Accurate medication records must be maintained including stock counts, reconciliation against MAR charts, and expiry date monitoring. All stock checks must be witnessed by a second member of staff. Discrepancies must be investigated, documented, and reported to the Registered Manager. Controlled drugs require additional two-person witnessed counts in line with the Misuse of Drugs Act 1971.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
