"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Flame,
  Zap,
  Shield,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  AlertTriangle,
  CheckCircle,
  Calendar,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SafetyCheck {
  id: string;
  category:
    | "Annual gas safety (CP12)"
    | "Boiler service"
    | "EICR (5-yearly)"
    | "PAT testing (annual)"
    | "Smoke alarm test"
    | "CO detector test"
    | "Emergency lighting"
    | "RCD test"
    | "Solar / inverter inspection"
    | "Fixed wire inspection";
  scopeArea: "Whole property" | "Boiler/heating" | "Kitchen" | "Bedrooms" | "Communal" | "External" | "Specific appliance";
  specificItem?: string;
  contractor: string;
  contractorAccreditation: string;
  certificateNumber?: string;
  inspectionDate: string;
  expiryDate: string;
  outcome: "Pass" | "Pass with advisories" | "Remedial works required" | "Failed — urgent action";
  advisories: string[];
  remedialWorks: { description: string; deadline: string; status: "Open" | "Booked" | "Completed" }[];
  costPaid?: number;
  certificateLocation: string;
  notifiedToRegulator?: string;
  recordedBy: string;
  flagsConcerns: string[];
  notes?: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const records: SafetyCheck[] = [
  {
    id: "ges_001",
    category: "Annual gas safety (CP12)",
    scopeArea: "Whole property",
    contractor: "T. Murray Plumbing & Heating Ltd",
    contractorAccreditation: "Gas Safe Register: 519284",
    certificateNumber: "CP12-2026-04471",
    inspectionDate: d(-25),
    expiryDate: d(340),
    outcome: "Pass",
    advisories: [
      "Boiler 11 years old — schedule replacement consideration in 2027 budget",
      "Recommend annual servicing in same month each year for continuity",
    ],
    remedialWorks: [],
    costPaid: 145,
    certificateLocation: "Operations folder + scanned copy /buildings/gas/2026/CP12.pdf",
    recordedBy: "staff_darren",
    flagsConcerns: [],
    notes: "All gas appliances safe. CO levels 0ppm at all test points.",
  },
  {
    id: "ges_002",
    category: "EICR (5-yearly)",
    scopeArea: "Whole property",
    contractor: "Bright Spark Electrical Ltd",
    contractorAccreditation: "NICEIC Approved Contractor: 31987",
    certificateNumber: "EICR-2024-AB1102",
    inspectionDate: d(-450),
    expiryDate: d(1380),
    outcome: "Pass with advisories",
    advisories: [
      "Garage extension consumer unit older type — no immediate action, replace at next major works",
      "External outdoor sockets need RCD upgrade at next servicing",
    ],
    remedialWorks: [
      { description: "Replace 2x bedroom socket faceplates with cracked sockets", deadline: d(-380), status: "Completed" },
      { description: "Add RCD on external sockets", deadline: d(60), status: "Booked" },
    ],
    costPaid: 380,
    certificateLocation: "Operations folder + scanned copy /buildings/electrical/2024/EICR.pdf",
    recordedBy: "staff_darren",
    flagsConcerns: ["RCD upgrade booked — schedule a follow-up reminder for completion confirmation"],
  },
  {
    id: "ges_003",
    category: "PAT testing (annual)",
    scopeArea: "Whole property",
    contractor: "PAT Pro Services",
    contractorAccreditation: "City & Guilds 2377-22 PAT competent",
    certificateNumber: "PAT-2026-Q1-CSH",
    inspectionDate: d(-12),
    expiryDate: d(353),
    outcome: "Pass with advisories",
    advisories: [
      "1 kettle (kitchen) failed test — disposed of and replaced",
      "1 desk lamp (Casey's bedroom) frayed cable — disposed of, Casey chose new lamp",
    ],
    remedialWorks: [],
    costPaid: 95,
    certificateLocation: "Operations folder + register of PAT-stickered items",
    recordedBy: "staff_darren",
    flagsConcerns: [],
    notes: "47 portable appliances tested. 2 disposed. Stickered register updated.",
  },
  {
    id: "ges_004",
    category: "Smoke alarm test",
    scopeArea: "Whole property",
    contractor: "In-house weekly test (push-button)",
    contractorAccreditation: "Reg 25 / Manager-led",
    inspectionDate: d(-3),
    expiryDate: d(4),
    outcome: "Pass",
    advisories: [],
    remedialWorks: [],
    certificateLocation: "Fire log book — weekly entry",
    recordedBy: "staff_anna",
    flagsConcerns: [],
    notes: "All 9 smoke alarms tested — all sounded. Logged in fire log book.",
  },
  {
    id: "ges_005",
    category: "CO detector test",
    scopeArea: "Boiler/heating",
    specificItem: "Kitchen + utility CO detector",
    contractor: "In-house weekly test",
    contractorAccreditation: "Reg 25 / Manager-led",
    inspectionDate: d(-3),
    expiryDate: d(4),
    outcome: "Pass",
    advisories: [],
    remedialWorks: [],
    certificateLocation: "Fire log book — weekly entry",
    recordedBy: "staff_anna",
    flagsConcerns: [],
    notes: "Both CO detectors tested. Battery replaced on utility detector.",
  },
  {
    id: "ges_006",
    category: "Boiler service",
    scopeArea: "Boiler/heating",
    contractor: "T. Murray Plumbing & Heating Ltd",
    contractorAccreditation: "Gas Safe Register: 519284",
    certificateNumber: "BSV-2026-04471",
    inspectionDate: d(-25),
    expiryDate: d(340),
    outcome: "Pass",
    advisories: [
      "Boiler in good order — service documented",
      "Recommend power flush in next 2-3 years",
    ],
    remedialWorks: [],
    costPaid: 95,
    certificateLocation: "Operations folder",
    recordedBy: "staff_darren",
    flagsConcerns: [],
    notes: "Combi boiler serviced concurrently with CP12.",
  },
  {
    id: "ges_007",
    category: "Emergency lighting",
    scopeArea: "Whole property",
    contractor: "Bright Spark Electrical Ltd",
    contractorAccreditation: "NICEIC + BS 5266",
    certificateNumber: "EM-2026-1101",
    inspectionDate: d(-90),
    expiryDate: d(275),
    outcome: "Pass",
    advisories: [
      "All emergency lights operational — full 3-hour discharge tested",
    ],
    remedialWorks: [],
    costPaid: 120,
    certificateLocation: "Fire log + Operations folder",
    recordedBy: "staff_darren",
    flagsConcerns: [],
  },
];

const exportCols: ExportColumn<SafetyCheck>[] = [
  { header: "Category", accessor: (r: SafetyCheck) => r.category },
  { header: "Scope", accessor: (r: SafetyCheck) => r.scopeArea },
  { header: "Specific Item", accessor: (r: SafetyCheck) => r.specificItem ?? "—" },
  { header: "Contractor", accessor: (r: SafetyCheck) => r.contractor },
  { header: "Accreditation", accessor: (r: SafetyCheck) => r.contractorAccreditation },
  { header: "Certificate Number", accessor: (r: SafetyCheck) => r.certificateNumber ?? "—" },
  { header: "Inspection Date", accessor: (r: SafetyCheck) => r.inspectionDate },
  { header: "Expiry Date", accessor: (r: SafetyCheck) => r.expiryDate },
  { header: "Outcome", accessor: (r: SafetyCheck) => r.outcome },
  { header: "Advisories", accessor: (r: SafetyCheck) => r.advisories.join("; ") },
  { header: "Remedial Open", accessor: (r: SafetyCheck) => r.remedialWorks.filter((w) => w.status !== "Completed").map((w) => w.description).join("; ") },
  { header: "Cost", accessor: (r: SafetyCheck) => (r.costPaid !== undefined ? `£${r.costPaid.toFixed(2)}` : "—") },
  { header: "Certificate Location", accessor: (r: SafetyCheck) => r.certificateLocation },
  { header: "Recorded By", accessor: (r: SafetyCheck) => getStaffName(r.recordedBy) },
];

const outcomeColour: Record<SafetyCheck["outcome"], string> = {
  Pass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Pass with advisories": "bg-blue-100 text-blue-800 border-blue-200",
  "Remedial works required": "bg-amber-100 text-amber-800 border-amber-200",
  "Failed — urgent action": "bg-red-100 text-red-800 border-red-200",
};

export default function GasElectricalSafetyChecksPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "expiry" | "category" | "outcome">("expiry");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        rec.category.toLowerCase().includes(search.toLowerCase()) ||
        rec.contractor.toLowerCase().includes(search.toLowerCase());
      const matchesCat = categoryFilter === "all" || rec.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "date") return b.inspectionDate.localeCompare(a.inspectionDate);
      if (sortBy === "category") return a.category.localeCompare(b.category);
      if (sortBy === "outcome") return a.outcome.localeCompare(b.outcome);
      return a.expiryDate.localeCompare(b.expiryDate);
    });
    return r;
  }, [search, categoryFilter, sortBy]);

  const stats = useMemo(() => {
    const expiringSoon = records.filter((r) => r.expiryDate <= d(60)).length;
    const remedialOpen = records.reduce((acc, r) => acc + r.remedialWorks.filter((w) => w.status !== "Completed").length, 0);
    const passingPct = Math.round((records.filter((r) => r.outcome === "Pass" || r.outcome === "Pass with advisories").length / records.length) * 100);
    const totalCost = records.reduce((acc, r) => acc + (r.costPaid ?? 0), 0);
    return { expiringSoon, remedialOpen, passingPct, totalCost };
  }, []);

  return (
    <PageShell
      title="Gas & Electrical Safety Checks"
      subtitle="Statutory and routine building safety checks — annual gas safety (CP12), boiler service, EICR (5-yearly), PAT testing, weekly smoke and CO alarm tests, emergency lighting. Reg 25 (premises and grounds) compliance evidenced."
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="gas-electrical-safety-checks" />
          <PrintButton title="Gas & Electrical Safety Checks" />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Calendar className="h-4 w-4" />
            <span>Expiring (60d)</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.expiringSoon}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <AlertTriangle className="h-4 w-4" />
            <span>Open remedials</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.remedialOpen}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <CheckCircle className="h-4 w-4" />
            <span>Pass rate</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.passingPct}%</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Shield className="h-4 w-4" />
            <span>Annual cost</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">£{stats.totalCost.toFixed(0)}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search category or contractor..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="Annual gas safety (CP12)">Gas safety (CP12)</SelectItem>
            <SelectItem value="Boiler service">Boiler service</SelectItem>
            <SelectItem value="EICR (5-yearly)">EICR</SelectItem>
            <SelectItem value="PAT testing (annual)">PAT testing</SelectItem>
            <SelectItem value="Smoke alarm test">Smoke alarm test</SelectItem>
            <SelectItem value="CO detector test">CO detector test</SelectItem>
            <SelectItem value="Emergency lighting">Emergency lighting</SelectItem>
            <SelectItem value="RCD test">RCD test</SelectItem>
            <SelectItem value="Solar / inverter inspection">Solar / inverter</SelectItem>
            <SelectItem value="Fixed wire inspection">Fixed wire inspection</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-48">
            <ArrowUpDown className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expiry">Expiry soonest</SelectItem>
            <SelectItem value="date">Most recent</SelectItem>
            <SelectItem value="category">Category</SelectItem>
            <SelectItem value="outcome">Outcome</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isOpen = expandedId === r.id;
          const expiringSoon = r.expiryDate <= d(60) && r.expiryDate >= d(0);
          const expired = r.expiryDate < d(0);
          return (
            <div key={r.id} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : r.id)}
                className="w-full p-4 flex items-start justify-between gap-3 hover:bg-slate-50 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {r.category.startsWith("Annual gas") || r.category === "Boiler service" ? (
                      <Flame className="h-4 w-4 text-orange-500" />
                    ) : (
                      <Zap className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className="font-semibold text-slate-900">{r.category}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", outcomeColour[r.outcome])}>
                      {r.outcome}
                    </span>
                    {expired ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-red-100 text-red-800 border-red-200">
                        Expired
                      </span>
                    ) : expiringSoon ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-100 text-amber-800 border-amber-200">
                        Expiring in {Math.ceil((new Date(r.expiryDate).getTime() - Date.now()) / 86400000)}d
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-slate-600">
                    Inspected {r.inspectionDate} · expires {r.expiryDate} · {r.contractor}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Inspection</div>
                      <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                        <div><span className="text-slate-500">Scope:</span> {r.scopeArea}</div>
                        {r.specificItem ? <div><span className="text-slate-500">Item:</span> {r.specificItem}</div> : null}
                        <div><span className="text-slate-500">Contractor:</span> {r.contractor}</div>
                        <div><span className="text-slate-500">Accreditation:</span> {r.contractorAccreditation}</div>
                        {r.certificateNumber ? <div><span className="text-slate-500">Certificate:</span> {r.certificateNumber}</div> : null}
                        {r.costPaid !== undefined ? <div><span className="text-slate-500">Cost:</span> £{r.costPaid.toFixed(2)}</div> : null}
                        <div className="col-span-2"><span className="text-slate-500">Certificate kept:</span> {r.certificateLocation}</div>
                      </div>
                    </div>
                    {r.advisories.length ? (
                      <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                        <div className="text-xs font-semibold text-blue-800 uppercase mb-2">Advisories</div>
                        <ul className="text-sm text-blue-900 space-y-1">
                          {r.advisories.map((a, i) => (
                            <li key={i} className="flex gap-2"><span>·</span><span>{a}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {r.remedialWorks.length ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2">Remedial works</div>
                        <ul className="text-sm text-amber-900 space-y-1.5">
                          {r.remedialWorks.map((w, i) => (
                            <li key={i} className="flex justify-between gap-2">
                              <span className="flex-1">{w.description}</span>
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full border shrink-0",
                                w.status === "Completed" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : w.status === "Booked" ? "bg-sky-100 text-sky-800 border-sky-200" : "bg-amber-100 text-amber-800 border-amber-200"
                              )}>
                                {w.status} · {w.deadline}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {r.notes ? (
                      <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Notes</div>
                        <p className="text-sm text-slate-700">{r.notes}</p>
                      </div>
                    ) : null}
                    {r.flagsConcerns.length ? (
                      <div className="rounded-md border border-red-200 bg-red-50 p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-red-800 uppercase mb-2">Flags / concerns</div>
                        <ul className="text-sm text-red-900 space-y-1">
                          {r.flagsConcerns.map((f, i) => (
                            <li key={i} className="flex gap-2"><span>!</span><span>{f}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2 text-xs text-slate-500">
                      Recorded by {getStaffName(r.recordedBy)}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="font-semibold mb-1">Regulatory framework</div>
        <p>
          Gas Safety (Installation and Use) Regulations 1998 (annual CP12 by Gas Safe registered engineer);
          Electrical Safety Standards in the Private Rented Sector (England) Regulations 2020 (EICR every 5 years);
          IET Code of Practice for In-Service Inspection (PAT); BS 5266 emergency lighting; BS 5839 fire alarms;
          Children&rsquo;s Homes (England) Regulations 2015 Reg 25 (premises and grounds), Reg 31 (records). All
          certificates retained 7+ years; copies available to Ofsted on request.
        </p>
      </div>
    </PageShell>
  );
}
