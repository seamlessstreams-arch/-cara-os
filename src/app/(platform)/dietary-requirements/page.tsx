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
  Utensils,
  AlertTriangle,
  Heart,
  CheckCircle,
  Apple,
  Coffee,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DietaryPlan {
  id: string;
  youngPerson: string;
  allergies: { allergen: string; severity: "Life-threatening" | "Severe" | "Moderate" | "Mild"; reaction: string; treatment: string }[];
  intolerances: string[];
  medicalDietaryNeeds: string[];
  religiousDietaryNeeds: string;
  ethicalChoices: string;
  sensoryFoodNeeds: string[];
  preferredFoods: string[];
  dislikedFoods: string[];
  alwaysAvailable: string[];
  forbidden: string[];
  textureRequirements: string;
  portionGuidance: string;
  hydrationNeeds: string;
  mealtimeRoutines: string[];
  mealtimeChallenges: string[];
  supportAtMeals: string;
  socialEatingPreferences: string;
  cookingInvolvement: string;
  shoppingInvolvement: string;
  growthMonitoring: { lastWeight: string; lastWeightDate: string; lastHeight: string; lastHeightDate: string; concerns: string };
  reviewedBy: string;
  reviewedDate: string;
  reviewedWithChild: boolean;
  childAgreed: boolean;
  signedOffByDietitian: boolean;
  nextReviewDate: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: DietaryPlan[] = [
  {
    id: "dp-001",
    youngPerson: "yp_alex",
    allergies: [
      { allergen: "Penicillin (medical, not food)", severity: "Severe", reaction: "Rash, swelling — never reached anaphylaxis", treatment: "Avoid; alternative antibiotics on prescription" },
    ],
    intolerances: [],
    medicalDietaryNeeds: [
      "ADHD medication (methylphenidate XL) — must be taken WITH FOOD, never on empty stomach",
      "Morning meal essential before medication taken",
      "Encourage afternoon snack — medication can suppress appetite at lunch",
    ],
    religiousDietaryNeeds: "None specific. Family loosely Christian — Christmas roast significance.",
    ethicalChoices: "Eats meat. No specific ethical restrictions. Does not eat veal (own choice).",
    sensoryFoodNeeds: [
      "Strong dislike of mushroom texture",
      "Doesn't like food with 'bits' in (smooth sauces preferred)",
      "Mixed temperatures okay",
    ],
    preferredFoods: [
      "Chicken curry (especially mum's recipe)",
      "Spaghetti bolognese",
      "Cheese — anything cheese-based",
      "Cookies (post-school treat)",
      "Roast dinner (Sundays)",
    ],
    dislikedFoods: [
      "Mushrooms (texture)",
      "Spicy food unless self-chosen",
      "Most fish (will eat fish fingers)",
      "Olives",
    ],
    alwaysAvailable: [
      "Cereal (chocolate-flavoured) — for breakfast and emergency snack",
      "Bread for toast",
      "Cheese",
      "Apples",
      "Hot chocolate sachets (bedtime ritual)",
    ],
    forbidden: [],
    textureRequirements: "Standard. Smooth sauces preferred over chunky. Mixed textures fine.",
    portionGuidance: "Standard age-13 portion. Encourage protein at lunch (medication appetite suppression). Snack window 3-5pm important.",
    hydrationNeeds: "Standard. Encourage water during boxing club. Caffeine avoided after 4pm (ADHD/sleep).",
    mealtimeRoutines: [
      "Breakfast 07:40 (with medication)",
      "School lunch (own packed)",
      "Snack 16:00 (post-school)",
      "Dinner 18:30 with all young people",
      "Hot chocolate at 21:15 (bedtime ritual with key worker)",
    ],
    mealtimeChallenges: [
      "Lunch — appetite suppressed by medication",
      "Some sensory aversion to mushrooms",
    ],
    supportAtMeals: "Standard. Sometimes needs reminder to eat slowly (ADHD impulsivity).",
    socialEatingPreferences: "Enjoys mealtimes with everyone. Active conversationalist when settled.",
    cookingInvolvement: "Loves cooking — particularly enjoys helping with curries and bakes. Involved 2-3 times per week.",
    shoppingInvolvement: "Comes shopping weekly. Picks own snacks within agreed budget.",
    growthMonitoring: {
      lastWeight: "47kg",
      lastWeightDate: d(-30),
      lastHeight: "158cm",
      lastHeightDate: d(-30),
      concerns: "On 50th centile, tracking well. ADHD medication initially affected weight; now stable.",
    },
    reviewedBy: "staff_anna",
    reviewedDate: d(-21),
    reviewedWithChild: true,
    childAgreed: true,
    signedOffByDietitian: false,
    nextReviewDate: d(70),
  },
  {
    id: "dp-002",
    youngPerson: "yp_jordan",
    allergies: [],
    intolerances: ["Mild lactose sensitivity — can have small amounts of dairy, large amounts cause discomfort"],
    medicalDietaryNeeds: [
      "Asthma — no specific dietary restriction but encourage anti-inflammatory diet",
      "Football match days: bigger breakfast (porridge), carb-loading dinner night before",
    ],
    religiousDietaryNeeds: "Family is Christian (Caribbean/West African heritage). Special meals at significant church events. Mother prepares specific cultural meals at family contact.",
    ethicalChoices: "Eats meat. Loves traditional Caribbean and West African dishes — important to identity.",
    sensoryFoodNeeds: [
      "Doesn't like overcooked food",
      "Hot food must be hot, cold food cold (no lukewarm)",
      "Strong on flavour — bland food unsatisfying",
    ],
    preferredFoods: [
      "Jollof rice (West African, important to heritage)",
      "Jerk chicken (Caribbean)",
      "Roast chicken with hot sauce",
      "Plantain (when available)",
      "Chocolate ice cream",
      "Strong, well-seasoned food",
    ],
    dislikedFoods: [
      "Brussels sprouts",
      "Anything overcooked or undercooked",
      "Bland or under-seasoned food",
      "Cold food that should be hot",
    ],
    alwaysAvailable: [
      "Tea bags (strong tea is important — milk and one sugar)",
      "Eggs",
      "Bread",
      "Hot sauces (Jordan's selection)",
      "Cultural ingredients (scotch bonnets, plantain when in season)",
    ],
    forbidden: [],
    textureRequirements: "Standard. Crispy textures appreciated. Soft/overcooked rejected.",
    portionGuidance: "Standard age-13 portion. Match days: increase carbs. Active growth period — encourage protein.",
    hydrationNeeds: "Standard. Increased water needs around football. Sports drink during matches okay.",
    mealtimeRoutines: [
      "Breakfast 07:45 (eggs and toast typical)",
      "School lunch (mix of packed and canteen — Jordan's choice)",
      "Snack 16:30 (post-school, sometimes on way to football)",
      "Dinner 18:30",
      "Match days: pre-match snack 90 mins before",
    ],
    mealtimeChallenges: [
      "Wants strong flavours — risk of unsatisfaction with bland menu",
      "Cultural food less frequent than Jordan would prefer",
    ],
    supportAtMeals: "Standard. Engaging conversation during meals. Help with cultural recipe development encouraged.",
    socialEatingPreferences: "Sociable. Loves communal eating. Particularly enjoys when cultural food is on menu.",
    cookingInvolvement: "Strong interest in cooking, especially cultural dishes. Once-weekly Jordan-led cooking session for whole house. Mother sends recipes during contact.",
    shoppingInvolvement: "Active part of shopping team. Suggests cultural ingredients. Has dedicated 'cultural ingredients' budget line.",
    growthMonitoring: {
      lastWeight: "52kg",
      lastWeightDate: d(-30),
      lastHeight: "164cm",
      lastHeightDate: d(-30),
      concerns: "Above 50th centile, growing well. Active growth phase. No concerns.",
    },
    reviewedBy: "staff_chervelle",
    reviewedDate: d(-14),
    reviewedWithChild: true,
    childAgreed: true,
    signedOffByDietitian: false,
    nextReviewDate: d(76),
  },
  {
    id: "dp-003",
    youngPerson: "yp_casey",
    allergies: [
      { allergen: "None confirmed", severity: "Mild", reaction: "Possible mild sensitivity to artificial colourings (tentative — in observation)", treatment: "Avoid artificial colourings as precaution" },
    ],
    intolerances: [
      "ARFID (Avoidant Restrictive Food Intake Disorder) — diagnosed",
      "Major sensory restrictions — limited safe foods",
    ],
    medicalDietaryNeeds: [
      "ARFID requires SAFE FOODS approach — never force, gradual exposure only",
      "Melatonin in evening — can be taken with light snack if needed",
      "Constipation tendency — encourage hydration and fibre-tolerant foods",
      "Low iron at last bloods — Vitabiotics multivitamin daily",
    ],
    religiousDietaryNeeds: "None — Casey not religious. No specific dietary observance.",
    ethicalChoices: "Doesn't really like meat — loose vegetarian preference. Will eat chicken occasionally. Strong feeling about animal welfare.",
    sensoryFoodNeeds: [
      "EXTREMELY restrictive sensory profile — any change to safe foods causes refusal",
      "Cannot tolerate mixed textures (e.g. soup with bits)",
      "Foods cannot touch each other on plate",
      "Specific brand of cereal only (Plain Cheerios)",
      "Specific blue bowl, specific cutlery, specific cup",
      "Strong smells overwhelming — cooking smells need to be managed",
      "Hot and cold cannot be on same plate",
    ],
    preferredFoods: [
      "Plain Cheerios with cold milk (ALWAYS in blue bowl)",
      "Plain toast (no butter, no spread)",
      "Mac and cheese (specific recipe — texture critical)",
      "Apple slices (cut Casey's preferred way)",
      "Vanilla ice cream (no toppings ever)",
      "Plain chicken pieces (occasionally)",
      "Cucumber slices (peeled)",
      "Cheese cubes (specific brand)",
    ],
    dislikedFoods: [
      "Mixed textures (soup with bits, pasta sauces with chunks)",
      "Spicy food (cannot tolerate)",
      "Strong smells",
      "Anything where foods touch on plate",
      "Most meats",
      "Vegetables except cucumber and carrot sticks",
    ],
    alwaysAvailable: [
      "Plain Cheerios (specific brand, multiple boxes — never run out)",
      "Plain bread for toast (specific brand)",
      "Apples (Casey's preferred variety)",
      "Vanilla ice cream",
      "Mac and cheese ingredients (kept stocked)",
      "Cucumber",
    ],
    forbidden: [
      "Foods with unknown ingredients (cause anxiety)",
      "New foods without prior preparation",
      "Mixed dishes Casey hasn't agreed to",
      "Artificial colourings (precautionary)",
    ],
    textureRequirements: "CRITICAL. Single-texture only. Smooth, dry, or specific. Refer to safe foods list. NEVER change established preparation method without consultation.",
    portionGuidance: "Smaller portions but more frequent eating. Don't pressure to clear plate. Quantity less important than consistency.",
    hydrationNeeds: "Encourage. Casey often forgets. Specific water bottle. Apple juice as alternative.",
    mealtimeRoutines: [
      "Breakfast 08:10 (always Cheerios in blue bowl) — same plate, same cutlery",
      "School lunch (own provision — replicate same safe foods)",
      "Snack 15:30 (ice cream or apple)",
      "Dinner 18:00 (15 mins earlier than other YPs to avoid kitchen overwhelm)",
      "Pre-bed: small snack if needed",
    ],
    mealtimeChallenges: [
      "Severe sensory limitations restrict variety significantly",
      "Risk of nutritional gaps — multivitamin essential",
      "Stress when plans change",
      "Difficulty eating out (no safe foods at restaurants typically)",
    ],
    supportAtMeals: "Quiet kitchen — minimum staff in kitchen during Casey's mealtime. Side-on seating preferred. No demands during meals. Quiet music sometimes helps.",
    socialEatingPreferences: "Prefers eating slightly apart from group. Will eat at table but at quiet end. Group mealtimes can be overwhelming.",
    cookingInvolvement: "Limited but growing. Currently helps with familiar safe-food preparation. Smell management critical. Working with art therapist on food relationship.",
    shoppingInvolvement: "Visits supermarket only at quiet times. Sticks to known aisles. Routes mapped. Focused on familiar safe foods.",
    growthMonitoring: {
      lastWeight: "38kg",
      lastWeightDate: d(-21),
      lastHeight: "147cm",
      lastHeightDate: d(-21),
      concerns: "Below 25th centile but tracking own line. Paediatric dietitian engaged. Iron low — multivitamin in place. Monitoring monthly.",
    },
    reviewedBy: "staff_anna",
    reviewedDate: d(-7),
    reviewedWithChild: true,
    childAgreed: true,
    signedOffByDietitian: true,
    nextReviewDate: d(23),
  },
];

const severityColour: Record<string, string> = {
  "Life-threatening": "bg-red-200 text-red-900",
  Severe: "bg-red-100 text-red-800",
  Moderate: "bg-amber-100 text-amber-800",
  Mild: "bg-blue-100 text-blue-800",
};

const exportCols: ExportColumn<DietaryPlan>[] = [
  { header: "Young Person", accessor: (r: DietaryPlan) => getYPName(r.youngPerson) },
  { header: "Allergies", accessor: (r: DietaryPlan) => r.allergies.length > 0 ? r.allergies.map((a) => `${a.allergen} (${a.severity})`).join("; ") : "None" },
  { header: "Intolerances", accessor: (r: DietaryPlan) => r.intolerances.join("; ") || "None" },
  { header: "Medical Needs", accessor: (r: DietaryPlan) => r.medicalDietaryNeeds.join("; ") },
  { header: "Religious", accessor: (r: DietaryPlan) => r.religiousDietaryNeeds },
  { header: "Last Weight", accessor: (r: DietaryPlan) => `${r.growthMonitoring.lastWeight} (${r.growthMonitoring.lastWeightDate})` },
  { header: "Reviewed", accessor: (r: DietaryPlan) => r.reviewedDate },
  { header: "Child Agreed", accessor: (r: DietaryPlan) => r.childAgreed ? "Yes" : "No" },
];

export default function DietaryRequirementsPage() {
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((p) => p.youngPerson === filterYP);
    items.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.youngPerson.localeCompare(b.youngPerson);
        case "review":
          return a.nextReviewDate.localeCompare(b.nextReviewDate);
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, sortBy]);

  const total = data.length;
  const criticalAllergies = data.filter((p) => p.allergies.some((a) => a.severity === "Life-threatening" || a.severity === "Severe")).length;
  const allChildAgreed = data.every((p) => p.childAgreed);
  const dueReview = data.filter((p) => p.nextReviewDate <= d(30)).length;

  return (
    <PageShell
      title="Dietary Requirements"
      subtitle="Personalised dietary plans — allergies, sensory needs, religious observance, and food relationships"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="dietary-requirements" />
          <PrintButton title="Dietary Requirements" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Active Plans</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", criticalAllergies > 0 ? "text-red-600" : "text-green-600")}>{criticalAllergies}</p>
          <p className="text-xs text-muted-foreground">Severe Allergies</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allChildAgreed ? "100%" : `${data.filter((p) => p.childAgreed).length}/${total}`}</p>
          <p className="text-xs text-muted-foreground">Child Agreed</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", dueReview > 0 ? "text-amber-600" : "text-green-600")}>{dueReview}</p>
          <p className="text-xs text-muted-foreground">Review Due 30d</p>
        </div>
      </div>

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-6 flex items-start gap-2">
        <Utensils className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          Food is identity, comfort, and culture. Each child&apos;s plan respects allergies, sensory profiles,
          religious/cultural needs, and personal preferences. Casey&apos;s ARFID profile requires specialist
          attention — see plan in detail.
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
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">By Child</SelectItem>
              <SelectItem value="review">Earliest Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((plan) => {
          const isExpanded = expandedId === plan.id;
          const hasCritical = plan.allergies.some((a) => a.severity === "Life-threatening" || a.severity === "Severe");

          return (
            <div key={plan.id} className={cn("rounded-xl border bg-white overflow-hidden",
              hasCritical && "border-l-4 border-l-red-500"
            )}>
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : plan.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Utensils className="h-5 w-5 text-amber-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(plan.youngPerson)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {plan.allergies.length} allergies &middot; {plan.intolerances.length} intolerances &middot; Reviewed {plan.reviewedDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {hasCritical && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  {plan.signedOffByDietitian && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">Dietitian</span>
                  )}
                  {plan.childAgreed && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {/* allergies */}
                  {plan.allergies.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />Allergies
                      </p>
                      <div className="space-y-1">
                        {plan.allergies.map((a, i) => (
                          <div key={i} className="bg-white rounded-lg p-2 border border-red-200">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{a.allergen}</span>
                              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", severityColour[a.severity])}>{a.severity}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Reaction: {a.reaction}</p>
                            <p className="text-xs text-red-700 mt-1"><strong>Treatment:</strong> {a.treatment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {plan.intolerances.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Intolerances</p>
                      <ul className="space-y-1">
                        {plan.intolerances.map((i, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{i}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {plan.medicalDietaryNeeds.length > 0 && (
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Medical Dietary Needs</p>
                      <ul className="space-y-1">
                        {plan.medicalDietaryNeeds.map((m, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-purple-600 mt-0.5">•</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {plan.sensoryFoodNeeds.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Sensory Food Needs</p>
                      <ul className="space-y-1">
                        {plan.sensoryFoodNeeds.map((s, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">
                        <Heart className="h-3 w-3 inline mr-1" />Preferred Foods
                      </p>
                      <ul className="space-y-1">
                        {plan.preferredFoods.map((f, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-green-600 mt-0.5">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-1">Disliked Foods</p>
                      <ul className="space-y-1">
                        {plan.dislikedFoods.map((f, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-red-600 mt-0.5">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                      <Apple className="h-3 w-3 inline mr-1" />Always Available
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {plan.alwaysAvailable.map((a, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">{a}</span>
                      ))}
                    </div>
                  </div>

                  {plan.religiousDietaryNeeds && (
                    <div className="bg-indigo-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wide mb-1">Religious / Cultural</p>
                      <p className="text-sm">{plan.religiousDietaryNeeds}</p>
                    </div>
                  )}

                  {plan.ethicalChoices && (
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Ethical Choices</p>
                      <p className="text-sm">{plan.ethicalChoices}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <Coffee className="h-3 w-3 inline mr-1" />Mealtime Routines
                    </p>
                    <ul className="space-y-1">
                      {plan.mealtimeRoutines.map((m, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Cooking Involvement</p>
                      <p className="text-sm bg-white rounded-lg p-2 border">{plan.cookingInvolvement}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Shopping Involvement</p>
                      <p className="text-sm bg-white rounded-lg p-2 border">{plan.shoppingInvolvement}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Growth Monitoring</p>
                    <p className="text-sm">Weight: {plan.growthMonitoring.lastWeight} ({plan.growthMonitoring.lastWeightDate})</p>
                    <p className="text-sm">Height: {plan.growthMonitoring.lastHeight} ({plan.growthMonitoring.lastHeightDate})</p>
                    <p className="text-xs text-muted-foreground mt-1">{plan.growthMonitoring.concerns}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Reviewed: {plan.reviewedDate} by {getStaffName(plan.reviewedBy)}</span>
                    <span>Next review: {plan.nextReviewDate}</span>
                    {plan.signedOffByDietitian && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">Dietitian Signed Off</span>}
                    {plan.childAgreed && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Child Co-Produced</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Dietary plans support Quality Standard 7 (health and wellbeing),
          Quality Standard 1 (child-centred care), Equality Act 2010 (cultural and religious observance),
          and Reg 23 (records of food provided). Plans are co-produced with each child, reviewed quarterly,
          and shared with all staff including agency cover. Linked to Healthcare Plans and Religious Observance Log.
        </p>
      </div>
    </PageShell>
  );
}
