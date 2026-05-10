"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn, daysFromNow } from "@/lib/utils";
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
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EatingSupportPlan, EatingPresentation } from "@/types/extended";
import { EATING_PRESENTATION_LABEL } from "@/types/extended";
import { useEatingSupportPlans } from "@/hooks/use-eating-support-plans";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

const exportCols: ExportColumn<EatingSupportPlan>[] = [
  { header: "Young Person", accessor: (r: EatingSupportPlan) => getYPName(r.child_id) },
  { header: "Plan Date", accessor: (r: EatingSupportPlan) => r.plan_date },
  { header: "Presentation", accessor: (r: EatingSupportPlan) => EATING_PRESENTATION_LABEL[r.presentation] },
  { header: "External Support", accessor: (r: EatingSupportPlan) => r.external_support.map((s) => `${s.agency} (${s.clinician})`).join("; ") },
  { header: "Safe Foods", accessor: (r: EatingSupportPlan) => r.safe_foods.join("; ") },
  { header: "Challenge Foods", accessor: (r: EatingSupportPlan) => r.challenge_foods.join("; ") },
  { header: "Triggers To Avoid", accessor: (r: EatingSupportPlan) => r.triggers_to_avoid.join("; ") },
  { header: "DO Strategies", accessor: (r: EatingSupportPlan) => r.staff_do_strategies.join("; ") },
  { header: "DO NOT", accessor: (r: EatingSupportPlan) => r.staff_do_not_strategies.join("; ") },
  { header: "Weight Monitoring", accessor: (r: EatingSupportPlan) => r.weight_monitoring_frequency ?? "—" },
  { header: "Child Voice", accessor: (r: EatingSupportPlan) => r.child_voice },
  { header: "Child Chose", accessor: (r: EatingSupportPlan) => (r.child_chose ? "Yes" : "No") },
  { header: "Review", accessor: (r: EatingSupportPlan) => r.review_date },
  { header: "Key Worker", accessor: (r: EatingSupportPlan) => getStaffName(r.key_worker) },
];

const presentationColour: Record<EatingPresentation, string> = {
  arfid: "bg-amber-100 text-amber-800 border-amber-200",
  sensory_led_restriction: "bg-orange-100 text-orange-800 border-orange-200",
  disordered_eating_restrictive: "bg-red-100 text-red-800 border-red-200",
  disordered_eating_binge_pattern: "bg-red-100 text-red-800 border-red-200",
  cultural_faith_dietary_needs: "bg-emerald-100 text-emerald-800 border-emerald-200",
  allergy_medical: "bg-blue-100 text-blue-800 border-blue-200",
  recovery_post_diagnosis: "bg-purple-100 text-purple-800 border-purple-200",
  healthy_relationship_preventive: "bg-teal-100 text-teal-800 border-teal-200",
  multiple_presentations: "bg-rose-100 text-rose-800 border-rose-200",
};

export default function EatingSupportPlanPage() {
  const { data: queryData, isLoading } = useEatingSupportPlans();
  const records = queryData?.data ?? [];

  const [search, setSearch] = useState("");
  const [presentationFilter, setPresentationFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "presentation" | "review">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        getYPName(rec.child_id).toLowerCase().includes(search.toLowerCase()) ||
        EATING_PRESENTATION_LABEL[rec.presentation].toLowerCase().includes(search.toLowerCase());
      const matchesPresentation = presentationFilter === "all" || rec.presentation === presentationFilter;
      return matchesSearch && matchesPresentation;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "name") return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
      if (sortBy === "presentation") return a.presentation.localeCompare(b.presentation);
      if (sortBy === "review") return a.review_date.localeCompare(b.review_date);
      return b.plan_date.localeCompare(a.plan_date);
    });
    return r;
  }, [records, search, presentationFilter, sortBy]);

  const stats = useMemo(() => {
    const activePlans = records.length;
    const camhsInvolved = records.filter((r) =>
      r.external_support.some((s) => s.agency.toLowerCase().includes("camhs"))
    ).length;
    const childChose = records.filter((r) => r.child_chose).length;
    const reviewsDue = records.filter((r) => r.review_date <= daysFromNow(30)).length;
    return { activePlans, camhsInvolved, childChose, reviewsDue };
  }, [records]);

  if (isLoading) {
    return (
      <PageShell
        title="Eating Support Plans"
        subtitle="Per-child eating support — ARFID, sensory-led restriction, recovery from disordered eating, cultural/faith dietary needs, allergy. Sensory-led, dignified, body-neutral, externally-supported where appropriate. Distinct from menstrual or general health plans."
      >
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Eating Support Plans"
      subtitle="Per-child eating support — ARFID, sensory-led restriction, recovery from disordered eating, cultural/faith dietary needs, allergy. Sensory-led, dignified, body-neutral, externally-supported where appropriate. Distinct from menstrual or general health plans."
      ariaContext={{ pageTitle: "Eating Support Plans", sourceType: "child_record" }}
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="eating-support-plan" />
          <PrintButton title="Eating Support Plans" />
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
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
            <SelectItem value="arfid">{EATING_PRESENTATION_LABEL.arfid}</SelectItem>
            <SelectItem value="sensory_led_restriction">{EATING_PRESENTATION_LABEL.sensory_led_restriction}</SelectItem>
            <SelectItem value="disordered_eating_restrictive">{EATING_PRESENTATION_LABEL.disordered_eating_restrictive}</SelectItem>
            <SelectItem value="disordered_eating_binge_pattern">{EATING_PRESENTATION_LABEL.disordered_eating_binge_pattern}</SelectItem>
            <SelectItem value="cultural_faith_dietary_needs">{EATING_PRESENTATION_LABEL.cultural_faith_dietary_needs}</SelectItem>
            <SelectItem value="allergy_medical">{EATING_PRESENTATION_LABEL.allergy_medical}</SelectItem>
            <SelectItem value="recovery_post_diagnosis">{EATING_PRESENTATION_LABEL.recovery_post_diagnosis}</SelectItem>
            <SelectItem value="healthy_relationship_preventive">{EATING_PRESENTATION_LABEL.healthy_relationship_preventive}</SelectItem>
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
                    <span className="font-semibold text-slate-900">{getYPName(r.child_id)}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", presentationColour[r.presentation])}>
                      {EATING_PRESENTATION_LABEL[r.presentation]}
                    </span>
                    {r.child_chose ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-pink-100 text-pink-800 border-pink-200">
                        Co-produced
                      </span>
                    ) : null}
                    {r.flags_for_review.length ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-100 text-amber-800 border-amber-200">
                        {r.flags_for_review.length} flag{r.flags_for_review.length === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-slate-600">
                    Plan {r.plan_date} · Review {r.review_date} · {getStaffName(r.key_worker)}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Child Voice</div>
                      <p className="text-sm text-slate-700 italic">&ldquo;{r.child_voice}&rdquo;</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Staff Observation</div>
                      <p className="text-sm text-slate-700">{r.staff_observation}</p>
                    </div>
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                      <div className="text-xs font-semibold text-emerald-700 uppercase mb-2">Safe foods</div>
                      <ul className="text-sm text-emerald-900 space-y-1">
                        {r.safe_foods.map((f, i) => (
                          <li key={i} className="flex gap-2"><span>+</span><span>{f}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                      <div className="text-xs font-semibold text-amber-800 uppercase mb-2">Challenge foods</div>
                      <ul className="text-sm text-amber-900 space-y-1">
                        {r.challenge_foods.map((f, i) => (
                          <li key={i} className="flex gap-2"><span>!</span><span>{f}</span></li>
                        ))}
                      </ul>
                    </div>
                    {r.triggers_to_avoid.length ? (
                      <div className="rounded-md border border-red-200 bg-red-50 p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-red-700 uppercase mb-2">Triggers to avoid</div>
                        <ul className="text-sm text-red-900 space-y-1">
                          {r.triggers_to_avoid.map((t, i) => (
                            <li key={i} className="flex gap-2"><span>×</span><span>{t}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                      <div className="text-xs font-semibold text-emerald-700 uppercase mb-2">Staff DO</div>
                      <ul className="text-sm text-emerald-900 space-y-1">
                        {r.staff_do_strategies.map((s, i) => (
                          <li key={i} className="flex gap-2"><span>·</span><span>{s}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
                      <div className="text-xs font-semibold text-rose-800 uppercase mb-2">Staff DO NOT</div>
                      <ul className="text-sm text-rose-900 space-y-1">
                        {r.staff_do_not_strategies.map((s, i) => (
                          <li key={i} className="flex gap-2"><span>×</span><span>{s}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Meal time approach</div>
                      <ul className="text-sm text-slate-700 space-y-1">
                        {r.meal_time_approach.map((m, i) => (
                          <li key={i} className="flex gap-2"><span className="text-slate-400">·</span><span>{m}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Environment set up</div>
                      <ul className="text-sm text-slate-700 space-y-1">
                        {r.eating_environment_set_up.map((m, i) => (
                          <li key={i} className="flex gap-2"><span className="text-slate-400">·</span><span>{m}</span></li>
                        ))}
                      </ul>
                    </div>
                    {r.external_support.length ? (
                      <div className="rounded-md border border-slate-200 bg-white p-3">
                        <div className="text-xs font-semibold text-slate-500 uppercase mb-2">External support</div>
                        <ul className="text-sm text-slate-700 space-y-1.5">
                          {r.external_support.map((s, i) => (
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
                        {r.weight_monitoring_frequency ? (
                          <div><span className="text-slate-500">Weight:</span> {r.weight_monitoring_frequency}</div>
                        ) : null}
                        {r.hydration_notes ? (
                          <div><span className="text-slate-500">Hydration:</span> {r.hydration_notes}</div>
                        ) : null}
                        {r.growth_check_notes ? (
                          <div className="col-span-2"><span className="text-slate-500">Growth:</span> {r.growth_check_notes}</div>
                        ) : null}
                      </div>
                    </div>
                    {r.flags_for_review.length ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> Flags for review
                        </div>
                        <ul className="text-sm text-amber-900 space-y-1">
                          {r.flags_for_review.map((f, i) => (
                            <li key={i} className="flex gap-2"><span>!</span><span>{f}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="lg:col-span-2">
                      <SmartLinkPanel sourceType="eating_support_plan" sourceId={r.id} childId={r.child_id} compact />
                    </div>
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
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Eating Support Plans — eating disorders, ARFID, restricted eating, mealtime support strategies, sensory food issues, CAMHS, nutritional plan, LAC health, dietician referral"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
