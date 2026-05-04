"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Utensils,
  Heart,
  Apple,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
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

interface EatingPlan {
  id: string;
  youngPerson: string;
  planDate: string;
  presentation:
    | "ARFID"
    | "Sensory-led restriction"
    | "Disordered eating — restrictive"
    | "Disordered eating — binge pattern"
    | "Cultural/faith dietary needs"
    | "Allergy/medical"
    | "Recovery — post diagnosis"
    | "Healthy relationship — preventive"
    | "Multiple presentations";
  externalSupport: { agency: string; clinician: string; frequency: string }[];
  safeFoods: string[];
  challengeFoods: string[];
  texturesPreferred: string[];
  texturesAvoided: string[];
  brandsThatWork: string[];
  triggersToAvoid: string[];
  mealTimeApproach: string[];
  eatingEnvironmentSetUp: string[];
  staffDoStrategies: string[];
  staffDoNotStrategies: string[];
  weightMonitoringFrequency?: string;
  hydrationNotes?: string;
  growthCheckNotes?: string;
  childVoice: string;
  staffObservation: string;
  childChose: boolean;
  flagsForReview: string[];
  reviewDate: string;
  keyWorker: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const records: EatingPlan[] = [
  {
    id: "eat_001",
    youngPerson: "yp_casey",
    planDate: d(-30),
    presentation: "ARFID",
    externalSupport: [
      { agency: "CAMHS Eating Disorders Team", clinician: "Dr Hannah Lee", frequency: "Monthly" },
      { agency: "Paediatric dietitian", clinician: "Sarah Wilson RD", frequency: "6-weekly" },
      { agency: "Sensory OT", clinician: "Beth Cole", frequency: "Quarterly" },
    ],
    safeFoods: [
      "Plain pasta with butter",
      "Margherita pizza (specific brand — Dr Oetker)",
      "Cheese on toast (white bread, mature cheddar)",
      "Strawberry yoghurt (Petit Filous only)",
      "Cucumber slices (peeled)",
      "Crisps (Walkers ready salted only)",
      "Apples (specific — Pink Lady)",
      "Marmite sandwiches (white bread, no crusts)",
    ],
    challengeFoods: [
      "Mixed textures (e.g., soup with bits)",
      "Anything green other than cucumber",
      "Hot food that has cooled then reheated",
      "Foods with sauces (other than tomato pizza)",
      "Meat that isn't sausage or chicken nuggets (Quorn dinosaurs OK)",
    ],
    texturesPreferred: ["Smooth", "Crunchy", "Predictable"],
    texturesAvoided: ["Slimy", "Lumpy", "Stringy", "Mixed"],
    brandsThatWork: ["Dr Oetker pizza", "Petit Filous", "Heinz tomato soup (cup only)", "Walkers ready salted"],
    triggersToAvoid: [
      "Pressure to try new foods at the table",
      "Hidden ingredients (Casey must know what's in food)",
      "Comments about how much she eats",
      "New plates/cutlery without warning",
    ],
    mealTimeApproach: [
      "Casey's predictable plate (white, no patterns) every time",
      "Meal time same daily — 5pm tea, 7am breakfast",
      "Foods don't touch each other on plate",
      "Casey serves herself when possible",
      "Calm music background — no TV",
      "Weekly 'curiosity food' — small offered, no pressure to eat",
    ],
    eatingEnvironmentSetUp: [
      "Same chair at table",
      "No bright overhead light — lamp only",
      "Lavender essential oil if anxious before meals",
      "Eeyore on chair if needed",
      "Visual menu shown morning of",
    ],
    staffDoStrategies: [
      "Offer choice within safe foods",
      "Plate up small — second helping always available",
      "Praise eating without praising amount",
      "Make 'curiosity food' a touch/smell game first",
      "Eat alongside Casey at the same table",
    ],
    staffDoNotStrategies: [
      "Comment on amount eaten (positive OR negative)",
      "Hide vegetables in food",
      "Compare to other children",
      "Insist she finishes",
      "Use food as reward/punishment",
      "Discuss food anxieties at the table",
    ],
    weightMonitoringFrequency: "Monthly with paediatrician — gently, not in front of food",
    hydrationNotes: "Water in pink bottle (Casey's choice) all day. Squash at meals OK.",
    growthCheckNotes: "On 25th centile — plateaued for 4 months, dietitian aware, growth tracked",
    childVoice:
      "I don't like food I can't see. I don't like surprises. I'm not being fussy — that's what people don't get. The pizza is the same shape every time and that's why I can eat it. Don't change my plate.",
    staffObservation:
      "Plan has stabilised eating since CAMHS referral 6 months ago. Casey trusting more — last week tasted (and rejected) a new yoghurt brand without distress. That's progress. Sensory aspects key. Mum's struggle with this pre-care still affects Casey emotionally — discussed in therapy.",
    childChose: true,
    flagsForReview: [
      "Watch for restriction expanding (ARFID can narrow further under stress)",
      "Growth plateau — dietitian to advise on supplement options",
    ],
    reviewDate: d(30),
    keyWorker: "staff_anna",
  },
  {
    id: "eat_002",
    youngPerson: "yp_alex",
    planDate: d(-90),
    presentation: "Recovery — post diagnosis",
    externalSupport: [
      { agency: "CAMHS Eating Disorders Team", clinician: "Dr Patel", frequency: "Fortnightly" },
      { agency: "Family-Based Therapy not appropriate (no family unit)", clinician: "—", frequency: "—" },
    ],
    safeFoods: [
      "Vegetarian wellington (Alex's own recipe)",
      "Pasta with red sauce",
      "Stir-fries Alex makes",
      "Yoghurt and berries",
      "Toast with peanut butter",
    ],
    challengeFoods: [
      "Foods Alex used to restrict during disordered eating period (carbs, full-fat dairy)",
      "Eating in groups when stressed",
      "School canteen environment (lunch from home)",
    ],
    texturesPreferred: ["Varied", "Self-prepared"],
    texturesAvoided: [],
    brandsThatWork: [],
    triggersToAvoid: [
      "Calorie or weight discussion",
      "Body comments (positive OR negative)",
      "Diet talk from any adult",
      "Mirror by dining table — removed",
    ],
    mealTimeApproach: [
      "Alex cooks 1-2 meals per week (autonomy is part of recovery)",
      "Eats with home — supported but unhurried",
      "Snacks available all day, no rules",
      "Boxing nutrition discussed positively (fuel not weight)",
      "Body-neutral language only",
    ],
    eatingEnvironmentSetUp: [
      "Predictable meal times",
      "Mirror moved from dining area",
      "Body-positive cookbook in kitchen",
      "Coach Khalid (boxing) supports nutrition language",
    ],
    staffDoStrategies: [
      "Body-neutral language ('fuel', 'energy', 'enjoyment')",
      "Praise the cooking, not the eating",
      "Trust Alex's autonomy with food where possible",
      "Pre-arranged signal if struggling at meal — Alex shows hand under table",
      "Check-in after meals only if Alex initiates",
    ],
    staffDoNotStrategies: [
      "Police plate amounts",
      "Comment on appetite",
      "Use weight or appearance language",
      "Discuss diet trends or other children's eating",
    ],
    weightMonitoringFrequency: "Quarterly with CAMHS — Alex aware in advance, body-blind weighing",
    hydrationNotes: "Hydrates well (boxing-aware)",
    growthCheckNotes: "Stable, on Alex's own trajectory, CAMHS satisfied",
    childVoice:
      "I'm not in the eating disorder anymore. But I'm still careful with my brain. Cooking is how I take care of myself now. Don't comment on my body. Don't comment on my plate. Just eat with me.",
    staffObservation:
      "Alex's recovery is strong — 9 months since acute phase. Cooking has been transformational. Self-aware about triggers. Boxing identity helps (fuel framing). Watching for stress periods (e.g., contact week, exam week).",
    childChose: true,
    flagsForReview: [
      "Watch for pattern around stress / contact / exam time",
      "Coach Khalid included in plan — supports food-as-fuel",
    ],
    reviewDate: d(60),
    keyWorker: "staff_anna",
  },
  {
    id: "eat_003",
    youngPerson: "yp_jordan",
    planDate: d(-60),
    presentation: "Cultural/faith dietary needs",
    externalSupport: [],
    safeFoods: ["Halal meat", "All vegetarian/vegan", "Heritage Pakistani and Caribbean cuisine", "Standard British food (when halal-marked)"],
    challengeFoods: ["Pork", "Non-halal meat", "Alcohol-containing foods"],
    texturesPreferred: [],
    texturesAvoided: [],
    brandsThatWork: ["Tahira halal", "Quorn for shared meals"],
    triggersToAvoid: [
      "Cross-contamination on cooking surfaces",
      "Forgetting halal at takeaways",
      "Ramadan unrespected meal times",
    ],
    mealTimeApproach: [
      "Separate halal-only chopping board (yellow)",
      "Halal storage area in fridge marked",
      "Shared meals planned to be vegetarian or halal",
      "Ramadan: pre-dawn (suhoor) and sunset (iftar) meals planned, family-style",
      "Eid feasts respected — Jordan leads",
    ],
    eatingEnvironmentSetUp: [
      "Halal certified meat sourced from local butcher",
      "Yellow cutting board for halal only",
      "Marked storage",
      "Ramadan calendar visible in kitchen",
    ],
    staffDoStrategies: [
      "Check halal certification when shopping",
      "Plan ahead for Ramadan",
      "Include Jordan in menu planning",
      "Respect fasting (don't eat in front of Jordan during Ramadan when avoidable)",
    ],
    staffDoNotStrategies: [
      "Use shared utensils with non-halal meat",
      "Forget Ramadan meal windows",
      "Assume halal is just about meat (alcohol in cooking is also haram)",
    ],
    childVoice:
      "I appreciate the yellow board. I trust the home with my food now. Ramadan was hard last year because no one understood — this year was so much better.",
    staffObservation:
      "Jordan's faith dietary needs fully accommodated. Annual Ramadan plan now embedded. Jordan teaches younger staff about halal/haram. Ownership of own faith is dignifying.",
    childChose: true,
    flagsForReview: [],
    reviewDate: d(120),
    keyWorker: "staff_anna",
  },
];

const exportCols: ExportColumn<EatingPlan>[] = [
  { header: "Young Person", accessor: (r: EatingPlan) => getYPName(r.youngPerson) },
  { header: "Plan Date", accessor: (r: EatingPlan) => r.planDate },
  { header: "Presentation", accessor: (r: EatingPlan) => r.presentation },
  { header: "External Support", accessor: (r: EatingPlan) => r.externalSupport.map((s) => `${s.agency} (${s.clinician})`).join("; ") },
  { header: "Safe Foods", accessor: (r: EatingPlan) => r.safeFoods.join("; ") },
  { header: "Challenge Foods", accessor: (r: EatingPlan) => r.challengeFoods.join("; ") },
  { header: "Triggers To Avoid", accessor: (r: EatingPlan) => r.triggersToAvoid.join("; ") },
  { header: "DO Strategies", accessor: (r: EatingPlan) => r.staffDoStrategies.join("; ") },
  { header: "DO NOT", accessor: (r: EatingPlan) => r.staffDoNotStrategies.join("; ") },
  { header: "Weight Monitoring", accessor: (r: EatingPlan) => r.weightMonitoringFrequency ?? "—" },
  { header: "Child Voice", accessor: (r: EatingPlan) => r.childVoice },
  { header: "Child Chose", accessor: (r: EatingPlan) => (r.childChose ? "Yes" : "No") },
  { header: "Review", accessor: (r: EatingPlan) => r.reviewDate },
  { header: "Key Worker", accessor: (r: EatingPlan) => getStaffName(r.keyWorker) },
];

const presentationColour: Record<EatingPlan["presentation"], string> = {
  ARFID: "bg-amber-100 text-amber-800 border-amber-200",
  "Sensory-led restriction": "bg-orange-100 text-orange-800 border-orange-200",
  "Disordered eating — restrictive": "bg-red-100 text-red-800 border-red-200",
  "Disordered eating — binge pattern": "bg-red-100 text-red-800 border-red-200",
  "Cultural/faith dietary needs": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Allergy/medical": "bg-blue-100 text-blue-800 border-blue-200",
  "Recovery — post diagnosis": "bg-purple-100 text-purple-800 border-purple-200",
  "Healthy relationship — preventive": "bg-teal-100 text-teal-800 border-teal-200",
  "Multiple presentations": "bg-rose-100 text-rose-800 border-rose-200",
};

export default function EatingSupportPlanPage() {
  const [search, setSearch] = useState("");
  const [presentationFilter, setPresentationFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "presentation" | "review">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        getYPName(rec.youngPerson).toLowerCase().includes(search.toLowerCase()) ||
        rec.presentation.toLowerCase().includes(search.toLowerCase());
      const matchesPresentation = presentationFilter === "all" || rec.presentation === presentationFilter;
      return matchesSearch && matchesPresentation;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "name") return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
      if (sortBy === "presentation") return a.presentation.localeCompare(b.presentation);
      if (sortBy === "review") return a.reviewDate.localeCompare(b.reviewDate);
      return b.planDate.localeCompare(a.planDate);
    });
    return r;
  }, [search, presentationFilter, sortBy]);

  const stats = useMemo(() => {
    const activePlans = records.length;
    const camhsInvolved = records.filter((r) =>
      r.externalSupport.some((s) => s.agency.toLowerCase().includes("camhs"))
    ).length;
    const childChose = records.filter((r) => r.childChose).length;
    const reviewsDue = records.filter((r) => r.reviewDate <= d(30)).length;
    return { activePlans, camhsInvolved, childChose, reviewsDue };
  }, []);

  return (
    <PageShell
      title="Eating Support Plans"
      subtitle="Per-child eating support — ARFID, sensory-led restriction, recovery from disordered eating, cultural/faith dietary needs, allergy. Sensory-led, dignified, body-neutral, externally-supported where appropriate. Distinct from menstrual or general health plans."
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="eating-support-plan" />
          <PrintButton title="Eating Support Plans" />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Utensils className="h-4 w-4" />
            <span>Active plans</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.activePlans}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Heart className="h-4 w-4" />
            <span>CAMHS-involved</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.camhsInvolved}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <CheckCircle className="h-4 w-4" />
            <span>Child co-produced</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.childChose}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Apple className="h-4 w-4" />
            <span>Reviews due (30d)</span>
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
            placeholder="Search young person or presentation..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Select value={presentationFilter} onValueChange={setPresentationFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Presentation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All presentations</SelectItem>
            <SelectItem value="ARFID">ARFID</SelectItem>
            <SelectItem value="Sensory-led restriction">Sensory-led restriction</SelectItem>
            <SelectItem value="Disordered eating — restrictive">Disordered eating — restrictive</SelectItem>
            <SelectItem value="Disordered eating — binge pattern">Disordered eating — binge</SelectItem>
            <SelectItem value="Cultural/faith dietary needs">Cultural/faith</SelectItem>
            <SelectItem value="Allergy/medical">Allergy/medical</SelectItem>
            <SelectItem value="Recovery — post diagnosis">Recovery</SelectItem>
            <SelectItem value="Healthy relationship — preventive">Preventive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-48">
            <ArrowUpDown className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Most recent plan</SelectItem>
            <SelectItem value="name">Young person A→Z</SelectItem>
            <SelectItem value="presentation">Presentation</SelectItem>
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
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", presentationColour[r.presentation])}>
                      {r.presentation}
                    </span>
                    {r.childChose ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-pink-100 text-pink-800 border-pink-200">
                        Co-produced
                      </span>
                    ) : null}
                    {r.flagsForReview.length ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-100 text-amber-800 border-amber-200">
                        {r.flagsForReview.length} flag{r.flagsForReview.length === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-slate-600">
                    Plan {r.planDate} · Review {r.reviewDate} · {getStaffName(r.keyWorker)}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Child Voice</div>
                      <p className="text-sm text-slate-700 italic">&ldquo;{r.childVoice}&rdquo;</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Staff Observation</div>
                      <p className="text-sm text-slate-700">{r.staffObservation}</p>
                    </div>
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                      <div className="text-xs font-semibold text-emerald-700 uppercase mb-2">Safe foods</div>
                      <ul className="text-sm text-emerald-900 space-y-1">
                        {r.safeFoods.map((f, i) => (
                          <li key={i} className="flex gap-2"><span>+</span><span>{f}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                      <div className="text-xs font-semibold text-amber-800 uppercase mb-2">Challenge foods</div>
                      <ul className="text-sm text-amber-900 space-y-1">
                        {r.challengeFoods.map((f, i) => (
                          <li key={i} className="flex gap-2"><span>!</span><span>{f}</span></li>
                        ))}
                      </ul>
                    </div>
                    {r.triggersToAvoid.length ? (
                      <div className="rounded-md border border-red-200 bg-red-50 p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-red-700 uppercase mb-2">Triggers to avoid</div>
                        <ul className="text-sm text-red-900 space-y-1">
                          {r.triggersToAvoid.map((t, i) => (
                            <li key={i} className="flex gap-2"><span>×</span><span>{t}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                      <div className="text-xs font-semibold text-emerald-700 uppercase mb-2">Staff DO</div>
                      <ul className="text-sm text-emerald-900 space-y-1">
                        {r.staffDoStrategies.map((s, i) => (
                          <li key={i} className="flex gap-2"><span>·</span><span>{s}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
                      <div className="text-xs font-semibold text-rose-800 uppercase mb-2">Staff DO NOT</div>
                      <ul className="text-sm text-rose-900 space-y-1">
                        {r.staffDoNotStrategies.map((s, i) => (
                          <li key={i} className="flex gap-2"><span>×</span><span>{s}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Meal time approach</div>
                      <ul className="text-sm text-slate-700 space-y-1">
                        {r.mealTimeApproach.map((m, i) => (
                          <li key={i} className="flex gap-2"><span className="text-slate-400">·</span><span>{m}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Environment set up</div>
                      <ul className="text-sm text-slate-700 space-y-1">
                        {r.eatingEnvironmentSetUp.map((m, i) => (
                          <li key={i} className="flex gap-2"><span className="text-slate-400">·</span><span>{m}</span></li>
                        ))}
                      </ul>
                    </div>
                    {r.externalSupport.length ? (
                      <div className="rounded-md border border-slate-200 bg-white p-3">
                        <div className="text-xs font-semibold text-slate-500 uppercase mb-2">External support</div>
                        <ul className="text-sm text-slate-700 space-y-1.5">
                          {r.externalSupport.map((s, i) => (
                            <li key={i}>
                              <div className="font-medium">{s.agency}</div>
                              <div className="text-slate-500">{s.clinician} · {s.frequency}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Monitoring</div>
                      <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                        {r.weightMonitoringFrequency ? (
                          <div><span className="text-slate-500">Weight:</span> {r.weightMonitoringFrequency}</div>
                        ) : null}
                        {r.hydrationNotes ? (
                          <div><span className="text-slate-500">Hydration:</span> {r.hydrationNotes}</div>
                        ) : null}
                        {r.growthCheckNotes ? (
                          <div className="col-span-2"><span className="text-slate-500">Growth:</span> {r.growthCheckNotes}</div>
                        ) : null}
                      </div>
                    </div>
                    {r.flagsForReview.length ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> Flags for review
                        </div>
                        <ul className="text-sm text-amber-900 space-y-1">
                          {r.flagsForReview.map((f, i) => (
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

      <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        <div className="font-semibold mb-1">Regulatory framework</div>
        <p>
          Eating support plans are co-produced with the young person, sensory-informed, body-neutral, and externally
          supported by CAMHS Eating Disorders or community dietitians where indicated. Practice is grounded in NICE
          NG69 (Eating disorders), Beat Charity guidance, the Children&rsquo;s Homes Regulations Quality Standards 6
          (Enjoyment & Achievement) and 8 (Health & Wellbeing), the Equality Act 2010 (where neurodivergence applies),
          and UNCRC Articles 12 (voice), 14 (faith), 24 (health), and 30 (cultural identity). Faith and cultural
          dietary needs receive equal dignity to clinical presentations.
        </p>
      </div>
    </PageShell>
  );
}
