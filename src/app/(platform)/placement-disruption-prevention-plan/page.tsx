"use client";

import { useState, useMemo } from "react";
import {
  ShieldAlert, Search, ArrowUpDown,
  AlertTriangle, CheckCircle2, TrendingUp,
  ChevronDown, ChevronUp, Calendar, Shield,
  Heart, Target, Clock, Users, UserCheck,
  Activity, FileSignature, Eye, Wrench, Loader2,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import type { DisruptionPreventionPlan, DisruptionRiskLevel } from "@/types/extended";
import { DISRUPTION_RISK_LEVEL_LABEL } from "@/types/extended";
import { useDisruptionPreventionPlans } from "@/hooks/use-disruption-prevention-plans";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";

/* ── constants ──────────────────────────────────────────────────────── */
const RISK_LEVEL_ORDER: DisruptionRiskLevel[] = ["low", "building", "heightened", "acute"];

const RISK_COLORS: Record<DisruptionRiskLevel, string> = {
  low: "bg-green-100 text-green-800",
  building: "bg-yellow-100 text-yellow-800",
  heightened: "bg-orange-100 text-orange-800",
  acute: "bg-red-100 text-red-800",
};

/* ── component ───────────────────────────────────────────────────────── */
export default function PlacementDisruptionPreventionPlanPage() {
  const { data: res, isLoading } = useDisruptionPreventionPlans();
  const records = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("risk");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          getYPName(r.child_id).toLowerCase().includes(q) ||
          r.key_stability_factors.some((s) => s.toLowerCase().includes(q)) ||
          r.warning_signs_to_watch_for.some((s) => s.toLowerCase().includes(q)) ||
          r.proactive_actions_in_place.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (riskFilter !== "all") {
      list = list.filter((r) => r.risk_of_disruption_level === riskFilter);
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "risk":
          return (
            RISK_LEVEL_ORDER.indexOf(b.risk_of_disruption_level) -
            RISK_LEVEL_ORDER.indexOf(a.risk_of_disruption_level)
          );
        case "review":
          return a.next_review_date.localeCompare(b.next_review_date);
        case "name":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        default:
          return 0;
      }
    });
    return list;
  }, [records, search, riskFilter, sortBy]);

  // Summary stats
  const activePlans = records.length;
  const heightenedOrAcute = records.filter(
    (r) => r.risk_of_disruption_level === "heightened" || r.risk_of_disruption_level === "acute"
  ).length;
  const todayIso = new Date().toISOString().slice(0, 10);
  const reviewsDue30 = records.filter((r) => {
    const nr = new Date(r.next_review_date);
    const today = new Date(todayIso);
    const diff = (nr.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 30;
  }).length;
  const allInterventions = records.flatMap((r) => r.interventions_deployed_history);
  const successfulInterventions = allInterventions.filter((i) =>
    /improv|recover|reduced|stable|working|signific|markedly/i.test(i.outcome)
  ).length;
  const successRate =
    allInterventions.length > 0
      ? Math.round((successfulInterventions / allInterventions.length) * 100)
      : 0;

  const exportCols: ExportColumn<DisruptionPreventionPlan>[] = [
    { header: "Young Person", accessor: (r: DisruptionPreventionPlan) => getYPName(r.child_id) },
    { header: "Plan Date", accessor: (r: DisruptionPreventionPlan) => r.plan_date },
    { header: "Risk Level", accessor: (r: DisruptionPreventionPlan) => DISRUPTION_RISK_LEVEL_LABEL[r.risk_of_disruption_level] },
    { header: "Key Stability Factors", accessor: (r: DisruptionPreventionPlan) => r.key_stability_factors.join("; ") },
    { header: "Warning Signs", accessor: (r: DisruptionPreventionPlan) => r.warning_signs_to_watch_for.join("; ") },
    { header: "Recent Triggers", accessor: (r: DisruptionPreventionPlan) => r.recent_triggers.join("; ") },
    { header: "Proactive Actions", accessor: (r: DisruptionPreventionPlan) => r.proactive_actions_in_place.join("; ") },
    { header: "Support Network", accessor: (r: DisruptionPreventionPlan) => r.support_network_in_place.join("; ") },
    { header: "Child Aware", accessor: (r: DisruptionPreventionPlan) => (r.child_aware_of_plan ? "Yes" : "No") },
    { header: "Child Contribution", accessor: (r: DisruptionPreventionPlan) => r.child_contribution },
    { header: "Family Involvement", accessor: (r: DisruptionPreventionPlan) => r.family_involvement },
    { header: "Professionals Involved", accessor: (r: DisruptionPreventionPlan) => r.professionals_involved.join("; ") },
    {
      header: "Warning-Sign Actions",
      accessor: (r: DisruptionPreventionPlan) =>
        r.special_actions_if_warning_signs_appear
          .map((a) => `${a.warning_sign} -> ${a.action} (owner: ${getStaffName(a.owner)}, ${a.timeframe})`)
          .join("; "),
    },
    { header: "Home-Specific Mitigations", accessor: (r: DisruptionPreventionPlan) => r.home_specific_mitigations.join("; ") },
    { header: "Staffing Adjustments", accessor: (r: DisruptionPreventionPlan) => r.staffing_adjustments },
    { header: "Child Actions Agreed", accessor: (r: DisruptionPreventionPlan) => r.child_actions_agreed.join("; ") },
    { header: "Reviewed Date", accessor: (r: DisruptionPreventionPlan) => r.reviewed_date },
    { header: "Reviewed By", accessor: (r: DisruptionPreventionPlan) => getStaffName(r.reviewed_by) },
    { header: "Next Review", accessor: (r: DisruptionPreventionPlan) => r.next_review_date },
    { header: "Signed Off by LA", accessor: (r: DisruptionPreventionPlan) => (r.signed_off_by_la ? "Yes" : "No") },
    {
      header: "Interventions History",
      accessor: (r: DisruptionPreventionPlan) =>
        r.interventions_deployed_history
          .map((i) => `${i.date}: ${i.intervention} -> ${i.outcome}`)
          .join("; "),
    },
  ];

  if (isLoading) {
    return (
      <PageShell title="Placement Disruption Prevention Plan" subtitle="Per-child proactive plans to prevent placement breakdown when warning signs emerge">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          <span className="ml-2 text-sm text-slate-400">Loading disruption prevention plans…</span>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Placement Disruption Prevention Plan"
      subtitle="Per-child proactive plans to prevent placement breakdown when warning signs emerge"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Placement Disruption Prevention Plans" />
          <ExportButton data={filtered} columns={exportCols} filename="disruption-prevention-plans" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Children with Active Plans", value: activePlans, icon: ShieldAlert, colour: "text-blue-600" },
            {
              label: "Heightened / Acute Risk",
              value: heightenedOrAcute,
              icon: AlertTriangle,
              colour: heightenedOrAcute > 0 ? "text-red-600" : "text-green-600",
            },
            { label: "Reviews Due (30d)", value: reviewsDue30, icon: Calendar, colour: "text-amber-600" },
            { label: "Intervention Success Rate", value: `${successRate}%`, icon: TrendingUp, colour: "text-green-600" },
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

        {/* ── filters / sort ─────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search young people, factors, warning signs…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="low">{DISRUPTION_RISK_LEVEL_LABEL.low}</SelectItem>
                <SelectItem value="building">{DISRUPTION_RISK_LEVEL_LABEL.building}</SelectItem>
                <SelectItem value="heightened">{DISRUPTION_RISK_LEVEL_LABEL.heightened}</SelectItem>
                <SelectItem value="acute">{DISRUPTION_RISK_LEVEL_LABEL.acute}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="risk">Risk Level</SelectItem>
                <SelectItem value="review">Next Review Date</SelectItem>
                <SelectItem value="name">Young Person</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── cards ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((rec) => {
            const isExpanded = expandedId === rec.id;
            return (
              <div key={rec.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <ShieldAlert
                      className={cn(
                        "h-5 w-5 shrink-0",
                        rec.risk_of_disruption_level === "low"
                          ? "text-green-600"
                          : rec.risk_of_disruption_level === "building"
                          ? "text-yellow-600"
                          : rec.risk_of_disruption_level === "heightened"
                          ? "text-orange-600"
                          : "text-red-600"
                      )}
                    />
                    <div className="min-w-0">
                      <p className="font-medium">{getYPName(rec.child_id)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Plan dated {rec.plan_date} · Reviewed by {getStaffName(rec.reviewed_by)} · Next review {rec.next_review_date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {rec.signed_off_by_la && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <FileSignature className="h-3 w-3" /> LA signed
                      </Badge>
                    )}
                    <Badge className={cn("text-xs", RISK_COLORS[rec.risk_of_disruption_level])}>
                      {DISRUPTION_RISK_LEVEL_LABEL[rec.risk_of_disruption_level]}
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* meta */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Plan Date:</span> <span className="font-medium">{rec.plan_date}</span></div>
                      <div><span className="text-muted-foreground">Reviewed:</span> <span className="font-medium">{rec.reviewed_date}</span></div>
                      <div><span className="text-muted-foreground">Reviewed By:</span> <span className="font-medium">{getStaffName(rec.reviewed_by)}</span></div>
                      <div><span className="text-muted-foreground">Next Review:</span> <span className="font-medium">{rec.next_review_date}</span></div>
                    </div>

                    {/* stability + warning signs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <div className="flex items-center gap-1 mb-2">
                          <Heart className="h-4 w-4 text-green-700" />
                          <p className="text-xs font-medium text-green-700">Key Stability Factors</p>
                        </div>
                        <ul className="space-y-1">
                          {rec.key_stability_factors.map((s, i) => (
                            <li key={i} className="flex items-start gap-1 text-sm">
                              <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-orange-50 border border-orange-200 p-3">
                        <div className="flex items-center gap-1 mb-2">
                          <Eye className="h-4 w-4 text-orange-700" />
                          <p className="text-xs font-medium text-orange-700">Warning Signs to Watch For</p>
                        </div>
                        <ul className="space-y-1">
                          {rec.warning_signs_to_watch_for.map((s, i) => (
                            <li key={i} className="flex items-start gap-1 text-sm">
                              <AlertTriangle className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* recent triggers + proactive actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                        <div className="flex items-center gap-1 mb-2">
                          <Activity className="h-4 w-4 text-yellow-700" />
                          <p className="text-xs font-medium text-yellow-700">Recent Triggers</p>
                        </div>
                        <ul className="space-y-1">
                          {rec.recent_triggers.map((t, i) => (
                            <li key={i} className="flex items-start gap-1 text-sm">
                              <span className="mt-1.5 h-1 w-1 rounded-full bg-yellow-700 shrink-0" />
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <div className="flex items-center gap-1 mb-2">
                          <Target className="h-4 w-4 text-blue-700" />
                          <p className="text-xs font-medium text-blue-700">Proactive Actions in Place</p>
                        </div>
                        <ul className="space-y-1">
                          {rec.proactive_actions_in_place.map((a, i) => (
                            <li key={i} className="flex items-start gap-1 text-sm">
                              <CheckCircle2 className="h-3 w-3 text-blue-600 mt-0.5 shrink-0" />
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* warning-sign action plan */}
                    <div>
                      <div className="flex items-center gap-1 mb-2">
                        <ShieldAlert className="h-4 w-4 text-red-700" />
                        <p className="text-sm font-medium">Special Actions if Warning Signs Appear</p>
                      </div>
                      <div className="space-y-2">
                        {rec.special_actions_if_warning_signs_appear.map((wa, i) => (
                          <div key={i} className="rounded-lg border bg-white p-3 text-sm">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                              <div className="flex-1">
                                <p className="font-medium">{wa.warning_sign}</p>
                                <p className="text-muted-foreground mt-1">{wa.action}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                                    <UserCheck className="h-3 w-3" /> {getStaffName(wa.owner)}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {wa.timeframe}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* support network + professionals */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-white border p-3">
                        <div className="flex items-center gap-1 mb-2">
                          <Users className="h-4 w-4 text-slate-700" />
                          <p className="text-xs font-medium text-slate-700">Support Network</p>
                        </div>
                        <ul className="space-y-1">
                          {rec.support_network_in_place.map((s, i) => (
                            <li key={i} className="text-sm text-slate-700">{s}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-white border p-3">
                        <div className="flex items-center gap-1 mb-2">
                          <UserCheck className="h-4 w-4 text-slate-700" />
                          <p className="text-xs font-medium text-slate-700">Professionals Involved</p>
                        </div>
                        <ul className="space-y-1">
                          {rec.professionals_involved.map((p, i) => (
                            <li key={i} className="text-sm text-slate-700">{p}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* child + family involvement */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                        <div className="flex items-center gap-1 mb-2">
                          <Heart className="h-4 w-4 text-pink-700" />
                          <p className="text-xs font-medium text-pink-700">Child's Voice & Contribution</p>
                        </div>
                        <p className="text-sm">
                          <Badge variant="outline" className="text-xs mr-2">
                            {rec.child_aware_of_plan ? "Aware of plan" : "Not yet shared"}
                          </Badge>
                        </p>
                        <p className="text-sm mt-2">{rec.child_contribution}</p>
                        {rec.child_actions_agreed.length > 0 && (
                          <>
                            <p className="text-xs font-medium text-pink-700 mt-3 mb-1">Actions Child Agreed</p>
                            <ul className="space-y-1">
                              {rec.child_actions_agreed.map((c, i) => (
                                <li key={i} className="flex items-start gap-1 text-sm">
                                  <CheckCircle2 className="h-3 w-3 text-pink-600 mt-0.5 shrink-0" />
                                  <span>{c}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
                        <div className="flex items-center gap-1 mb-2">
                          <Users className="h-4 w-4 text-purple-700" />
                          <p className="text-xs font-medium text-purple-700">Family Involvement</p>
                        </div>
                        <p className="text-sm">{rec.family_involvement}</p>
                      </div>
                    </div>

                    {/* home-specific mitigations + staffing */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-white border p-3">
                        <div className="flex items-center gap-1 mb-2">
                          <Wrench className="h-4 w-4 text-slate-700" />
                          <p className="text-xs font-medium text-slate-700">Home-Specific Mitigations</p>
                        </div>
                        <ul className="space-y-1">
                          {rec.home_specific_mitigations.map((m, i) => (
                            <li key={i} className="flex items-start gap-1 text-sm">
                              <span className="mt-1.5 h-1 w-1 rounded-full bg-slate-700 shrink-0" />
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-white border p-3">
                        <div className="flex items-center gap-1 mb-2">
                          <UserCheck className="h-4 w-4 text-slate-700" />
                          <p className="text-xs font-medium text-slate-700">Staffing Adjustments</p>
                        </div>
                        <p className="text-sm">{rec.staffing_adjustments}</p>
                      </div>
                    </div>

                    {/* interventions history */}
                    <div>
                      <div className="flex items-center gap-1 mb-2">
                        <Activity className="h-4 w-4 text-slate-700" />
                        <p className="text-sm font-medium">Interventions Deployed History</p>
                      </div>
                      <div className="space-y-2">
                        {rec.interventions_deployed_history.map((h, i) => (
                          <div key={i} className="flex items-start gap-2 rounded-lg border bg-white p-2.5 text-sm">
                            <Badge variant="outline" className="text-xs shrink-0">{h.date}</Badge>
                            <div className="min-w-0">
                              <p className="font-medium">{h.intervention}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Outcome: {h.outcome}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* sign-off */}
                    <div className="rounded-lg bg-slate-100 border p-3 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <FileSignature className="h-4 w-4 text-slate-700" />
                        <span className="text-muted-foreground">Local Authority sign-off:</span>
                        <Badge className={cn("text-xs", rec.signed_off_by_la ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-700")}>
                          {rec.signed_off_by_la ? "Signed" : "Pending"}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Reviewed {rec.reviewed_date} by {getStaffName(rec.reviewed_by)}
                      </span>
                    </div>

                    {/* smart links */}
                    <SmartLinkPanel sourceType="placement-disruption-prevention-plan" sourceId={rec.id} childId={rec.child_id} compact />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Quality Standard 4 (Enjoyment & Achievement) and Reg 5:</strong> Children must experience
          stable placements that meet their needs. Per-child disruption prevention plans demonstrate the home's
          proactive, anticipatory approach to placement stability — identifying warning signs early, agreeing
          actions in advance, involving the child in planning, and coordinating with the placing authority,
          family, and external professionals. Plans are reviewed regularly and updated as triggers, warning
          signs, or stability factors change.
        </div>
      </div>
    </PageShell>
  );
}
