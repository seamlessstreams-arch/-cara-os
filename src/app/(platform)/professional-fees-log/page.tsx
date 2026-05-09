"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Receipt,
  CheckCircle,
  Clock,
  Wallet,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfessionalFeeRecords } from "@/hooks/use-professional-fee-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type {
  ProfessionalFeeRecord,
  PractitionerType,
  FeeStatus,
  FundingSource,
  FeePaymentMethod,
} from "@/types/extended";
import {
  PRACTITIONER_TYPE_LABEL,
  FEE_STATUS_LABEL,
  FUNDING_SOURCE_LABEL,
  FEE_PAYMENT_METHOD_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const STATUS_COLOUR: Record<FeeStatus, string> = {
  pending_approval: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  disputed: "bg-red-100 text-red-800",
  refunded: "bg-purple-100 text-purple-800",
};

export default function ProfessionalFeesLogPage() {
  const { data: records = [], isLoading } = useProfessionalFeeRecords();
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...records];
    if (filterType !== "all") items = items.filter((r) => r.practitioner_type === filterType);
    if (filterStatus !== "all") items = items.filter((r) => r.status === filterStatus);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.invoice_date.localeCompare(a.invoice_date);
        case "amount":
          return b.amount_gross - a.amount_gross;
        case "type":
          return a.practitioner_type.localeCompare(b.practitioner_type);
        default:
          return 0;
      }
    });
    return items;
  }, [records, filterType, filterStatus, sortBy]);

  const total = records.length;
  const totalSpend = records.reduce((sum, r) => sum + r.amount_gross, 0);
  const pending = records.filter((r) => r.status === "pending_approval").length;
  const paid = records.filter((r) => r.status === "paid").length;

  const exportCols: ExportColumn<ProfessionalFeeRecord>[] = [
    { header: "Practitioner", accessor: (r) => r.practitioner },
    { header: "Organisation", accessor: (r) => r.organisation },
    { header: "Type", accessor: (r) => PRACTITIONER_TYPE_LABEL[r.practitioner_type] },
    { header: "For", accessor: (r) => r.fee_for },
    { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
    { header: "Invoice Date", accessor: (r) => r.invoice_date },
    { header: "Period", accessor: (r) => r.invoice_period },
    { header: "Net £", accessor: (r) => `£${r.amount_net.toFixed(2)}` },
    { header: "VAT £", accessor: (r) => `£${r.vat.toFixed(2)}` },
    { header: "Gross £", accessor: (r) => `£${r.amount_gross.toFixed(2)}` },
    { header: "Funding", accessor: (r) => FUNDING_SOURCE_LABEL[r.funding_source] },
    { header: "Status", accessor: (r) => FEE_STATUS_LABEL[r.status] },
  ];

  if (isLoading) {
    return (
      <PageShell title="Professional Fees Log" subtitle="Records of payments to external practitioners — therapists, advocates, coaches, tutors, mentors">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Professional Fees Log"
      subtitle="Records of payments to external practitioners — therapists, advocates, coaches, tutors, mentors"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="professional-fees-log" />
          <PrintButton title="Professional Fees Log" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Active Engagements</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">£{totalSpend.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">Total Recorded</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{paid}/{total}</p>
          <p className="text-xs text-muted-foreground">Paid</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", pending > 0 ? "text-amber-600" : "text-green-600")}>{pending}</p>
          <p className="text-xs text-muted-foreground">Pending Approval</p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6 flex items-start gap-2">
        <Receipt className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          We invest in external practitioners — therapists, advocates, coaches — because outcomes for children
          are best when supported by a network of expertise. Every fee is auditable, outcomes-evidenced, and
          reviewed for value to the children we look after.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(Object.entries(PRACTITIONER_TYPE_LABEL) as [PractitionerType, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.entries(FEE_STATUS_LABEL) as [FeeStatus, string][]).map(([k, v]) => (
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
              <SelectItem value="amount">Highest Amount</SelectItem>
              <SelectItem value="type">By Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isExpanded = expandedId === r.id;

          return (
            <div key={r.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Receipt className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.practitioner} ({r.organisation})</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {PRACTITIONER_TYPE_LABEL[r.practitioner_type]} &middot; {r.fee_for.slice(0, 60)} &middot; {r.invoice_period} &middot; {getYPName(r.child_id)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-sm font-bold">£{r.amount_gross.toFixed(0)}</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLOUR[r.status])}>{FEE_STATUS_LABEL[r.status]}</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Engagement</p>
                      <p className="text-sm">{r.fee_for}</p>
                      <p className="text-xs text-muted-foreground mt-1">Contract: {r.contract_ref}</p>
                      <p className="text-xs text-muted-foreground">{r.recurring_contract ? `Recurring contract until ${r.contract_end_date}` : "Single engagement"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Financial</p>
                      <p className="text-sm">Net: £{r.amount_net.toFixed(2)}</p>
                      {r.vat > 0 && <p className="text-sm">VAT: £{r.vat.toFixed(2)}</p>}
                      <p className="text-sm font-bold">Gross: £{r.amount_gross.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{r.hours_delivered}h @ £{r.hourly_rate}/h</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                      <Wallet className="h-3 w-3 inline mr-1" />Funding
                    </p>
                    <p className="text-sm">Source: <strong>{FUNDING_SOURCE_LABEL[r.funding_source]}</strong></p>
                    {r.funding_approved ? (
                      <p className="text-xs text-blue-700 mt-1">
                        <CheckCircle className="h-3 w-3 inline mr-1" />Approved by {getStaffName(r.approved_by)}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-700 mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />Approval pending
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Outcomes Evidenced</p>
                    <ul className="space-y-1">
                      {r.outcomes_evidenced.map((o, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {r.review_notes && (
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Performance Review</p>
                      <p className="text-sm">{r.review_notes}</p>
                      {r.reviewed_by && <p className="text-xs text-emerald-700 mt-1">By: {getStaffName(r.reviewed_by)}</p>}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Receipt className="h-3 w-3 inline mr-1" />Invoice: {r.invoice_date}</span>
                    {r.payment_date && <span>Paid: {r.payment_date} ({FEE_PAYMENT_METHOD_LABEL[r.payment_method]})</span>}
                    <span>Performance review: {r.performance_review_date}</span>
                    {r.contract_end_date && <span>Contract ends: {r.contract_end_date}</span>}
                  </div>

                  {r.status === "disputed" && (
                    <div className="bg-red-50 rounded-lg p-3 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-sm">Invoice in dispute — see notes for details.</p>
                    </div>
                  )}

                  <SmartLinkPanel sourceType="professional_fee_record" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Professional fees records support Quality Standard 13
          (leadership and management — financial governance), Reg 22 (records), and corporate finance
          obligations. Every engagement is performance-reviewed against outcomes for children. Linked to
          Therapeutic Input, Advocacy, and external practitioner contracts.
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
