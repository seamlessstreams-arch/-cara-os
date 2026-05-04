"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
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
interface ConditionEntry {
  condition: string;
  diagnosed: string;
  severity: "mild" | "moderate" | "severe";
  currentManagement: string;
}

interface AllergyEntry {
  allergen: string;
  reaction: string;
  severity: "mild" | "moderate" | "severe" | "life_threatening";
  treatment: string;
}

interface RegularMedication {
  medication: string;
  dose: string;
  frequency: string;
  purpose: string;
  prescriber: string;
}

interface PractitionerDetails {
  name: string;
  practice: string;
  phone: string;
  address: string;
}

interface SpecialistContact {
  specialism: string;
  name: string;
  contact: string;
}

interface EmergencyProtocol {
  scenario: string;
  action: string;
}

interface HospitalAttendance {
  date: string;
  reason: string;
  outcome: string;
}

interface ScreeningEntry {
  screening: string;
  lastDone: string;
  dueNext: string;
}

interface ImmunisationEntry {
  vaccine: string;
  given: string;
  dueNext: string | null;
}

interface HealthcarePlan {
  id: string;
  youngPerson: string;
  conditions: ConditionEntry[];
  allergies: AllergyEntry[];
  regularMedications: RegularMedication[];
  prnMedications: string[];
  gpDetails: PractitionerDetails;
  dentistDetails: PractitionerDetails;
  opticianDetails: PractitionerDetails;
  specialistContacts: SpecialistContact[];
  emergencyProtocols: EmergencyProtocol[];
  recentHospitalAttendances: HospitalAttendance[];
  screeningSchedule: ScreeningEntry[];
  immunisations: ImmunisationEntry[];
  reviewedBy: string;
  reviewedDate: string;
  nextReviewDate: string;
  signedOffByGP: boolean;
  childInformedOfPlan: boolean;
}

/* ─── seed data ─── */
const PLANS: HealthcarePlan[] = [
  {
    id: "hcp_001",
    youngPerson: "yp_alex",
    conditions: [
      {
        condition: "Attention Deficit Hyperactivity Disorder (ADHD) — combined presentation",
        diagnosed: "2020-09-12",
        severity: "moderate",
        currentManagement:
          "Stimulant medication (Methylphenidate XL) reviewed 6-monthly by community paediatrician. Behavioural strategies — visual timetable, regular movement breaks at school, structured homework routine. Sleep hygiene plan in place to mitigate medication-related settling difficulties.",
      },
      {
        condition: "Mild eczema (flexural)",
        diagnosed: "2018-03-05",
        severity: "mild",
        currentManagement:
          "Daily emollient (Diprobase) morning and after bath. Hydrocortisone 1% cream for flare-ups (max 7 days continuous use). Cotton clothing, non-biological detergent, lukewarm baths.",
      },
    ],
    allergies: [
      {
        allergen: "Penicillin",
        reaction: "Generalised urticaria and facial swelling within 30 minutes of dose (age 6)",
        severity: "severe",
        treatment:
          "AVOID all penicillin-based antibiotics (amoxicillin, flucloxacillin, co-amoxiclav). Alert flag on GP and pharmacy records. If accidental exposure: oral chlorphenamine, monitor airway, call 999 if any breathing difficulty.",
      },
    ],
    regularMedications: [
      {
        medication: "Methylphenidate (Concerta XL)",
        dose: "36mg",
        frequency: "Once daily — 07:30 with breakfast",
        purpose: "ADHD symptom management",
        prescriber: "Dr H. Khan, Community Paediatrics",
      },
      {
        medication: "Diprobase emollient",
        dose: "Apply liberally",
        frequency: "Twice daily — morning and after evening bath",
        purpose: "Eczema maintenance",
        prescriber: "Dr M. Patel, Eastbrook Medical Practice (GP)",
      },
    ],
    prnMedications: [
      "Hydrocortisone 1% cream — eczema flare-ups (max 7 days, then review)",
      "Paracetamol 500mg — pain or fever (max 4 doses in 24h)",
      "Chlorphenamine 4mg — known allergic reaction (single dose, then review)",
    ],
    gpDetails: {
      name: "Dr M. Patel",
      practice: "Eastbrook Medical Practice",
      phone: "01234 567890",
      address: "42 High Street, Eastbrook",
    },
    dentistDetails: {
      name: "Mr R. Johnson",
      practice: "Bright Smiles Dental",
      phone: "01234 678901",
      address: "15 Park Road, Eastbrook",
    },
    opticianDetails: {
      name: "Specsavers Eastbrook",
      practice: "Specsavers",
      phone: "01234 789012",
      address: "12 Market Street, Eastbrook",
    },
    specialistContacts: [
      {
        specialism: "Community Paediatrics (ADHD)",
        name: "Dr H. Khan",
        contact: "01234 555101",
      },
      {
        specialism: "ADHD specialist nurse",
        name: "Nurse J. Allen",
        contact: "01234 555102",
      },
    ],
    emergencyProtocols: [
      {
        scenario: "Suspected allergic reaction (any cause)",
        action:
          "Stop suspected trigger. Administer chlorphenamine if mild. Call 999 immediately for any swelling of face/lips/tongue, breathing difficulty, dizziness, or rash with vomiting. State 'penicillin allergy' to all responders.",
      },
      {
        scenario: "Missed Methylphenidate dose",
        action:
          "If before 12:00 — administer dose. If after 12:00 — DO NOT give (causes insomnia). Document on MAR sheet. Inform on-call manager. Expect increased restlessness/impulsivity that day; adjust expectations and provide structured activities.",
      },
    ],
    recentHospitalAttendances: [
      {
        date: d(-220),
        reason: "A&E — minor head injury after playground fall at school",
        outcome: "Discharged after observation. CT not required. No concerns at follow-up.",
      },
    ],
    screeningSchedule: [
      { screening: "Annual LAC health assessment", lastDone: d(-90), dueNext: d(275) },
      { screening: "Height/weight monitoring (Methylphenidate)", lastDone: d(-30), dueNext: d(60) },
      { screening: "Cardiovascular check (Methylphenidate)", lastDone: d(-180), dueNext: d(185) },
    ],
    immunisations: [
      { vaccine: "MMR (2 doses)", given: "2017-04-10", dueNext: null },
      { vaccine: "HPV (2 doses)", given: "2024-06-12", dueNext: null },
      { vaccine: "Annual flu vaccine", given: d(-200), dueNext: d(165) },
    ],
    reviewedBy: "staff_anna",
    reviewedDate: d(-21),
    nextReviewDate: d(15),
    signedOffByGP: true,
    childInformedOfPlan: true,
  },
  {
    id: "hcp_002",
    youngPerson: "yp_jordan",
    conditions: [
      {
        condition: "Asthma — moderate persistent",
        diagnosed: "2019-11-22",
        severity: "moderate",
        currentManagement:
          "Personal Asthma Action Plan (PAAP) on bedroom wall and in school file. Daily preventer (Clenil Modulite) plus reliever (Salbutamol) PRN. Peak flow monitored weekly (best 320 L/min). Annual asthma review with practice nurse. Triggers: cold air, viral URTIs, dust mites, exercise without warm-up.",
      },
      {
        condition: "Allergic rhinitis (seasonal — grass pollen)",
        diagnosed: "2021-05-14",
        severity: "mild",
        currentManagement:
          "Cetirizine daily through pollen season (April–August). Symptoms increase risk of asthma exacerbation — monitor closely.",
      },
    ],
    allergies: [
      {
        allergen: "Peanuts and tree nuts",
        reaction:
          "Anaphylaxis — facial swelling, urticaria, wheeze and one previous episode of throat tightness (age 9, hospitalised overnight).",
        severity: "life_threatening",
        treatment:
          "STRICT AVOIDANCE. Carry 2 x EpiPen Junior 0.15mg at all times — bedroom locked drawer (spare), school office, day bag. If reaction: lay flat, administer EpiPen into outer thigh, call 999, second pen after 5 minutes if no improvement. All staff trained in anaphylaxis (annual refresher). Allergen-free kitchen protocol — see kitchen risk assessment.",
      },
      {
        allergen: "Grass pollen",
        reaction: "Sneezing, itchy eyes, exacerbation of asthma symptoms",
        severity: "moderate",
        treatment:
          "Cetirizine 10mg daily April–August. Avoid mowed grass when count high. Shower after outdoor PE. Increased reliever use expected — peak flow daily during high-count weeks.",
      },
    ],
    regularMedications: [
      {
        medication: "Beclometasone (Clenil Modulite) inhaler",
        dose: "100mcg, 2 puffs",
        frequency: "Twice daily (08:00 and 20:00) via spacer",
        purpose: "Asthma — preventer",
        prescriber: "Dr M. Patel, Eastbrook Medical Practice (GP)",
      },
      {
        medication: "Cetirizine",
        dose: "10mg",
        frequency: "Once daily (April–August only)",
        purpose: "Seasonal allergic rhinitis",
        prescriber: "Dr M. Patel, Eastbrook Medical Practice (GP)",
      },
    ],
    prnMedications: [
      "Salbutamol (Ventolin) inhaler 100mcg — 2–10 puffs via spacer for asthma symptoms (follow PAAP)",
      "EpiPen Junior 0.15mg — anaphylaxis (then 999)",
      "Paracetamol 500mg — pain or fever (max 4 in 24h)",
      "Ibuprofen 200mg — pain (avoid during asthma flare-up)",
    ],
    gpDetails: {
      name: "Dr M. Patel",
      practice: "Eastbrook Medical Practice",
      phone: "01234 567890",
      address: "42 High Street, Eastbrook",
    },
    dentistDetails: {
      name: "Mr R. Johnson",
      practice: "Bright Smiles Dental",
      phone: "01234 678901",
      address: "15 Park Road, Eastbrook",
    },
    opticianDetails: {
      name: "Boots Opticians",
      practice: "Boots",
      phone: "01234 779988",
      address: "8 Market Street, Eastbrook",
    },
    specialistContacts: [
      {
        specialism: "Practice asthma nurse",
        name: "Nurse S. Williams",
        contact: "01234 567891",
      },
      {
        specialism: "Paediatric allergy clinic",
        name: "Dr E. Chowdhury",
        contact: "0114 226 0000 (RHH)",
      },
    ],
    emergencyProtocols: [
      {
        scenario: "Anaphylaxis (suspected nut exposure)",
        action:
          "Lay Jordan flat, raise legs (or sit up if breathing easier upright). Administer EpiPen to outer thigh through clothing if needed — note time. Call 999 — say 'anaphylaxis, child'. Second EpiPen after 5 min if no improvement. Keep used pen for ambulance crew. Stay with Jordan — do not leave alone. Contact RM and on-call.",
      },
      {
        scenario: "Asthma attack (PAAP red zone)",
        action:
          "Sit Jordan upright — do NOT lay down. 1 puff of Salbutamol every 30–60 seconds via spacer, up to 10 puffs. If no improvement, breathing very fast, lips blue, or unable to speak full sentences — call 999. Continue Salbutamol while waiting. Document peak flow if able.",
      },
      {
        scenario: "Lost or expired EpiPen",
        action:
          "Jordan must NOT be unsupervised or attend school until replacement obtained. Contact GP same day for emergency prescription. Pharmacy on-call: 01234 999111. Document incident.",
      },
    ],
    recentHospitalAttendances: [
      {
        date: d(-45),
        reason: "A&E — asthma exacerbation triggered by URTI",
        outcome:
          "Salbutamol nebuliser, oral prednisolone 5-day course completed. Discharged same day. Asthma review brought forward — preventer dose unchanged but technique reviewed.",
      },
      {
        date: d(-410),
        reason: "Overnight admission — anaphylaxis (cross-contamination at restaurant, age 9)",
        outcome:
          "Treated with adrenaline, IV fluids, observation. Discharged after 18 hours with new EpiPens. Allergy clinic referral led to current management plan.",
      },
    ],
    screeningSchedule: [
      { screening: "Annual asthma review (practice nurse)", lastDone: d(-40), dueNext: d(325) },
      { screening: "Annual LAC health assessment", lastDone: d(-60), dueNext: d(305) },
      { screening: "Allergy clinic review", lastDone: d(-300), dueNext: d(65) },
    ],
    immunisations: [
      { vaccine: "MMR (2 doses)", given: "2016-08-04", dueNext: null },
      { vaccine: "HPV (1st dose)", given: d(-95), dueNext: d(275) },
      { vaccine: "Annual flu vaccine (LAIV)", given: d(-150), dueNext: d(215) },
    ],
    reviewedBy: "staff_darren",
    reviewedDate: d(-12),
    nextReviewDate: d(20),
    signedOffByGP: true,
    childInformedOfPlan: true,
  },
  {
    id: "hcp_003",
    youngPerson: "yp_casey",
    conditions: [
      {
        condition: "Autism Spectrum Disorder (ASD) with sensory processing differences",
        diagnosed: "2017-02-18",
        severity: "moderate",
        currentManagement:
          "EHCP in place. Sensory profile (OT-led) directs daily routine. Predictable structure with visual supports (Now-and-Next, social stories). Sensory toolkit accessible (weighted blanket, ear defenders, fidgets, chew tube). De-escalation protocol followed during sensory overload — see behaviour support plan.",
      },
      {
        condition: "Avoidant/Restrictive Food Intake Disorder (ARFID) — under assessment",
        diagnosed: "2024-11-04",
        severity: "moderate",
        currentManagement:
          "Specialist dietitian input. Restricted diet but nutritionally monitored — 6-monthly bloods (B12, ferritin, vitamin D). Multivitamin supplement daily. Food repertoire being slowly expanded with SALT/OT support. NEVER force foods.",
      },
      {
        condition: "Anxiety (generalised) — co-occurring with ASD",
        diagnosed: "2022-06-30",
        severity: "moderate",
        currentManagement:
          "CAMHS-led. CBT adapted for ASD weekly. Sertraline trial commenced 8 weeks ago — early signs of benefit, no side effects reported. Anxiety triggers logged in pattern tracker.",
      },
      {
        condition: "Constipation (chronic, related to ARFID/restricted fluids)",
        diagnosed: "2023-08-15",
        severity: "mild",
        currentManagement:
          "Daily Movicol (paediatric). Bowel chart maintained. Fluid intake encouraged using preferred cup. Review with GP if no bowel motion >3 days.",
      },
    ],
    allergies: [
      {
        allergen: "Latex",
        reaction: "Contact dermatitis — redness, itch, localised swelling within 1 hour",
        severity: "moderate",
        treatment:
          "Use non-latex (nitrile) gloves for all first aid, medication administration, and any clinical contact. Inform A&E/dental/GP of latex allergy at every appointment. Wash exposed skin, apply hydrocortisone 1% if rash develops, antihistamine if widespread.",
      },
      {
        allergen: "Plasters with adhesive (suspected colophony)",
        reaction: "Localised rash under plaster",
        severity: "mild",
        treatment: "Use hypoallergenic dressings (Mepore) only. Avoid standard fabric plasters.",
      },
    ],
    regularMedications: [
      {
        medication: "Sertraline",
        dose: "25mg",
        frequency: "Once daily (08:00 with breakfast)",
        purpose: "Anxiety (CAMHS-prescribed, week 8 of titration)",
        prescriber: "Dr K. Rahman, CAMHS",
      },
      {
        medication: "Melatonin (Slenyto)",
        dose: "2mg",
        frequency: "Once daily (21:00, 30 min before bed)",
        purpose: "Sleep onset (ASD-related)",
        prescriber: "Dr K. Rahman, CAMHS",
      },
      {
        medication: "Movicol Paediatric",
        dose: "1 sachet",
        frequency: "Once daily — morning, dissolved in preferred drink",
        purpose: "Chronic constipation",
        prescriber: "Dr M. Patel, GP",
      },
      {
        medication: "Forceval Junior multivitamin",
        dose: "1 capsule",
        frequency: "Once daily with food",
        purpose: "Nutritional support (ARFID)",
        prescriber: "Dietitian — community nutrition team",
      },
    ],
    prnMedications: [
      "Paracetamol 500mg — pain or fever (max 4 in 24h)",
      "Hydrocortisone 1% cream — latex/contact dermatitis flare",
      "Cetirizine 10mg — antihistamine if needed for allergy reaction",
    ],
    gpDetails: {
      name: "Dr M. Patel",
      practice: "Eastbrook Medical Practice",
      phone: "01234 567890",
      address: "42 High Street, Eastbrook",
    },
    dentistDetails: {
      name: "Mr R. Johnson",
      practice: "Bright Smiles Dental (ASD-friendly)",
      phone: "01234 678901",
      address: "15 Park Road, Eastbrook",
    },
    opticianDetails: {
      name: "Specsavers Eastbrook",
      practice: "Specsavers",
      phone: "01234 789012",
      address: "12 Market Street, Eastbrook",
    },
    specialistContacts: [
      { specialism: "CAMHS lead clinician", name: "Dr K. Rahman", contact: "01234 456789" },
      { specialism: "Occupational Therapy (sensory)", name: "Ms L. Bridges", contact: "01234 567456" },
      { specialism: "Speech & Language Therapy", name: "Ms F. Carter", contact: "01234 567123" },
      { specialism: "Community dietitian (ARFID)", name: "Ms P. Owusu", contact: "01234 444321" },
      { specialism: "CAMHS Crisis line (24h)", name: "Crisis team", contact: "01234 456000" },
    ],
    emergencyProtocols: [
      {
        scenario: "Sensory overload / meltdown",
        action:
          "Reduce sensory input — dim lights, lower noise, clear immediate area. Do NOT touch unless safety requires. Use minimal language ('You're safe. I'm here.'). Offer ear defenders and weighted blanket. Allow space; stay nearby. Do not attempt to reason or redirect during meltdown. After: quiet recovery time, preferred activity, document in pattern tracker.",
      },
      {
        scenario: "Refusal of food/fluid >24h or weight drop >2%",
        action:
          "Document accurately. Contact dietitian same day. Offer preferred safe foods only. Do NOT pressure or bargain. Consider bloods if pattern continues 48h. Inform RM and SW.",
      },
      {
        scenario: "Sertraline side effects (any new symptoms)",
        action:
          "Watch for increased agitation, restlessness, suicidal thoughts (common in first weeks of SSRI). DO NOT stop abruptly. Contact CAMHS same day for any concerning change. If acute risk — CAMHS Crisis line; if immediate danger — 999 / A&E.",
      },
    ],
    recentHospitalAttendances: [
      {
        date: d(-9),
        reason: "Routine bloods at children's outpatients (B12, ferritin, vitamin D, full blood count)",
        outcome:
          "Bloods taken with desensitisation plan and OT in attendance. Casey coped well. Results pending — GP to action.",
      },
      {
        date: d(-130),
        reason: "Dental appointment under conscious sedation (sensory needs)",
        outcome: "Two fillings completed. No complications. Routine follow-up in 6 months.",
      },
    ],
    screeningSchedule: [
      { screening: "Nutritional bloods (ARFID monitoring)", lastDone: d(-9), dueNext: d(170) },
      { screening: "Annual LAC health assessment", lastDone: d(-45), dueNext: d(320) },
      { screening: "CAMHS medication review (Sertraline)", lastDone: d(-14), dueNext: d(14) },
      { screening: "Dental review (ASD-friendly clinic)", lastDone: d(-130), dueNext: d(50) },
    ],
    immunisations: [
      { vaccine: "MMR (2 doses)", given: "2015-09-21", dueNext: null },
      { vaccine: "HPV (declined — capacity assessed)", given: "Refused", dueNext: null },
      { vaccine: "Annual flu vaccine (intranasal — sensory)", given: d(-180), dueNext: d(185) },
    ],
    reviewedBy: "staff_anna",
    reviewedDate: d(-7),
    nextReviewDate: d(83),
    signedOffByGP: true,
    childInformedOfPlan: true,
  },
];

/* ─── export columns ─── */
const exportCols: ExportColumn<HealthcarePlan>[] = [
  { header: "Young Person", accessor: (r: HealthcarePlan) => getYPName(r.youngPerson) },
  { header: "Conditions", accessor: (r: HealthcarePlan) => r.conditions.map((c) => c.condition).join("; ") },
  { header: "Allergies", accessor: (r: HealthcarePlan) => r.allergies.map((a) => `${a.allergen} (${a.severity})`).join("; ") },
  { header: "Regular Meds", accessor: (r: HealthcarePlan) => r.regularMedications.map((m) => `${m.medication} ${m.dose}`).join("; ") },
  { header: "GP", accessor: (r: HealthcarePlan) => `${r.gpDetails.name} — ${r.gpDetails.practice}` },
  { header: "Reviewed By", accessor: (r: HealthcarePlan) => getStaffName(r.reviewedBy) },
  { header: "Reviewed Date", accessor: (r: HealthcarePlan) => r.reviewedDate },
  { header: "Next Review", accessor: (r: HealthcarePlan) => r.nextReviewDate },
  { header: "Signed Off By GP", accessor: (r: HealthcarePlan) => (r.signedOffByGP ? "Yes" : "No") },
  { header: "Child Informed", accessor: (r: HealthcarePlan) => (r.childInformedOfPlan ? "Yes" : "No") },
];

/* ─── severity helpers ─── */
const SEVERITY_META: Record<string, { label: string; color: string }> = {
  mild: { label: "Mild", color: "bg-green-100 text-green-800" },
  moderate: { label: "Moderate", color: "bg-amber-100 text-amber-800" },
  severe: { label: "Severe", color: "bg-orange-100 text-orange-800" },
  life_threatening: { label: "Life-threatening", color: "bg-red-100 text-red-800" },
};

/* ─── component ─── */
export default function HealthcarePlansPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("review_due");

  const sorted = useMemo(() => {
    const list = [...PLANS];
    list.sort((a, b) => {
      switch (sortBy) {
        case "review_due":
          return a.nextReviewDate.localeCompare(b.nextReviewDate);
        case "name":
          return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
        case "conditions":
          return b.conditions.length - a.conditions.length;
        case "meds":
          return b.regularMedications.length - a.regularMedications.length;
        case "allergy_severity": {
          const score = (p: HealthcarePlan) =>
            p.allergies.reduce((s, a) => {
              const v = { mild: 1, moderate: 2, severe: 3, life_threatening: 4 }[a.severity];
              return Math.max(s, v);
            }, 0);
          return score(b) - score(a);
        }
        default:
          return 0;
      }
    });
    return list;
  }, [sortBy]);

  const stats = useMemo(() => {
    const total = PLANS.length;
    const allergiesCritical = PLANS.reduce(
      (s, p) =>
        s + p.allergies.filter((a) => a.severity === "severe" || a.severity === "life_threatening").length,
      0,
    );
    const regularMeds = PLANS.reduce((s, p) => s + p.regularMedications.length, 0);
    const today = new Date();
    const reviewsDue = PLANS.filter((p) => {
      const next = new Date(p.nextReviewDate);
      const diff = (next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 30;
    }).length;
    return { total, allergiesCritical, regularMeds, reviewsDue };
  }, []);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const criticalAllergyChildren = PLANS.filter((p) =>
    p.allergies.some((a) => a.severity === "severe" || a.severity === "life_threatening"),
  );

  return (
    <PageShell
      title="Healthcare Plans"
      subtitle="Individual healthcare plans · medical conditions, allergies, medications and protocols (Quality Standard 7 · Reg 23)"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={PLANS} columns={exportCols} filename="healthcare-plans" />
          <PrintButton title="Healthcare Plans" />
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
              <p className="text-2xl font-bold text-red-700">{stats.allergiesCritical}</p>
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
              <p className="text-2xl font-bold text-amber-700">{stats.reviewsDue}</p>
              <p className="text-xs text-muted-foreground">Reviews Due ≤ 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* ─── critical allergy alert ─── */}
        {criticalAllergyChildren.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-800">Critical Allergies — Immediate Action Required</p>
              <p className="text-red-700">
                {criticalAllergyChildren
                  .map(
                    (p) =>
                      `${getYPName(p.youngPerson)}: ${p.allergies
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
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <CalendarClock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">Healthcare Plan Reviews Due</p>
              <p className="text-amber-700">
                {PLANS.filter((p) => {
                  const next = new Date(p.nextReviewDate);
                  const diff = (next.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
                  return diff <= 30;
                })
                  .map((p) => `${getYPName(p.youngPerson)} (due ${p.nextReviewDate})`)
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
              (new Date(plan.nextReviewDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) <= 30;

            return (
              <Card
                key={plan.id}
                className={cn(
                  "border-l-4",
                  hasCriticalAllergy
                    ? "border-l-red-500"
                    : reviewSoon
                      ? "border-l-amber-400"
                      : "border-l-green-400",
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
                        {getYPName(plan.youngPerson)}
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          {plan.conditions.length} condition{plan.conditions.length === 1 ? "" : "s"}
                        </Badge>
                        {plan.allergies.length > 0 && (
                          <Badge
                            variant="outline"
                            className={cn(
                              hasCriticalAllergy
                                ? "bg-red-100 text-red-800"
                                : "bg-orange-100 text-orange-800",
                            )}
                          >
                            {plan.allergies.length} allerg{plan.allergies.length === 1 ? "y" : "ies"}
                          </Badge>
                        )}
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          {plan.regularMedications.length} regular med
                          {plan.regularMedications.length === 1 ? "" : "s"}
                        </Badge>
                        {plan.signedOffByGP ? (
                          <Badge variant="outline" className="bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> GP signed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800">
                            <XCircle className="h-3 w-3 mr-1" /> Awaiting GP
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Reviewed {plan.reviewedDate} by {getStaffName(plan.reviewedBy)} · Next review{" "}
                        {plan.nextReviewDate} · GP: {plan.gpDetails.name} ({plan.gpDetails.practice})
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
                            <p className="text-muted-foreground mt-1">{c.currentManagement}</p>
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
                        <p className="text-xs text-green-700">No known allergies (NKA).</p>
                      ) : (
                        <div className="space-y-1">
                          {plan.allergies.map((a, i) => (
                            <div
                              key={i}
                              className={cn(
                                "rounded p-2 text-xs border",
                                a.severity === "severe" || a.severity === "life_threatening"
                                  ? "bg-red-50 border-red-200"
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
                      {plan.regularMedications.length === 0 ? (
                        <p className="text-xs text-muted-foreground">None.</p>
                      ) : (
                        <div className="space-y-1">
                          {plan.regularMedications.map((m, i) => (
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
                    {plan.prnMedications.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <Pill className="h-4 w-4 text-amber-600" /> PRN Medications
                        </p>
                        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                          {plan.prnMedications.map((p, i) => (
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
                        <p>{plan.gpDetails.name}</p>
                        <p className="text-muted-foreground">{plan.gpDetails.practice}</p>
                        <p className="text-muted-foreground">{plan.gpDetails.phone}</p>
                        <p className="text-muted-foreground">{plan.gpDetails.address}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-xs">
                        <p className="font-medium flex items-center gap-1">
                          <Stethoscope className="h-3.5 w-3.5 text-green-600" /> Dentist
                        </p>
                        <p>{plan.dentistDetails.name}</p>
                        <p className="text-muted-foreground">{plan.dentistDetails.practice}</p>
                        <p className="text-muted-foreground">{plan.dentistDetails.phone}</p>
                        <p className="text-muted-foreground">{plan.dentistDetails.address}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-xs">
                        <p className="font-medium flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5 text-purple-600" /> Optician
                        </p>
                        <p>{plan.opticianDetails.name}</p>
                        <p className="text-muted-foreground">{plan.opticianDetails.practice}</p>
                        <p className="text-muted-foreground">{plan.opticianDetails.phone}</p>
                        <p className="text-muted-foreground">{plan.opticianDetails.address}</p>
                      </div>
                    </div>

                    {/* specialists */}
                    {plan.specialistContacts.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <Phone className="h-4 w-4 text-blue-600" /> Specialist Contacts
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                          {plan.specialistContacts.map((s, i) => (
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
                      <p className="font-medium mb-1 flex items-center gap-1 text-red-700">
                        <AlertTriangle className="h-4 w-4" /> Emergency Protocols
                      </p>
                      <div className="space-y-1">
                        {plan.emergencyProtocols.map((p, i) => (
                          <div
                            key={i}
                            className="bg-red-50 border border-red-200 rounded p-2 text-xs"
                          >
                            <p className="font-medium text-red-800 mb-0.5">{p.scenario}</p>
                            <p className="text-red-700">{p.action}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* hospital attendances */}
                    {plan.recentHospitalAttendances.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <ClipboardList className="h-4 w-4 text-amber-600" /> Recent Hospital Attendances
                        </p>
                        <div className="space-y-1">
                          {plan.recentHospitalAttendances.map((h, i) => (
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
                          {plan.screeningSchedule.map((s, i) => (
                            <div key={i} className="bg-muted/40 rounded p-2 text-xs">
                              <p className="font-medium">{s.screening}</p>
                              <p className="text-muted-foreground">
                                Last: {s.lastDone} · Due next: {s.dueNext}
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
                                {im.dueNext ? ` · Due next: ${im.dueNext}` : ""}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* sign off footer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t">
                      <div className="flex items-center gap-2 text-xs">
                        {plan.signedOffByGP ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-amber-600" />
                        )}
                        <span>
                          {plan.signedOffByGP
                            ? "Plan signed off by GP."
                            : "GP sign-off outstanding — chase practice."}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {plan.childInformedOfPlan ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-amber-600" />
                        )}
                        <span>
                          {plan.childInformedOfPlan
                            ? "Child has been informed of (and contributed to) the plan."
                            : "Child not yet informed — schedule key-working session."}
                        </span>
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
    </PageShell>
  );
}
