"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
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
  UtensilsCrossed, Calendar, Clock, Leaf,
  Heart, ThumbsUp, ThumbsDown, Star, Loader2,
} from "lucide-react";
import { useMealPlans, useCreateMealPlan } from "@/hooks/use-meal-plans";
import { toast } from "sonner";
import { STAFF } from "@/lib/seed-data";
import type { MealPlan, MealType, DietaryFlag, MealChildPreference } from "@/types/extended";
import { MEAL_TYPE_LABEL, DIETARY_FLAG_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

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

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

export default function MenuPlanningPage() {
  const { data: res, isLoading } = useMealPlans();
  const meals: MealPlan[] = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [mealFilter, setMealFilter] = useState("all");
  const [tab, setTab] = useState("upcoming");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const createMeal = useCreateMealPlan();
  const [mealForm, setMealForm] = useState({ date: new Date().toISOString().slice(0, 10), meal: "dinner" as MealType, main_dish: "", sides: "", dessert: "", budget: "", prepared_by: "", notes: "" });
  const setMF = (k: keyof typeof mealForm, v: string) => setMealForm((p) => ({ ...p, [k]: v }));

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealForm.main_dish.trim()) { toast.error("Main dish is required."); return; }
    await createMeal.mutateAsync({ date: mealForm.date, meal: mealForm.meal, main_dish: mealForm.main_dish.trim(), sides: mealForm.sides ? mealForm.sides.split(",").map((s) => s.trim()).filter(Boolean) : [], dessert: mealForm.dessert.trim(), dietary_flags: [], prepared_by: mealForm.prepared_by || "staff_darren", child_preferences: [], special_notes: mealForm.notes.trim(), budget: parseFloat(mealForm.budget) || 0, leftover_action: "", created_at: new Date().toISOString() });
    toast.success("Meal plan added.");
    setMealForm({ date: new Date().toISOString().slice(0, 10), meal: "dinner", main_dish: "", sides: "", dessert: "", budget: "", prepared_by: "", notes: "" });
    setShowNew(false);
  };

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let list = [...meals];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((m) => m.main_dish.toLowerCase().includes(s) || m.sides.some((si: string) => si.toLowerCase().includes(s)) || m.special_notes.toLowerCase().includes(s));
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

  const stats = useMemo(() => {
    const total = meals.length;
    const weekBudget = meals.filter((m) => m.date >= d(-7)).reduce((a, m) => a + m.budget, 0);
    const allRatings = meals.flatMap((m) => m.child_preferences);
    const liked = allRatings.filter((r: MealChildPreference) => r.rating === "liked").length;
    const satisfaction = allRatings.length > 0 ? Math.round((liked / allRatings.length) * 100) : 0;
    const upcoming = meals.filter((m) => m.date >= d(0)).length;
    return { total, weekBudget, satisfaction, upcoming };
  }, [meals]);

  const EXPORT_COLS: ExportColumn<MealPlan>[] = [
    { header: "ID",              accessor: (r) => r.id },
    { header: "Date",            accessor: (r) => r.date },
    { header: "Meal",            accessor: (r) => MEAL_TYPE_LABEL[r.meal] },
    { header: "Main Dish",       accessor: (r) => r.main_dish },
    { header: "Sides",           accessor: (r) => r.sides.join(", ") },
    { header: "Dessert",         accessor: (r) => r.dessert || "—" },
    { header: "Dietary",         accessor: (r) => r.dietary_flags.map((f: DietaryFlag) => DIETARY_FLAG_LABEL[f]).join(", ") },
    { header: "Prepared By",     accessor: (r) => getStaffName(r.prepared_by) },
    { header: "Budget",          accessor: (r) => `£${r.budget.toFixed(2)}` },
    { header: "Likes",           accessor: (r) => String(r.child_preferences.filter((p: MealChildPreference) => p.rating === "liked").length) },
    { header: "Notes",           accessor: (r) => r.special_notes },
    { header: "Leftovers",       accessor: (r) => r.leftover_action || "—" },
  ];

  if (isLoading) return <PageShell title="Menu Planning" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Menu Planning"
      subtitle="Nutritious meals, dietary needs, and children&apos;s food preferences"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Menu Planning" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="menu-planning" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Add Meal</Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
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

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search meals…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={mealFilter} onValueChange={setMealFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Meal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Meals</SelectItem>
              {(Object.keys(MEAL_TYPE_LABEL) as MealType[]).map((k) => <SelectItem key={k} value={k}>{MEAL_TYPE_LABEL[k]}</SelectItem>)}
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

        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No meals match your filters.</p>}
          {filtered.map((m) => {
            const open = !!expanded[m.id];
            const mealM = MEAL_META[m.meal];
            const liked = m.child_preferences.filter((p: MealChildPreference) => p.rating === "liked").length;
            const disliked = m.child_preferences.filter((p: MealChildPreference) => p.rating === "disliked").length;
            const isFuture = m.date >= d(0);
            return (
              <Card key={m.id} className={cn("border-l-4", m.meal === "dinner" ? "border-l-orange-400" : m.meal === "lunch" ? "border-l-blue-400" : m.meal === "breakfast" ? "border-l-amber-400" : "border-l-green-400")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => toggle(m.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant="outline" className="text-xs">{mealM.icon}<span className="ml-1">{mealM.label}</span></Badge>
                        {m.dietary_flags.filter((f: DietaryFlag) => f !== "none").map((f: DietaryFlag) => (
                          <Badge key={f} className={cn("text-xs", DIETARY_META[f].color)}>{DIETARY_META[f].label}</Badge>
                        ))}
                        {isFuture && <Badge className="bg-blue-100 text-blue-700 text-xs">Planned</Badge>}
                      </div>
                      <p className="font-semibold">{m.main_dish}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>{m.date}</span>
                        <span>{mealM.time}</span>
                        <span>Prepared by {getStaffName(m.prepared_by)}</span>
                        <span>£{m.budget.toFixed(2)}</span>
                      </div>
                      {m.child_preferences.length > 0 && (
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
                          <p>{m.main_dish}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Sides</p>
                          <div className="flex flex-wrap gap-1">{m.sides.map((s: string, i: number) => <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>)}</div>
                        </div>
                        {m.dessert && (
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Dessert</p>
                            <p>{m.dessert}</p>
                          </div>
                        )}
                      </div>
                      {m.child_preferences.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Children&apos;s Feedback</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {m.child_preferences.map((p: MealChildPreference, i: number) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <span>{getYPName(p.child_id)}</span>
                                {p.rating === "liked" && <ThumbsUp className="h-3 w-3 text-green-600" />}
                                {p.rating === "disliked" && <ThumbsDown className="h-3 w-3 text-red-600" />}
                                {p.rating === "not_eaten" && <span className="text-muted-foreground">Did not eat</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {m.special_notes && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Notes</p>
                          <p className="italic text-muted-foreground">{m.special_notes}</p>
                        </div>
                      )}
                      {m.leftover_action && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Leaf className="h-3.5 w-3.5" />
                          <span>Leftovers: {m.leftover_action}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-muted/40">
          <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
            <UtensilsCrossed className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Meals should be nutritious, varied, and reflect children&apos;s cultural and dietary needs. Children should be involved in menu planning and food preparation where possible. Food preferences and dietary requirements must be recorded and reviewed regularly. Reg 44 visitors may ask about meal variety and children&apos;s involvement.
            </span>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Meal Plan</DialogTitle></DialogHeader>
          <form onSubmit={handleAddMeal} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input type="date" value={mealForm.date} onChange={(e) => setMF("date", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Meal</label>
                <Select value={mealForm.meal} onValueChange={(v) => setMF("meal", v)}><SelectTrigger><SelectValue placeholder="Select meal" /></SelectTrigger>
                  <SelectContent>{(Object.keys(MEAL_TYPE_LABEL) as MealType[]).map((k) => <SelectItem key={k} value={k}>{MEAL_TYPE_LABEL[k]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Main Dish *</label>
              <Input placeholder="What's the main course?" value={mealForm.main_dish} onChange={(e) => setMF("main_dish", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Sides</label>
              <Input placeholder="Comma-separated sides" value={mealForm.sides} onChange={(e) => setMF("sides", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Dessert</label>
              <Input placeholder="Dessert (optional)" value={mealForm.dessert} onChange={(e) => setMF("dessert", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Budget (£)</label>
              <Input type="number" step="0.01" placeholder="0.00" value={mealForm.budget} onChange={(e) => setMF("budget", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Prepared By</label>
              <Select value={mealForm.prepared_by} onValueChange={(v) => setMF("prepared_by", v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {STAFF.filter((s) => s.employment_status === "active").map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea placeholder="Any special notes…" rows={2} value={mealForm.notes} onChange={(e) => setMF("notes", e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createMeal.isPending}>{createMeal.isPending ? "Saving…" : "Add Meal"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
