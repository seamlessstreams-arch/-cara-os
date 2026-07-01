"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HeartPulse,
  AlertTriangle,
  Pill,
  Stethoscope,
  Phone,
  Syringe,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  CalendarClock,
  CheckCircle2,
  XCircle,
  ClipboardList,
  Eye,
  Activity,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { useHealthcarePlans } from "@/hooks/use-healthcare-plans";
import type { HealthcarePlan } from "@/types/extended";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ─── severity helpers ─── */
const SEVERITY_META: Record<string, { label: string; color: string }> = {
  mild: { label: "Mild", color: "bg-[--cs-success-bg] text-[--cs-success]" },
  moderate: { label: "Moderate", color: "bg-[--cs-warning-bg] text-[--cs-warning]" },
  severe: { label: "Severe", color: "bg-orange-100 text-orange-800" },
  life_threatening: { label: "Life-threatening", color: "bg-[--cs-risk-bg] text-[--cs-risk]" },
};

/* ─── export columns ─── */
const exportCols: ExportColumn<HealthcarePlan>[] = [
  { header: "Young Person", accessor: (r: HealthcarePlan) => getYPName(r.child_id) },
  { header: "Conditions", accessor: (r: HealthcarePlan) => r.conditions.map((c) => c.condition).join("; ") },
  { header: "Allergies", accessor: (r: HealthcarePlan) => r.allergies.map((a) => `${a.allergen} (${a.severity})`).join("; ") },
  { header: "Regular Meds", accessor: (r: HealthcarePlan) => r.regular_medications.map((m) => `${m.medication} ${m.dose}`).join("; ") },
  { header: "GP", accessor: (r: HealthcarePlan) => `${r.gp_details.name} — ${r.gp_details.practice}` },
  { header: "Reviewed By", accessor: (r: HealthcarePlan) => getStaffName(r.reviewed_by) },
  { header: "Reviewed Date", accessor: (r: HealthcarePlan) => r.reviewed_date },
  { header: "Next Review", accessor: (r: HealthcarePlan) => r.next_review_date },
  { header: "Signed Off By GP", accessor: (r: HealthcarePlan) => (r.signed_off_by_gp ? "Yes" : "No") },
  { header: "Child Informed", accessor: (r: HealthcarePlan) => (r.child_informed_of_plan ? "Yes" : "No") },
];

/* ─── component ─── */
export default function HealthcarePlansPage() {
  const { data: raw, isLoading } = useHealthcarePlans();
  const plans = useMemo(() => raw?.data ?? [], [raw]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("review_due");

  const sorted = useMemo(() => {
    const list = [...plans];
    list.sort((a, b) => {
      switch (sortBy) {
        case "review_due":
          return a.next_review_date.localeCompare(b.next_review_date);
        case "name":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "conditions":
          return b.conditions.length - a.conditions.length;
        case "meds":
          return b.regular_medications.length - a.regular_medications.length;
        case "allergy_severity": {
          const score = (p: HealthcarePlan) =>
            p.allergies.reduce((s, a) => {
              const v = { mild: 1, moderate: 2, severe: 3, anaphylactic: 4, life_threatening: 4 }[a.severity] ?? 0;
              return Math.max(s, v);
            }, 0);
          return score(b) - score(a);
        }
        default:
          return 0;
      }
    });
    return list;
  }, [plans, sortBy]);

  const stats = useMemo(() => {
    const total = plans.length;
    const allergiesCritical = plans.reduce(
      (s, p) =>
        s + p.allergies.filter((a) => a.severity === "severe" || a.severity === "life_threatening").length,
      0,
    );
    const regularMeds = plans.reduce((s, p) => s + p.regular_medications.length, 0);
    const today = new Date();
    const reviewsDue = plans.filter((p) => {
      const next = new Date(p.next_review_date);
      const diff = (next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 30;
    }).length;
    return { total, allergiesCritical, regularMeds, reviewsDue };
  }, [plans]);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const criticalAllergyChildren = useMemo(() => plans.filter((p) =>
    p.allergies.some((a) => a.severity === "severe" || a.severity === "life_threatening"),
  ), [plans]);

  if (isLoading) {
    return (
      <PageShell title="Healthcare Plans" subtitle="Loading…">
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Healthcare Plans"
      subtitle="Individual healthcare plans · medical conditions, allergies, medications and protocols (Quality Standard 7 · Reg 23)"
      caraContext={{ pageTitle: "Healthcare Plans", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={plans} columns={exportCols} filename="healthcare-plans" />
          <PrintButton title="Healthcare Plans" />
          <CaraStudioQuickActionButton context={{ record_type: "health", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area">
        {/* ─── summary stats ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Active Healthcare Plans</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-[--cs-risk]">{stats.allergiesCritical}</p>
              <p className="text-xs text-muted-foreground">Allergies — Severe / Life-threatening</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{stats.regularMeds}</p>
              <p className="text-xs text-muted-foreground">Regular Medications (team)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-[--cs-warning]">{stats.reviewsDue}</p>
              <p className="text-xs text-muted-foreground">Reviews Due ≤ 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* ─── critical allergy alert ─── */}
        {criticalAllergyChildren.length > 0 && (
          <div className="bg-[--cs-risk-bg] border border-[--cs-risk-soft] rounded-lg p-3 mb-4 flex items-start gap-2">
            <ShieldAlert className="h-5 w-5 text-[--cs-risk] shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-[--cs-risk]">Critical Allergies — Immediate Action Required</p>
              <p className="text-[--cs-risk]">
                {criticalAllergyChildren
                  .map(
                    (p) =>
                      `${getYPName(p.child_id)}: ${p.allergies
                        .filter((a) => a.severity === "severe" || a.severity === "life_threatening")
                        .map((a) => a.allergen)
                        .join(", ")}`,
                  )
                  .join(" · ")}
                . All staff on shift MUST be familiar with the relevant emergency protocol before commencing duty.
              </p>
            </div>
          </div>
        )}

        {/* ─── reviews due alert ─── */}
        {stats.reviewsDue > 0 && (
          <div className="bg-[--cs-warning-bg] border border-[--cs-warning-soft] rounded-lg p-3 mb-6 flex items-start gap-2">
            <CalendarClock className="h-5 w-5 text-[--cs-warning] shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-[--cs-warning]">Healthcare Plan Reviews Due</p>
              <p className="text-[--cs-warning]">
                {plans.filter((p) => {
                  const next = new Date(p.next_review_date);
                  const diff = (next.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
                  return diff <= 30;
                })
                  .map((p) => `${getYPName(p.child_id)} (due ${p.next_review_date})`)
                  .join(" · ")}{" "}
                — schedule review with GP and update plan accordingly.
              </p>
            </div>
          </div>
        )}

        {/* ─── filters / sort ─── */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {sorted.length} healthcare plan{sorted.length === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="review_due">Sort: Review Due (soonest)</SelectItem>
                <SelectItem value="name">Sort: Name</SelectItem>
                <SelectItem value="conditions">Sort: Conditions (most)</SelectItem>
                <SelectItem value="meds">Sort: Regular Meds (most)</SelectItem>
                <SelectItem value="allergy_severity">Sort: Allergy Severity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ─── plan cards ─── */}
        <div className="space-y-3">
          {sorted.map((plan) => {
            const isOpen = expandedId === plan.id;
            const hasCriticalAllergy = plan.allergies.some(
              (a) => a.severity === "severe" || a.severity === "life_threatening",
            );
            const reviewSoon =
              (new Date(plan.next_review_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) <= 30;

            return (
              <Card
                key={plan.id}
                className={cn(
                  "border-l-4",
                  hasCriticalAllergy
                    ? "border-l-[--cs-risk]"
                    : reviewSoon
                      ? "border-l-[--cs-warning]"
                      : "border-l-[--cs-success]",
                )}
              >
                <CardHeader
                  className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => toggle(plan.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        <HeartPulse className="h-4 w-4 text-red-600" />
                        {getYPName(plan.child_id)}
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          {plan.conditions.length} condition{plan.conditions.length === 1 ? "" : "s"}
                        </Badge>
                        {plan.allergies.length > 0 && (
                          <Badge
                            variant="outline"
                            className={cn(
                              hasCriticalAllergy
                                ? "bg-[--cs-risk-bg] text-[--cs-risk]"
                                : "bg-orange-100 text-orange-800",
                            )}
                          >
                            {plan.allergies.length} allerg{plan.allergies.length === 1 ? "y" : "ies"}
                          </Badge>
                        )}
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          {plan.regular_medications.length} regular med
                          {plan.regular_medications.length === 1 ? "" : "s"}
                        </Badge>
                        {plan.signed_off_by_gp ? (
                          <Badge variant="outline" className="bg-[--cs-success-bg] text-[--cs-success]">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> GP signed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-[--cs-warning-bg] text-[--cs-warning]">
                            <XCircle className="h-3 w-3 mr-1" /> Awaiting GP
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Reviewed {plan.reviewed_date} by {getStaffName(plan.reviewed_by)} · Next review{" "}
                        {plan.next_review_date} · GP: {plan.gp_details.name} ({plan.gp_details.practice})
                      </p>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    )}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* conditions */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1">
                        <Activity className="h-4 w-4 text-blue-600" /> Medical Conditions
                      </p>
                      <div className="space-y-1">
                        {plan.conditions.map((c, i) => (
                          <div key={i} className="bg-muted/40 rounded p-2 text-xs">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="font-medium">{c.condition}</span>
                              <Badge variant="outline" className={SEVERITY_META[c.severity].color}>
                                {SEVERITY_META[c.severity].label}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">Diagnosed: {c.diagnosed}</p>
                            <p className="text-muted-foreground mt-1">{c.current_management}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* allergies */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1">
                        <ShieldAlert className="h-4 w-4 text-red-600" /> Allergies
                      </p>
                      {plan.allergies.length === 0 ? (
                        <p className="text-xs text-[--cs-success]">No known allergies (NKA).</p>
                      ) : (
                        <div className="space-y-1">
                          {plan.allergies.map((a, i) => (
                            <div
                              key={i}
                              className={cn(
                                "rounded p-2 text-xs border",
                                a.severity === "severe" || a.severity === "life_threatening"
                                  ? "bg-[--cs-risk-bg] border-[--cs-risk-soft]"
                                  : "bg-orange-50 border-orange-200",
                              )}
                            >
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-medium">{a.allergen}</span>
                                <Badge variant="outline" className={SEVERITY_META[a.severity].color}>
                                  {SEVERITY_META[a.severity].label}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground">
                                <span className="font-medium">Reaction:</span> {a.reaction}
                              </p>
                              <p className="text-muted-foreground mt-0.5">
                                <span className="font-medium">Treatment:</span> {a.treatment}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* regular medications */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1">
                        <Pill className="h-4 w-4 text-green-600" /> Regular Medications
                      </p>
                      {plan.regular_medications.length === 0 ? (
                        <p className="text-xs text-muted-foreground">None.</p>
                      ) : (
                        <div className="space-y-1">
                          {plan.regular_medications.map((m, i) => (
                            <div key={i} className="bg-muted/40 rounded p-2 text-xs">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="font-medium">
                                  {m.medication} — {m.dose}
                                </span>
                                <Badge variant="outline" className="text-[10px]">
                                  {m.frequency}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground">
                                {m.purpose} · Prescribed by: {m.prescriber}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* PRN medications */}
                    {plan.prn_medications.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <Pill className="h-4 w-4 text-amber-600" /> PRN Medications
                        </p>
                        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                          {plan.prn_medications.map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* primary care details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="bg-muted/40 rounded p-2 text-xs">
                        <p className="font-medium flex items-center gap-1">
                          <Stethoscope className="h-3.5 w-3.5 text-blue-600" /> GP
                        </p>
                        <p>{plan.gp_details.name}</p>
                        <p className="text-muted-foreground">{plan.gp_details.practice}</p>
                        <p className="text-muted-foreground">{plan.gp_details.phone}</p>
                        <p className="text-muted-foreground">{plan.gp_details.address}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-xs">
                        <p className="font-medium flex items-center gap-1">
                          <Stethoscope className="h-3.5 w-3.5 text-green-600" /> Dentist
                        </p>
                        <p>{plan.dentist_details.name}</p>
                        <p className="text-muted-foreground">{plan.dentist_details.practice}</p>
                        <p className="text-muted-foreground">{plan.dentist_details.phone}</p>
                        <p className="text-muted-foreground">{plan.dentist_details.address}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-xs">
                        <p className="font-medium flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5 text-purple-600" /> Optician
                        </p>
                        <p>{plan.optician_details.name}</p>
                        <p className="text-muted-foreground">{plan.optician_details.practice}</p>
                        <p className="text-muted-foreground">{plan.optician_details.phone}</p>
                        <p className="text-muted-foreground">{plan.optician_details.address}</p>
                      </div>
                    </div>

                    {/* specialists */}
                    {plan.specialist_contacts.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <Phone className="h-4 w-4 text-blue-600" /> Specialist Contacts
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                          {plan.specialist_contacts.map((s, i) => (
                            <div key={i} className="bg-muted/40 rounded p-2 text-xs">
                              <p className="font-medium">{s.specialism}</p>
                              <p className="text-muted-foreground">
                                {s.name} · {s.contact}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* emergency protocols */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1 text-[--cs-risk]">
                        <AlertTriangle className="h-4 w-4" /> Emergency Protocols
                      </p>
                      <div className="space-y-1">
                        {plan.emergency_protocols.map((p, i) => (
                          <div
                            key={i}
                            className="bg-[--cs-risk-bg] border border-[--cs-risk-soft] rounded p-2 text-xs"
                          >
                            <p className="font-medium text-[--cs-risk] mb-0.5">{p.scenario}</p>
                            <p className="text-[--cs-risk]">{p.action}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* hospital attendances */}
                    {plan.recent_hospital_attendances.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <ClipboardList className="h-4 w-4 text-amber-600" /> Recent Hospital Attendances
                        </p>
                        <div className="space-y-1">
                          {plan.recent_hospital_attendances.map((h, i) => (
                            <div key={i} className="bg-muted/40 rounded p-2 text-xs">
                              <p className="font-medium">
                                {h.date} — {h.reason}
                              </p>
                              <p className="text-muted-foreground">{h.outcome}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* screening + immunisations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <CalendarClock className="h-4 w-4 text-blue-600" /> Screening Schedule
                        </p>
                        <div className="space-y-1">
                          {plan.screening_schedule.map((s, i) => (
                            <div key={i} className="bg-muted/40 rounded p-2 text-xs">
                              <p className="font-medium">{s.screening}</p>
                              <p className="text-muted-foreground">
                                Last: {s.last_done} · Due next: {s.due_next}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <Syringe className="h-4 w-4 text-green-600" /> Immunisations
                        </p>
                        <div className="space-y-1">
                          {plan.immunisations.map((im, i) => (
                            <div key={i} className="bg-muted/40 rounded p-2 text-xs">
                              <p className="font-medium">{im.vaccine}</p>
                              <p className="text-muted-foreground">
                                Given: {im.given}
                                {im.due_next ? ` · Due next: ${im.due_next}` : ""}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* sign off footer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t">
                      <div className="flex items-center gap-2 text-xs">
                        {plan.signed_off_by_gp ? (
                          <CheckCircle2 className="h-4 w-4 text-[--cs-success]" />
                        ) : (
                          <XCircle className="h-4 w-4 text-[--cs-warning]" />
                        )}
                        <span>
                          {plan.signed_off_by_gp
                            ? "Plan signed off by GP."
                            : "GP sign-off outstanding — chase practice."}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {plan.child_informed_of_plan ? (
                          <CheckCircle2 className="h-4 w-4 text-[--cs-success]" />
                        ) : (
                          <XCircle className="h-4 w-4 text-[--cs-warning]" />
                        )}
                        <span>
                          {plan.child_informed_of_plan
                            ? "Child has been informed of (and contributed to) the plan."
                            : "Child not yet informed — schedule key-working session."}
                        </span>
                      </div>
                    </div>

                    <SmartLinkPanel sourceType="healthcare-plans" sourceId={plan.id} childId={plan.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* ─── regulatory note ─── */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Quality Standard 7 (Health) · Regulation 23</p>
          <p>
            Each child must have an individual healthcare plan that records their physical, mental and emotional health
            needs and how those needs are met (Children&apos;s Homes Regulations 2015, Reg 23, and the Health and
            wellbeing standard, Quality Standard 7). The plan must be developed with the child where possible, signed
            off by the GP, kept up to date, accessible to all staff on duty, and reviewed at least annually or whenever
            health needs change. Healthcare plans sit alongside the health passport, MAR sheet, individual risk
            assessments, and the placement plan, and must align with the LAC initial and annual health assessments.
          </p>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Health"
        category="health"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
