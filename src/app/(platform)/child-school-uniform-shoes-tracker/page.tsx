"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Shirt,
  Footprints,
  ShoppingBag,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UniformRecord {
  id: string;
  youngPerson: string;
  recordedDate: string;
  category: "School uniform" | "PE kit" | "School shoes" | "Trainers" | "Coat / outerwear" | "Casual clothing audit" | "Bag / equipment";
  itemDetails: { item: string; size: string; condition: "New" | "Good" | "Worn — fits" | "Worn — getting tight" | "Outgrown" | "Damaged"; purchaseDate?: string; cost?: number }[];
  totalCostThisRecord: number;
  fundingSource: "Pupil Premium Plus" | "Virtual School grant" | "Leaving Care fund" | "Home clothing budget" | "School voucher" | "Charity (e.g., school uniform exchange)" | "Mixed";
  childChoseStyle: boolean;
  childChoseShop: boolean;
  shoppingTrip?: string;
  schoolUniformPolicyMet: boolean;
  childComfortNotes: string;
  sensoryConsiderations: string[];
  growthNoteCm?: string;
  shoeSize?: string;
  nextSizeAnticipated: string;
  nextReviewDate: string;
  recordedBy: string;
  flagsConcerns: string[];
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const records: UniformRecord[] = [
  {
    id: "uni_001",
    youngPerson: "yp_casey",
    recordedDate: d(-7),
    category: "School uniform",
    itemDetails: [
      { item: "School polo shirts (logoed)", size: "Age 12-13", condition: "New", purchaseDate: d(-7), cost: 36 },
      { item: "School trousers (soft elastic waistband — Casey's preference)", size: "Age 12-13", condition: "New", purchaseDate: d(-7), cost: 28 },
      { item: "School jumper (logoed)", size: "Age 12-13", condition: "New", purchaseDate: d(-7), cost: 22 },
      { item: "Old school polo (last term)", size: "Age 11-12", condition: "Outgrown", cost: 0 },
    ],
    totalCostThisRecord: 86,
    fundingSource: "Pupil Premium Plus",
    childChoseStyle: true,
    childChoseShop: true,
    shoppingTrip: "M&S Kidswear (Casey chose — soft fabric label)",
    schoolUniformPolicyMet: true,
    childComfortNotes: "Tags carefully removed by Anna. Soft seams checked. Casey approved before wearing. Old uniform donated to school uniform exchange.",
    sensoryConsiderations: [
      "No itchy fabrics",
      "Tags removed",
      "Elastic waistband (not button)",
      "Polo over t-shirt for tactile soft layer",
      "Pre-washed before first wear (3x with sensory-friendly detergent)",
    ],
    nextSizeAnticipated: "Likely age 13-14 by September",
    nextReviewDate: d(180),
    recordedBy: "staff_anna",
    flagsConcerns: [],
  },
  {
    id: "uni_002",
    youngPerson: "yp_casey",
    recordedDate: d(-7),
    category: "School shoes",
    itemDetails: [
      { item: "Clarks black school shoes (proper fit, leather)", size: "Size 4", condition: "New", purchaseDate: d(-7), cost: 52 },
      { item: "Old school shoes", size: "Size 3.5", condition: "Outgrown", cost: 0 },
    ],
    totalCostThisRecord: 52,
    fundingSource: "Pupil Premium Plus",
    childChoseStyle: true,
    childChoseShop: true,
    shoppingTrip: "Clarks for proper measuring (Casey's choice)",
    schoolUniformPolicyMet: true,
    childComfortNotes:
      "Foot measured. Casey now size 4 (was 3.5 in Sept). Two pairs of socks tried. No squeak.",
    sensoryConsiderations: [
      "No squeaks (Casey hates the squeak sound)",
      "Velcro option offered — Casey chose lace (independence!)",
      "Soft inner lining checked",
    ],
    shoeSize: "Size 4",
    nextSizeAnticipated: "Watch growth — likely 4.5 by autumn",
    nextReviewDate: d(120),
    recordedBy: "staff_anna",
    flagsConcerns: [],
  },
  {
    id: "uni_003",
    youngPerson: "yp_casey",
    recordedDate: d(-7),
    category: "PE kit",
    itemDetails: [
      { item: "PE polo shirt (school colours)", size: "Age 12-13", condition: "New", purchaseDate: d(-7), cost: 12 },
      { item: "PE shorts", size: "Age 12-13", condition: "New", purchaseDate: d(-7), cost: 10 },
      { item: "Trainers — white school PE", size: "Size 4", condition: "New", purchaseDate: d(-7), cost: 35 },
      { item: "Tracksuit bottoms (cold weather PE)", size: "Age 12-13", condition: "New", purchaseDate: d(-7), cost: 18 },
    ],
    totalCostThisRecord: 75,
    fundingSource: "Pupil Premium Plus",
    childChoseStyle: true,
    childChoseShop: true,
    schoolUniformPolicyMet: true,
    childComfortNotes: "Casey doesn't enjoy PE — kit chosen to make her feel comfortable. Tracksuit bottoms always allowed.",
    sensoryConsiderations: ["Soft elastic", "Tag-free shorts (cut tags)", "Trainer breaking-in plan — wear at home first"],
    nextSizeAnticipated: "September re-check",
    nextReviewDate: d(180),
    recordedBy: "staff_anna",
    flagsConcerns: [],
  },
  {
    id: "uni_004",
    youngPerson: "yp_jordan",
    recordedDate: d(-90),
    category: "School uniform",
    itemDetails: [
      { item: "Sixth form smart shirts (white)", size: "16 inch collar", condition: "Worn — fits", purchaseDate: d(-180), cost: 30 },
      { item: "Sixth form trousers (black)", size: "32W 32L", condition: "Worn — getting tight", purchaseDate: d(-180), cost: 35 },
      { item: "Tie (sixth form pattern)", size: "Adult", condition: "Good", purchaseDate: d(-180), cost: 8 },
      { item: "Blazer", size: "40 chest", condition: "Worn — fits", purchaseDate: d(-180), cost: 60 },
    ],
    totalCostThisRecord: 0,
    fundingSource: "Home clothing budget",
    childChoseStyle: true,
    childChoseShop: true,
    schoolUniformPolicyMet: true,
    childComfortNotes:
      "Jordan grew 4cm since September — trousers tight. Replacement booked for next month with leaving care budget contribution.",
    sensoryConsiderations: [],
    growthNoteCm: "+4cm since September",
    nextSizeAnticipated: "Trouser 33-34W",
    nextReviewDate: d(30),
    recordedBy: "staff_anna",
    flagsConcerns: ["Trousers becoming tight — schedule replacement"],
  },
  {
    id: "uni_005",
    youngPerson: "yp_alex",
    recordedDate: d(-30),
    category: "School uniform",
    itemDetails: [
      { item: "Gender-neutral school polo (boys' fit by choice)", size: "Adult S", condition: "Good", purchaseDate: d(-90), cost: 18 },
      { item: "School trousers (boys' cut by choice)", size: "30W 30L", condition: "Good", purchaseDate: d(-90), cost: 30 },
      { item: "School jumper (unisex)", size: "Adult S", condition: "Good", purchaseDate: d(-90), cost: 22 },
      { item: "Replacement polo (other became damaged in PE)", size: "Adult S", condition: "New", purchaseDate: d(-30), cost: 18 },
    ],
    totalCostThisRecord: 18,
    fundingSource: "Pupil Premium Plus",
    childChoseStyle: true,
    childChoseShop: true,
    shoppingTrip: "Online (Alex preferred — privacy from peers)",
    schoolUniformPolicyMet: true,
    childComfortNotes:
      "Alex's gender-affirming uniform choices respected — boys' cut throughout. School aware via SENCO/inclusion lead. Polo replaced after PE accident — no embarrassment, just done.",
    sensoryConsiderations: [],
    nextSizeAnticipated: "Likely no change for 6 months",
    nextReviewDate: d(150),
    recordedBy: "staff_anna",
    flagsConcerns: [],
  },
];

const exportCols: ExportColumn<UniformRecord>[] = [
  { header: "Young Person", accessor: (r: UniformRecord) => getYPName(r.youngPerson) },
  { header: "Date", accessor: (r: UniformRecord) => r.recordedDate },
  { header: "Category", accessor: (r: UniformRecord) => r.category },
  { header: "Items", accessor: (r: UniformRecord) => r.itemDetails.map((i) => `${i.item} (${i.size}, ${i.condition})`).join("; ") },
  { header: "Total Cost", accessor: (r: UniformRecord) => `£${r.totalCostThisRecord.toFixed(2)}` },
  { header: "Funding Source", accessor: (r: UniformRecord) => r.fundingSource },
  { header: "Child Chose Style", accessor: (r: UniformRecord) => (r.childChoseStyle ? "Yes" : "No") },
  { header: "Child Chose Shop", accessor: (r: UniformRecord) => (r.childChoseShop ? "Yes" : "No") },
  { header: "Shopping Trip", accessor: (r: UniformRecord) => r.shoppingTrip ?? "—" },
  { header: "Sensory Considerations", accessor: (r: UniformRecord) => r.sensoryConsiderations.join("; ") },
  { header: "Shoe Size", accessor: (r: UniformRecord) => r.shoeSize ?? "—" },
  { header: "Growth", accessor: (r: UniformRecord) => r.growthNoteCm ?? "—" },
  { header: "Next Anticipated", accessor: (r: UniformRecord) => r.nextSizeAnticipated },
  { header: "Review Date", accessor: (r: UniformRecord) => r.nextReviewDate },
  { header: "Recorded By", accessor: (r: UniformRecord) => getStaffName(r.recordedBy) },
];

const conditionColour: Record<UniformRecord["itemDetails"][number]["condition"], string> = {
  New: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Good: "bg-blue-100 text-blue-800 border-blue-200",
  "Worn — fits": "bg-sky-100 text-sky-800 border-sky-200",
  "Worn — getting tight": "bg-amber-100 text-amber-800 border-amber-200",
  Outgrown: "bg-orange-100 text-orange-800 border-orange-200",
  Damaged: "bg-red-100 text-red-800 border-red-200",
};

const categoryColour: Record<UniformRecord["category"], string> = {
  "School uniform": "bg-blue-100 text-blue-800 border-blue-200",
  "PE kit": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "School shoes": "bg-amber-100 text-amber-800 border-amber-200",
  Trainers: "bg-violet-100 text-violet-800 border-violet-200",
  "Coat / outerwear": "bg-sky-100 text-sky-800 border-sky-200",
  "Casual clothing audit": "bg-rose-100 text-rose-800 border-rose-200",
  "Bag / equipment": "bg-slate-100 text-slate-800 border-slate-200",
};

export default function ChildSchoolUniformShoesTrackerPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "category" | "review">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        getYPName(rec.youngPerson).toLowerCase().includes(search.toLowerCase()) ||
        rec.category.toLowerCase().includes(search.toLowerCase());
      const matchesCat = categoryFilter === "all" || rec.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "name") return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
      if (sortBy === "category") return a.category.localeCompare(b.category);
      if (sortBy === "review") return a.nextReviewDate.localeCompare(b.nextReviewDate);
      return b.recordedDate.localeCompare(a.recordedDate);
    });
    return r;
  }, [search, categoryFilter, sortBy]);

  const stats = useMemo(() => {
    const totalSpent = records.reduce((acc, r) => acc + r.totalCostThisRecord, 0);
    const flagsRaised = records.reduce((acc, r) => acc + r.flagsConcerns.length, 0);
    const childChoseAll = records.filter((r) => r.childChoseStyle && r.childChoseShop).length;
    const reviewsDue = records.filter((r) => r.nextReviewDate <= d(60)).length;
    return { totalSpent, flagsRaised, childChoseAll, reviewsDue };
  }, []);

  return (
    <PageShell
      title="School Uniform & Shoes Tracker"
      subtitle="Per-child school clothing — uniform, PE kit, shoes, trainers, outerwear. Sensory considerations, child-chosen styles, growth tracking, sustainable funding (Pupil Premium Plus, Virtual School grant, leaving care fund, school uniform exchange)."
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="child-school-uniform-shoes-tracker" />
          <PrintButton title="School Uniform & Shoes Tracker" />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <ShoppingBag className="h-4 w-4" />
            <span>Spent (recorded)</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">£{stats.totalSpent.toFixed(0)}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Shirt className="h-4 w-4" />
            <span>Child-chose all</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.childChoseAll}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <AlertTriangle className="h-4 w-4" />
            <span>Flags / replacements</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.flagsRaised}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Calendar className="h-4 w-4" />
            <span>Reviews due (60d)</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.reviewsDue}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search young person or category..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="School uniform">School uniform</SelectItem>
            <SelectItem value="PE kit">PE kit</SelectItem>
            <SelectItem value="School shoes">School shoes</SelectItem>
            <SelectItem value="Trainers">Trainers</SelectItem>
            <SelectItem value="Coat / outerwear">Coat / outerwear</SelectItem>
            <SelectItem value="Casual clothing audit">Casual clothing audit</SelectItem>
            <SelectItem value="Bag / equipment">Bag / equipment</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-48">
            <ArrowUpDown className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Most recent</SelectItem>
            <SelectItem value="name">Young person A→Z</SelectItem>
            <SelectItem value="category">Category</SelectItem>
            <SelectItem value="review">Review date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isOpen = expandedId === r.id;
          return (
            <div key={r.id} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : r.id)}
                className="w-full p-4 flex items-start justify-between gap-3 hover:bg-slate-50 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-slate-900">{getYPName(r.youngPerson)}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", categoryColour[r.category])}>
                      {r.category}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-slate-100 text-slate-700 border-slate-200">
                      £{r.totalCostThisRecord.toFixed(2)} this record
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-violet-100 text-violet-800 border-violet-200">
                      {r.fundingSource}
                    </span>
                    {r.childChoseStyle && r.childChoseShop ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-pink-100 text-pink-800 border-pink-200">
                        Child-led
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-slate-600">
                    Recorded {r.recordedDate} · Review {r.nextReviewDate} · {getStaffName(r.recordedBy)}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1">
                        <Footprints className="h-3.5 w-3.5" /> Items
                      </div>
                      <div className="space-y-1.5">
                        {r.itemDetails.map((it, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <span className="flex-1 text-slate-800">{it.item}</span>
                            <span className="text-xs text-slate-500">{it.size}</span>
                            <span className={cn("text-xs px-2 py-0.5 rounded-full border", conditionColour[it.condition])}>
                              {it.condition}
                            </span>
                            {it.cost !== undefined ? <span className="text-xs text-slate-500">£{it.cost.toFixed(2)}</span> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                    {r.sensoryConsiderations.length ? (
                      <div className="rounded-md border border-violet-200 bg-violet-50 p-3">
                        <div className="text-xs font-semibold text-violet-700 uppercase mb-2">Sensory considerations</div>
                        <ul className="text-sm text-violet-900 space-y-1">
                          {r.sensoryConsiderations.map((s, i) => (
                            <li key={i} className="flex gap-2"><span>·</span><span>{s}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {r.childComfortNotes ? (
                      <div className="rounded-md border border-pink-200 bg-pink-50 p-3">
                        <div className="text-xs font-semibold text-pink-700 uppercase mb-2">Child comfort notes</div>
                        <p className="text-sm text-pink-900">{r.childComfortNotes}</p>
                      </div>
                    ) : null}
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Growth & next review</div>
                      <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                        {r.shoeSize ? <div><span className="text-slate-500">Shoe size:</span> {r.shoeSize}</div> : null}
                        {r.growthNoteCm ? <div><span className="text-slate-500">Growth note:</span> {r.growthNoteCm}</div> : null}
                        <div><span className="text-slate-500">Next anticipated:</span> {r.nextSizeAnticipated}</div>
                        <div><span className="text-slate-500">School uniform policy met:</span> {r.schoolUniformPolicyMet ? "Yes" : "No"}</div>
                        {r.shoppingTrip ? <div className="col-span-2"><span className="text-slate-500">Shopping trip:</span> {r.shoppingTrip}</div> : null}
                      </div>
                    </div>
                    {r.flagsConcerns.length ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2">Flags / replacements due</div>
                        <ul className="text-sm text-amber-900 space-y-1">
                          {r.flagsConcerns.map((f, i) => (
                            <li key={i} className="flex gap-2"><span>!</span><span>{f}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <div className="font-semibold mb-1">Regulatory framework</div>
        <p>
          Looked-after children must never wear ill-fitting, mismatched, or visibly outgrown school clothing.
          Practice is grounded in Quality Standard 6 (Enjoyment & Achievement) and 7 (Positive Relationships),
          Pupil Premium Plus (DfE), the Virtual School Head duty (s.20 Children and Young Persons Act 2008), the
          Education (School Day and School Year) Regulations 1999 (uniform fairness), and gender-affirming uniform
          provision under the Equality Act 2010. Sustainable choices (school uniform exchange, second-hand) are
          considered alongside dignity. UNCRC Articles 12 (voice) + 28 (education).
        </p>
      </div>
    </PageShell>
  );
}
