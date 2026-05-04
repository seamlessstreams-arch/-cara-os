"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EMERGENCY MEDICATION PROTOCOLS
// Per-child emergency medication protocols (EpiPen, asthma rescue inhaler,
// rectal diazepam, glucagon, etc.) with step-by-step staff procedures, 999/GP
// trigger thresholds, training register, and review sign-off.
// Required under Quality Standard 7 (Health & Wellbeing) & Regulation 23.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Heart,
  MapPin,
  Phone,
  Pill,
  Search,
  ShieldCheck,
  Stethoscope,
  Users,
  XCircle,
  Zap,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Trigger =
  | "Asthma attack"
  | "Anaphylaxis"
  | "Seizure"
  | "Hypoglycaemia"
  | "Severe allergic reaction"
  | "Mental health crisis";

interface EmergencyProtocol {
  id: string;
  youngPerson: string;
  condition: string;
  trigger: Trigger;
  emergencyMedication: string;
  spareEpiPenLocations: string[];
  recogniseSymptoms: string[];
  stepByStepProcedure: string[];
  whenToCall999: string;
  whenToCallGp: string;
  positionOfPatient: string;
  aftercare: string[];
  staffTrainedToAdminister: string[];
  childCanSelfAdminister: boolean;
  childRecognisesSymptoms: boolean;
  schoolAndCommunityProvision: string;
  medicationLocations: string[];
  expiryCheckSchedule: string;
  lastReviewDate: string;
  reviewedBy: string;
  nextReviewDue: string;
  signedOffByGP: boolean;
  childInformed: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const today = d(0);

const TRIGGER_COLOURS: Record<Trigger, string> = {
  "Asthma attack": "bg-sky-100 text-sky-700",
  Anaphylaxis: "bg-red-100 text-red-700",
  Seizure: "bg-purple-100 text-purple-700",
  Hypoglycaemia: "bg-amber-100 text-amber-700",
  "Severe allergic reaction": "bg-orange-100 text-orange-700",
  "Mental health crisis": "bg-pink-100 text-pink-700",
};

// ── Seed Data ─────────────────────────────────────────────────────────────────

const SEED: EmergencyProtocol[] = [
  {
    id: "emp_001",
    youngPerson: "yp_jordan",
    condition:
      "Moderate persistent asthma — risk of exacerbation triggered by viral illness, exercise and pollen",
    trigger: "Asthma attack",
    emergencyMedication: "Salbutamol inhaler 100mcg (with spacer)",
    spareEpiPenLocations: [],
    recogniseSymptoms: [
      "Audible wheeze on expiration",
      "Persistent cough that does not settle",
      "Difficulty completing full sentences",
      "Use of accessory muscles (neck, shoulders)",
      "Lips or fingertips turning blue (cyanosis)",
      "Peak flow reading below 50% of personal best",
    ],
    stepByStepProcedure: [
      "Stay calm and reassure Jordan — anxiety worsens breathing",
      "Sit Jordan upright — never lie them flat",
      "Loosen tight clothing around chest and neck",
      "Give 1 puff of salbutamol via spacer, ask Jordan to take 5 slow breaths",
      "Repeat every 30–60 seconds, up to a maximum of 10 puffs",
      "If no improvement after 10 puffs OR symptoms worsen at any point, call 999",
      "While waiting for ambulance, continue 1 puff every 60 seconds",
      "Record each puff time and Jordan's response on the asthma observation log",
    ],
    whenToCall999:
      "Call 999 immediately if: inhaler not helping after 10 puffs, Jordan is too breathless to talk, lips turn blue, exhaustion sets in, or you are at any point unsure. Never delay — better to call early.",
    whenToCallGp:
      "Call GP same day if Jordan needed reliever inhaler more than usual but recovered, or if waking at night with cough/wheeze. Routine GP review within 48 hours of any rescue inhaler use over 4 puffs.",
    positionOfPatient:
      "Upright sitting position — leaning slightly forward with hands on knees if helpful. Never lie flat.",
    aftercare: [
      "Record episode in health log including trigger, severity, response time and puffs administered",
      "Inform on-call manager and parents/social worker within 1 hour",
      "Book GP review within 48 hours",
      "Review whether asthma management plan needs escalation",
      "Restock spacer/inhaler in grab bag if used",
      "Debrief with Jordan when calm — what helped, what didn't",
    ],
    staffTrainedToAdminister: ["staff_darren", "staff_anna"],
    childCanSelfAdminister: true,
    childRecognisesSymptoms: true,
    schoolAndCommunityProvision:
      "Spare salbutamol inhaler and spacer held at school nurse's office. Asthma plan shared with PE department, head of year and after-school club. Jordan carries personal inhaler in school bag.",
    medicationLocations: [
      "Jordan's bedroom (bedside drawer — primary)",
      "Locked medication cupboard (spare)",
      "Grab bag in staff office",
      "Vehicle first-aid kit",
    ],
    expiryCheckSchedule:
      "Monthly expiry check on 1st of each month — logged in medication stock check. Inhalers replaced 3 months before expiry.",
    lastReviewDate: d(-42),
    reviewedBy: "staff_darren",
    nextReviewDue: d(48),
    signedOffByGP: true,
    childInformed: true,
  },
  {
    id: "emp_002",
    youngPerson: "yp_casey",
    condition:
      "Type I latex allergy with sensory dysregulation — severe local reaction risk plus crisis escalation if exposure causes panic",
    trigger: "Severe allergic reaction",
    emergencyMedication:
      "Cetirizine 10mg liquid (first line) + EpiPen 0.3mg (in case of systemic escalation)",
    spareEpiPenLocations: [
      "Locked medication cupboard — main",
      "Grab bag in staff office",
      "Casey's school nurse office",
      "Vehicle first-aid kit",
    ],
    recogniseSymptoms: [
      "Localised rash, hives or swelling at contact site",
      "Itching, especially of palms or soles",
      "Tingling lips or tongue",
      "Tightness in throat or chest",
      "Difficulty breathing or swallowing",
      "Sudden severe distress or sensory shutdown (Casey-specific indicator)",
      "Pale, clammy skin or sudden drop in responsiveness",
    ],
    stepByStepProcedure: [
      "Remove the latex source immediately (gloves, balloons, elastic) and move Casey to a calm, low-stimulus room",
      "If symptoms are localised only — give cetirizine 10mg, monitor every 5 minutes",
      "If breathing affected, throat tightening, or systemic symptoms — administer EpiPen into outer thigh (through clothing if needed), hold 3 seconds, massage site for 10 seconds",
      "Call 999 immediately after EpiPen — say 'anaphylaxis, EpiPen given'",
      "Note exact time of EpiPen administration",
      "If no improvement after 5 minutes, give second EpiPen from spare location",
      "Use Casey's grounding script (kept in grab bag) to manage sensory overwhelm",
      "Stay with Casey, keep airway clear, do not give food or drink",
    ],
    whenToCall999:
      "Call 999 immediately on ANY administration of EpiPen, OR if breathing/swallowing affected, throat tightening, collapse, or if you are unsure. Casey's sensory shutdown can mask deterioration — escalate early.",
    whenToCallGp:
      "Call GP same day for any localised reaction not requiring EpiPen — to review whether allergy plan or trigger list needs updating. Routine annual allergy review with consultant immunologist.",
    positionOfPatient:
      "If conscious and breathing normally — sit upright. If breathing difficulty — sit upright leaning forward. If feeling faint/pale — lie flat with legs raised. If unconscious but breathing — recovery position. Never stand Casey up after EpiPen.",
    aftercare: [
      "Casey must be observed in hospital for minimum 6 hours after any EpiPen administration (biphasic reaction risk)",
      "Replace used EpiPen within 24 hours — pharmacy on-call contact in grab bag",
      "Notify Ofsted under Reg 40 if hospital admission resulted",
      "Update allergy log, medication errors register if applicable",
      "Sensory regulation debrief with Casey's key worker once stable",
      "Review trigger source — was provision adequate? Update environmental risk assessment",
      "Inform school, social worker, parents within 1 hour",
    ],
    staffTrainedToAdminister: ["staff_darren", "staff_anna"],
    childCanSelfAdminister: false,
    childRecognisesSymptoms: true,
    schoolAndCommunityProvision:
      "Latex-free environment confirmed at school — health plan held by school nurse. Spare EpiPen held in school's secure medical cupboard. Activity providers (riding stables, drama club) given allergy briefing and EpiPen instructions. All home staff carry awareness card.",
    medicationLocations: [
      "Casey's bedroom (named pouch on bedside table — primary)",
      "Locked medication cupboard (spare EpiPen + cetirizine)",
      "Grab bag in staff office (spare EpiPen)",
      "Vehicle first-aid kit (spare EpiPen)",
    ],
    expiryCheckSchedule:
      "Weekly visual check on Sunday night handover. Full expiry audit on 1st of each month. EpiPens replaced 2 months before expiry — never used 'just in case' past expiry.",
    lastReviewDate: d(-21),
    reviewedBy: "staff_anna",
    nextReviewDue: d(70),
    signedOffByGP: true,
    childInformed: true,
  },
  {
    id: "emp_003",
    youngPerson: "yp_alex",
    condition:
      "No diagnosed allergy or reactive condition — protocol held as precautionary anaphylaxis-preparedness for new placements, off-site activities and visiting peers with known allergies",
    trigger: "Anaphylaxis",
    emergencyMedication:
      "EpiPen 0.3mg (held as home stock — not assigned, not for routine use)",
    spareEpiPenLocations: [
      "Locked medication cupboard — generic stock",
      "Grab bag in staff office",
    ],
    recogniseSymptoms: [
      "Sudden swelling of face, lips, tongue or throat",
      "Difficulty breathing, wheezing or noisy breathing",
      "Widespread hives or rash with feeling of dread",
      "Sudden collapse or loss of consciousness",
      "Persistent vomiting with rash",
      "Pale, clammy or floppy presentation in younger children",
    ],
    stepByStepProcedure: [
      "Remove suspected trigger (food, sting, contact item) if visible",
      "Lie person flat with legs raised — UNLESS breathing difficulty, then sit upright",
      "If unconscious and breathing — recovery position",
      "Administer EpiPen into outer mid-thigh — through clothing acceptable, hold 3 seconds, massage 10 seconds",
      "Call 999 immediately — say 'anaphylaxis, EpiPen given'",
      "Note exact time of administration",
      "If no improvement after 5 minutes, give second EpiPen from spare location",
      "Stay with person, keep airway clear, do not give food or drink",
      "Hand used EpiPen to paramedics on arrival",
    ],
    whenToCall999:
      "Call 999 immediately on ANY suspected anaphylaxis, even before EpiPen if anaphylaxis suspected. Always call 999 after EpiPen use regardless of apparent recovery.",
    whenToCallGp:
      "Not applicable for active anaphylaxis — always 999. GP follow-up within 48 hours after any incident to review trigger identification and ongoing care plan.",
    positionOfPatient:
      "Default: lie flat, legs raised. Breathing difficulty: sit upright. Unconscious but breathing: recovery position. Pregnant: lie on left side. Never stand person up after EpiPen.",
    aftercare: [
      "Observe in hospital minimum 6 hours (biphasic reaction risk)",
      "Replace used EpiPen within 24 hours via on-call pharmacy",
      "Reg 40 Ofsted notification if hospital admission resulted",
      "Review whether visitor/activity risk assessment was adequate",
      "Update home stock register",
      "Brief all staff on what triggered the response",
    ],
    staffTrainedToAdminister: ["staff_darren", "staff_anna"],
    childCanSelfAdminister: false,
    childRecognisesSymptoms: false,
    schoolAndCommunityProvision:
      "Generic stock — not held at school. Activity leaders briefed on home's emergency protocol when off-site. EpiPen carried in grab bag on all outings. Visitor allergy declaration form completed before any overnight stays by peers.",
    medicationLocations: [
      "Locked medication cupboard (primary stock)",
      "Grab bag in staff office (carried on all outings)",
    ],
    expiryCheckSchedule:
      "Monthly expiry check on 1st of each month — logged in medication stock check. Generic EpiPens replaced 3 months before expiry.",
    lastReviewDate: d(-90),
    reviewedBy: "staff_darren",
    nextReviewDue: d(-2),
    signedOffByGP: false,
    childInformed: false,
  },
];

// ── Page Component ────────────────────────────────────────────────────────────

export default function EmergencyMedicationProtocolsPage() {
  const [search, setSearch] = useState("");
  const [triggerFilter, setTriggerFilter] = useState("all");
  const [ypFilter, setYpFilter] = useState("all");
  const [sortBy, setSortBy] = useState("review_due");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Stats ───────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const active = SEED.length;
    const gpSigned = SEED.filter((r) => r.signedOffByGP).length;
    const avgTrained =
      SEED.length > 0
        ? Math.round(
            SEED.reduce((acc, r) => acc + r.staffTrainedToAdminister.length, 0) /
              SEED.length
          )
        : 0;
    const reviewsDue = SEED.filter(
      (r) => r.nextReviewDue <= d(14)
    ).length;
    return { active, gpSigned, avgTrained, reviewsDue };
  }, []);

  // ── Filtering & Sorting ─────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...SEED];

    if (triggerFilter !== "all") {
      list = list.filter((r) => r.trigger === triggerFilter);
    }
    if (ypFilter !== "all") {
      list = list.filter((r) => r.youngPerson === ypFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.condition.toLowerCase().includes(q) ||
          r.emergencyMedication.toLowerCase().includes(q) ||
          r.trigger.toLowerCase().includes(q) ||
          getYPName(r.youngPerson).toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case "review_due":
          return a.nextReviewDue.localeCompare(b.nextReviewDue);
        case "review_recent":
          return b.lastReviewDate.localeCompare(a.lastReviewDate);
        case "young_person":
          return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
        case "trigger":
          return a.trigger.localeCompare(b.trigger);
        default:
          return 0;
      }
    });

    return list;
  }, [search, triggerFilter, ypFilter, sortBy]);

  // ── Export columns ──────────────────────────────────────────────────────────

  const exportColumns: ExportColumn<EmergencyProtocol>[] = [
    {
      header: "Young Person",
      accessor: (r: EmergencyProtocol) => getYPName(r.youngPerson),
    },
    { header: "Condition", accessor: (r: EmergencyProtocol) => r.condition },
    { header: "Trigger", accessor: (r: EmergencyProtocol) => r.trigger },
    {
      header: "Emergency Medication",
      accessor: (r: EmergencyProtocol) => r.emergencyMedication,
    },
    {
      header: "Spare EpiPen Locations",
      accessor: (r: EmergencyProtocol) => r.spareEpiPenLocations.join("; "),
    },
    {
      header: "Recognise Symptoms",
      accessor: (r: EmergencyProtocol) => r.recogniseSymptoms.join("; "),
    },
    {
      header: "Step-by-Step Procedure",
      accessor: (r: EmergencyProtocol) =>
        r.stepByStepProcedure.map((s, i) => `${i + 1}. ${s}`).join(" | "),
    },
    { header: "When to Call 999", accessor: (r: EmergencyProtocol) => r.whenToCall999 },
    { header: "When to Call GP", accessor: (r: EmergencyProtocol) => r.whenToCallGp },
    {
      header: "Position of Patient",
      accessor: (r: EmergencyProtocol) => r.positionOfPatient,
    },
    {
      header: "Aftercare",
      accessor: (r: EmergencyProtocol) => r.aftercare.join("; "),
    },
    {
      header: "Staff Trained",
      accessor: (r: EmergencyProtocol) =>
        r.staffTrainedToAdminister.map(getStaffName).join(", "),
    },
    {
      header: "Child Can Self-Administer",
      accessor: (r: EmergencyProtocol) => (r.childCanSelfAdminister ? "Yes" : "No"),
    },
    {
      header: "Child Recognises Symptoms",
      accessor: (r: EmergencyProtocol) => (r.childRecognisesSymptoms ? "Yes" : "No"),
    },
    {
      header: "School & Community Provision",
      accessor: (r: EmergencyProtocol) => r.schoolAndCommunityProvision,
    },
    {
      header: "Medication Locations",
      accessor: (r: EmergencyProtocol) => r.medicationLocations.join("; "),
    },
    {
      header: "Expiry Check Schedule",
      accessor: (r: EmergencyProtocol) => r.expiryCheckSchedule,
    },
    {
      header: "Last Review Date",
      accessor: (r: EmergencyProtocol) => r.lastReviewDate,
    },
    {
      header: "Reviewed By",
      accessor: (r: EmergencyProtocol) => getStaffName(r.reviewedBy),
    },
    {
      header: "Next Review Due",
      accessor: (r: EmergencyProtocol) => r.nextReviewDue,
    },
    {
      header: "Signed Off By GP",
      accessor: (r: EmergencyProtocol) => (r.signedOffByGP ? "Yes" : "No"),
    },
    {
      header: "Child Informed",
      accessor: (r: EmergencyProtocol) => (r.childInformed ? "Yes" : "No"),
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <PageShell
      title="Emergency Medication Protocols"
      subtitle="Per-child emergency response procedures — QS7 (Health) & Regulation 23"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Emergency Medication Protocols" />
          <ExportButton<EmergencyProtocol>
            data={filtered}
            columns={exportColumns}
            filename="emergency-medication-protocols"
          />
        </div>
      }
    >
      {/* ── Summary Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Active Protocols",
            value: stats.active,
            icon: ShieldCheck,
            colour: "text-blue-600",
          },
          {
            label: "GP Signed-Off",
            value: `${stats.gpSigned}/${stats.active}`,
            icon: CheckCircle2,
            colour: "text-green-600",
          },
          {
            label: "Staff Trained (avg)",
            value: stats.avgTrained,
            icon: Users,
            colour: "text-purple-600",
          },
          {
            label: "Reviews Due (14d)",
            value: stats.reviewsDue,
            icon: Clock,
            colour: stats.reviewsDue > 0 ? "text-red-600" : "text-slate-500",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border bg-card p-3 flex items-center gap-3"
          >
            <s.icon className={cn("h-5 w-5", s.colour)} />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Strong Red Emergency Banner ────────────────────────────────────── */}
      <div className="mb-6 rounded-lg border-2 border-red-300 bg-red-50 p-4 flex items-start gap-3">
        <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="font-bold text-red-900 uppercase tracking-wide text-sm">
            Emergency procedures must be printed and posted
          </p>
          <p className="mt-1 text-sm text-red-800">
            A laminated copy of every active emergency medication protocol must be
            displayed in the staff office <strong>and</strong> kitchen, with each
            child&apos;s photo, condition, medication location, and 999 trigger
            criteria. In an emergency there is no time to navigate a system —{" "}
            <strong>look, recognise, act</strong>. All staff confirm visual
            familiarity with each child&apos;s protocol on shift handover.
          </p>
        </div>
      </div>

      {/* ── Filters & Sort ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search protocols, conditions, medications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm"
          />
        </div>

        <Select value={ypFilter} onValueChange={setYpFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Young Person" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Young People</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={triggerFilter} onValueChange={setTriggerFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Trigger" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Triggers</SelectItem>
            <SelectItem value="Asthma attack">Asthma attack</SelectItem>
            <SelectItem value="Anaphylaxis">Anaphylaxis</SelectItem>
            <SelectItem value="Seizure">Seizure</SelectItem>
            <SelectItem value="Hypoglycaemia">Hypoglycaemia</SelectItem>
            <SelectItem value="Severe allergic reaction">
              Severe allergic reaction
            </SelectItem>
            <SelectItem value="Mental health crisis">Mental health crisis</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="review_due">Next Review Due</SelectItem>
              <SelectItem value="review_recent">Most Recently Reviewed</SelectItem>
              <SelectItem value="young_person">Young Person (A–Z)</SelectItem>
              <SelectItem value="trigger">Trigger Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Protocol Cards ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No protocols match your filters.
          </p>
        )}

        {filtered.map((protocol) => {
          const expanded = expandedId === protocol.id;
          const triggerColour = TRIGGER_COLOURS[protocol.trigger];
          const reviewOverdue = protocol.nextReviewDue < today;

          return (
            <div
              key={protocol.id}
              className="rounded-lg border bg-card overflow-hidden"
            >
              {/* Card Header */}
              <button
                onClick={() => setExpandedId(expanded ? null : protocol.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Pill className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">
                        {getYPName(protocol.youngPerson)}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          triggerColour
                        )}
                      >
                        {protocol.trigger}
                      </span>
                      {protocol.signedOffByGP ? (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          GP signed-off
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700">
                          <XCircle className="h-3 w-3 mr-1" />
                          Awaiting GP sign-off
                        </span>
                      )}
                      {reviewOverdue && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Review overdue
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {protocol.emergencyMedication} — {protocol.condition}
                    </p>
                  </div>
                </div>
                {expanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
              </button>

              {/* Expanded Content */}
              {expanded && (
                <div className="border-t px-4 py-4 space-y-5">
                  {/* Condition & Medication */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-1 flex items-center gap-1">
                        <Stethoscope className="h-4 w-4" /> Condition
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {protocol.condition}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1 flex items-center gap-1">
                        <Pill className="h-4 w-4" /> Emergency Medication
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {protocol.emergencyMedication}
                      </p>
                    </div>
                  </div>

                  {/* Recognise Symptoms */}
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1 text-amber-900">
                      <Zap className="h-4 w-4" /> Recognise the Symptoms
                    </h4>
                    <ul className="list-disc list-inside text-sm text-amber-900 space-y-1">
                      {protocol.recogniseSymptoms.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Step-by-step procedure */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">
                      Step-by-Step Procedure
                    </h4>
                    <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1.5 marker:font-semibold marker:text-foreground">
                      {protocol.stepByStepProcedure.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  {/* 999 / GP / Position */}
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="rounded-md border border-red-200 bg-red-50 p-3">
                      <h4 className="text-sm font-semibold mb-1 flex items-center gap-1 text-red-800">
                        <Phone className="h-4 w-4" /> When to Call 999
                      </h4>
                      <p className="text-sm text-red-800">{protocol.whenToCall999}</p>
                    </div>
                    <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                      <h4 className="text-sm font-semibold mb-1 flex items-center gap-1 text-blue-800">
                        <Stethoscope className="h-4 w-4" /> When to Call GP
                      </h4>
                      <p className="text-sm text-blue-800">{protocol.whenToCallGp}</p>
                    </div>
                    <div className="rounded-md border bg-muted/40 p-3">
                      <h4 className="text-sm font-semibold mb-1 flex items-center gap-1">
                        <Heart className="h-4 w-4" /> Position of Patient
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {protocol.positionOfPatient}
                      </p>
                    </div>
                  </div>

                  {/* Aftercare */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Aftercare</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {protocol.aftercare.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Medication Locations & Spare EpiPens */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-1 flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> Medication Locations
                      </h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {protocol.medicationLocations.map((loc, i) => (
                          <li key={i}>{loc}</li>
                        ))}
                      </ul>
                    </div>
                    {protocol.spareEpiPenLocations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-1 flex items-center gap-1">
                          <MapPin className="h-4 w-4" /> Spare EpiPen Locations
                        </h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          {protocol.spareEpiPenLocations.map((loc, i) => (
                            <li key={i}>{loc}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Staff trained / Child capability */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-1 flex items-center gap-1">
                        <Users className="h-4 w-4" /> Staff Trained to Administer
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {protocol.staffTrainedToAdminister
                          .map(getStaffName)
                          .join(", ")}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1">
                        Child&apos;s Awareness
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>
                          Can self-administer:{" "}
                          <strong>
                            {protocol.childCanSelfAdminister ? "Yes" : "No"}
                          </strong>
                        </li>
                        <li>
                          Recognises own symptoms:{" "}
                          <strong>
                            {protocol.childRecognisesSymptoms ? "Yes" : "No"}
                          </strong>
                        </li>
                        <li>
                          Informed of protocol:{" "}
                          <strong>{protocol.childInformed ? "Yes" : "No"}</strong>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* School / community provision */}
                  <div>
                    <h4 className="text-sm font-semibold mb-1">
                      School &amp; Community Provision
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {protocol.schoolAndCommunityProvision}
                    </p>
                  </div>

                  {/* Expiry schedule */}
                  <div>
                    <h4 className="text-sm font-semibold mb-1">
                      Expiry Check Schedule
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {protocol.expiryCheckSchedule}
                    </p>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>
                      <strong>Last Review:</strong> {protocol.lastReviewDate} (by{" "}
                      {getStaffName(protocol.reviewedBy)})
                    </span>
                    <span
                      className={cn(
                        reviewOverdue && "text-red-700 font-semibold"
                      )}
                    >
                      <strong>Next Review Due:</strong> {protocol.nextReviewDue}
                    </span>
                    <span>
                      <strong>GP Sign-off:</strong>{" "}
                      {protocol.signedOffByGP ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Regulatory Note ────────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">Regulatory Context</p>
        <p>
          Emergency medication protocols are required under Quality Standard 7
          (Health and wellbeing) and Regulation 23 of The Children&apos;s Homes
          (England) Regulations 2015. Each child with a condition requiring
          emergency response must have an individualised, GP-signed protocol
          identifying triggers, recognition criteria, step-by-step staff actions,
          999/GP escalation thresholds, medication storage, staff training and
          school/community provision. Protocols must be reviewed at least every 12
          months, after any incident, and on every placement transition. Care plan,
          health passport and risk assessment must reference the active protocol.
        </p>
      </div>
    </PageShell>
  );
}
