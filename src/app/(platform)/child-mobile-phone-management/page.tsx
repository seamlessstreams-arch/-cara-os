"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Smartphone,
  ShieldCheck,
  Clock,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  AlertTriangle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PhoneRecord {
  id: string;
  youngPerson: string;
  recordedDate: string;
  phoneModel: string;
  contractType: "PAYG" | "SIM-only" | "Contract" | "Family-shared" | "No phone";
  contractHolder?: string;
  monthlyCost: number;
  fundingSource: "Pocket money" | "Home pays" | "Family pays" | "Mixed" | "Free with leaving care grant";
  imei?: string;
  parentalControlsActive: boolean;
  parentalControlsType?: string;
  screenTimeWeeklyAvg: number;
  screenTimeAgreedLimit?: number;
  appsInstalled: { name: string; category: "Social" | "Games" | "Education" | "Health" | "Communication" | "Utility" | "Other"; ageRating?: string }[];
  handInProtocol: "Bedtime" | "School hours" | "Both" | "Never" | "Other agreed pattern";
  whatIfLostPlan: string;
  passcodeWithStaff: boolean;
  childVoice: string;
  staffObservation: string;
  flagsConcerns: string[];
  reviewDate: string;
  keyWorker: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: PhoneRecord[] = [
  {
    id: "ph-001",
    youngPerson: "yp_jordan",
    recordedDate: d(-14),
    phoneModel: "iPhone 12 (refurbished, 128GB, Pacific Blue)",
    contractType: "SIM-only",
    contractHolder: "Jordan (own contract — 30-day rolling, set up with key worker support)",
    monthlyCost: 15,
    fundingSource: "Pocket money",
    imei: "Recorded with key worker (kept securely on file — Jordan agreed)",
    parentalControlsActive: false,
    parentalControlsType: "None active — agreed with Jordan (16+, trust-based, online safety conversations instead)",
    screenTimeWeeklyAvg: 18,
    appsInstalled: [
      { name: "WhatsApp", category: "Communication", ageRating: "16+" },
      { name: "Instagram", category: "Social", ageRating: "13+" },
      { name: "Snapchat", category: "Social", ageRating: "13+" },
      { name: "TikTok", category: "Social", ageRating: "13+" },
      { name: "Spotify", category: "Other", ageRating: "12+" },
      { name: "FIFA Mobile", category: "Games", ageRating: "3+" },
      { name: "BBC Sport", category: "Other", ageRating: "4+" },
      { name: "Google Maps", category: "Utility", ageRating: "4+" },
      { name: "Banking app (Monzo 16+)", category: "Utility", ageRating: "16+" },
    ],
    handInProtocol: "Never",
    whatIfLostPlan:
      "Jordan to tell key worker immediately. Use Find My iPhone (already set up). Erase device remotely if not recovered within 24 hours. Replacement bought from savings if needed — home will help advance with repayment plan.",
    passcodeWithStaff: false,
    childVoice:
      "I bought this phone with my own money from football coaching wages. I look after it. I'd tell Anna straight away if anything happened.",
    staffObservation:
      "Jordan handles his phone responsibly. Pays his own SIM-only contract. Online safety conversations ongoing — Jordan engages well. No concerning activity flagged. Phone never disrupts sleep or school engagement.",
    flagsConcerns: [],
    reviewDate: d(76),
    keyWorker: "staff_anna",
  },
  {
    id: "ph-002",
    youngPerson: "yp_alex",
    recordedDate: d(-21),
    phoneModel: "Google Pixel 7a (128GB, Charcoal)",
    contractType: "Contract",
    contractHolder: "Oak House (placement budget — contract in home name, agreed with Alex's social worker)",
    monthlyCost: 25,
    fundingSource: "Home pays",
    imei: "Recorded — held with key worker and on placement file",
    parentalControlsActive: true,
    parentalControlsType: "Google Family Link (light touch — content age filters and screen time visibility, no app blocking)",
    screenTimeWeeklyAvg: 22,
    screenTimeAgreedLimit: 25,
    appsInstalled: [
      { name: "WhatsApp", category: "Communication", ageRating: "16+" },
      { name: "Snapchat", category: "Social", ageRating: "13+" },
      { name: "Instagram", category: "Social", ageRating: "13+" },
      { name: "YouTube", category: "Other", ageRating: "13+" },
      { name: "Spotify", category: "Other", ageRating: "12+" },
      { name: "Roblox", category: "Games", ageRating: "7+" },
      { name: "Duolingo", category: "Education", ageRating: "4+" },
      { name: "Headspace", category: "Health", ageRating: "4+" },
      { name: "Google Maps", category: "Utility", ageRating: "4+" },
    ],
    handInProtocol: "Bedtime",
    whatIfLostPlan:
      "Alex tells staff straight away. Anna uses Family Link to locate, lock or wipe. Replacement procured via placement budget if not recovered. SIM blocked through provider within 1 hour. Police report only if theft suspected.",
    passcodeWithStaff: true,
    childVoice:
      "Anna helped me set up Family Link. I don't mind it — she's not snooping. The bedtime box is fine. I sleep better without my phone next to me anyway.",
    staffObservation:
      "Alex hands phone in to lounge box at 21:00 most nights without prompt. Screen time tracking under agreed 25 hr/week limit. Family Link configured collaboratively — Alex chose categories. Healthy relationship developing. Recent sensitivity around peer group on Snapchat — being monitored gently.",
    flagsConcerns: [
      "Recent peer group on Snapchat — light contextual safeguarding watch (no specific concern, ongoing dialogue)",
    ],
    reviewDate: d(69),
    keyWorker: "staff_anna",
  },
  {
    id: "ph-003",
    youngPerson: "yp_casey",
    recordedDate: d(-7),
    phoneModel: "Nokia 110 4G (basic phone — calls and texts only)",
    contractType: "PAYG",
    contractHolder: "Oak House (PAYG SIM topped up monthly by home)",
    monthlyCost: 5,
    fundingSource: "Home pays",
    imei: "Recorded — held with key worker",
    parentalControlsActive: false,
    parentalControlsType:
      "Not applicable — basic feature phone, no internet or app store. Family Link / Screen Time not relevant on this device.",
    screenTimeWeeklyAvg: 2,
    appsInstalled: [],
    handInProtocol: "Bedtime",
    whatIfLostPlan:
      "Casey tells Chervelle. SIM blocked same day. Replacement basic phone provided from petty cash (under £30). No personal data on device of concern. WhatsApp / smartphone conversation deferred to age 13 review.",
    passcodeWithStaff: true,
    childVoice:
      "I just want to call Mum and Chervelle. I don't need a smartphone yet. We agreed we'll talk about it when I'm 13. No WhatsApp yet — I'm fine with that.",
    staffObservation:
      "Casey uses phone almost exclusively for family contact and to call key worker. Hands in at bedtime to bedside drawer in office. No smartphone yet by joint agreement — Casey, parents, and placing authority all agreed to revisit at age 13. Phased introduction plan being drafted.",
    flagsConcerns: [
      "Smartphone introduction plan due for drafting before 13th birthday review (planning phase)",
    ],
    reviewDate: d(83),
    keyWorker: "staff_chervelle",
  },
];

const exportCols: ExportColumn<PhoneRecord>[] = [
  { header: "Young Person", accessor: (r: PhoneRecord) => getYPName(r.youngPerson) },
  { header: "Phone Model", accessor: (r: PhoneRecord) => r.phoneModel },
  { header: "Contract Type", accessor: (r: PhoneRecord) => r.contractType },
  { header: "Contract Holder", accessor: (r: PhoneRecord) => r.contractHolder ?? "—" },
  { header: "Monthly Cost", accessor: (r: PhoneRecord) => `£${r.monthlyCost.toFixed(2)}` },
  { header: "Funding Source", accessor: (r: PhoneRecord) => r.fundingSource },
  { header: "Parental Controls", accessor: (r: PhoneRecord) => (r.parentalControlsActive ? "Active" : "Off") },
  { header: "Parental Controls Type", accessor: (r: PhoneRecord) => r.parentalControlsType ?? "—" },
  { header: "Screen Time (hrs/week avg)", accessor: (r: PhoneRecord) => r.screenTimeWeeklyAvg.toString() },
  { header: "Screen Time Agreed Limit", accessor: (r: PhoneRecord) => (r.screenTimeAgreedLimit !== undefined ? `${r.screenTimeAgreedLimit} hrs` : "—") },
  { header: "Apps Installed", accessor: (r: PhoneRecord) => r.appsInstalled.length.toString() },
  { header: "Hand-In Protocol", accessor: (r: PhoneRecord) => r.handInProtocol },
  { header: "Passcode With Staff", accessor: (r: PhoneRecord) => (r.passcodeWithStaff ? "Yes" : "No (private)") },
  { header: "Flags / Concerns", accessor: (r: PhoneRecord) => r.flagsConcerns.join("; ") || "—" },
  { header: "Key Worker", accessor: (r: PhoneRecord) => getStaffName(r.keyWorker) },
  { header: "Review Date", accessor: (r: PhoneRecord) => r.reviewDate },
];

const contractTone: Record<PhoneRecord["contractType"], string> = {
  "PAYG": "bg-slate-100 text-slate-800",
  "SIM-only": "bg-sky-100 text-sky-800",
  "Contract": "bg-indigo-100 text-indigo-800",
  "Family-shared": "bg-purple-100 text-purple-800",
  "No phone": "bg-amber-100 text-amber-800",
};

const handInTone: Record<PhoneRecord["handInProtocol"], string> = {
  "Bedtime": "bg-sky-100 text-sky-800",
  "School hours": "bg-amber-100 text-amber-800",
  "Both": "bg-emerald-100 text-emerald-800",
  "Never": "bg-slate-100 text-slate-800",
  "Other agreed pattern": "bg-purple-100 text-purple-800",
};

const categoryTone: Record<PhoneRecord["appsInstalled"][number]["category"], string> = {
  "Social": "bg-pink-100 text-pink-800",
  "Games": "bg-orange-100 text-orange-800",
  "Education": "bg-emerald-100 text-emerald-800",
  "Health": "bg-teal-100 text-teal-800",
  "Communication": "bg-sky-100 text-sky-800",
  "Utility": "bg-slate-100 text-slate-800",
  "Other": "bg-zinc-100 text-zinc-800",
};

export default function ChildMobilePhoneManagementPage() {
  const [search, setSearch] = useState("");
  const [contractFilter, setContractFilter] = useState<"all" | PhoneRecord["contractType"]>("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (contractFilter !== "all") items = items.filter((r) => r.contractType === contractFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (r) =>
          getYPName(r.youngPerson).toLowerCase().includes(q) ||
          r.phoneModel.toLowerCase().includes(q) ||
          r.contractType.toLowerCase().includes(q) ||
          r.appsInstalled.some((a) => a.name.toLowerCase().includes(q)),
      );
    }
    items.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
        case "cost-high":
          return b.monthlyCost - a.monthlyCost;
        case "cost-low":
          return a.monthlyCost - b.monthlyCost;
        case "screen-time":
          return b.screenTimeWeeklyAvg - a.screenTimeWeeklyAvg;
        case "review":
          return a.reviewDate.localeCompare(b.reviewDate);
        default:
          return 0;
      }
    });
    return items;
  }, [search, contractFilter, sortBy]);

  const activePhones = data.filter((r) => r.contractType !== "No phone").length;
  const totalMonthlyCost = data.reduce((sum, r) => sum + r.monthlyCost, 0);
  const parentalControlsActive = data.filter((r) => r.parentalControlsActive).length;
  const flagCount = data.reduce((sum, r) => sum + r.flagsConcerns.length, 0);

  return (
    <PageShell
      title="Child Mobile Phone Management"
      subtitle="Per-child phone records — contracts, costs, parental controls, screen time, app inventory, hand-in protocols, and online safety"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="child-mobile-phone-management" />
          <PrintButton title="Mobile Phone Management" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-sky-600">{activePhones}</p>
          <p className="text-xs text-muted-foreground">Active Phones</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-slate-700">£{totalMonthlyCost.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Total Monthly Cost</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{parentalControlsActive}/{data.length}</p>
          <p className="text-xs text-muted-foreground">Parental Controls Active</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", flagCount > 0 ? "text-amber-600" : "text-slate-400")}>{flagCount}</p>
          <p className="text-xs text-muted-foreground">Flags / Concerns</p>
        </div>
      </div>

      <div className="rounded-lg bg-sky-50 border border-sky-200 p-3 mb-6 flex items-start gap-2">
        <ShieldCheck className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
        <p className="text-sm text-sky-800">
          Mobile phone access is a normal, healthy part of growing up. Each child&apos;s phone arrangement
          is individually negotiated — based on age, capability, and online safety needs. Controls are
          collaborative and proportionate, not surveillance. Children retain reasonable privacy under
          UNCRC Article 16. Hand-in protocols, parental controls, and what-if-lost plans are agreed with
          the child wherever possible.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search child, model, app..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <Select value={contractFilter} onValueChange={(v) => setContractFilter(v as typeof contractFilter)}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="All Contract Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Contract Types</SelectItem>
            <SelectItem value="PAYG">PAYG</SelectItem>
            <SelectItem value="SIM-only">SIM-only</SelectItem>
            <SelectItem value="Contract">Contract</SelectItem>
            <SelectItem value="Family-shared">Family-shared</SelectItem>
            <SelectItem value="No phone">No phone</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">By Child</SelectItem>
              <SelectItem value="cost-high">Cost (High to Low)</SelectItem>
              <SelectItem value="cost-low">Cost (Low to High)</SelectItem>
              <SelectItem value="screen-time">Screen Time (High)</SelectItem>
              <SelectItem value="review">Earliest Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isExpanded = expandedId === r.id;
          const overLimit =
            r.screenTimeAgreedLimit !== undefined && r.screenTimeWeeklyAvg > r.screenTimeAgreedLimit;

          return (
            <div key={r.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Smartphone className="h-5 w-5 text-sky-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(r.youngPerson)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.phoneModel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3 flex-wrap justify-end">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", contractTone[r.contractType])}>
                    {r.contractType}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-medium">
                    £{r.monthlyCost.toFixed(2)}/mo
                  </span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", handInTone[r.handInProtocol])}>
                    Hand-in: {r.handInProtocol}
                  </span>
                  {r.flagsConcerns.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {r.flagsConcerns.length}
                    </span>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Contract</p>
                      <p className="text-sm">{r.contractType} &middot; £{r.monthlyCost.toFixed(2)}/month</p>
                      {r.contractHolder && (
                        <p className="text-xs text-muted-foreground mt-1">Holder: {r.contractHolder}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">Funding: {r.fundingSource}</p>
                      {r.imei && <p className="text-xs text-muted-foreground mt-0.5">IMEI: {r.imei}</p>}
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <ShieldCheck className="h-3 w-3 inline mr-1" />Parental Controls
                      </p>
                      <p className="text-sm">
                        {r.parentalControlsActive ? (
                          <span className="text-emerald-700 font-medium">Active</span>
                        ) : (
                          <span className="text-slate-600">Not active</span>
                        )}
                      </p>
                      {r.parentalControlsType && (
                        <p className="text-xs text-muted-foreground mt-1">{r.parentalControlsType}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Passcode held with staff: {r.passcodeWithStaff ? "Yes (agreed)" : "No (private — child's right)"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <Clock className="h-3 w-3 inline mr-1" />Screen Time
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{r.screenTimeWeeklyAvg} hrs/week (avg)</span>
                      {r.screenTimeAgreedLimit !== undefined && (
                        <>
                          <span className="text-xs text-muted-foreground">vs agreed limit</span>
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full font-medium",
                              overLimit ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800",
                            )}
                          >
                            {r.screenTimeAgreedLimit} hrs
                          </span>
                        </>
                      )}
                      {r.screenTimeAgreedLimit === undefined && (
                        <span className="text-xs text-muted-foreground">No agreed limit (age/agreement)</span>
                      )}
                    </div>
                  </div>

                  {r.appsInstalled.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Apps Installed ({r.appsInstalled.length})
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                        {r.appsInstalled.map((a, i) => (
                          <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-center justify-between gap-2">
                            <span className="font-medium truncate">{a.name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", categoryTone[a.category])}>
                                {a.category}
                              </span>
                              {a.ageRating && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                                  {a.ageRating}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Apps Installed</p>
                      <p className="text-sm text-muted-foreground italic">No apps — basic feature phone (calls and texts only)</p>
                    </div>
                  )}

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Child Voice</p>
                    <p className="text-sm italic text-blue-900">&ldquo;{r.childVoice}&rdquo;</p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Staff Observation</p>
                    <p className="text-sm">{r.staffObservation}</p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">If Lost or Stolen — Plan</p>
                    <p className="text-sm">{r.whatIfLostPlan}</p>
                  </div>

                  {r.flagsConcerns.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />Flags / Concerns
                      </p>
                      <ul className="space-y-1">
                        {r.flagsConcerns.map((f, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Recorded: {r.recordedDate}</span>
                    <span>Key worker: {getStaffName(r.keyWorker)}</span>
                    <span>Next review: {r.reviewDate}</span>
                    <span>Hand-in: {r.handInProtocol}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Per-child mobile phone management supports
          Keeping Children Safe in Education (KCSIE) 2024 (online safety duty), the Online Safety Act
          2023, the UK GDPR Age Appropriate Design Code (Children&apos;s Code — privacy by design,
          age-appropriate experiences), Children&apos;s Homes Regulations 2015 Quality Standard 9
          (Protection of children — including online safety and exploitation prevention), and UNCRC
          Articles 16 (privacy) and 17 (access to information). Phone arrangements are collaborative,
          proportionate, and reviewed regularly with each child.
        </p>
      </div>
    </PageShell>
  );
}
