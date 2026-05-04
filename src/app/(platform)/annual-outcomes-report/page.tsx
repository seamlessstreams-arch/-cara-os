"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown, ChevronUp, ArrowUpDown, Target, TrendingUp,
  Users, BarChart3, Star, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type Domain = "Health" | "Education" | "Emotional Wellbeing" | "Relationships" | "Independence" | "Identity" | "Safety";

interface AnnualOutcome {
  id: string;
  youngPerson: string;
  reportingYear: string;
  domain: Domain;
  targetSet: string;
  progressRating: number;
  evidence: string;
  barriersFaced: string[];
  supportProvided: string[];
  childView: string;
  nextYearTarget: string;
  reviewedBy: string;
  reviewDate: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const DOMAINS: Domain[] = ["Health", "Education", "Emotional Wellbeing", "Relationships", "Independence", "Identity", "Safety"];

const RATING_LABEL: Record<number, string> = { 1: "Significantly Below", 2: "Below Target", 3: "Progressing", 4: "Achieved", 5: "Exceeded" };
const RATING_CLR: Record<number, string> = {
  1: "bg-red-100 text-red-800 border-red-300",
  2: "bg-orange-100 text-orange-800 border-orange-300",
  3: "bg-amber-100 text-amber-800 border-amber-300",
  4: "bg-green-100 text-green-800 border-green-300",
  5: "bg-emerald-100 text-emerald-800 border-emerald-300",
};
const RATING_BAR: Record<number, string> = {
  1: "bg-red-500",
  2: "bg-orange-500",
  3: "bg-amber-500",
  4: "bg-green-500",
  5: "bg-emerald-500",
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: AnnualOutcome[] = [
  // Alex — 4 records
  {
    id: "ao_001", youngPerson: "yp_alex", reportingYear: "2025-2026", domain: "Health",
    targetSet: "Attend all scheduled health appointments and engage with CAMHS fortnightly sessions",
    progressRating: 4, evidence: "Alex attended 11 of 12 CAMHS sessions and all GP appointments. Developed self-regulation strategies. Health passport is up to date. Only missed one session due to school trip.",
    barriersFaced: ["Initial reluctance to engage with CAMHS", "Anxiety around medical settings"],
    supportProvided: ["Key worker accompanied to first 3 sessions", "Visual schedule for appointments", "Reward-based incentive for attendance"],
    childView: "I actually like going to CAMHS now. My therapist gets me and I feel like I can talk about stuff without being judged.",
    nextYearTarget: "Transition to attending CAMHS independently; begin physical health fitness plan",
    reviewedBy: "staff_darren", reviewDate: d(-20),
  },
  {
    id: "ao_002", youngPerson: "yp_alex", reportingYear: "2025-2026", domain: "Education",
    targetSet: "Achieve 90% attendance and complete GCSEs in 5 core subjects",
    progressRating: 3, evidence: "Attendance at 82% — improved from 68% last year. Predicted grades: Maths 5, English 4, Science 4, History 5, Art 6. Two fixed-term exclusions for verbal aggression reduced from four last year.",
    barriersFaced: ["Peer conflict triggering refusal", "Morning routine difficulties", "Two exclusion periods"],
    supportProvided: ["PEP meeting termly with Virtual School", "Breakfast incentive programme", "Restorative meetings with school"],
    childView: "School is alright. I like History and Art. Maths is boring but I know I need it. I got excluded less this year so that is good.",
    nextYearTarget: "Achieve 90%+ attendance; sit all 5 GCSEs; no further exclusions",
    reviewedBy: "staff_darren", reviewDate: d(-20),
  },
  {
    id: "ao_003", youngPerson: "yp_alex", reportingYear: "2025-2026", domain: "Independence",
    targetSet: "Learn to cook 5 basic meals independently and manage weekly pocket money budget",
    progressRating: 4, evidence: "Alex can now cook 6 meals independently including pasta, stir fry, and a roast dinner. Manages weekly budget with minimal support — only needed prompting twice in the last quarter.",
    barriersFaced: ["Low motivation initially", "Difficulty with meal planning concept"],
    supportProvided: ["Weekly cooking sessions with key worker", "Visual recipe cards", "Budgeting app introduced"],
    childView: "I love cooking now, especially when I can make what I want. The budget thing is harder but I get it more now.",
    nextYearTarget: "Plan and shop for a full week of meals; open savings account and save towards a goal",
    reviewedBy: "staff_darren", reviewDate: d(-18),
  },
  {
    id: "ao_004", youngPerson: "yp_alex", reportingYear: "2025-2026", domain: "Relationships",
    targetSet: "Maintain positive contact with maternal grandmother and develop at least one stable peer friendship",
    progressRating: 5, evidence: "Alex has fortnightly contact with grandmother — relationship is thriving. Has developed a strong friendship with a classmate and has been invited to their home twice. Reduced conflict with peers in the home from weekly to monthly.",
    barriersFaced: ["Grandmother's health limiting some visits", "Trust issues with peers"],
    supportProvided: ["Supervised contact moved to community setting", "Social skills direct work", "Facilitated peer activities"],
    childView: "I love seeing my nan. She makes me laugh. And Jake from school is proper my mate now — we play football and Xbox.",
    nextYearTarget: "Explore possibility of unsupervised community contact with grandmother; maintain peer friendships",
    reviewedBy: "staff_darren", reviewDate: d(-18),
  },

  // Jordan — 4 records
  {
    id: "ao_005", youngPerson: "yp_jordan", reportingYear: "2025-2026", domain: "Emotional Wellbeing",
    targetSet: "Reduce self-harm incidents and develop healthy coping strategies",
    progressRating: 3, evidence: "Self-harm incidents reduced from monthly to quarterly. Jordan is using distraction techniques and ice-holding. Engages with art therapy weekly. Still experiences low mood periods but duration has shortened.",
    barriersFaced: ["Anniversary reactions to trauma dates", "Difficulty verbalising emotions", "Peer conflict triggering episodes"],
    supportProvided: ["Weekly art therapy", "Safety plan co-produced with Jordan", "Sensory box in room", "Staff trained in TIPP skills"],
    childView: "I still have bad days but they do not last as long. The art stuff helps me get things out without having to say it. I know the staff care about me.",
    nextYearTarget: "Develop ability to identify and communicate emotions before crisis point; explore trauma narrative work with therapist",
    reviewedBy: "staff_darren", reviewDate: d(-25),
  },
  {
    id: "ao_006", youngPerson: "yp_jordan", reportingYear: "2025-2026", domain: "Safety",
    targetSet: "No missing episodes and engage with online safety awareness",
    progressRating: 4, evidence: "Zero missing episodes this year — down from 3 last year. Jordan completed online safety module and can identify grooming tactics. Reports feeling safer in the home. Risk assessment reviewed and reduced from high to medium.",
    barriersFaced: ["Peer pressure from external contacts", "Historical exploitation concerns"],
    supportProvided: ["Contextual safeguarding plan", "Direct work on healthy relationships", "Phone spot-checks (with consent)", "NRM referral supported"],
    childView: "I know the staff do the safety stuff because they care, not to be nosy. I feel safer here than anywhere else I have lived.",
    nextYearTarget: "Maintain zero missing episodes; develop safety network map with trusted adults in community",
    reviewedBy: "staff_darren", reviewDate: d(-25),
  },
  {
    id: "ao_007", youngPerson: "yp_jordan", reportingYear: "2025-2026", domain: "Identity",
    targetSet: "Explore cultural identity and personal narrative through life story work",
    progressRating: 3, evidence: "Jordan has engaged with 8 life story sessions. Completed a cultural genogram and identity wheel. Expressed interest in learning more about heritage. Finds some topics distressing but is managing with support.",
    barriersFaced: ["Distressing memories surfacing", "Limited information about birth family", "Reluctance to discuss certain periods"],
    supportProvided: ["Life story worker sessions fortnightly", "Memory box provided", "Cultural activities incorporated into daily life"],
    childView: "I like knowing where I come from even though some of it is sad. My memory box is important to me. I want to know more about my dad side.",
    nextYearTarget: "Complete life story book; explore paternal heritage with social worker support",
    reviewedBy: "staff_darren", reviewDate: d(-22),
  },
  {
    id: "ao_008", youngPerson: "yp_jordan", reportingYear: "2025-2026", domain: "Health",
    targetSet: "Stable weight maintenance and engagement with dental treatment plan",
    progressRating: 2, evidence: "Weight remains a concern — BMI has increased from 28 to 30. Jordan disengaged from dietitian after 3 sessions. Dental treatment plan partially completed — 2 of 4 appointments attended. Emotional eating pattern identified but not yet addressed therapeutically.",
    barriersFaced: ["Emotional eating as coping mechanism", "Dental phobia", "Refusal to engage with dietitian"],
    supportProvided: ["Healthy meal planning with Jordan's input", "Gradual exposure plan for dental visits", "Activity options offered daily"],
    childView: "I know my weight is not great but I do not want people telling me what to eat. The dentist scares me. I will try to go more next time.",
    nextYearTarget: "Engage with revised healthy eating approach (not diet-focused); complete dental treatment; explore physical activity Jordan enjoys",
    reviewedBy: "staff_darren", reviewDate: d(-22),
  },

  // Casey — 4 records
  {
    id: "ao_009", youngPerson: "yp_casey", reportingYear: "2025-2026", domain: "Education",
    targetSet: "Transition to college and maintain 85% attendance in first term",
    progressRating: 5, evidence: "Casey achieved 94% attendance in first term at college. Passed all Level 2 modules with merit. Received student of the month award in November. Excellent feedback from tutors about engagement and attitude.",
    barriersFaced: ["Anxiety about new environment", "Travel independence needed", "Social anxiety with new peers"],
    supportProvided: ["Pre-transition visits to college", "Travel training over summer", "Weekly check-ins with personal tutor"],
    childView: "College is the best thing that happened to me. I actually want to learn and the tutors treat me like an adult. I am proud of my award.",
    nextYearTarget: "Progress to Level 3; maintain attendance; explore work experience placement",
    reviewedBy: "staff_darren", reviewDate: d(-15),
  },
  {
    id: "ao_010", youngPerson: "yp_casey", reportingYear: "2025-2026", domain: "Independence",
    targetSet: "Develop daily living skills in preparation for semi-independence at 17",
    progressRating: 4, evidence: "Casey independently manages laundry, cooking (10+ meals), and room maintenance. Has opened a bank account and manages monthly allowance. Travelled to college independently since October. Completed fire safety and first aid awareness.",
    barriersFaced: ["Over-reliance on staff prompts initially", "Anxiety about managing finances"],
    supportProvided: ["Independence pathway assessment completed", "Weekly life skills sessions", "Gradual withdrawal of prompts", "Visits to semi-independent provisions"],
    childView: "I feel ready to be more independent. I can do most things myself now. The bank account made me feel grown up. I am a bit nervous about moving on but excited too.",
    nextYearTarget: "Transition to semi-independent placement; manage all personal care and household tasks; attend Pathway Plan review",
    reviewedBy: "staff_darren", reviewDate: d(-15),
  },
  {
    id: "ao_011", youngPerson: "yp_casey", reportingYear: "2025-2026", domain: "Emotional Wellbeing",
    targetSet: "Develop emotional literacy and reduce anxiety-driven avoidance behaviours",
    progressRating: 4, evidence: "Casey's anxiety scale scores reduced from 24/42 to 14/42. Avoidance behaviours significantly decreased. Can now identify and name 5 core emotions. Uses grounding techniques independently. Voluntarily attended a social event for the first time.",
    barriersFaced: ["Avoidance patterns deeply embedded", "Social anxiety", "Difficulty trusting new environments"],
    supportProvided: ["CBT-based anxiety programme", "Graduated exposure hierarchy", "Emotional literacy direct work", "Key worker consistency"],
    childView: "My anxiety is still there but it does not boss me around as much. I went to the youth club and I was scared but I did it. That felt massive.",
    nextYearTarget: "Maintain progress; develop wider social network; consider peer mentoring role",
    reviewedBy: "staff_darren", reviewDate: d(-12),
  },
  {
    id: "ao_012", youngPerson: "yp_casey", reportingYear: "2025-2026", domain: "Relationships",
    targetSet: "Rebuild relationship with mother through supported contact and develop trust with professionals",
    progressRating: 3, evidence: "Contact with mother moved from supervised to supported. 6 successful community contacts completed. Relationship is improved but Casey still reports feeling let down when mother cancels. Trust with professionals developing — Casey now shares concerns with key worker unprompted.",
    barriersFaced: ["Mother cancelled 3 of 9 planned contacts", "Historical trust issues", "Casey's tendency to withdraw when hurt"],
    supportProvided: ["Contact support worker present", "Pre and post contact sessions", "Therapeutic life story work on family relationships", "Consistency from key worker"],
    childView: "Things with mum are better but she still lets me down sometimes and that hurts. I trust Anna and Darren though. I know they are not going to just disappear.",
    nextYearTarget: "Continue supported contact; explore family therapy; develop friendship group at college",
    reviewedBy: "staff_darren", reviewDate: d(-12),
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function AnnualOutcomesReportPage() {
  const [data] = useState(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterYP, setFilterYP] = useState("all");
  const [filterDomain, setFilterDomain] = useState("all");
  const [sortBy, setSortBy] = useState("rating-desc");

  const filtered = useMemo(() => {
    let rows = [...data];
    if (filterYP !== "all") rows = rows.filter((r) => r.youngPerson === filterYP);
    if (filterDomain !== "all") rows = rows.filter((r) => r.domain === filterDomain);
    rows.sort((a, b) => {
      switch (sortBy) {
        case "rating-desc": return b.progressRating - a.progressRating;
        case "rating-asc": return a.progressRating - b.progressRating;
        case "domain": return a.domain.localeCompare(b.domain);
        case "child": return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
        default: return 0;
      }
    });
    return rows;
  }, [data, filterYP, filterDomain, sortBy]);

  /* ── summary stats ── */
  const avgProgress = data.length > 0 ? (data.reduce((sum, r) => sum + r.progressRating, 0) / data.length).toFixed(1) : "0";
  const targetsAchieved = data.filter((r) => r.progressRating >= 4).length;
  const childrenReviewed = new Set(data.map((r) => r.youngPerson)).size;
  const domainsCovered = new Set(data.map((r) => r.domain)).size;

  const exportCols: ExportColumn<AnnualOutcome>[] = [
    { header: "Young Person", accessor: (r: AnnualOutcome) => getYPName(r.youngPerson) },
    { header: "Reporting Year", accessor: (r: AnnualOutcome) => r.reportingYear },
    { header: "Domain", accessor: (r: AnnualOutcome) => r.domain },
    { header: "Target Set", accessor: (r: AnnualOutcome) => r.targetSet },
    { header: "Progress Rating", accessor: (r: AnnualOutcome) => String(r.progressRating) },
    { header: "Evidence", accessor: (r: AnnualOutcome) => r.evidence },
    { header: "Barriers", accessor: (r: AnnualOutcome) => r.barriersFaced.join("; ") },
    { header: "Support Provided", accessor: (r: AnnualOutcome) => r.supportProvided.join("; ") },
    { header: "Child View", accessor: (r: AnnualOutcome) => r.childView },
    { header: "Next Year Target", accessor: (r: AnnualOutcome) => r.nextYearTarget },
    { header: "Reviewed By", accessor: (r: AnnualOutcome) => r.reviewedBy },
    { header: "Review Date", accessor: (r: AnnualOutcome) => r.reviewDate },
  ];

  return (
    <PageShell
      title="Annual Outcomes Report"
      subtitle="Year-End Progress · Care Plan Goals · Quality of Care Indicators"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Annual Outcomes Report" />
          <ExportButton data={data} columns={exportCols} filename="annual-outcomes-report" />
        </div>
      }
    >
      <div id="print-area">
        {/* ── summary stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Avg Progress Score", value: avgProgress, icon: BarChart3, clr: "text-blue-600" },
            { label: "Targets Achieved (4+/5)", value: targetsAchieved, icon: Target, clr: "text-green-600" },
            { label: "Children Reviewed", value: childrenReviewed, icon: Users, clr: "text-purple-600" },
            { label: "Domains Covered", value: domainsCovered, icon: Star, clr: "text-amber-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── filters / sort ── */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Select value={filterYP} onValueChange={setFilterYP}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Young Person" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
              <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
              <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterDomain} onValueChange={setFilterDomain}>
            <SelectTrigger className="w-[190px]"><SelectValue placeholder="Domain" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              {DOMAINS.map((dom) => (
                <SelectItem key={dom} value={dom}>{dom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px]">
              <div className="flex items-center gap-1">
                <ArrowUpDown className="h-3.5 w-3.5" />
                <SelectValue placeholder="Sort" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating-desc">Highest Rating</SelectItem>
              <SelectItem value="rating-asc">Lowest Rating</SelectItem>
              <SelectItem value="domain">Domain A-Z</SelectItem>
              <SelectItem value="child">Child A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── card list ── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            return (
              <Card key={r.id} className="border-l-4 border-l-blue-400">
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getYPName(r.youngPerson)}
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">{r.domain}</Badge>
                        <Badge variant="outline" className={RATING_CLR[r.progressRating]}>
                          {r.progressRating}/5 — {RATING_LABEL[r.progressRating]}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {r.targetSet}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Year: {r.reportingYear} · Reviewed: {r.reviewDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* progress bar mini */}
                      <div className="hidden sm:flex items-center gap-1 mr-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", RATING_BAR[r.progressRating])} style={{ width: `${(r.progressRating / 5) * 100}%` }} />
                        </div>
                      </div>
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* Evidence */}
                    <div>
                      <p className="font-medium mb-1">Evidence of Progress</p>
                      <p className="text-muted-foreground text-xs">{r.evidence}</p>
                    </div>

                    {/* Barriers */}
                    {r.barriersFaced.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 text-amber-700">Barriers Faced</p>
                        <ul className="space-y-1">
                          {r.barriersFaced.map((b, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <ShieldCheck className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Support Provided */}
                    {r.supportProvided.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 text-green-700">Support Provided</p>
                        <ul className="space-y-1">
                          {r.supportProvided.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <TrendingUp className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Child's Own View */}
                    <div className="bg-purple-50 border border-purple-200 rounded p-2">
                      <p className="font-medium text-xs text-purple-800 mb-1">Child&apos;s Own View</p>
                      <p className="text-xs text-purple-700 italic">&ldquo;{r.childView}&rdquo;</p>
                    </div>

                    {/* Next Year Target */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="font-medium text-xs text-blue-800 mb-1">Next Year Target</p>
                      <p className="text-xs text-blue-700">{r.nextYearTarget}</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No outcomes match the current filters.
          </div>
        )}

        {/* ── regulatory reference ── */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>
            Annual outcomes reporting is aligned with <strong>Quality Standard 1</strong> (children receive care that is focused on their individual needs and feelings) and <strong>Regulation 5</strong> (quality of care — ensuring children&apos;s needs are met and they make measurable progress). Outcomes are tracked against the <strong>SCCIF outcomes framework</strong>, evidencing that children are helped to achieve their potential across all developmental domains. Progress ratings inform care plan reviews, LAC reviews, and the home&apos;s Statement of Purpose evaluation.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
