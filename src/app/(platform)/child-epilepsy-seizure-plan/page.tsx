"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain,
  AlertTriangle,
  Pill,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Phone,
  Clock,
} from "lucide-react";
import { getYPName, getStaffName } from "@/lib/seed-data";
import type { EpilepsySeizurePlan } from "@/types/extended";
import { useEpilepsySeizurePlans } from "@/hooks/use-epilepsy-seizure-plans";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ─── export columns ─── */
const exportCols: ExportColumn<EpilepsySeizurePlan>[] = [
  { header: "Young Person", accessor: (r: EpilepsySeizurePlan) => getYPName(r.child_id) },
  { header: "Plan Date", accessor: (r: EpilepsySeizurePlan) => r.plan_date },
  { header: "Diagnosis", accessor: (r: EpilepsySeizurePlan) => r.diagnosis },
  { header: "Seizure Types", accessor: (r: EpilepsySeizurePlan) => r.seizure_types.map((s) => s.name).join("; ") },
  { header: "Triggers", accessor: (r: EpilepsySeizurePlan) => r.triggers.join("; ") },
  { header: "Preventer Med", accessor: (r: EpilepsySeizurePlan) => (r.preventer_medication ? `${r.preventer_medication.name} ${r.preventer_medication.dose}` : "None") },
  { header: "Rescue Med", accessor: (r: EpilepsySeizurePlan) => (r.rescue_medication ? `${r.rescue_medication.name} ${r.rescue_medication.dose} ${r.rescue_medication.route}` : "None") },
  { header: "Staff Trained (count)", accessor: (r: EpilepsySeizurePlan) => String(r.staff_trained_to_admin.length) },
  { header: "School Plan In Place", accessor: (r: EpilepsySeizurePlan) => (r.school_plan_in_place ? "Yes" : "No") },
  { header: "Neurologist", accessor: (r: EpilepsySeizurePlan) => r.consultant_neurologist ?? "" },
  { header: "Consultant Review Due", accessor: (r: EpilepsySeizurePlan) => r.consultant_review_due ?? "" },
  { header: "Recent Seizures (logged)", accessor: (r: EpilepsySeizurePlan) => String(r.recent_seizure_log.length) },
  { header: "Key Worker", accessor: (r: EpilepsySeizurePlan) => getStaffName(r.key_worker) },
  { header: "Review Date", accessor: (r: EpilepsySeizurePlan) => r.review_date },
];

/* ─── component ─── */
export default function ChildEpilepsySeizurePlanPage() {
  const { data: res, isLoading } = useEpilepsySeizurePlans();
  const items = res?.data ?? [];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [diagnosisFilter, setDiagnosisFilter] = useState("all");
  const [sortBy, setSortBy] = useState("review_due");

  const diagnoses = useMemo(() => {
    const set = new Set<string>();
    items.forEach((p) => set.add(p.diagnosis));
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    let list = [...items];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          getYPName(p.child_id).toLowerCase().includes(q) ||
          p.diagnosis.toLowerCase().includes(q) ||
          p.seizure_types.some((s) => s.name.toLowerCase().includes(q)) ||
          p.triggers.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (diagnosisFilter !== "all") {
      list = list.filter((p) => p.diagnosis === diagnosisFilter);
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "review_due":
          return a.review_date.localeCompare(b.review_date);
        case "name":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "recent_seizures":
          return b.recent_seizure_log.length - a.recent_seizure_log.length;
        case "plan_date":
          return b.plan_date.localeCompare(a.plan_date);
        default:
          return 0;
      }
    });
    return list;
  }, [items, search, diagnosisFilter, sortBy]);

  const stats = useMemo(() => {
    const active = items.length;
    const rescue = items.filter((p) => p.rescue_medication).length;
    const trained = items.reduce((s, p) => s + p.staff_trained_to_admin.length, 0);
    const today = new Date();
    const recent30 = items.reduce(
      (s, p) =>
        s +
        p.recent_seizure_log.filter((l) => {
          const dt = new Date(l.date);
          const diff = (today.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24);
          return diff <= 30;
        }).length,
      0,
    );
    return { active, rescue, trained, recent30 };
  }, [items]);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  if (isLoading) {
    return (
      <PageShell
        title="Epilepsy & Seizure Plans"
        subtitle="Per-child epilepsy and seizure management plan · Epilepsy12 format · NICE NG217 · Quality Standard 8"
      >
        <p>Loading…</p>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Epilepsy & Seizure Plans"
      subtitle="Per-child epilepsy and seizure management plan · Epilepsy12 format · NICE NG217 · Quality Standard 8"
      ariaContext={{ pageTitle: "Epilepsy & Seizure Plans", sourceType: "medication" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={items} columns={exportCols} filename="epilepsy-seizure-plans" />
          <PrintButton title="Epilepsy & Seizure Plans" />
          <AriaStudioQuickActionButton context={{ record_type: "medication", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area">
        {/* ─── stat cards ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-indigo-700">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Active Seizure Plans</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-violet-700">{stats.rescue}</p>
              <p className="text-xs text-muted-foreground">Rescue Meds Prescribed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-emerald-700">{stats.trained}</p>
              <p className="text-xs text-muted-foreground">Staff Trained (team total)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-amber-700">{stats.recent30}</p>
              <p className="text-xs text-muted-foreground">Recent Seizures (30 days)</p>
            </CardContent>
          </Card>
        </div>

        {/* ─── filters ─── */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search child, diagnosis, trigger…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={diagnosisFilter} onValueChange={setDiagnosisFilter}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Filter: Diagnosis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All diagnoses</SelectItem>
              {diagnoses.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 ml-auto">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="review_due">Sort: Review Due (soonest)</SelectItem>
                <SelectItem value="name">Sort: Name</SelectItem>
                <SelectItem value="recent_seizures">Sort: Recent Seizures (most)</SelectItem>
                <SelectItem value="plan_date">Sort: Plan Date (newest)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          Showing {filtered.length} seizure plan{filtered.length === 1 ? "" : "s"}
        </p>

        {/* ─── plan cards ─── */}
        <div className="space-y-3">
          {filtered.map((plan) => {
            const isOpen = expandedId === plan.id;
            const hasRescue = !!plan.rescue_medication;

            return (
              <Card key={plan.id} className="border-l-4 border-l-indigo-500">
                <CardHeader
                  className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => toggle(plan.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        <Brain className="h-4 w-4 text-indigo-600" />
                        {getYPName(plan.child_id)}
                        <Badge variant="outline" className="bg-indigo-100 text-indigo-800">
                          {plan.diagnosis.split(" — ")[0]}
                        </Badge>
                        {hasRescue ? (
                          <Badge variant="outline" className="bg-violet-100 text-violet-800">
                            <Pill className="h-3 w-3 mr-1" /> Rescue med prescribed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-100 text-[var(--cs-text-secondary)]">
                            No rescue med
                          </Badge>
                        )}
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-800">
                          {plan.staff_trained_to_admin.length} staff trained
                        </Badge>
                        {plan.school_plan_in_place && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            School plan in place
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Plan dated {plan.plan_date} · Key worker {getStaffName(plan.key_worker)} · Review due{" "}
                        {plan.review_date}
                        {plan.consultant_neurologist ? ` · ${plan.consultant_neurologist}` : ""}
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
                    {/* diagnosis summary */}
                    <div className="bg-indigo-50 border border-indigo-200 rounded p-2 text-xs">
                      <p className="font-medium text-indigo-900 mb-0.5">Diagnosis</p>
                      <p className="text-indigo-800">{plan.diagnosis}</p>
                    </div>

                    {/* seizure types */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1">
                        <Brain className="h-4 w-4 text-indigo-600" /> Seizure Types
                      </p>
                      <div className="space-y-1">
                        {plan.seizure_types.map((s, i) => (
                          <div key={i} className="bg-muted/40 rounded p-2 text-xs">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="font-medium">{s.name}</span>
                              <Badge variant="outline" className="text-[10px]">
                                <Clock className="h-3 w-3 mr-1" /> {s.typical_duration}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">{s.description}</p>
                            {s.last_observed && (
                              <p className="text-muted-foreground mt-0.5">
                                Last observed: {s.last_observed}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* warning signs + triggers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-amber-600" /> Warning Signs / Aura
                        </p>
                        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                          {plan.warning_signs.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-orange-600" /> Triggers
                        </p>
                        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                          {plan.triggers.map((t, i) => (
                            <li key={i}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* during seizure steps — prominent */}
                    <div className="bg-violet-50 border border-violet-200 rounded p-3">
                      <p className="font-semibold text-violet-900 mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" /> What to Do During a Seizure
                      </p>
                      <ol className="list-decimal list-inside text-xs text-violet-900 space-y-1">
                        {plan.during_seizure_steps.map((step, i) => (
                          <li key={i} className="leading-relaxed">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* recovery position */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="font-semibold text-blue-900 mb-2">Recovery Position / Post-Seizure Care</p>
                      <ol className="list-decimal list-inside text-xs text-blue-900 space-y-1">
                        {plan.recovery_position_steps.map((step, i) => (
                          <li key={i} className="leading-relaxed">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* 999 criteria — RED ZONE */}
                    <div className="bg-red-50 border-2 border-red-300 rounded p-3">
                      <p className="font-bold text-red-800 mb-2 flex items-center gap-1">
                        <Phone className="h-4 w-4" /> CALL 999 IMMEDIATELY IF…
                      </p>
                      <ul className="list-disc list-inside text-xs text-red-800 space-y-1 font-medium">
                        {plan.call_999_criteria.map((c, i) => (
                          <li key={i} className="leading-relaxed">
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* preventer + rescue meds */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {plan.preventer_medication && (
                        <div>
                          <p className="font-medium mb-1 flex items-center gap-1">
                            <Pill className="h-4 w-4 text-emerald-600" /> Preventer Medication
                          </p>
                          <div className="bg-emerald-50 border border-emerald-200 rounded p-2 text-xs">
                            <p className="font-semibold text-emerald-900">
                              {plan.preventer_medication.name} — {plan.preventer_medication.dose}
                            </p>
                            <p className="text-emerald-800 mt-0.5">{plan.preventer_medication.timing}</p>
                          </div>
                        </div>
                      )}
                      {plan.rescue_medication ? (
                        <div>
                          <p className="font-medium mb-1 flex items-center gap-1">
                            <Pill className="h-4 w-4 text-violet-600" /> Rescue Medication
                          </p>
                          <div className="bg-violet-50 border border-violet-200 rounded p-2 text-xs">
                            <p className="font-semibold text-violet-900">
                              {plan.rescue_medication.name} — {plan.rescue_medication.dose} ({plan.rescue_medication.route})
                            </p>
                            <p className="text-violet-800 mt-0.5">
                              <span className="font-medium">When to give:</span>{" "}
                              {plan.rescue_medication.when_to_give}
                            </p>
                            <p className="text-violet-800 mt-0.5">
                              Second dose:{" "}
                              {plan.rescue_medication.second_dose_allowed
                                ? "Permitted (per protocol — call 999 if needed)"
                                : "NOT permitted — call 999"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium mb-1 flex items-center gap-1">
                            <Pill className="h-4 w-4 text-[var(--cs-text-muted)]" /> Rescue Medication
                          </p>
                          <div className="bg-slate-50 border border-[var(--cs-border)] rounded p-2 text-xs text-[var(--cs-text-secondary)]">
                            None currently prescribed. Casey&apos;s seizures are brief absences and self-resolve.
                            Reassess with neurologist if pattern changes (any prolonged or convulsive seizure
                            triggers immediate review and likely buccal midazolam prescription).
                          </div>
                        </div>
                      )}
                    </div>

                    {/* staff trained */}
                    <div>
                      <p className="font-medium mb-1">Staff Trained to Recognise &amp; Respond</p>
                      <div className="flex flex-wrap gap-1">
                        {plan.staff_trained_to_admin.map((s) => (
                          <Badge key={s} variant="outline" className="bg-emerald-100 text-emerald-800 text-xs">
                            {getStaffName(s)}
                          </Badge>
                        ))}
                      </div>
                      {plan.staff_training_expires && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Annual epilepsy awareness training expires: {plan.staff_training_expires}
                        </p>
                      )}
                    </div>

                    {/* safe sleeping + bath/swim */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="font-medium mb-1">Safe Sleeping Arrangements</p>
                        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                          {plan.safe_sleeping_arrangements.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Bathing &amp; Swimming Policy</p>
                        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                          {plan.bathing_swimming_policy.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* recent seizure log table */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1">
                        <Clock className="h-4 w-4 text-amber-600" /> Recent Seizure Log
                      </p>
                      {plan.recent_seizure_log.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No recorded seizures.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border-collapse">
                            <thead>
                              <tr className="bg-muted/40">
                                <th className="text-left p-2 border">Date</th>
                                <th className="text-left p-2 border">Type</th>
                                <th className="text-left p-2 border">Duration (min)</th>
                                <th className="text-left p-2 border">Rescue Given</th>
                                <th className="text-left p-2 border">Outcome</th>
                              </tr>
                            </thead>
                            <tbody>
                              {plan.recent_seizure_log.map((log, i) => (
                                <tr key={i} className="border-t">
                                  <td className="p-2 border align-top">{log.date}</td>
                                  <td className="p-2 border align-top">{log.type}</td>
                                  <td className="p-2 border align-top">{log.duration_minutes}</td>
                                  <td className="p-2 border align-top">
                                    {log.rescue_given ? (
                                      <Badge variant="outline" className="bg-violet-100 text-violet-800 text-[10px]">
                                        Yes
                                      </Badge>
                                    ) : (
                                      <span className="text-muted-foreground">No</span>
                                    )}
                                  </td>
                                  <td className="p-2 border align-top text-muted-foreground">{log.outcome}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* emergency contacts */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1">
                        <Phone className="h-4 w-4 text-blue-600" /> Emergency Contacts
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                        {plan.emergency_contacts.map((c, i) => (
                          <div key={i} className="bg-muted/40 rounded p-2 text-xs">
                            <p className="font-medium">{c.name}</p>
                            <p className="text-muted-foreground">
                              {c.role} · {c.phone}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* consultant review */}
                    {plan.consultant_neurologist && (
                      <div className="bg-muted/40 rounded p-2 text-xs">
                        <p className="font-medium">Consultant Neurologist</p>
                        <p className="text-muted-foreground">
                          {plan.consultant_neurologist}
                          {plan.consultant_review_due ? ` · Next review due ${plan.consultant_review_due}` : ""}
                        </p>
                      </div>
                    )}

                    {/* child voice + staff observation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t">
                      <div>
                        <p className="font-medium mb-1">Child&apos;s Voice</p>
                        <p className="text-xs italic text-muted-foreground leading-relaxed">
                          &ldquo;{plan.child_voice}&rdquo;
                        </p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Staff Observation</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{plan.staff_observation}</p>
                      </div>
                    </div>

                    <SmartLinkPanel sourceType="epilepsy-seizure-plan" sourceId={plan.id} childId={plan.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* ─── regulatory note ─── */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">
            Regulatory Framework — NICE NG217 · Epilepsy12 · Quality Standard 8 · UNCRC Art 24
          </p>
          <p>
            Each child with epilepsy has an individual seizure management plan compliant with NICE NG217 (Epilepsies in
            children, young people and adults) and aligned with the Epilepsy12 audit dataset. Plans follow the Joint
            Epilepsy Council Status Epilepticus pathway for escalation and rescue medication. Where Sodium Valproate is
            prescribed to a person of childbearing potential, the MHRA Pregnancy Prevention Programme (PPP) applies and
            an annual specialist-signed risk acknowledgement form is required; for pre-pubertal children the PPP is
            triggered for review at first signs of puberty and an alternative AED considered before menarche. Plans
            satisfy Children&apos;s Homes Regulations 2015 Quality Standard 8 (Protection of children) and Reg 23
            (Health and wellbeing) and uphold the child&apos;s right to the highest attainable standard of health
            (UNCRC Article 24). Plans are co-produced with the child, agreed with parent/holder of PR and the
            consultant neurologist, signed off, accessible to all on-shift staff, and reviewed at least annually or
            after any significant change in seizure pattern.
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
        pageContext="Epilepsy & Seizure Plans — seizure type, rescue medication, seizure diary, triggers, post-ictal care, emergency action, school sharing, specialist review, AHA, LAC health"
        recordType="medication"
        className="mt-6"
      />
    </PageShell>
  );
}
