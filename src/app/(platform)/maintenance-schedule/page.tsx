"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Wrench,
  Flame,
  Zap,
  Shield,
  Droplets,
  Bug,
  Home,
  TreePine,
  Cable,
  ArrowUpFromLine,
  CheckCircle,
  AlertTriangle,
  Clock,
  Calendar,
  FileText,
  PoundSterling,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Category =
  | "Heating & boilers"
  | "Electrical"
  | "Gas safety"
  | "Fire safety"
  | "Water hygiene"
  | "Pest control"
  | "Roof & guttering"
  | "Windows & doors"
  | "External grounds"
  | "Plumbing"
  | "PAT testing"
  | "Lifts/access";

type Frequency =
  | "Annual"
  | "6-monthly"
  | "Quarterly"
  | "Monthly"
  | "Weekly"
  | "As required";

type ComplianceStatus = "In date" | "Due now" | "Overdue" | "Booked";

interface MaintenanceItem {
  id: string;
  itemName: string;
  category: Category;
  regulatoryRequirement: string;
  frequency: Frequency;
  contractor: string;
  contractorContact: string;
  lastCompleted: string;
  lastCertificateRef: string;
  nextDue: string;
  complianceStatus: ComplianceStatus;
  bookedDate: string;
  notes: string;
  costAnnual: number;
  responsibleOwner: string;
  defectsHistory: { date: string; defect: string; action: string }[];
  escalationContact: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: MaintenanceItem[] = [
  {
    id: "ms-001",
    itemName: "Annual gas safety check (CP12)",
    category: "Gas safety",
    regulatoryRequirement: "Gas Safety (Installation and Use) Regulations 1998 reg 36 — annual landlord gas safety record. Children's Homes Regs 2015 Quality Standard 25.",
    frequency: "Annual",
    contractor: "Northwood Gas Services Ltd (Gas Safe 512334)",
    contractorContact: "office@northwoodgas.co.uk · 01642 555 102",
    lastCompleted: d(-58),
    lastCertificateRef: "CP12-2025-0418",
    nextDue: d(307),
    complianceStatus: "In date",
    bookedDate: "",
    notes: "All four gas appliances tested — main boiler, kitchen hob, kitchen oven, utility room dryer. Engineer flagged minor flue brush service due next visit.",
    costAnnual: 285,
    responsibleOwner: "staff_darren",
    defectsHistory: [
      { date: d(-420), defect: "Boiler pressure low — pilot intermittent", action: "Engineer rebled system, refilled F&E tank, retest passed" },
      { date: d(-790), defect: "Flue obstruction — bird nesting", action: "Cap fitted, swept flue, retest passed" },
    ],
    escalationContact: "Gas Safe Register · 0800 408 5500 · Ofsted notification if isolation required",
  },
  {
    id: "ms-002",
    itemName: "Boiler service & efficiency check",
    category: "Heating & boilers",
    regulatoryRequirement: "Manufacturer warranty + QS 25 (warm, comfortable home). Combined with annual gas safety where possible.",
    frequency: "Annual",
    contractor: "Northwood Gas Services Ltd",
    contractorContact: "office@northwoodgas.co.uk · 01642 555 102",
    lastCompleted: d(-58),
    lastCertificateRef: "BS-2025-0418",
    nextDue: d(307),
    complianceStatus: "In date",
    bookedDate: "",
    notes: "Worcester Greenstar 30CDi — 8 years old. Efficiency 92%, no faults, magnetic filter cleaned. Plan replacement budget within next 4 years.",
    costAnnual: 165,
    responsibleOwner: "staff_darren",
    defectsHistory: [
      { date: d(-180), defect: "Radiator imbalance — bedrooms 3 & 4 cold", action: "Engineer rebalanced TRVs, bled all rads. Resolved." },
    ],
    escalationContact: "Out-of-hours: Northwood Gas 24h line 07700 900 410",
  },
  {
    id: "ms-003",
    itemName: "EICR — electrical installation condition report",
    category: "Electrical",
    regulatoryRequirement: "Electricity at Work Regulations 1989; BS 7671. 5-yearly fixed wiring inspection. QS 25.",
    frequency: "Annual",
    contractor: "Tees Valley Electrical (NICEIC reg 0394215)",
    contractorContact: "bookings@teesvalley-electrical.co.uk · 01642 555 220",
    lastCompleted: d(-820),
    lastCertificateRef: "EICR-2024-0103",
    nextDue: d(1005),
    complianceStatus: "In date",
    bookedDate: "",
    notes: "Full EICR completed — satisfactory. Two C3 observations (cosmetic): replace cracked socket faceplate hallway, label main isolator. Both remedied.",
    costAnnual: 420,
    responsibleOwner: "staff_darren",
    defectsHistory: [
      { date: d(-820), defect: "C3 — hallway socket faceplate cracked", action: "Replaced same visit" },
      { date: d(-820), defect: "C3 — main isolator unlabelled", action: "Labelled per BS 7671" },
    ],
    escalationContact: "NICEIC verification: 0333 015 6625",
  },
  {
    id: "ms-004",
    itemName: "PAT testing — portable appliances",
    category: "PAT testing",
    regulatoryRequirement: "Electricity at Work Regs 1989 + IET Code of Practice. Annual for high-use environments with children.",
    frequency: "Annual",
    contractor: "Tees Valley Electrical",
    contractorContact: "bookings@teesvalley-electrical.co.uk · 01642 555 220",
    lastCompleted: d(-95),
    lastCertificateRef: "PAT-2025-0312",
    nextDue: d(270),
    complianceStatus: "In date",
    bookedDate: "",
    notes: "84 appliances tested, 3 failed (kitchen toaster — frayed lead replaced; office fan — cracked plug replaced; bedroom hairdryer — disposed). Register held at office.",
    costAnnual: 195,
    responsibleOwner: "staff_ryan",
    defectsHistory: [
      { date: d(-95), defect: "Kitchen toaster — frayed flex", action: "Replaced flex, retested PASS" },
      { date: d(-95), defect: "Bedroom hairdryer — Class II insulation breach", action: "Disposed, replaced from petty cash" },
    ],
    escalationContact: "Immediate disposal of failed items — register signed by Darren as RM",
  },
  {
    id: "ms-005",
    itemName: "Fire alarm — full service & certification",
    category: "Fire safety",
    regulatoryRequirement: "BS 5839-1 (twice-yearly maintenance). Regulatory Reform (Fire Safety) Order 2005. QS 25.",
    frequency: "6-monthly",
    contractor: "Cleveland Fire Protection Ltd",
    contractorContact: "service@clevelandfp.co.uk · 01642 555 330",
    lastCompleted: d(-12),
    lastCertificateRef: "FA-2025-S2-117",
    nextDue: d(170),
    complianceStatus: "In date",
    bookedDate: "",
    notes: "Grade A LD2 system. All 14 detectors tested, control panel battery replaced (5-year cycle), call points functional. Weekly in-house tests continue (Mondays 09:00).",
    costAnnual: 380,
    responsibleOwner: "staff_darren",
    defectsHistory: [
      { date: d(-194), defect: "Detector — bedroom 2 false activation (steam from en-suite)", action: "Detector relocated 1m further from door, no further activations" },
    ],
    escalationContact: "Cleveland FP 24h: 07700 900 555 · Cleveland Fire & Rescue if confirmed fire",
  },
  {
    id: "ms-006",
    itemName: "Fire extinguisher service",
    category: "Fire safety",
    regulatoryRequirement: "BS 5306-3 annual service. Fire Safety Order 2005.",
    frequency: "Annual",
    contractor: "Cleveland Fire Protection Ltd",
    contractorContact: "service@clevelandfp.co.uk · 01642 555 330",
    lastCompleted: d(-12),
    lastCertificateRef: "FE-2025-117",
    nextDue: d(353),
    complianceStatus: "In date",
    bookedDate: "",
    notes: "8 extinguishers (6 water-additive, 1 CO2 office, 1 wet-chem kitchen). All passed pressure check. Kitchen wet-chem due replacement in 2 years (10-year cycle).",
    costAnnual: 110,
    responsibleOwner: "staff_darren",
    defectsHistory: [],
    escalationContact: "Cleveland FP same-day callout for damaged units",
  },
  {
    id: "ms-007",
    itemName: "Emergency lighting — full duration test",
    category: "Fire safety",
    regulatoryRequirement: "BS 5266-1 annual 3-hour duration test + monthly flick test. Fire Safety Order 2005.",
    frequency: "Annual",
    contractor: "Tees Valley Electrical",
    contractorContact: "bookings@teesvalley-electrical.co.uk · 01642 555 220",
    lastCompleted: d(-44),
    lastCertificateRef: "EL-2025-0403",
    nextDue: d(321),
    complianceStatus: "In date",
    bookedDate: "",
    notes: "All 11 luminaires held full 3 hours. Two batteries replaced (stair head, rear escape). Monthly flick tests logged in fire log book.",
    costAnnual: 145,
    responsibleOwner: "staff_ryan",
    defectsHistory: [
      { date: d(-44), defect: "Stair-head luminaire failed at 2h 40m", action: "Battery pack replaced, full retest passed" },
    ],
    escalationContact: "Any failed unit triggers same-week replacement",
  },
  {
    id: "ms-008",
    itemName: "Fire risk assessment — annual review",
    category: "Fire safety",
    regulatoryRequirement: "Regulatory Reform (Fire Safety) Order 2005 art 9 — review after significant change or annually.",
    frequency: "Annual",
    contractor: "Hartley Risk Management (NEBOSH consultant)",
    contractorContact: "j.hartley@hartley-rm.co.uk · 07700 900 660",
    lastCompleted: d(-2),
    lastCertificateRef: "FRA-2025-OAK",
    nextDue: d(363),
    complianceStatus: "In date",
    bookedDate: "",
    notes: "Reviewed following bedroom 5 fitted with secondary escape window. Risk rating remains LOW. Two PEEPs updated (Casey, Jordan).",
    costAnnual: 240,
    responsibleOwner: "staff_darren",
    defectsHistory: [],
    escalationContact: "Trigger review if: structural change, incident, new resident with mobility need",
  },
  {
    id: "ms-009",
    itemName: "Legionella risk assessment",
    category: "Water hygiene",
    regulatoryRequirement: "HSE ACoP L8 + HSG274. Biennial review minimum, annual for higher-risk premises with vulnerable users.",
    frequency: "Annual",
    contractor: "AquaSafe Water Hygiene",
    contractorContact: "bookings@aquasafe-wh.co.uk · 01642 555 410",
    lastCompleted: d(-115),
    lastCertificateRef: "LRA-2025-0108",
    nextDue: d(250),
    complianceStatus: "In date",
    bookedDate: "",
    notes: "Cold water tank inspected, no biofilm. Outlets sampled — all <100 CFU/ml. Shower heads descaled. Little-used outlets schedule confirmed (bedroom 6 ensuite, garden tap).",
    costAnnual: 320,
    responsibleOwner: "staff_darren",
    defectsHistory: [
      { date: d(-480), defect: "Shower head bedroom 4 — moderate scale", action: "Descaled and disinfected; added to monthly flush list" },
    ],
    escalationContact: "AquaSafe emergency sample turnaround 24h if positive result suspected",
  },
  {
    id: "ms-010",
    itemName: "Water temperature monitoring",
    category: "Water hygiene",
    regulatoryRequirement: "HSG274 — sentinel outlets monthly. TMV2 outlets serving children: <44°C.",
    frequency: "Monthly",
    contractor: "In-house (RM + senior staff)",
    contractorContact: "Internal — recorded in water log book",
    lastCompleted: d(-4),
    lastCertificateRef: "WTM-2025-M5",
    nextDue: d(26),
    complianceStatus: "In date",
    bookedDate: "",
    notes: "Hot sentinel >50°C achieved within 60s at all points. Cold sentinel <20°C. TMVs: bath taps 41-43°C (all bedrooms). Calibrated thermometer used.",
    costAnnual: 0,
    responsibleOwner: "staff_ryan",
    defectsHistory: [
      { date: d(-65), defect: "Bedroom 3 hot tap reached only 47°C", action: "Engineer attended — boiler flow temp adjusted, retested 52°C" },
    ],
    escalationContact: "If temp out of range >24h: AquaSafe + RM informed",
  },
  {
    id: "ms-011",
    itemName: "Pest control — quarterly visit",
    category: "Pest control",
    regulatoryRequirement: "Food Hygiene (England) Regs 2006 — kitchen areas. Good practice for residential setting.",
    frequency: "Quarterly",
    contractor: "PestGuard Northeast (BPCA member)",
    contractorContact: "service@pestguard-ne.co.uk · 01642 555 480",
    lastCompleted: d(-26),
    lastCertificateRef: "PG-2025-Q1",
    nextDue: d(64),
    complianceStatus: "In date",
    bookedDate: "",
    notes: "All bait stations inspected — no activity. External rodent boxes intact. Fly screens kitchen/utility checked. Advisory: trim ivy on rear wall.",
    costAnnual: 360,
    responsibleOwner: "staff_ryan",
    defectsHistory: [
      { date: d(-300), defect: "Mouse activity — utility room (single sighting by staff)", action: "Additional bait stations placed; gap behind dryer sealed; no further sightings over 3 visits" },
    ],
    escalationContact: "PestGuard emergency callout within 24h if sighting confirmed",
  },
  {
    id: "ms-012",
    itemName: "Roof inspection",
    category: "Roof & guttering",
    regulatoryRequirement: "Internal QS 25 — premises maintained in good repair. Insurer's recommendation.",
    frequency: "Annual",
    contractor: "Heritage Roofing & Leadwork",
    contractorContact: "office@heritage-roofing.co.uk · 01642 555 540",
    lastCompleted: d(-180),
    lastCertificateRef: "RI-2024-OAK",
    nextDue: d(185),
    complianceStatus: "In date",
    bookedDate: "",
    notes: "Drone survey + spot ladder check. 3 slipped slates re-secured, ridge mortar re-pointed 2m section. No leaks reported internally since.",
    costAnnual: 280,
    responsibleOwner: "staff_darren",
    defectsHistory: [
      { date: d(-180), defect: "3 slipped slates — south elevation", action: "Refixed same visit, no internal damage" },
    ],
    escalationContact: "Heritage offer 48h response for storm damage",
  },
  {
    id: "ms-013",
    itemName: "Window & door safety check",
    category: "Windows & doors",
    regulatoryRequirement: "QS 25; window restrictors required at upper-floor levels (PAS 24 / RoSPA guidance for children's settings).",
    frequency: "6-monthly",
    contractor: "In-house (handyman day) + sash repair specialist if needed",
    contractorContact: "Mike Robson (regular handyman) · 07700 900 712",
    lastCompleted: d(-8),
    lastCertificateRef: "WD-2025-S1",
    nextDue: d(174),
    complianceStatus: "In date",
    bookedDate: "",
    notes: "All upper-floor restrictors functional and 100mm-limited. Final-exit doors operate from inside without key. Two sash cords replaced bedroom 2.",
    costAnnual: 220,
    responsibleOwner: "staff_ryan",
    defectsHistory: [
      { date: d(-8), defect: "Sash cord snapped — bedroom 2 left window", action: "Replaced both cords on that window, balanced; window made safe within 4h of report" },
    ],
    escalationContact: "Any failed restrictor = window taken out of use until repaired",
  },
  {
    id: "ms-014",
    itemName: "Gutter clean & downpipe check",
    category: "Roof & guttering",
    regulatoryRequirement: "Property maintenance — prevent damp ingress / overflow into walls. QS 25.",
    frequency: "6-monthly",
    contractor: "Heritage Roofing & Leadwork",
    contractorContact: "office@heritage-roofing.co.uk · 01642 555 540",
    lastCompleted: d(-90),
    lastCertificateRef: "GC-2025-S1",
    nextDue: d(92),
    complianceStatus: "In date",
    bookedDate: "",
    notes: "Both elevations cleared, downpipes flushed, hopper at rear cleared of moss. Recommend leaf guards at autumn visit.",
    costAnnual: 140,
    responsibleOwner: "staff_ryan",
    defectsHistory: [],
    escalationContact: "After heavy rainfall — visual check by RM",
  },
  {
    id: "ms-015",
    itemName: "Garden & external grounds maintenance",
    category: "External grounds",
    regulatoryRequirement: "QS 25 — safe outdoor space; play equipment annual inspection (BS EN 1176 if play equipment present).",
    frequency: "Monthly",
    contractor: "GreenScape Gardens (April–Oct fortnightly)",
    contractorContact: "bookings@greenscape-gardens.co.uk · 01642 555 600",
    lastCompleted: d(-3),
    lastCertificateRef: "GM-2025-M5",
    nextDue: d(11),
    complianceStatus: "In date",
    bookedDate: "",
    notes: "Lawn cut, borders weeded, hedges trimmed. Trampoline net checked — secure. Garden gate self-close mechanism functional.",
    costAnnual: 1280,
    responsibleOwner: "staff_ryan",
    defectsHistory: [
      { date: d(-200), defect: "Loose paving slab near patio door — trip hazard", action: "Slab re-bedded same week; isolated until set" },
    ],
    escalationContact: "Play equipment annual inspection due each March",
  },
  {
    id: "ms-016",
    itemName: "Intruder alarm service",
    category: "Electrical",
    regulatoryRequirement: "Insurer's policy condition + NSI/SSAIB code for monitored systems. Annual maintenance.",
    frequency: "Annual",
    contractor: "Tees Security Systems (SSAIB cert)",
    contractorContact: "service@teessecurity.co.uk · 01642 555 670",
    lastCompleted: d(-150),
    lastCertificateRef: "IA-2024-OAK",
    nextDue: d(215),
    complianceStatus: "In date",
    bookedDate: "",
    notes: "All sensors tested, key-fob batteries replaced, monitoring centre handshake confirmed. User codes audited — old staff codes removed.",
    costAnnual: 195,
    responsibleOwner: "staff_darren",
    defectsHistory: [
      { date: d(-150), defect: "Hallway PIR intermittent fault", action: "Replaced detector; retest passed" },
    ],
    escalationContact: "ARC: 0345 555 0001 · Police response level 1",
  },
  {
    id: "ms-017",
    itemName: "CCTV maintenance",
    category: "Electrical",
    regulatoryRequirement: "DPA 2018 / UK GDPR + Surveillance Camera Code of Practice. Annual functional check, signage review.",
    frequency: "Annual",
    contractor: "Tees Security Systems",
    contractorContact: "service@teessecurity.co.uk · 01642 555 670",
    lastCompleted: d(35),
    lastCertificateRef: "(booked)",
    nextDue: d(35),
    complianceStatus: "Booked",
    bookedDate: d(35),
    notes: "External-only system (front + rear yard). No camera covers private areas. Booked for full clean of housings, NVR firmware update, retention review (31 days).",
    costAnnual: 180,
    responsibleOwner: "staff_darren",
    defectsHistory: [
      { date: d(-410), defect: "Rear camera fogged housing", action: "Desiccant replaced, seal renewed; image clear since" },
    ],
    escalationContact: "DPIA reviewed annually by RM in line with privacy notice for residents",
  },
  {
    id: "ms-018",
    itemName: "Plumbing — annual check (TMVs, stopcocks, traps)",
    category: "Plumbing",
    regulatoryRequirement: "TMV2 servicing per manufacturer + HSG274 supporting actions. QS 25.",
    frequency: "Annual",
    contractor: "Northwood Gas Services Ltd (plumbing division)",
    contractorContact: "office@northwoodgas.co.uk · 01642 555 102",
    lastCompleted: d(-380),
    lastCertificateRef: "PL-2024-OAK",
    nextDue: d(-15),
    complianceStatus: "Overdue",
    bookedDate: "",
    notes: "Annual visit slipped due to contractor scheduling — chase made by RM 12 days ago. Provisional date offered for next week; awaiting confirmation. Manual TMV temp checks remain in date.",
    costAnnual: 230,
    responsibleOwner: "staff_darren",
    defectsHistory: [
      { date: d(-380), defect: "Bath TMV bedroom 3 drift to 46°C", action: "Cartridge replaced and recalibrated to 41°C" },
    ],
    escalationContact: "RM to escalate to second contractor (AquaSafe partner plumber) if not booked within 7 days",
  },
];

const CATEGORY_ICON: Record<Category, typeof Wrench> = {
  "Heating & boilers": Flame,
  "Electrical": Zap,
  "Gas safety": Flame,
  "Fire safety": Shield,
  "Water hygiene": Droplets,
  "Pest control": Bug,
  "Roof & guttering": Home,
  "Windows & doors": Home,
  "External grounds": TreePine,
  "Plumbing": Droplets,
  "PAT testing": Cable,
  "Lifts/access": ArrowUpFromLine,
};

const STATUS_COLOUR: Record<ComplianceStatus, string> = {
  "In date": "bg-green-100 text-green-800",
  "Due now": "bg-amber-100 text-amber-800",
  "Overdue": "bg-red-100 text-red-800",
  "Booked": "bg-blue-100 text-blue-800",
};

const STATUS_ICON: Record<ComplianceStatus, typeof CheckCircle> = {
  "In date": CheckCircle,
  "Due now": Clock,
  "Overdue": AlertTriangle,
  "Booked": Calendar,
};

const exportCols: ExportColumn<MaintenanceItem>[] = [
  { header: "Item", accessor: (r: MaintenanceItem) => r.itemName },
  { header: "Category", accessor: (r: MaintenanceItem) => r.category },
  { header: "Frequency", accessor: (r: MaintenanceItem) => r.frequency },
  { header: "Contractor", accessor: (r: MaintenanceItem) => r.contractor },
  { header: "Last completed", accessor: (r: MaintenanceItem) => r.lastCompleted },
  { header: "Certificate ref", accessor: (r: MaintenanceItem) => r.lastCertificateRef },
  { header: "Next due", accessor: (r: MaintenanceItem) => r.nextDue },
  { header: "Status", accessor: (r: MaintenanceItem) => r.complianceStatus },
  { header: "Booked date", accessor: (r: MaintenanceItem) => r.bookedDate },
  { header: "Owner", accessor: (r: MaintenanceItem) => getStaffName(r.responsibleOwner) },
  { header: "Annual cost", accessor: (r: MaintenanceItem) => `£${r.costAnnual}` },
  { header: "Regulatory basis", accessor: (r: MaintenanceItem) => r.regulatoryRequirement },
  { header: "Notes", accessor: (r: MaintenanceItem) => r.notes },
];

export default function MaintenanceSchedulePage() {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("nextDue");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = useMemo(() => {
    let list = data;
    if (filterCategory !== "all") list = list.filter((m) => m.category === filterCategory);
    if (filterStatus !== "all") list = list.filter((m) => m.complianceStatus === filterStatus);

    const statusOrder: Record<ComplianceStatus, number> = {
      "Overdue": 0,
      "Due now": 1,
      "Booked": 2,
      "In date": 3,
    };

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "nextDue":
          return a.nextDue.localeCompare(b.nextDue);
        case "status":
          return statusOrder[a.complianceStatus] - statusOrder[b.complianceStatus];
        case "category":
          return a.category.localeCompare(b.category);
        case "cost":
          return b.costAnnual - a.costAnnual;
        default:
          return 0;
      }
    });
  }, [filterCategory, filterStatus, sortBy]);

  const total = data.length;
  const inDateCount = data.filter((m) => m.complianceStatus === "In date" || m.complianceStatus === "Booked").length;
  const inDatePct = Math.round((inDateCount / total) * 100);
  const due30 = data.filter((m) => {
    const due = new Date(m.nextDue);
    const days = Math.floor((due.getTime() - today.getTime()) / 86400000);
    return days >= 0 && days <= 30 && m.complianceStatus !== "Overdue";
  }).length;
  const overdue = data.filter((m) => m.complianceStatus === "Overdue").length;

  const annualCost = data.reduce((sum, m) => sum + m.costAnnual, 0);

  const categories: Category[] = [
    "Heating & boilers", "Electrical", "Gas safety", "Fire safety",
    "Water hygiene", "Pest control", "Roof & guttering", "Windows & doors",
    "External grounds", "Plumbing", "PAT testing", "Lifts/access",
  ];

  return (
    <PageShell
      title="Maintenance Schedule"
      subtitle="Planned maintenance — boilers, electrical, gas, fire safety, water hygiene, pest control. Quality Standard 25 evidence trail."
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="maintenance-schedule" />
          <PrintButton title="Maintenance Schedule" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Scheduled items</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", inDatePct >= 90 ? "text-green-600" : inDatePct >= 75 ? "text-amber-600" : "text-red-600")}>
            {inDatePct}%
          </p>
          <p className="text-xs text-muted-foreground">In date / booked</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", due30 > 0 ? "text-amber-600" : "text-green-600")}>{due30}</p>
          <p className="text-xs text-muted-foreground">Due next 30 days</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", overdue > 0 ? "text-red-600" : "text-green-600")}>{overdue}</p>
          <p className="text-xs text-muted-foreground">Overdue</p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6 flex items-start gap-2">
        <Wrench className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          Planned maintenance schedule covering statutory and good-practice items. Indicative annual spend
          on contracted maintenance: <strong>£{annualCost.toLocaleString()}</strong>. Certificates and reports
          held in the Documents module; weekly fire alarm and monthly emergency-light flick tests are recorded
          in the in-house fire log.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="In date">In date</SelectItem>
            <SelectItem value="Due now">Due now</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
            <SelectItem value="Booked">Booked</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nextDue">Next due (soonest)</SelectItem>
              <SelectItem value="status">Compliance status</SelectItem>
              <SelectItem value="category">Category A–Z</SelectItem>
              <SelectItem value="cost">Annual cost (high→low)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((m) => {
          const isExpanded = expandedId === m.id;
          const Icon = CATEGORY_ICON[m.category];
          const StatusIcon = STATUS_ICON[m.complianceStatus];
          const isAlert = m.complianceStatus === "Overdue" || m.complianceStatus === "Due now";

          return (
            <div
              key={m.id}
              className={cn(
                "rounded-xl border bg-white overflow-hidden",
                m.complianceStatus === "Overdue" && "border-l-4 border-l-red-500",
                m.complianceStatus === "Due now" && "border-l-4 border-l-amber-500",
              )}
            >
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : m.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Icon className={cn("h-5 w-5 shrink-0", isAlert ? "text-red-600" : "text-slate-600")} />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{m.itemName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {m.category} &middot; {m.frequency} &middot; Next due {m.nextDue} &middot; Owner: {getStaffName(m.responsibleOwner)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1", STATUS_COLOUR[m.complianceStatus])}>
                    <StatusIcon className="h-3 w-3" />
                    {m.complianceStatus}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border space-y-1 text-sm">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Regulatory basis</p>
                      <p>{m.regulatoryRequirement}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border space-y-1 text-sm">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Contractor</p>
                      <p className="font-medium">{m.contractor}</p>
                      <p className="text-xs text-muted-foreground">{m.contractorContact}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Last completed</p>
                      <p className="font-medium">{m.lastCompleted || "—"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Certificate ref</p>
                      <p className="font-medium flex items-center justify-center gap-1">
                        <FileText className="h-3 w-3" />{m.lastCertificateRef || "—"}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Next due</p>
                      <p className="font-medium">{m.nextDue}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Annual cost</p>
                      <p className="font-medium flex items-center justify-center gap-1">
                        <PoundSterling className="h-3 w-3" />{m.costAnnual.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {m.bookedDate && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                        <Calendar className="h-3 w-3 inline mr-1" />Booked
                      </p>
                      <p className="text-sm text-blue-900">Visit booked for {m.bookedDate}</p>
                    </div>
                  )}

                  <div className="bg-white rounded-lg p-3 border text-sm">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes from last visit</p>
                    <p>{m.notes}</p>
                  </div>

                  {m.defectsHistory.length > 0 && (
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Defects history</p>
                      <div className="space-y-2">
                        {m.defectsHistory.map((d, i) => (
                          <div key={i} className="text-sm border-l-2 border-amber-400 pl-3">
                            <p className="font-medium">{d.date} — {d.defect}</p>
                            <p className="text-xs text-muted-foreground">Action: {d.action}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Escalation contact</p>
                    <p className="text-sm text-amber-900">{m.escalationContact}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600">
        <p className="font-semibold text-slate-800 mb-1">Regulatory framework</p>
        <p>
          Children's Homes (England) Regulations 2015 Quality Standard 25 (premises) requires the home is
          maintained to a standard appropriate for the care of children. Fire Safety Order 2005, Gas Safety
          (Installation and Use) Regulations 1998, Electricity at Work Regulations 1989, HSE ACoP L8 (Legionella)
          and BS 5839/5266/5306 set the technical baseline. Certificates retained for the duration of the
          home's registration; defect histories evidence responsive landlord behaviour during Ofsted inspection.
        </p>
      </div>
    </PageShell>
  );
}
