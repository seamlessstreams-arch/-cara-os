"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — VEHICLE PRE-USE CHECK
// Recorded by the driver before any journey carrying children.
// Required by Quality Standard 5 (Health & Wellbeing) and the home's transport
// policy. Defects must be actioned before the vehicle is used.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Car,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Fuel,
  Gauge,
  Wrench,
  Lightbulb,
  CircleDot,
  Eye,
  Briefcase,
  Heart,
  Users,
  Clock,
  CalendarClock,
  BookOpen,
  MapPin,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── Local date helper ────────────────────────────────────────────────────────
const d = (n: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + n);
  return date.toISOString().slice(0, 10);
};

// ── Types ────────────────────────────────────────────────────────────────────
type FuelLevel = "Full" | "3/4" | "1/2" | "1/4" | "Refuel needed";
type CheckOutcome =
  | "Cleared for use"
  | "Cleared with minor notes"
  | "Withdrawn from use - defect";

interface CheckItem {
  item: string;
  pass: boolean;
  notes: string;
}

interface VehicleCheck {
  id: string;
  vehicle: string;
  driver: string;
  dateTime: string;
  journeyPurpose: string;
  expectedReturn: string;
  checks: CheckItem[];
  fuelLevel: FuelLevel;
  mileageStart: number;
  mileageEnd?: number;
  defectsFound: string[];
  defectsActionedBy: string;
  tyresChecked: boolean;
  tyresPressureNotedNotes: string;
  fluidsChecked: boolean;
  warningLightsClear: boolean;
  windscreenAndWipersOk: boolean;
  seatbeltsOk: boolean;
  childCarSeatsCorrect: boolean;
  firstAidKitPresent: boolean;
  grabBagPresent: boolean;
  insuranceConfirmed: boolean;
  motValidUntil: string;
  breakdownCoverConfirmed: boolean;
  passengersExpected: number;
  incidentsDuringJourney: string;
  checkOutcome: CheckOutcome;
  nextAction: string;
}

// ── Standard checks template ─────────────────────────────────────────────────
const STANDARD_CHECKS = (
  overrides: Partial<Record<string, { pass: boolean; notes: string }>> = {},
): CheckItem[] => {
  const base: string[] = [
    "Tyres — tread depth, sidewall, visible damage",
    "Lights — headlights, brake lights, fog lights",
    "Indicators — front, side and rear",
    "Brakes — parking brake holds, foot brake firm",
    "Oil, coolant, water and screenwash levels",
    "Seatbelts — all positions function and retract",
    "Child seats fitted correctly for expected passengers",
    "Mirrors clean, adjusted and undamaged",
    "Mileage recorded at start of journey",
    "Fuel level sufficient for planned journey",
    "Dashboard warning lights — none illuminated",
    "First aid kit present and in date",
    "Grab bag present (ID, contact info, emergency cash)",
  ];
  return base.map((item) => ({
    item,
    pass: overrides[item]?.pass ?? true,
    notes: overrides[item]?.notes ?? "",
  }));
};

// ── Seed records (most recent first) ─────────────────────────────────────────
const RECORDS: VehicleCheck[] = [
  {
    id: "vpu_006",
    vehicle: "Vehicle A — VW Caddy",
    driver: "staff_darren",
    dateTime: `${d(0)} 08:15`,
    journeyPurpose: "School run — Casey and Alex to Oakfield Academy",
    expectedReturn: `${d(0)} 09:30`,
    checks: STANDARD_CHECKS(),
    fuelLevel: "3/4",
    mileageStart: 48211,
    mileageEnd: 48230,
    defectsFound: [],
    defectsActionedBy: "",
    tyresChecked: true,
    tyresPressureNotedNotes:
      "All four tyres checked visually — pressures within tolerance from yesterday's gauge reading (32 PSI front, 35 PSI rear).",
    fluidsChecked: true,
    warningLightsClear: true,
    windscreenAndWipersOk: true,
    seatbeltsOk: true,
    childCarSeatsCorrect: true,
    firstAidKitPresent: true,
    grabBagPresent: true,
    insuranceConfirmed: true,
    motValidUntil: "2026-09-14",
    breakdownCoverConfirmed: true,
    passengersExpected: 2,
    incidentsDuringJourney:
      "No incidents. Both young people delivered on time. Casey settled in front passenger seat as agreed in her care plan.",
    checkOutcome: "Cleared for use",
    nextAction: "Standard return at 14:45 for afternoon school pickup.",
  },
  {
    id: "vpu_005",
    vehicle: "Vehicle B — Ford Tourneo",
    driver: "staff_anna",
    dateTime: `${d(0)} 10:00`,
    journeyPurpose:
      "Family contact — Jordan to supervised contact at Riverside Centre",
    expectedReturn: `${d(0)} 13:00`,
    checks: STANDARD_CHECKS({
      "Fuel level sufficient for planned journey": {
        pass: true,
        notes: "Topped up to full at the Esso on Mill Lane before departure.",
      },
    }),
    fuelLevel: "Full",
    mileageStart: 71044,
    mileageEnd: 71103,
    defectsFound: [],
    defectsActionedBy: "",
    tyresChecked: true,
    tyresPressureNotedNotes:
      "Pressures gauged this morning — front 34 PSI, rear 38 PSI. All within manufacturer spec.",
    fluidsChecked: true,
    warningLightsClear: true,
    windscreenAndWipersOk: true,
    seatbeltsOk: true,
    childCarSeatsCorrect: true,
    firstAidKitPresent: true,
    grabBagPresent: true,
    insuranceConfirmed: true,
    motValidUntil: "2026-11-02",
    breakdownCoverConfirmed: true,
    passengersExpected: 1,
    incidentsDuringJourney:
      "Quiet outbound. Jordan a little anxious but engaged after a short stop at the layby for fresh air. No incidents.",
    checkOutcome: "Cleared for use",
    nextAction:
      "Vehicle parked back on drive. Refuel not required. Logged on the vehicle diary.",
  },
  {
    id: "vpu_004",
    vehicle: "Vehicle A — VW Caddy",
    driver: "staff_ryan",
    dateTime: `${d(-1)} 16:20`,
    journeyPurpose:
      "Activity trip — all three young people to Roman Fields trampoline park",
    expectedReturn: `${d(-1)} 19:30`,
    checks: STANDARD_CHECKS({
      "Mirrors clean, adjusted and undamaged": {
        pass: true,
        notes:
          "Nearside wing mirror has a minor scuff from last week — recorded in maintenance log, no impact on visibility, cleared by manager.",
      },
    }),
    fuelLevel: "1/2",
    mileageStart: 48142,
    mileageEnd: 48198,
    defectsFound: [],
    defectsActionedBy: "",
    tyresChecked: true,
    tyresPressureNotedNotes:
      "All tyres visually checked — no debris or damage. Last gauge reading 31/35 PSI two days ago.",
    fluidsChecked: true,
    warningLightsClear: true,
    windscreenAndWipersOk: true,
    seatbeltsOk: true,
    childCarSeatsCorrect: true,
    firstAidKitPresent: true,
    grabBagPresent: true,
    insuranceConfirmed: true,
    motValidUntil: "2026-09-14",
    breakdownCoverConfirmed: true,
    passengersExpected: 3,
    incidentsDuringJourney:
      "Smooth journey out and back. Brief stop at Tesco for snacks on return. All three young people appropriately seat-belted throughout.",
    checkOutcome: "Cleared with minor notes",
    nextAction:
      "Wing mirror scuff to remain on watch list — no further action this trip.",
  },
  {
    id: "vpu_003",
    vehicle: "Vehicle C — Vauxhall Vivaro",
    driver: "staff_lackson",
    dateTime: `${d(-1)} 07:45`,
    journeyPurpose:
      "Medical — Jordan to CAMHS appointment at Northgate clinic",
    expectedReturn: `${d(-1)} 10:30`,
    checks: STANDARD_CHECKS({
      "Lights — headlights, brake lights, fog lights": {
        pass: false,
        notes:
          "Offside rear brake light not illuminating during walk-round check.",
      },
      "Dashboard warning lights — none illuminated": {
        pass: false,
        notes: "Bulb-failure warning illuminated on the dashboard.",
      },
    }),
    fuelLevel: "1/2",
    mileageStart: 102876,
    defectsFound: [
      "Offside rear brake light bulb failed",
      "Dashboard bulb-failure warning illuminated",
    ],
    defectsActionedBy: "staff_lackson",
    tyresChecked: true,
    tyresPressureNotedNotes:
      "Tyres in good condition, pressures fine. Defect is electrical only.",
    fluidsChecked: true,
    warningLightsClear: false,
    windscreenAndWipersOk: true,
    seatbeltsOk: true,
    childCarSeatsCorrect: true,
    firstAidKitPresent: true,
    grabBagPresent: true,
    insuranceConfirmed: true,
    motValidUntil: "2026-04-22",
    breakdownCoverConfirmed: true,
    passengersExpected: 1,
    incidentsDuringJourney:
      "Vehicle did not leave site. Jordan transferred to Vehicle A for the appointment with no delay to the clinic time.",
    checkOutcome: "Withdrawn from use - defect",
    nextAction:
      "Vehicle keys placed in the 'OUT OF USE' lockbox. Local garage booked for 14:00 today to replace bulb and confirm no further faults. Manager (Darren) and on-call notified. Re-inspection required before next use. MOT also approaching — flagged to fleet diary for renewal in three weeks.",
  },
  {
    id: "vpu_002",
    vehicle: "Vehicle B — Ford Tourneo",
    driver: "staff_chervelle",
    dateTime: `${d(-2)} 18:10`,
    journeyPurpose:
      "Out-of-hours pickup — Casey from athletics club at Memorial Park",
    expectedReturn: `${d(-2)} 19:15`,
    checks: STANDARD_CHECKS(),
    fuelLevel: "1/4",
    mileageStart: 70988,
    mileageEnd: 71012,
    defectsFound: [],
    defectsActionedBy: "",
    tyresChecked: true,
    tyresPressureNotedNotes:
      "Tyres visually checked — all sound. Last gauge reading earlier today on the morning school run.",
    fluidsChecked: true,
    warningLightsClear: true,
    windscreenAndWipersOk: true,
    seatbeltsOk: true,
    childCarSeatsCorrect: true,
    firstAidKitPresent: true,
    grabBagPresent: true,
    insuranceConfirmed: true,
    motValidUntil: "2026-11-02",
    breakdownCoverConfirmed: true,
    passengersExpected: 1,
    incidentsDuringJourney:
      "Uneventful pickup. Casey in good spirits after winning her 800m heat. Refuel flagged on return — booked into morning routine.",
    checkOutcome: "Cleared with minor notes",
    nextAction:
      "Refuel required first thing tomorrow morning — entered onto the early-shift handover.",
  },
  {
    id: "vpu_001",
    vehicle: "Vehicle A — VW Caddy",
    driver: "staff_darren",
    dateTime: `${d(-3)} 14:30`,
    journeyPurpose:
      "Statutory visit — Alex to social worker meeting at the local authority offices",
    expectedReturn: `${d(-3)} 16:30`,
    checks: STANDARD_CHECKS(),
    fuelLevel: "Full",
    mileageStart: 48029,
    mileageEnd: 48080,
    defectsFound: [],
    defectsActionedBy: "",
    tyresChecked: true,
    tyresPressureNotedNotes:
      "Pressures gauged at 32 PSI front, 35 PSI rear. All four tyres in good condition.",
    fluidsChecked: true,
    warningLightsClear: true,
    windscreenAndWipersOk: true,
    seatbeltsOk: true,
    childCarSeatsCorrect: true,
    firstAidKitPresent: true,
    grabBagPresent: true,
    insuranceConfirmed: true,
    motValidUntil: "2026-09-14",
    breakdownCoverConfirmed: true,
    passengersExpected: 1,
    incidentsDuringJourney:
      "Smooth journey both ways. Alex used the time to talk through his expectations of the meeting — useful context fed back to keyworker.",
    checkOutcome: "Cleared for use",
    nextAction: "No follow-up required.",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const outcomeColour = (o: CheckOutcome): string => {
  switch (o) {
    case "Cleared for use":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Cleared with minor notes":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "Withdrawn from use - defect":
      return "bg-rose-100 text-rose-800 border-rose-200";
  }
};

const fuelColour = (f: FuelLevel): string => {
  switch (f) {
    case "Full":
    case "3/4":
      return "text-emerald-700";
    case "1/2":
      return "text-slate-700";
    case "1/4":
      return "text-amber-700";
    case "Refuel needed":
      return "text-rose-700";
  }
};

const formatPretty = (iso: string): string => {
  const datePart = iso.slice(0, 10);
  const date = new Date(datePart);
  const tail = iso.length > 10 ? iso.slice(11) : "";
  const pretty = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return tail ? `${pretty} ${tail}` : pretty;
};

const daysUntil = (iso: string): number => {
  const target = new Date(iso).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today.getTime()) / (1000 * 60 * 60 * 24));
};

// ── Sort options ─────────────────────────────────────────────────────────────
type SortKey =
  | "date_desc"
  | "date_asc"
  | "vehicle"
  | "outcome"
  | "defects_desc";

// ── Page ─────────────────────────────────────────────────────────────────────
export default function VehiclePreUseCheckPage() {
  const [sortKey, setSortKey] = useState<SortKey>("date_desc");
  const [filterVehicle, setFilterVehicle] = useState<string>("all");
  const [filterOutcome, setFilterOutcome] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const vehicleOptions = useMemo(() => {
    const set = new Set(RECORDS.map((r) => r.vehicle));
    return Array.from(set).sort();
  }, []);

  // ── Summary stats ──────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const today = d(0);
    const seven = new Date();
    seven.setDate(seven.getDate() - 7);

    const checksToday = RECORDS.filter((r) =>
      r.dateTime.startsWith(today),
    ).length;

    const defectsThisWeek = RECORDS.filter((r) => {
      const recDate = new Date(r.dateTime.slice(0, 10));
      return recDate >= seven;
    }).reduce((s, r) => s + r.defectsFound.length, 0);

    const withdrawnVehicles = new Set(
      RECORDS.filter((r) => r.checkOutcome === "Withdrawn from use - defect")
        .filter((r) => {
          const recDate = new Date(r.dateTime.slice(0, 10));
          return recDate >= seven;
        })
        .map((r) => r.vehicle),
    );
    const allVehicles = new Set(RECORDS.map((r) => r.vehicle));
    const inService = allVehicles.size - withdrawnVehicles.size;

    const expiring30 = new Set<string>();
    RECORDS.forEach((r) => {
      const days = daysUntil(r.motValidUntil);
      if (days >= 0 && days <= 30) expiring30.add(r.vehicle);
    });

    return {
      checksToday,
      defectsThisWeek,
      inService,
      vehiclesTotal: allVehicles.size,
      expiring30: expiring30.size,
    };
  }, []);

  // ── Filtered + sorted ──────────────────────────────────────────────────────
  const visible = useMemo(() => {
    let list = [...RECORDS];
    if (filterVehicle !== "all") {
      list = list.filter((r) => r.vehicle === filterVehicle);
    }
    if (filterOutcome !== "all") {
      list = list.filter((r) => r.checkOutcome === filterOutcome);
    }
    switch (sortKey) {
      case "date_desc":
        list.sort((a, b) => b.dateTime.localeCompare(a.dateTime));
        break;
      case "date_asc":
        list.sort((a, b) => a.dateTime.localeCompare(b.dateTime));
        break;
      case "vehicle":
        list.sort((a, b) => a.vehicle.localeCompare(b.vehicle));
        break;
      case "outcome": {
        const order: Record<CheckOutcome, number> = {
          "Withdrawn from use - defect": 0,
          "Cleared with minor notes": 1,
          "Cleared for use": 2,
        };
        list.sort(
          (a, b) => order[a.checkOutcome] - order[b.checkOutcome],
        );
        break;
      }
      case "defects_desc":
        list.sort((a, b) => b.defectsFound.length - a.defectsFound.length);
        break;
    }
    return list;
  }, [sortKey, filterVehicle, filterOutcome]);

  // ── Export columns ─────────────────────────────────────────────────────────
  const exportColumns: ExportColumn<VehicleCheck>[] = [
    { header: "ID", accessor: (r: VehicleCheck) => r.id },
    { header: "Date / time", accessor: (r: VehicleCheck) => r.dateTime },
    { header: "Vehicle", accessor: (r: VehicleCheck) => r.vehicle },
    {
      header: "Driver",
      accessor: (r: VehicleCheck) => getStaffName(r.driver),
    },
    {
      header: "Journey purpose",
      accessor: (r: VehicleCheck) => r.journeyPurpose,
    },
    {
      header: "Expected return",
      accessor: (r: VehicleCheck) => r.expectedReturn,
    },
    {
      header: "Passengers expected",
      accessor: (r: VehicleCheck) => String(r.passengersExpected),
    },
    {
      header: "Mileage start",
      accessor: (r: VehicleCheck) => String(r.mileageStart),
    },
    {
      header: "Mileage end",
      accessor: (r: VehicleCheck) =>
        r.mileageEnd != null ? String(r.mileageEnd) : "",
    },
    { header: "Fuel level", accessor: (r: VehicleCheck) => r.fuelLevel },
    {
      header: "Tyres checked",
      accessor: (r: VehicleCheck) => (r.tyresChecked ? "Yes" : "No"),
    },
    {
      header: "Tyre pressure notes",
      accessor: (r: VehicleCheck) => r.tyresPressureNotedNotes,
    },
    {
      header: "Fluids checked",
      accessor: (r: VehicleCheck) => (r.fluidsChecked ? "Yes" : "No"),
    },
    {
      header: "Warning lights clear",
      accessor: (r: VehicleCheck) => (r.warningLightsClear ? "Yes" : "No"),
    },
    {
      header: "Windscreen / wipers OK",
      accessor: (r: VehicleCheck) => (r.windscreenAndWipersOk ? "Yes" : "No"),
    },
    {
      header: "Seatbelts OK",
      accessor: (r: VehicleCheck) => (r.seatbeltsOk ? "Yes" : "No"),
    },
    {
      header: "Child seats correct",
      accessor: (r: VehicleCheck) => (r.childCarSeatsCorrect ? "Yes" : "No"),
    },
    {
      header: "First aid kit present",
      accessor: (r: VehicleCheck) => (r.firstAidKitPresent ? "Yes" : "No"),
    },
    {
      header: "Grab bag present",
      accessor: (r: VehicleCheck) => (r.grabBagPresent ? "Yes" : "No"),
    },
    {
      header: "Insurance confirmed",
      accessor: (r: VehicleCheck) => (r.insuranceConfirmed ? "Yes" : "No"),
    },
    {
      header: "MOT valid until",
      accessor: (r: VehicleCheck) => r.motValidUntil,
    },
    {
      header: "Breakdown cover confirmed",
      accessor: (r: VehicleCheck) =>
        r.breakdownCoverConfirmed ? "Yes" : "No",
    },
    {
      header: "Defects found",
      accessor: (r: VehicleCheck) => r.defectsFound.join(" | "),
    },
    {
      header: "Defects actioned by",
      accessor: (r: VehicleCheck) =>
        r.defectsActionedBy ? getStaffName(r.defectsActionedBy) : "",
    },
    {
      header: "Incidents during journey",
      accessor: (r: VehicleCheck) => r.incidentsDuringJourney,
    },
    {
      header: "Outcome",
      accessor: (r: VehicleCheck) => r.checkOutcome,
    },
    {
      header: "Next action",
      accessor: (r: VehicleCheck) => r.nextAction,
    },
  ];

  return (
    <PageShell
      title="Vehicle Pre-Use Check"
      subtitle="Recorded by the driver before any journey carrying children. Defects withdraw the vehicle from use until rectified and re-inspected."
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton
            data={visible}
            columns={exportColumns}
            filename="vehicle-pre-use-check"
          />
          <PrintButton title="Vehicle Pre-Use Checks" />
        </div>
      }
    >
      {/* Banner */}
      <div className="mb-6 rounded-lg border border-sky-200 bg-sky-50 p-4">
        <div className="flex items-start gap-3">
          <Car className="h-5 w-5 flex-shrink-0 text-sky-700 mt-0.5" />
          <div className="text-sm text-sky-900">
            <p className="font-semibold">
              No journey with a child begins until the pre-use check is
              completed and signed.
            </p>
            <p className="mt-1">
              Drivers complete the walk-round, document defects, and confirm
              insurance, MOT and breakdown cover are in date. Any failed item
              withdraws the vehicle from service until rectified and
              re-inspected. Each check forms part of the evidence base for
              Quality Standard 5 and the home's transport risk assessment.
            </p>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-slate-600 uppercase tracking-wide">
            <CalendarClock className="h-4 w-4" /> Checks today
          </div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">
            {summary.checksToday}
          </div>
          <div className="mt-1 text-xs text-slate-500">recorded so far</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-slate-600 uppercase tracking-wide">
            <AlertTriangle className="h-4 w-4" /> Defects this week
          </div>
          <div
            className={cn(
              "mt-2 text-3xl font-semibold",
              summary.defectsThisWeek === 0
                ? "text-emerald-700"
                : summary.defectsThisWeek <= 2
                  ? "text-amber-700"
                  : "text-rose-700",
            )}
          >
            {summary.defectsThisWeek}
          </div>
          <div className="mt-1 text-xs text-slate-500">last 7 days</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-slate-600 uppercase tracking-wide">
            <ShieldCheck className="h-4 w-4" /> Vehicles in service
          </div>
          <div
            className={cn(
              "mt-2 text-3xl font-semibold",
              summary.inService === summary.vehiclesTotal
                ? "text-emerald-700"
                : "text-amber-700",
            )}
          >
            {summary.inService}
            <span className="text-base font-normal text-slate-500">
              {" "}
              / {summary.vehiclesTotal}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            currently cleared for use
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-slate-600 uppercase tracking-wide">
            <FileText className="h-4 w-4" /> Insurance / MOT (30d)
          </div>
          <div
            className={cn(
              "mt-2 text-3xl font-semibold",
              summary.expiring30 === 0 ? "text-emerald-700" : "text-amber-700",
            )}
          >
            {summary.expiring30}
          </div>
          <div className="mt-1 text-xs text-slate-500">expiring within 30 days</div>
        </div>
      </div>

      {/* Filters / sort */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600">Vehicle</span>
          <Select value={filterVehicle} onValueChange={setFilterVehicle}>
            <SelectTrigger className="w-[220px] h-9">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All vehicles</SelectItem>
              {vehicleOptions.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600">Outcome</span>
          <Select value={filterOutcome} onValueChange={setFilterOutcome}>
            <SelectTrigger className="w-[220px] h-9">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All outcomes</SelectItem>
              <SelectItem value="Cleared for use">Cleared for use</SelectItem>
              <SelectItem value="Cleared with minor notes">
                Cleared with minor notes
              </SelectItem>
              <SelectItem value="Withdrawn from use - defect">
                Withdrawn from use
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-medium text-slate-600">Sort by</span>
          <Select
            value={sortKey}
            onValueChange={(v: string) => setSortKey(v as SortKey)}
          >
            <SelectTrigger className="w-[220px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Date (newest first)</SelectItem>
              <SelectItem value="date_asc">Date (oldest first)</SelectItem>
              <SelectItem value="vehicle">Vehicle (A → Z)</SelectItem>
              <SelectItem value="outcome">Outcome (worst first)</SelectItem>
              <SelectItem value="defects_desc">
                Defects (most first)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto text-xs text-slate-500">
          Showing {visible.length} of {RECORDS.length}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {visible.map((r) => {
          const isOpen = expandedId === r.id;
          const passed = r.checks.filter((c) => c.pass).length;
          const motDays = daysUntil(r.motValidUntil);
          return (
            <div
              key={r.id}
              className="rounded-lg border border-slate-200 bg-white shadow-sm"
            >
              {/* Header */}
              <button
                type="button"
                onClick={() =>
                  setExpandedId((current) => (current === r.id ? null : r.id))
                }
                className="flex w-full items-start justify-between gap-4 p-4 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      {r.vehicle}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-xs font-medium",
                        outcomeColour(r.checkOutcome),
                      )}
                    >
                      {r.checkOutcome}
                    </span>
                    {r.defectsFound.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-800">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {r.defectsFound.length} defect
                        {r.defectsFound.length === 1 ? "" : "s"}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-slate-700">
                      {passed}/{r.checks.length} checks pass
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {formatPretty(r.dateTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {getStaffName(r.driver)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {r.journeyPurpose}
                    </span>
                    <span
                      className={cn(
                        "flex items-center gap-1 font-medium",
                        fuelColour(r.fuelLevel),
                      )}
                    >
                      <Fuel className="h-3.5 w-3.5" />
                      {r.fuelLevel}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 pt-1">
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Body */}
              {isOpen && (
                <div className="border-t border-slate-200 p-4 space-y-5">
                  {/* Journey summary */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-md border border-slate-200 p-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <Clock className="h-4 w-4" /> Expected return
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {formatPretty(r.expectedReturn)}
                      </div>
                    </div>
                    <div className="rounded-md border border-slate-200 p-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <Users className="h-4 w-4" /> Passengers expected
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {r.passengersExpected}
                      </div>
                    </div>
                    <div className="rounded-md border border-slate-200 p-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <Gauge className="h-4 w-4" /> Mileage
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {r.mileageStart.toLocaleString("en-GB")}
                        {r.mileageEnd != null && (
                          <>
                            {" → "}
                            {r.mileageEnd.toLocaleString("en-GB")}
                            <span className="ml-1 text-xs text-slate-500">
                              ({r.mileageEnd - r.mileageStart} mi)
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Documentation strip */}
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div
                      className={cn(
                        "rounded-md border p-3",
                        r.insuranceConfirmed
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-rose-200 bg-rose-50",
                      )}
                    >
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <ShieldCheck className="h-4 w-4" /> Insurance
                      </div>
                      <div
                        className={cn(
                          "mt-1 text-sm font-semibold",
                          r.insuranceConfirmed
                            ? "text-emerald-800"
                            : "text-rose-800",
                        )}
                      >
                        {r.insuranceConfirmed ? "Confirmed" : "Not confirmed"}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "rounded-md border p-3",
                        motDays < 0
                          ? "border-rose-200 bg-rose-50"
                          : motDays <= 30
                            ? "border-amber-200 bg-amber-50"
                            : "border-emerald-200 bg-emerald-50",
                      )}
                    >
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <FileText className="h-4 w-4" /> MOT valid until
                      </div>
                      <div
                        className={cn(
                          "mt-1 text-sm font-semibold",
                          motDays < 0
                            ? "text-rose-800"
                            : motDays <= 30
                              ? "text-amber-800"
                              : "text-emerald-800",
                        )}
                      >
                        {formatPretty(r.motValidUntil)}
                        <span className="ml-1 text-xs font-normal">
                          (
                          {motDays < 0
                            ? `${Math.abs(motDays)}d overdue`
                            : `${motDays}d`}
                          )
                        </span>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "rounded-md border p-3",
                        r.breakdownCoverConfirmed
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-rose-200 bg-rose-50",
                      )}
                    >
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <Wrench className="h-4 w-4" /> Breakdown cover
                      </div>
                      <div
                        className={cn(
                          "mt-1 text-sm font-semibold",
                          r.breakdownCoverConfirmed
                            ? "text-emerald-800"
                            : "text-rose-800",
                        )}
                      >
                        {r.breakdownCoverConfirmed
                          ? "Confirmed"
                          : "Not confirmed"}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "rounded-md border p-3",
                        r.childCarSeatsCorrect
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-rose-200 bg-rose-50",
                      )}
                    >
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <Heart className="h-4 w-4" /> Child seats
                      </div>
                      <div
                        className={cn(
                          "mt-1 text-sm font-semibold",
                          r.childCarSeatsCorrect
                            ? "text-emerald-800"
                            : "text-rose-800",
                        )}
                      >
                        {r.childCarSeatsCorrect ? "Correctly fitted" : "Issue"}
                      </div>
                    </div>
                  </div>

                  {/* Quick yes/no row */}
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {[
                      {
                        label: "Tyres checked",
                        ok: r.tyresChecked,
                        Icon: CircleDot,
                      },
                      {
                        label: "Fluids checked",
                        ok: r.fluidsChecked,
                        Icon: Wrench,
                      },
                      {
                        label: "Warning lights clear",
                        ok: r.warningLightsClear,
                        Icon: Lightbulb,
                      },
                      {
                        label: "Windscreen / wipers",
                        ok: r.windscreenAndWipersOk,
                        Icon: Eye,
                      },
                      {
                        label: "Seatbelts",
                        ok: r.seatbeltsOk,
                        Icon: ShieldCheck,
                      },
                      {
                        label: "First aid kit",
                        ok: r.firstAidKitPresent,
                        Icon: Briefcase,
                      },
                      {
                        label: "Grab bag",
                        ok: r.grabBagPresent,
                        Icon: Briefcase,
                      },
                    ].map(({ label, ok, Icon }) => (
                      <div
                        key={label}
                        className={cn(
                          "rounded-md border p-3",
                          ok
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-rose-200 bg-rose-50",
                        )}
                      >
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                          <Icon className="h-4 w-4" /> {label}
                        </div>
                        <div
                          className={cn(
                            "mt-1 text-sm font-semibold",
                            ok ? "text-emerald-800" : "text-rose-800",
                          )}
                        >
                          {ok ? "OK" : "Issue"}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Walk-round checks */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-2">
                      <Wrench className="h-4 w-4" /> Walk-round checks
                    </h3>
                    <div className="rounded-md border border-slate-200">
                      <ul className="divide-y divide-slate-100">
                        {r.checks.map((it, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 px-3 py-2 text-sm"
                          >
                            {it.pass ? (
                              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600 mt-0.5" />
                            ) : (
                              <XCircle className="h-4 w-4 flex-shrink-0 text-rose-600 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <div
                                className={cn(
                                  "text-slate-800",
                                  !it.pass && "font-medium",
                                )}
                              >
                                {it.item}
                              </div>
                              {it.notes && (
                                <div className="mt-1 text-xs text-slate-600 italic">
                                  {it.notes}
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Tyre pressure note */}
                  {r.tyresPressureNotedNotes && (
                    <div className="rounded-md border border-slate-200 p-3">
                      <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <CircleDot className="h-4 w-4" /> Tyre pressure note
                      </h4>
                      <p className="mt-1 text-sm text-slate-700">
                        {r.tyresPressureNotedNotes}
                      </p>
                    </div>
                  )}

                  {/* Defects */}
                  {r.defectsFound.length > 0 && (
                    <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
                      <h4 className="text-sm font-semibold text-rose-900 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" /> Defects found
                      </h4>
                      <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-rose-900">
                        {r.defectsFound.map((dft, i) => (
                          <li key={i}>{dft}</li>
                        ))}
                      </ul>
                      {r.defectsActionedBy && (
                        <p className="mt-2 text-xs text-rose-800">
                          Actioned by:{" "}
                          <span className="font-medium">
                            {getStaffName(r.defectsActionedBy)}
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Incidents */}
                  <div className="rounded-md border border-slate-200 p-3">
                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Incidents during journey
                    </h4>
                    <p className="mt-1 text-sm text-slate-700">
                      {r.incidentsDuringJourney}
                    </p>
                  </div>

                  {/* Next action */}
                  <div className="rounded-md border border-indigo-200 bg-indigo-50 p-3">
                    <h4 className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" /> Next action
                    </h4>
                    <p className="mt-1 text-sm text-indigo-900">
                      {r.nextAction}
                    </p>
                  </div>

                  {/* Footer line */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-500 border-t border-slate-100 pt-3">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      Record ID: {r.id}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      Driver: {getStaffName(r.driver)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {visible.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No pre-use checks match the current filters.
          </div>
        )}
      </div>

      {/* Regulatory note */}
      <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <BookOpen className="h-4 w-4" /> Regulatory basis
        </h3>
        <p>
          The Children's Homes (England) Regulations 2015 — Quality Standard 5
          (Health and Wellbeing) requires the Registered Manager to ensure that
          children are kept safe whenever they are travelling with staff. The
          home's transport policy and accompanying transport risk assessment
          require a documented pre-use check by the driver before any journey
          carrying a child, with vehicles withdrawn from use until any defect is
          rectified and re-inspected. Pre-use check records evidence
          roadworthiness, valid insurance and MOT, correctly fitted child
          seats, and that the journey was driven by an approved driver — and
          feed the Reg 45 quality of care review and the SCCIF self-evaluation.
        </p>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
