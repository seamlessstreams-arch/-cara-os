"use client";

import { useState, useMemo } from "react";
import {
  HandMetal, Plus, Search, ArrowUpDown,
  AlertTriangle, CheckCircle2, Clock,
  ChevronDown, ChevronUp, Shield, Heart,
  RefreshCw, Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName, YOUNG_PEOPLE, STAFF } from "@/lib/seed-data";
import { usePositiveHandling, useCreatePositiveHandlingPlan } from "@/hooks/use-positive-handling";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { PositiveHandlingPlan, PHPDeEscalation, PHPPhysicalResponse } from "@/types/extended";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── component ───────────────────────────────────────────────────────── */
export default function PositiveHandlingPage() {
  const { data: result, isLoading } = usePositiveHandling();
  const plans = result?.data ?? [];
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const createPlan = useCreatePositiveHandlingPlan();
  const [phForm, setPhForm] = useState({ child_id: "", triggers: "", notes: "", reviewed_by: "" });
  const setPH = (k: string, v: unknown) => setPhForm((p) => ({ ...p, [k]: v }));

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phForm.child_id) { toast.error("Please select a young person."); return; }
    const dt = new Date().toISOString().slice(0, 10);
    const nxt = new Date(); nxt.setFullYear(nxt.getFullYear() + 1);
    await createPlan.mutateAsync({ child_id: phForm.child_id, version: "1.0", created_date: dt, last_reviewed: dt, next_review: nxt.toISOString().slice(0, 10), reviewed_by: phForm.reviewed_by, triggers: phForm.triggers.split("\n").filter(Boolean), early_warning: [], de_escalation: [], physical_responses: [], post_incident_support: [], child_preferences: "", medical_factors: "", staff_authorised: [], consent_obtained: false, sw_consulted: false, parent_notified: false, notes: phForm.notes });
    toast.success("Positive handling plan created.");
    setPhForm({ child_id: "", triggers: "", notes: "", reviewed_by: "" });
    setShowNew(false);
  };

  const today = new Date().toISOString().slice(0, 10);
  const reviewsDue = plans.filter((p) => p.next_review < today).length;

  const EFFECT_COLORS: Record<string, string> = {
    usually_effective: "bg-green-100 text-green-800",
    sometimes_effective: "bg-yellow-100 text-yellow-800",
    rarely_effective: "bg-red-100 text-red-800",
  };

  const exportData = useMemo(() => plans, [plans]);

  const exportCols: ExportColumn<PositiveHandlingPlan>[] = [
    { header: "Young Person", accessor: (r: PositiveHandlingPlan) => getYPName(r.child_id) },
    { header: "Version", accessor: (r: PositiveHandlingPlan) => r.version },
    { header: "Last Reviewed", accessor: (r: PositiveHandlingPlan) => r.last_reviewed },
    { header: "Next Review", accessor: (r: PositiveHandlingPlan) => r.next_review },
    { header: "Triggers", accessor: (r: PositiveHandlingPlan) => r.triggers.join("; ") },
    { header: "Early Warning Signs", accessor: (r: PositiveHandlingPlan) => r.early_warning.join("; ") },
    { header: "De-escalation", accessor: (r: PositiveHandlingPlan) => r.de_escalation.map((de: PHPDeEscalation) => `${de.technique} (${de.effectiveness})`).join("; ") },
    { header: "Child Preferences", accessor: (r: PositiveHandlingPlan) => r.child_preferences },
    { header: "Medical Factors", accessor: (r: PositiveHandlingPlan) => r.medical_factors },
    { header: "Authorised Staff", accessor: (r: PositiveHandlingPlan) => r.staff_authorised.map((s: string) => getStaffName(s)).join(", ") },
    { header: "Reviewed By", accessor: (r: PositiveHandlingPlan) => getStaffName(r.reviewed_by) },
    { header: "Notes", accessor: (r: PositiveHandlingPlan) => r.notes },
  ];

  if (isLoading) {
    return (
      <PageShell
        title="Positive Handling Plans"
        subtitle="Individual behaviour support and physical intervention plans for each young person"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Positive Handling Plans"
      subtitle="Individual behaviour support and physical intervention plans for each young person"
      caraContext={{ pageTitle: "Positive Handling Plans", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Positive Handling Plans" />
          <ExportButton data={exportData} columns={exportCols} filename="positive-handling" />
          <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />New Plan</Button>
          <CaraStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Plans", value: plans.length, icon: HandMetal, colour: "text-blue-600" },
            { label: "Reviews Due", value: reviewsDue, icon: Clock, colour: reviewsDue > 0 ? "text-orange-600" : "text-green-600" },
            { label: "SW Consulted", value: plans.filter((p) => p.sw_consulted).length, icon: CheckCircle2, colour: "text-green-600" },
            { label: "Consent Obtained", value: plans.filter((p) => p.consent_obtained).length, icon: Shield, colour: "text-green-600" },
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
            const overdue = plan.next_review < today;

            return (
              <div key={plan.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : plan.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <HandMetal className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium">{getYPName(plan.child_id)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        v{plan.version} · Reviewed: {plan.last_reviewed} · Next: {plan.next_review}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {overdue && <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">Review Due</Badge>}
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* triggers */}
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                      <p className="text-xs font-medium text-red-700 mb-2">Known Triggers</p>
                      <ul className="space-y-1">
                        {plan.triggers.map((t, i) => (
                          <li key={i} className="flex items-start gap-1 text-sm">
                            <AlertTriangle className="h-3 w-3 text-red-600 mt-0.5 shrink-0" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* early warning */}
                    <div className="rounded-lg bg-orange-50 border border-orange-200 p-3">
                      <p className="text-xs font-medium text-orange-700 mb-2">Early Warning Signs</p>
                      <ul className="space-y-1">
                        {plan.early_warning.map((e, i) => (
                          <li key={i} className="flex items-start gap-1 text-sm">
                            <Clock className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                            <span>{e}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* de-escalation */}
                    <div>
                      <p className="text-sm font-medium mb-2">De-escalation Strategies</p>
                      <div className="space-y-1">
                        {plan.de_escalation.map((de: PHPDeEscalation, i: number) => (
                          <div key={i} className="flex items-start gap-2 rounded-lg border bg-white p-2.5 text-sm">
                            <CheckCircle2 className={cn("h-4 w-4 mt-0.5 shrink-0",
                              de.effectiveness === "usually_effective" ? "text-green-600" :
                              de.effectiveness === "sometimes_effective" ? "text-yellow-600" : "text-red-600"
                            )} />
                            <span className="flex-1">{de.technique}</span>
                            <Badge className={cn("text-xs", EFFECT_COLORS[de.effectiveness])}>
                              {de.effectiveness.replace(/_/g, " ")}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* physical responses */}
                    {plan.physical_responses.map((pr: PHPPhysicalResponse, idx: number) => (
                      <div key={idx} className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs font-medium text-blue-700 mb-2">Physical Response Scenario {idx + 1}</p>
                        <p className="text-sm mb-2"><strong>Scenario:</strong> {pr.scenario}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-xs font-medium text-green-700 mb-1">Approved Techniques</p>
                            {pr.approved_techniques.map((t, i) => (
                              <p key={i} className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-600" />{t}</p>
                            ))}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-red-700 mb-1">Contraindicated</p>
                            {pr.contraindicated.map((t, i) => (
                              <p key={i} className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-red-600" />{t}</p>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs mt-2"><strong>Max Duration:</strong> {pr.max_duration}</p>
                        <p className="text-xs"><strong>Medical:</strong> {pr.medical_considerations}</p>
                      </div>
                    ))}

                    {/* child's voice */}
                    <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <Heart className="h-4 w-4 text-pink-600" />
                        <p className="text-xs font-medium text-pink-700">Child&apos;s Preferences & Voice</p>
                      </div>
                      <p className="text-sm">{plan.child_preferences}</p>
                    </div>

                    {/* post-incident */}
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                      <p className="text-xs font-medium text-green-700 mb-2">Post-Incident Support</p>
                      <ul className="space-y-1">
                        {plan.post_incident_support.map((p, i) => (
                          <li key={i} className="flex items-start gap-1 text-sm">
                            <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* meta */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className={cn("h-3 w-3", plan.consent_obtained ? "text-green-600" : "text-red-600")} />
                        <span>Consent: {plan.consent_obtained ? "Yes" : "No"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className={cn("h-3 w-3", plan.sw_consulted ? "text-green-600" : "text-red-600")} />
                        <span>SW Consulted: {plan.sw_consulted ? "Yes" : "No"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className={cn("h-3 w-3", plan.parent_notified ? "text-green-600" : "text-red-600")} />
                        <span>Parent Notified: {plan.parent_notified ? "Yes" : "No"}</span>
                      </div>
                      <div><span className="text-muted-foreground">Reviewed By:</span> <span className="font-medium">{getStaffName(plan.reviewed_by)}</span></div>
                    </div>

                    {/* authorised staff */}
                    <div className="text-sm">
                      <span className="text-muted-foreground">Authorised Staff: </span>
                      {plan.staff_authorised.map((s: string) => getStaffName(s)).join(", ")}
                    </div>

                    {/* notes */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Notes</p>
                      <p className="text-sm">{plan.notes}</p>
                    </div>

                    {/* smart links */}
                    <SmartLinkPanel
                      sourceType="positive_handling"
                      sourceId={plan.id}
                      childId={plan.child_id}
                      compact
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Regulation 19 & 20:</strong> Physical intervention must only be used as a last resort
          and must be proportionate, necessary, and for the shortest possible time. Each child must have
          a behaviour support plan that prioritises de-escalation. Plans must be developed with the child&apos;s
          input, agreed with the placing authority, and reviewed regularly. Staff must be trained in approved
          techniques (Team-Teach or equivalent). All incidents of physical intervention must be recorded
          in the restraint log.
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Physical Interventions"
        category={["physical_intervention", "restraint"]}
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Positive Handling Plans — de-escalation strategies, safe holding techniques, PBS approaches, risk management, approved techniques, training records, debrief requirements, Reg 40 compliance"
        recordType="care_plan"
        className="mt-6"
      />
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Positive Handling Plan</DialogTitle></DialogHeader>
          <form onSubmit={handleSavePlan} className="space-y-3 py-2">
            <div><Label>Young Person *</Label><Select value={phForm.child_id} onValueChange={(v) => setPH("child_id", v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Select young person…" /></SelectTrigger><SelectContent>{YOUNG_PEOPLE.filter((y) => y.status === "current").map((y) => (<SelectItem key={y.id} value={y.id}>{y.preferred_name ?? y.first_name}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Reviewed By</Label><Select value={phForm.reviewed_by} onValueChange={(v) => setPH("reviewed_by", v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Select staff…" /></SelectTrigger><SelectContent><SelectItem value="">TBC</SelectItem>{STAFF.filter((s) => s.employment_status === "active").map((s) => (<SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Known Triggers (one per line)</Label><Textarea className="mt-1" rows={3} placeholder="e.g. Loud noises, crowded spaces…" value={phForm.triggers} onChange={(e) => setPH("triggers", e.target.value)} /></div>
            <div><Label>Notes</Label><Textarea className="mt-1" rows={2} value={phForm.notes} onChange={(e) => setPH("notes", e.target.value)} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button type="submit" disabled={createPlan.isPending}>{createPlan.isPending ? "Saving…" : "Create Plan"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
