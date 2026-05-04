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
  Heart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Star,
  Lightbulb,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── types ───────────────────────────────────────────────────────────────────
interface PlacementEndSummary {
  id: string;
  childName: string;
  admissionDate: string;
  endDate: string;
  durationMonths: number;
  endReason: "Planned move home" | "Planned step-down" | "Planned move-on (16+)" | "Adoption" | "Family reunification" | "Placement disruption" | "Age out" | "Long-term foster";
  movedTo: string;
  outcomes: {
    health: { rating: number; summary: string };
    education: { rating: number; summary: string };
    relationships: { rating: number; summary: string };
    emotional: { rating: number; summary: string };
    independence: { rating: number; summary: string };
  };
  significantAchievements: string[];
  ongoingChallenges: string[];
  whatWorkedWell: string[];
  whatCouldHaveBeenBetter: string[];
  childReflection: string;
  staffReflection: string;
  swReflection: string;
  legacyForHome: string;
  contactArrangements: string;
  authoredBy: string;
  reviewedBy: string;
  approvalDate: string;
}

// ── seed data ───────────────────────────────────────────────────────────────
const data: PlacementEndSummary[] = [
  {
    id: "pes-001",
    childName: "Marcus T.",
    admissionDate: "2022-04-15",
    endDate: "2025-08-30",
    durationMonths: 41,
    endReason: "Planned move-on (16+)",
    movedTo: "Semi-independent supported lodgings — 'Riverside Step-Up'",
    outcomes: {
      health: { rating: 4, summary: "All health appointments engaged with. Established with GP and dentist. Mental health much improved — discharged from CAMHS." },
      education: { rating: 5, summary: "Completed GCSEs (5x grade 4+). Started Level 2 plumbing at college. First in family to complete formal education." },
      relationships: { rating: 4, summary: "Maintained contact with mother (weekly). Strong friendship group from college. Healthy first relationship at 16." },
      emotional: { rating: 4, summary: "Significant reduction in dysregulation. Self-soothing strategies established. Trusted relationships with key staff." },
      independence: { rating: 4, summary: "Cooks own meals, manages money, uses public transport confidently, attends appointments independently." },
    },
    significantAchievements: [
      "First in family to complete GCSEs",
      "Captain of college football team",
      "Apprenticeship offer secured",
      "Maintained sobriety after early experimentation",
      "Reconnected positively with extended family",
    ],
    ongoingChallenges: [
      "Some emotional regulation difficulties under stress remain",
      "Anxiety around abandonment surfaces in close relationships",
      "Money management still developing",
    ],
    whatWorkedWell: [
      "Consistent key worker relationship for 3+ years (Edward)",
      "PACE approach embedded across all staff",
      "Strong educational advocacy with college",
      "Family contact carefully supported and reviewed",
      "Independence skills built progressively from age 14",
    ],
    whatCouldHaveBeenBetter: [
      "Earlier referral to therapy (waited 8 months)",
      "More structured transition prep in final 6 months",
      "Better matching with semi-independent provision",
    ],
    childReflection: "Oak House saved my life. I came in angry and broken. I'm leaving with hope and a plan. Edward is the dad I never had. I'll always be grateful.",
    staffReflection: "Marcus showed us what consistent relational care can achieve. The boy who arrived couldn't trust an adult. The young man leaving has a network of people who love him. We did this together.",
    swReflection: "Exceptional placement. Marcus has exceeded all my hopes. The home held him through everything — and now he's flourishing.",
    legacyForHome: "Marcus's journey informed our independence pathway model. His feedback led to the introduction of 'pre-leaving' weekend stays. He's invited back as a peer mentor for new admissions.",
    contactArrangements: "Maintained — monthly visits agreed. Will join Christmas dinner. Edward continues as informal mentor.",
    authoredBy: "staff_darren",
    reviewedBy: "staff_ryan",
    approvalDate: "2025-09-05",
  },
  {
    id: "pes-002",
    childName: "Sophie L.",
    admissionDate: "2023-09-12",
    endDate: "2025-06-20",
    durationMonths: 21,
    endReason: "Family reunification",
    movedTo: "Returned to mother's care with continued family support package",
    outcomes: {
      health: { rating: 4, summary: "Excellent engagement with all health services. Asthma well managed. ADHD diagnosis received and medication established." },
      education: { rating: 4, summary: "Returned to mainstream school after PRU. Year 8 attendance 92%. Predicted GCSE grades reflect significant progress." },
      relationships: { rating: 5, summary: "Family work intensive and successful. Strong friendships at school. Positive sibling relationships restored." },
      emotional: { rating: 4, summary: "Trauma therapy completed. Self-harm behaviours ceased 8 months ago. Emotion regulation toolkit well-established." },
      independence: { rating: 3, summary: "Age-appropriate independence. Manages homework and self-care well. Money management developing." },
    },
    significantAchievements: [
      "Reunification achieved safely",
      "Mother completed parenting course and has stable accommodation",
      "Self-harm completely ceased",
      "School attendance transformed",
      "ADHD properly diagnosed and treated",
    ],
    ongoingChallenges: [
      "Reunification fragile in first 6 months — support package critical",
      "Mother's mental health needs ongoing monitoring",
      "Sibling dynamics need ongoing support",
    ],
    whatWorkedWell: [
      "Parallel family work alongside Sophie's care",
      "Therapeutic input from CAMHS aligned with our approach",
      "Gradual introduction of overnight contact built confidence",
      "School relationships strong throughout",
      "ADHD diagnosis pursued despite resistance from previous services",
    ],
    whatCouldHaveBeenBetter: [
      "Slower pace of reunification might have reduced anxiety",
      "More involvement of extended family during placement",
      "Earlier identification of ADHD",
    ],
    childReflection: "I was so angry when I got here. They never gave up on me even when I was horrible. I love my mum and I'm ready to go home now because I know how to ask for help.",
    staffReflection: "Sophie's return home is a triumph of multi-agency working. The home held the space while mum did the work. We're proud and a little sad — that's the right feeling for a successful ending.",
    swReflection: "Best example of family reunification I've worked with in 15 years. The home's commitment to family was exceptional.",
    legacyForHome: "Sophie's case strengthened our family work model. We now offer parallel family sessions as standard for all reunification candidates. Her feedback informed our 'goodbye process'.",
    contactArrangements: "Open contact arrangement agreed. Sophie has key worker number for any concerns. Will attend Oak House summer BBQ.",
    authoredBy: "staff_darren",
    reviewedBy: "staff_ryan",
    approvalDate: "2025-06-25",
  },
  {
    id: "pes-003",
    childName: "Daniel K.",
    admissionDate: "2024-02-08",
    endDate: "2024-11-15",
    durationMonths: 9,
    endReason: "Placement disruption",
    movedTo: "Specialist therapeutic provision (single occupancy)",
    outcomes: {
      health: { rating: 3, summary: "Engaged with most health services. Some dental issues unaddressed due to anxiety. Mental health complex." },
      education: { rating: 2, summary: "School attendance erratic throughout. Two fixed-term exclusions. EHCP process initiated but not concluded." },
      relationships: { rating: 2, summary: "Difficulty forming peer relationships. Trauma-bonded family contact difficult to manage. Limited progress on attachment work." },
      emotional: { rating: 2, summary: "Significant dysregulation throughout. Multiple incidents of self-harm and aggression. Required specialist intervention beyond our capacity." },
      independence: { rating: 3, summary: "Age-appropriate self-care. Money management challenging due to impulsivity." },
    },
    significantAchievements: [
      "Maintained relationship with key worker despite difficulties",
      "EHCP process now in motion (will continue at new placement)",
      "Successfully de-escalated several crisis points",
      "First instances of help-seeking behaviour emerged",
    ],
    ongoingChallenges: [
      "Complex trauma needs exceeded the home's clinical capacity",
      "Group living model not appropriate for Daniel's needs",
      "Family contact destabilising despite support",
      "Education engagement remained problematic",
    ],
    whatWorkedWell: [
      "Honest acknowledgement that placement was not meeting needs",
      "Multi-agency safety planning during disruption",
      "Key worker continued therapeutic relationship to the end",
      "Transition to new provision well-prepared",
    ],
    whatCouldHaveBeenBetter: [
      "Initial impact assessment underestimated the complexity",
      "Should have escalated to specialist commissioning sooner",
      "More clinical supervision for staff during crisis periods",
      "Earlier conversation with Daniel about appropriate provision",
    ],
    childReflection: "I know I was hard work. I didn't want to be here at first. But you tried. I know I need somewhere different. Thank you for not giving up on me even when you couldn't keep me.",
    staffReflection: "Daniel's needs were beyond what we could safely meet. Recognising this honestly was the most caring thing we could do. We hold him in our minds and hopes — this isn't goodbye, it's the right placement at last.",
    swReflection: "The home's professionalism in escalating concerns appropriately, while continuing to provide excellent care, exemplifies best practice. This was a difficult outcome handled with integrity.",
    legacyForHome: "Daniel's case reinforced our matching protocol. We've revised impact assessment templates to better identify complex cases. Staff debrief sessions extended.",
    contactArrangements: "Key worker (Anna) maintains monthly check-in calls with Daniel and new placement. Information sharing arrangement formalised.",
    authoredBy: "staff_darren",
    reviewedBy: "staff_ryan",
    approvalDate: "2024-11-20",
  },
  {
    id: "pes-004",
    childName: "Isla G.",
    admissionDate: "2021-07-22",
    endDate: "2024-12-18",
    durationMonths: 41,
    endReason: "Long-term foster",
    movedTo: "Long-term foster placement with matched carers",
    outcomes: {
      health: { rating: 5, summary: "All health needs met. Vaccinations up to date. Excellent dental health. Mental health stabilised." },
      education: { rating: 5, summary: "Top of class in core subjects. School council member. Thriving in mainstream provision." },
      relationships: { rating: 4, summary: "Strong attachment with foster carers built over 6-month introduction. Maintained relationships at Oak House." },
      emotional: { rating: 5, summary: "Trauma therapy concluded successfully. Emotional literacy excellent. Resilience evident." },
      independence: { rating: 4, summary: "Age-appropriate independence. Self-managed homework and friendships with light support." },
    },
    significantAchievements: [
      "Successfully matched with foster family after 3 years in residential",
      "Therapy goals all achieved",
      "Academic progression remarkable",
      "First sustained friendship maintained",
      "Family identity work successfully integrated",
    ],
    ongoingChallenges: [
      "Anniversary dates remain emotionally significant",
      "Adjustment to family life takes time",
      "Birth family contact requires ongoing management",
    ],
    whatWorkedWell: [
      "Lengthy, careful matching process with foster carers",
      "Gradual introductory programme over 6 months",
      "Therapeutic work prepared Isla for family living",
      "Foster carers attended Oak House training before matching",
      "Continuity of school maintained through transition",
    ],
    whatCouldHaveBeenBetter: [
      "Earlier identification of foster as appropriate goal",
      "Family-finding process took longer than ideal",
    ],
    childReflection: "Oak House was my safe place when I had nowhere. Now I have a forever family but Oak House will always be part of my story. I'm taking my Oak House blanket.",
    staffReflection: "Isla showed us what's possible with patience, therapy, and the right preparation. From a frightened 8-year-old to a confident 12-year-old going to her forever family. This is what we exist for.",
    swReflection: "Exemplary care. The home's therapeutic approach has equipped Isla for family life in a way I haven't seen from other placements. Bedrock work for her future.",
    legacyForHome: "Isla's transition model is now our standard for family-finding placements. Foster carer training programme developed based on this case. 'Oak House blanket' tradition started — every leaver gets one.",
    contactArrangements: "Maintained — Isla visits twice yearly. Foster carers in WhatsApp group with key worker. Photo updates regularly shared.",
    authoredBy: "staff_darren",
    reviewedBy: "staff_ryan",
    approvalDate: "2024-12-22",
  },
];

// ── config ──────────────────────────────────────────────────────────────────
const reasonColour: Record<string, string> = {
  "Planned move home": "bg-green-100 text-green-800",
  "Planned step-down": "bg-blue-100 text-blue-800",
  "Planned move-on (16+)": "bg-blue-100 text-blue-800",
  "Adoption": "bg-emerald-100 text-emerald-800",
  "Family reunification": "bg-green-100 text-green-800",
  "Placement disruption": "bg-amber-100 text-amber-800",
  "Age out": "bg-purple-100 text-purple-800",
  "Long-term foster": "bg-emerald-100 text-emerald-800",
};

function ratingColour(r: number): string {
  if (r >= 4) return "text-green-600";
  if (r === 3) return "text-amber-600";
  return "text-red-600";
}

// ── export columns ──────────────────────────────────────────────────────────
const exportCols: ExportColumn<PlacementEndSummary>[] = [
  { header: "Child", accessor: (r: PlacementEndSummary) => r.childName },
  { header: "Admission", accessor: (r: PlacementEndSummary) => r.admissionDate },
  { header: "End Date", accessor: (r: PlacementEndSummary) => r.endDate },
  { header: "Duration (months)", accessor: (r: PlacementEndSummary) => String(r.durationMonths) },
  { header: "End Reason", accessor: (r: PlacementEndSummary) => r.endReason },
  { header: "Moved To", accessor: (r: PlacementEndSummary) => r.movedTo },
  { header: "Avg Outcome Rating", accessor: (r: PlacementEndSummary) => {
    const ratings = [r.outcomes.health.rating, r.outcomes.education.rating, r.outcomes.relationships.rating, r.outcomes.emotional.rating, r.outcomes.independence.rating];
    return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
  }},
  { header: "Authored By", accessor: (r: PlacementEndSummary) => getStaffName(r.authoredBy) },
];

// ── component ───────────────────────────────────────────────────────────────
export default function PlacementEndSummaryPage() {
  const [filterReason, setFilterReason] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterReason !== "all") items = items.filter((s) => s.endReason === filterReason);

    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.endDate.localeCompare(a.endDate);
        case "duration":
          return b.durationMonths - a.durationMonths;
        case "rating":
          const avgA = (a.outcomes.health.rating + a.outcomes.education.rating + a.outcomes.relationships.rating + a.outcomes.emotional.rating + a.outcomes.independence.rating) / 5;
          const avgB = (b.outcomes.health.rating + b.outcomes.education.rating + b.outcomes.relationships.rating + b.outcomes.emotional.rating + b.outcomes.independence.rating) / 5;
          return avgB - avgA;
        default:
          return 0;
      }
    });
    return items;
  }, [filterReason, sortBy]);

  // ── stats ─────────────────────────────────────────────────────────────────
  const totalEndings = data.length;
  const planned = data.filter((s) => s.endReason !== "Placement disruption").length;
  const avgDuration = Math.round(data.reduce((sum, s) => sum + s.durationMonths, 0) / data.length);
  const avgRating = (
    data.reduce((sum, s) => {
      const ratings = [s.outcomes.health.rating, s.outcomes.education.rating, s.outcomes.relationships.rating, s.outcomes.emotional.rating, s.outcomes.independence.rating];
      return sum + ratings.reduce((a, b) => a + b, 0) / ratings.length;
    }, 0) / data.length
  ).toFixed(1);

  return (
    <PageShell
      title="Placement End Summary"
      subtitle="Reflective summaries when placements end — celebrating progress, learning from challenges, honouring the journey"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="placement-end-summaries" />
          <PrintButton title="Placement End Summaries" />
        </div>
      }
    >
      {/* ── summary stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{totalEndings}</p>
          <p className="text-xs text-muted-foreground">Total Endings</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{planned}/{totalEndings}</p>
          <p className="text-xs text-muted-foreground">Planned Endings</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{avgDuration}</p>
          <p className="text-xs text-muted-foreground">Avg Duration (months)</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{avgRating}/5</p>
          <p className="text-xs text-muted-foreground">Avg Outcome Rating</p>
        </div>
      </div>

      {/* ── philosophy banner ──────────────────────────────────────────── */}
      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3 mb-6 flex items-start gap-2">
        <Heart className="h-4 w-4 text-pink-600 mt-0.5 shrink-0" />
        <p className="text-sm text-pink-800">
          Endings are part of caring. We honour every journey — those that end in flourishing and those that
          remind us of our limits. What we learn here informs every future welcome.
        </p>
      </div>

      {/* ── filters/sort ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterReason} onValueChange={setFilterReason}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Reasons" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reasons</SelectItem>
            <SelectItem value="Planned move home">Planned Move Home</SelectItem>
            <SelectItem value="Planned step-down">Planned Step-Down</SelectItem>
            <SelectItem value="Planned move-on (16+)">Move-On (16+)</SelectItem>
            <SelectItem value="Adoption">Adoption</SelectItem>
            <SelectItem value="Family reunification">Reunification</SelectItem>
            <SelectItem value="Placement disruption">Disruption</SelectItem>
            <SelectItem value="Age out">Age Out</SelectItem>
            <SelectItem value="Long-term foster">Long-term Foster</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="duration">Longest Placement</SelectItem>
              <SelectItem value="rating">Best Outcomes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── summary cards ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No summaries match your filters.</div>
        )}
        {filtered.map((s) => {
          const isExpanded = expandedId === s.id;
          const ratings = [s.outcomes.health.rating, s.outcomes.education.rating, s.outcomes.relationships.rating, s.outcomes.emotional.rating, s.outcomes.independence.rating];
          const avgR = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);

          return (
            <div key={s.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : s.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Heart className="h-5 w-5 text-pink-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.childName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.admissionDate} → {s.endDate} &middot; {s.durationMonths} months &middot; {s.movedTo.slice(0, 60)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", reasonColour[s.endReason])}>
                    {s.endReason}
                  </span>
                  <span className={cn("text-sm font-bold", ratingColour(parseFloat(avgR)))}>{avgR}/5</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {/* outcome ratings */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Outcome Domains</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(s.outcomes).map(([key, val]) => (
                        <div key={key} className="bg-white rounded-lg p-3 border">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium uppercase tracking-wide capitalize">{key}</span>
                            <span className={cn("text-sm font-bold", ratingColour(val.rating))}>{val.rating}/5</span>
                          </div>
                          <p className="text-xs text-slate-700">{val.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* achievements */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <Star className="h-3 w-3 inline mr-1" />Significant Achievements
                    </p>
                    <ul className="space-y-1">
                      {s.significantAchievements.map((a, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* ongoing challenges */}
                  {s.ongoingChallenges.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />Ongoing Challenges
                      </p>
                      <ul className="space-y-1">
                        {s.ongoingChallenges.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <ArrowRight className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* learning grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">What Worked Well</p>
                      <ul className="space-y-1">
                        {s.whatWorkedWell.map((w, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-green-600 mt-0.5">•</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">What Could Have Been Better</p>
                      <ul className="space-y-1">
                        {s.whatCouldHaveBeenBetter.map((w, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* reflections */}
                  <div className="space-y-2">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Child&apos;s Reflection</p>
                      <p className="text-sm text-blue-900 italic">&ldquo;{s.childReflection}&rdquo;</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Staff Reflection</p>
                      <p className="text-sm text-purple-900 italic">&ldquo;{s.staffReflection}&rdquo;</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Social Worker Reflection</p>
                      <p className="text-sm text-slate-700 italic">&ldquo;{s.swReflection}&rdquo;</p>
                    </div>
                  </div>

                  {/* legacy */}
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                      <Lightbulb className="h-3 w-3 inline mr-1" />Legacy For The Home
                    </p>
                    <p className="text-sm text-emerald-900">{s.legacyForHome}</p>
                  </div>

                  {/* metadata */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Authored: {getStaffName(s.authoredBy)}</span>
                    <span>Reviewed: {getStaffName(s.reviewedBy)}</span>
                    <span>Approved: {s.approvalDate}</span>
                    <span><TrendingUp className="h-3 w-3 inline mr-1" />Avg outcome: {avgR}/5</span>
                  </div>

                  {s.contactArrangements && (
                    <div className="bg-pink-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">Continuing Contact</p>
                      <p className="text-sm text-pink-900">{s.contactArrangements}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Placement end summaries support Quality Standard 2 (quality of care),
          Quality Standard 4 (the child&apos;s plan), and Regulation 5 (engagement with placing authority).
          Summaries inform service development per Regulation 45 (review of quality of care) and demonstrate
          outcome-focused practice for SCCIF judgements. Children always receive a copy in age-appropriate format.
        </p>
      </div>
    </PageShell>
  );
}
