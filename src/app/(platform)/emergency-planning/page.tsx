"use client";

import { useState } from "react";
import {
  AlertOctagon, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronUp, Phone, Shield,
  Flame, CloudRain, Zap, Bug,
  Heart, Building2, RefreshCw, Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { EmergencyPlanType } from "@/types/extended";
import { useEmergencyPlans } from "@/hooks/use-emergency-plans";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── local icon mapping (plan_type → icon) ──────────────────────────── */
const PLAN_TYPE_ICON: Record<EmergencyPlanType, React.ElementType> = {
  fire_evacuation: Flame,
  power_failure: Zap,
  flood_water_damage: CloudRain,
  infectious_disease: Bug,
  serious_incident: Heart,
};

/* ── component ───────────────────────────────────────────────────────── */
export default function EmergencyPlanningPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data: queryData, isLoading } = useEmergencyPlans();
  const plans = queryData?.data ?? [];

  const today = new Date().toISOString().slice(0, 10);
  const testsDue = plans.filter((p) => p.next_test <= today).length;

  if (isLoading) {
    return (
      <PageShell
        title="Emergency Planning"
        subtitle="Business continuity and emergency response procedures"
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Emergency Planning"
      subtitle="Business continuity and emergency response procedures"
      ariaContext={{ pageTitle: "Emergency Planning", sourceType: "document" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Emergency Planning — Oak House" />
          <AriaStudioQuickActionButton context={{ record_type: "policy", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Emergency Plans", value: plans.length, icon: AlertOctagon, colour: "text-red-600" },
            { label: "All Current", value: plans.filter((p) => p.status === "current").length, icon: CheckCircle2, colour: "text-green-600" },
            { label: "Tests Due", value: testsDue, icon: RefreshCw, colour: testsDue > 0 ? "text-orange-600" : "text-slate-400" },
            { label: "Evacuation Plans", value: plans.filter((p) => p.evacuation_required).length, icon: Building2, colour: "text-blue-600" },
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

        {/* ── emergency contacts banner ─────────────────────────── */}
        <div className="rounded-xl bg-red-50 border-2 border-red-300 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="h-5 w-5 text-red-600" />
            <p className="font-bold text-red-800">Emergency Contacts — Quick Reference</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="font-medium">Emergency:</span> 999</div>
            <div><span className="font-medium">Non-Emergency:</span> 101</div>
            <div><span className="font-medium">RM (Darren):</span> 07XXX XXXXXX</div>
            <div><span className="font-medium">Deputy (Ryan):</span> 07XXX XXXXXX</div>
            <div><span className="font-medium">NHS:</span> 111</div>
            <div><span className="font-medium">Ofsted:</span> 0300 123 1231</div>
            <div><span className="font-medium">Gas Emergency:</span> 0800 111 999</div>
            <div><span className="font-medium">Power:</span> 105</div>
          </div>
        </div>

        {/* ── plans ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          {plans.map((plan) => {
            const isExpanded = expanded === plan.id;
            const Icon = PLAN_TYPE_ICON[plan.plan_type] || AlertOctagon;
            const testDue = plan.next_test <= today;

            return (
              <div key={plan.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : plan.id)}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("h-5 w-5", plan.colour)} />
                    <div>
                      <p className="font-medium">{plan.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Last tested: {plan.last_tested} · Next: {plan.next_test}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {testDue && <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">Test Due</Badge>}
                    {plan.evacuation_required && <Badge variant="outline" className="text-xs bg-red-50 text-red-700">Evacuation</Badge>}
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Current</Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* scenario */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Scenario</p>
                      <p className="text-sm">{plan.scenario}</p>
                    </div>

                    {/* immediate actions */}
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                      <p className="text-xs font-bold text-red-700 mb-2">IMMEDIATE ACTIONS</p>
                      <ol className="space-y-1">
                        {plan.immediate_actions.map((action, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="font-bold text-red-700 shrink-0">{i + 1}.</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* contact sequence */}
                    <div>
                      <p className="text-sm font-medium mb-2">Contact Sequence</p>
                      <div className="space-y-1">
                        {plan.contact_sequence.map((contact, i) => (
                          <div key={i} className="flex items-center gap-3 rounded-lg border bg-white p-2 text-sm">
                            <Phone className="h-3 w-3 text-blue-600 shrink-0" />
                            <span className="font-medium flex-1">{contact.who}</span>
                            <span className="font-mono text-xs">{contact.number}</span>
                            <Badge variant="outline" className="text-[10px]">{contact.when}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* assembly point */}
                    {plan.assembly_point && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <p className="text-xs font-medium text-amber-700 mb-1">Assembly Point</p>
                        <p className="text-sm">{plan.assembly_point}</p>
                      </div>
                    )}

                    {/* child considerations */}
                    <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                      <p className="text-xs font-medium text-pink-700 mb-2">Child-Specific Considerations</p>
                      <ul className="space-y-1">
                        {plan.child_considerations.map((c, i) => (
                          <li key={i} className="flex items-start gap-1 text-sm">
                            <AlertTriangle className="h-3 w-3 text-pink-600 mt-0.5 shrink-0" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* staff roles */}
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs font-medium text-blue-700 mb-2">Staff Roles</p>
                      <ul className="space-y-1">
                        {plan.staff_roles.map((r, i) => (
                          <li key={i} className="flex items-start gap-1 text-sm">
                            <Shield className="h-3 w-3 text-blue-600 mt-0.5 shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* equipment */}
                    <div>
                      <p className="text-sm font-medium mb-2">Equipment Required</p>
                      <div className="flex flex-wrap gap-1">
                        {plan.equipment_needed.map((e, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{e}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* recovery */}
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                      <p className="text-xs font-medium text-green-700 mb-2">Recovery Actions</p>
                      <ul className="space-y-1">
                        {plan.recovery_actions.map((r, i) => (
                          <li key={i} className="flex items-start gap-1 text-sm">
                            <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Business Continuity:</strong> The registered person must ensure that contingency plans
          are in place for all reasonably foreseeable emergencies. Plans must consider the specific needs
          of children in the home and be tested regularly. All staff must be familiar with emergency
          procedures and their specific roles. Plans should be reviewed after any incident and at least
          annually.
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Health & Safety"
        category="general"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Emergency Planning — fire evacuation, medical emergencies, missing from care, flooding, power failure, cyber incident, bomb threat, chemical, staff crisis — procedures and contacts"
        recordType="policy"
        className="mt-6"
      />
    </PageShell>
  );
}
