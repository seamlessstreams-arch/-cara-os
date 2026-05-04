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
  Calendar,
  Heart,
  Star,
  Cake,
  Sparkles,
  AlertTriangle,
  Clock,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnniversaryEntry {
  id: string;
  youngPerson: string;
  significanceType: "Birthday" | "Arrival anniversary" | "Care order anniversary" | "Bereavement" | "Family birthday" | "Court date" | "Cultural date" | "Personal milestone" | "Trauma anniversary" | "Significant achievement";
  date: string;
  yearOfOriginal: number;
  yearsAgo: number | null;
  description: string;
  emotionalSignificance: "Celebratory" | "Bittersweet" | "Difficult" | "Practical-only" | "Mixed";
  childPreference: string;
  agreedApproach: string[];
  staffRoleOnDay: string[];
  resourcesNeeded: string[];
  preferredKeyWorker: string;
  emotionalSupportPlan: string;
  remembrancePractices: string[];
  contingencyIfHard: string[];
  recurrence: "Annual" | "One-off" | "Monthly" | "Variable";
  reviewedWithChild: boolean;
  childAgreed: boolean;
  reviewedDate: string;
  reviewedBy: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: AnniversaryEntry[] = [
  {
    id: "anv-001",
    youngPerson: "yp_alex",
    significanceType: "Birthday",
    date: "2026-08-15",
    yearOfOriginal: 2012,
    yearsAgo: null,
    description: "Alex's 14th birthday",
    emotionalSignificance: "Celebratory",
    childPreference: "Wants a low-key day with chosen activities. Boxing club celebration after. Cake. Pizza for dinner. Mum on the phone.",
    agreedApproach: [
      "Wake with cards on the kitchen table",
      "Choice of breakfast",
      "Gift opening with key worker present",
      "School day as normal (Alex chose)",
      "Boxing club celebration with coach (pre-arranged)",
      "Pizza dinner — Alex picks toppings for everyone",
      "Cake decorated by Alex's choice",
      "Phone call with Mum at 19:30",
    ],
    staffRoleOnDay: [
      "Anna (key worker) on shift — confirmed",
      "Edward to pick up cake from preferred bakery",
      "Ryan to coordinate phone call timing",
    ],
    resourcesNeeded: ["Birthday cake (£25 budget)", "Pizza ingredients", "Cards from staff team", "Gift £40 budget — Alex's choice"],
    preferredKeyWorker: "staff_anna",
    emotionalSupportPlan: "Birthdays generally positive for Alex but watch for momentary sadness around mum-related thoughts. Be available without hovering.",
    remembrancePractices: [
      "Birthday letter from Mum (sent to home, opened together)",
      "Photo to add to Life Story book",
    ],
    contingencyIfHard: [
      "If Alex becomes overwhelmed, low-key option ready: quiet evening with chosen film + key worker",
      "Boxing club celebration optional — Alex can decline on day",
      "Phone call with Mum can be deferred to next day if too much",
    ],
    recurrence: "Annual",
    reviewedWithChild: true,
    childAgreed: true,
    reviewedDate: d(-30),
    reviewedBy: "staff_anna",
  },
  {
    id: "anv-002",
    youngPerson: "yp_alex",
    significanceType: "Arrival anniversary",
    date: "2026-01-10",
    yearOfOriginal: 2022,
    yearsAgo: 4,
    description: "4 years at Oak House",
    emotionalSignificance: "Bittersweet",
    childPreference: "Acknowledged quietly. Nothing big. Hot chocolate moment with Anna. Reflection on growth.",
    agreedApproach: [
      "Quiet acknowledgement at breakfast",
      "Optional reflection time with key worker",
      "Hot chocolate together that evening",
      "Update Life Story page together",
      "Choose a small treat together",
    ],
    staffRoleOnDay: [
      "Anna takes lead",
      "Other staff aware but follow Alex's lead — no surprise gestures",
    ],
    resourcesNeeded: ["Photo of Alex's arrival day (in Life Story)", "Hot chocolate ingredients"],
    preferredKeyWorker: "staff_anna",
    emotionalSupportPlan: "This date carries grief about not being with family. Honour the complexity — joy at growth, sadness about how Alex got here. Don't perform happiness.",
    remembrancePractices: [
      "Look back at first photos",
      "Note progress in Life Story",
      "Acknowledge how far Alex has come",
    ],
    contingencyIfHard: [
      "If Alex doesn't want to mark it, respect that",
      "Available without imposing",
      "Gentle check-in next day too",
    ],
    recurrence: "Annual",
    reviewedWithChild: true,
    childAgreed: true,
    reviewedDate: d(-60),
    reviewedBy: "staff_anna",
  },
  {
    id: "anv-003",
    youngPerson: "yp_jordan",
    significanceType: "Birthday",
    date: "2026-11-22",
    yearOfOriginal: 2012,
    yearsAgo: null,
    description: "Jordan's 14th birthday",
    emotionalSignificance: "Celebratory",
    childPreference: "Big celebration. Football team mates round. Cultural food (Mum's recipes). Cake. Gold theme.",
    agreedApproach: [
      "Cards and breakfast in his style",
      "Gift opening morning",
      "School (his choice)",
      "Football team celebration after match",
      "Caribbean dinner with cultural recipes (Mum's recipes if possible)",
      "Birthday cake (gold theme as requested)",
      "Phone call with Mum",
      "Friends round for evening",
    ],
    staffRoleOnDay: [
      "Chervelle (key worker) leads",
      "Cultural food preparation with Jordan's input",
      "Friend visit logistics with Ryan",
    ],
    resourcesNeeded: ["Cake decorating supplies (gold theme)", "Cultural ingredients", "Pizza for friends £30 budget", "Gift £40 budget"],
    preferredKeyWorker: "staff_chervelle",
    emotionalSupportPlan: "Generally a happy day. Mum being in prison adds undercurrent. Phone call timing important. Cultural celebration grounds identity.",
    remembrancePractices: [
      "Phone call with Mum",
      "Letter from Mum if posted",
      "Cultural food connects to heritage",
    ],
    contingencyIfHard: [
      "If phone call not possible, Mum may send recorded message",
      "Friend visit can scale up or down based on Jordan's mood",
      "Quiet alternative ready",
    ],
    recurrence: "Annual",
    reviewedWithChild: true,
    childAgreed: true,
    reviewedDate: d(-21),
    reviewedBy: "staff_chervelle",
  },
  {
    id: "anv-004",
    youngPerson: "yp_jordan",
    significanceType: "Trauma anniversary",
    date: "2026-11-05",
    yearOfOriginal: 2017,
    yearsAgo: 9,
    description: "Anniversary of house fire that destroyed family home",
    emotionalSignificance: "Difficult",
    childPreference: "Acknowledged but not made into a big thing. Avoid fireworks night where possible. Available staff. Optional creative outlet.",
    agreedApproach: [
      "Pre-emptive conversation in days before",
      "Avoid fireworks or sudden loud noises (challenging on bonfire night)",
      "Sensory regulation tools available",
      "Optional creative session (Jordan's preference)",
      "Therapy session within 48 hours",
      "Gentle but not intrusive presence",
    ],
    staffRoleOnDay: [
      "Chervelle on shift",
      "Quieter staffing — fewer transitions",
      "On-call manager aware",
    ],
    resourcesNeeded: ["Sensory tools accessible", "Creative outlets ready", "Quiet space available"],
    preferredKeyWorker: "staff_chervelle",
    emotionalSupportPlan: "PTSD can flare around fire/smoke triggers. Bonfire night is the date which compounds it. Watch for nightmares 3-7 days after. Therapist briefed.",
    remembrancePractices: [
      "Letter to lost family pet (a tradition Jordan started age 10)",
      "Photo viewing of family home",
    ],
    contingencyIfHard: [
      "Therapy crisis slot pre-booked",
      "Quiet evening planned by default",
      "Mum phone call available",
      "Sleep support with melatonin if recommended by GP",
      "Increased welfare checks overnight if needed",
    ],
    recurrence: "Annual",
    reviewedWithChild: true,
    childAgreed: true,
    reviewedDate: d(-180),
    reviewedBy: "staff_chervelle",
  },
  {
    id: "anv-005",
    youngPerson: "yp_casey",
    significanceType: "Birthday",
    date: "2026-04-08",
    yearOfOriginal: 2014,
    yearsAgo: null,
    description: "Casey's 12th birthday — already passed this year",
    emotionalSignificance: "Mixed",
    childPreference: "Quiet day. No surprises. Same routine as much as possible. Cake at home only. Otter the soft toy gets a new accessory. Casey-led activities. No big group celebrations.",
    agreedApproach: [
      "Same morning routine (visual schedule includes 'birthday' cue)",
      "School (specialist provision — they handle quietly)",
      "Casey-led afternoon activity (chose nature reserve)",
      "Anna present throughout",
      "Quiet dinner — Casey's choice of safe foods",
      "Small cake (vanilla — Casey's preferred)",
      "Otter gets new accessory (tradition)",
      "Early bed",
    ],
    staffRoleOnDay: [
      "Anna lead — Casey requests",
      "All staff briefed on quiet approach",
      "No surprise visitors",
    ],
    resourcesNeeded: ["Vanilla cake (specific bakery)", "Nature reserve entry", "Otter accessory £10", "Small gift £30 budget"],
    preferredKeyWorker: "staff_anna",
    emotionalSupportPlan: "Casey doesn't enjoy attention. Birthdays carry complexity around birth family. Visual schedule essential. Sensory regulation primary.",
    remembrancePractices: [
      "Birthday card from Anna (predictable, expected)",
      "Otter accessory tradition (Year 1 of Casey at Oak House started this)",
      "Casey adds page to Life Story themselves",
    ],
    contingencyIfHard: [
      "Cake can be cut next day if too much on day",
      "Activity can be cancelled if dysregulated — back to safe routine",
      "Anna accepts Casey may decline parts",
    ],
    recurrence: "Annual",
    reviewedWithChild: true,
    childAgreed: true,
    reviewedDate: d(-365),
    reviewedBy: "staff_anna",
  },
  {
    id: "anv-006",
    youngPerson: "yp_casey",
    significanceType: "Care order anniversary",
    date: "2026-07-10",
    yearOfOriginal: 2021,
    yearsAgo: 5,
    description: "5 years since full care order granted",
    emotionalSignificance: "Difficult",
    childPreference: "Don't really want it acknowledged. Just be available. Visual schedule unchanged.",
    agreedApproach: [
      "No special acknowledgement",
      "Routine completely as normal",
      "Anna more present without making it a thing",
      "Therapeutic opportunity if Casey raises it",
    ],
    staffRoleOnDay: [
      "Anna preferred shift",
      "Backgrounded support",
    ],
    resourcesNeeded: ["None additional"],
    preferredKeyWorker: "staff_anna",
    emotionalSupportPlan: "Care order anniversary touches identity questions. Don't impose. Wait for Casey to raise (rare but possible). Therapy session prepared if needed.",
    remembrancePractices: [
      "No active practices — Casey's preference",
    ],
    contingencyIfHard: [
      "Increased sensory regulation availability",
      "Therapy session within 48 hours if needed",
      "Visual feelings cards readily available",
    ],
    recurrence: "Annual",
    reviewedWithChild: true,
    childAgreed: true,
    reviewedDate: d(-300),
    reviewedBy: "staff_anna",
  },
  {
    id: "anv-007",
    youngPerson: "yp_jordan",
    significanceType: "Family birthday",
    date: "2026-05-20",
    yearOfOriginal: 2014,
    yearsAgo: null,
    description: "Sister Tia's birthday (in foster care)",
    emotionalSignificance: "Bittersweet",
    childPreference: "Wants to send card and gift. Phone call with Tia. Acknowledge but not dwell.",
    agreedApproach: [
      "Card and gift purchase together (week before)",
      "Phone call coordinated with Tia's foster carer",
      "Brief sibling acknowledgement chat",
      "Continue normal day",
    ],
    staffRoleOnDay: [
      "Chervelle to coordinate with Tia's carer",
      "Phone call quiet space available",
    ],
    resourcesNeeded: ["Gift £15 budget", "Card", "Phone privacy"],
    preferredKeyWorker: "staff_chervelle",
    emotionalSupportPlan: "Sibling separation is real grief. Brief, meaningful contact preferred over avoidance. Watch for low mood that evening.",
    remembrancePractices: [
      "Annual sister-card tradition",
      "Photos exchanged via foster carer",
      "Sibling meeting planned for school holidays where possible",
    ],
    contingencyIfHard: [
      "If phone call not possible, video message acceptable",
      "Quiet evening with Chervelle",
    ],
    recurrence: "Annual",
    reviewedWithChild: true,
    childAgreed: true,
    reviewedDate: d(-120),
    reviewedBy: "staff_chervelle",
  },
];

const significanceColour: Record<string, string> = {
  Celebratory: "bg-green-100 text-green-800",
  Bittersweet: "bg-amber-100 text-amber-800",
  Difficult: "bg-red-100 text-red-800",
  "Practical-only": "bg-slate-100 text-slate-800",
  Mixed: "bg-purple-100 text-purple-800",
};

const exportCols: ExportColumn<AnniversaryEntry>[] = [
  { header: "Young Person", accessor: (r: AnniversaryEntry) => getYPName(r.youngPerson) },
  { header: "Date", accessor: (r: AnniversaryEntry) => r.date },
  { header: "Type", accessor: (r: AnniversaryEntry) => r.significanceType },
  { header: "Description", accessor: (r: AnniversaryEntry) => r.description },
  { header: "Significance", accessor: (r: AnniversaryEntry) => r.emotionalSignificance },
  { header: "Recurrence", accessor: (r: AnniversaryEntry) => r.recurrence },
  { header: "Key Worker", accessor: (r: AnniversaryEntry) => getStaffName(r.preferredKeyWorker) },
  { header: "Child Agreed", accessor: (r: AnniversaryEntry) => r.childAgreed ? "Yes" : "No" },
];

export default function PlacementAnniversariesPage() {
  const [filterYP, setFilterYP] = useState("all");
  const [filterSignificance, setFilterSignificance] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((a) => a.youngPerson === filterYP);
    if (filterSignificance !== "all") items = items.filter((a) => a.emotionalSignificance === filterSignificance);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return a.date.localeCompare(b.date);
        case "type":
          return a.significanceType.localeCompare(b.significanceType);
        case "child":
          return a.youngPerson.localeCompare(b.youngPerson);
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, filterSignificance, sortBy]);

  const total = data.length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcoming90 = data.filter((a) => a.date >= todayStr && a.date <= d(90)).length;
  const difficult = data.filter((a) => a.emotionalSignificance === "Difficult").length;
  const allChildAgreed = data.every((a) => a.childAgreed);

  return (
    <PageShell
      title="Placement Anniversaries"
      subtitle="Significant dates for each child — celebrated, honoured, prepared for, never forgotten"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="placement-anniversaries" />
          <PrintButton title="Placement Anniversaries" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Total Anniversaries</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{upcoming90}</p>
          <p className="text-xs text-muted-foreground">Next 90 Days</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{difficult}</p>
          <p className="text-xs text-muted-foreground">Difficult Dates</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allChildAgreed ? "100%" : `${data.filter((a) => a.childAgreed).length}/${total}`}</p>
          <p className="text-xs text-muted-foreground">Child Agreed</p>
        </div>
      </div>

      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3 mb-6 flex items-start gap-2">
        <Heart className="h-4 w-4 text-pink-600 mt-0.5 shrink-0" />
        <p className="text-sm text-pink-800">
          Significant dates carry weight — birthdays, arrival anniversaries, trauma anniversaries, family
          birthdays. Each is approached the way the child wants. We never forget. We don&apos;t impose.
          We honour what each date means.
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
        <Select value={filterSignificance} onValueChange={setFilterSignificance}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Significances" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Significances</SelectItem>
            <SelectItem value="Celebratory">Celebratory</SelectItem>
            <SelectItem value="Bittersweet">Bittersweet</SelectItem>
            <SelectItem value="Difficult">Difficult</SelectItem>
            <SelectItem value="Practical-only">Practical-only</SelectItem>
            <SelectItem value="Mixed">Mixed</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Soonest First</SelectItem>
              <SelectItem value="type">By Type</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
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
                  {a.significanceType === "Birthday" ? <Cake className="h-5 w-5 text-pink-600 shrink-0" /> :
                   a.emotionalSignificance === "Difficult" ? <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" /> :
                   a.emotionalSignificance === "Celebratory" ? <Star className="h-5 w-5 text-amber-500 shrink-0" /> :
                   <Calendar className="h-5 w-5 text-blue-600 shrink-0" />}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{a.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.date} &middot; {getYPName(a.youngPerson)} &middot; {a.significanceType} &middot; {a.recurrence}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", significanceColour[a.emotionalSignificance])}>
                    {a.emotionalSignificance}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Child&apos;s Preference</p>
                    <p className="text-sm">{a.childPreference}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Agreed Approach</p>
                    <ul className="space-y-1">
                      {a.agreedApproach.map((step, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Sparkles className="h-3 w-3 text-pink-500 mt-1 shrink-0" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Staff Roles</p>
                      <ul className="space-y-1">
                        {a.staffRoleOnDay.map((s, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Resources Needed</p>
                      <ul className="space-y-1">
                        {a.resourcesNeeded.map((r, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-emerald-600 mt-0.5">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Emotional Support Plan</p>
                    <p className="text-sm">{a.emotionalSupportPlan}</p>
                  </div>

                  {a.remembrancePractices.length > 0 && (
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Remembrance Practices</p>
                      <ul className="space-y-1">
                        {a.remembrancePractices.map((p, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Heart className="h-3 w-3 text-emerald-500 mt-1 shrink-0" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {a.contingencyIfHard.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">If The Day Becomes Difficult</p>
                      <ul className="space-y-1">
                        {a.contingencyIfHard.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Heart className="h-3 w-3 inline mr-1" />Key worker: {getStaffName(a.preferredKeyWorker)}</span>
                    <span><Clock className="h-3 w-3 inline mr-1" />Reviewed: {a.reviewedDate}</span>
                    <span>Reviewed by: {getStaffName(a.reviewedBy)}</span>
                    {a.childAgreed && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Child Co-Produced</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Anniversary plans support Quality Standard 1 (child-centred care),
          Quality Standard 7 (health and wellbeing), trauma-informed practice principles, and UNCRC Article 12
          (right to be heard). Plans are co-produced annually with each child and reviewed when significance
          changes. Linked to Personal Passport, Trauma-Informed Timeline, and Bedtime Routines.
        </p>
      </div>
    </PageShell>
  );
}
