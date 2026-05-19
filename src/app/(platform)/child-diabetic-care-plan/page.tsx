"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Activity, AlertTriangle, Droplet, ChevronUp, ChevronDown, ArrowUpDown, Search, Phone, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import type { DiabeticCarePlan } from "@/types/extended";
import {
  DIABETES_TYPE_LABEL,
  DIABETES_SELF_MANAGE_LEVEL_LABEL,
  INSULIN_REGIME_TYPE_LABEL,
} from "@/types/extended";
import type { DiabetesType } from "@/types/extended";
import { useDiabeticCarePlans } from "@/hooks/use-diabetic-care-plans";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const parseHbA1c = (s?: string): number | null => {
  if (!s) return null;
  const m = s.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
};

const isOnTarget = (r: DiabeticCarePlan): boolean => {
  const latest = parseHbA1c(r.hba1c_latest);
  const target = parseHbA1c(r.hba1c_target);
  if (latest == null || target == null) return false;
  return latest <= target + 5; // within 5 mmol/mol of target counts as on-target band
};

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function ChildDiabeticCarePlanPage() {
  const { data: response, isLoading } = useDiabeticCarePlans();
  const data = response?.data ?? [];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        getYPName(r.child_id).toLowerCase().includes(q) ||
        DIABETES_TYPE_LABEL[r.diabetes_type].toLowerCase().includes(q) ||
        INSULIN_REGIME_TYPE_LABEL[r.insulin_regime.type].toLowerCase().includes(q),
      );
    }
    if (filterType !== "all") rows = rows.filter((r) => r.diabetes_type === filterType);
    rows.sort((a, b) =>
      sortBy === "newest"
        ? b.plan_date.localeCompare(a.plan_date)
        : a.plan_date.localeCompare(b.plan_date),
    );
    return rows;
  }, [data, search, filterType, sortBy]);

  const total = data.length;
  const onTarget = data.filter(isOnTarget).length;
  const selfManaging = data.filter((r) => r.child_can_self_manage === "fully" || r.child_can_self_manage === "with_prompts").length;
  const today = new Date().toISOString().slice(0, 10);
  const ninetyDaysDate = new Date();
  ninetyDaysDate.setDate(ninetyDaysDate.getDate() + 90);
  const ninetyDays = ninetyDaysDate.toISOString().slice(0, 10);
  const reviewsDue90 = data.filter((r) => r.review_date >= today && r.review_date <= ninetyDays).length;

  const exportCols: ExportColumn<DiabeticCarePlan>[] = [
    { header: "Young Person", accessor: (r: DiabeticCarePlan) => getYPName(r.child_id) },
    { header: "Plan Date", accessor: (r: DiabeticCarePlan) => r.plan_date },
    { header: "Diabetes Type", accessor: (r: DiabeticCarePlan) => DIABETES_TYPE_LABEL[r.diabetes_type] },
    { header: "Diagnosis Date", accessor: (r: DiabeticCarePlan) => r.diagnosis_date },
    { header: "HbA1c Latest", accessor: (r: DiabeticCarePlan) => r.hba1c_latest ?? "—" },
    { header: "HbA1c Target", accessor: (r: DiabeticCarePlan) => r.hba1c_target ?? "—" },
    { header: "HbA1c Last Taken", accessor: (r: DiabeticCarePlan) => r.hba1c_last_taken ?? "—" },
    { header: "CGM In Use", accessor: (r: DiabeticCarePlan) => r.cgm_in_use ? (r.cgm_device ?? "Yes") : "No" },
    { header: "Insulin Pump", accessor: (r: DiabeticCarePlan) => r.insulin_pump ? (r.pump_device ?? "Yes") : "No" },
    { header: "Insulin Regime", accessor: (r: DiabeticCarePlan) => `${INSULIN_REGIME_TYPE_LABEL[r.insulin_regime.type]} — ${r.insulin_regime.details}` },
    { header: "Basal Insulin", accessor: (r: DiabeticCarePlan) => r.basal_insulin ? `${r.basal_insulin.name} ${r.basal_insulin.dose} ${r.basal_insulin.timing}` : "—" },
    { header: "Bolus Insulin", accessor: (r: DiabeticCarePlan) => r.bolus_insulin ? `${r.bolus_insulin.name} ratio ${r.bolus_insulin.ratio} correction ${r.bolus_insulin.correction}` : "—" },
    { header: "Carb Counting", accessor: (r: DiabeticCarePlan) => r.carb_counting_active ? "Yes" : "No" },
    { header: "Hypo Symptoms", accessor: (r: DiabeticCarePlan) => r.hypo_symptoms.join("; ") },
    { header: "Hypo Treatment", accessor: (r: DiabeticCarePlan) => r.hypo_treatment_steps.join("; ") },
    { header: "Hyper Symptoms", accessor: (r: DiabeticCarePlan) => r.hyper_symptoms.join("; ") },
    { header: "Hyper Treatment", accessor: (r: DiabeticCarePlan) => r.hyper_treatment_steps.join("; ") },
    { header: "Ketone Testing Trigger", accessor: (r: DiabeticCarePlan) => r.ketone_testing_trigger },
    { header: "Sick Day Rules", accessor: (r: DiabeticCarePlan) => r.sick_day_rules.join("; ") },
    { header: "School Plan", accessor: (r: DiabeticCarePlan) => r.school_plan_in_place ? "Yes" : "No" },
    { header: "Self-Management", accessor: (r: DiabeticCarePlan) => DIABETES_SELF_MANAGE_LEVEL_LABEL[r.child_can_self_manage] },
    { header: "Dietician Review", accessor: (r: DiabeticCarePlan) => r.dietician_review_frequency ?? "—" },
    { header: "Consultant Review", accessor: (r: DiabeticCarePlan) => r.consultant_review_frequency ?? "—" },
    { header: "Flags For Review", accessor: (r: DiabeticCarePlan) => r.flags_for_review.join("; ") },
    { header: "Review Date", accessor: (r: DiabeticCarePlan) => r.review_date },
    { header: "Key Worker", accessor: (r: DiabeticCarePlan) => getStaffName(r.key_worker) },
  ];

  if (isLoading) {
    return (
      <PageShell
        title="Child Diabetic Care Plan"
        subtitle="Per-child Type 1/2 diabetes plan · NICE NG18 · JBDS-IP · Diabetes UK School Plan · Quality Standard 8"
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Child Diabetic Care Plan"
      subtitle="Per-child Type 1/2 diabetes plan · NICE NG18 · JBDS-IP · Diabetes UK School Plan · Quality Standard 8"
      ariaContext={{ pageTitle: "Diabetic Care Plans", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Diabetic Care Plans" />
          <ExportButton data={data} columns={exportCols} filename="child-diabetic-care-plan" />
          <AriaStudioQuickActionButton context={{ record_type: "medication", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Active Plans", value: total, icon: Droplet, clr: "text-sky-600" },
            { label: "HbA1c On Target", value: onTarget, icon: Activity, clr: "text-green-600" },
            { label: "Self-Manages (Fully/Prompts)", value: selfManaging, icon: Activity, clr: "text-blue-600" },
            { label: "Reviews Due 90d", value: reviewsDue90, icon: Phone, clr: "text-amber-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search young person, diabetes type or regime..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Diabetes Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {(Object.entries(DIABETES_TYPE_LABEL) as [DiabetesType, string][]).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <ArrowUpDown className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            const onTargetFlag = isOnTarget(r);
            const borderClr = r.diabetes_type === "type_1"
              ? "border-l-sky-500"
              : r.diabetes_type === "type_2"
                ? "border-l-blue-500"
                : "border-l-indigo-400";
            return (
              <Card key={r.id} className={cn("border-l-4", borderClr)}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getYPName(r.child_id)}
                        <Badge variant="outline" className="bg-sky-100 text-sky-800">{DIABETES_TYPE_LABEL[r.diabetes_type]}</Badge>
                        {r.hba1c_latest && (
                          <Badge variant="outline" className={cn(
                            onTargetFlag ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800",
                          )}>
                            HbA1c {r.hba1c_latest}{onTargetFlag ? " · on target" : " · above target"}
                          </Badge>
                        )}
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">Self-manage: {DIABETES_SELF_MANAGE_LEVEL_LABEL[r.child_can_self_manage]}</Badge>
                        {r.cgm_in_use && (
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-700">CGM</Badge>
                        )}
                        {r.insulin_pump && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700">Pump</Badge>
                        )}
                        {r.flags_for_review.length > 0 && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-800">{r.flags_for_review.length} review flag{r.flags_for_review.length === 1 ? "" : "s"}</Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Plan: {r.plan_date} · Diagnosed: {r.diagnosis_date} · Key worker: {getStaffName(r.key_worker)} · Review: {r.review_date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-muted/50">{INSULIN_REGIME_TYPE_LABEL[r.insulin_regime.type]}</Badge>
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    <div className="rounded p-2 border-l-4 border-l-sky-600 bg-sky-50">
                      <p className="text-xs font-semibold text-sky-900 flex items-center gap-1">
                        <Droplet className="h-3.5 w-3.5" /> Insulin Regime — {INSULIN_REGIME_TYPE_LABEL[r.insulin_regime.type]}
                      </p>
                      <p className="text-xs text-sky-800 mt-1">{r.insulin_regime.details}</p>
                      {r.cgm_in_use && r.cgm_device && (
                        <p className="text-xs text-sky-700 mt-1"><span className="font-medium">CGM: </span>{r.cgm_device}</p>
                      )}
                      {r.insulin_pump && r.pump_device && (
                        <p className="text-xs text-sky-700 mt-1"><span className="font-medium">Pump: </span>{r.pump_device}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="rounded p-2 border-l-4 border-l-blue-700 bg-blue-50">
                        <p className="text-xs font-semibold text-blue-900">Basal (long-acting)</p>
                        {r.basal_insulin ? (
                          <>
                            <p className="text-xs mt-1">{r.basal_insulin.name}</p>
                            <p className="text-xs text-muted-foreground">{r.basal_insulin.dose}</p>
                            <p className="text-xs text-muted-foreground">{r.basal_insulin.timing}</p>
                          </>
                        ) : (
                          <p className="text-xs italic text-muted-foreground mt-1">Pump basal — see CSII profile</p>
                        )}
                      </div>
                      <div className="rounded p-2 border-l-4 border-l-indigo-600 bg-indigo-50">
                        <p className="text-xs font-semibold text-indigo-900">Bolus (rapid-acting)</p>
                        {r.bolus_insulin ? (
                          <>
                            <p className="text-xs mt-1">{r.bolus_insulin.name}</p>
                            <p className="text-xs text-muted-foreground"><span className="font-medium">Ratio: </span>{r.bolus_insulin.ratio}</p>
                            <p className="text-xs text-muted-foreground"><span className="font-medium">Correction: </span>{r.bolus_insulin.correction}</p>
                          </>
                        ) : (
                          <p className="text-xs italic text-muted-foreground mt-1">Not currently prescribed</p>
                        )}
                        {r.carb_counting_active && (
                          <Badge variant="outline" className="mt-1 bg-white">Carb counting active</Badge>
                        )}
                      </div>
                    </div>

                    {(r.hba1c_latest || r.hba1c_target) && (
                      <div className="bg-muted/40 rounded p-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="rounded p-2 border bg-white">
                          <p className="text-xs font-semibold">Latest HbA1c</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{r.hba1c_latest ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">Taken: {r.hba1c_last_taken ?? "—"}</p>
                        </div>
                        <div className="rounded p-2 border bg-white">
                          <p className="text-xs font-semibold">Target HbA1c</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{r.hba1c_target ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">NICE NG18 ≤48 mmol/mol where safe</p>
                        </div>
                        <div className={cn(
                          "rounded p-2 border",
                          onTargetFlag ? "border-green-300 bg-green-50" : "border-amber-300 bg-amber-50",
                        )}>
                          <p className={cn("text-xs font-semibold", onTargetFlag ? "text-green-800" : "text-amber-800")}>
                            {onTargetFlag ? "Within target band" : "Above target band"}
                          </p>
                          <p className={cn("text-xs mt-0.5", onTargetFlag ? "text-green-700" : "text-amber-700")}>
                            Reviewed quarterly with paediatric diabetes team
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="rounded p-2 border border-red-300 bg-red-50">
                        <p className="text-xs font-semibold text-red-800 mb-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Hypoglycaemia (BG &lt; 4.0 mmol/L)
                        </p>
                        <p className="text-xs font-medium text-red-900 mt-1">Symptoms</p>
                        <ul className="space-y-0.5">
                          {r.hypo_symptoms.map((s, i) => (
                            <li key={i} className="text-xs text-red-900">• {s}</li>
                          ))}
                        </ul>
                        <p className="text-xs font-medium text-red-900 mt-2">Treatment (15-15 rule)</p>
                        <ul className="space-y-0.5">
                          {r.hypo_treatment_steps.map((s, i) => (
                            <li key={i} className="text-xs text-red-900">{i + 1}. {s}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded p-2 border border-red-300 bg-red-50">
                        <p className="text-xs font-semibold text-red-800 mb-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Hyperglycaemia / DKA risk
                        </p>
                        <p className="text-xs font-medium text-red-900 mt-1">Symptoms</p>
                        <ul className="space-y-0.5">
                          {r.hyper_symptoms.map((s, i) => (
                            <li key={i} className="text-xs text-red-900">• {s}</li>
                          ))}
                        </ul>
                        <p className="text-xs font-medium text-red-900 mt-2">Treatment</p>
                        <ul className="space-y-0.5">
                          {r.hyper_treatment_steps.map((s, i) => (
                            <li key={i} className="text-xs text-red-900">{i + 1}. {s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="rounded p-2 border border-amber-300 bg-amber-50">
                      <p className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Ketone Testing Trigger
                      </p>
                      <p className="text-xs text-amber-900">{r.ketone_testing_trigger}</p>
                    </div>

                    <div className="rounded p-2 border border-amber-300 bg-amber-50">
                      <p className="text-xs font-semibold text-amber-800 mb-1">Sick Day Rules</p>
                      <ul className="space-y-1">
                        {r.sick_day_rules.map((s, i) => (
                          <li key={i} className="text-xs text-amber-900">• {s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="bg-muted/30 rounded p-2">
                        <p className="text-xs font-medium mb-1">School / Education Plan</p>
                        <p className="text-xs text-muted-foreground">
                          {r.school_plan_in_place
                            ? "Diabetes UK School Plan in place — IHP shared with school nurse, SENCO and class teacher; spare hypo kit and HypoKit in school office; PE protocol agreed."
                            : "School plan NOT yet in place — escalate to Registered Manager and PDSN within 5 working days."}
                        </p>
                        {r.dietician_review_frequency && (
                          <p className="text-xs text-muted-foreground mt-1"><span className="font-medium">Dietician: </span>{r.dietician_review_frequency}</p>
                        )}
                        {r.consultant_review_frequency && (
                          <p className="text-xs text-muted-foreground mt-1"><span className="font-medium">Consultant: </span>{r.consultant_review_frequency}</p>
                        )}
                      </div>
                      <div className="bg-muted/30 rounded p-2">
                        <p className="text-xs font-medium mb-1 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> Emergency Contacts
                        </p>
                        <ul className="space-y-0.5">
                          {r.emergency_contacts.map((c, i) => (
                            <li key={i} className="text-xs">
                              <span className="font-medium">{c.name}</span>
                              <span className="text-muted-foreground"> — {c.role}: {c.phone}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {r.flags_for_review.length > 0 && (
                      <div className="rounded p-2 border border-amber-300 bg-amber-50">
                        <p className="text-xs font-semibold text-amber-800 mb-1">Flags for Next Clinical Review</p>
                        <ul className="space-y-0.5">
                          {r.flags_for_review.map((f, i) => (
                            <li key={i} className="text-xs text-amber-900">• {f}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="bg-purple-50 border border-purple-200 rounded p-2">
                      <p className="font-medium text-xs text-purple-800 mb-1">Child&apos;s Voice</p>
                      <p className="text-xs text-purple-700 italic">&ldquo;{r.child_voice}&rdquo;</p>
                    </div>

                    <div className="bg-sky-50 border border-sky-200 rounded p-2">
                      <p className="font-medium text-xs text-sky-800 mb-1">Staff Observation</p>
                      <p className="text-xs text-sky-700">{r.staff_observation}</p>
                    </div>

                    <SmartLinkPanel sourceType="diabetic-care-plan" sourceId={r.id} childId={r.child_id} compact />

                    <div className="text-xs text-muted-foreground border-t pt-2">
                      Plan logged by {getStaffName("staff_darren")} · Reviewed with {getStaffName(r.key_worker)} · Next review: {r.review_date}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework — Per-child Diabetic Care Plans</p>
          <p>
            Every child or young person with diabetes living in a children&apos;s home must have an individualised written care plan that meets NICE NG18 (Diabetes — type 1 and type 2 in children and young people: diagnosis and management) and reflects the model published in the Diabetes UK School Plan / Individual Healthcare Plan template. The plan must specify the insulin regime (basal-bolus MDI or pump CSII), carbohydrate-to-insulin ratios, correction factors, hypoglycaemia recognition and the 15-15 treatment rule, hyperglycaemia and DKA recognition, ketone testing triggers, sick-day rules (never stop basal insulin), CGM/Libre alerts and the named clinicians at the local paediatric diabetes service. JBDS-IP guidance on the management of DKA in children and on inpatient diabetes care provides the underpinning emergency framework. Children&apos;s Homes (England) Regulations 2015, Quality Standard 8 (Health and wellbeing) requires the registered person to ensure each child&apos;s health needs are met and that staff are competent in administering prescribed medication, recognising acute deterioration and using rescue medication including IM glucagon (GlucaGen HypoKit). The plan must be shared with the child&apos;s school under the Supporting Pupils with Medical Conditions statutory guidance (DfE, 2015) and reviewed at every paediatric diabetes clinic appointment, after every severe hypoglycaemic episode or DKA admission, and at minimum every 6 months. The child&apos;s voice and lived expertise must be central to the plan, in line with UNCRC Article 24 (right to the highest attainable standard of health) and Article 12 (right to be heard). Data sharing of CGM follow alerts to staff and birth family must be governed by a written information-sharing agreement consistent with UK GDPR and the child&apos;s consent where competent.
          </p>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Health & Medication"
        category={["health", "medication"]}
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Diabetic Care Plans — Type 1/Type 2 diabetes, blood glucose monitoring, insulin regime, hypo/hyperglycaemia management, dietary needs, school insulin pen, emergency action, AHA"
        recordType="medication"
        className="mt-6"
      />
    </PageShell>
  );
}
