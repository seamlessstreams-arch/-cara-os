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
  Wallet,
  Utensils,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WeekRecord {
  id: string;
  weekStarting: string;
  weeklyBudget: number;
  spend: { category: string; amount: number; supplier: string; receiptKept: boolean }[];
  totalSpent: number;
  variance: number;
  childInvolvementInPlanning: string;
  childInvolvementInShopping: string;
  culturalIngredientsIncluded: boolean;
  sensoryFriendlyOptionsIncluded: boolean;
  takeawaysOrTreats: { date: string; item: string; cost: number; reason: string }[];
  cookFromScratchProportion: number;
  wasteNoted: string;
  shoppedBy: string;
  cookedBy: string;
  childMealRequestsHonoured: string[];
  notes: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: WeekRecord[] = [
  {
    id: "fb-001",
    weekStarting: d(-7),
    weeklyBudget: 280,
    spend: [
      { category: "Main supermarket shop (Tesco)", amount: 195, supplier: "Tesco", receiptKept: true },
      { category: "Cultural ingredients (specialist shop)", amount: 28, supplier: "African Foods Manchester", receiptKept: true },
      { category: "Bread & milk top-ups", amount: 18, supplier: "Local convenience", receiptKept: true },
      { category: "Fresh fruit/veg market", amount: 22, supplier: "Riverside market", receiptKept: true },
    ],
    totalSpent: 263,
    variance: -17,
    childInvolvementInPlanning: "Children's meeting Monday — meal preferences gathered. Casey's safe foods stocked. Jordan's cultural Sunday lunch agreed.",
    childInvolvementInShopping: "Jordan accompanied Chervelle to cultural shop. Alex came to Tesco shop for snack choices.",
    culturalIngredientsIncluded: true,
    sensoryFriendlyOptionsIncluded: true,
    takeawaysOrTreats: [
      { date: d(-3), item: "Pizza for Saturday after football win", cost: 25, reason: "Celebration" },
    ],
    cookFromScratchProportion: 80,
    wasteNoted: "Minimal — bread used for breadcrumbs; veg for soup",
    shoppedBy: "staff_anna + staff_chervelle",
    cookedBy: "Various — Jordan cooked twice (cultural + supervised)",
    childMealRequestsHonoured: [
      "Casey's blue-bowl Cheerios consistent",
      "Jordan's jollof rice on Sunday",
      "Alex's chicken curry midweek",
    ],
    notes: "Strong week. Cultural meal genuinely cultural. Casey's safe foods all in stock. Under budget.",
  },
  {
    id: "fb-002",
    weekStarting: d(-14),
    weeklyBudget: 280,
    spend: [
      { category: "Main supermarket shop", amount: 210, supplier: "Tesco", receiptKept: true },
      { category: "Bread & milk top-ups", amount: 22, supplier: "Local convenience", receiptKept: true },
      { category: "Fresh fruit/veg market", amount: 28, supplier: "Riverside market", receiptKept: true },
      { category: "Specialist cake supplies for Casey art event treat", amount: 15, supplier: "Bakery", receiptKept: true },
    ],
    totalSpent: 275,
    variance: -5,
    childInvolvementInPlanning: "Standard children's meeting input.",
    childInvolvementInShopping: "Alex joined main shop. Casey at home (chose safe foods to add to list).",
    culturalIngredientsIncluded: false,
    sensoryFriendlyOptionsIncluded: true,
    takeawaysOrTreats: [
      { date: d(-10), item: "Fish and chips", cost: 22, reason: "Friday treat" },
    ],
    cookFromScratchProportion: 75,
    wasteNoted: "Minor — apples turned over to Alex for snack making",
    shoppedBy: "staff_anna",
    cookedBy: "Various staff",
    childMealRequestsHonoured: [
      "Casey's safe foods consistent",
      "Alex requested chicken stir-fry",
    ],
    notes: "Routine week. Cake supplies for Casey's art exhibition celebration valued.",
  },
  {
    id: "fb-003",
    weekStarting: d(-21),
    weeklyBudget: 280,
    spend: [
      { category: "Main supermarket shop", amount: 245, supplier: "Tesco", receiptKept: true },
      { category: "Cultural ingredients", amount: 32, supplier: "African Foods Manchester", receiptKept: true },
      { category: "Bread & milk top-ups", amount: 20, supplier: "Local convenience", receiptKept: true },
      { category: "Fresh fruit/veg market", amount: 25, supplier: "Riverside market", receiptKept: true },
      { category: "Special celebration (Alex boxing win)", amount: 35, supplier: "Pizza place", receiptKept: true },
    ],
    totalSpent: 357,
    variance: 77,
    childInvolvementInPlanning: "Jordan led cultural meal planning",
    childInvolvementInShopping: "Jordan and Chervelle to cultural shop; Alex chose pizza toppings",
    culturalIngredientsIncluded: true,
    sensoryFriendlyOptionsIncluded: true,
    takeawaysOrTreats: [
      { date: d(-18), item: "Pizza party for Alex's boxing win", cost: 35, reason: "Celebration — agreed by all" },
      { date: d(-16), item: "Ice cream van", cost: 8, reason: "Saturday treat" },
    ],
    cookFromScratchProportion: 70,
    wasteNoted: "Some left from the pizza — eaten the next day",
    shoppedBy: "staff_anna + staff_chervelle",
    cookedBy: "Various + cultural session with Jordan",
    childMealRequestsHonoured: [
      "All children's standard requests",
      "Special celebration food Alex chose",
    ],
    notes: "Over budget by £77 due to celebration event. Approved by RM. Worth it for relational moment.",
  },
  {
    id: "fb-004",
    weekStarting: d(-28),
    weeklyBudget: 280,
    spend: [
      { category: "Main supermarket shop", amount: 180, supplier: "Tesco", receiptKept: true },
      { category: "Bread & milk top-ups", amount: 18, supplier: "Local convenience", receiptKept: true },
      { category: "Fresh fruit/veg market", amount: 22, supplier: "Riverside market", receiptKept: true },
      { category: "Cooking session — extra ingredients", amount: 12, supplier: "Tesco", receiptKept: true },
    ],
    totalSpent: 232,
    variance: -48,
    childInvolvementInPlanning: "Standard input. Jordan didn't lead this week (football intensive).",
    childInvolvementInShopping: "Anna only — children at school during shop",
    culturalIngredientsIncluded: false,
    sensoryFriendlyOptionsIncluded: true,
    takeawaysOrTreats: [],
    cookFromScratchProportion: 90,
    wasteNoted: "Very low this week — good planning",
    shoppedBy: "staff_anna",
    cookedBy: "Various",
    childMealRequestsHonoured: [
      "Casey's safe foods",
      "Alex's regular requests",
      "Jordan's match-day porridge",
    ],
    notes: "Under budget — efficient week. No takeaways; cook-from-scratch high. Healthy week.",
  },
];

const exportCols: ExportColumn<WeekRecord>[] = [
  { header: "Week", accessor: (r: WeekRecord) => r.weekStarting },
  { header: "Budget £", accessor: (r: WeekRecord) => `£${r.weeklyBudget}` },
  { header: "Spent £", accessor: (r: WeekRecord) => `£${r.totalSpent}` },
  { header: "Variance £", accessor: (r: WeekRecord) => `${r.variance > 0 ? "+" : ""}£${r.variance}` },
  { header: "Cook-from-scratch %", accessor: (r: WeekRecord) => `${r.cookFromScratchProportion}%` },
  { header: "Cultural", accessor: (r: WeekRecord) => r.culturalIngredientsIncluded ? "Yes" : "No" },
  { header: "Sensory-friendly", accessor: (r: WeekRecord) => r.sensoryFriendlyOptionsIncluded ? "Yes" : "No" },
];

export default function FoodBudgetTrackerPage() {
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const items = [...data];
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.weekStarting.localeCompare(a.weekStarting);
        case "spend":
          return b.totalSpent - a.totalSpent;
        case "variance":
          return Math.abs(b.variance) - Math.abs(a.variance);
        default:
          return 0;
      }
    });
    return items;
  }, [sortBy]);

  const total = data.length;
  const totalSpend = data.reduce((sum, w) => sum + w.totalSpent, 0);
  const totalBudget = data.reduce((sum, w) => sum + w.weeklyBudget, 0);
  const avgVariance = (data.reduce((sum, w) => sum + w.variance, 0) / data.length).toFixed(0);
  const culturalWeeks = data.filter((w) => w.culturalIngredientsIncluded).length;

  return (
    <PageShell
      title="Food Budget Tracker"
      subtitle="Weekly food budget — child involvement, cultural representation, sensory inclusion, and value"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="food-budget-tracker" />
          <PrintButton title="Food Budget Tracker" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Weeks Logged</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">£{totalSpend}</p>
          <p className="text-xs text-muted-foreground">Spent (of £{totalBudget})</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold flex items-center justify-center gap-1", parseInt(avgVariance) > 0 ? "text-amber-600" : "text-green-600")}>
            {parseInt(avgVariance) > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            {parseInt(avgVariance) > 0 ? "+" : ""}£{avgVariance}
          </p>
          <p className="text-xs text-muted-foreground">Avg Weekly Variance</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{culturalWeeks}/{total}</p>
          <p className="text-xs text-muted-foreground">Cultural Weeks</p>
        </div>
      </div>

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-6 flex items-start gap-2">
        <Utensils className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          Food is care, identity, and culture. We track the budget but also what it represents — children
          involved in planning, cultural meals normal, sensory needs respected, and special moments
          celebrated even when they push the line. Figures illustrative.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="spend">Highest Spend</SelectItem>
              <SelectItem value="variance">Largest Variance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((w) => {
          const isExpanded = expandedId === w.id;

          return (
            <div key={w.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : w.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Utensils className="h-5 w-5 text-amber-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">Week starting {w.weekStarting}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Spent £{w.totalSpent} of £{w.weeklyBudget} &middot; {w.cookFromScratchProportion}% cook-from-scratch
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-sm font-bold", w.variance < 0 ? "text-green-600" : w.variance > 50 ? "text-red-600" : "text-amber-600")}>
                    {w.variance > 0 ? "+" : ""}£{w.variance}
                  </span>
                  {w.culturalIngredientsIncluded && <Sparkles className="h-4 w-4 text-purple-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Spend Breakdown</p>
                    <div className="space-y-1">
                      {w.spend.map((s, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-center justify-between">
                          <div>
                            <p className="font-medium">{s.category}</p>
                            <p className="text-xs text-muted-foreground">{s.supplier}</p>
                          </div>
                          <span className="font-medium">£{s.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">Children&apos;s Meal Requests Honoured</p>
                    <ul className="space-y-1">
                      {w.childMealRequestsHonoured.map((m, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Sparkles className="h-3 w-3 text-pink-500 mt-1 shrink-0" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Child Involvement — Planning</p>
                      <p className="text-sm">{w.childInvolvementInPlanning}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Child Involvement — Shopping</p>
                      <p className="text-sm">{w.childInvolvementInShopping}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className={cn("rounded-lg p-2 text-center text-sm", w.culturalIngredientsIncluded ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600")}>
                      Cultural: {w.culturalIngredientsIncluded ? "Yes" : "No"}
                    </div>
                    <div className={cn("rounded-lg p-2 text-center text-sm", w.sensoryFriendlyOptionsIncluded ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800")}>
                      Sensory: {w.sensoryFriendlyOptionsIncluded ? "Yes" : "Check"}
                    </div>
                    <div className="bg-blue-50 text-blue-800 rounded-lg p-2 text-center text-sm">
                      Cook %: {w.cookFromScratchProportion}%
                    </div>
                    <div className="bg-purple-50 text-purple-800 rounded-lg p-2 text-center text-sm">
                      Treats: {w.takeawaysOrTreats.length}
                    </div>
                  </div>

                  {w.takeawaysOrTreats.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Takeaways &amp; Treats</p>
                      <div className="space-y-1">
                        {w.takeawaysOrTreats.map((t, i) => (
                          <div key={i} className="text-sm">
                            <p className="font-medium">{t.date}: {t.item} (£{t.cost})</p>
                            <p className="text-xs text-muted-foreground">{t.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-50 rounded-lg p-3 border text-sm">
                    <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Waste &amp; Efficiency</p>
                    <p>{w.wasteNoted}</p>
                  </div>

                  {w.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm">{w.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Wallet className="h-3 w-3 inline mr-1" />Budget £{w.weeklyBudget}</span>
                    <span>Shopped: {w.shoppedBy}</span>
                    <span>Cooked: {w.cookedBy}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Food budget tracking supports Quality Standard 7 (health
          and wellbeing — nutrition), Quality Standard 1 (child-centred care — preferences), Quality
          Standard 6 (relationships — shared meals), and financial governance. Linked to Menu Planning,
          Dietary Requirements, Kitchen Hygiene Monitoring, Cultural Identity, and Sensory Profiles.
        </p>
      </div>
    </PageShell>
  );
}
