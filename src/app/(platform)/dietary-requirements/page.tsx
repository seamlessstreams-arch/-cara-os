"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { useDietaryPlans } from "@/hooks/use-dietary-plans";
import type { DietaryPlan } from "@/types/extended";
import { DIETARY_ALLERGY_SEVERITY_LABEL } from "@/types/extended";
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
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const severityColour: Record<string, string> = {
  life_threatening: "bg-red-200 text-red-900",
  severe: "bg-red-100 text-red-800",
  moderate: "bg-amber-100 text-amber-800",
  mild: "bg-blue-100 text-blue-800",
};

const exportCols: ExportColumn<DietaryPlan>[] = [
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Allergies", accessor: (r) => r.allergies.length > 0 ? r.allergies.map((a) => `${a.allergen} (${DIETARY_ALLERGY_SEVERITY_LABEL[a.severity]})`).join("; ") : "None" },
  { header: "Intolerances", accessor: (r) => r.intolerances.join("; ") || "None" },
  { header: "Medical Needs", accessor: (r) => r.medical_dietary_needs.join("; ") },
  { header: "Religious", accessor: (r) => r.religious_dietary_needs },
  { header: "Last Weight", accessor: (r) => `${r.growth_monitoring.last_weight} (${r.growth_monitoring.last_weight_date})` },
  { header: "Reviewed", accessor: (r) => r.reviewed_date },
  { header: "Child Agreed", accessor: (r) => r.child_agreed ? "Yes" : "No" },
];

export default function DietaryRequirementsPage() {
  const { data: res, isLoading } = useDietaryPlans();
  const records = useMemo(() => res?.data ?? [], [res]);

  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...records];
    if (filterYP !== "all") items = items.filter((p) => p.child_id === filterYP);
    items.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.child_id.localeCompare(b.child_id);
        case "review":
          return a.next_review_date.localeCompare(b.next_review_date);
        default:
          return 0;
      }
    });
    return items;
  }, [records, filterYP, sortBy]);

  const total = records.length;
  const criticalAllergies = records.filter((p) => p.allergies.some((a) => a.severity === "life_threatening" || a.severity === "severe")).length;
  const allChildAgreed = records.every((p) => p.child_agreed);
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysLater = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const dueReview = records.filter((p) => p.next_review_date <= thirtyDaysLater).length;

  if (isLoading) {
    return (
      <PageShell title="Dietary Requirements" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Dietary Requirements"
      subtitle="Personalised dietary plans — allergies, sensory needs, religious observance, and food relationships"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="dietary-requirements" />
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
          <p className="text-2xl font-bold text-green-600">{allChildAgreed ? "100%" : `${records.filter((p) => p.child_agreed).length}/${total}`}</p>
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
          religious/cultural needs, and personal preferences. Plans include ARFID profiles where relevant —
          see individual plans for detail.
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
          const hasCritical = plan.allergies.some((a) => a.severity === "life_threatening" || a.severity === "severe");

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
                    <p className="font-medium truncate">{getYPName(plan.child_id)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {plan.allergies.length} allergies &middot; {plan.intolerances.length} intolerances &middot; Reviewed {plan.reviewed_date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {hasCritical && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  {plan.signed_off_by_dietitian && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">Dietitian</span>
                  )}
                  {plan.child_agreed && <CheckCircle className="h-4 w-4 text-green-500" />}
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
                              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", severityColour[a.severity])}>{DIETARY_ALLERGY_SEVERITY_LABEL[a.severity]}</span>
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
                        {plan.intolerances.map((intol, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{intol}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {plan.medical_dietary_needs.length > 0 && (
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Medical Dietary Needs</p>
                      <ul className="space-y-1">
                        {plan.medical_dietary_needs.map((m, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-purple-600 mt-0.5">•</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {plan.sensory_food_needs.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Sensory Food Needs</p>
                      <ul className="space-y-1">
                        {plan.sensory_food_needs.map((s, i) => (
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
                        {plan.preferred_foods.map((f, i) => (
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
                        {plan.disliked_foods.map((f, i) => (
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
                      {plan.always_available.map((a, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">{a}</span>
                      ))}
                    </div>
                  </div>

                  {plan.religious_dietary_needs && (
                    <div className="bg-indigo-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wide mb-1">Religious / Cultural</p>
                      <p className="text-sm">{plan.religious_dietary_needs}</p>
                    </div>
                  )}

                  {plan.ethical_choices && (
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Ethical Choices</p>
                      <p className="text-sm">{plan.ethical_choices}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <Coffee className="h-3 w-3 inline mr-1" />Mealtime Routines
                    </p>
                    <ul className="space-y-1">
                      {plan.mealtime_routines.map((m, i) => (
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
                      <p className="text-sm bg-white rounded-lg p-2 border">{plan.cooking_involvement}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Shopping Involvement</p>
                      <p className="text-sm bg-white rounded-lg p-2 border">{plan.shopping_involvement}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Growth Monitoring</p>
                    <p className="text-sm">Weight: {plan.growth_monitoring.last_weight} ({plan.growth_monitoring.last_weight_date})</p>
                    <p className="text-sm">Height: {plan.growth_monitoring.last_height} ({plan.growth_monitoring.last_height_date})</p>
                    <p className="text-xs text-muted-foreground mt-1">{plan.growth_monitoring.concerns}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Reviewed: {plan.reviewed_date} by {getStaffName(plan.reviewed_by)}</span>
                    <span>Next review: {plan.next_review_date}</span>
                    {plan.signed_off_by_dietitian && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">Dietitian Signed Off</span>}
                    {plan.child_agreed && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Child Co-Produced</span>}
                  </div>

                  <SmartLinkPanel sourceType="dietary-plans" sourceId={plan.id} childId={plan.child_id} compact />
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
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
