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
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Wallet,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInsurancePolicies } from "@/hooks/use-insurance-policies";
import type { InsurancePolicy, InsurancePolicyStatus } from "@/types/extended";
import { INSURANCE_POLICY_TYPE_LABEL, INSURANCE_POLICY_STATUS_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── colour maps ───────────────────────────────────────────────────────── */

const statusColour: Record<InsurancePolicyStatus, string> = {
  active: "bg-green-100 text-green-800",
  lapsed: "bg-red-100 text-red-800",
  pending_renewal: "bg-amber-100 text-amber-800",
  cancelled: "bg-slate-100 text-slate-800",
  awaiting_documents: "bg-blue-100 text-blue-800",
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function InsuranceTrackerPage() {
  const { data: res, isLoading } = useInsurancePolicies();
  const data: InsurancePolicy[] = res?.data ?? [];
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("renewal");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterType !== "all") items = items.filter((p) => p.policy_type === filterType);
    if (filterStatus !== "all") items = items.filter((p) => p.status === filterStatus);
    items.sort((a, b) => {
      switch (sortBy) {
        case "renewal":
          return a.days_to_renewal - b.days_to_renewal;
        case "premium":
          return b.premium_annual - a.premium_annual;
        case "name":
          return a.policy_name.localeCompare(b.policy_name);
        default:
          return 0;
      }
    });
    return items;
  }, [data, filterType, filterStatus, sortBy]);

  const total = data.length;
  const active = data.filter((p) => p.status === "active").length;
  const totalPremium = data.reduce((sum, p) => sum + p.premium_annual, 0);
  const renewing90 = data.filter((p) => p.days_to_renewal <= 90 && p.days_to_renewal >= 0).length;

  const exportCols: ExportColumn<InsurancePolicy>[] = [
    { header: "Policy", accessor: (r: InsurancePolicy) => r.policy_name },
    { header: "Type", accessor: (r: InsurancePolicy) => INSURANCE_POLICY_TYPE_LABEL[r.policy_type] },
    { header: "Insurer", accessor: (r: InsurancePolicy) => r.insurer },
    { header: "Sum Insured £", accessor: (r: InsurancePolicy) => `£${r.sum_insured.toLocaleString()}` },
    { header: "Premium £", accessor: (r: InsurancePolicy) => `£${r.premium_annual}` },
    { header: "Renewal", accessor: (r: InsurancePolicy) => r.renewal_date },
    { header: "Days to Renewal", accessor: (r: InsurancePolicy) => String(r.days_to_renewal) },
    { header: "Status", accessor: (r: InsurancePolicy) => INSURANCE_POLICY_STATUS_LABEL[r.status] },
  ];

  if (isLoading) return <PageShell title="Insurance Tracker" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Insurance Tracker"
      subtitle="All home insurance policies — renewal dates, sums insured, premiums, and claims history"
      ariaContext={{ pageTitle: "Insurance Tracker", sourceType: "document" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="insurance-tracker" />
          <PrintButton title="Insurance Tracker" />
          <AriaStudioQuickActionButton context={{ record_type: "ofsted_evidence", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Active Policies</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{active}</p>
          <p className="text-xs text-muted-foreground">In Force</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">£{totalPremium.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Annual Premium</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", renewing90 > 0 ? "text-amber-600" : "text-green-600")}>{renewing90}</p>
          <p className="text-xs text-muted-foreground">Renewing 90d</p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6 flex items-start gap-2">
        <Shield className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          Insurance is the financial safety net behind everything we do. We track all policies — public
          liability, employers&apos; liability, buildings, contents, vehicles, cyber, specialist abuse cover —
          with renewal alerts, certificate availability, and claims history. Premiums are illustrative.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(Object.entries(INSURANCE_POLICY_TYPE_LABEL) as [string, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.entries(INSURANCE_POLICY_STATUS_LABEL) as [string, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="renewal">Soonest Renewal</SelectItem>
              <SelectItem value="premium">Highest Premium</SelectItem>
              <SelectItem value="name">By Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((p) => {
          const isExpanded = expandedId === p.id;
          const renewalSoon = p.days_to_renewal <= 60 && p.days_to_renewal >= 0;

          return (
            <div key={p.id} className={cn("rounded-xl border bg-white overflow-hidden",
              renewalSoon && "border-l-4 border-l-amber-500"
            )}>
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : p.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Shield className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.policy_name} — {p.insurer}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Sum insured £{p.sum_insured.toLocaleString()} &middot; Premium £{p.premium_annual} &middot; Renewal {p.renewal_date} ({p.days_to_renewal}d)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColour[p.status])}>{INSURANCE_POLICY_STATUS_LABEL[p.status]}</span>
                  {renewalSoon && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Coverage Summary</p>
                    <p className="text-sm">{p.coverage_summary}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="bg-white rounded-lg p-2 border text-sm">
                      <p className="text-xs text-muted-foreground">Sum Insured</p>
                      <p className="font-medium">£{p.sum_insured.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-sm">
                      <p className="text-xs text-muted-foreground">Excess</p>
                      <p className="font-medium">£{p.excess}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-sm">
                      <p className="text-xs text-muted-foreground">Annual Premium</p>
                      <p className="font-medium">£{p.premium_annual}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Policy Details</p>
                      <p className="text-sm">Policy: {p.policy_number}</p>
                      <p className="text-sm">Broker: {p.broker_or_direct}</p>
                      <p className="text-sm">Period: {p.start_date} to {p.renewal_date}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Documents</p>
                      <p className="text-sm">Certificate: {p.certificate_location}</p>
                      <p className="text-sm">Policy doc: {p.policy_document_location}</p>
                      {p.certificate_displayed_required && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {p.certificate_displayed ? <CheckCircle className="h-3 w-3 inline text-green-500 mr-1" /> : <AlertTriangle className="h-3 w-3 inline text-amber-500 mr-1" />}
                          Display required {p.certificate_displayed ? "— displayed" : "— NOT displayed"}
                        </p>
                      )}
                    </div>
                  </div>

                  {p.recent_claims.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Recent Claims</p>
                      <div className="space-y-1">
                        {p.recent_claims.map((c, i) => (
                          <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                            <p>{c.date} — £{c.amount}</p>
                            <p className="text-xs text-muted-foreground">{c.outcome}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {p.policy_exclusions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Key Exclusions</p>
                      <ul className="space-y-1">
                        {p.policy_exclusions.map((e, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-red-600 mt-0.5">•</span>
                            <span>{e}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-slate-50 rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Review Notes</p>
                    <p className="text-sm">{p.review_notes}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Clock className="h-3 w-3 inline mr-1" />Last reviewed: {p.last_reviewed_date}</span>
                    <span><Wallet className="h-3 w-3 inline mr-1" />£{p.premium_annual}/yr</span>
                    <span><FileText className="h-3 w-3 inline mr-1" />{p.policy_number}</span>
                    <span>Owner: {getStaffName(p.responsible_owner)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Insurance tracking supports Quality Standard 13 (financial
          governance), Employers&apos; Liability (Compulsory Insurance) Act 1969 (statutory minimum and
          display requirements), and corporate parenting financial obligations. Premiums shown are
          illustrative only.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Insurance Tracker — employer liability, building, vehicle, contents, public liability, professional indemnity, renewal dates, certificates, provider contacts, claims"
        recordType="ofsted_evidence"
        className="mt-6"
      />
    </PageShell>
  );
}
