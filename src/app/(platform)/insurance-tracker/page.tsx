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
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Wallet,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InsurancePolicy {
  id: string;
  policyName: string;
  policyType: "Public Liability" | "Employers' Liability" | "Buildings" | "Contents" | "Vehicle Fleet" | "Trustees/Directors" | "Cyber" | "Professional Indemnity" | "Group Personal Accident" | "Specialist (e.g. abuse)";
  insurer: string;
  brokerOrDirect: string;
  policyNumber: string;
  coverageSummary: string;
  sumInsured: number;
  excess: number;
  premiumAnnual: number;
  startDate: string;
  renewalDate: string;
  daysToRenewal: number;
  autoRenewal: boolean;
  certificateLocation: string;
  policyDocumentLocation: string;
  certificateDisplayedRequired: boolean;
  certificateDisplayed: boolean;
  responsibleOwner: string;
  recentClaims: { date: string; amount: number; outcome: string }[];
  lastReviewedDate: string;
  reviewNotes: string;
  policyExclusions: string[];
  status: "Active" | "Lapsed" | "Pending renewal" | "Cancelled" | "Awaiting documents";
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: InsurancePolicy[] = [
  {
    id: "ins-001",
    policyName: "Public Liability Insurance",
    policyType: "Public Liability",
    insurer: "Markel International",
    brokerOrDirect: "Care Sector Brokers Ltd",
    policyNumber: "MKL-PL-2024-XXX",
    coverageSummary: "Up to £10m public liability cover for incidents involving children or visitors at the home or in care.",
    sumInsured: 10000000,
    excess: 1000,
    premiumAnnual: 4800,
    startDate: "2024-04-01",
    renewalDate: "2026-04-01",
    daysToRenewal: 100,
    autoRenewal: false,
    certificateLocation: "Office locked file + displayed in entrance hallway",
    policyDocumentLocation: "Office filing cabinet + cloud copy",
    certificateDisplayedRequired: true,
    certificateDisplayed: true,
    responsibleOwner: "staff_darren",
    recentClaims: [],
    lastReviewedDate: d(-30),
    reviewNotes: "No claims this policy year. Continued cover at standard rate.",
    policyExclusions: ["Deliberate acts", "Driving (covered by vehicle policy)"],
    status: "Active",
  },
  {
    id: "ins-002",
    policyName: "Employers' Liability Insurance",
    policyType: "Employers' Liability",
    insurer: "Markel International",
    brokerOrDirect: "Care Sector Brokers Ltd",
    policyNumber: "MKL-EL-2024-XXX",
    coverageSummary: "Up to £10m employers' liability cover (statutory minimum £5m).",
    sumInsured: 10000000,
    excess: 0,
    premiumAnnual: 1200,
    startDate: "2024-04-01",
    renewalDate: "2026-04-01",
    daysToRenewal: 100,
    autoRenewal: false,
    certificateLocation: "Office + displayed in staff area",
    policyDocumentLocation: "Office filing cabinet + cloud copy",
    certificateDisplayedRequired: true,
    certificateDisplayed: true,
    responsibleOwner: "staff_darren",
    recentClaims: [],
    lastReviewedDate: d(-30),
    reviewNotes: "Statutory cover. Displayed visibly per Employers' Liability (Compulsory Insurance) Act 1969.",
    policyExclusions: [],
    status: "Active",
  },
  {
    id: "ins-003",
    policyName: "Buildings Insurance",
    policyType: "Buildings",
    insurer: "AXA Commercial",
    brokerOrDirect: "Care Sector Brokers Ltd",
    policyNumber: "AXA-BLD-2024-XXX",
    coverageSummary: "Reinstatement value cover for the home property; excludes contents (separate policy).",
    sumInsured: 850000,
    excess: 500,
    premiumAnnual: 2400,
    startDate: "2024-04-01",
    renewalDate: "2026-04-01",
    daysToRenewal: 100,
    autoRenewal: false,
    certificateLocation: "Office locked file",
    policyDocumentLocation: "Office filing cabinet + cloud copy",
    certificateDisplayedRequired: false,
    certificateDisplayed: false,
    responsibleOwner: "staff_darren",
    recentClaims: [
      { date: "2024-11-12", amount: 1500, outcome: "Roof tile damage from storm — claim paid; minor excess" },
    ],
    lastReviewedDate: d(-30),
    reviewNotes: "Storm claim handled smoothly. Sum insured re-valued at last review.",
    policyExclusions: ["Wear and tear", "Subsidence (sub-policy applies)"],
    status: "Active",
  },
  {
    id: "ins-004",
    policyName: "Contents Insurance",
    policyType: "Contents",
    insurer: "AXA Commercial",
    brokerOrDirect: "Care Sector Brokers Ltd",
    policyNumber: "AXA-CON-2024-XXX",
    coverageSummary: "Furniture, electrical equipment, communal possessions, and children's personal belongings up to declared limit per child.",
    sumInsured: 75000,
    excess: 250,
    premiumAnnual: 800,
    startDate: "2024-04-01",
    renewalDate: "2026-04-01",
    daysToRenewal: 100,
    autoRenewal: false,
    certificateLocation: "Office locked file",
    policyDocumentLocation: "Office filing cabinet + cloud copy",
    certificateDisplayedRequired: false,
    certificateDisplayed: false,
    responsibleOwner: "staff_darren",
    recentClaims: [],
    lastReviewedDate: d(-30),
    reviewNotes: "Inventory updated annually. Children's personal items declared up to £500 per child.",
    policyExclusions: ["Personal belongings of staff (own house insurance applies)"],
    status: "Active",
  },
  {
    id: "ins-005",
    policyName: "Vehicle Fleet Insurance",
    policyType: "Vehicle Fleet",
    insurer: "NIG (National Insurance Group)",
    brokerOrDirect: "Care Sector Brokers Ltd",
    policyNumber: "NIG-FLT-2024-XXX",
    coverageSummary: "Comprehensive fleet cover for 3 vehicles (VW Caddy, Ford Tourneo, Vauxhall Vivaro) with named drivers (full staff team) and any-driver clause for emergency cover.",
    sumInsured: 0,
    excess: 350,
    premiumAnnual: 5400,
    startDate: "2024-09-01",
    renewalDate: "2026-09-01",
    daysToRenewal: 240,
    autoRenewal: false,
    certificateLocation: "Each vehicle has copy in glove box + office master",
    policyDocumentLocation: "Office + cloud copy",
    certificateDisplayedRequired: false,
    certificateDisplayed: false,
    responsibleOwner: "staff_ryan",
    recentClaims: [
      { date: "2025-02-08", amount: 800, outcome: "Minor wing-mirror damage in car park — claim paid" },
    ],
    lastReviewedDate: d(-60),
    reviewNotes: "Driver list reviewed at each onboarding. New drivers added within 7 days.",
    policyExclusions: ["Drivers under 25 with less than 2 years experience"],
    status: "Active",
  },
  {
    id: "ins-006",
    policyName: "Cyber & Data Insurance",
    policyType: "Cyber",
    insurer: "Beazley",
    brokerOrDirect: "Care Sector Brokers Ltd",
    policyNumber: "BZL-CYB-2024-XXX",
    coverageSummary: "Cyber attack response, data breach costs (legal, ICO, notification), business interruption from cyber events.",
    sumInsured: 1000000,
    excess: 5000,
    premiumAnnual: 1800,
    startDate: "2024-04-01",
    renewalDate: "2026-04-01",
    daysToRenewal: 100,
    autoRenewal: false,
    certificateLocation: "Office",
    policyDocumentLocation: "Office + cloud copy",
    certificateDisplayedRequired: false,
    certificateDisplayed: false,
    responsibleOwner: "staff_darren",
    recentClaims: [],
    lastReviewedDate: d(-30),
    reviewNotes: "No claims. Data Breach Log near-misses caught well — preventive culture mature.",
    policyExclusions: ["Pre-existing system vulnerabilities not addressed"],
    status: "Active",
  },
  {
    id: "ins-007",
    policyName: "Professional Indemnity & Specialist (Abuse) Insurance",
    policyType: "Specialist (e.g. abuse)",
    insurer: "Royal Sun Alliance (RSA)",
    brokerOrDirect: "Care Sector Brokers Ltd",
    policyNumber: "RSA-SPEC-2024-XXX",
    coverageSummary: "Specialist cover for allegations of abuse or professional misconduct against the home or staff. Includes legal defence costs.",
    sumInsured: 5000000,
    excess: 5000,
    premiumAnnual: 6000,
    startDate: "2024-04-01",
    renewalDate: "2026-04-01",
    daysToRenewal: 100,
    autoRenewal: false,
    certificateLocation: "Office locked file (sensitive)",
    policyDocumentLocation: "Office filing cabinet (sensitive)",
    certificateDisplayedRequired: false,
    certificateDisplayed: false,
    responsibleOwner: "staff_darren",
    recentClaims: [],
    lastReviewedDate: d(-30),
    reviewNotes: "Sensitive policy. Held separately. Review annually with broker on emerging sector risks.",
    policyExclusions: ["Deliberate criminal acts (covered separately by individual liability if applicable)"],
    status: "Active",
  },
  {
    id: "ins-008",
    policyName: "Group Personal Accident",
    policyType: "Group Personal Accident",
    insurer: "Aviva",
    brokerOrDirect: "Care Sector Brokers Ltd",
    policyNumber: "AVA-GPA-2024-XXX",
    coverageSummary: "Personal accident cover for staff while at work or commuting. Lump-sum benefits for serious injury.",
    sumInsured: 100000,
    excess: 0,
    premiumAnnual: 1100,
    startDate: "2024-04-01",
    renewalDate: "2026-04-01",
    daysToRenewal: 100,
    autoRenewal: false,
    certificateLocation: "Office",
    policyDocumentLocation: "Office + cloud copy",
    certificateDisplayedRequired: false,
    certificateDisplayed: false,
    responsibleOwner: "staff_darren",
    recentClaims: [],
    lastReviewedDate: d(-30),
    reviewNotes: "Staff team updated on policy as part of induction.",
    policyExclusions: ["Pre-existing conditions"],
    status: "Active",
  },
];

const statusColour: Record<string, string> = {
  Active: "bg-green-100 text-green-800",
  Lapsed: "bg-red-100 text-red-800",
  "Pending renewal": "bg-amber-100 text-amber-800",
  Cancelled: "bg-slate-100 text-slate-800",
  "Awaiting documents": "bg-blue-100 text-blue-800",
};

const exportCols: ExportColumn<InsurancePolicy>[] = [
  { header: "Policy", accessor: (r: InsurancePolicy) => r.policyName },
  { header: "Type", accessor: (r: InsurancePolicy) => r.policyType },
  { header: "Insurer", accessor: (r: InsurancePolicy) => r.insurer },
  { header: "Sum Insured £", accessor: (r: InsurancePolicy) => `£${r.sumInsured.toLocaleString()}` },
  { header: "Premium £", accessor: (r: InsurancePolicy) => `£${r.premiumAnnual}` },
  { header: "Renewal", accessor: (r: InsurancePolicy) => r.renewalDate },
  { header: "Days to Renewal", accessor: (r: InsurancePolicy) => String(r.daysToRenewal) },
  { header: "Status", accessor: (r: InsurancePolicy) => r.status },
];

export default function InsuranceTrackerPage() {
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("renewal");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterType !== "all") items = items.filter((p) => p.policyType === filterType);
    if (filterStatus !== "all") items = items.filter((p) => p.status === filterStatus);
    items.sort((a, b) => {
      switch (sortBy) {
        case "renewal":
          return a.daysToRenewal - b.daysToRenewal;
        case "premium":
          return b.premiumAnnual - a.premiumAnnual;
        case "name":
          return a.policyName.localeCompare(b.policyName);
        default:
          return 0;
      }
    });
    return items;
  }, [filterType, filterStatus, sortBy]);

  const total = data.length;
  const active = data.filter((p) => p.status === "Active").length;
  const totalPremium = data.reduce((sum, p) => sum + p.premiumAnnual, 0);
  const renewing90 = data.filter((p) => p.daysToRenewal <= 90 && p.daysToRenewal >= 0).length;

  return (
    <PageShell
      title="Insurance Tracker"
      subtitle="All home insurance policies — renewal dates, sums insured, premiums, and claims history"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="insurance-tracker" />
          <PrintButton title="Insurance Tracker" />
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
            <SelectItem value="Public Liability">Public Liability</SelectItem>
            <SelectItem value="Employers' Liability">Employers&apos; Liability</SelectItem>
            <SelectItem value="Buildings">Buildings</SelectItem>
            <SelectItem value="Contents">Contents</SelectItem>
            <SelectItem value="Vehicle Fleet">Vehicle Fleet</SelectItem>
            <SelectItem value="Cyber">Cyber</SelectItem>
            <SelectItem value="Specialist (e.g. abuse)">Specialist</SelectItem>
            <SelectItem value="Group Personal Accident">Personal Accident</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Pending renewal">Pending Renewal</SelectItem>
            <SelectItem value="Awaiting documents">Awaiting Documents</SelectItem>
            <SelectItem value="Lapsed">Lapsed</SelectItem>
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
          const renewalSoon = p.daysToRenewal <= 60 && p.daysToRenewal >= 0;

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
                    <p className="font-medium truncate">{p.policyName} — {p.insurer}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Sum insured £{p.sumInsured.toLocaleString()} &middot; Premium £{p.premiumAnnual} &middot; Renewal {p.renewalDate} ({p.daysToRenewal}d)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColour[p.status])}>{p.status}</span>
                  {renewalSoon && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Coverage Summary</p>
                    <p className="text-sm">{p.coverageSummary}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="bg-white rounded-lg p-2 border text-sm">
                      <p className="text-xs text-muted-foreground">Sum Insured</p>
                      <p className="font-medium">£{p.sumInsured.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-sm">
                      <p className="text-xs text-muted-foreground">Excess</p>
                      <p className="font-medium">£{p.excess}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-sm">
                      <p className="text-xs text-muted-foreground">Annual Premium</p>
                      <p className="font-medium">£{p.premiumAnnual}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Policy Details</p>
                      <p className="text-sm">Policy: {p.policyNumber}</p>
                      <p className="text-sm">Broker: {p.brokerOrDirect}</p>
                      <p className="text-sm">Period: {p.startDate} to {p.renewalDate}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Documents</p>
                      <p className="text-sm">Certificate: {p.certificateLocation}</p>
                      <p className="text-sm">Policy doc: {p.policyDocumentLocation}</p>
                      {p.certificateDisplayedRequired && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {p.certificateDisplayed ? <CheckCircle className="h-3 w-3 inline text-green-500 mr-1" /> : <AlertTriangle className="h-3 w-3 inline text-amber-500 mr-1" />}
                          Display required {p.certificateDisplayed ? "— displayed" : "— NOT displayed"}
                        </p>
                      )}
                    </div>
                  </div>

                  {p.recentClaims.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Recent Claims</p>
                      <div className="space-y-1">
                        {p.recentClaims.map((c, i) => (
                          <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                            <p>{c.date} — £{c.amount}</p>
                            <p className="text-xs text-muted-foreground">{c.outcome}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {p.policyExclusions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Key Exclusions</p>
                      <ul className="space-y-1">
                        {p.policyExclusions.map((e, i) => (
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
                    <p className="text-sm">{p.reviewNotes}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Clock className="h-3 w-3 inline mr-1" />Last reviewed: {p.lastReviewedDate}</span>
                    <span><Wallet className="h-3 w-3 inline mr-1" />£{p.premiumAnnual}/yr</span>
                    <span><FileText className="h-3 w-3 inline mr-1" />{p.policyNumber}</span>
                    <span>Owner: {getStaffName(p.responsibleOwner)}</span>
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
    </PageShell>
  );
}
