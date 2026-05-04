"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — TRANSPORT LOG
// Records all journeys transporting young people — driver details, vehicle,
// mileage, purpose, incidents during transport. Regulation 12 compliance,
// insurance tracking, driver licence check records. Essential for audit trail
// and safeguarding during transport.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  Car, CheckCircle2, Clock, MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

// ── Types ────────────────────────────────────────────────────────────────────

type Purpose = "school_run" | "appointment" | "contact_visit" | "activity" | "emergency" | "respite_transport" | "court" | "other";
type Behaviour = "calm" | "unsettled" | "distressed" | "aggressive" | "mixed";
type Status = "completed" | "in_progress" | "cancelled" | "incident_reported";

interface TransportEntry {
  id: string;
  date: string;
  driver: string;
  driverLicenceChecked: boolean;
  vehicle: string;
  vehicleChecked: boolean;
  passengers: { youngPersonId: string; seatbeltWorn: boolean; boosterSeat: boolean }[];
  additionalStaff: string[];
  purpose: Purpose;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  returnTime: string | null;
  mileageStart: number;
  mileageEnd: number;
  routeTaken: string;
  incidentDuringJourney: boolean;
  incidentDetails: string | null;
  behaviourDuringJourney: Behaviour;
  behaviourNotes: string;
  fuelAdded: boolean;
  fuelAmount: number | null;
  fuelCost: number | null;
  notes: string;
  status: Status;
}

// ── Config ───────────────────────────────────────────────────────────────────

const PURPOSE_META: Record<Purpose, { label: string; colour: string }> = {
  school_run:         { label: "School Run",         colour: "bg-blue-100 text-blue-700" },
  appointment:        { label: "Appointment",        colour: "bg-purple-100 text-purple-700" },
  contact_visit:      { label: "Contact Visit",      colour: "bg-teal-100 text-teal-700" },
  activity:           { label: "Activity",           colour: "bg-green-100 text-green-700" },
  emergency:          { label: "Emergency",          colour: "bg-red-100 text-red-700" },
  respite_transport:  { label: "Respite Transport",  colour: "bg-indigo-100 text-indigo-700" },
  court:              { label: "Court",              colour: "bg-gray-100 text-gray-700" },
  other:              { label: "Other",              colour: "bg-slate-100 text-slate-700" },
};

const BEHAVIOUR_META: Record<Behaviour, { label: string; colour: string }> = {
  calm:       { label: "Calm",       colour: "bg-green-100 text-green-700" },
  unsettled:  { label: "Unsettled",  colour: "bg-yellow-100 text-yellow-700" },
  distressed: { label: "Distressed", colour: "bg-red-100 text-red-700" },
  aggressive: { label: "Aggressive", colour: "bg-red-100 text-red-800" },
  mixed:      { label: "Mixed",      colour: "bg-amber-100 text-amber-700" },
};

const STATUS_META: Record<Status, { label: string; colour: string }> = {
  completed:         { label: "Completed",         colour: "bg-green-100 text-green-700" },
  in_progress:       { label: "In Progress",       colour: "bg-blue-100 text-blue-700" },
  cancelled:         { label: "Cancelled",         colour: "bg-gray-100 text-gray-700" },
  incident_reported: { label: "Incident Reported", colour: "bg-red-100 text-red-700" },
};

const VEHICLES = [
  "Ford Transit - KY69 ABC",
  "VW Caddy - KY71 XYZ",
];

// ── Seed Data ────────────────────────────────────────────────────────────────

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const SEED: TransportEntry[] = [
  {
    id: "trn_001", date: d(-1), driver: "staff_anna", driverLicenceChecked: true,
    vehicle: "Ford Transit - KY69 ABC", vehicleChecked: true,
    passengers: [{ youngPersonId: "yp_alex", seatbeltWorn: true, boosterSeat: false }],
    additionalStaff: [],
    purpose: "school_run", destination: "Broadfield Academy",
    departureTime: "08:15", arrivalTime: "08:35", returnTime: "08:55",
    mileageStart: 45230, mileageEnd: 45238.4,
    routeTaken: "Oak House > A52 > Broadfield Academy > return same route",
    incidentDuringJourney: false, incidentDetails: null,
    behaviourDuringJourney: "calm", behaviourNotes: "Alex was relaxed, listened to music on the way. No concerns.",
    fuelAdded: false, fuelAmount: null, fuelCost: null,
    notes: "Routine morning school run. Arrived on time.",
    status: "completed",
  },
  {
    id: "trn_002", date: d(-2), driver: "staff_ryan", driverLicenceChecked: true,
    vehicle: "VW Caddy - KY71 XYZ", vehicleChecked: true,
    passengers: [{ youngPersonId: "yp_jordan", seatbeltWorn: true, boosterSeat: false }],
    additionalStaff: [],
    purpose: "appointment", destination: "CAMHS - Royal Derby Hospital",
    departureTime: "13:30", arrivalTime: "14:00", returnTime: "15:45",
    mileageStart: 31200, mileageEnd: 31225.2,
    routeTaken: "Oak House > A38 > Royal Derby Hospital > return via A52",
    incidentDuringJourney: false, incidentDetails: null,
    behaviourDuringJourney: "unsettled",
    behaviourNotes: "Jordan was quiet on the way there. On the return journey became unsettled — fidgeting, asking repeated questions about when next appointment would be. Staff provided reassurance.",
    fuelAdded: false, fuelAmount: null, fuelCost: null,
    notes: "CAMHS review appointment. Jordan engaged well with clinician. Unsettled on return journey but no escalation.",
    status: "completed",
  },
  {
    id: "trn_003", date: d(-3), driver: "staff_darren", driverLicenceChecked: true,
    vehicle: "Ford Transit - KY69 ABC", vehicleChecked: true,
    passengers: [{ youngPersonId: "yp_casey", seatbeltWorn: true, boosterSeat: false }],
    additionalStaff: ["staff_chervelle"],
    purpose: "contact_visit", destination: "Derby Family Centre",
    departureTime: "10:00", arrivalTime: "10:25", returnTime: "12:40",
    mileageStart: 45210, mileageEnd: 45226.6,
    routeTaken: "Oak House > Uttoxeter Road > Derby Family Centre > return same route",
    incidentDuringJourney: false, incidentDetails: null,
    behaviourDuringJourney: "mixed",
    behaviourNotes: "Casey was excited on the way to contact but became tearful on the return. Chervelle sat in the back and provided emotional support. Casey settled after 10 minutes.",
    fuelAdded: false, fuelAmount: null, fuelCost: null,
    notes: "Supervised contact session with birth mother. Two staff present as per care plan. Casey required support post-contact.",
    status: "completed",
  },
  {
    id: "trn_004", date: d(-4), driver: "staff_edward", driverLicenceChecked: true,
    vehicle: "VW Caddy - KY71 XYZ", vehicleChecked: true,
    passengers: [
      { youngPersonId: "yp_alex", seatbeltWorn: true, boosterSeat: false },
      { youngPersonId: "yp_jordan", seatbeltWorn: true, boosterSeat: false },
    ],
    additionalStaff: ["staff_anna"],
    purpose: "activity", destination: "INTU Derby - Odeon Cinema",
    departureTime: "14:00", arrivalTime: "14:25", returnTime: "17:30",
    mileageStart: 31170, mileageEnd: 31200.2,
    routeTaken: "Oak House > A52 > INTU Derby > return via ring road",
    incidentDuringJourney: false, incidentDetails: null,
    behaviourDuringJourney: "calm",
    behaviourNotes: "Both young people were in good spirits. Chatted happily about the film on the way back. No concerns.",
    fuelAdded: true, fuelAmount: 38, fuelCost: 45.20,
    notes: "Cinema trip as weekend activity. Fuel added at Tesco petrol station on return. Receipt kept for petty cash.",
    status: "completed",
  },
  {
    id: "trn_005", date: d(-1), driver: "staff_darren", driverLicenceChecked: true,
    vehicle: "Ford Transit - KY69 ABC", vehicleChecked: false,
    passengers: [{ youngPersonId: "yp_casey", seatbeltWorn: true, boosterSeat: false }],
    additionalStaff: [],
    purpose: "emergency", destination: "Royal Derby Hospital A&E",
    departureTime: "21:10", arrivalTime: "21:25", returnTime: null,
    mileageStart: 45238.4, mileageEnd: 45252,
    routeTaken: "Oak House > A38 > Royal Derby Hospital A&E (quickest route)",
    incidentDuringJourney: true,
    incidentDetails: "Casey attempted to open the passenger door while the vehicle was in motion on the A38. Door was child-locked. Staff pulled over safely and provided verbal reassurance. Casey was crying and repeatedly stating 'I want to go home.' Journey resumed after 5 minutes when Casey was calmer. Incident reported to on-call manager immediately.",
    behaviourDuringJourney: "distressed",
    behaviourNotes: "Casey was highly distressed throughout the journey. Crying, shouting, and attempted to open the door. Required constant verbal reassurance. Staff maintained calm throughout.",
    fuelAdded: false, fuelAmount: null, fuelCost: null,
    notes: "Emergency trip following Casey reporting severe stomach pain. Pre-journey vehicle check not completed due to urgency. On-call manager (Ryan) notified. Social worker informed the following morning.",
    status: "incident_reported",
  },
];

// ── Export Columns ───────────────────────────────────────────────────────────

const EXPORT_COLS: ExportColumn<TransportEntry>[] = [
  { header: "ID",                accessor: (r: TransportEntry) => r.id },
  { header: "Date",              accessor: (r: TransportEntry) => r.date },
  { header: "Driver",            accessor: (r: TransportEntry) => getStaffName(r.driver) },
  { header: "Vehicle",           accessor: (r: TransportEntry) => r.vehicle },
  { header: "Purpose",           accessor: (r: TransportEntry) => PURPOSE_META[r.purpose].label },
  { header: "Destination",       accessor: (r: TransportEntry) => r.destination },
  { header: "Passengers",        accessor: (r: TransportEntry) => r.passengers.map(p => getYPName(p.youngPersonId)).join(", ") },
  { header: "Departure",         accessor: (r: TransportEntry) => r.departureTime },
  { header: "Arrival",           accessor: (r: TransportEntry) => r.arrivalTime },
  { header: "Return",            accessor: (r: TransportEntry) => r.returnTime || "N/A" },
  { header: "Mileage (Total)",   accessor: (r: TransportEntry) => (r.mileageEnd - r.mileageStart).toFixed(1) },
  { header: "Behaviour",         accessor: (r: TransportEntry) => BEHAVIOUR_META[r.behaviourDuringJourney].label },
  { header: "Incident",          accessor: (r: TransportEntry) => r.incidentDuringJourney ? "Yes" : "No" },
  { header: "Status",            accessor: (r: TransportEntry) => STATUS_META[r.status].label },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function TransportLogPage() {
  const [entries, setEntries] = useState<TransportEntry[]>(SEED);
  const [search, setSearch] = useState("");
  const [purposeFilter, setPurposeFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [driverFilter, setDriverFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  // ── new journey form state ─────────────────────────────────────────────────
  const [nDate, setNDate] = useState("");
  const [nDriver, setNDriver] = useState("");
  const [nVehicle, setNVehicle] = useState("");
  const [nPurpose, setNPurpose] = useState<Purpose | "">("");
  const [nDestination, setNDestination] = useState("");
  const [nPassengers, setNPassengers] = useState("");
  const [nDepartureTime, setNDepartureTime] = useState("");
  const [nArrivalTime, setNArrivalTime] = useState("");
  const [nMileageStart, setNMileageStart] = useState("");
  const [nMileageEnd, setNMileageEnd] = useState("");
  const [nRoute, setNRoute] = useState("");
  const [nBehaviour, setNBehaviour] = useState<Behaviour | "">("");
  const [nBehaviourNotes, setNBehaviourNotes] = useState("");
  const [nNotes, setNNotes] = useState("");

  // ── derived lists ──────────────────────────────────────────────────────────
  const driverIds = useMemo(() => [...new Set(entries.map(e => e.driver))], [entries]);
  const vehicleNames = useMemo(() => [...new Set(entries.map(e => e.vehicle))], [entries]);

  // ── filtering & sorting ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...entries];
    if (purposeFilter !== "all") list = list.filter(e => e.purpose === purposeFilter);
    if (vehicleFilter !== "all") list = list.filter(e => e.vehicle === vehicleFilter);
    if (driverFilter !== "all") list = list.filter(e => e.driver === driverFilter);
    if (statusFilter !== "all") list = list.filter(e => e.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.destination.toLowerCase().includes(q) ||
        getStaffName(e.driver).toLowerCase().includes(q) ||
        e.passengers.some(p => getYPName(p.youngPersonId).toLowerCase().includes(q)) ||
        e.vehicle.toLowerCase().includes(q) ||
        e.notes.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "newest": return b.date.localeCompare(a.date) || b.departureTime.localeCompare(a.departureTime);
        case "oldest": return a.date.localeCompare(b.date) || a.departureTime.localeCompare(b.departureTime);
        case "mileage": return (b.mileageEnd - b.mileageStart) - (a.mileageEnd - a.mileageStart);
        default: return 0;
      }
    });
    return list;
  }, [entries, search, purposeFilter, vehicleFilter, driverFilter, statusFilter, sortBy]);

  // ── summary stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const thisMonth = entries.filter(e => e.date >= monthStart);
    const totalMileage = thisMonth.reduce((sum, e) => sum + (e.mileageEnd - e.mileageStart), 0);
    const incidents = thisMonth.filter(e => e.incidentDuringJourney).length;
    const daysInMonth = now.getDate();
    const avgPerDay = daysInMonth > 0 ? (thisMonth.length / daysInMonth).toFixed(1) : "0";
    return {
      totalJourneys: thisMonth.length,
      totalMileage: totalMileage.toFixed(1),
      incidents,
      avgPerDay,
    };
  }, [entries]);

  // ── vehicle summaries ──────────────────────────────────────────────────────
  const vehicleSummaries = useMemo(() => {
    const map = new Map<string, { journeys: number; mileage: number; fuelCost: number; lastCheck: string }>();
    entries.forEach(e => {
      const cur = map.get(e.vehicle) || { journeys: 0, mileage: 0, fuelCost: 0, lastCheck: "—" };
      cur.journeys++;
      cur.mileage += e.mileageEnd - e.mileageStart;
      if (e.fuelCost) cur.fuelCost += e.fuelCost;
      if (e.vehicleChecked && (cur.lastCheck === "—" || e.date > cur.lastCheck)) cur.lastCheck = e.date;
      map.set(e.vehicle, cur);
    });
    return map;
  }, [entries]);

  // ── monthly mileage by vehicle ─────────────────────────────────────────────
  const monthlyMileage = useMemo(() => {
    const map = new Map<string, number>();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    entries.filter(e => e.date >= monthStart).forEach(e => {
      const cur = map.get(e.vehicle) || 0;
      map.set(e.vehicle, cur + (e.mileageEnd - e.mileageStart));
    });
    return map;
  }, [entries]);

  // ── create handler ─────────────────────────────────────────────────────────
  const handleCreate = () => {
    if (!nDriver || !nVehicle || !nPurpose || !nDestination || !nDepartureTime) return;
    const entry: TransportEntry = {
      id: `trn_${Date.now()}`,
      date: nDate || new Date().toISOString().slice(0, 10),
      driver: nDriver,
      driverLicenceChecked: true,
      vehicle: nVehicle,
      vehicleChecked: true,
      passengers: nPassengers
        ? nPassengers.split(",").map(id => ({ youngPersonId: id.trim(), seatbeltWorn: true, boosterSeat: false }))
        : [],
      additionalStaff: [],
      purpose: nPurpose as Purpose,
      destination: nDestination,
      departureTime: nDepartureTime,
      arrivalTime: nArrivalTime || nDepartureTime,
      returnTime: null,
      mileageStart: parseFloat(nMileageStart) || 0,
      mileageEnd: parseFloat(nMileageEnd) || 0,
      routeTaken: nRoute,
      incidentDuringJourney: false,
      incidentDetails: null,
      behaviourDuringJourney: (nBehaviour as Behaviour) || "calm",
      behaviourNotes: nBehaviourNotes,
      fuelAdded: false,
      fuelAmount: null,
      fuelCost: null,
      notes: nNotes,
      status: "completed",
    };
    setEntries(prev => [entry, ...prev]);
    setShowNew(false);
    setNDate(""); setNDriver(""); setNVehicle(""); setNPurpose("");
    setNDestination(""); setNPassengers(""); setNDepartureTime("");
    setNArrivalTime(""); setNMileageStart(""); setNMileageEnd("");
    setNRoute(""); setNBehaviour(""); setNBehaviourNotes(""); setNNotes("");
  };

  // ── helpers ────────────────────────────────────────────────────────────────
  const mileageTotal = (e: TransportEntry) => (e.mileageEnd - e.mileageStart).toFixed(1);

  return (
    <PageShell
      title="Transport Log"
      subtitle="Journey records, mileage tracking & safeguarding during transport"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Transport Log" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="transport-log" />
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Journey
          </Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">

        {/* ── Summary Strip ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Journeys This Month", value: stats.totalJourneys, icon: <Car className="h-4 w-4" />,            color: "text-blue-600" },
            { label: "Total Mileage",       value: `${stats.totalMileage} mi`, icon: <MapPin className="h-4 w-4" />,   color: "text-purple-600" },
            { label: "Incidents Reported",  value: stats.incidents, icon: <Filter className="h-4 w-4" />,              color: stats.incidents > 0 ? "text-red-600" : "text-green-600" },
            { label: "Avg Journeys/Day",    value: stats.avgPerDay, icon: <Clock className="h-4 w-4" />,               color: "text-amber-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-muted", s.color)}>{s.icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Vehicle Summary Cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...vehicleSummaries.entries()].map(([vehicle, data]) => (
            <Card key={vehicle}>
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  {vehicle}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Journeys</p>
                    <p className="font-semibold">{data.journeys}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Mileage</p>
                    <p className="font-semibold">{data.mileage.toFixed(1)} mi</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fuel Costs</p>
                    <p className="font-semibold">{data.fuelCost > 0 ? `£${data.fuelCost.toFixed(2)}` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Pre-Journey Check</p>
                    <p className="font-semibold">{data.lastCheck}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Filter Bar ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search journeys..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={purposeFilter} onValueChange={setPurposeFilter}>
            <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Purpose" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Purposes</SelectItem>
              {(Object.entries(PURPOSE_META) as [Purpose, { label: string }][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
            <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Vehicle" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vehicles</SelectItem>
              {vehicleNames.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={driverFilter} onValueChange={setDriverFilter}>
            <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Driver" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Drivers</SelectItem>
              {driverIds.map(id => <SelectItem key={id} value={id}>{getStaffName(id)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {(Object.entries(STATUS_META) as [Status, { label: string }][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="mileage">Most Mileage</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {filtered.length} journey{filtered.length !== 1 ? "s" : ""}
          {(search || purposeFilter !== "all" || vehicleFilter !== "all" || driverFilter !== "all" || statusFilter !== "all") && " (filtered)"}
        </p>

        {/* ── Journey Cards ─────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Car className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="font-medium">No journeys found</p>
            </div>
          )}

          {filtered.map(entry => {
            const isOpen = expandedId === entry.id;
            const pm = PURPOSE_META[entry.purpose];
            const bm = BEHAVIOUR_META[entry.behaviourDuringJourney];
            const sm = STATUS_META[entry.status];
            const isIncident = entry.incidentDuringJourney;
            const borderColour = isIncident ? "border-l-red-500" : entry.status === "in_progress" ? "border-l-blue-400" : "border-l-green-400";

            return (
              <div
                key={entry.id}
                className={cn("rounded-lg border bg-card overflow-hidden border-l-4", borderColour)}
              >
                {/* ── Header row ────────────────────────────────────────────── */}
                <button
                  onClick={() => setExpandedId(isOpen ? null : entry.id)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge className={cn("text-xs", pm.colour)}>{pm.label}</Badge>
                      <Badge className={cn("text-xs", sm.colour)}>{sm.label}</Badge>
                      {isIncident && <Badge variant="destructive" className="text-xs">Incident</Badge>}
                    </div>
                    <p className="font-medium text-sm">{entry.destination}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                      <span>{entry.date}</span>
                      <span>{entry.departureTime} — {entry.arrivalTime}</span>
                      <span className="flex items-center gap-1"><Car className="h-3 w-3" />{entry.vehicle.split(" - ")[1]}</span>
                      <span>Driver: {getStaffName(entry.driver)}</span>
                      <span>{mileageTotal(entry)} mi</span>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
                </button>

                {/* ── Expanded content ──────────────────────────────────────── */}
                {isOpen && (
                  <div className="border-t px-4 py-3 space-y-4 bg-muted/30 text-sm">

                    {/* Passengers */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Passengers</p>
                      <div className="flex flex-wrap gap-2">
                        {entry.passengers.map((p, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs border rounded px-2 py-1 bg-background">
                            <span className="font-medium">{getYPName(p.youngPersonId)}</span>
                            {p.seatbeltWorn && <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 px-1">Seatbelt</Badge>}
                            {p.boosterSeat && <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 px-1">Booster</Badge>}
                          </div>
                        ))}
                      </div>
                      {entry.additionalStaff.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Additional staff: {entry.additionalStaff.map(id => getStaffName(id)).join(", ")}
                        </p>
                      )}
                    </div>

                    {/* Route & Mileage */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Route Taken</p>
                        <p className="text-xs">{entry.routeTaken}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Mileage</p>
                        <div className="flex items-center gap-3 text-xs">
                          <span>Start: {entry.mileageStart.toLocaleString()}</span>
                          <span className="text-muted-foreground">→</span>
                          <span>End: {entry.mileageEnd.toLocaleString()}</span>
                          <Badge variant="outline" className="text-xs font-semibold">{mileageTotal(entry)} miles</Badge>
                        </div>
                      </div>
                    </div>

                    {/* Times */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Departure</p>
                        <p className="text-xs">{entry.departureTime}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Arrival</p>
                        <p className="text-xs">{entry.arrivalTime}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Return</p>
                        <p className="text-xs">{entry.returnTime || "Not recorded"}</p>
                      </div>
                    </div>

                    {/* Behaviour */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Behaviour During Journey</p>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={cn("text-xs", bm.colour)}>{bm.label}</Badge>
                      </div>
                      {entry.behaviourNotes && <p className="text-xs">{entry.behaviourNotes}</p>}
                    </div>

                    {/* Incident section */}
                    {isIncident && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-red-800 uppercase mb-1">Incident During Journey</p>
                        <p className="text-xs text-red-900">{entry.incidentDetails}</p>
                      </div>
                    )}

                    {/* Fuel section */}
                    {entry.fuelAdded && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-blue-800 uppercase mb-1">Fuel Added</p>
                        <div className="flex items-center gap-4 text-xs text-blue-900">
                          {entry.fuelAmount && <span>{entry.fuelAmount}L</span>}
                          {entry.fuelCost && <span>£{entry.fuelCost.toFixed(2)}</span>}
                        </div>
                      </div>
                    )}

                    {/* Pre-journey checks */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        {entry.driverLicenceChecked
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          : <Filter className="h-3.5 w-3.5 text-red-600" />}
                        <span>Driver licence checked</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        {entry.vehicleChecked
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          : <Filter className="h-3.5 w-3.5 text-red-600" />}
                        <span>Pre-journey vehicle check</span>
                      </div>
                    </div>

                    {/* Notes */}
                    {entry.notes && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Notes</p>
                        <p className="text-xs">{entry.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Monthly Mileage Summary ───────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Mileage Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Vehicle</th>
                    <th className="text-right py-2 px-4 font-medium text-muted-foreground">Journeys</th>
                    <th className="text-right py-2 px-4 font-medium text-muted-foreground">Mileage</th>
                    <th className="text-right py-2 pl-4 font-medium text-muted-foreground">Fuel Costs</th>
                  </tr>
                </thead>
                <tbody>
                  {[...vehicleSummaries.entries()].map(([vehicle, data]) => (
                    <tr key={vehicle} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{vehicle}</td>
                      <td className="py-2 px-4 text-right">{data.journeys}</td>
                      <td className="py-2 px-4 text-right">{(monthlyMileage.get(vehicle) || 0).toFixed(1)} mi</td>
                      <td className="py-2 pl-4 text-right">{data.fuelCost > 0 ? `£${data.fuelCost.toFixed(2)}` : "—"}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="py-2 pr-4">Total</td>
                    <td className="py-2 px-4 text-right">{entries.length}</td>
                    <td className="py-2 px-4 text-right">{stats.totalMileage} mi</td>
                    <td className="py-2 pl-4 text-right">
                      £{[...vehicleSummaries.values()].reduce((s, v) => s + v.fuelCost, 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ── Regulatory Note ───────────────────────────────────────────────── */}
        <div className="rounded-lg border border-dashed p-4">
          <div className="flex items-start gap-3">
            <Car className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-semibold">Regulatory Context</p>
              <p>
                <strong>Regulation 12 (Protection of Children)</strong> requires that all transport of
                looked-after children is conducted safely with appropriate checks. Driver licence validity must
                be confirmed before every journey. Vehicles must have valid MOT, insurance, and tax. Pre-journey
                checks should be completed and documented. Business insurance must cover the transport of children
                in care. Any incidents during transport must be recorded, reported to the placing authority, and
                reviewed by the Registered Manager within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ══ New Journey Dialog ══════════════════════════════════════════════ */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record New Journey</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium mb-1 block">Date *</Label>
                <Input type="date" value={nDate} onChange={e => setNDate(e.target.value)} />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 block">Driver *</Label>
                <Select value={nDriver} onValueChange={setNDriver}>
                  <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                  <SelectContent>
                    {["staff_darren", "staff_ryan", "staff_edward", "staff_anna", "staff_chervelle", "staff_diane", "staff_lackson", "staff_mirela"].map(id => (
                      <SelectItem key={id} value={id}>{getStaffName(id)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium mb-1 block">Vehicle *</Label>
                <Select value={nVehicle} onValueChange={setNVehicle}>
                  <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                  <SelectContent>
                    {VEHICLES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 block">Purpose *</Label>
                <Select value={nPurpose} onValueChange={v => setNPurpose(v as Purpose)}>
                  <SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(PURPOSE_META) as [Purpose, { label: string }][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block">Destination *</Label>
              <Input placeholder="e.g. Broadfield Academy" value={nDestination} onChange={e => setNDestination(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block">Passengers (YP IDs, comma separated)</Label>
              <Select value={nPassengers} onValueChange={setNPassengers}>
                <SelectTrigger><SelectValue placeholder="Select young person" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
                  <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
                  <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
                  <SelectItem value="yp_alex,yp_jordan">{getYPName("yp_alex")} & {getYPName("yp_jordan")}</SelectItem>
                  <SelectItem value="yp_alex,yp_casey">{getYPName("yp_alex")} & {getYPName("yp_casey")}</SelectItem>
                  <SelectItem value="yp_jordan,yp_casey">{getYPName("yp_jordan")} & {getYPName("yp_casey")}</SelectItem>
                  <SelectItem value="yp_alex,yp_jordan,yp_casey">All Young People</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium mb-1 block">Departure Time *</Label>
                <Input type="time" value={nDepartureTime} onChange={e => setNDepartureTime(e.target.value)} />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 block">Arrival Time</Label>
                <Input type="time" value={nArrivalTime} onChange={e => setNArrivalTime(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium mb-1 block">Mileage Start</Label>
                <Input type="number" placeholder="e.g. 45230" value={nMileageStart} onChange={e => setNMileageStart(e.target.value)} />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 block">Mileage End</Label>
                <Input type="number" placeholder="e.g. 45238" value={nMileageEnd} onChange={e => setNMileageEnd(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block">Route Taken</Label>
              <Input placeholder="e.g. Oak House > A52 > School" value={nRoute} onChange={e => setNRoute(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium mb-1 block">Behaviour</Label>
                <Select value={nBehaviour} onValueChange={v => setNBehaviour(v as Behaviour)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(BEHAVIOUR_META) as [Behaviour, { label: string }][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block">Behaviour Notes</Label>
              <Textarea placeholder="How was the young person during the journey?" value={nBehaviourNotes} onChange={e => setNBehaviourNotes(e.target.value)} rows={2} />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block">Notes</Label>
              <Textarea placeholder="Any additional notes..." value={nNotes} onChange={e => setNNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!nDriver || !nVehicle || !nPurpose || !nDestination || !nDepartureTime}>
              Save Journey
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
