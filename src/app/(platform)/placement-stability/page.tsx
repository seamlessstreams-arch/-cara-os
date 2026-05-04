"use client";

import { useState, useMemo } from "react";
import {
  Home, Search, ArrowUpDown, Filter,
  AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
  ChevronDown, ChevronUp, Calendar, Shield,
  Heart, Target, Clock,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ───────────────────────────────────────────────────────────── */
const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;
type RiskLevel = typeof RISK_LEVELS[number];
const RISK_COLORS: Record<RiskLevel, string> = {
  low: "bg-green-100 text-green-800", medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800", critical: "bg-red-100 text-red-800",
};

interface StabilityFactor {
  factor: string;
  status: "positive" | "concern" | "risk";
  detail: string;
}

interface PlacementEvent {
  date: string;
  event: string;
  impact: "positive" | "neutral" | "negative";
  response: string;
}

interface PlacementRecord {
  id: string;
  youngPersonId: string;
  placementStartDate: string;
  daysInPlacement: number;
  previousPlacements: number;
  stabilityRisk: RiskLevel;
  trend: "improving" | "stable" | "declining";
  keyWorker: string;
  socialWorker: string;
  lastReview: string;
  nextReview: string;
  factors: StabilityFactor[];
  recentEvents: PlacementEvent[];
  strengths: string[];
  concerns: string[];
  actionPlan: string;
  notes: string;
}

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: PlacementRecord[] = [
  {
    id: "ps_1", youngPersonId: "yp_alex",
    placementStartDate: d(-420), daysInPlacement: 420,
    previousPlacements: 4, stabilityRisk: "medium", trend: "stable",
    keyWorker: "staff_anna", socialWorker: "Sarah Mitchell",
    lastReview: d(-30), nextReview: d(60),
    factors: [
      { factor: "Attachment to Staff", status: "positive", detail: "Strong bond with key worker. Trusts the team. Seeks support when anxious." },
      { factor: "Education Engagement", status: "concern", detail: "Attendance at 78%. Refusing some days. Possible bullying issue being investigated." },
      { factor: "Peer Relationships", status: "positive", detail: "Gets on well with Jordan and Casey. Some sibling-like dynamics — normal." },
      { factor: "Emotional Regulation", status: "concern", detail: "Social media triggers distress. Late-night phone use causing sleep disruption." },
      { factor: "Family Contact", status: "positive", detail: "Regular contact with mum. Relationship improving. No safeguarding concerns from contact." },
      { factor: "Sense of Belonging", status: "positive", detail: "Refers to Oak House as 'home'. Decorated room with personal items. Has favourite chair." },
    ],
    recentEvents: [
      { date: d(-8), event: "Internal truancy — went to park instead of school", impact: "negative", response: "Discussed bullying concerns. Meeting with school arranged." },
      { date: d(-4), event: "Social media distress — late-night incident", impact: "negative", response: "Phone routine adjusted. Key work session on online safety." },
      { date: d(-1), event: "Volunteered to help cook Sunday dinner", impact: "positive", response: "Praised and thanked. Added cooking to activity plan." },
    ],
    strengths: [
      "Longest placement to date — significant achievement",
      "Strong attachment to key worker and staff team",
      "Growing sense of home and belonging",
      "Improving relationship with family",
    ],
    concerns: [
      "Education attendance below target",
      "Social media impacting emotional wellbeing",
      "Previous placement breakdowns may affect trust during challenging periods",
    ],
    actionPlan: "Education attendance action plan with school. Phone use boundaries being reinforced consistently. Key work to continue focusing on emotional literacy. Consider CAMHS re-referral if anxiety continues. Maintain strong relationship base — this is Alex's anchor.",
    notes: "Alex has made enormous progress. This is the longest and most stable placement. Must protect this — school attendance and phone management are the key risks to monitor.",
  },
  {
    id: "ps_2", youngPersonId: "yp_jordan",
    placementStartDate: d(-150), daysInPlacement: 150,
    previousPlacements: 2, stabilityRisk: "low", trend: "improving",
    keyWorker: "staff_anna", socialWorker: "Tom Richards",
    lastReview: d(-14), nextReview: d(76),
    factors: [
      { factor: "Settling In", status: "positive", detail: "Initial anxieties resolved. Now fully settled. Feels comfortable in the home." },
      { factor: "Education Engagement", status: "positive", detail: "Good attendance. Making friends at school. Positive reports from teachers." },
      { factor: "Peer Relationships", status: "positive", detail: "Good relationship with Alex and Casey. Enjoys communal activities." },
      { factor: "Emotional Regulation", status: "positive", detail: "Anxiety around contact visits has reduced. Uses coping strategies taught in key work." },
      { factor: "Family Contact", status: "concern", detail: "Contact with father remains supervised. Some anxiety before visits but managing well." },
      { factor: "Sense of Belonging", status: "positive", detail: "Told Reg 44 visitor this is 'the best home'. Room fully personalised." },
    ],
    recentEvents: [
      { date: d(-14), event: "Positive LAC review — stability praised by IRO", impact: "positive", response: "Celebrated with Jordan. Shared feedback with team." },
      { date: d(-7), event: "Couldn't sleep before contact visit — anxious", impact: "negative", response: "Staff sat with Jordan. Made warm drink. Talked through worries." },
      { date: d(-2), event: "Scored winning goal at school football match", impact: "positive", response: "Staff attended to watch. Jordan beaming. Photo for life story book." },
    ],
    strengths: [
      "Rapid settling-in — credited to skilled staff team",
      "Excellent school engagement and peer relationships",
      "Growing confidence and self-esteem",
      "Strong attachment forming with the home",
    ],
    concerns: [
      "Anxiety around paternal contact — needs continued support",
      "Only 5 months in — still in critical stability window",
    ],
    actionPlan: "Maintain consistency of care and routine. Pre-contact support to continue. School engagement to be celebrated and reinforced. Key work to build on emotional literacy. Life story work to be started.",
    notes: "Jordan is settling beautifully. The team has done an excellent job. Must maintain this trajectory — consistency is key. Contact anxiety is manageable with current support.",
  },
  {
    id: "ps_3", youngPersonId: "yp_casey",
    placementStartDate: d(-310), daysInPlacement: 310,
    previousPlacements: 1, stabilityRisk: "low", trend: "improving",
    keyWorker: "staff_chervelle", socialWorker: "Lisa Park",
    lastReview: d(-45), nextReview: d(45),
    factors: [
      { factor: "Attachment to Staff", status: "positive", detail: "Very close to key worker. Comfortable with all staff. Asks for help appropriately." },
      { factor: "Education Engagement", status: "positive", detail: "Thriving at college. Art portfolio developing well. Tutor relationship strong." },
      { factor: "Emotional Wellbeing", status: "concern", detail: "Anxiety being managed with CAMHS support. Some difficulty sleeping. Generally improving." },
      { factor: "Peer Relationships", status: "positive", detail: "Good friendships at college and in the home. Social confidence growing." },
      { factor: "Family Contact", status: "positive", detail: "Good relationship with mother. Regular contact. Mother engaged with care plan." },
      { factor: "Independence Skills", status: "positive", detail: "Cooking, budgeting, and self-care skills developing well. Transition planning underway." },
    ],
    recentEvents: [
      { date: d(-6), event: "College inset day — Casey chose to do art at home", impact: "positive", response: "Provided art supplies. Casey produced impressive piece for portfolio." },
      { date: d(-3), event: "CAMHS review — positive progress noted", impact: "positive", response: "CAMHS recommendations integrated into daily support plan." },
      { date: d(-1), event: "Requested more vegetarian options — expressed preference", impact: "positive", response: "Menu planning updated. Casey involved in meal decisions." },
    ],
    strengths: [
      "Only one previous placement — strong stability history",
      "Thriving in education with clear talent and motivation",
      "Good family relationships supporting stability",
      "Developing independence skills ahead of transition",
    ],
    concerns: [
      "Anxiety management is ongoing — CAMHS engagement essential",
      "Sleep difficulties occasionally impact daily functioning",
    ],
    actionPlan: "CAMHS sessions to continue. Sleep hygiene strategies being implemented. College engagement celebrated and supported. Transition planning to progress at Casey's pace. Mother to be more involved in care plan reviews.",
    notes: "Casey is in a really good place. The placement is strong and stable. Anxiety is the main area of focus but is being well-managed. College success is a protective factor.",
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function PlacementStabilityPage() {
  const [records] = useState<PlacementRecord[]>(SEED);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("risk");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          getYPName(r.youngPersonId).toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q) ||
          r.actionPlan.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "risk": return RISK_LEVELS.indexOf(b.stabilityRisk) - RISK_LEVELS.indexOf(a.stabilityRisk);
        case "days": return b.daysInPlacement - a.daysInPlacement;
        case "name": return getYPName(a.youngPersonId).localeCompare(getYPName(b.youngPersonId));
        default: return 0;
      }
    });
    return list;
  }, [records, search, sortBy]);

  const avgDays = Math.round(records.reduce((s, r) => s + r.daysInPlacement, 0) / records.length);
  const atRisk = records.filter((r) => r.stabilityRisk === "high" || r.stabilityRisk === "critical").length;
  const improving = records.filter((r) => r.trend === "improving").length;

  const exportCols: ExportColumn<PlacementRecord>[] = [
    { header: "Young Person", accessor: (r: PlacementRecord) => getYPName(r.youngPersonId) },
    { header: "Placement Start", accessor: (r: PlacementRecord) => r.placementStartDate },
    { header: "Days in Placement", accessor: (r: PlacementRecord) => r.daysInPlacement },
    { header: "Previous Placements", accessor: (r: PlacementRecord) => r.previousPlacements },
    { header: "Stability Risk", accessor: (r: PlacementRecord) => r.stabilityRisk },
    { header: "Trend", accessor: (r: PlacementRecord) => r.trend },
    { header: "Key Worker", accessor: (r: PlacementRecord) => getStaffName(r.keyWorker) },
    { header: "Social Worker", accessor: (r: PlacementRecord) => r.socialWorker },
    { header: "Strengths", accessor: (r: PlacementRecord) => r.strengths.join("; ") },
    { header: "Concerns", accessor: (r: PlacementRecord) => r.concerns.join("; ") },
    { header: "Factors", accessor: (r: PlacementRecord) => r.factors.map((f: StabilityFactor) => `${f.factor}: ${f.status}`).join("; ") },
    { header: "Action Plan", accessor: (r: PlacementRecord) => r.actionPlan },
    { header: "Next Review", accessor: (r: PlacementRecord) => r.nextReview },
    { header: "Notes", accessor: (r: PlacementRecord) => r.notes },
  ];

  return (
    <PageShell
      title="Placement Stability"
      subtitle="Monitor and support placement stability for every young person"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Placement Stability" />
          <ExportButton data={filtered} columns={exportCols} filename="placement-stability" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Young People", value: records.length, icon: Heart, colour: "text-pink-600" },
            { label: "Avg. Days in Placement", value: avgDays, icon: Calendar, colour: "text-blue-600" },
            { label: "At Risk", value: atRisk, icon: AlertTriangle, colour: atRisk > 0 ? "text-red-600" : "text-green-600" },
            { label: "Improving", value: improving, icon: TrendingUp, colour: "text-green-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── filters ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search young people, notes…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="risk">Risk Level</SelectItem>
                <SelectItem value="days">Days in Placement</SelectItem>
                <SelectItem value="name">Young Person</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── cards ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((rec) => {
            const isExpanded = expanded === rec.id;
            const concerns = rec.factors.filter((f: StabilityFactor) => f.status !== "positive").length;

            return (
              <div key={rec.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : rec.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Home className={cn("h-5 w-5 shrink-0",
                      rec.stabilityRisk === "low" ? "text-green-600" :
                      rec.stabilityRisk === "medium" ? "text-yellow-600" :
                      "text-red-600"
                    )} />
                    <div className="min-w-0">
                      <p className="font-medium">{getYPName(rec.youngPersonId)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {rec.daysInPlacement} days · {rec.previousPlacements} previous placement(s) · KW: {getStaffName(rec.keyWorker)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {rec.trend === "improving" && <TrendingUp className="h-4 w-4 text-green-600" />}
                    {rec.trend === "declining" && <TrendingDown className="h-4 w-4 text-red-600" />}
                    <Badge className={cn("text-xs", RISK_COLORS[rec.stabilityRisk])}>
                      {rec.stabilityRisk.charAt(0).toUpperCase() + rec.stabilityRisk.slice(1)} Risk
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* meta */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Placed:</span> <span className="font-medium">{rec.placementStartDate}</span></div>
                      <div><span className="text-muted-foreground">Social Worker:</span> <span className="font-medium">{rec.socialWorker}</span></div>
                      <div><span className="text-muted-foreground">Last Review:</span> <span className="font-medium">{rec.lastReview}</span></div>
                      <div><span className="text-muted-foreground">Next Review:</span> <span className="font-medium">{rec.nextReview}</span></div>
                    </div>

                    {/* stability factors */}
                    <div>
                      <p className="text-sm font-medium mb-2">Stability Factors</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {rec.factors.map((f: StabilityFactor, idx: number) => (
                          <div key={idx} className={cn("rounded-lg border p-2.5 text-sm",
                            f.status === "positive" ? "bg-green-50 border-green-200" :
                            f.status === "concern" ? "bg-yellow-50 border-yellow-200" :
                            "bg-red-50 border-red-200"
                          )}>
                            <div className="flex items-center gap-2 mb-1">
                              {f.status === "positive" ? <CheckCircle2 className="h-3 w-3 text-green-600" /> :
                               f.status === "concern" ? <AlertTriangle className="h-3 w-3 text-yellow-600" /> :
                               <Shield className="h-3 w-3 text-red-600" />}
                              <span className="font-medium">{f.factor}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{f.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* recent events */}
                    <div>
                      <p className="text-sm font-medium mb-2">Recent Events</p>
                      <div className="space-y-2">
                        {rec.recentEvents.map((evt: PlacementEvent, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 rounded-lg border bg-white p-2.5 text-sm">
                            {evt.impact === "positive" ? <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> :
                             evt.impact === "negative" ? <TrendingDown className="h-4 w-4 text-red-600 mt-0.5 shrink-0" /> :
                             <Clock className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />}
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{evt.date}</Badge>
                                <span>{evt.event}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">Response: {evt.response}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* strengths & concerns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <p className="text-xs font-medium text-green-700 mb-2">Strengths</p>
                        <ul className="space-y-1">
                          {rec.strengths.map((s: string, i: number) => (
                            <li key={i} className="flex items-start gap-1 text-sm">
                              <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-orange-50 border border-orange-200 p-3">
                        <p className="text-xs font-medium text-orange-700 mb-2">Concerns</p>
                        <ul className="space-y-1">
                          {rec.concerns.map((c: string, i: number) => (
                            <li key={i} className="flex items-start gap-1 text-sm">
                              <AlertTriangle className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* action plan */}
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <Target className="h-4 w-4 text-blue-600" />
                        <p className="text-xs font-medium text-blue-700">Action Plan</p>
                      </div>
                      <p className="text-sm">{rec.actionPlan}</p>
                    </div>

                    {/* notes */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">RM Notes</p>
                      <p className="text-sm">{rec.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Placement Stability:</strong> Reg 5 requires that children experience stable placements
          that meet their needs. The home must actively monitor stability factors and take proactive steps
          to address emerging risks. Placement breakdowns should be prevented through early intervention,
          skilled relationship-building, and partnership with placing authorities.
        </div>
      </div>
    </PageShell>
  );
}
