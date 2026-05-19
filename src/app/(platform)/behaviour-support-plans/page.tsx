"use client";

// ==============================================================================
// CORNERSTONE -- BEHAVIOUR SUPPORT PLANS
// Formal, structured plans for supporting children with challenging behaviour.
// Covers triggers, de-escalation (traffic-light model), positive strategies,
// safety plans, restrictive interventions, and multi-agency professional input.
// Aligned with SEND Code of Practice, Reg 19, trauma-informed practice.
// ==============================================================================

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, Filter, ArrowUpDown,
  ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle2, Clock, Heart, Shield, Loader2, ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useBehaviourSupportPlans, useCreateBSP } from "@/hooks/use-behaviour-support-plans";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import Link from "next/link";
import { getStaffName, getYPName } from "@/lib/seed-data";
import type { BehaviourSupportPlan, BSPPrimaryBehaviour, BSPKnownTrigger, BSPDeEscalationStage, BSPPositiveStrategy, BSPReward, BSPBoundary, BSPSafetyPlanItem, BSPProfessionalInput, BSPRestrictiveIntervention, BSPReviewHistoryEntry } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

// -- Helpers ------------------------------------------------------------------

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const STATUS_COLOURS: Record<BehaviourSupportPlan["status"], string> = {
  active: "bg-green-100 text-green-800",
  under_review: "bg-amber-100 text-amber-800",
  draft: "bg-gray-100 text-gray-700",
  archived: "bg-slate-100 text-[var(--cs-text-secondary)]",
  suspended: "bg-red-100 text-red-800",
};

const SEVERITY_COLOURS: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

const LIKELIHOOD_COLOURS: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-green-100 text-green-700",
};

const EFFECTIVENESS_COLOURS: Record<string, string> = {
  highly_effective: "bg-green-100 text-green-800",
  effective: "bg-blue-100 text-blue-800",
  partially_effective: "bg-amber-100 text-amber-800",
  not_effective: "bg-red-100 text-red-800",
};

const CATEGORY_COLOURS: Record<string, string> = {
  environmental: "bg-teal-100 text-teal-800",
  emotional: "bg-pink-100 text-pink-800",
  social: "bg-indigo-100 text-indigo-800",
  sensory: "bg-purple-100 text-purple-800",
  routine_change: "bg-orange-100 text-orange-800",
  demand: "bg-red-100 text-red-800",
  transition: "bg-blue-100 text-blue-800",
};

const trendArrow = (t: string) =>
  t === "improving" ? <span className="text-green-600 font-bold">&uarr;</span> :
  t === "stable"    ? <span className="text-gray-500 font-bold">&rarr;</span> :
                      <span className="text-red-600 font-bold">&darr;</span>;

const trendColour = (t: string) =>
  t === "improving" ? "text-green-600" : t === "stable" ? "text-gray-500" : "text-red-600";

// -- Export Columns -----------------------------------------------------------

const EXPORT_COLS: ExportColumn<BehaviourSupportPlan>[] = [
  { header: "Young Person", accessor: (r: BehaviourSupportPlan) => getYPName(r.child_id) },
  { header: "Status", accessor: (r: BehaviourSupportPlan) => r.status.replace(/_/g, " ") },
  { header: "Diagnoses", accessor: (r: BehaviourSupportPlan) => r.diagnosis.join(", ") },
  { header: "Created", accessor: (r: BehaviourSupportPlan) => r.created_date },
  { header: "Created By", accessor: (r: BehaviourSupportPlan) => getStaffName(r.created_by) },
  { header: "Review Due", accessor: (r: BehaviourSupportPlan) => r.review_date },
  { header: "Last Reviewed", accessor: (r: BehaviourSupportPlan) => r.last_reviewed ?? "N/A" },
  { header: "Primary Behaviours", accessor: (r: BehaviourSupportPlan) => r.primary_behaviours.map((b) => `${b.behaviour} (${b.frequency}, ${b.severity}, ${b.trend})`).join("; ") },
  { header: "Known Triggers", accessor: (r: BehaviourSupportPlan) => r.known_triggers.map((t) => `${t.trigger} (${t.category})`).join("; ") },
  { header: "Early Warnings", accessor: (r: BehaviourSupportPlan) => r.early_warnings.join("; ") },
  { header: "Communication Needs", accessor: (r: BehaviourSupportPlan) => r.communication_needs },
  { header: "Child Views", accessor: (r: BehaviourSupportPlan) => r.child_views },
  { header: "Staff Guidance", accessor: (r: BehaviourSupportPlan) => r.staff_guidance.join("; ") },
  { header: "Sensory Considerations", accessor: (r: BehaviourSupportPlan) => r.sensory_considerations },
];

// =============================================================================
// Component
// =============================================================================

export default function BehaviourSupportPlansPage() {
  const { data: bspData, isLoading } = useBehaviourSupportPlans();
  const createBSP = useCreateBSP();
  const plans = bspData?.data ?? [];
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [childFilter, setChildFilter] = useState("all");
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));
  const today = new Date().toISOString().slice(0, 10);

  const children = useMemo(() => {
    const ids = [...new Set(plans.map((p) => p.child_id))];
    return ids.map((id) => ({ id, name: getYPName(id) }));
  }, [plans]);

  const filtered = useMemo(() => {
    let list = [...plans];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (p) =>
          getYPName(p.child_id).toLowerCase().includes(s) ||
          p.diagnosis.some((dx) => dx.toLowerCase().includes(s)) ||
          p.primary_behaviours.some((b) => b.behaviour.toLowerCase().includes(s)) ||
          p.known_triggers.some((t) => t.trigger.toLowerCase().includes(s))
      );
    }
    if (statusFilter !== "all") list = list.filter((p) => p.status === statusFilter);
    if (childFilter !== "all") list = list.filter((p) => p.child_id === childFilter);
    return list;
  }, [plans, search, statusFilter, childFilter]);

  const stats = useMemo(() => {
    const active = plans.filter((p) => p.status === "active").length;
    const dueReview = plans.filter((p) => p.review_date <= today).length;
    const allBehaviours = plans.flatMap((p) => p.primary_behaviours);
    const improving = allBehaviours.filter((b) => b.trend === "improving").length;
    const improvingPct = allBehaviours.length > 0 ? Math.round((improving / allBehaviours.length) * 100) : 0;
    // Incidents this week -- mock count based on worsening/stable behaviours
    const incidentsThisWeek = plans.flatMap((p) => p.primary_behaviours).filter((b) => b.frequency === "daily" || b.frequency === "weekly").length;
    return { active, dueReview, improvingPct, incidentsThisWeek };
  }, [plans, today]);

  const overdueReviews = plans.filter((p) => p.review_date <= today);
  const underReviewPlans = plans.filter((p) => p.status === "under_review");

  return (
    <PageShell
      title="Behaviour Support Plans"
      subtitle="Formal behaviour support strategies -- triggers, de-escalation, positive reinforcement, and safety plans"
      ariaContext={{ pageTitle: "Behaviour Support Plans", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Behaviour Support Plans" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="behaviour-support-plans" />
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-1" /> New BSP
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
      <div id="print-area" className="space-y-6">
        {/* -- Summary Strip ------------------------------------------------- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Active Plans", value: stats.active, icon: Shield, colour: "text-blue-600" },
            { label: "Due for Review", value: stats.dueReview, icon: Clock, colour: stats.dueReview > 0 ? "text-orange-600" : "text-green-600" },
            { label: "Improving Behaviours", value: `${stats.improvingPct}%`, icon: CheckCircle2, colour: "text-green-600" },
            { label: "Incidents This Week", value: stats.incidentsThisWeek, icon: AlertTriangle, colour: stats.incidentsThisWeek > 3 ? "text-red-600" : "text-amber-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* -- Alert Banners ------------------------------------------------- */}
        {overdueReviews.length > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <div className="text-sm text-red-800">
              <strong>Overdue Review:</strong>{" "}
              {overdueReviews.map((p) => getYPName(p.child_id)).join(", ")} &mdash;
              BSP review is overdue. Please schedule an urgent review with the care team.
            </div>
          </div>
        )}
        {underReviewPlans.length > 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
            <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-800">
              <strong>Under Review:</strong>{" "}
              {underReviewPlans.map((p) => getYPName(p.child_id)).join(", ")} &mdash;
              BSP is currently under review following professional recommendations.
            </div>
          </div>
        )}

        {/* -- Filters ------------------------------------------------------- */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search behaviours, triggers, diagnoses..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={childFilter} onValueChange={setChildFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Child" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {children.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* -- Per-Child Overview Cards --------------------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {children.map((c) => {
            const cp = plans.find((p) => p.child_id === c.id);
            if (!cp) return null;
            const behaviourCount = cp.primary_behaviours.length;
            const improvingCount = cp.primary_behaviours.filter((b) => b.trend === "improving").length;
            const worseningCount = cp.primary_behaviours.filter((b) => b.trend === "worsening").length;
            return (
              <Card
                key={c.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setChildFilter(childFilter === c.id ? "all" : c.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">{c.name}</p>
                    <Badge className={cn("text-xs", STATUS_COLOURS[cp.status])}>
                      {cp.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <span>{behaviourCount} behaviours</span>
                    {improvingCount > 0 && <span className="text-green-600">{improvingCount} improving</span>}
                    {worseningCount > 0 && <span className="text-red-600">{worseningCount} worsening</span>}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {cp.diagnosis.map((dx) => (
                      <Badge key={dx} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                        {dx}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Review due: <span className={cn(cp.review_date <= today ? "text-red-600 font-medium" : "")}>{cp.review_date}</span>
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* -- BSP Detail Cards ---------------------------------------------- */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No behaviour support plans match your filters.</p>
          )}
          {filtered.map((plan) => {
            const isExpanded = !!expanded[plan.id];
            const reviewOverdue = plan.review_date <= today;

            return (
              <div key={plan.id} className={cn("rounded-xl border bg-white overflow-hidden", reviewOverdue && "border-l-4 border-l-red-400")}>
                {/* -- Header ------------------------------------------------ */}
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                  onClick={() => toggle(plan.id)}
                  aria-expanded={isExpanded}
                  aria-label={`Expand behaviour support plan for ${getYPName(plan.child_id)}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Shield className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{getYPName(plan.child_id)}</p>
                        <Badge className={cn("text-xs", STATUS_COLOURS[plan.status])}>
                          {plan.status.replace(/_/g, " ")}
                        </Badge>
                        {reviewOverdue && (
                          <Badge variant="destructive" className="text-xs">Review overdue</Badge>
                        )}
                        {(plan as never as { care_event_id?: string }).care_event_id && (
                          <Link
                            href={`/care-events/${(plan as never as { care_event_id: string }).care_event_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                          >
                            <ArrowUpRight className="h-3 w-3" />
                            From Care Event
                          </Link>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                        <span>Created: {plan.created_date}</span>
                        <span>By {getStaffName(plan.created_by)}</span>
                        <span>Review: {plan.review_date}</span>
                        <span className="flex items-center gap-1">
                          {plan.primary_behaviours.map((b, i) => (
                            <span key={i} className={cn("inline-flex items-center gap-0.5", trendColour(b.trend))}>
                              {trendArrow(b.trend)}
                            </span>
                          ))}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {/* -- Expanded Content -------------------------------------- */}
                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* Diagnoses */}
                    <div className="flex flex-wrap gap-1">
                      {plan.diagnosis.map((dx) => (
                        <Badge key={dx} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                          {dx}
                        </Badge>
                      ))}
                    </div>

                    {/* Primary Behaviours Table */}
                    <div>
                      <p className="text-sm font-medium mb-2">Primary Behaviours</p>
                      <div className="rounded-lg border bg-white overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/40">
                            <tr>
                              <th className="text-left p-2 font-medium text-xs">Behaviour</th>
                              <th className="text-left p-2 font-medium text-xs">Frequency</th>
                              <th className="text-left p-2 font-medium text-xs">Severity</th>
                              <th className="text-left p-2 font-medium text-xs">Trend</th>
                            </tr>
                          </thead>
                          <tbody>
                            {plan.primary_behaviours.map((b, i) => (
                              <tr key={i} className="border-t">
                                <td className="p-2">{b.behaviour}</td>
                                <td className="p-2">
                                  <Badge variant="outline" className="text-xs">{b.frequency}</Badge>
                                </td>
                                <td className="p-2">
                                  <Badge className={cn("text-xs", SEVERITY_COLOURS[b.severity])}>{b.severity}</Badge>
                                </td>
                                <td className="p-2">
                                  <span className={cn("inline-flex items-center gap-1 text-xs font-medium", trendColour(b.trend))}>
                                    {trendArrow(b.trend)} {b.trend}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Traffic Light De-Escalation */}
                    <div>
                      <p className="text-sm font-medium mb-2">De-Escalation (Traffic Light Model)</p>
                      <div className="space-y-2">
                        {plan.de_escalation.map((stage) => {
                          const stageConfig = {
                            green: { bg: "bg-green-50 border-green-200", title: "Green Zone -- Calm / Regulated", titleColour: "text-green-800", icon: <CheckCircle2 className="h-4 w-4 text-green-600" /> },
                            amber: { bg: "bg-amber-50 border-amber-200", title: "Amber Zone -- Early Signs / Escalating", titleColour: "text-amber-800", icon: <AlertTriangle className="h-4 w-4 text-amber-600" /> },
                            red:   { bg: "bg-red-50 border-red-200", title: "Red Zone -- Crisis", titleColour: "text-red-800", icon: <AlertTriangle className="h-4 w-4 text-red-600" /> },
                          }[stage.stage];
                          return (
                            <div key={stage.stage} className={cn("rounded-lg border p-3", stageConfig.bg)}>
                              <div className="flex items-center gap-2 mb-2">
                                {stageConfig.icon}
                                <p className={cn("text-xs font-semibold", stageConfig.titleColour)}>{stageConfig.title}</p>
                              </div>
                              <ul className="space-y-1 mb-2">
                                {stage.strategies.map((s, i) => (
                                  <li key={i} className="text-sm flex items-start gap-1">
                                    <span className="text-muted-foreground mt-0.5 shrink-0">&#8226;</span>
                                    <span>{s}</span>
                                  </li>
                                ))}
                              </ul>
                              <p className="text-xs text-muted-foreground">
                                <strong>Staff approach:</strong> {stage.staff_approach}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Known Triggers */}
                    <div>
                      <p className="text-sm font-medium mb-2">Known Triggers</p>
                      <div className="space-y-1">
                        {plan.known_triggers.map((t, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm bg-white rounded-lg border p-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                            <span className="flex-1">{t.trigger}</span>
                            <Badge className={cn("text-xs", CATEGORY_COLOURS[t.category])}>{t.category.replace(/_/g, " ")}</Badge>
                            <Badge className={cn("text-xs", LIKELIHOOD_COLOURS[t.likelihood])}>{t.likelihood}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Early Warning Signs */}
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <p className="text-xs font-semibold text-amber-800 mb-2">Early Warning Signs</p>
                      <ol className="space-y-1 list-decimal list-inside">
                        {plan.early_warnings.map((w, i) => (
                          <li key={i} className="text-sm text-amber-900">{w}</li>
                        ))}
                      </ol>
                    </div>

                    {/* Positive Strategies Table */}
                    <div>
                      <p className="text-sm font-medium mb-2">Positive Strategies</p>
                      <div className="rounded-lg border bg-white overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/40">
                            <tr>
                              <th className="text-left p-2 font-medium text-xs">Strategy</th>
                              <th className="text-left p-2 font-medium text-xs">Frequency</th>
                              <th className="text-left p-2 font-medium text-xs">Effectiveness</th>
                            </tr>
                          </thead>
                          <tbody>
                            {plan.positive_strategies.map((s, i) => (
                              <tr key={i} className="border-t">
                                <td className="p-2">{s.strategy}</td>
                                <td className="p-2 text-muted-foreground">{s.frequency}</td>
                                <td className="p-2">
                                  <Badge className={cn("text-xs", EFFECTIVENESS_COLOURS[s.effectiveness])}>
                                    {s.effectiveness.replace(/_/g, " ")}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Rewards & Boundaries side-by-side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Rewards */}
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <p className="text-xs font-semibold text-green-800 mb-2">Rewards</p>
                        <div className="space-y-2">
                          {plan.rewards.map((r, i) => (
                            <div key={i} className="text-sm">
                              <p className="font-medium">{r.reward}</p>
                              <p className="text-xs text-green-700">Earned by: {r.earned_by} &middot; {r.frequency}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Boundaries */}
                      <div className="rounded-lg bg-slate-50 border border-[var(--cs-border)] p-3">
                        <p className="text-xs font-semibold text-[var(--cs-navy)] mb-2">Boundaries</p>
                        <div className="space-y-2">
                          {plan.boundaries.map((b, i) => (
                            <div key={i} className="text-sm">
                              <p className="font-medium">{b.boundary}</p>
                              <p className="text-xs text-[var(--cs-text-secondary)]">Consequence: {b.consequence}</p>
                              <p className="text-xs text-muted-foreground">Rationale: {b.rationale}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Safety Plan */}
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-red-600" />
                        <p className="text-xs font-semibold text-red-800">Safety Plan</p>
                      </div>
                      <div className="space-y-3">
                        {plan.safety_plan.map((sp, i) => (
                          <div key={i} className="text-sm">
                            <p className="font-medium text-red-900">{sp.scenario}</p>
                            <p className="text-red-800 mt-1">{sp.response}</p>
                            <p className="text-xs text-red-600 mt-0.5">Staff required: {sp.staff_required}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Restrictive Interventions */}
                    <div className="rounded-lg bg-slate-800 text-white p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-[var(--cs-text-gentle)]" />
                        <p className="text-xs font-semibold text-slate-200">Restrictive Interventions</p>
                      </div>
                      <div className="space-y-2">
                        {plan.restrictive_interventions.map((ri, i) => (
                          <div key={i} className="text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{ri.intervention}</p>
                              {ri.last_resort && (
                                <Badge className="text-xs bg-red-500/20 text-red-300 border border-red-500/30">LAST RESORT</Badge>
                              )}
                            </div>
                            <p className="text-[var(--cs-text-gentle)] text-xs">Authorised by: {getStaffName(ri.authorised_by)}</p>
                            <p className="text-[var(--cs-text-gentle)] text-xs mt-0.5">{ri.conditions}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Child Views, Parent Views, Professional Input */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Child Views */}
                      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <Heart className="h-4 w-4 text-pink-600" />
                          <p className="text-xs font-semibold text-pink-800">Child&apos;s Views</p>
                        </div>
                        <p className="text-sm text-pink-900">{plan.child_views}</p>
                      </div>
                      {/* Parent Views */}
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs font-semibold text-blue-800 mb-1">Parent / Carer Views</p>
                        <p className="text-sm text-blue-900">{plan.parent_views}</p>
                      </div>
                    </div>

                    {/* Professional Input */}
                    <div>
                      <p className="text-sm font-medium mb-2">Professional Input</p>
                      <div className="rounded-lg border bg-white overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/40">
                            <tr>
                              <th className="text-left p-2 font-medium text-xs">Name</th>
                              <th className="text-left p-2 font-medium text-xs">Role</th>
                              <th className="text-left p-2 font-medium text-xs">Recommendation</th>
                              <th className="text-left p-2 font-medium text-xs">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {plan.professional_input.map((pi, i) => (
                              <tr key={i} className="border-t">
                                <td className="p-2 font-medium">{pi.name}</td>
                                <td className="p-2 text-muted-foreground">{pi.role}</td>
                                <td className="p-2">{pi.recommendation}</td>
                                <td className="p-2 text-muted-foreground text-xs">{pi.date}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Staff Guidance */}
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <p className="text-xs font-semibold text-blue-800">Staff Guidance -- Essential Reading</p>
                      </div>
                      <ul className="space-y-1">
                        {plan.staff_guidance.map((g, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 mt-0.5 shrink-0" />
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Communication Needs & Sensory Considerations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-lg border bg-white p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Communication Needs</p>
                        <p className="text-sm">{plan.communication_needs}</p>
                      </div>
                      <div className="rounded-lg border bg-white p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Sensory Considerations</p>
                        <p className="text-sm">{plan.sensory_considerations}</p>
                      </div>
                    </div>

                    {/* Review History */}
                    <div>
                      <p className="text-sm font-medium mb-2">Review History</p>
                      <div className="space-y-2">
                        {plan.review_history.map((rh, i) => (
                          <div key={i} className="rounded-lg border bg-white p-3 text-sm">
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1">
                              <span>{rh.date}</span>
                              <span>Reviewed by {getStaffName(rh.reviewed_by)}</span>
                            </div>
                            <p className="mb-1">{rh.changes}</p>
                            <p className="text-xs text-muted-foreground"><strong>Outcome:</strong> {rh.outcome}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <SmartLinkPanel sourceType="behaviour_support" sourceId={plan.id} childId={plan.child_id} compact />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* -- Regulatory Note ----------------------------------------------- */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>SEND Code of Practice, Regulation 19 & Trauma-Informed Practice:</strong>{" "}
          Behaviour support plans must be developed in line with the SEND Code of Practice (2015)
          and the Children&apos;s Homes Regulations 2015, Regulation 19 (behaviour management). Plans
          must prioritise positive behaviour support, de-escalation, and trauma-informed approaches.
          Restrictive interventions are a last resort only. Each plan must reflect the child&apos;s voice,
          involve multi-agency professionals, and be reviewed regularly. The home must ensure all
          staff are trained in the approaches outlined and that plans are accessible to the full team.
        </div>
      </div>
      )}

      {/* -- New BSP Dialog -------------------------------------------------- */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Behaviour Support Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bsp-child">Young Person</Label>
                <Select>
                  <SelectTrigger id="bsp-child">
                    <SelectValue placeholder="Select child" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bsp-status">Status</Label>
                <Select>
                  <SelectTrigger id="bsp-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="bsp-diagnosis">Diagnoses (comma-separated)</Label>
              <Input id="bsp-diagnosis" placeholder="e.g. ADHD, Anxiety" />
            </div>
            <div>
              <Label htmlFor="bsp-behaviours">Primary Behaviours</Label>
              <Textarea id="bsp-behaviours" placeholder="Describe the primary behaviours of concern..." rows={3} />
            </div>
            <div>
              <Label htmlFor="bsp-triggers">Known Triggers</Label>
              <Textarea id="bsp-triggers" placeholder="List known triggers..." rows={3} />
            </div>
            <div>
              <Label htmlFor="bsp-warnings">Early Warning Signs</Label>
              <Textarea id="bsp-warnings" placeholder="Observable signs before escalation..." rows={3} />
            </div>
            <div>
              <Label htmlFor="bsp-deescalation">De-Escalation Strategies</Label>
              <Textarea id="bsp-deescalation" placeholder="Green / Amber / Red zone strategies..." rows={4} />
            </div>
            <div>
              <Label htmlFor="bsp-positive">Positive Strategies</Label>
              <Textarea id="bsp-positive" placeholder="Positive reinforcement strategies..." rows={3} />
            </div>
            <div>
              <Label htmlFor="bsp-safety">Safety Plan</Label>
              <Textarea id="bsp-safety" placeholder="High-risk scenarios and responses..." rows={3} />
            </div>
            <div>
              <Label htmlFor="bsp-child-views">Child&apos;s Views</Label>
              <Textarea id="bsp-child-views" placeholder="What has the child said about their behaviour and support?" rows={3} />
            </div>
            <div>
              <Label htmlFor="bsp-comms">Communication Needs</Label>
              <Textarea id="bsp-comms" placeholder="Communication preferences and needs..." rows={2} />
            </div>
            <div>
              <Label htmlFor="bsp-sensory">Sensory Considerations</Label>
              <Textarea id="bsp-sensory" placeholder="Sensory sensitivities and preferences..." rows={2} />
            </div>
            <div>
              <Label htmlFor="bsp-guidance">Staff Guidance</Label>
              <Textarea id="bsp-guidance" placeholder="Key points for all staff to follow..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bsp-review">Review Date</Label>
                <Input id="bsp-review" type="date" />
              </div>
              <div>
                <Label htmlFor="bsp-created-by">Created By</Label>
                <Select>
                  <SelectTrigger id="bsp-created-by">
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff_darren">{getStaffName("staff_darren")}</SelectItem>
                    <SelectItem value="staff_ryan">{getStaffName("staff_ryan")}</SelectItem>
                    <SelectItem value="staff_edward">{getStaffName("staff_edward")}</SelectItem>
                    <SelectItem value="staff_anna">{getStaffName("staff_anna")}</SelectItem>
                    <SelectItem value="staff_chervelle">{getStaffName("staff_chervelle")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button disabled={createBSP.isPending} onClick={() => { createBSP.mutate({ child_id: "yp_alex", status: "draft", created_date: d(0), created_by: "staff_darren", review_date: d(42), diagnosis: [], primary_behaviours: [], known_triggers: [], early_warnings: [], de_escalation: [], positive_strategies: [], rewards: [], boundaries: [], safety_plan: [], communication_needs: "", sensory_considerations: "", child_views: "", parent_views: "", professional_input: [], staff_guidance: [], restrictive_interventions: [], review_history: [], home_id: "home_oak" }, { onSuccess: () => { toast.success("BSP created"); setShowNew(false); }, onError: () => toast.error("Failed to create BSP") }); }}>{createBSP.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Creating...</> : "Create BSP"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Related Care Events"
        category="behaviour"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
