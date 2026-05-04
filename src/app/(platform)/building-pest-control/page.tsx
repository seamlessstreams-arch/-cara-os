"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Bug,
  Shield,
  Sprout,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PestRecord {
  id: string;
  recordDate: string;
  recordType:
    | "Routine preventive treatment"
    | "Reactive call-out"
    | "Annual contract review"
    | "Bait station refresh"
    | "Survey only"
    | "Follow-up monitoring";
  pestCategory:
    | "Mice"
    | "Rats"
    | "Ants"
    | "Wasps / hornets"
    | "Silverfish"
    | "Bedbugs"
    | "Cockroaches"
    | "Moths"
    | "Pigeons"
    | "Mixed / general"
    | "None — preventive only";
  affectedAreas: string[];
  contractor: string;
  contractorAccreditation: string;
  treatmentMethod: string[];
  chemicalsUsed: string[];
  childSafetyMeasures: string[];
  childInformedAndPaced: boolean;
  preventionAdvice: string[];
  followUpRequired: boolean;
  followUpDate?: string;
  costPaid?: number;
  outcomeEvidence: string;
  recordedBy: string;
  flagsConcerns: string[];
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const records: PestRecord[] = [
  {
    id: "pst_001",
    recordDate: d(-18),
    recordType: "Routine preventive treatment",
    pestCategory: "None — preventive only",
    affectedAreas: ["External perimeter", "Bin store", "Loft hatches", "Utility room base of units"],
    contractor: "Rentokil Pest Control (national contract)",
    contractorAccreditation: "BPCA member · CEPA EN 16636 certified · technician CRRU certified",
    treatmentMethod: [
      "Visual inspection of all bait stations (8 external)",
      "Refresh of non-toxic monitoring blocks where eaten",
      "Proofing check on door sweeps and air-brick mesh",
    ],
    chemicalsUsed: [
      "Non-toxic monitoring wax blocks only (no rodenticide deployed — children present in home)",
    ],
    childSafetyMeasures: [
      "All bait stations are tamper-resistant external boxes only — never inside the home",
      "Children not present during inspection (visit timed for school day)",
      "Non-toxic monitoring used as default; rodenticide only deployed if active infestation evidenced",
    ],
    childInformedAndPaced: true,
    preventionAdvice: [
      "Continue weekly bin-store check by staff",
      "Garage door sweep showing wear — replace at next maintenance window",
      "Maintain 30cm gap between stored items and external walls",
    ],
    followUpRequired: false,
    costPaid: 95,
    outcomeEvidence: "Rentokil visit report PEST-2026-Q2-CSH filed in Operations folder; photos of bait stations attached.",
    recordedBy: "staff_darren",
    flagsConcerns: [],
  },
  {
    id: "pst_002",
    recordDate: d(-42),
    recordType: "Reactive call-out",
    pestCategory: "Mice",
    affectedAreas: ["Utility room (behind washing machine)", "Under-stairs cupboard"],
    contractor: "Rentokil Pest Control",
    contractorAccreditation: "BPCA member · CEPA EN 16636 certified · CRRU rodenticide stewardship",
    treatmentMethod: [
      "Visit 1: survey, identification of single rodent activity (droppings + gnaw marks)",
      "Visit 1: snap traps (mechanical, child-safe placement) deployed in lockable service voids only",
      "Visit 2 (10 days later): one mouse caught, no further activity — traps removed",
    ],
    chemicalsUsed: [
      "No rodenticide used — mechanical traps only (children-present home protocol)",
      "Cleansing wipe-down of utility floor with Rentokil-supplied biocide post-removal (children excluded from area)",
    ],
    childSafetyMeasures: [
      "Children informed age-appropriately by Darren before contractor visit — explained the noise and what was happening",
      "Traps placed only in locked service voids inaccessible to children",
      "Utility room cordoned during visits; children offered alternative route",
      "Casey (anxious about noise) given headphones and calm-down option in lounge during contractor visit",
      "No rodenticide chemicals — agreed with contractor due to home setting",
    ],
    childInformedAndPaced: true,
    preventionAdvice: [
      "Kitchen audit completed — all dry goods moved to airtight containers (already in place, reconfirmed)",
      "Identified entry point: small gap behind washing machine waste pipe — sealed with steel wool + sealant",
      "Increased external bait-station inspection to fortnightly for 8 weeks",
      "Reminded staff of overnight kitchen cleaning checklist",
    ],
    followUpRequired: true,
    followUpDate: d(-28),
    costPaid: 165,
    outcomeEvidence: "Rentokil case file RTC-2026-0319 closed clear at Visit 2; entry point photo + sealing photo in Buildings folder; kitchen audit signed off.",
    recordedBy: "staff_darren",
    flagsConcerns: [
      "Source likely external — open compost neighbour boundary; speak to neighbour about bin lid (logged for next week)",
    ],
  },
  {
    id: "pst_003",
    recordDate: d(-72),
    recordType: "Reactive call-out",
    pestCategory: "Wasps / hornets",
    affectedAreas: ["Eaves above garage", "Garden play area airspace"],
    contractor: "Hodson Local Pest Services (independent, Watford)",
    contractorAccreditation: "BPCA Affiliate · RSPH Level 2 Pest Management · Public liability £5m",
    treatmentMethod: [
      "Survey identified active wasp nest (~30cm) in garage eaves",
      "Single visit: dust insecticide injection at dusk; nest knocked down following day after activity ceased",
    ],
    chemicalsUsed: [
      "Permethrin-based insecticidal dust (Ficam D) — applied externally only at dusk",
      "Re-entry exclusion zone of 5m for 2 hours; garden re-opened to children next morning after contractor confirmation",
    ],
    childSafetyMeasures: [
      "Treatment booked for evening once children indoors and settled",
      "Garden play area closed for 12 hours; signs and verbal explanation to children",
      "Children kept inside during application; windows on garage side closed",
      "Younger residents told the wasps were being safely moved away — pitched age-appropriately",
    ],
    childInformedAndPaced: true,
    preventionAdvice: [
      "Inspect eaves and roof joins early each spring before nests establish",
      "Keep bin lids closed and rinse recyclables — sugar residues attract wasps",
      "Consider mesh on garage soffit vents at next decoration cycle",
    ],
    followUpRequired: false,
    costPaid: 75,
    outcomeEvidence: "Contractor invoice + photo of removed nest filed; garden re-opening confirmed in daily log.",
    recordedBy: "staff_anna",
    flagsConcerns: [],
  },
  {
    id: "pst_004",
    recordDate: d(-8),
    recordType: "Annual contract review",
    pestCategory: "Mixed / general",
    affectedAreas: ["Whole property — internal and external"],
    contractor: "Rentokil Pest Control (account manager review)",
    contractorAccreditation: "BPCA member · CEPA EN 16636 · ISO 9001",
    treatmentMethod: [
      "Annual review of contract scope, visit frequency, and risk assessment",
      "Walk-around survey with manager (Darren) — building condition, proofing, hygiene",
      "Updated COSHH file refreshed with current SDS for any chemicals contracted",
    ],
    chemicalsUsed: [
      "No treatment chemicals applied during review",
      "Updated SDS sheets supplied for contractor's permitted product list (held in COSHH folder)",
    ],
    childSafetyMeasures: [
      "Contract reaffirmed: no rodenticide use internally while children resident — first-line is mechanical/proofing/non-toxic monitoring",
      "Any visit involving chemicals to be pre-notified 48h with risk assessment shared with manager",
      "Contractor to wear ID badge and sign in via visitor log every visit",
    ],
    childInformedAndPaced: true,
    preventionAdvice: [
      "Increase visits from quarterly to bi-monthly for next 12 months given April mouse incident",
      "Add bi-annual loft inspection",
      "Re-baseline external bait stations to monitoring-only blocks",
    ],
    followUpRequired: true,
    followUpDate: d(54),
    costPaid: 720,
    outcomeEvidence: "Signed contract renewal CON-2026-29 + risk assessment + COSHH update in Operations folder; copy to Responsible Individual.",
    recordedBy: "staff_darren",
    flagsConcerns: [],
  },
  {
    id: "pst_005",
    recordDate: d(-14),
    recordType: "Routine preventive treatment",
    pestCategory: "Silverfish",
    affectedAreas: ["Family bathroom (skirting + behind bath panel)"],
    contractor: "In-house — preventive measures by maintenance",
    contractorAccreditation: "Manager-led · BPCA guidance followed · no licensable chemicals used",
    treatmentMethod: [
      "Identified low-level silverfish activity behind bath panel during routine clean",
      "Chemical-free first response: improved ventilation (extractor fan timer extended), de-humidifier deployed for 5 nights",
      "Sealant applied to skirting joins and around bath panel edge",
      "Sticky monitoring traps placed under bath panel (not accessible to children)",
    ],
    chemicalsUsed: [
      "None — chemical-free approach (silverfish indicate damp, addressed at source)",
      "Standard bathroom sealant (low-VOC, food-safe certified) for proofing",
    ],
    childSafetyMeasures: [
      "Sticky traps placed only in service void behind bath panel — physically inaccessible",
      "Children told (briefly, age-appropriately) that staff were sealing gaps to keep small bugs out",
      "No insecticides used — addresses root cause (humidity) instead",
      "Bathroom remained in normal use throughout",
    ],
    childInformedAndPaced: true,
    preventionAdvice: [
      "Run extractor fan minimum 20 minutes after every shower",
      "Continue weekly bath-panel check during deep clean",
      "Re-check traps in 14 days; escalate to BPCA contractor if activity persists",
    ],
    followUpRequired: true,
    followUpDate: d(0),
    costPaid: 0,
    outcomeEvidence: "Maintenance log entry + photos of sealant work; trap monitoring sheet attached. No chemicals — no COSHH entry required.",
    recordedBy: "staff_darren",
    flagsConcerns: [],
  },
];

const exportCols: ExportColumn<PestRecord>[] = [
  { header: "Date", accessor: (r: PestRecord) => r.recordDate },
  { header: "Type", accessor: (r: PestRecord) => r.recordType },
  { header: "Pest", accessor: (r: PestRecord) => r.pestCategory },
  { header: "Affected Areas", accessor: (r: PestRecord) => r.affectedAreas.join("; ") },
  { header: "Contractor", accessor: (r: PestRecord) => r.contractor },
  { header: "Accreditation", accessor: (r: PestRecord) => r.contractorAccreditation },
  { header: "Treatment Method", accessor: (r: PestRecord) => r.treatmentMethod.join("; ") },
  { header: "Chemicals Used", accessor: (r: PestRecord) => r.chemicalsUsed.join("; ") },
  { header: "Child Safety Measures", accessor: (r: PestRecord) => r.childSafetyMeasures.join("; ") },
  { header: "Child Informed", accessor: (r: PestRecord) => (r.childInformedAndPaced ? "Yes" : "No") },
  { header: "Prevention Advice", accessor: (r: PestRecord) => r.preventionAdvice.join("; ") },
  { header: "Follow-up Required", accessor: (r: PestRecord) => (r.followUpRequired ? "Yes" : "No") },
  { header: "Follow-up Date", accessor: (r: PestRecord) => r.followUpDate ?? "—" },
  { header: "Cost", accessor: (r: PestRecord) => (r.costPaid !== undefined ? `£${r.costPaid.toFixed(2)}` : "—") },
  { header: "Outcome / Evidence", accessor: (r: PestRecord) => r.outcomeEvidence },
  { header: "Recorded By", accessor: (r: PestRecord) => getStaffName(r.recordedBy) },
  { header: "Flags / Concerns", accessor: (r: PestRecord) => r.flagsConcerns.join("; ") },
];

const typeColour: Record<PestRecord["recordType"], string> = {
  "Routine preventive treatment": "bg-teal-100 text-teal-800 border-teal-200",
  "Reactive call-out": "bg-amber-100 text-amber-800 border-amber-200",
  "Annual contract review": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Bait station refresh": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Survey only": "bg-slate-100 text-slate-800 border-slate-200",
  "Follow-up monitoring": "bg-sky-100 text-sky-800 border-sky-200",
};

const pestColour: Record<PestRecord["pestCategory"], string> = {
  Mice: "bg-amber-100 text-amber-900 border-amber-200",
  Rats: "bg-red-100 text-red-900 border-red-200",
  Ants: "bg-orange-100 text-orange-900 border-orange-200",
  "Wasps / hornets": "bg-yellow-100 text-yellow-900 border-yellow-200",
  Silverfish: "bg-cyan-100 text-cyan-900 border-cyan-200",
  Bedbugs: "bg-rose-100 text-rose-900 border-rose-200",
  Cockroaches: "bg-stone-200 text-stone-900 border-stone-300",
  Moths: "bg-violet-100 text-violet-900 border-violet-200",
  Pigeons: "bg-zinc-100 text-zinc-900 border-zinc-200",
  "Mixed / general": "bg-slate-100 text-slate-800 border-slate-200",
  "None — preventive only": "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export default function BuildingPestControlPage() {
  const [search, setSearch] = useState("");
  const [pestFilter, setPestFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "type" | "pest" | "followup">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        rec.pestCategory.toLowerCase().includes(search.toLowerCase()) ||
        rec.contractor.toLowerCase().includes(search.toLowerCase()) ||
        rec.affectedAreas.some((a) => a.toLowerCase().includes(search.toLowerCase()));
      const matchesPest = pestFilter === "all" || rec.pestCategory === pestFilter;
      return matchesSearch && matchesPest;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "type") return a.recordType.localeCompare(b.recordType);
      if (sortBy === "pest") return a.pestCategory.localeCompare(b.pestCategory);
      if (sortBy === "followup") {
        const aF = a.followUpDate ?? "9999-99-99";
        const bF = b.followUpDate ?? "9999-99-99";
        return aF.localeCompare(bF);
      }
      return b.recordDate.localeCompare(a.recordDate);
    });
    return r;
  }, [search, pestFilter, sortBy]);

  const stats = useMemo(() => {
    const yearStart = d(-365);
    const treatmentsYTD = records.filter(
      (r) => r.recordDate >= yearStart && r.recordType !== "Survey only" && r.recordType !== "Annual contract review",
    ).length;
    const followUpsOpen = records.filter((r) => r.followUpRequired && (r.followUpDate ?? d(999)) >= d(0)).length;
    const infestationsResolved = records.filter(
      (r) =>
        r.recordType === "Reactive call-out" &&
        !r.followUpRequired,
    ).length;
    const annualCost = records
      .filter((r) => r.recordDate >= yearStart)
      .reduce((acc, r) => acc + (r.costPaid ?? 0), 0);
    return { treatmentsYTD, followUpsOpen, infestationsResolved, annualCost };
  }, []);

  return (
    <PageShell
      title="Building Pest Control & Prevention"
      subtitle="Proactive routine treatments and reactive call-outs — mice, rats, ants, wasps, silverfish, bedbugs, cockroaches, moths. Child-safety-first protocols: chemical-free options first, no rodenticide indoors with children resident, transparency with young people. Reg 12 (protection from harm), Reg 25 (premises and grounds), Reg 31 (records); H&SAW 1974, COSHH, Wildlife & Countryside Act 1981; BPCA standards."
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="building-pest-control" />
          <PrintButton title="Pest Control & Prevention" />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-amber-800 text-sm mb-1">
            <Bug className="h-4 w-4" />
            <span>Treatments (12m)</span>
          </div>
          <div className="text-2xl font-semibold text-amber-900">{stats.treatmentsYTD}</div>
        </div>
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
          <div className="flex items-center gap-2 text-teal-800 text-sm mb-1">
            <Calendar className="h-4 w-4" />
            <span>Follow-ups open</span>
          </div>
          <div className="text-2xl font-semibold text-teal-900">{stats.followUpsOpen}</div>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-emerald-800 text-sm mb-1">
            <CheckCircle className="h-4 w-4" />
            <span>Infestations resolved</span>
          </div>
          <div className="text-2xl font-semibold text-emerald-900">{stats.infestationsResolved}</div>
        </div>
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
          <div className="flex items-center gap-2 text-stone-700 text-sm mb-1">
            <Shield className="h-4 w-4" />
            <span>Annual cost</span>
          </div>
          <div className="text-2xl font-semibold text-stone-900">£{stats.annualCost.toFixed(0)}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pest, contractor or area..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <Select value={pestFilter} onValueChange={setPestFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Pest category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All pest categories</SelectItem>
            <SelectItem value="Mice">Mice</SelectItem>
            <SelectItem value="Rats">Rats</SelectItem>
            <SelectItem value="Ants">Ants</SelectItem>
            <SelectItem value="Wasps / hornets">Wasps / hornets</SelectItem>
            <SelectItem value="Silverfish">Silverfish</SelectItem>
            <SelectItem value="Bedbugs">Bedbugs</SelectItem>
            <SelectItem value="Cockroaches">Cockroaches</SelectItem>
            <SelectItem value="Moths">Moths</SelectItem>
            <SelectItem value="Pigeons">Pigeons</SelectItem>
            <SelectItem value="Mixed / general">Mixed / general</SelectItem>
            <SelectItem value="None — preventive only">None — preventive only</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-48">
            <ArrowUpDown className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Most recent</SelectItem>
            <SelectItem value="type">Record type</SelectItem>
            <SelectItem value="pest">Pest category</SelectItem>
            <SelectItem value="followup">Follow-up due</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isOpen = expandedId === r.id;
          const followUpSoon =
            r.followUpRequired && r.followUpDate && r.followUpDate >= d(0) && r.followUpDate <= d(30);
          const followUpOverdue = r.followUpRequired && r.followUpDate && r.followUpDate < d(0);
          return (
            <div key={r.id} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : r.id)}
                className="w-full p-4 flex items-start justify-between gap-3 hover:bg-amber-50/40 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Bug className="h-4 w-4 text-amber-600" />
                    <span className="font-semibold text-slate-900">{r.recordDate}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", typeColour[r.recordType])}>
                      {r.recordType}
                    </span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", pestColour[r.pestCategory])}>
                      {r.pestCategory}
                    </span>
                    {r.followUpRequired ? (
                      followUpOverdue ? (
                        <span className="text-xs px-2 py-0.5 rounded-full border bg-red-100 text-red-800 border-red-200">
                          Follow-up overdue · {r.followUpDate}
                        </span>
                      ) : followUpSoon ? (
                        <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-100 text-amber-800 border-amber-200">
                          Follow-up {r.followUpDate}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full border bg-sky-100 text-sky-800 border-sky-200">
                          Follow-up {r.followUpDate}
                        </span>
                      )
                    ) : null}
                  </div>
                  <div className="text-sm text-slate-600">
                    {r.affectedAreas.slice(0, 2).join(" · ")}
                    {r.affectedAreas.length > 2 ? ` · +${r.affectedAreas.length - 2} more` : ""} · {r.contractor}
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 border-t border-slate-100 bg-amber-50/20">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Affected areas</div>
                      <ul className="text-sm text-slate-700 space-y-1">
                        {r.affectedAreas.map((a, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-amber-600">·</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Contractor</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
                        <div>
                          <span className="text-slate-500">Provider:</span> {r.contractor}
                        </div>
                        <div>
                          <span className="text-slate-500">Accreditation:</span> {r.contractorAccreditation}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-md border border-teal-200 bg-teal-50 p-3">
                      <div className="text-xs font-semibold text-teal-800 uppercase mb-2">Treatment method</div>
                      <ul className="text-sm text-teal-900 space-y-1">
                        {r.treatmentMethod.map((m, i) => (
                          <li key={i} className="flex gap-2">
                            <span>·</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
                      <div className="text-xs font-semibold text-stone-700 uppercase mb-2">Chemicals used (COSHH)</div>
                      <ul className="text-sm text-stone-800 space-y-1">
                        {r.chemicalsUsed.map((c, i) => (
                          <li key={i} className="flex gap-2">
                            <span>·</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-md border-2 border-emerald-300 bg-emerald-50 p-3 lg:col-span-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-emerald-700" />
                        <div className="text-xs font-semibold text-emerald-800 uppercase">
                          Child safety measures
                          {r.childInformedAndPaced ? (
                            <span className="ml-2 text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded-full normal-case">
                              Children informed &amp; paced
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <ul className="text-sm text-emerald-900 space-y-1">
                        {r.childSafetyMeasures.map((s, i) => (
                          <li key={i} className="flex gap-2">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 lg:col-span-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Sprout className="h-4 w-4 text-amber-700" />
                        <div className="text-xs font-semibold text-amber-800 uppercase">Prevention advice</div>
                      </div>
                      <ul className="text-sm text-amber-900 space-y-1">
                        {r.preventionAdvice.map((p, i) => (
                          <li key={i} className="flex gap-2">
                            <span>·</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Outcome / evidence trail</div>
                      <p className="text-sm text-slate-700">{r.outcomeEvidence}</p>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Follow-up</div>
                      <div className="text-sm text-slate-700">
                        {r.followUpRequired ? (
                          <>
                            Required by <span className="font-medium">{r.followUpDate ?? "TBC"}</span>
                          </>
                        ) : (
                          <span className="text-emerald-700">No follow-up required — closed</span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Cost</div>
                      <div className="text-sm text-slate-700">
                        {r.costPaid !== undefined ? `£${r.costPaid.toFixed(2)}` : "—"}
                      </div>
                    </div>

                    {r.flagsConcerns.length ? (
                      <div className="rounded-md border border-red-200 bg-red-50 p-3 lg:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-red-700" />
                          <div className="text-xs font-semibold text-red-800 uppercase">Flags / concerns</div>
                        </div>
                        <ul className="text-sm text-red-900 space-y-1">
                          {r.flagsConcerns.map((f, i) => (
                            <li key={i} className="flex gap-2">
                              <span>!</span>
                              <span>{f}</span>
                            </li>
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
          Children&rsquo;s Homes (England) Regulations 2015 Reg 12 (protection from harm), Reg 25 (premises and grounds)
          and Reg 31 (records); Health &amp; Safety at Work etc. Act 1974; Control of Substances Hazardous to Health
          (COSHH) Regulations 2002 — SDS held for any chemical entering the home; Wildlife &amp; Countryside Act 1981 —
          humane methods, lawful species control; British Pest Control Association (BPCA) / CEPA EN 16636 contractor
          standards; CRRU rodenticide stewardship. Child-safety-first principle: chemical-free measures are first-line,
          rodenticides are not used internally while children are resident, and young people are informed in an
          age-appropriate way before any visit. Records retained 7+ years; available to Ofsted on request.
        </p>
      </div>
    </PageShell>
  );
}
