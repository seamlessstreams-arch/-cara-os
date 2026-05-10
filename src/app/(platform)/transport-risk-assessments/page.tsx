"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Car,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Users,
  Repeat,
  Phone,
  Wrench,
  Eye,
  CalendarClock,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

type JourneyType =
  | "Routine recurring"
  | "School run"
  | "Activity"
  | "Appointment"
  | "Family contact"
  | "Holiday/trip"
  | "Emergency";

type RiskLevel = "Low" | "Medium" | "High";

interface Hazard {
  hazard: string;
  severity: RiskLevel;
  control: string;
}

interface TransportRA {
  id: string;
  journeyTitle: string;
  journeyType: JourneyType;
  youngPeople: string[];
  staffDriver: string;
  passengers: number;
  vehicle: string;
  routeDescription: string;
  expectedDurationMins: number;
  recurringFrequency?: string;
  hazards: Hazard[];
  childSpecificConsiderations: Record<string, string>;
  behaviourRiskRating: RiskLevel;
  behaviourMitigations: string[];
  missingFromCareRisk: RiskLevel;
  missingMitigations: string[];
  specificRisksByRoute: string[];
  emergencyProcedure: string;
  breakdownProcedure: string;
  lastReviewedDate: string;
  reviewedBy: string;
  nextReviewDate: string;
  signedOffByRM: boolean;
  inUseStatus: boolean;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: TransportRA[] = [
  {
    id: "tra-001",
    journeyTitle: "Casey — daily school run to Brookfield Specialist Provision",
    journeyType: "School run",
    youngPeople: ["yp_casey"],
    staffDriver: "staff_anna",
    passengers: 1,
    vehicle: "Home pool car (Ford Tourneo, reg OK69 LRT)",
    routeDescription: "Oak House → A580 → Brookfield Lane → Brookfield Specialist Provision (school car park, gate B for low-stim arrival)",
    expectedDurationMins: 22,
    recurringFrequency: "Twice daily, term-time (Mon–Fri)",
    hazards: [
      {
        hazard: "Sensory overload during school drop-off congestion",
        severity: "Medium",
        control: "Use gate B (quieter) — pre-arranged with school. Casey wears noise-reducing headphones for last 3 minutes of journey. Calm playlist on low volume from the M6 junction onwards.",
      },
      {
        hazard: "Traffic delay triggering anxiety/route rigidity",
        severity: "Medium",
        control: "Casey informed of any deviation in advance using social-story phrasing. Same staff member drives wherever possible (Anna primary, Lackson backup). Visual timer on dashboard so Casey can track journey progress.",
      },
      {
        hazard: "Standard road traffic risks",
        severity: "Low",
        control: "Driver fully licensed, vehicle MOT current, daily walk-around check, child in approved booster seat in rear nearside.",
      },
    ],
    childSpecificConsiderations: {
      yp_casey:
        "ASD — needs predictability of route, driver, and seat. Sensory bag travels in footwell. Gate B arrival is non-negotiable. Will mask distress in car then dysregulate at school threshold if not supported. Anna's voice and presence are the established regulating cues.",
    },
    behaviourRiskRating: "Low",
    behaviourMitigations: [
      "Same driver, same seat, same route — high consistency",
      "No sudden conversation; Anna leads with predictable script",
      "Casey's preferred audio (instrumental) approved playlist only",
      "If meltdown: pull over safely, do not engage, allow Casey time, follow ASD de-escalation plan",
    ],
    missingFromCareRisk: "Low",
    missingMitigations: [
      "Door locks engaged child-safe",
      "School signs Casey in directly to staff at gate B (no walk-in alone)",
      "Casey has never absconded from vehicle — historic baseline low",
    ],
    specificRisksByRoute: [
      "A580 morning congestion can extend duration by 8–12 minutes — leave 15 minutes earlier on Mondays/Fridays",
      "Brookfield Lane has roadworks scheduled (signage updated weekly — check noticeboard)",
      "School pickup gate B closes 15:35 sharp — late arrival means main gate which is high-stim",
    ],
    emergencyProcedure:
      "RTC: stop safely, 999 if injury, contact RM. Medical: pull over, call 999/111 as appropriate. Behavioural: do not engage during travel, find safe layby, call RM if escalating. Always notify school if delayed beyond 10 minutes.",
    breakdownProcedure:
      "AA cover (membership 8821-447). Casey has tolerated short waits in vehicle previously. If wait > 20 mins, call RM/Lackson for second vehicle pickup. School informed immediately.",
    lastReviewedDate: d(-30),
    reviewedBy: "staff_darren",
    nextReviewDate: d(60),
    signedOffByRM: true,
    inUseStatus: true,
  },
  {
    id: "tra-002",
    journeyTitle: "Alex — Tuesday/Thursday boxing club transport",
    journeyType: "Routine recurring",
    youngPeople: ["yp_alex"],
    staffDriver: "staff_lackson",
    passengers: 1,
    vehicle: "Home pool car (Ford Tourneo, reg OK69 LRT)",
    routeDescription: "Oak House → Manchester Road → Salford Sports Centre (Mahogany Boxing Club, side entrance)",
    expectedDurationMins: 18,
    recurringFrequency: "Tuesdays and Thursdays, 17:30 departure",
    hazards: [
      {
        hazard: "Post-club dysregulation if session went poorly",
        severity: "Medium",
        control: "Lackson collects from inside the gym, brief check-in with Coach Davies before Alex enters car. 5-minute decompression chat agreed with Alex before driving off.",
      },
      {
        hazard: "Risk of Alex requesting unauthorised stops (chip shop, friends)",
        severity: "Medium",
        control: "Direct route only — agreed with Alex. Cash limited. If Alex pressures, Lackson has scripted refusal and incident is recorded in shift log.",
      },
      {
        hazard: "Standard road traffic risks",
        severity: "Low",
        control: "Driver licensed, vehicle checks daily, seatbelt confirmed before move-off.",
      },
    ],
    childSpecificConsiderations: {
      yp_alex:
        "Boxing is a major positive engagement — protect it. Lackson's coaching background is core to the rapport. Alex sometimes uses car journey to disclose worries — Lackson trained to listen, document later, never break confidentiality unless safeguarding-relevant.",
    },
    behaviourRiskRating: "Low",
    behaviourMitigations: [
      "Lackson is Alex's preferred male staff for sport-related transport",
      "Established rapport — Alex predictable in this context",
      "If Alex tries to escalate or refuses to return, Lackson trained to remain calm, call RM, never physically prompt",
    ],
    missingFromCareRisk: "Medium",
    missingMitigations: [
      "Alex has a history of going missing post-activity once (12 months ago, returned within 3 hours)",
      "Phone tracking active and shared with RM",
      "Coach Davies confirms session attendance via WhatsApp before pickup",
      "If Alex absent at pickup: Lackson searches gym/changing rooms first, then immediate call to RM",
    ],
    specificRisksByRoute: [
      "Manchester Road has known street congregation outside chip shop — historically associated with peer group concerns for Alex",
      "Salford Sports Centre car park has limited lighting after 19:30 in winter — collect from inside building only",
    ],
    emergencyProcedure:
      "RTC: 999 if injury, RM contact. Behavioural escalation: pull over, do not engage physically, call RM, call police only if immediate safety risk. If Alex exits vehicle: do not chase, follow at safe distance, log location, contact RM and police as missing-from-care procedure.",
    breakdownProcedure:
      "AA cover. Alex tolerates waits well when phone available. If > 30 mins, RM dispatches second vehicle.",
    lastReviewedDate: d(-45),
    reviewedBy: "staff_darren",
    nextReviewDate: d(45),
    signedOffByRM: true,
    inUseStatus: true,
  },
  {
    id: "tra-003",
    journeyTitle: "Jordan — Saturday football matches (home and away fixtures)",
    journeyType: "Routine recurring",
    youngPeople: ["yp_jordan"],
    staffDriver: "staff_ryan",
    passengers: 1,
    vehicle: "Home pool car (Ford Tourneo, reg OK69 LRT)",
    routeDescription: "Variable — home matches at Worsley Rec; away fixtures across Greater Manchester (Bolton, Stockport, Bury). Pre-checked route per fixture.",
    expectedDurationMins: 35,
    recurringFrequency: "Saturdays, kick-off 10:30 (home) or per away fixture schedule",
    hazards: [
      {
        hazard: "Pre-match nerves leading to in-car agitation",
        severity: "Low",
        control: "Ryan's calm tone established, music choice given to Jordan, no coaching talk in car (Jordan's request).",
      },
      {
        hazard: "Post-loss emotional regulation",
        severity: "Medium",
        control: "Ryan trained to allow silence, not minimise feelings, route home avoids busy traffic if possible. If Jordan needs space, brief stop at Worsley Park layby agreed.",
      },
      {
        hazard: "Unfamiliar away venues — wayfinding, unknown crowd dynamics",
        severity: "Medium",
        control: "Each away fixture pre-checked (parking, gate, toilets). Ryan arrives 30 minutes early to orient. Photo of car park location taken in case Jordan wants to leave early.",
      },
      {
        hazard: "Standard road traffic risks",
        severity: "Low",
        control: "Driver licensed, vehicle checks, kit secure in boot.",
      },
    ],
    childSpecificConsiderations: {
      yp_jordan:
        "Football is identity-affirming — Jordan's footballer ambitions are real and respected. Match days are emotionally loaded. Ryan respects the boundary that the journey is not coaching/feedback time. Jordan's mum sometimes attends home matches — separate visits log applies.",
    },
    behaviourRiskRating: "Low",
    behaviourMitigations: [
      "Strong Ryan-Jordan rapport",
      "Rules of car journey co-created with Jordan",
      "Post-match dysregulation managed via known scripts",
      "Mum's attendance pre-agreed via family contact plan — never a surprise",
    ],
    missingFromCareRisk: "Low",
    missingMitigations: [
      "Jordan stays close to Ryan or with the team",
      "Gate exits monitored — Ryan stays for full match",
      "Phone with Jordan, tracking shared",
    ],
    specificRisksByRoute: [
      "Some away venues in unfamiliar postcodes — pre-drive check on Friday evenings",
      "Bury fixture: known busy car park — arrive early, park near exit",
      "Stockport venue: parking restricted — alternative on Edgeley Road",
    ],
    emergencyProcedure:
      "RTC: 999/RM. Injury at match: pitch-side first aider first, then 999/111 as needed. Behavioural: known scripts, RM phone. Safeguarding concern at venue (peer/adult): leave promptly, document, escalate to RM.",
    breakdownProcedure:
      "AA cover. Jordan tolerates waits with phone/snacks. RM dispatches alternate vehicle if delay > 25 mins (match start at risk).",
    lastReviewedDate: d(-15),
    reviewedBy: "staff_darren",
    nextReviewDate: d(75),
    signedOffByRM: true,
    inUseStatus: true,
  },
  {
    id: "tra-004",
    journeyTitle: "Jordan — fortnightly family contact transport (mum's home, Bolton)",
    journeyType: "Family contact",
    youngPeople: ["yp_jordan"],
    staffDriver: "staff_ryan",
    passengers: 1,
    vehicle: "Home pool car (Ford Tourneo, reg OK69 LRT)",
    routeDescription: "Oak House → M60 → M61 → Bolton (mum's address, supervised contact venue when applicable) → return same route",
    expectedDurationMins: 40,
    recurringFrequency: "Every other Sunday, 13:00 departure, 17:00 return",
    hazards: [
      {
        hazard: "Pre-contact anxiety / in-car withdrawal",
        severity: "Medium",
        control: "Ryan trained — does not push conversation. Pre-contact agenda discussed Friday with Jordan's social worker. Calm music; Jordan controls audio.",
      },
      {
        hazard: "Post-contact dysregulation (variable based on contact quality)",
        severity: "High",
        control: "Mandatory 10-minute decompression chat after contact before driving off. If Jordan very dysregulated, Ryan may delay return drive up to 30 minutes. RM debrief on return is mandatory. Crisis script if disclosure during journey.",
      },
      {
        hazard: "M60/M61 motorway driving",
        severity: "Low",
        control: "Driver licensed motorway-confident, regular route. AA cover, vehicle MOT current.",
      },
      {
        hazard: "Mum's emotional state may affect goodbye — observed at handover",
        severity: "Medium",
        control: "Ryan supervises handover, does not leave Jordan if mum dysregulated. Contact ends per supervisor's call. SW briefed on patterns.",
      },
    ],
    childSpecificConsiderations: {
      yp_jordan:
        "Contact with mum is therapeutically important and protected — but emotionally costly. Jordan often quiet outbound, talkative or tearful return. Disclosures occasionally happen on return journey — Ryan documents same day, never breaks rapport mid-journey unless safeguarding-immediate.",
    },
    behaviourRiskRating: "Medium",
    behaviourMitigations: [
      "Same driver every visit (Ryan) — continuity essential",
      "Jordan's known coping signals understood by Ryan",
      "Crisis line numbers programmed in vehicle phone",
      "Backup staff (Anna) briefed if Ryan unavailable",
    ],
    missingFromCareRisk: "Medium",
    missingMitigations: [
      "Historic risk of Jordan refusing return after contact (twice in past 18 months)",
      "Pre-agreed return script with Jordan and SW",
      "Mum briefed not to encourage staying",
      "If refusal: Ryan calls RM and SW, never physically prompts, plans staged return",
    ],
    specificRisksByRoute: [
      "M61 between J5 and J6 has frequent congestion Sunday afternoons",
      "Mum's road has limited parking — designated drop-off bay used",
      "Return route avoids town centre Bolton (Jordan's previous peer associations)",
    ],
    emergencyProcedure:
      "RTC: 999, RM. Disclosure: document factually post-journey, call RM same day, follow LADO/safeguarding flow if criteria met. Refusal to return: call RM, SW; do not force; plan staged return. Mum dysregulation at contact: end early, document, contact SW.",
    breakdownProcedure:
      "AA cover. Jordan can wait with phone; longer waits managed via call to RM. If Sunday unavailability, taxi alternative pre-approved with home credit card.",
    lastReviewedDate: d(-20),
    reviewedBy: "staff_darren",
    nextReviewDate: d(70),
    signedOffByRM: true,
    inUseStatus: true,
  },
  {
    id: "tra-005",
    journeyTitle: "Casey — Wednesday art group at Eccles Community Centre",
    journeyType: "Routine recurring",
    youngPeople: ["yp_casey"],
    staffDriver: "staff_anna",
    passengers: 1,
    vehicle: "Home pool car (Ford Tourneo, reg OK69 LRT)",
    routeDescription: "Oak House → Liverpool Road → Eccles Community Centre (rear car park, accessible side door)",
    expectedDurationMins: 14,
    recurringFrequency: "Wednesdays, 16:00 departure, 17:30 return",
    hazards: [
      {
        hazard: "Sensory overload at community centre car park (busy after-school)",
        severity: "Medium",
        control: "Park in rear bay (quieter), enter via side door — pre-agreed with centre manager. Anna walks Casey directly to art room.",
      },
      {
        hazard: "Transition difficulty leaving home / returning home",
        severity: "Medium",
        control: "5-minute warning before leaving home (visual timer). Casey's chosen item travels with them (current: small clay piece). Return transition supported with consistent landing routine in car (deep breaths, water).",
      },
      {
        hazard: "Standard road traffic risks",
        severity: "Low",
        control: "Daily checks, licensed driver, booster seat.",
      },
    ],
    childSpecificConsiderations: {
      yp_casey:
        "Art group is one of Casey's most reliable regulating activities. Same group, same artist (Mara), same room weekly. Protect this above almost all other appointments. Anna observes from quiet corner if Casey requests. Same vehicle, same seat (rear nearside).",
    },
    behaviourRiskRating: "Low",
    behaviourMitigations: [
      "Highly predictable routine — minimal variation",
      "Same staff driver and same vehicle every time",
      "Casey's signs of overwhelm understood by Anna",
      "If overwhelmed: leave centre, sit in car with sensory bag, return home if needed",
    ],
    missingFromCareRisk: "Low",
    missingMitigations: [
      "Casey stays with Anna or in supervised art room",
      "Centre staff briefed on Casey's profile",
      "Casey has not historically attempted to leave activity",
    ],
    specificRisksByRoute: [
      "Liverpool Road school exit at 15:30 creates congestion — leaving 16:00 avoids this safely",
      "Community centre rear car park access may be obstructed during scout group setup (Wed evenings) — alternative bay used after 17:00",
    ],
    emergencyProcedure:
      "RTC: 999, RM. Sensory crisis: end activity, return to car, follow ASD de-escalation plan, RM informed. Centre staff have Casey's emergency contact protocol.",
    breakdownProcedure:
      "AA cover. Casey tolerates short waits with familiar adult; if > 15 mins, second vehicle dispatched. Mara (artist) will keep Casey calm in art room while waiting if needed.",
    lastReviewedDate: d(-25),
    reviewedBy: "staff_darren",
    nextReviewDate: d(65),
    signedOffByRM: true,
    inUseStatus: true,
  },
  {
    id: "tra-006",
    journeyTitle: "Group day-trip — Lake District (Windermere) summer activity day",
    journeyType: "Holiday/trip",
    youngPeople: ["yp_alex", "yp_jordan", "yp_casey"],
    staffDriver: "staff_darren",
    passengers: 3,
    vehicle: "Home pool car (Ford Tourneo, reg OK69 LRT) — 7-seater",
    routeDescription: "Oak House → M60 → M61 → M6 → A591 → Windermere (Bowness pier car park) → return same route. Planned stops: Tebay services (outbound), Forton services (return).",
    expectedDurationMins: 110,
    recurringFrequency: "One-off (planned 3 weeks ahead — full prep)",
    hazards: [
      {
        hazard: "Long motorway journey — fatigue, distraction risk",
        severity: "Medium",
        control: "Two staff (Darren driving, Anna co-staff). Driver swap not planned (Darren only insured driver for trip) — single planned services break outbound and return. Pre-trip rest, no overnight prior.",
      },
      {
        hazard: "Three young people in one vehicle — social/behavioural complexity",
        severity: "High",
        control: "Seating plan: Casey rear nearside (sensory low), Jordan middle row offside, Alex middle row nearside. Pre-agreed audio playlist (everyone contributed two tracks). Snack stops planned. Two staff means one can move to back if needed at next stop.",
      },
      {
        hazard: "Casey's sensory tolerance for long journey",
        severity: "Medium",
        control: "Casey briefed daily for week prior. Visual timeline for journey. Sensory bag, headphones, weighted lap pad. Anna sits in middle row beside Casey for return leg if needed. Trip can shorten if Casey requests — return-anytime promise made and honoured.",
      },
      {
        hazard: "Unfamiliar environment at destination — water, crowds, unknown terrain",
        severity: "High",
        control: "Pre-trip site recce by Darren. Boat trip pre-booked (controlled environment). Crowd-busy times avoided (arrive 11:00 not weekend 13:00 peak). All three YP have life jackets fitted at boat. Group briefing on water safety. Everyone has location-tracked phones.",
      },
      {
        hazard: "Group dynamic risk — Alex and Jordan have occasional friction",
        severity: "Medium",
        control: "Pre-trip group conversation on what good looks like. Darren and Anna split between the two if tension emerges. Trip is broken into defined activities so attention is occupied.",
      },
      {
        hazard: "Vehicle breakdown in remote area (A591 Lake District)",
        severity: "Medium",
        control: "AA cover full UK. Pre-trip vehicle service complete. Spare phone chargers. Snacks/water/blankets in boot. Insurance verified for the route. RM (Darren) doubles as on-call for himself — handed off to deputy Ryan for the day.",
      },
    ],
    childSpecificConsiderations: {
      yp_alex:
        "Generally enjoys group trips. Watch for any boredom-driven mischief in queues. Knows the seating plan and has agreed.",
      yp_jordan:
        "Loves outdoor activities — boat trip will be highlight. Has agreed seating plan. May want to call mum during day — phone access supported.",
      yp_casey:
        "Highest support need on trip. Visual timeline complete. Anna is primary co-regulator. Promise made: if Casey needs to come home early, we come home — no negotiation. This is non-negotiable for trust.",
    },
    behaviourRiskRating: "Medium",
    behaviourMitigations: [
      "Two experienced staff (RM + senior)",
      "Pre-trip group meeting and individual prep",
      "Clear plan with built-in flex for Casey",
      "Alex and Jordan friction managed via planning and seating",
      "Crisis scripts for each YP carried by both staff",
    ],
    missingFromCareRisk: "Medium",
    missingMitigations: [
      "Phone tracking on all three YPs",
      "Group stays together at destination — buddy system to toilets etc",
      "Boat trip is contained environment",
      "Police 101 number for the area saved in vehicle phone",
      "Photo of each YP in their day's outfit taken before departure",
    ],
    specificRisksByRoute: [
      "M6 north of J36 weather-sensitive — check forecast morning of",
      "A591 narrow in places — defensive driving emphasised",
      "Windermere car park fills by 12:00 — arrive 11:00",
      "Tebay services preferred for stops (calmer than Charnock Richard)",
    ],
    emergencyProcedure:
      "RTC: 999, deputy on-call (Ryan), RM family contacts. Medical at destination: 999, nearest hospital is Westmorland General (Kendal). Behavioural escalation: split staff, contain, return to vehicle if needed, abort trip with no negative framing. Missing person at destination: immediate 999, search pattern from last-seen point, RM notifies SWs.",
    breakdownProcedure:
      "AA priority cover. If breakdown: stay in vehicle if motorway, exit safely if A591. Ryan dispatches replacement vehicle from home if needed (3hr each way — taxi/private hire fallback for return of YPs only if Ryan unable).",
    lastReviewedDate: d(-7),
    reviewedBy: "staff_darren",
    nextReviewDate: d(20),
    signedOffByRM: true,
    inUseStatus: true,
  },
];

const riskColour: Record<string, string> = {
  Low: "bg-green-100 text-green-800",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-red-100 text-red-800",
};

const journeyTypeColour: Record<JourneyType, string> = {
  "Routine recurring": "bg-blue-100 text-blue-800",
  "School run": "bg-indigo-100 text-indigo-800",
  Activity: "bg-purple-100 text-purple-800",
  Appointment: "bg-cyan-100 text-cyan-800",
  "Family contact": "bg-pink-100 text-pink-800",
  "Holiday/trip": "bg-emerald-100 text-emerald-800",
  Emergency: "bg-red-100 text-red-800",
};

const exportCols: ExportColumn<TransportRA>[] = [
  { header: "Journey", accessor: (r: TransportRA) => r.journeyTitle },
  { header: "Type", accessor: (r: TransportRA) => r.journeyType },
  { header: "Young People", accessor: (r: TransportRA) => r.youngPeople.map(getYPName).join("; ") },
  { header: "Driver", accessor: (r: TransportRA) => getStaffName(r.staffDriver) },
  { header: "Passengers", accessor: (r: TransportRA) => r.passengers },
  { header: "Vehicle", accessor: (r: TransportRA) => r.vehicle },
  { header: "Duration (mins)", accessor: (r: TransportRA) => r.expectedDurationMins },
  { header: "Recurring", accessor: (r: TransportRA) => r.recurringFrequency ?? "—" },
  { header: "Behaviour Risk", accessor: (r: TransportRA) => r.behaviourRiskRating },
  { header: "Missing-from-care Risk", accessor: (r: TransportRA) => r.missingFromCareRisk },
  { header: "Last Reviewed", accessor: (r: TransportRA) => r.lastReviewedDate },
  { header: "Reviewed By", accessor: (r: TransportRA) => getStaffName(r.reviewedBy) },
  { header: "Next Review", accessor: (r: TransportRA) => r.nextReviewDate },
  { header: "Signed Off RM", accessor: (r: TransportRA) => (r.signedOffByRM ? "Yes" : "No") },
  { header: "In Use", accessor: (r: TransportRA) => (r.inUseStatus ? "Yes" : "No") },
];

const recurringTypes: JourneyType[] = ["Routine recurring", "School run", "Family contact"];

export default function TransportRiskAssessmentsPage() {
  const [filterYP, setFilterYP] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [sortBy, setSortBy] = useState("review");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((a) => a.youngPeople.includes(filterYP));
    if (filterType !== "all") items = items.filter((a) => a.journeyType === filterType);
    if (filterRisk !== "all") items = items.filter((a) => a.behaviourRiskRating === filterRisk || a.missingFromCareRisk === filterRisk);
    items.sort((a, b) => {
      switch (sortBy) {
        case "review":
          return a.nextReviewDate.localeCompare(b.nextReviewDate);
        case "title":
          return a.journeyTitle.localeCompare(b.journeyTitle);
        case "risk": {
          const ord: Record<RiskLevel, number> = { High: 0, Medium: 1, Low: 2 };
          const aMax = Math.min(ord[a.behaviourRiskRating], ord[a.missingFromCareRisk]);
          const bMax = Math.min(ord[b.behaviourRiskRating], ord[b.missingFromCareRisk]);
          return aMax - bMax;
        }
        case "duration":
          return b.expectedDurationMins - a.expectedDurationMins;
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, filterType, filterRisk, sortBy]);

  const total = data.length;
  const activeRAs = data.filter((a) => a.inUseStatus).length;
  const highRisk = data.filter((a) => a.behaviourRiskRating === "High" || a.missingFromCareRisk === "High" || a.hazards.some((h) => h.severity === "High")).length;
  const dueReview = data.filter((a) => a.nextReviewDate <= d(30)).length;
  const recurring = data.filter((a) => recurringTypes.includes(a.journeyType) || !!a.recurringFrequency).length;

  return (
    <PageShell
      title="Transport Risk Assessments"
      subtitle="Per-route, per-child, per-purpose journey risk assessments"
      ariaContext={{ pageTitle: "Transport Risk Assessments", sourceType: "document" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="transport-risk-assessments" />
          <PrintButton title="Transport Risk Assessments" />
          <AriaStudioQuickActionButton context={{ record_type: "risk_assessment", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{activeRAs}</p>
          <p className="text-xs text-muted-foreground">Active RAs</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", highRisk > 0 ? "text-red-600" : "text-green-600")}>{highRisk}</p>
          <p className="text-xs text-muted-foreground">High-Risk Routes</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", dueReview > 0 ? "text-amber-600" : "text-green-600")}>{dueReview}</p>
          <p className="text-xs text-muted-foreground">Reviews Due 30d</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{recurring}</p>
          <p className="text-xs text-muted-foreground">Recurring Journeys</p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6 flex items-start gap-2">
        <Car className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          Every recurring journey, school run, family contact, activity and one-off trip is risk-assessed
          per-child and per-purpose. Reassessed when route, vehicle, driver or child circumstances change —
          and at minimum every 90 days for active routes. Total of {total} assessments on file.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="All Young People" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Young People</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Routine recurring">Routine recurring</SelectItem>
            <SelectItem value="School run">School run</SelectItem>
            <SelectItem value="Activity">Activity</SelectItem>
            <SelectItem value="Appointment">Appointment</SelectItem>
            <SelectItem value="Family contact">Family contact</SelectItem>
            <SelectItem value="Holiday/trip">Holiday/trip</SelectItem>
            <SelectItem value="Emergency">Emergency</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterRisk} onValueChange={setFilterRisk}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Risks" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risks</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="review">Earliest Review</SelectItem>
              <SelectItem value="title">By Title</SelectItem>
              <SelectItem value="risk">By Risk</SelectItem>
              <SelectItem value="duration">Longest Journey</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((ra) => {
          const isExpanded = expandedId === ra.id;
          const overallRisk: RiskLevel =
            ra.hazards.some((h) => h.severity === "High") || ra.behaviourRiskRating === "High" || ra.missingFromCareRisk === "High"
              ? "High"
              : ra.hazards.some((h) => h.severity === "Medium") || ra.behaviourRiskRating === "Medium" || ra.missingFromCareRisk === "Medium"
              ? "Medium"
              : "Low";

          return (
            <div key={ra.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : ra.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Car className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{ra.journeyTitle}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ra.youngPeople.map(getYPName).join(", ")} &middot; Driver: {getStaffName(ra.staffDriver)} &middot; {ra.expectedDurationMins} min &middot; Next review {ra.nextReviewDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", journeyTypeColour[ra.journeyType])}>
                    {ra.journeyType}
                  </span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", riskColour[overallRisk])}>
                    {overallRisk} Risk
                  </span>
                  {ra.signedOffByRM && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {/* journey overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <MapPin className="h-3 w-3 inline mr-1" />Route
                      </p>
                      <p className="text-sm">{ra.routeDescription}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <Car className="h-3 w-3 inline mr-1" />Vehicle &amp; Logistics
                      </p>
                      <p className="text-sm">{ra.vehicle}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        <span><Users className="h-3 w-3 inline mr-1" />{ra.passengers} passenger{ra.passengers === 1 ? "" : "s"}</span>
                        <span><Clock className="h-3 w-3 inline mr-1" />{ra.expectedDurationMins} mins</span>
                        {ra.recurringFrequency && <span><Repeat className="h-3 w-3 inline mr-1" />{ra.recurringFrequency}</span>}
                      </div>
                    </div>
                  </div>

                  {/* hazards */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Hazards &amp; Controls</p>
                    <div className="space-y-2">
                      {ra.hazards.map((h, i) => (
                        <div key={i} className="bg-white rounded-lg p-3 border">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium">{h.hazard}</p>
                            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", riskColour[h.severity])}>{h.severity}</span>
                          </div>
                          <div className="text-xs flex items-start gap-1">
                            <Shield className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />
                            <span><span className="font-semibold">Control:</span> {h.control}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* child-specific considerations */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Child-Specific Considerations</p>
                    <div className="space-y-2">
                      {Object.entries(ra.childSpecificConsiderations).map(([ypId, note]) => (
                        <div key={ypId} className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                          <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">{getYPName(ypId)}</p>
                          <p className="text-sm text-purple-900">{note}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* behaviour & missing risks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Behaviour Risk</p>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", riskColour[ra.behaviourRiskRating])}>{ra.behaviourRiskRating}</span>
                      </div>
                      <ul className="space-y-1 mt-1">
                        {ra.behaviourMitigations.map((m, i) => (
                          <li key={i} className="text-xs flex items-start gap-1">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Missing-from-Care Risk</p>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", riskColour[ra.missingFromCareRisk])}>{ra.missingFromCareRisk}</span>
                      </div>
                      <ul className="space-y-1 mt-1">
                        {ra.missingMitigations.map((m, i) => (
                          <li key={i} className="text-xs flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* route-specific */}
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />Route-Specific Risks
                    </p>
                    <ul className="space-y-1">
                      {ra.specificRisksByRoute.map((r, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <span className="text-amber-600 mt-0.5">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* emergency / breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                      <p className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-1">
                        <Phone className="h-3 w-3 inline mr-1" />Emergency Procedure
                      </p>
                      <p className="text-sm text-red-900">{ra.emergencyProcedure}</p>
                    </div>
                    <div className="bg-slate-100 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">
                        <Wrench className="h-3 w-3 inline mr-1" />Breakdown Procedure
                      </p>
                      <p className="text-sm">{ra.breakdownProcedure}</p>
                    </div>
                  </div>

                  {/* footer meta */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Eye className="h-3 w-3 inline mr-1" />Reviewed by: {getStaffName(ra.reviewedBy)} on {ra.lastReviewedDate}</span>
                    <span><CalendarClock className="h-3 w-3 inline mr-1" />Next review: {ra.nextReviewDate}</span>
                    {ra.signedOffByRM && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">RM signed off</span>}
                    {ra.inUseStatus && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">In use</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Transport risk assessments are required under Quality Standard 5
          (Health and Wellbeing) and Regulation 23 (Behaviour management and discipline) of the Children&apos;s
          Homes (England) Regulations 2015, alongside Health and Safety at Work Act 1974 duties to staff.
          Each route, vehicle, driver and child combination is individually assessed; assessments are reviewed
          when any element changes and at minimum every 90 days for active routes.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Transport & Risk"
        category={["activity", "behaviour"]}
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Transport Risk Assessments — vehicle safety checks, driver competency, journey risk assessments, child-specific transport risks, safeguarding during transport, Reg 45 safety evidence"
        recordType="risk_assessment"
        className="mt-6"
      />
    </PageShell>
  );
}
