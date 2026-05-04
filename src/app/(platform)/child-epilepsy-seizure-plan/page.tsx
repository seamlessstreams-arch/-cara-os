"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
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
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";

/* ─── date helper ─── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ─── types ─── */
interface SeizurePlan {
  id: string;
  youngPerson: string;
  planDate: string;
  diagnosis: string;
  seizureTypes: { name: string; description: string; typicalDuration: string; lastObserved?: string }[];
  warningSigns: string[];
  triggers: string[];
  duringSeizureSteps: string[];
  recoveryPositionSteps: string[];
  call999Criteria: string[];
  preventerMedication?: { name: string; dose: string; timing: string };
  rescueMedication?: { name: string; dose: string; route: string; whenToGive: string; secondDoseAllowed: boolean };
  staffTrainedToAdmin: string[];
  staffTrainingExpires?: string;
  safeSleepingArrangements: string[];
  bathingSwimmingPolicy: string[];
  schoolPlanInPlace: boolean;
  emergencyContacts: { name: string; role: string; phone: string }[];
  recentSeizureLog: { date: string; type: string; durationMinutes: number; rescueGiven: boolean; outcome: string }[];
  consultantNeurologist?: string;
  consultantReviewDue?: string;
  childVoice: string;
  staffObservation: string;
  reviewDate: string;
  keyWorker: string;
}

/* ─── seed data ─── */
const PLANS: SeizurePlan[] = [
  {
    id: "esp_001",
    youngPerson: "yp_casey",
    planDate: d(-30),
    diagnosis: "Childhood Absence Epilepsy (CAE) — diagnosed within last year",
    seizureTypes: [
      {
        name: "Typical absence seizures",
        description:
          "Sudden, brief lapses of awareness — Casey 'goes blank', stops mid-sentence or mid-task, may stare or have subtle eyelid fluttering. No falling, no convulsion. Returns to activity unaware that anything has happened. EEG confirmed 3Hz generalised spike-and-wave discharges. MRI structurally normal.",
        typicalDuration: "5–15 seconds (occasionally up to 20s)",
        lastObserved: d(-3),
      },
    ],
    warningSigns: [
      "Mum has noticed Casey 'goes blank' for a few seconds — eyes still open, unresponsive to name",
      "Brief eyelid flutter or upward eye-roll at onset",
      "Drops or fumbles object held in hand at moment of absence",
      "Suddenly 'loses thread' of conversation or activity",
      "Cluster pattern observed — multiple absences within 30 minutes when tired",
    ],
    triggers: [
      "Tiredness / poor sleep the night before",
      "Flickering or strobing lights (photic) — TV, screens, sunlight through trees from car window",
      "Missed meals / low blood sugar",
      "Hyperventilation (running, crying, anxiety) — well-recognised trigger for absence epilepsy",
      "Acute illness with fever",
      "Missed dose of preventer medication",
    ],
    duringSeizureSteps: [
      "Stay calm. Note the time the seizure started — this is the single most important observation.",
      "Stay with Casey. Do NOT shake, shout or attempt to 'snap her out of it' — absences cannot be interrupted.",
      "If Casey is walking, eating, on stairs or near a hazard, gently guide her away from danger and remove the risk (e.g. take cup, move from kerb).",
      "Do NOT put anything in her mouth. Do NOT restrain.",
      "Observe and record: duration, eyelid/eye movement, any limb jerking, loss of bladder, colour change.",
      "When the absence ends Casey will resume what she was doing — quietly let her know she had an absence and what she missed.",
      "Reassure and offer a short rest. Document on seizure log immediately.",
    ],
    recoveryPositionSteps: [
      "Recovery is automatic for absence seizures — Casey returns to full awareness within seconds.",
      "Recovery position is NOT routinely required for absences (no loss of postural tone).",
      "If — unexpectedly — Casey ever has a tonic-clonic (convulsive) seizure: turn her on her side once jerking stops, tilt chin to keep airway clear, do not put anything in mouth, stay until fully recovered.",
      "Loosen anything tight around the neck. Cushion the head. Do not move unless in immediate danger.",
    ],
    call999Criteria: [
      "Any convulsive (tonic-clonic) seizure — Casey has not had one but always treat first as emergency.",
      "Absence lasting longer than 30 seconds, or a cluster of absences with no clear recovery between (possible absence status / non-convulsive status epilepticus).",
      "Repeated absences for >20 minutes without normal awareness in between.",
      "Any seizure resulting in injury (head injury, fall, burn, water exposure).",
      "Seizure occurring in water (bath, pool) — even a brief absence.",
      "Difficulty breathing, blue lips, persistent confusion or unresponsiveness after seizure ends.",
      "First-ever seizure of a different type (e.g. sudden jerk, drop, full convulsion).",
      "If in doubt — call 999. State 'known epilepsy, child, absence/possible status'.",
    ],
    preventerMedication: {
      name: "Sodium Valproate (Epilim)",
      dose: "200mg twice daily (titrating — current week 4 of titration plan)",
      timing:
        "08:00 with breakfast and 20:00 with evening meal. CRITICAL FLAG (MHRA Pregnancy Prevention Programme): Sodium Valproate is teratogenic. Casey is pre-pubertal but PPP review must be triggered at first signs of puberty — alternative AED (e.g. ethosuximide or lamotrigine) to be discussed with neurologist BEFORE menarche. Annual PPP form to be signed by specialist. Document in healthcare plan and key-working notes.",
    },
    rescueMedication: undefined,
    staffTrainedToAdmin: ["staff_anna", "staff_darren"],
    staffTrainingExpires: d(335),
    safeSleepingArrangements: [
      "Standard bed at floor-adjacent height (low divan) — minimal fall risk if a nocturnal seizure occurred.",
      "Anti-suffocation pillow in use as precaution (low SUDEP-mitigation measure recommended for all paediatric epilepsy).",
      "Bedroom door left ajar overnight; staff sleep-in within hearing distance.",
      "Audio monitor (consent given by Casey and mum) — staff alerted to unusual sounds.",
      "No top bunk. No heavy/loose bedding obstructing face. Mattress in good condition.",
      "Night-time absences not currently observed; reassessed at every plan review.",
    ],
    bathingSwimmingPolicy: [
      "Showers preferred over baths (Joint Epilepsy Council guidance) — reduced drowning risk.",
      "If bath taken: shallow water (max 10cm), staff member present in bathroom (not just within earshot), bathroom door unlocked, plug not used if Casey alone in room — none of these apply currently as Casey takes showers only.",
      "Swimming permitted with one-to-one trained adult in water within arm's reach at all times — pool staff informed of epilepsy diagnosis and given seizure plan extract.",
      "No unsupervised swimming, no diving, no deep-end activities.",
      "Avoid open-water swimming until full seizure control achieved for 12+ months.",
      "Hair-washing supervised — risk of head submersion during absence.",
    ],
    schoolPlanInPlace: true,
    emergencyContacts: [
      { name: "Dr Edwards", role: "Consultant Paediatric Neurologist", phone: "0114 271 7000 (Sheffield Children's Hospital)" },
      { name: "Epilepsy Specialist Nurse", role: "ESN — community team", phone: "01234 555303" },
      { name: "Mum (parent — PR retained)", role: "Parent, contact for medical decisions", phone: "07700 900123" },
      { name: "Eastbrook Medical Practice", role: "GP — Dr M. Patel", phone: "01234 567890" },
      { name: "Ambulance / Emergency", role: "999 — state 'known epilepsy, child'", phone: "999" },
    ],
    recentSeizureLog: [
      { date: d(-3), type: "Typical absence", durationMinutes: 0.15, rescueGiven: false, outcome: "Self-resolved at breakfast — Casey had stayed up late watching screens. Sleep hygiene reinforced." },
      { date: d(-9), type: "Typical absence (cluster of 3)", durationMinutes: 0.5, rescueGiven: false, outcome: "Cluster during car journey — flickering sunlight through trees identified as trigger. Sun visor and tinted side-window now in use." },
      { date: d(-18), type: "Typical absence", durationMinutes: 0.1, rescueGiven: false, outcome: "Brief absence in classroom — teacher recognised and documented. No intervention needed." },
      { date: d(-25), type: "Typical absence", durationMinutes: 0.25, rescueGiven: false, outcome: "Occurred during PE warm-up (hyperventilation trigger). PE teacher to slow warm-up." },
      { date: d(-44), type: "Typical absence (cluster of 4 in 20min)", durationMinutes: 1.5, rescueGiven: false, outcome: "Cluster following missed lunch — escalated to ESN. Preventer dose titration brought forward." },
    ],
    consultantNeurologist: "Dr Edwards, Consultant Paediatric Neurologist (Sheffield Children's Hospital)",
    consultantReviewDue: d(60),
    childVoice:
      "I don't know when they happen — people just tell me afterwards. I don't like it when teachers make a fuss. I want to be the same as my friends. Mum said the medicine might make me feel a bit sleepy at first but it should help. I like that I can still go swimming if someone watches me.",
    staffObservation:
      "Casey settling well to new diagnosis. Engages openly with key-working sessions about epilepsy. Adherence to morning Sodium Valproate is good; evening dose occasionally missed when out — pill organiser and reminder routine in place. Sleep routine has been the biggest impact area — clear correlation between late screens and next-day cluster days. School fully briefed and absences are recognised by class teacher.",
    reviewDate: d(60),
    keyWorker: "staff_anna",
  },
];

/* ─── export columns ─── */
const exportCols: ExportColumn<SeizurePlan>[] = [
  { header: "Young Person", accessor: (r: SeizurePlan) => getYPName(r.youngPerson) },
  { header: "Plan Date", accessor: (r: SeizurePlan) => r.planDate },
  { header: "Diagnosis", accessor: (r: SeizurePlan) => r.diagnosis },
  { header: "Seizure Types", accessor: (r: SeizurePlan) => r.seizureTypes.map((s) => s.name).join("; ") },
  { header: "Triggers", accessor: (r: SeizurePlan) => r.triggers.join("; ") },
  { header: "Preventer Med", accessor: (r: SeizurePlan) => (r.preventerMedication ? `${r.preventerMedication.name} ${r.preventerMedication.dose}` : "None") },
  { header: "Rescue Med", accessor: (r: SeizurePlan) => (r.rescueMedication ? `${r.rescueMedication.name} ${r.rescueMedication.dose} ${r.rescueMedication.route}` : "None") },
  { header: "Staff Trained (count)", accessor: (r: SeizurePlan) => String(r.staffTrainedToAdmin.length) },
  { header: "School Plan In Place", accessor: (r: SeizurePlan) => (r.schoolPlanInPlace ? "Yes" : "No") },
  { header: "Neurologist", accessor: (r: SeizurePlan) => r.consultantNeurologist ?? "" },
  { header: "Consultant Review Due", accessor: (r: SeizurePlan) => r.consultantReviewDue ?? "" },
  { header: "Recent Seizures (logged)", accessor: (r: SeizurePlan) => String(r.recentSeizureLog.length) },
  { header: "Key Worker", accessor: (r: SeizurePlan) => getStaffName(r.keyWorker) },
  { header: "Review Date", accessor: (r: SeizurePlan) => r.reviewDate },
];

/* ─── component ─── */
export default function ChildEpilepsySeizurePlanPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [diagnosisFilter, setDiagnosisFilter] = useState("all");
  const [sortBy, setSortBy] = useState("review_due");

  const diagnoses = useMemo(() => {
    const set = new Set<string>();
    PLANS.forEach((p) => set.add(p.diagnosis));
    return Array.from(set);
  }, []);

  const filtered = useMemo(() => {
    let list = [...PLANS];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          getYPName(p.youngPerson).toLowerCase().includes(q) ||
          p.diagnosis.toLowerCase().includes(q) ||
          p.seizureTypes.some((s) => s.name.toLowerCase().includes(q)) ||
          p.triggers.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (diagnosisFilter !== "all") {
      list = list.filter((p) => p.diagnosis === diagnosisFilter);
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "review_due":
          return a.reviewDate.localeCompare(b.reviewDate);
        case "name":
          return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
        case "recent_seizures":
          return b.recentSeizureLog.length - a.recentSeizureLog.length;
        case "plan_date":
          return b.planDate.localeCompare(a.planDate);
        default:
          return 0;
      }
    });
    return list;
  }, [search, diagnosisFilter, sortBy]);

  const stats = useMemo(() => {
    const active = PLANS.length;
    const rescue = PLANS.filter((p) => p.rescueMedication).length;
    const trained = PLANS.reduce((s, p) => s + p.staffTrainedToAdmin.length, 0);
    const today = new Date();
    const recent30 = PLANS.reduce(
      (s, p) =>
        s +
        p.recentSeizureLog.filter((l) => {
          const dt = new Date(l.date);
          const diff = (today.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24);
          return diff <= 30;
        }).length,
      0,
    );
    return { active, rescue, trained, recent30 };
  }, []);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  return (
    <PageShell
      title="Epilepsy & Seizure Plans"
      subtitle="Per-child epilepsy and seizure management plan · Epilepsy12 format · NICE NG217 · Quality Standard 8"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={PLANS} columns={exportCols} filename="epilepsy-seizure-plans" />
          <PrintButton title="Epilepsy & Seizure Plans" />
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
            const hasRescue = !!plan.rescueMedication;

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
                        {getYPName(plan.youngPerson)}
                        <Badge variant="outline" className="bg-indigo-100 text-indigo-800">
                          {plan.diagnosis.split(" — ")[0]}
                        </Badge>
                        {hasRescue ? (
                          <Badge variant="outline" className="bg-violet-100 text-violet-800">
                            <Pill className="h-3 w-3 mr-1" /> Rescue med prescribed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-100 text-slate-700">
                            No rescue med
                          </Badge>
                        )}
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-800">
                          {plan.staffTrainedToAdmin.length} staff trained
                        </Badge>
                        {plan.schoolPlanInPlace && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            School plan in place
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Plan dated {plan.planDate} · Key worker {getStaffName(plan.keyWorker)} · Review due{" "}
                        {plan.reviewDate}
                        {plan.consultantNeurologist ? ` · ${plan.consultantNeurologist}` : ""}
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
                        {plan.seizureTypes.map((s, i) => (
                          <div key={i} className="bg-muted/40 rounded p-2 text-xs">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="font-medium">{s.name}</span>
                              <Badge variant="outline" className="text-[10px]">
                                <Clock className="h-3 w-3 mr-1" /> {s.typicalDuration}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">{s.description}</p>
                            {s.lastObserved && (
                              <p className="text-muted-foreground mt-0.5">
                                Last observed: {s.lastObserved}
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
                          {plan.warningSigns.map((w, i) => (
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
                        {plan.duringSeizureSteps.map((step, i) => (
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
                        {plan.recoveryPositionSteps.map((step, i) => (
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
                        {plan.call999Criteria.map((c, i) => (
                          <li key={i} className="leading-relaxed">
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* preventer + rescue meds */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {plan.preventerMedication && (
                        <div>
                          <p className="font-medium mb-1 flex items-center gap-1">
                            <Pill className="h-4 w-4 text-emerald-600" /> Preventer Medication
                          </p>
                          <div className="bg-emerald-50 border border-emerald-200 rounded p-2 text-xs">
                            <p className="font-semibold text-emerald-900">
                              {plan.preventerMedication.name} — {plan.preventerMedication.dose}
                            </p>
                            <p className="text-emerald-800 mt-0.5">{plan.preventerMedication.timing}</p>
                          </div>
                        </div>
                      )}
                      {plan.rescueMedication ? (
                        <div>
                          <p className="font-medium mb-1 flex items-center gap-1">
                            <Pill className="h-4 w-4 text-violet-600" /> Rescue Medication
                          </p>
                          <div className="bg-violet-50 border border-violet-200 rounded p-2 text-xs">
                            <p className="font-semibold text-violet-900">
                              {plan.rescueMedication.name} — {plan.rescueMedication.dose} ({plan.rescueMedication.route})
                            </p>
                            <p className="text-violet-800 mt-0.5">
                              <span className="font-medium">When to give:</span>{" "}
                              {plan.rescueMedication.whenToGive}
                            </p>
                            <p className="text-violet-800 mt-0.5">
                              Second dose:{" "}
                              {plan.rescueMedication.secondDoseAllowed
                                ? "Permitted (per protocol — call 999 if needed)"
                                : "NOT permitted — call 999"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium mb-1 flex items-center gap-1">
                            <Pill className="h-4 w-4 text-slate-500" /> Rescue Medication
                          </p>
                          <div className="bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-700">
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
                        {plan.staffTrainedToAdmin.map((s) => (
                          <Badge key={s} variant="outline" className="bg-emerald-100 text-emerald-800 text-xs">
                            {getStaffName(s)}
                          </Badge>
                        ))}
                      </div>
                      {plan.staffTrainingExpires && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Annual epilepsy awareness training expires: {plan.staffTrainingExpires}
                        </p>
                      )}
                    </div>

                    {/* safe sleeping + bath/swim */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="font-medium mb-1">Safe Sleeping Arrangements</p>
                        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                          {plan.safeSleepingArrangements.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Bathing &amp; Swimming Policy</p>
                        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                          {plan.bathingSwimmingPolicy.map((s, i) => (
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
                      {plan.recentSeizureLog.length === 0 ? (
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
                              {plan.recentSeizureLog.map((log, i) => (
                                <tr key={i} className="border-t">
                                  <td className="p-2 border align-top">{log.date}</td>
                                  <td className="p-2 border align-top">{log.type}</td>
                                  <td className="p-2 border align-top">{log.durationMinutes}</td>
                                  <td className="p-2 border align-top">
                                    {log.rescueGiven ? (
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
                        {plan.emergencyContacts.map((c, i) => (
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
                    {plan.consultantNeurologist && (
                      <div className="bg-muted/40 rounded p-2 text-xs">
                        <p className="font-medium">Consultant Neurologist</p>
                        <p className="text-muted-foreground">
                          {plan.consultantNeurologist}
                          {plan.consultantReviewDue ? ` · Next review due ${plan.consultantReviewDue}` : ""}
                        </p>
                      </div>
                    )}

                    {/* child voice + staff observation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t">
                      <div>
                        <p className="font-medium mb-1">Child&apos;s Voice</p>
                        <p className="text-xs italic text-muted-foreground leading-relaxed">
                          &ldquo;{plan.childVoice}&rdquo;
                        </p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Staff Observation</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{plan.staffObservation}</p>
                      </div>
                    </div>
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
    </PageShell>
  );
}
