"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Shirt,
  Heart,
  Wallet,
  Star,
  Sparkles,
  Clock,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ShoppingTrip {
  id: string;
  youngPerson: string;
  date: string;
  shopName: string;
  shopType: "High street" | "Sports specialist" | "Department store" | "Cultural/Specialist" | "Sensory-friendly" | "Online (with child involvement)" | "Charity shop" | "Independent boutique";
  staffEscort: string;
  durationMinutes: number;
  budgetAvailable: number;
  spend: number;
  remainingBudgetAfter: number;
  itemsBought: { item: string; cost: number; childChose: boolean; reasonForPurchase: string }[];
  childMoodDuring: "Excited" | "Engaged" | "Selective" | "Overwhelmed" | "Reluctant";
  challengesNavigated: string[];
  staffSupportProvided: string;
  childComments: string;
  childPride: string;
  itemsForLongTermUse: string[];
  itemsForSpecificEvent: string;
  childChoseAllItems: boolean;
  receiptsKept: boolean;
  notes: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: ShoppingTrip[] = [
  {
    id: "shop-001",
    youngPerson: "yp_alex",
    date: d(-7),
    shopName: "JD Sports + Sports Direct",
    shopType: "Sports specialist",
    staffEscort: "staff_lackson",
    durationMinutes: 90,
    budgetAvailable: 150,
    spend: 132,
    remainingBudgetAfter: 18,
    itemsBought: [
      { item: "Boxing-safe sport glasses (frames specific)", cost: 95, childChose: true, reasonForPurchase: "Replacement — old pair scratched at training" },
      { item: "Sport socks 3-pack", cost: 12, childChose: true, reasonForPurchase: "Restocking" },
      { item: "Boxing wraps (replacement)", cost: 25, childChose: true, reasonForPurchase: "Practical" },
    ],
    childMoodDuring: "Engaged",
    challengesNavigated: [],
    staffSupportProvided: "Lackson present but not directing. Helped with size sense check on glasses. Encouraged Alex to try frames.",
    childComments: "Got proper kit now. Coach said the glasses look class.",
    childPride: "Showed glasses to Coach James at next session — coach's reaction was positive.",
    itemsForLongTermUse: ["Boxing-safe sport glasses", "Boxing wraps"],
    itemsForSpecificEvent: "Inter-club competition next month",
    childChoseAllItems: true,
    receiptsKept: true,
    notes: "Successful trip. Alex felt valued through investment in his sport identity.",
  },
  {
    id: "shop-002",
    youngPerson: "yp_jordan",
    date: d(-14),
    shopName: "JD Sports (Manchester)",
    shopType: "Sports specialist",
    staffEscort: "staff_chervelle",
    durationMinutes: 75,
    budgetAvailable: 120,
    spend: 105,
    remainingBudgetAfter: 15,
    itemsBought: [
      { item: "Football boots (chosen by Jordan)", cost: 65, childChose: true, reasonForPurchase: "Match readiness; previous pair worn" },
      { item: "Training socks 5-pack", cost: 15, childChose: true, reasonForPurchase: "Restocking" },
      { item: "Captain's armband (cultural pattern)", cost: 25, childChose: true, reasonForPurchase: "Identity affirmation" },
    ],
    childMoodDuring: "Excited",
    challengesNavigated: [],
    staffSupportProvided: "Chervelle quietly supported. Stayed out of clothing decisions; available for sizing and budget.",
    childComments: "Boots are class. Coach will love the armband.",
    childPride: "Wore new kit to Saturday match — scored. Captain's armband particularly significant.",
    itemsForLongTermUse: ["Football boots", "Captain's armband"],
    itemsForSpecificEvent: "Weekly match days",
    childChoseAllItems: true,
    receiptsKept: true,
    notes: "Cultural pattern armband choice meaningful. Chervelle observed Jordan's pride.",
  },
  {
    id: "shop-003",
    youngPerson: "yp_casey",
    date: d(-21),
    shopName: "Sensory-friendly clothing online (Casey-led)",
    shopType: "Online (with child involvement)",
    staffEscort: "staff_anna",
    durationMinutes: 60,
    budgetAvailable: 80,
    spend: 72,
    remainingBudgetAfter: 8,
    itemsBought: [
      { item: "Pyjamas (3 identical sets — Casey's preference)", cost: 36, childChose: true, reasonForPurchase: "Replacement — tag-free, soft fabric, sensory-tolerable" },
      { item: "Soft cotton t-shirts (3 in sage green)", cost: 24, childChose: true, reasonForPurchase: "Casey's preferred colour and fabric" },
      { item: "Seamless socks 5-pack", cost: 12, childChose: true, reasonForPurchase: "No seams = sensory tolerable" },
    ],
    childMoodDuring: "Engaged",
    challengesNavigated: [
      "Online shopping protected Casey from busy shop sensory load",
      "Familiar brand chosen — Casey knows what works",
    ],
    staffSupportProvided: "Anna helped with checkout process and shipping address. Casey directed all choices.",
    childComments: "[Pointed at green visual feeling card and at clothes when they arrived]",
    childPride: "Casey unpacked carefully and stored in usual drawer pattern. Visible contentment.",
    itemsForLongTermUse: ["Pyjamas (3 sets)", "T-shirts (3 sage)", "Seamless socks"],
    itemsForSpecificEvent: "",
    childChoseAllItems: true,
    receiptsKept: true,
    notes: "Online avoids sensory overload. Familiar items replicated. Critical accommodation for Casey.",
  },
  {
    id: "shop-004",
    youngPerson: "yp_alex",
    date: d(-30),
    shopName: "Marks & Spencer + Primark",
    shopType: "Department store",
    staffEscort: "staff_anna",
    durationMinutes: 60,
    budgetAvailable: 100,
    spend: 88,
    remainingBudgetAfter: 12,
    itemsBought: [
      { item: "School trousers x2", cost: 40, childChose: true, reasonForPurchase: "Replacement — outgrown" },
      { item: "School shirt x3", cost: 24, childChose: true, reasonForPurchase: "Restocking" },
      { item: "Hoodie (own choice — for after school)", cost: 24, childChose: true, reasonForPurchase: "Style preference; Alex chose colour and brand" },
    ],
    childMoodDuring: "Engaged",
    challengesNavigated: [],
    staffSupportProvided: "Anna supported with budget pacing. Encouraged Alex to choose own hoodie design.",
    childComments: "Got the hoodie I wanted. Mum will think it's a bit dark but I like it.",
    childPride: "",
    itemsForLongTermUse: ["School trousers", "School shirts", "Hoodie"],
    itemsForSpecificEvent: "School uniform refresh",
    childChoseAllItems: true,
    receiptsKept: true,
    notes: "Routine school uniform refresh. Hoodie was Alex's choice — choice respected.",
  },
  {
    id: "shop-005",
    youngPerson: "yp_jordan",
    date: d(-45),
    shopName: "Cultural clothing market — Manchester",
    shopType: "Cultural/Specialist",
    staffEscort: "staff_chervelle",
    durationMinutes: 120,
    budgetAvailable: 80,
    spend: 70,
    remainingBudgetAfter: 10,
    itemsBought: [
      { item: "Cultural-pattern shirt (West African print)", cost: 35, childChose: true, reasonForPurchase: "Cultural identity expression" },
      { item: "Cultural beaded bracelet", cost: 15, childChose: true, reasonForPurchase: "Heritage symbol" },
      { item: "Cultural cooking apron (gift to wear when cooking cultural meals)", cost: 20, childChose: true, reasonForPurchase: "Identity + practical" },
    ],
    childMoodDuring: "Excited",
    challengesNavigated: [],
    staffSupportProvided: "Chervelle (matched cultural background) shared the trip. Cultural mentor recommended specific market.",
    childComments: "Felt like a place where I belong. The lady at the stall told me about the pattern history.",
    childPride: "Wore the shirt to next cultural heritage Saturday club. Met other young people who recognised it.",
    itemsForLongTermUse: ["Cultural shirt", "Beaded bracelet", "Cultural apron"],
    itemsForSpecificEvent: "Cultural Saturday club; cultural cooking sessions",
    childChoseAllItems: true,
    receiptsKept: true,
    notes: "Profoundly meaningful trip. Cultural identity affirmed through real engagement with heritage market. Chervelle's matched background made trip feel safe and authentic.",
  },
  {
    id: "shop-006",
    youngPerson: "yp_casey",
    date: d(-90),
    shopName: "Specialist sensory store + Charity shop",
    shopType: "Sensory-friendly",
    staffEscort: "staff_anna",
    durationMinutes: 75,
    budgetAvailable: 60,
    spend: 48,
    remainingBudgetAfter: 12,
    itemsBought: [
      { item: "Weighted lap pad", cost: 25, childChose: true, reasonForPurchase: "Sensory regulation tool" },
      { item: "Soft fleece blanket (Casey's preferred green)", cost: 15, childChose: true, reasonForPurchase: "Sensory comfort" },
      { item: "Cotton long-sleeve top from charity shop (Casey-specific texture)", cost: 8, childChose: true, reasonForPurchase: "Specific fabric Casey liked" },
    ],
    childMoodDuring: "Selective",
    challengesNavigated: [
      "Charity shop required sensory preparation",
      "Casey took breaks during the trip",
    ],
    staffSupportProvided: "Anna paced trip carefully. Stopped for quiet time mid-trip. Casey directed every choice.",
    childComments: "[Showed thumbs up to lap pad]",
    childPride: "Casey now uses lap pad daily.",
    itemsForLongTermUse: ["Weighted lap pad", "Fleece blanket"],
    itemsForSpecificEvent: "",
    childChoseAllItems: true,
    receiptsKept: true,
    notes: "Sensory-friendly specialist trip. Casey's tolerance for charity shop short — moved quickly.",
  },
];

const moodColour: Record<string, string> = {
  Excited: "bg-amber-100 text-amber-800",
  Engaged: "bg-green-100 text-green-800",
  Selective: "bg-blue-100 text-blue-800",
  Overwhelmed: "bg-red-100 text-red-800",
  Reluctant: "bg-purple-100 text-purple-800",
};

const exportCols: ExportColumn<ShoppingTrip>[] = [
  { header: "Young Person", accessor: (r: ShoppingTrip) => getYPName(r.youngPerson) },
  { header: "Date", accessor: (r: ShoppingTrip) => r.date },
  { header: "Shop", accessor: (r: ShoppingTrip) => r.shopName },
  { header: "Type", accessor: (r: ShoppingTrip) => r.shopType },
  { header: "Spend £", accessor: (r: ShoppingTrip) => `£${r.spend}` },
  { header: "Budget £", accessor: (r: ShoppingTrip) => `£${r.budgetAvailable}` },
  { header: "Items", accessor: (r: ShoppingTrip) => String(r.itemsBought.length) },
  { header: "All Child-Chosen", accessor: (r: ShoppingTrip) => r.childChoseAllItems ? "Yes" : "No" },
];

export default function ChildClothingShoppingTripsPage() {
  const [filterYP, setFilterYP] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((s) => s.youngPerson === filterYP);
    if (filterType !== "all") items = items.filter((s) => s.shopType === filterType);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "spend":
          return b.spend - a.spend;
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, filterType, sortBy]);

  const total = data.length;
  const totalSpend = data.reduce((sum, s) => sum + s.spend, 0);
  const allChildChose = data.every((s) => s.childChoseAllItems);
  const totalItems = data.reduce((sum, s) => sum + s.itemsBought.length, 0);

  return (
    <PageShell
      title="Clothing Shopping Trips"
      subtitle="Records of clothing and personal-item shopping with children — choice, dignity, identity"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="clothing-shopping-trips" />
          <PrintButton title="Clothing Shopping Trips" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Recent Trips</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allChildChose ? "100%" : `${data.filter((s) => s.childChoseAllItems).length}/${total}`}</p>
          <p className="text-xs text-muted-foreground">Child-Chosen</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{totalItems}</p>
          <p className="text-xs text-muted-foreground">Items Bought</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">£{totalSpend}</p>
          <p className="text-xs text-muted-foreground">Total Investment</p>
        </div>
      </div>

      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3 mb-6 flex items-start gap-2">
        <Heart className="h-4 w-4 text-pink-600 mt-0.5 shrink-0" />
        <p className="text-sm text-pink-800">
          Shopping is more than transaction — it&apos;s identity, choice, and dignity. Children choose their
          own clothes within budget. Trips are paced to the child (sensory, energy). Staff support without
          steering. Cultural identity, sport identity, sensory needs all shape choices.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Shop Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Shop Types</SelectItem>
            <SelectItem value="High street">High Street</SelectItem>
            <SelectItem value="Sports specialist">Sports</SelectItem>
            <SelectItem value="Department store">Department</SelectItem>
            <SelectItem value="Cultural/Specialist">Cultural</SelectItem>
            <SelectItem value="Sensory-friendly">Sensory</SelectItem>
            <SelectItem value="Online (with child involvement)">Online (Child-Led)</SelectItem>
            <SelectItem value="Charity shop">Charity Shop</SelectItem>
            <SelectItem value="Independent boutique">Independent</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="spend">Highest Spend</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((s) => {
          const isExpanded = expandedId === s.id;

          return (
            <div key={s.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : s.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Shirt className="h-5 w-5 text-pink-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(s.youngPerson)} — {s.shopName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.date} &middot; {s.itemsBought.length} items &middot; £{s.spend}/£{s.budgetAvailable}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", moodColour[s.childMoodDuring])}>{s.childMoodDuring}</span>
                  {s.childChoseAllItems && <Sparkles className="h-4 w-4 text-amber-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Items Bought</p>
                    <div className="space-y-1">
                      {s.itemsBought.map((it, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{it.item}</span>
                            <span>£{it.cost}{it.childChose && <Star className="h-3 w-3 inline ml-1 text-amber-500" />}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{it.reasonForPurchase}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Child&apos;s Comments</p>
                    <p className="text-sm italic">&ldquo;{s.childComments}&rdquo;</p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Staff Support</p>
                    <p className="text-sm">{s.staffSupportProvided}</p>
                  </div>

                  {s.challengesNavigated.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Challenges Navigated</p>
                      <ul className="space-y-1">
                        {s.challengesNavigated.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {s.childPride && (
                    <div className="bg-pink-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">
                        <Sparkles className="h-3 w-3 inline mr-1" />Child&apos;s Pride
                      </p>
                      <p className="text-sm">{s.childPride}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Wallet className="h-3 w-3 inline mr-1" />£{s.spend} of £{s.budgetAvailable} (remaining £{s.remainingBudgetAfter})</span>
                    <span><Clock className="h-3 w-3 inline mr-1" />{s.durationMinutes} mins</span>
                    <span>Staff: {getStaffName(s.staffEscort)}</span>
                    {s.itemsForSpecificEvent && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">For: {s.itemsForSpecificEvent}</span>}
                  </div>

                  {s.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm">{s.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Clothing trip records support Quality Standard 1 (child-centred
          care), Quality Standard 7 (health and wellbeing), and dignity in everyday choices. Each child has
          an annual clothing budget; choices are theirs within budget. Linked to Clothing Allowances,
          Cultural Identity, Sensory Profiles, and Personal Belongings.
        </p>
      </div>
    </PageShell>
  );
}
