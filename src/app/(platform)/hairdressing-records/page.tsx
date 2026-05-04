"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Scissors,
  Heart,
  Star,
  Sparkles,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HairAppointment {
  id: string;
  youngPerson: string;
  date: string;
  salonOrBarber: string;
  salonType: "High street barber" | "Specialist Black hair barber" | "Mobile/home" | "Salon" | "Specialist (e.g. sensory-friendly)";
  staffEscort: string;
  styleRequested: string;
  styleAchieved: string;
  productsUsed: string[];
  durationMinutes: number;
  cost: number;
  childSatisfaction: number;
  staffObservation: string;
  anxietyLevelObserved: string;
  reasonableAdjustments: string[];
  childChose: boolean;
  culturalRelevance: string;
  nextAppointmentDue: string;
  notes: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: HairAppointment[] = [
  {
    id: "ha-001",
    youngPerson: "yp_alex",
    date: d(-7),
    salonOrBarber: "The Cut Above (high street barber)",
    salonType: "High street barber",
    staffEscort: "staff_lackson",
    styleRequested: "Short back and sides; medium top — same as last time",
    styleAchieved: "Exactly as requested. Alex pleased.",
    productsUsed: ["Standard clippers", "Basic styling product"],
    durationMinutes: 25,
    cost: 12,
    childSatisfaction: 4,
    staffObservation: "Routine. Alex relaxed throughout.",
    anxietyLevelObserved: "Low — familiar barber relationship",
    reasonableAdjustments: [],
    childChose: true,
    culturalRelevance: "Standard British high-street style — Alex's preference",
    nextAppointmentDue: d(35),
    notes: "Six-weekly routine.",
  },
  {
    id: "ha-002",
    youngPerson: "yp_jordan",
    date: d(-14),
    salonOrBarber: "King's Cut (specialist Black hair barber)",
    salonType: "Specialist Black hair barber",
    staffEscort: "staff_chervelle",
    styleRequested: "Fade with line-up; pattern shaved on side",
    styleAchieved: "Exactly as requested. Coach noticed at next match.",
    productsUsed: ["Razor work", "Hair grease (cultural)", "Fade brush"],
    durationMinutes: 60,
    cost: 25,
    childSatisfaction: 5,
    staffObservation: "Jordan in element. Cultural barbershop is identity-affirming space.",
    anxietyLevelObserved: "Very low — Jordan looks forward to these visits",
    reasonableAdjustments: [],
    childChose: true,
    culturalRelevance: "Black-led barbershop. Jordan recognised in community. Cultural matching with Chervelle (escort) makes journey safe and authentic.",
    nextAppointmentDue: d(14),
    notes: "Monthly cultural barbershop visit. Significant identity space.",
  },
  {
    id: "ha-003",
    youngPerson: "yp_jordan",
    date: d(-42),
    salonOrBarber: "King's Cut",
    salonType: "Specialist Black hair barber",
    staffEscort: "staff_chervelle",
    styleRequested: "Fade with line-up",
    styleAchieved: "As requested",
    productsUsed: ["Razor", "Hair grease"],
    durationMinutes: 55,
    cost: 25,
    childSatisfaction: 5,
    staffObservation: "Routine cultural appointment. Jordan engaged with other patrons.",
    anxietyLevelObserved: "Low",
    reasonableAdjustments: [],
    childChose: true,
    culturalRelevance: "Cultural community space",
    nextAppointmentDue: d(-14),
    notes: "",
  },
  {
    id: "ha-004",
    youngPerson: "yp_casey",
    date: d(-30),
    salonOrBarber: "Quiet Cuts (sensory-friendly mobile hairdresser)",
    salonType: "Mobile/home",
    staffEscort: "staff_anna",
    styleRequested: "Trim only — minimal change. Specific length maintained.",
    styleAchieved: "Exactly as requested. Length consistent with Casey's preference.",
    productsUsed: ["Quiet scissors (no clippers)", "No products applied (sensory)"],
    durationMinutes: 30,
    cost: 35,
    childSatisfaction: 5,
    staffObservation: "Hairdresser came to home (sensory-friendly approach). Casey calm throughout — Anna present, Otter on lap.",
    anxietyLevelObserved: "Low — adapted environment",
    reasonableAdjustments: [
      "Mobile hairdresser comes to home (avoids salon sensory overload)",
      "Quiet scissors only — no clippers (sound aversion)",
      "No hair products applied (scent sensitivity)",
      "Specific cape (Casey's preferred fabric)",
      "Anna present throughout",
      "Otter (soft toy) on lap",
      "Visual schedule shown beforehand",
    ],
    childChose: true,
    culturalRelevance: "N/A — sensory-aware approach is the cultural lens here",
    nextAppointmentDue: d(60),
    notes: "Quarterly trim — adapted approach essential. £35 mobile premium worth every penny.",
  },
  {
    id: "ha-005",
    youngPerson: "yp_alex",
    date: d(-49),
    salonOrBarber: "The Cut Above",
    salonType: "High street barber",
    staffEscort: "staff_lackson",
    styleRequested: "Same routine cut",
    styleAchieved: "As requested",
    productsUsed: ["Standard clippers"],
    durationMinutes: 25,
    cost: 12,
    childSatisfaction: 4,
    staffObservation: "Routine.",
    anxietyLevelObserved: "Low",
    reasonableAdjustments: [],
    childChose: true,
    culturalRelevance: "Standard preference",
    nextAppointmentDue: d(-7),
    notes: "",
  },
  {
    id: "ha-006",
    youngPerson: "yp_casey",
    date: d(-120),
    salonOrBarber: "Quiet Cuts (mobile)",
    salonType: "Mobile/home",
    staffEscort: "staff_anna",
    styleRequested: "Trim — same as previous",
    styleAchieved: "As requested",
    productsUsed: ["Quiet scissors"],
    durationMinutes: 35,
    cost: 35,
    childSatisfaction: 5,
    staffObservation: "Routine quarterly trim — Casey's pattern works.",
    anxietyLevelObserved: "Low",
    reasonableAdjustments: [
      "Mobile only",
      "No clippers, no products",
      "Anna and Otter present",
    ],
    childChose: true,
    culturalRelevance: "N/A",
    nextAppointmentDue: d(-30),
    notes: "Quarterly cycle established.",
  },
];

const salonColour: Record<string, string> = {
  "High street barber": "bg-blue-100 text-blue-800",
  "Specialist Black hair barber": "bg-amber-100 text-amber-800",
  "Mobile/home": "bg-emerald-100 text-emerald-800",
  "Salon": "bg-pink-100 text-pink-800",
  "Specialist (e.g. sensory-friendly)": "bg-purple-100 text-purple-800",
};

const exportCols: ExportColumn<HairAppointment>[] = [
  { header: "Young Person", accessor: (r: HairAppointment) => getYPName(r.youngPerson) },
  { header: "Date", accessor: (r: HairAppointment) => r.date },
  { header: "Salon/Barber", accessor: (r: HairAppointment) => r.salonOrBarber },
  { header: "Type", accessor: (r: HairAppointment) => r.salonType },
  { header: "Style", accessor: (r: HairAppointment) => r.styleAchieved },
  { header: "Cost £", accessor: (r: HairAppointment) => `£${r.cost}` },
  { header: "Satisfaction", accessor: (r: HairAppointment) => `${r.childSatisfaction}/5` },
  { header: "Adjustments", accessor: (r: HairAppointment) => r.reasonableAdjustments.length > 0 ? "Yes" : "Standard" },
];

export default function HairdressingRecordsPage() {
  const [filterYP, setFilterYP] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((a) => a.youngPerson === filterYP);
    if (filterType !== "all") items = items.filter((a) => a.salonType === filterType);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "satisfaction":
          return b.childSatisfaction - a.childSatisfaction;
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, filterType, sortBy]);

  const total = data.length;
  const culturalMatched = data.filter((a) => a.salonType === "Specialist Black hair barber").length;
  const sensoryAdjusted = data.filter((a) => a.reasonableAdjustments.length > 0).length;
  const allChildChose = data.every((a) => a.childChose);

  return (
    <PageShell
      title="Hairdressing Records"
      subtitle="Hair appointments per child — choice, dignity, cultural and sensory awareness"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="hairdressing-records" />
          <PrintButton title="Hairdressing Records" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Recent Appointments</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{culturalMatched}</p>
          <p className="text-xs text-muted-foreground">Cultural Specialist</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{sensoryAdjusted}</p>
          <p className="text-xs text-muted-foreground">Sensory Adjustments</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allChildChose ? "100%" : `${data.filter((a) => a.childChose).length}/${total}`}</p>
          <p className="text-xs text-muted-foreground">Child-Chosen Style</p>
        </div>
      </div>

      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3 mb-6 flex items-start gap-2">
        <Scissors className="h-4 w-4 text-pink-600 mt-0.5 shrink-0" />
        <p className="text-sm text-pink-800">
          Hair is identity. Children choose their own style. Cultural matching matters — Jordan goes to a
          Black-led barbershop. Sensory needs matter — Casey&apos;s mobile hairdresser visits home with
          adaptations. Every appointment is an act of dignity.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Salon Types</SelectItem>
            <SelectItem value="High street barber">High Street Barber</SelectItem>
            <SelectItem value="Specialist Black hair barber">Specialist Black Hair</SelectItem>
            <SelectItem value="Mobile/home">Mobile/Home</SelectItem>
            <SelectItem value="Salon">Salon</SelectItem>
            <SelectItem value="Specialist (e.g. sensory-friendly)">Sensory Specialist</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="satisfaction">By Satisfaction</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((a) => {
          const isExpanded = expandedId === a.id;

          return (
            <div key={a.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : a.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Scissors className="h-5 w-5 text-pink-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(a.youngPerson)} — {a.salonOrBarber}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.date} &middot; {a.styleAchieved} &middot; £{a.cost}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", salonColour[a.salonType])}>{a.salonType}</span>
                  <span className="text-sm font-bold text-amber-600">{a.childSatisfaction}/5</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-3 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Style Requested</p>
                      <p>{a.styleRequested}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Style Achieved</p>
                      <p>{a.styleAchieved}</p>
                    </div>
                  </div>

                  {a.reasonableAdjustments.length > 0 && (
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Reasonable Adjustments</p>
                      <ul className="space-y-1">
                        {a.reasonableAdjustments.map((adj, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Sparkles className="h-3 w-3 text-purple-500 mt-1 shrink-0" />
                            <span>{adj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Cultural Relevance</p>
                    <p>{a.culturalRelevance}</p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Staff Observation</p>
                    <p>{a.staffObservation}</p>
                    <p className="text-xs text-muted-foreground mt-1">Anxiety level: {a.anxietyLevelObserved}</p>
                  </div>

                  {a.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Notes</p>
                      <p>{a.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Heart className="h-3 w-3 inline mr-1" />Satisfaction: {a.childSatisfaction}/5</span>
                    <span>£{a.cost} &middot; {a.durationMinutes} mins</span>
                    <span>Escort: {getStaffName(a.staffEscort)}</span>
                    <span>Next: {a.nextAppointmentDue}</span>
                    {a.childChose && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium"><Star className="h-3 w-3 inline mr-1" />Child Chose</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Hairdressing records support Quality Standard 1 (child-centred
          care), Quality Standard 2 (children's wishes and feelings), and Equality Act 2010 reasonable
          adjustments. Cultural and sensory matching is core, not optional. Linked to Cultural Identity,
          Sensory Profiles, and Personal Belongings.
        </p>
      </div>
    </PageShell>
  );
}
