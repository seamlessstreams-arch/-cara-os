"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Home,
  CheckCircle,
  Heart,
  Sparkles,
  MapPin,
  Clock,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

interface TourStep {
  step: string;
  shown: boolean;
  childResponse: string;
  noteForCarePlan: string;
}

interface WelcomeTour {
  id: string;
  childInitials: string;
  ageAtArrival: number;
  arrivalDate: string;
  tourDate: string;
  tourLeader: string;
  durationMinutes: number;
  childArrivedFromWhere: string;
  toursPaceAdjusted: boolean;
  paceAdjustmentReason: string;
  preTourActivities: string[];
  toursteps: TourStep[];
  meetingChildrenDuringTour: { residentInitials: string; meetingType: "Brief introduction" | "Longer chat" | "Activity together" | "Parallel only — not introduced"; observations: string }[];
  emotionalState: { onArrival: string; midTour: string; postTour: string };
  childChoseFirstActivity: string;
  bedroomFirstSighting: string;
  bedroomPersonalisationStarted: boolean;
  childToldAboutPledges: boolean;
  childToldAboutAdvocate: boolean;
  childToldAboutComplaints: boolean;
  childToldAboutContact: boolean;
  childGivenPersonalisedWelcomePack: boolean;
  childGivenContactNumbers: boolean;
  childCalmAtNightOne: boolean;
  followUpActions: string[];
  notes: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: WelcomeTour[] = [
  {
    id: "wt-001",
    childInitials: "Alex",
    ageAtArrival: 11,
    arrivalDate: "2022-01-10",
    tourDate: "2022-01-10",
    tourLeader: "staff_darren",
    durationMinutes: 75,
    childArrivedFromWhere: "Foster placement that disrupted (third placement in 2 years)",
    toursPaceAdjusted: true,
    paceAdjustmentReason: "Alex visibly tired, anxious. Slowed pace. Took breaks. Followed Alex's energy.",
    preTourActivities: [
      "Hot drink and snack offered first",
      "Sat together on sofa for 5 mins to settle",
      "Alex chose whether to start tour now or rest first — chose now",
    ],
    toursteps: [
      { step: "Front door & main entrance", shown: true, childResponse: "Quiet observation", noteForCarePlan: "Alex noticed there's no formal sign — appreciated 'feels like a house'" },
      { step: "Hallway & welcome wall", shown: true, childResponse: "Looked at photos of staff", noteForCarePlan: "Asked who Anna was" },
      { step: "Lounge", shown: true, childResponse: "'It's nice. Big TV.'", noteForCarePlan: "Pointed out gaming console; asked about access" },
      { step: "Kitchen & dining", shown: true, childResponse: "Asked about food rules", noteForCarePlan: "Reassured about no 'asking permission' for snacks within agreement" },
      { step: "Garden", shown: true, childResponse: "Brief; cold day", noteForCarePlan: "Will revisit when warmer" },
      { step: "Bedroom (Alex's)", shown: true, childResponse: "Stood quietly. 'It's mine?'", noteForCarePlan: "Significant moment — Alex placed his bag on the bed" },
      { step: "Bathroom", shown: true, childResponse: "Quick", noteForCarePlan: "Showed where towels and his toiletries would go" },
      { step: "Office / quiet room", shown: true, childResponse: "Asked who would be there at night", noteForCarePlan: "Discussed sleep-in arrangements" },
      { step: "Other young people's areas (respectful boundary)", shown: true, childResponse: "Listened to explanation about respecting others' space", noteForCarePlan: "Alex agreed to knock-and-wait practice" },
    ],
    meetingChildrenDuringTour: [
      { residentInitials: "C (10)", meetingType: "Brief introduction", observations: "Casey shy and quiet; Alex respected the brief introduction; both okay" },
    ],
    emotionalState: {
      onArrival: "Anxious, tired, observant",
      midTour: "Settling slightly; began making eye contact",
      postTour: "Calmer; smiled at hot chocolate offer",
    },
    childChoseFirstActivity: "Watch a film in lounge with Darren — Alex chose Iron Man",
    bedroomFirstSighting: "Sat on bed quietly. Said 'it's mine?' — confirmation seemed to land. Pre-arranged welcome items present (note from Anna, soft blanket, snack).",
    bedroomPersonalisationStarted: true,
    childToldAboutPledges: true,
    childToldAboutAdvocate: true,
    childToldAboutComplaints: true,
    childToldAboutContact: true,
    childGivenPersonalisedWelcomePack: true,
    childGivenContactNumbers: true,
    childCalmAtNightOne: true,
    followUpActions: [
      "Visit garden when warmer — Alex interested",
      "Anna to introduce herself properly tomorrow morning",
      "Build on gaming setup conversation in coming weeks",
    ],
    notes: "Strong start. Alex's third placement in 2 years — anxiety understandable. Pace adjustment vital. Welcome pack landed. First night went well — Alex slept by 22:30.",
  },
  {
    id: "wt-002",
    childInitials: "Jordan",
    ageAtArrival: 12,
    arrivalDate: "2023-09-12",
    tourDate: "2023-09-12",
    tourLeader: "staff_chervelle",
    durationMinutes: 60,
    childArrivedFromWhere: "Maternal grandmother's home (could not manage). Mum in custody.",
    toursPaceAdjusted: true,
    paceAdjustmentReason: "Jordan presented stoic but key worker noticed signs of grief beneath. Slowed pace; allowed silences.",
    preTourActivities: [
      "Cup of tea offered (Mum's recipe — strong, milk, one sugar — pre-arranged with Nan)",
      "Phone call with Mum from prison facilitated within 30 mins of arrival",
      "Quiet sit before tour — Jordan said 'show me the football posters'",
    ],
    toursteps: [
      { step: "Football posters in hallway", shown: true, childResponse: "Visibly relaxed; smiled", noteForCarePlan: "Football identity recognition important from day one" },
      { step: "Lounge", shown: true, childResponse: "Liked sound system", noteForCarePlan: "Asked if he could play music" },
      { step: "Kitchen & cultural ingredients shelf", shown: true, childResponse: "'You actually have the right stuff'", noteForCarePlan: "Cultural ingredients shelf was prepared in advance — significant moment" },
      { step: "Bedroom", shown: true, childResponse: "Took it in slowly", noteForCarePlan: "Caribbean flag print on wall (pre-arranged) — Jordan touched it" },
      { step: "Bathroom & skincare products area", shown: true, childResponse: "Approved", noteForCarePlan: "Asked about own skincare — confirmed his own products would be respected" },
      { step: "Quiet room", shown: true, childResponse: "Brief", noteForCarePlan: "Acknowledged" },
      { step: "Garden", shown: true, childResponse: "Football area noted", noteForCarePlan: "Asked about local football clubs — coach contact made within week" },
      { step: "Office", shown: true, childResponse: "Met Darren who he hadn't yet seen", noteForCarePlan: "Brief, warm" },
    ],
    meetingChildrenDuringTour: [
      { residentInitials: "A (12)", meetingType: "Brief introduction", observations: "Alex acknowledged Jordan; cordial; both okay" },
      { residentInitials: "C (10)", meetingType: "Parallel only — not introduced", observations: "Casey not present; introduction planned for following day with sensory prep" },
    ],
    emotionalState: {
      onArrival: "Stoic, watchful",
      midTour: "Began to soften when cultural recognition shown",
      postTour: "Tired but settled",
    },
    childChoseFirstActivity: "Music on the lounge speaker — Jordan chose his own playlist via phone",
    bedroomFirstSighting: "Caribbean flag print, his name on door, welcome card from Nan-Nan included by SW. Jordan placed photo of Mum and sister on bedside immediately.",
    bedroomPersonalisationStarted: true,
    childToldAboutPledges: true,
    childToldAboutAdvocate: true,
    childToldAboutComplaints: true,
    childToldAboutContact: true,
    childGivenPersonalisedWelcomePack: true,
    childGivenContactNumbers: true,
    childCalmAtNightOne: true,
    followUpActions: [
      "Casey introduction planned for tomorrow morning with sensory prep for Casey",
      "Local football club research with Jordan within week",
      "First key working session with Chervelle scheduled for day 3",
    ],
    notes: "Cultural recognition from arrival was vital. Jordan visibly responded to Caribbean flag, cultural ingredients, Mum's tea recipe being correct. Football was bridge to relational warmth. Strong start.",
  },
  {
    id: "wt-003",
    childInitials: "Casey",
    ageAtArrival: 10,
    arrivalDate: "2021-09-22",
    tourDate: "2021-09-22 (over 2 visits)",
    tourLeader: "staff_anna",
    durationMinutes: 30,
    childArrivedFromWhere: "Foster placement that could not meet ASD needs. Casey's sensory profile complex.",
    toursPaceAdjusted: true,
    paceAdjustmentReason: "Casey's ASD profile required adapted approach. Tour split over 2 short visits — pre-admission and admission day. Visual social story used. Pace very slow. Sensory considerations primary.",
    preTourActivities: [
      "Pre-admission visit happened 7 days earlier — short, just bedroom and kitchen seen",
      "Visual social story sent in advance with photos",
      "Casey's preferred snack ready (specific brand of plain crackers)",
      "Sensory-friendly bedroom prepared (low light, weighted blanket, white noise, identical bedding to previous placement)",
      "Otter (soft toy) brought from previous placement and placed on bed",
    ],
    toursteps: [
      { step: "Bedroom (FIRST — most important)", shown: true, childResponse: "Stood at door. Saw Otter on bed. Walked in slowly. Touched weighted blanket.", noteForCarePlan: "Bedroom was Casey's anchor. Started here, not at front door." },
      { step: "Casey's bathroom (own)", shown: true, childResponse: "Acknowledged", noteForCarePlan: "Specific products in place" },
      { step: "Kitchen — preferred cup, plate, bowl shown", shown: true, childResponse: "Picked up blue bowl. Held it.", noteForCarePlan: "Casey's specific blue bowl was vital. Provided in advance after sensory profile review." },
      { step: "Quiet sensory space", shown: true, childResponse: "Sat in beanbag for 5 minutes", noteForCarePlan: "Casey identified this immediately as a refuge" },
      { step: "Lounge (briefly, low-stim time)", shown: true, childResponse: "Brief glance; not engaged with TV", noteForCarePlan: "Will reintroduce when comfortable" },
      { step: "Front door & garden (very brief)", shown: true, childResponse: "Casey wanted to retreat to bedroom", noteForCarePlan: "Honoured. Tour ended here — second visit planned." },
    ],
    meetingChildrenDuringTour: [],
    emotionalState: {
      onArrival: "Overwhelmed, hands over ears, vocal distress beginning",
      midTour: "Settled gradually with sensory support",
      postTour: "Quietly regulated in own bedroom",
    },
    childChoseFirstActivity: "Quiet time alone with Otter and weighted blanket. Anna sat outside bedroom door for 90 minutes available but not interactive.",
    bedroomFirstSighting: "Casey's previous bedding pattern matched. Otter present. Weighted blanket ready. White noise on. Low lighting. Visual schedule for the day on wall. Casey identifiable items only.",
    bedroomPersonalisationStarted: true,
    childToldAboutPledges: false,
    childToldAboutAdvocate: false,
    childToldAboutComplaints: false,
    childToldAboutContact: false,
    childGivenPersonalisedWelcomePack: true,
    childGivenContactNumbers: false,
    childCalmAtNightOne: true,
    followUpActions: [
      "Pledges, advocacy, complaints info to be shared over next week using visual cards (NOT on day 1 — too much)",
      "Meeting other young people deferred — sensory readiness to be assessed",
      "Visual schedule to be co-produced with Casey as Casey settles",
      "SaLT and OT input from day 5",
    ],
    notes: "Specialist welcome for ASD child. Information sharing deliberately deferred — Casey's sensory load on day 1 was already at limit. Different children need different welcomes. Casey's first sleep was peaceful (melatonin, weighted blanket, white noise — all in place).",
  },
];

const exportCols: ExportColumn<WelcomeTour>[] = [
  { header: "Child", accessor: (r: WelcomeTour) => r.childInitials },
  { header: "Age", accessor: (r: WelcomeTour) => String(r.ageAtArrival) },
  { header: "Arrival Date", accessor: (r: WelcomeTour) => r.arrivalDate },
  { header: "Tour Leader", accessor: (r: WelcomeTour) => getStaffName(r.tourLeader) },
  { header: "Duration (min)", accessor: (r: WelcomeTour) => String(r.durationMinutes) },
  { header: "Pace Adjusted", accessor: (r: WelcomeTour) => r.toursPaceAdjusted ? "Yes" : "No" },
  { header: "Welcome Pack", accessor: (r: WelcomeTour) => r.childGivenPersonalisedWelcomePack ? "Yes" : "No" },
  { header: "Calm Night 1", accessor: (r: WelcomeTour) => r.childCalmAtNightOne ? "Yes" : "No" },
];

export default function WelcomeTourChecklistPage() {
  const [filterPace, setFilterPace] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterPace !== "all") items = items.filter((t) => filterPace === "yes" ? t.toursPaceAdjusted : !t.toursPaceAdjusted);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.arrivalDate.localeCompare(a.arrivalDate);
        case "duration":
          return b.durationMinutes - a.durationMinutes;
        default:
          return 0;
      }
    });
    return items;
  }, [filterPace, sortBy]);

  const total = data.length;
  const allCalm = data.every((t) => t.childCalmAtNightOne);
  const paceAdjusted = data.filter((t) => t.toursPaceAdjusted).length;
  const allWelcomed = data.every((t) => t.childGivenPersonalisedWelcomePack);

  return (
    <PageShell
      title="Welcome Tour Checklist"
      subtitle="The first hour matters. Every welcome tour, paced to the child, recorded in detail."
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="welcome-tour-checklist" />
          <PrintButton title="Welcome Tour Checklist" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Tours Recorded</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allCalm ? "100%" : `${data.filter((t) => t.childCalmAtNightOne).length}/${total}`}</p>
          <p className="text-xs text-muted-foreground">Calm Night One</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{paceAdjusted}/{total}</p>
          <p className="text-xs text-muted-foreground">Pace Adjusted</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{allWelcomed ? "100%" : `${data.filter((t) => t.childGivenPersonalisedWelcomePack).length}/${total}`}</p>
          <p className="text-xs text-muted-foreground">Welcome Pack</p>
        </div>
      </div>

      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3 mb-6 flex items-start gap-2">
        <Heart className="h-4 w-4 text-pink-600 mt-0.5 shrink-0" />
        <p className="text-sm text-pink-800">
          The welcome tour is the first message a child receives about what life here will be like. Pace,
          warmth, choice, and sensory respect from minute one. Different children need different welcomes —
          the script bends, the values do not.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterPace} onValueChange={setFilterPace}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Tours" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tours</SelectItem>
            <SelectItem value="yes">Pace-Adjusted</SelectItem>
            <SelectItem value="no">Standard Pace</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="duration">Longest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((t) => {
          const isExpanded = expandedId === t.id;
          const stepsShown = t.toursteps.filter((s) => s.shown).length;

          return (
            <div key={t.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : t.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Home className="h-5 w-5 text-pink-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{t.childInitials} (age {t.ageAtArrival}) — arrived {t.arrivalDate}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.durationMinutes} mins &middot; {stepsShown}/{t.toursteps.length} steps &middot; Led by {getStaffName(t.tourLeader)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {t.toursPaceAdjusted && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">Pace-Adjusted</span>
                  )}
                  {t.childCalmAtNightOne && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Arrived From</p>
                    <p className="text-sm">{t.childArrivedFromWhere}</p>
                  </div>

                  {t.toursPaceAdjusted && (
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Pace Adjustment</p>
                      <p className="text-sm">{t.paceAdjustmentReason}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Pre-Tour Activities</p>
                    <ul className="space-y-1">
                      {t.preTourActivities.map((a, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Sparkles className="h-3 w-3 text-pink-500 mt-1 shrink-0" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <MapPin className="h-3 w-3 inline mr-1" />Tour Steps
                    </p>
                    <div className="space-y-1">
                      {t.toursteps.map((s, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{s.step}</span>
                            {s.shown && <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />}
                          </div>
                          <p className="text-xs italic">&ldquo;{s.childResponse}&rdquo;</p>
                          {s.noteForCarePlan && <p className="text-xs text-muted-foreground mt-1">Note: {s.noteForCarePlan}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {t.meetingChildrenDuringTour.length > 0 && (
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Meeting Other Young People</p>
                      <div className="space-y-1">
                        {t.meetingChildrenDuringTour.map((m, i) => (
                          <div key={i} className="text-sm">
                            <p className="font-medium">{m.residentInitials} — {m.meetingType}</p>
                            <p className="text-xs text-muted-foreground">{m.observations}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="bg-amber-50 rounded-lg p-2 text-sm">
                      <p className="text-xs font-medium text-amber-800">On Arrival</p>
                      <p>{t.emotionalState.onArrival}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2 text-sm">
                      <p className="text-xs font-medium text-blue-800">Mid Tour</p>
                      <p>{t.emotionalState.midTour}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2 text-sm">
                      <p className="text-xs font-medium text-green-800">Post Tour</p>
                      <p>{t.emotionalState.postTour}</p>
                    </div>
                  </div>

                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">First Activity Chosen</p>
                    <p className="text-sm">{t.childChoseFirstActivity}</p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Bedroom First Sighting</p>
                    <p className="text-sm">{t.bedroomFirstSighting}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    <div className={cn("rounded-lg p-2 border", t.childToldAboutPledges ? "bg-green-50" : "bg-amber-50")}>
                      {t.childToldAboutPledges ? <CheckCircle className="h-3 w-3 inline mr-1 text-green-500" /> : <Clock className="h-3 w-3 inline mr-1 text-amber-500" />}
                      Told about pledges
                    </div>
                    <div className={cn("rounded-lg p-2 border", t.childToldAboutAdvocate ? "bg-green-50" : "bg-amber-50")}>
                      {t.childToldAboutAdvocate ? <CheckCircle className="h-3 w-3 inline mr-1 text-green-500" /> : <Clock className="h-3 w-3 inline mr-1 text-amber-500" />}
                      Told about advocate
                    </div>
                    <div className={cn("rounded-lg p-2 border", t.childToldAboutComplaints ? "bg-green-50" : "bg-amber-50")}>
                      {t.childToldAboutComplaints ? <CheckCircle className="h-3 w-3 inline mr-1 text-green-500" /> : <Clock className="h-3 w-3 inline mr-1 text-amber-500" />}
                      Told about complaints
                    </div>
                    <div className={cn("rounded-lg p-2 border", t.childToldAboutContact ? "bg-green-50" : "bg-amber-50")}>
                      {t.childToldAboutContact ? <CheckCircle className="h-3 w-3 inline mr-1 text-green-500" /> : <Clock className="h-3 w-3 inline mr-1 text-amber-500" />}
                      Told about contact
                    </div>
                    <div className={cn("rounded-lg p-2 border", t.childGivenPersonalisedWelcomePack ? "bg-green-50" : "bg-amber-50")}>
                      {t.childGivenPersonalisedWelcomePack ? <CheckCircle className="h-3 w-3 inline mr-1 text-green-500" /> : <Clock className="h-3 w-3 inline mr-1 text-amber-500" />}
                      Welcome pack
                    </div>
                    <div className={cn("rounded-lg p-2 border", t.childGivenContactNumbers ? "bg-green-50" : "bg-amber-50")}>
                      {t.childGivenContactNumbers ? <CheckCircle className="h-3 w-3 inline mr-1 text-green-500" /> : <Clock className="h-3 w-3 inline mr-1 text-amber-500" />}
                      Contact numbers
                    </div>
                  </div>

                  {t.followUpActions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Follow-Up Actions</p>
                      <ul className="space-y-1">
                        {t.followUpActions.map((a, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Clock className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {t.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Tour Lead Notes</p>
                      <p className="text-sm">{t.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Welcome tour records support Quality Standard 1 (child-centred
          care), Care Planning Regulations 2010, Reg 14 (assessment and admission), and trauma-informed
          practice. Linked to Pre-Admission Checklist, Warm Welcome Packs, Personal Passport, and Bedroom
          Personalisation.
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
