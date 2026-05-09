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
import type { ClothingShoppingTrip, ClothingShopType, ShoppingMood } from "@/types/extended";
import { CLOTHING_SHOP_TYPE_LABEL, SHOPPING_MOOD_LABEL } from "@/types/extended";
import { useClothingShoppingTrips } from "@/hooks/use-clothing-shopping-trips";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const moodColour: Record<ShoppingMood, string> = {
  excited: "bg-amber-100 text-amber-800",
  engaged: "bg-green-100 text-green-800",
  selective: "bg-blue-100 text-blue-800",
  overwhelmed: "bg-red-100 text-red-800",
  reluctant: "bg-purple-100 text-purple-800",
};

const exportCols: ExportColumn<ClothingShoppingTrip>[] = [
  { header: "Young Person", accessor: (r: ClothingShoppingTrip) => getYPName(r.child_id) },
  { header: "Date", accessor: (r: ClothingShoppingTrip) => r.date },
  { header: "Shop", accessor: (r: ClothingShoppingTrip) => r.shop_name },
  { header: "Type", accessor: (r: ClothingShoppingTrip) => CLOTHING_SHOP_TYPE_LABEL[r.shop_type] },
  { header: "Spend £", accessor: (r: ClothingShoppingTrip) => `£${r.spend}` },
  { header: "Budget £", accessor: (r: ClothingShoppingTrip) => `£${r.budget_available}` },
  { header: "Items", accessor: (r: ClothingShoppingTrip) => String(r.items_bought.length) },
  { header: "All Child-Chosen", accessor: (r: ClothingShoppingTrip) => r.child_chose_all_items ? "Yes" : "No" },
];

export default function ChildClothingShoppingTripsPage() {
  const { data: res, isLoading } = useClothingShoppingTrips();
  const data = res?.data ?? [];

  const [filterYP, setFilterYP] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((s) => s.child_id === filterYP);
    if (filterType !== "all") items = items.filter((s) => s.shop_type === filterType);
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
  }, [data, filterYP, filterType, sortBy]);

  const total = data.length;
  const totalSpend = data.reduce((sum, s) => sum + s.spend, 0);
  const allChildChose = data.every((s) => s.child_chose_all_items);
  const totalItems = data.reduce((sum, s) => sum + s.items_bought.length, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

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
          <p className="text-2xl font-bold text-green-600">{allChildChose ? "100%" : `${data.filter((s) => s.child_chose_all_items).length}/${total}`}</p>
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
            <SelectItem value="high_street">High Street</SelectItem>
            <SelectItem value="sports_specialist">Sports</SelectItem>
            <SelectItem value="department_store">Department</SelectItem>
            <SelectItem value="cultural_specialist">Cultural</SelectItem>
            <SelectItem value="sensory_friendly">Sensory</SelectItem>
            <SelectItem value="online_child_involvement">Online (Child-Led)</SelectItem>
            <SelectItem value="charity_shop">Charity Shop</SelectItem>
            <SelectItem value="independent_boutique">Independent</SelectItem>
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
                    <p className="font-medium truncate">{getYPName(s.child_id)} — {s.shop_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.date} &middot; {s.items_bought.length} items &middot; £{s.spend}/£{s.budget_available}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", moodColour[s.child_mood_during])}>{SHOPPING_MOOD_LABEL[s.child_mood_during]}</span>
                  {s.child_chose_all_items && <Sparkles className="h-4 w-4 text-amber-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Items Bought</p>
                    <div className="space-y-1">
                      {s.items_bought.map((it, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{it.item}</span>
                            <span>£{it.cost}{it.child_chose && <Star className="h-3 w-3 inline ml-1 text-amber-500" />}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{it.reason_for_purchase}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Child&apos;s Comments</p>
                    <p className="text-sm italic">&ldquo;{s.child_comments}&rdquo;</p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Staff Support</p>
                    <p className="text-sm">{s.staff_support_provided}</p>
                  </div>

                  {s.challenges_navigated.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Challenges Navigated</p>
                      <ul className="space-y-1">
                        {s.challenges_navigated.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {s.child_pride && (
                    <div className="bg-pink-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">
                        <Sparkles className="h-3 w-3 inline mr-1" />Child&apos;s Pride
                      </p>
                      <p className="text-sm">{s.child_pride}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Wallet className="h-3 w-3 inline mr-1" />£{s.spend} of £{s.budget_available} (remaining £{s.remaining_budget_after})</span>
                    <span><Clock className="h-3 w-3 inline mr-1" />{s.duration_minutes} mins</span>
                    <span>Staff: {getStaffName(s.staff_escort)}</span>
                    {s.items_for_specific_event && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">For: {s.items_for_specific_event}</span>}
                  </div>

                  {s.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm">{s.notes}</p>
                    </div>
                  )}

                  <SmartLinkPanel sourceType="clothing-shopping-trip" sourceId={s.id} childId={s.child_id} compact />
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
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
