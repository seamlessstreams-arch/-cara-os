"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Zap,
  Flame,
  Droplet,
  Wifi,
  Phone,
  Building2,
  Trash2,
  Tv,
  Receipt,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wallet,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
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

import type { UtilityBill } from "@/types/extended";
import { useUtilityBills } from "@/hooks/use-utility-bills";

const utilityIcon: Record<string, typeof Zap> = {
  Electricity: Zap,
  Gas: Flame,
  Water: Droplet,
  Broadband: Wifi,
  Phone: Phone,
  "Council Tax": Building2,
  Insurance: Receipt,
};

const statusColour: Record<string, string> = {
  Paid: "bg-green-100 text-green-800",
  Pending: "bg-amber-100 text-amber-800",
  Overdue: "bg-red-100 text-red-800",
  Disputed: "bg-purple-100 text-purple-800",
};

const exportCols: ExportColumn<UtilityBill>[] = [
  { header: "Utility", accessor: (r: UtilityBill) => r.utilityType },
  { header: "Supplier", accessor: (r: UtilityBill) => r.supplier },
  { header: "Account", accessor: (r: UtilityBill) => r.accountNumber },
  { header: "Period", accessor: (r: UtilityBill) => r.billPeriod },
  { header: "Bill Date", accessor: (r: UtilityBill) => r.billDate },
  { header: "Due Date", accessor: (r: UtilityBill) => r.dueDate },
  { header: "Amount Due £", accessor: (r: UtilityBill) => `£${r.amountDue.toFixed(2)}` },
  { header: "Amount Paid £", accessor: (r: UtilityBill) => `£${r.amountPaid.toFixed(2)}` },
  { header: "Status", accessor: (r: UtilityBill) => r.paymentStatus },
  { header: "YoY", accessor: (r: UtilityBill) => r.comparedToLastYear },
  { header: "Owner", accessor: (r: UtilityBill) => getStaffName(r.responsibleOwner) },
];

export default function UtilityBillsTrackerPage() {
  const { data: result, isLoading } = useUtilityBills("home_oak");
  const data = result?.data ?? [];

  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("due");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterType !== "all") items = items.filter((b) => b.utilityType === filterType);
    if (filterStatus !== "all") items = items.filter((b) => b.paymentStatus === filterStatus);
    items.sort((a, b) => {
      switch (sortBy) {
        case "due":
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case "amount":
          return b.amountDue - a.amountDue;
        case "type":
          return a.utilityType.localeCompare(b.utilityType);
        case "billDate":
          return new Date(b.billDate).getTime() - new Date(a.billDate).getTime();
        default:
          return 0;
      }
    });
    return items;
  }, [filterType, filterStatus, sortBy, data]);

  const today = new Date();
  const in14d = new Date();
  in14d.setDate(today.getDate() + 14);

  const monthlyCost = data
    .filter((b) => ["Mar 2026", "Apr 2026", "Q1 2026", "Q2 2026"].includes(b.billPeriod))
    .reduce((sum, b) => sum + b.amountDue, 0);

  const due14d = data.filter((b) => {
    const due = new Date(b.dueDate);
    return due >= today && due <= in14d && b.paymentStatus !== "Paid";
  }).length;

  const yoyValues = data
    .map((b) => parseFloat(b.comparedToLastYear.replace("%", "")))
    .filter((v) => !isNaN(v));
  const yoyAvg = yoyValues.length
    ? (yoyValues.reduce((s, v) => s + v, 0) / yoyValues.length).toFixed(1)
    : "0";

  const disputedOverdue = data.filter(
    (b) => b.paymentStatus === "Disputed" || b.paymentStatus === "Overdue",
  ).length;

  return (
    <PageShell
      title="Utility Bills Tracker"
      subtitle="Electricity, gas, water, broadband, council tax and business rates — supporting financial governance under Quality Standard 13"
      caraContext={{ pageTitle: "Utility Bills Tracker", sourceType: "document" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="utility-bills-tracker" />
          <PrintButton title="Utility Bills Tracker" />
          <CaraStudioQuickActionButton context={{ record_type: "management_oversight", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {isLoading ? <div className="p-8 text-center text-muted-foreground">Loading...</div> : (<>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">£{monthlyCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          <p className="text-xs text-muted-foreground">Current Period Total</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", due14d > 0 ? "text-amber-600" : "text-green-600")}>{due14d}</p>
          <p className="text-xs text-muted-foreground">Due in 14 Days</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", parseFloat(yoyAvg) < 0 ? "text-green-600" : "text-amber-600")}>{parseFloat(yoyAvg) > 0 ? "+" : ""}{yoyAvg}%</p>
          <p className="text-xs text-muted-foreground">Year-on-Year Avg</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", disputedOverdue > 0 ? "text-red-600" : "text-green-600")}>{disputedOverdue}</p>
          <p className="text-xs text-muted-foreground">Disputed / Overdue</p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6 flex items-start gap-2">
        <Receipt className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          We track every utility bill — energy, water, broadband, council tax, business rates, refuse and TV
          licence — with meter readings, payment status, supplier contracts and year-on-year usage. Energy
          consumption is trending down following insulation upgrades, a new combi boiler and LED replacement.
          ALL FIGURES ARE ILLUSTRATIVE.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Utilities" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Utilities</SelectItem>
            <SelectItem value="Electricity">Electricity</SelectItem>
            <SelectItem value="Gas">Gas</SelectItem>
            <SelectItem value="Water">Water</SelectItem>
            <SelectItem value="Sewerage">Sewerage</SelectItem>
            <SelectItem value="Broadband">Broadband</SelectItem>
            <SelectItem value="Telephone">Telephone</SelectItem>
            <SelectItem value="Council Tax">Council Tax</SelectItem>
            <SelectItem value="Business Rates">Business Rates</SelectItem>
            <SelectItem value="Refuse Collection">Refuse Collection</SelectItem>
            <SelectItem value="TV Licence">TV Licence</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
            <SelectItem value="Disputed">Disputed</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="due">Soonest Due</SelectItem>
              <SelectItem value="billDate">Most Recent</SelectItem>
              <SelectItem value="amount">Highest Amount</SelectItem>
              <SelectItem value="type">By Utility Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((b) => {
          const isExpanded = expandedId === b.id;
          const Icon = utilityIcon[b.utilityType] ?? Receipt;
          const TrendIcon = b.trend === "Up" ? TrendingUp : b.trend === "Down" ? TrendingDown : Minus;
          const trendColour = b.trend === "Up" ? "text-amber-600" : b.trend === "Down" ? "text-green-600" : "text-[var(--cs-text-muted)]";
          const dueSoon = b.paymentStatus !== "Paid" && new Date(b.dueDate) <= in14d;
          const flagged = b.paymentStatus === "Disputed" || b.paymentStatus === "Overdue";

          return (
            <div key={b.id} className={cn("rounded-xl border bg-white overflow-hidden",
              flagged && "border-l-4 border-l-red-500",
              !flagged && dueSoon && "border-l-4 border-l-amber-500"
            )}>
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : b.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Icon className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{b.utilityType} — {b.supplier}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {b.billPeriod} &middot; £{b.amountDue.toFixed(2)} &middot; Due {b.dueDate} &middot; {b.accountNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1", trendColour, "bg-slate-50 border")}>
                    <TrendIcon className="h-3 w-3" />
                    {b.comparedToLastYear}
                  </span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColour[b.paymentStatus])}>{b.paymentStatus}</span>
                  {flagged && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  {!flagged && dueSoon && <Clock className="h-4 w-4 text-amber-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-white rounded-lg p-2 border text-sm">
                      <p className="text-xs text-muted-foreground">Amount Due</p>
                      <p className="font-medium">£{b.amountDue.toFixed(2)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-sm">
                      <p className="text-xs text-muted-foreground">Amount Paid</p>
                      <p className={cn("font-medium", b.amountPaid < b.amountDue && "text-amber-600")}>£{b.amountPaid.toFixed(2)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-sm">
                      <p className="text-xs text-muted-foreground">Bill Date</p>
                      <p className="font-medium">{b.billDate}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-sm">
                      <p className="text-xs text-muted-foreground">Due Date</p>
                      <p className="font-medium">{b.dueDate}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Account & Payment</p>
                      <p className="text-sm">Supplier: {b.supplier}</p>
                      <p className="text-sm">Account: {b.accountNumber}</p>
                      <p className="text-sm">Method: {b.paymentMethod}</p>
                      <p className="text-sm">Period: {b.billPeriod}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Contract</p>
                      <p className="text-sm">Ends: {b.contractEndDate}</p>
                      <p className="text-sm flex items-center gap-1">
                        Switch available:&nbsp;
                        {b.switchAvailable ? (
                          <span className="text-green-700 inline-flex items-center gap-1"><RefreshCw className="h-3 w-3" />Yes</span>
                        ) : (
                          <span className="text-[var(--cs-text-muted)]">No</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {(b.readingPrevious > 0 || b.readingCurrent > 0 || b.unitsUsed > 0) && (
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Meter Readings</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-sm">
                          <p className="text-xs text-muted-foreground">Previous</p>
                          <p className="font-medium">{b.readingPrevious.toLocaleString()}</p>
                        </div>
                        <div className="text-sm">
                          <p className="text-xs text-muted-foreground">Current</p>
                          <p className="font-medium">{b.readingCurrent.toLocaleString()}</p>
                        </div>
                        <div className="text-sm">
                          <p className="text-xs text-muted-foreground">Units Used</p>
                          <p className="font-medium">{b.unitsUsed.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={cn("rounded-lg p-3",
                    b.trend === "Down" ? "bg-green-50" : b.trend === "Up" ? "bg-amber-50" : "bg-slate-50"
                  )}>
                    <p className={cn("text-xs font-semibold uppercase tracking-wide mb-1 flex items-center gap-1",
                      b.trend === "Down" ? "text-green-800" : b.trend === "Up" ? "text-amber-800" : "text-[var(--cs-text-secondary)]"
                    )}>
                      <TrendIcon className="h-3 w-3" />
                      Year-on-Year — {b.comparedToLastYear} ({b.trend})
                    </p>
                    <p className="text-sm">{b.efficiencyNotes}</p>
                  </div>

                  {b.paymentStatus === "Disputed" && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-purple-700 mt-0.5 shrink-0" />
                      <p className="text-sm text-purple-900">
                        Bill is under dispute — short-paid by £{(b.amountDue - b.amountPaid).toFixed(2)}. Query
                        logged with supplier and credit awaited on next bill.
                      </p>
                    </div>
                  )}

                  {b.paymentStatus === "Paid" && b.amountPaid >= b.amountDue && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-700 mt-0.5 shrink-0" />
                      <p className="text-sm text-green-900">Settled in full via {b.paymentMethod}.</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Wallet className="h-3 w-3 inline mr-1" />£{b.amountDue.toFixed(2)} {b.paymentMethod}</span>
                    <span><Clock className="h-3 w-3 inline mr-1" />Due: {b.dueDate}</span>
                    <span>Owner: {getStaffName(b.responsibleOwner)}</span>
                    <span>Reviewed: {getStaffName(b.reviewedBy)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Utility bill tracking supports Quality Standard 13 (financial
          governance) by providing transparent oversight of fixed operating costs, evidence of value-for-money
          decisions, and an auditable trail for the Responsible Individual and Trustees. Year-on-year
          comparison evidences our environmental and efficiency commitments. Account numbers are anonymised
          (last-4 only). ALL FIGURES ARE ILLUSTRATIVE.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Utility Bills Tracker — gas, electricity, water, broadband bills, payment records, budget monitoring, premises running costs, Reg 40 premises compliance evidence"
        recordType="management_oversight"
        className="mt-6"
      />
      </>)}
    </PageShell>
  );
}
