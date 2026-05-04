"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Accessibility,
  Heart,
  Home,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Activity,
  Car,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── types ───────────────────────────────────────────────────────────────────
interface MobilityPlan {
  id: string;
  youngPerson: string;
  planDate: string;
  primaryCondition: string;
  diagnosisYear?: string;
  mobilityStatus:
    | "Independently mobile"
    | "Mobile with aid"
    | "Wheelchair part-time"
    | "Wheelchair full-time"
    | "Bed-rest periods"
    | "Variable / fluctuating";
  mobilityAids: string[];
  energyEnvelope?:
    | "Pacing actively used"
    | "Some pacing"
    | "No pacing yet"
    | "Not applicable";
  painManagement: string[];
  accessibleRoomsAtHome: string[];
  homeAdaptations: string[];
  transportArrangements: string[];
  schoolAccessibilityPlan: boolean;
  examAccessArrangements: string[];
  externalSupport: { agency: string; role: string; frequency: string }[];
  identityFramingNotes: string;
  badgesEntitlements: string[];
  childVoice: string;
  staffObservation: string;
  flagsForReview: string[];
  reviewDate: string;
  keyWorker: string;
}

// ── seed data ───────────────────────────────────────────────────────────────
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: MobilityPlan[] = [
  {
    id: "mp-001",
    youngPerson: "yp_alex",
    planDate: d(-21),
    primaryCondition: "Boxing-related shoulder rehab + persistent post-trauma somatic pain",
    diagnosisYear: "2025",
    mobilityStatus: "Independently mobile",
    mobilityAids: [
      "Shoulder support brace (worn during PE and contact activity)",
      "Hot/cold compression pack kept in bedroom",
      "Resistance band kit (physio-prescribed) for daily mobility set",
    ],
    energyEnvelope: "Some pacing",
    painManagement: [
      "Paracetamol PRN (max 4 doses / 24h, on MAR)",
      "Ibuprofen gel topical to right shoulder twice daily",
      "Heat pack pre-bed — reduces overnight stiffness",
      "Daily 10-min physio mobility set (key worker prompts, not enforced)",
      "Pain diary on phone — Alex tracks 0-10 score morning and evening",
    ],
    accessibleRoomsAtHome: [
      "All ground floor rooms",
      "Bedroom (first floor — stairs manageable, slow descent in morning when stiff)",
      "Garden gym shed — equipment height adjusted for left-arm-led routine",
    ],
    homeAdaptations: [
      "Second handrail fitted to main staircase (right side descending)",
      "Bedroom desk chair replaced with lumbar-supportive model",
      "Reaching aid in bedroom for top wardrobe",
      "Shower seat available (not yet used — offered, Alex declined)",
    ],
    transportArrangements: [
      "Walks to school independently — 12 minute route",
      "Lift offered on flare days, no questions asked policy",
      "Bus pass funded — reserved for high-pain days",
    ],
    schoolAccessibilityPlan: true,
    examAccessArrangements: [
      "Rest breaks (5 min per 30 min)",
      "Use of laptop for extended writing",
      "Seat near aisle / exit",
    ],
    externalSupport: [
      { agency: "Royal Derby Hospital Physiotherapy", role: "MSK physiotherapist (Mr Adeyemi)", frequency: "Fortnightly" },
      { agency: "GP — Dr S. Patel", role: "Pain management review", frequency: "Every 8 weeks" },
      { agency: "CAMHS Trauma pathway", role: "Trauma-informed somatic work", frequency: "Weekly" },
    ],
    identityFramingNotes:
      "Alex does not identify as disabled and is unlikely to want disability framing in conversation. Plan exists to make sure the home accommodates Alex's pain — not to label Alex. Pain is real, sometimes trauma-linked, and managed through movement, rest and trust. Avoid medicalising language in front of Alex unless Alex uses it first.",
    badgesEntitlements: [
      "Not currently claiming DLA — under review with social worker",
      "Free prescriptions (in care)",
      "School exam access arrangements approved",
    ],
    childVoice:
      "I'm not disabled. I just have a dodgy shoulder and sometimes my whole body remembers stuff. The brace helps. The shed helps more.",
    staffObservation:
      "Alex's pain is most visible in the mornings and after contact with birth family. Movement and the gym shed are protective — restricting access on flare days has historically increased distress. Pacing is improving but Alex still pushes through pain to avoid feeling 'weak'. Keep offering, don't enforce.",
    flagsForReview: [
      "Shoulder MRI follow-up due — chase consultant letter",
      "Review whether DLA application is in Alex's interest (with social worker + advocate)",
    ],
    reviewDate: d(70),
    keyWorker: "staff_edward",
  },
  {
    id: "mp-002",
    youngPerson: "yp_incoming_sam",
    planDate: d(-3),
    primaryCondition: "Hypermobile Ehlers-Danlos Syndrome (hEDS) + dysautonomia + chronic fatigue",
    diagnosisYear: "2023",
    mobilityStatus: "Variable / fluctuating",
    mobilityAids: [
      "Manual wheelchair (self-propelled, used 30-60% of days)",
      "Folding mobility scooter for longer outings",
      "Forearm crutches for short ambulant distances",
      "Compression garments (calves and abdomen) for POTS",
      "Soft cervical collar for flare days",
      "Shower stool and grab rails",
    ],
    energyEnvelope: "Pacing actively used",
    painManagement: [
      "Amitriptyline 20mg nocte (prescribed)",
      "Naproxen PRN with omeprazole cover",
      "TENS machine — Sam manages independently",
      "Heat pads, weighted blanket, magnesium spray",
      "Joint-by-joint tracking on Bearable app — Sam shares weekly trend with key worker",
      "Crash recovery protocol — written by Sam, agreed with team",
    ],
    accessibleRoomsAtHome: [
      "Ground floor bedroom (provisional offer — building works completed)",
      "Wet room with grab rails and shower seat",
      "Kitchen — perching stool and lowered prep area",
      "Lounge — recliner with leg-elevation function",
    ],
    homeAdaptations: [
      "Ground floor bedroom converted from former office",
      "Wet room installed (LA grant-funded)",
      "Threshold ramps front and rear",
      "Door widened to bedroom (now 900mm)",
      "Stair lift NOT installed — Sam prefers ground floor as default",
      "Kitchen tap replaced with lever type",
    ],
    transportArrangements: [
      "Wheelchair-accessible vehicle in fleet (booked Mon/Wed/Fri default)",
      "Taxi account with WAV-equipped local firm for unplanned needs",
      "Train travel — Passenger Assist booked 24h ahead, Sam confident booking own",
      "Blue badge held — parking arrangement at school confirmed",
    ],
    schoolAccessibilityPlan: true,
    examAccessArrangements: [
      "Separate room",
      "Rest breaks (10 min per 60 min, stop-the-clock)",
      "Laptop with voice-to-text",
      "Permission to lie down during breaks",
      "Snack and drink permitted (POTS)",
    ],
    externalSupport: [
      { agency: "Sheffield Children's Hospital — EDS service", role: "Specialist consultant + clinical nurse specialist", frequency: "6-monthly" },
      { agency: "Community Physiotherapy", role: "Hypermobility-trained physio (Ms Reilly)", frequency: "Weekly" },
      { agency: "Community Occupational Therapy", role: "OT — home assessment and aids review", frequency: "Quarterly review" },
      { agency: "Cardiology — POTS clinic", role: "Cardiologist", frequency: "Annual" },
      { agency: "Pain Management Service (paediatric)", role: "Multi-disciplinary clinic", frequency: "Quarterly" },
    ],
    identityFramingNotes:
      "Sam identifies proudly as a disabled young person and uses social model language. The barrier is the environment, not Sam's body. Avoid language like 'wheelchair-bound' or 'suffers from' — Sam uses a wheelchair, and Sam lives with EDS. Sam is the expert on Sam's body. Staff role is to remove environmental barriers and trust pacing decisions, not to override them. Do not push through fatigue — crashes have a recovery cost of days, not hours.",
    badgesEntitlements: [
      "DLA — higher rate mobility, middle rate care",
      "Blue badge",
      "Disabled persons railcard",
      "CEA card (cinema carer free)",
      "Access to Work-equivalent for Year 12 work experience pending",
      "EHCP in place — Section F includes mobility, fatigue and pain",
    ],
    childVoice:
      "The chair gives me my life back. People act like it's sad but it means I get to do things. What's actually sad is when buildings forget I exist. Please don't decide for me when I'm 'too tired' — let me decide.",
    staffObservation:
      "Plan drafted with Sam, OT and incoming social worker ahead of placement start. Sam articulate, self-advocating, knows own needs. The home is now structurally accessible following adaptations. Staff team will need hypermobility / fatigue / POTS awareness training before admission — booked with EDS UK. Pacing must be respected: 'no' to an activity is a clinical decision, not behaviour.",
    flagsForReview: [
      "Confirm staff training completed before placement start",
      "Confirm WAV vehicle MOT and hoist service current",
      "Set up direct line to EDS specialist nurse for crash periods",
      "Review ground-floor bedroom soundproofing — Sam noise-sensitive on fatigue days",
    ],
    reviewDate: d(28),
    keyWorker: "staff_anna",
  },
];

// ── helpers ─────────────────────────────────────────────────────────────────
function statusColour(s: MobilityPlan["mobilityStatus"]): string {
  switch (s) {
    case "Independently mobile":
      return "bg-emerald-100 text-emerald-800";
    case "Mobile with aid":
      return "bg-sky-100 text-sky-800";
    case "Wheelchair part-time":
      return "bg-teal-100 text-teal-800";
    case "Wheelchair full-time":
      return "bg-cyan-100 text-cyan-800";
    case "Bed-rest periods":
      return "bg-purple-100 text-purple-800";
    case "Variable / fluctuating":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

// ── export columns ──────────────────────────────────────────────────────────
const exportCols: ExportColumn<MobilityPlan>[] = [
  { header: "Young Person", accessor: (r: MobilityPlan) => getYPName(r.youngPerson) || r.youngPerson },
  { header: "Plan Date", accessor: (r: MobilityPlan) => r.planDate },
  { header: "Primary Condition", accessor: (r: MobilityPlan) => r.primaryCondition },
  { header: "Diagnosed", accessor: (r: MobilityPlan) => r.diagnosisYear ?? "—" },
  { header: "Mobility Status", accessor: (r: MobilityPlan) => r.mobilityStatus },
  { header: "Mobility Aids", accessor: (r: MobilityPlan) => r.mobilityAids.join("; ") },
  { header: "Energy Envelope", accessor: (r: MobilityPlan) => r.energyEnvelope ?? "—" },
  { header: "Home Adaptations", accessor: (r: MobilityPlan) => r.homeAdaptations.join("; ") },
  { header: "School Accessibility Plan", accessor: (r: MobilityPlan) => (r.schoolAccessibilityPlan ? "Yes" : "No") },
  { header: "Badges & Entitlements", accessor: (r: MobilityPlan) => r.badgesEntitlements.join("; ") },
  { header: "Key Worker", accessor: (r: MobilityPlan) => getStaffName(r.keyWorker) || r.keyWorker },
  { header: "Review Date", accessor: (r: MobilityPlan) => r.reviewDate },
];

// ── component ───────────────────────────────────────────────────────────────
export default function ChildMobilityPhysicalDisabilityPlanPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("review");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (r) =>
          (getYPName(r.youngPerson) || r.youngPerson).toLowerCase().includes(q) ||
          r.primaryCondition.toLowerCase().includes(q) ||
          r.mobilityAids.some((a) => a.toLowerCase().includes(q))
      );
    }
    if (filterStatus !== "all") items = items.filter((r) => r.mobilityStatus === filterStatus);

    items.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (getYPName(a.youngPerson) || a.youngPerson).localeCompare(
            getYPName(b.youngPerson) || b.youngPerson
          );
        case "review":
          return a.reviewDate.localeCompare(b.reviewDate);
        case "status":
          return a.mobilityStatus.localeCompare(b.mobilityStatus);
        default:
          return 0;
      }
    });
    return items;
  }, [search, filterStatus, sortBy]);

  // ── stats ─────────────────────────────────────────────────────────────────
  const activePlans = data.length;
  const wheelchairUsers = data.filter(
    (r) => r.mobilityStatus === "Wheelchair part-time" || r.mobilityStatus === "Wheelchair full-time"
  ).length;
  const homeAdaptationsMade = data.reduce((sum, r) => sum + r.homeAdaptations.length, 0);
  const reviewsDue90 = data.filter((r) => r.reviewDate <= d(90)).length;

  return (
    <PageShell
      title="Mobility & Physical Disability Plans"
      subtitle="Per-child plans removing environmental barriers — social model framing, child-led, PT/OT linked"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="mobility-physical-disability-plans" />
          <PrintButton title="Mobility & Physical Disability Plans" />
        </div>
      }
    >
      {/* ── summary stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-sky-700">{activePlans}</p>
          <p className="text-xs text-muted-foreground">Active Plans</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-teal-700">{wheelchairUsers}</p>
          <p className="text-xs text-muted-foreground">Wheelchair Users</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-cyan-700">{homeAdaptationsMade}</p>
          <p className="text-xs text-muted-foreground">Home Adaptations Made</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{reviewsDue90}</p>
          <p className="text-xs text-muted-foreground">Reviews Due (90d)</p>
        </div>
      </div>

      {/* ── philosophy banner ──────────────────────────────────────────── */}
      <div className="rounded-lg bg-sky-50 border border-sky-200 p-3 mb-6 flex items-start gap-2">
        <Accessibility className="h-4 w-4 text-sky-700 mt-0.5 shrink-0" />
        <p className="text-sm text-sky-900">
          Social model of disability: the home is the thing that needs adapting, not the child. Plans are co-produced with each young person, their PT/OT, and (where relevant) specialist clinics. Pacing decisions are clinical, not behavioural. We do not push through fatigue, and we never make ability assumptions on a child's behalf.
        </p>
      </div>

      {/* ── filters/sort ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, condition, aid…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Mobility Statuses</SelectItem>
            <SelectItem value="Independently mobile">Independently mobile</SelectItem>
            <SelectItem value="Mobile with aid">Mobile with aid</SelectItem>
            <SelectItem value="Wheelchair part-time">Wheelchair part-time</SelectItem>
            <SelectItem value="Wheelchair full-time">Wheelchair full-time</SelectItem>
            <SelectItem value="Bed-rest periods">Bed-rest periods</SelectItem>
            <SelectItem value="Variable / fluctuating">Variable / fluctuating</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="review">By Review Date</SelectItem>
              <SelectItem value="name">By Child</SelectItem>
              <SelectItem value="status">By Mobility Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── plan cards ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No mobility plans match your filters.</div>
        )}
        {filtered.map((plan) => {
          const isExpanded = expandedId === plan.id;
          const ypLabel = getYPName(plan.youngPerson) || (plan.youngPerson === "yp_incoming_sam" ? "Sam (incoming placement template)" : plan.youngPerson);

          return (
            <div key={plan.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : plan.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Accessibility className="h-5 w-5 text-sky-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{ypLabel}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {plan.primaryCondition}
                      {plan.diagnosisYear ? ` · since ${plan.diagnosisYear}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3 flex-wrap justify-end">
                  <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium", statusColour(plan.mobilityStatus))}>
                    {plan.mobilityStatus}
                  </span>
                  {plan.schoolAccessibilityPlan && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-teal-100 text-teal-800">
                      School plan in place
                    </span>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {/* mobility aids */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <Activity className="h-3 w-3 inline mr-1" />Mobility Aids
                    </p>
                    <ul className="bg-white rounded-lg p-3 border text-sm space-y-1 list-disc list-inside">
                      {plan.mobilityAids.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>

                  {/* energy + pain side by side */}
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        <Heart className="h-3 w-3 inline mr-1" />Energy Envelope (Pacing)
                      </p>
                      <div className="bg-white rounded-lg p-3 border text-sm">
                        <p className="font-medium text-sky-800">{plan.energyEnvelope ?? "Not applicable"}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Chronic illness aware. Pacing is a clinical decision — staff support, never override.
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Pain Management
                      </p>
                      <ul className="bg-white rounded-lg p-3 border text-sm space-y-1 list-disc list-inside">
                        {plan.painManagement.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* home accessibility */}
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        <Home className="h-3 w-3 inline mr-1" />Accessible Rooms at Home
                      </p>
                      <ul className="bg-white rounded-lg p-3 border text-sm space-y-1 list-disc list-inside">
                        {plan.accessibleRoomsAtHome.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Home Adaptations Completed
                      </p>
                      <ul className="bg-white rounded-lg p-3 border text-sm space-y-1 list-disc list-inside">
                        {plan.homeAdaptations.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* school */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      School Accessibility & Exam Access
                    </p>
                    <div className="bg-white rounded-lg p-3 border text-sm">
                      <p className="mb-2">
                        <span className="font-medium">Accessibility plan in place: </span>
                        <span className={plan.schoolAccessibilityPlan ? "text-emerald-700" : "text-amber-700"}>
                          {plan.schoolAccessibilityPlan ? "Yes" : "Not yet — action required"}
                        </span>
                      </p>
                      {plan.examAccessArrangements.length > 0 && (
                        <>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Exam access arrangements:</p>
                          <ul className="space-y-1 list-disc list-inside">
                            {plan.examAccessArrangements.map((e, i) => (
                              <li key={i}>{e}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>

                  {/* transport */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <Car className="h-3 w-3 inline mr-1" />Transport Arrangements
                    </p>
                    <ul className="bg-white rounded-lg p-3 border text-sm space-y-1 list-disc list-inside">
                      {plan.transportArrangements.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  {/* external support */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      External Support (PT / OT / Consultant)
                    </p>
                    <div className="space-y-1.5">
                      {plan.externalSupport.map((s, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border flex items-start gap-3 text-sm">
                          <span className="font-medium text-sky-800 shrink-0 w-44 truncate">{s.agency}</span>
                          <span className="flex-1">{s.role}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-teal-100 text-teal-800 shrink-0">
                            {s.frequency}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* identity framing — highlighted */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Identity & Framing Notes
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
                      {plan.identityFramingNotes}
                    </div>
                  </div>

                  {/* badges/entitlements */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Badges & Entitlements (DLA / PIP / Blue Badge / Other)
                    </p>
                    <ul className="bg-white rounded-lg p-3 border text-sm space-y-1 list-disc list-inside">
                      {plan.badgesEntitlements.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>

                  {/* voices */}
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Child Voice
                      </p>
                      <div className="bg-white rounded-lg p-3 border text-sm italic text-slate-700">
                        &ldquo;{plan.childVoice}&rdquo;
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Staff Observation
                      </p>
                      <div className="bg-white rounded-lg p-3 border text-sm text-slate-700">
                        {plan.staffObservation}
                      </div>
                    </div>
                  </div>

                  {/* flags + meta */}
                  {plan.flagsForReview.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Flags for Review
                      </p>
                      <ul className="bg-white rounded-lg p-3 border text-sm space-y-1 list-disc list-inside">
                        {plan.flagsForReview.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground border-t pt-3">
                    <span>Plan dated {plan.planDate} · Key worker {getStaffName(plan.keyWorker) || plan.keyWorker}</span>
                    <span>Next review {plan.reviewDate}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory footer ──────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg bg-teal-50 border border-teal-200 p-3 text-xs text-teal-900 space-y-1">
        <p className="font-semibold">Regulatory framework</p>
        <p>
          Equality Act 2010 (disability) · Care Act 2014 (under-18 carers, transition) · SEND Code of Practice 2015 · Social model of disability (Oliver) · Children&rsquo;s Homes (England) Regulations 2015 — Quality Standards 6, 8 and 9 · NICE NG217 (Long Covid) and NG104 (chronic pain) where relevant · Disabled Children&rsquo;s Charter · UNCRC Articles 23, 24 and 31.
        </p>
      </div>
    </PageShell>
  );
}
