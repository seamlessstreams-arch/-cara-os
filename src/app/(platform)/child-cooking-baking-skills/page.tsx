"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChefHat,
  Utensils,
  Flame,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Award,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CookingBakingRecord,
  CookingCategory,
  CookingCompetency,
  CookingOutcome,
  COOKING_CATEGORY_LABEL,
  COOKING_COMPETENCY_LABEL,
  COOKING_OUTCOME_LABEL,
} from "@/types/extended";
import { useCookingBakingRecords } from "@/hooks/use-cooking-baking-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const exportCols: ExportColumn<CookingBakingRecord>[] = [
  { header: "Young Person", accessor: (r: CookingBakingRecord) => getYPName(r.child_id) },
  { header: "Date", accessor: (r: CookingBakingRecord) => r.recorded_date },
  { header: "Skill", accessor: (r: CookingBakingRecord) => r.skill },
  { header: "Category", accessor: (r: CookingBakingRecord) => COOKING_CATEGORY_LABEL[r.category] },
  { header: "Competency", accessor: (r: CookingBakingRecord) => COOKING_COMPETENCY_LABEL[r.competency_level] },
  { header: "First Attempt", accessor: (r: CookingBakingRecord) => r.first_attempt_date ?? "—" },
  { header: "Independent", accessor: (r: CookingBakingRecord) => r.achieved_independently_date ?? "—" },
  { header: "Cuisines", accessor: (r: CookingBakingRecord) => r.cuisines_explored.join("; ") },
  { header: "Hygiene Cert", accessor: (r: CookingBakingRecord) => (r.hygiene_certificate ? "Yes" : "No") },
  { header: "Led Family Meal", accessor: (r: CookingBakingRecord) => (r.led_family_meal ? "Yes" : "No") },
  { header: "Child Voice", accessor: (r: CookingBakingRecord) => r.child_voice },
  { header: "Next Skill", accessor: (r: CookingBakingRecord) => r.next_skill_to_build },
  { header: "Review", accessor: (r: CookingBakingRecord) => r.review_date },
  { header: "Key Worker", accessor: (r: CookingBakingRecord) => getStaffName(r.key_worker) },
];

const competencyColour: Record<CookingCompetency, string> = {
  not_yet_introduced: "bg-slate-100 text-slate-800 border-slate-200",
  observed_staff: "bg-blue-100 text-blue-800 border-blue-200",
  assisted: "bg-sky-100 text-sky-800 border-sky-200",
  did_with_prompts: "bg-amber-100 text-amber-800 border-amber-200",
  did_independently: "bg-emerald-100 text-emerald-800 border-emerald-200",
  can_teach_others: "bg-purple-100 text-purple-800 border-purple-200",
};

const outcomeColour: Record<CookingOutcome, string> = {
  burnt: "bg-red-100 text-red-800 border-red-200",
  edible: "bg-amber-100 text-amber-800 border-amber-200",
  good: "bg-blue-100 text-blue-800 border-blue-200",
  excellent: "bg-emerald-100 text-emerald-800 border-emerald-200",
  showed_off: "bg-purple-100 text-purple-800 border-purple-200",
};

export default function ChildCookingBakingSkillsPage() {
  const { data: res, isLoading } = useCookingBakingRecords();
  const records = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "competency" | "category">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        getYPName(rec.child_id).toLowerCase().includes(search.toLowerCase()) ||
        rec.skill.toLowerCase().includes(search.toLowerCase()) ||
        COOKING_CATEGORY_LABEL[rec.category].toLowerCase().includes(search.toLowerCase());
      const matchesCat = categoryFilter === "all" || rec.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "name") return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
      if (sortBy === "competency") return a.competency_level.localeCompare(b.competency_level);
      if (sortBy === "category") return a.category.localeCompare(b.category);
      return b.recorded_date.localeCompare(a.recorded_date);
    });
    return r;
  }, [search, categoryFilter, sortBy, records]);

  const stats = useMemo(() => {
    const skillsTracked = records.length;
    const independentSkills = records.filter(
      (r) => r.competency_level === "did_independently" || r.competency_level === "can_teach_others"
    ).length;
    const hygieneCerts = records.filter((r) => r.hygiene_certificate).length;
    const ledMeals = records.filter((r) => r.led_family_meal).length;
    return { skillsTracked, independentSkills, hygieneCerts, ledMeals };
  }, [records]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <PageShell
      title="Cooking & Baking Skills"
      subtitle="Per-child progression of cooking and baking skills — knife work, hob/oven, recipe planning, hygiene, cultural cooking. Heritage food connection, family meals led, and the journey from observed → assisted → independent → can teach others."
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="child-cooking-baking-skills" />
          <PrintButton title="Cooking & Baking Skills" />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <ChefHat className="h-4 w-4" />
            <span>Skills tracked</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.skillsTracked}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Award className="h-4 w-4" />
            <span>Independent or teaching</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.independentSkills}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Flame className="h-4 w-4" />
            <span>Hygiene certificates</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.hygieneCerts}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Utensils className="h-4 w-4" />
            <span>Family meals led</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.ledMeals}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search young person, skill, category..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="knife_skills">Knife skills</SelectItem>
            <SelectItem value="hob_cooking">Hob/cooking</SelectItem>
            <SelectItem value="oven_baking">Oven/baking</SelectItem>
            <SelectItem value="microwave">Microwave</SelectItem>
            <SelectItem value="recipe_planning">Recipe planning</SelectItem>
            <SelectItem value="shopping_list">Shopping list</SelectItem>
            <SelectItem value="budgeting">Budgeting</SelectItem>
            <SelectItem value="food_hygiene">Food hygiene</SelectItem>
            <SelectItem value="allergens_awareness">Allergens awareness</SelectItem>
            <SelectItem value="cultural_cooking">Cultural cooking</SelectItem>
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
            <SelectItem value="competency">Competency</SelectItem>
            <SelectItem value="category">Category</SelectItem>
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
                    <span className="font-semibold text-slate-900">{getYPName(r.child_id)}</span>
                    <span className="text-slate-700">{r.skill}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", competencyColour[r.competency_level])}>
                      {COOKING_COMPETENCY_LABEL[r.competency_level]}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-slate-100 text-slate-700 border-slate-200">
                      {COOKING_CATEGORY_LABEL[r.category]}
                    </span>
                    {r.led_family_meal ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-200">
                        Led family meal
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-slate-600">
                    Recorded {r.recorded_date} · Review {r.review_date} · {getStaffName(r.key_worker)}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Child Voice</div>
                      <p className="text-sm text-slate-700 italic">&ldquo;{r.child_voice}&rdquo;</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Staff Observation</div>
                      <p className="text-sm text-slate-700">{r.staff_observation}</p>
                    </div>
                    {r.recipes_attempted.length ? (
                      <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Attempts & outcomes</div>
                        <div className="space-y-1.5">
                          {r.recipes_attempted.map((a, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm">
                              <span className="text-slate-500 w-24 shrink-0">{a.date}</span>
                              <span className="flex-1 text-slate-700">{a.name}</span>
                              <span className={cn("text-xs px-2 py-0.5 rounded-full border", outcomeColour[a.outcome])}>
                                {COOKING_OUTCOME_LABEL[a.outcome]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {r.cuisines_explored.length ? (
                      <div className="rounded-md border border-slate-200 bg-white p-3">
                        <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Cuisines explored</div>
                        <div className="flex flex-wrap gap-1.5">
                          {r.cuisines_explored.map((c, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-200">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Progress dates</div>
                      <div className="text-sm text-slate-700 space-y-1">
                        <div><span className="text-slate-500">First attempt:</span> {r.first_attempt_date ?? "—"}</div>
                        <div><span className="text-slate-500">Independent:</span> {r.achieved_independently_date ?? "—"}</div>
                        <div><span className="text-slate-500">Hygiene cert:</span> {r.hygiene_certificate ? "Yes" : "Not yet"}</div>
                      </div>
                    </div>
                    {r.flags_risks.length ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2">Flags & risks</div>
                        <ul className="text-sm text-amber-900 space-y-1">
                          {r.flags_risks.map((f, i) => (
                            <li key={i} className="flex gap-2"><span>!</span><span>{f}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="rounded-md border border-blue-200 bg-blue-50 p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-blue-800 uppercase mb-2">Next skill to build</div>
                      <p className="text-sm text-blue-900">{r.next_skill_to_build}</p>
                    </div>
                  </div>
                  <SmartLinkPanel sourceType="cooking-baking-record" sourceId={r.id} childId={r.child_id} compact />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="font-semibold mb-1">Regulatory framework</div>
        <p>
          Cooking is a core independence skill and a powerful identity / family / culture connector. Practice is
          grounded in Quality Standard 6 (Enjoyment & Achievement) and the Pathway Plan for over-16s. Heritage food
          work supports UNCRC Article 30 (cultural identity). Food hygiene aligns with Level 1 / 2 standards. Knife
          and hob safety follow the home&rsquo;s individual risk assessment for each young person.
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
