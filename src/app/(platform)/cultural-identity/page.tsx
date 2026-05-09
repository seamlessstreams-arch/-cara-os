"use client";

import { useState } from "react";
import {
  Globe, Search, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, Heart, Star,
  BookOpen, Users, Music,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import type { CulturalIdentityPlan, CulturalIdentityArea, CulturalIdentityAreaStatus } from "@/types/extended";
import { CULTURAL_IDENTITY_AREA_STATUS_LABEL } from "@/types/extended";
import { useCulturalIdentityPlans } from "@/hooks/use-cultural-identity-plans";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── component ───────────────────────────────────────────────────────── */
export default function CulturalIdentityPage() {
  const { data: raw, isLoading } = useCulturalIdentityPlans();
  const plans = raw?.data ?? [];
  const [expanded, setExpanded] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const reviewsDue = plans.filter((p) => p.next_review < today).length;
  const needsAttention = plans.reduce((s, p) => s + p.identity_areas.filter((a) => a.status === "needs_attention").length, 0);

  const STATUS_COLORS: Record<string, string> = {
    well_supported: "bg-green-100 text-green-800",
    needs_attention: "bg-orange-100 text-orange-800",
    exploring: "bg-blue-100 text-blue-800",
  };

  const exportCols: ExportColumn<CulturalIdentityPlan>[] = [
    { header: "Young Person", accessor: (r: CulturalIdentityPlan) => getYPName(r.child_id) },
    { header: "Ethnicity", accessor: (r: CulturalIdentityPlan) => r.ethnicity },
    { header: "Heritage", accessor: (r: CulturalIdentityPlan) => r.heritage },
    { header: "Religion", accessor: (r: CulturalIdentityPlan) => r.religion },
    { header: "First Language", accessor: (r: CulturalIdentityPlan) => r.first_language },
    { header: "Dietary Needs", accessor: (r: CulturalIdentityPlan) => r.dietary_needs },
    { header: "Identity Areas", accessor: (r: CulturalIdentityPlan) => r.identity_areas.map((a: CulturalIdentityArea) => `${a.area}: ${a.status}`).join("; ") },
    { header: "Action Plan", accessor: (r: CulturalIdentityPlan) => r.action_plan },
    { header: "Celebrations", accessor: (r: CulturalIdentityPlan) => r.celebrations.join(", ") },
    { header: "Last Reviewed", accessor: (r: CulturalIdentityPlan) => r.last_reviewed },
    { header: "Next Review", accessor: (r: CulturalIdentityPlan) => r.next_review },
    { header: "Child Contributed", accessor: (r: CulturalIdentityPlan) => r.child_contributed ? "Yes" : "No" },
    { header: "Notes", accessor: (r: CulturalIdentityPlan) => r.notes },
  ];

  if (isLoading) return <PageShell title="Cultural & Identity Plans" subtitle="Supporting each child's cultural heritage, identity, and sense of self"><div /></PageShell>;

  return (
    <PageShell
      title="Cultural & Identity Plans"
      subtitle="Supporting each child's cultural heritage, identity, and sense of self"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Cultural & Identity Plans" />
          <ExportButton data={plans} columns={exportCols} filename="cultural-identity" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Plans", value: plans.length, icon: Globe, colour: "text-blue-600" },
            { label: "Needs Attention", value: needsAttention, icon: AlertTriangle, colour: needsAttention > 0 ? "text-orange-600" : "text-green-600" },
            { label: "Reviews Due", value: reviewsDue, icon: Star, colour: reviewsDue > 0 ? "text-orange-600" : "text-slate-400" },
            { label: "Child Contributed", value: plans.filter((p) => p.child_contributed).length, icon: Heart, colour: "text-pink-600" },
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

        {/* ── plans ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          {plans.map((plan) => {
            const isExpanded = expanded === plan.id;
            const attention = plan.identity_areas.filter((a) => a.status === "needs_attention").length;

            return (
              <div key={plan.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : plan.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Globe className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium">{getYPName(plan.child_id)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {plan.ethnicity} · {plan.religion} · Reviewed: {plan.last_reviewed}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {attention > 0 && <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">{attention} attention</Badge>}
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* profile */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Heritage:</span> <span className="font-medium">{plan.heritage}</span></div>
                      <div><span className="text-muted-foreground">Language:</span> <span className="font-medium">{plan.first_language}{plan.other_languages.length > 0 ? `, ${plan.other_languages.join(", ")}` : ""}</span></div>
                      <div><span className="text-muted-foreground">Dietary:</span> <span className="font-medium">{plan.dietary_needs}</span></div>
                    </div>

                    {/* identity areas */}
                    <div>
                      <p className="text-sm font-medium mb-2">Identity Areas</p>
                      <div className="space-y-2">
                        {plan.identity_areas.map((area: CulturalIdentityArea, idx: number) => (
                          <div key={idx} className={cn("rounded-lg border p-3 text-sm",
                            area.status === "well_supported" ? "bg-green-50 border-green-200" :
                            area.status === "needs_attention" ? "bg-orange-50 border-orange-200" :
                            "bg-blue-50 border-blue-200"
                          )}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">{area.area}</span>
                              <Badge className={cn("text-xs ml-auto", STATUS_COLORS[area.status])}>
                                {area.status.replace(/_/g, " ")}
                              </Badge>
                            </div>
                            <div className="rounded-lg bg-pink-50 border border-pink-200 p-2 mb-2">
                              <p className="text-xs font-medium text-pink-700 mb-0.5">Child&apos;s View</p>
                              <p className="text-xs">{area.child_view}</p>
                            </div>
                            <p className="text-xs"><strong>Current Support:</strong> {area.current_support}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* celebrations */}
                    <div className="flex flex-wrap gap-1">
                      <span className="text-sm font-medium mr-2">Celebrations:</span>
                      {plan.celebrations.map((c, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                      ))}
                    </div>

                    {/* resources */}
                    <div className="flex flex-wrap gap-1">
                      <span className="text-sm font-medium mr-2">Resources:</span>
                      {plan.resources.map((r, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-blue-50">{r}</Badge>
                      ))}
                    </div>

                    {/* action plan */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Action Plan</p>
                      <p className="text-sm">{plan.action_plan}</p>
                    </div>

                    {/* notes */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Notes</p>
                      <p className="text-sm">{plan.notes}</p>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Reviewed by {getStaffName(plan.reviewed_by)} · Child contributed: {plan.child_contributed ? "Yes" : "No"} · Next review: {plan.next_review}
                    </div>

                    <SmartLinkPanel sourceType="cultural-identity" sourceId={plan.id} childId={plan.child_id} compact />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Identity & Culture:</strong> Regulation 5 requires that each child&apos;s cultural, linguistic,
          and religious identity is understood, respected, and promoted. The home must ensure that children
          can maintain connections to their cultural heritage and that staff are equipped to support diverse
          identities. Identity plans should be developed with the child and reviewed regularly as part of
          care planning.
        </div>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
