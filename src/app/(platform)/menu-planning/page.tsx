"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import {
  ArrowUpDown, ChevronDown, ChevronUp, Plus, Search,
  UtensilsCrossed, Calendar, Clock, Leaf, AlertTriangle,
  Heart, ThumbsUp, ThumbsDown, Star
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "supper";
type DietaryFlag = "vegetarian" | "vegan" | "halal" | "gluten_free" | "dairy_free" | "nut_free" | "none";

interface MealPlan {
  id: string;
  date: string;
  meal: MealType;
  mainDish: string;
  sides: string[];
  dessert: string;
  dietaryFlags: DietaryFlag[];
  preparedBy: string;
  childPreferences: { childId: string; rating: "liked" | "disliked" | "not_eaten" }[];
  specialNotes: string;
  budget: number;
  leftoverAction: string;
  createdAt: string;
}

const MEAL_META: Record<MealType, { label: string; icon: React.ReactNode; time: string }> = {
  breakfast: { label: "Breakfast", icon: <Clock className="h-4 w-4" />,               time: "7:30 AM" },
  lunch:     { label: "Lunch",     icon: <UtensilsCrossed className="h-4 w-4" />,      time: "12:30 PM" },
  dinner:    { label: "Dinner",    icon: <UtensilsCrossed className="h-4 w-4" />,      time: "5:30 PM" },
  snack:     { label: "Snack",     icon: <Star className="h-4 w-4" />,                 time: "3:30 PM" },
  supper:    { label: "Supper",    icon: <Clock className="h-4 w-4" />,                time: "8:00 PM" },
};

const DIETARY_META: Record<DietaryFlag, { label: string; color: string }> = {
  vegetarian:  { label: "Vegetarian",  color: "bg-green-100 text-green-800" },
  vegan:       { label: "Vegan",       color: "bg-emerald-100 text-emerald-800" },
  halal:       { label: "Halal",       color: "bg-blue-100 text-blue-800" },
  gluten_free: { label: "Gluten Free", color: "bg-amber-100 text-amber-800" },
  dairy_free:  { label: "Dairy Free",  color: "bg-purple-100 text-purple-800" },
  nut_free:    { label: "Nut Free",    color: "bg-red-100 text-red-800" },
  none:        { label: "Standard",    color: "bg-gray-100 text-gray-800" },
};

// ── Seed data ────────────────────────────────────────────────────────────────
const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: MealPlan[] = [
  {
    id: "mp_001", date: d(0), meal: "breakfast", mainDish: "Scrambled eggs on toast",
    sides: ["Fresh orange juice", "Fruit bowl"], dessert: "", dietaryFlags: ["none"],
    preparedBy: "staff_anna",
    childPreferences: [
      { childId: "yp_alex", rating: "liked" },
      { childId: "yp_jordan", rating: "liked" },
      { childId: "yp_casey", rating: "not_eaten" },
    ],
    specialNotes: "Casey had cereal instead — not hungry this morning.", budget: 4.50, leftoverAction: "", createdAt: d(0),
  },
  {
    id: "mp_002", date: d(0), meal: "lunch", mainDish: "Chicken wraps with salad",
    sides: ["Tortilla chips", "Coleslaw"], dessert: "Yoghurt", dietaryFlags: ["none"],
    preparedBy: "staff_chervelle",
    childPreferences: [
      { childId: "yp_alex", rating: "liked" },
      { childId: "yp_jordan", rating: "liked" },
      { childId: "yp_casey", rating: "liked" },
    ],
    specialNotes: "All three YP helped prepare the wraps.", budget: 7.20, leftoverAction: "Wrapped and stored for tomorrow", createdAt: d(0),
  },
  {
    id: "mp_003", date: d(0), meal: "dinner", mainDish: "Spaghetti Bolognese",
    sides: ["Garlic bread", "Side salad"], dessert: "Ice cream", dietaryFlags: ["none"],
    preparedBy: "staff_darren",
    childPreferences: [
      { childId: "yp_alex", rating: "liked" },
      { childId: "yp_jordan", rating: "liked" },
      { childId: "yp_casey", rating: "liked" },
    ],
    specialNotes: "Alex helped cook — part of independence goal. Made enough for seconds.", budget: 9.80, leftoverAction: "Portioned for freezer", createdAt: d(0),
  },
  {
    id: "mp_004", date: d(-1), meal: "dinner", mainDish: "Taco night",
    sides: ["Mexican rice", "Refried beans", "Salsa & guacamole"], dessert: "Churros", dietaryFlags: ["none"],
    preparedBy: "staff_ryan",
    childPreferences: [
      { childId: "yp_alex", rating: "liked" },
      { childId: "yp_jordan", rating: "liked" },
      { childId: "yp_casey", rating: "liked" },
    ],
    specialNotes: "Jordan's suggestion from house meeting. Great success — everyone wanted seconds.", budget: 12.50, leftoverAction: "All eaten!", createdAt: d(-1),
  },
  {
    id: "mp_005", date: d(-1), meal: "lunch", mainDish: "Tomato soup with crusty bread",
    sides: ["Cheese on toast"], dessert: "Apple", dietaryFlags: ["vegetarian"],
    preparedBy: "staff_anna",
    childPreferences: [
      { childId: "yp_alex", rating: "liked" },
      { childId: "yp_jordan", rating: "disliked" },
      { childId: "yp_casey", rating: "liked" },
    ],
    specialNotes: "Jordan had a sandwich instead — doesn't like tomato soup.", budget: 5.00, leftoverAction: "Stored in fridge", createdAt: d(-1),
  },
  {
    id: "mp_006", date: d(1), meal: "dinner", mainDish: "Roast chicken with roast potatoes",
    sides: ["Steamed broccoli", "Carrots", "Gravy"], dessert: "Apple crumble with custard", dietaryFlags: ["none"],
    preparedBy: "staff_darren",
    childPreferences: [],
    specialNotes: "Alex's roast dinner — part of cooking independence goal. Staff to supervise but Alex leads.", budget: 14.00, leftoverAction: "", createdAt: d(0),
  },
  {
    id: "mp_007", date: d(1), meal: "lunch", mainDish: "Jacket potatoes with fillings",
    sides: ["Beans", "Cheese", "Tuna mayo"], dessert: "Fruit salad", dietaryFlags: ["vegetarian", "gluten_free"],
    preparedBy: "staff_chervelle",
    childPreferences: [],
    specialNotes: "Build-your-own style — YP choose their own fillings.", budget: 6.00, leftoverAction: "", createdAt: d(0),
  },
  {
    id: "mp_008", date: d(2), meal: "dinner", mainDish: "Fish fingers, chips, and peas",
    sides: ["Baked beans", "Ketchup"], dessert: "Jelly", dietaryFlags: ["none"],
    preparedBy: "staff_edward",
    childPreferences: [],
    specialNotes: "Comfort food night — Jordan's favourite.", budget: 7.50, leftoverAction: "", createdAt: d(0),
  },
  {
    id: "mp_009", date: d(-2), meal: "dinner", mainDish: "Vegetable stir-fry with noodles",
    sides: ["Prawn crackers", "Spring rolls"], dessert: "Banana", dietaryFlags: ["vegetarian"],
    preparedBy: "staff_anna",
    childPreferences: [
      { childId: "yp_alex", rating: "liked" },
      { childId: "yp_jordan", rating: "disliked" },
      { childId: "yp_casey", rating: "liked" },
    ],
    specialNotes: "Jordan had chicken added to theirs. Alex's second time cooking stir-fry — much improved.", budget: 8.40, leftoverAction: "None left", createdAt: d(-2),
  },
  {
    id: "mp_010", date: d(-2), meal: "breakfast", mainDish: "Pancakes with maple syrup",
    sides: ["Fresh berries", "Banana"], dessert: "", dietaryFlags: ["vegetarian"],
    preparedBy: "staff_darren",
    childPreferences: [
      { childId: "yp_alex", rating: "liked" },
      { childId: "yp_jordan", rating: "liked" },
      { childId: "yp_casey", rating: "liked" },
    ],
    specialNotes: "Weekend treat. All three YP got up for breakfast — unusual for a Saturday!", budget: 5.50, leftoverAction: "", createdAt: d(-2),
  },
];

// ── Export ────────────────────────────────────────────────────────────────────
const EXPORT_COLS: ExportColumn<MealPlan>[] = [
  { header: "ID",              accessor: (r: MealPlan) => r.id },
  { header: "Date",            accessor: (r: MealPlan) => r.date },
  { header: "Meal",            accessor: (r: MealPlan) => MEAL_META[r.meal].label },
  { header: "Main Dish",       accessor: (r: MealPlan) => r.mainDish },
  { header: "Sides",           accessor: (r: MealPlan) => r.sides.join(", ") },
  { header: "Dessert",         accessor: (r: MealPlan) => r.dessert || "—" },
  { header: "Dietary",         accessor: (r: MealPlan) => r.dietaryFlags.map((f: DietaryFlag) => DIETARY_META[f].label).join(", ") },
  { header: "Prepared By",     accessor: (r: MealPlan) => getStaffName(r.preparedBy) },
  { header: "Budget",          accessor: (r: MealPlan) => `£${r.budget.toFixed(2)}` },
  { header: "Likes",           accessor: (r: MealPlan) => String(r.childPreferences.filter((p: { childId: string; rating: string }) => p.rating === "liked").length) },
  { header: "Notes",           accessor: (r: MealPlan) => r.specialNotes },
  { header: "Leftovers",       accessor: (r: MealPlan) => r.leftoverAction || "—" },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function MenuPlanningPage() {
  const [meals, setMeals] = useState<MealPlan[]>(SEED);
  const [search, setSearch] = useState("");
  const [mealFilter, setMealFilter] = useState("all");
  const [tab, setTab] = useState("upcoming");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let list = [...meals];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((m) => m.mainDish.toLowerCase().includes(s) || m.sides.some((si) => si.toLowerCase().includes(s)) || m.specialNotes.toLowerCase().includes(s));
    }
    if (mealFilter !== "all") list = list.filter((m) => m.meal === mealFilter);
    if (tab === "upcoming") list = list.filter((m) => m.date >= d(0));
    if (tab === "past") list = list.filter((m) => m.date < d(0));

    list.sort((a, b) => {
      switch (sortBy) {
        case "date":   return tab === "past" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
        case "meal":   return MEAL_META[a.meal].label.localeCompare(MEAL_META[b.meal].label);
        case "budget": return b.budget - a.budget;
        default:       return 0;
      }
    });
    return list;
  }, [meals, search, mealFilter, tab, sortBy]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = meals.length;
    const weekBudget = meals.filter((m) => m.date >= d(-7)).reduce((a, m) => a + m.budget, 0);
    const allRatings = meals.flatMap((m) => m.childPreferences);
    const liked = allRatings.filter((r) => r.rating === "liked").length;
    const satisfaction = allRatings.length > 0 ? Math.round((liked / allRatings.length) * 100) : 0;
    const upcoming = meals.filter((m) => m.date >= d(0)).length;
    return { total, weekBudget, satisfaction, upcoming };
  }, [meals]);

  return (
    <PageShell
      title="Menu Planning"
      subtitle="Nutritious meals, dietary needs, and children&apos;s food preferences"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Menu Planning" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="menu-planning" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Add Meal</Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── Stats strip ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Meals",      value: stats.total,                        icon: <UtensilsCrossed className="h-4 w-4" />, color: "text-blue-600" },
            { label: "Week Budget",       value: `£${stats.weekBudget.toFixed(2)}`, icon: <Star className="h-4 w-4" />,            color: "text-green-600" },
            { label: "Satisfaction",      value: `${stats.satisfaction}%`,           icon: <Heart className="h-4 w-4" />,           color: "text-pink-600" },
            { label: "Upcoming Planned",  value: stats.upcoming,                    icon: <Calendar className="h-4 w-4" />,        color: "text-purple-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-muted", s.color)}>{s.icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search meals…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={mealFilter} onValueChange={setMealFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Meal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Meals</SelectItem>
              {Object.entries(MEAL_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="meal">Meal Type</SelectItem>
                <SelectItem value="budget">Budget</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Meal list ────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No meals match your filters.</p>}
          {filtered.map((m) => {
            const open = !!expanded[m.id];
            const mealM = MEAL_META[m.meal];
            const liked = m.childPreferences.filter((p) => p.rating === "liked").length;
            const disliked = m.childPreferences.filter((p) => p.rating === "disliked").length;
            const isFuture = m.date >= d(0);
            return (
              <Card key={m.id} className={cn("border-l-4", m.meal === "dinner" ? "border-l-orange-400" : m.meal === "lunch" ? "border-l-blue-400" : m.meal === "breakfast" ? "border-l-amber-400" : "border-l-green-400")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => toggle(m.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant="outline" className="text-xs">{mealM.icon}<span className="ml-1">{mealM.label}</span></Badge>
                        {m.dietaryFlags.filter((f) => f !== "none").map((f) => (
                          <Badge key={f} className={cn("text-xs", DIETARY_META[f].color)}>{DIETARY_META[f].label}</Badge>
                        ))}
                        {isFuture && <Badge className="bg-blue-100 text-blue-700 text-xs">Planned</Badge>}
                      </div>
                      <p className="font-semibold">{m.mainDish}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>{m.date}</span>
                        <span>{mealM.time}</span>
                        <span>Prepared by {getStaffName(m.preparedBy)}</span>
                        <span>£{m.budget.toFixed(2)}</span>
                      </div>
                      {m.childPreferences.length > 0 && (
                        <div className="flex items-center gap-3 mt-1 text-xs">
                          {liked > 0 && <span className="flex items-center gap-1 text-green-600"><ThumbsUp className="h-3 w-3" /> {liked}</span>}
                          {disliked > 0 && <span className="flex items-center gap-1 text-red-600"><ThumbsDown className="h-3 w-3" /> {disliked}</span>}
                        </div>
                      )}
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />}
                  </div>

                  {open && (
                    <div className="mt-4 space-y-3 border-t pt-3 text-sm">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Main Dish</p>
                          <p>{m.mainDish}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Sides</p>
                          <div className="flex flex-wrap gap-1">{m.sides.map((s, i) => <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>)}</div>
                        </div>
                        {m.dessert && (
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Dessert</p>
                            <p>{m.dessert}</p>
                          </div>
                        )}
                      </div>
                      {m.childPreferences.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Children&apos;s Feedback</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {m.childPreferences.map((p, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <span>{getYPName(p.childId)}</span>
                                {p.rating === "liked" && <ThumbsUp className="h-3 w-3 text-green-600" />}
                                {p.rating === "disliked" && <ThumbsDown className="h-3 w-3 text-red-600" />}
                                {p.rating === "not_eaten" && <span className="text-muted-foreground">Did not eat</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {m.specialNotes && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Notes</p>
                          <p className="italic text-muted-foreground">{m.specialNotes}</p>
                        </div>
                      )}
                      {m.leftoverAction && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Leaf className="h-3.5 w-3.5" />
                          <span>Leftovers: {m.leftoverAction}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Guidance note ────────────────────────────────────────────────── */}
        <Card className="bg-muted/40">
          <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
            <UtensilsCrossed className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Meals should be nutritious, varied, and reflect children&apos;s cultural and dietary needs. Children should be involved in menu planning and food preparation where possible. Food preferences and dietary requirements must be recorded and reviewed regularly. Reg 44 visitors may ask about meal variety and children&apos;s involvement.
            </span>
          </CardContent>
        </Card>
      </div>

      {/* ── New meal dialog ───────────────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Meal Plan</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); setShowNew(false); }} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input type="date" />
              </div>
              <div>
                <label className="text-sm font-medium">Meal</label>
                <Select><SelectTrigger><SelectValue placeholder="Select meal" /></SelectTrigger>
                  <SelectContent>{Object.entries(MEAL_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Main Dish</label>
              <Input placeholder="What's the main course?" />
            </div>
            <div>
              <label className="text-sm font-medium">Sides</label>
              <Input placeholder="Comma-separated sides" />
            </div>
            <div>
              <label className="text-sm font-medium">Dessert</label>
              <Input placeholder="Dessert (optional)" />
            </div>
            <div>
              <label className="text-sm font-medium">Budget (£)</label>
              <Input type="number" step="0.01" placeholder="0.00" />
            </div>
            <div>
              <label className="text-sm font-medium">Prepared By</label>
              <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff_darren">{getStaffName("staff_darren")}</SelectItem>
                  <SelectItem value="staff_ryan">{getStaffName("staff_ryan")}</SelectItem>
                  <SelectItem value="staff_anna">{getStaffName("staff_anna")}</SelectItem>
                  <SelectItem value="staff_chervelle">{getStaffName("staff_chervelle")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea placeholder="Any special notes…" rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit">Add Meal</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
