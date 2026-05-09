"use client";

import { useState, useMemo } from "react";
import {
  HeartPulse, Search, ArrowUpDown, Filter,
  TrendingUp, TrendingDown, Minus, Sparkles,
  ChevronDown, ChevronUp, MessageCircle, Quote,
  AlertTriangle, CheckCircle2, Smile, Calendar,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useWellbeingPulseSurveyRecords } from "@/hooks/use-wellbeing-pulse-survey-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type {
  WellbeingPulseSurveyRecord,
  WellbeingPulseMethod,
  WellbeingPulseTrend,
  WellbeingPulseDimension,
} from "@/types/extended";
import {
  WELLBEING_PULSE_METHOD_LABEL,
  WELLBEING_PULSE_TREND_LABEL,
  WELLBEING_PULSE_DIMENSION_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── helpers ───────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── local config (icons / colours — not serialisable) ─────────────────── */

const METHOD_COLORS: Record<WellbeingPulseMethod, string> = {
  visual_cards: "bg-purple-100 text-purple-800",
  one_to_ten_scale: "bg-blue-100 text-blue-800",
  conversation: "bg-green-100 text-green-800",
  drawing: "bg-pink-100 text-pink-800",
  emoji_selection: "bg-yellow-100 text-yellow-800",
  written: "bg-slate-100 text-slate-800",
};

const TREND_CONFIG: Record<WellbeingPulseTrend, { color: string; icon: typeof TrendingUp }> = {
  up: { color: "bg-green-100 text-green-800", icon: TrendingUp },
  stable: { color: "bg-blue-100 text-blue-800", icon: Minus },
  down: { color: "bg-red-100 text-red-800", icon: TrendingDown },
  first_survey: { color: "bg-slate-100 text-slate-700", icon: Sparkles },
};

const ALL_DIMENSIONS: WellbeingPulseDimension[] = [
  "feeling_safe", "feeling_listened_to", "friendships",
  "school_activities", "family_contact", "mood_today",
];

const ALL_METHODS: WellbeingPulseMethod[] = ["visual_cards", "one_to_ten_scale", "conversation", "drawing", "emoji_selection", "written"];
const ALL_TRENDS: WellbeingPulseTrend[] = ["up", "stable", "down", "first_survey"];

/* ── component ──────────────────────────────────────────────────────────── */
export default function WellbeingPulseSurveyPage() {
  const { data: records = [], isLoading } = useWellbeingPulseSurveyRecords();
  const [search, setSearch] = useState("");
  const [filterYP, setFilterYP] = useState("all");
  const [filterTrend, setFilterTrend] = useState("all");
  const [filterMethod, setFilterMethod] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.verbatim_quote.toLowerCase().includes(q) ||
          r.staff_observations.toLowerCase().includes(q) ||
          r.key_themes.some((t) => t.toLowerCase().includes(q)) ||
          r.actions_arising.some((a) => a.toLowerCase().includes(q))
      );
    }
    if (filterYP !== "all") list = list.filter((r) => r.child_id === filterYP);
    if (filterTrend !== "all") list = list.filter((r) => r.trend_vs_last === filterTrend);
    if (filterMethod !== "all") list = list.filter((r) => r.method === filterMethod);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.date.localeCompare(a.date);
        case "yp": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "score-high": return b.overall_score - a.overall_score;
        case "score-low": return a.overall_score - b.overall_score;
        case "trend": return a.trend_vs_last.localeCompare(b.trend_vs_last);
        default: return 0;
      }
    });
    return list;
  }, [records, search, filterYP, filterTrend, filterMethod, sortBy]);

  /* stats */
  const sevenDaysAgo = d(-7);
  const thisWeek = records.filter((r) => r.date >= sevenDaysAgo).length;
  const avgOverall = records.length === 0 ? 0
    : records.reduce((s, r) => s + r.overall_score, 0) / records.length;
  const trendUp = records.filter((r) => r.trend_vs_last === "up").length;
  const trendStable = records.filter((r) => r.trend_vs_last === "stable").length;
  const trendDown = records.filter((r) => r.trend_vs_last === "down").length;
  const followUps = records.filter((r) => r.follow_up_needed).length;

  const ypIds = useMemo(() => [...new Set(records.map((r) => r.child_id))], [records]);

  const exportCols: ExportColumn<WellbeingPulseSurveyRecord>[] = [
    { header: "ID", accessor: (r: WellbeingPulseSurveyRecord) => r.id },
    { header: "Young Person", accessor: (r: WellbeingPulseSurveyRecord) => getYPName(r.child_id) },
    { header: "Date", accessor: (r: WellbeingPulseSurveyRecord) => r.date },
    { header: "Conducted By", accessor: (r: WellbeingPulseSurveyRecord) => getStaffName(r.conducted_by) },
    { header: "Method", accessor: (r: WellbeingPulseSurveyRecord) => WELLBEING_PULSE_METHOD_LABEL[r.method] },
    { header: "Duration (min)", accessor: (r: WellbeingPulseSurveyRecord) => r.duration_minutes },
    { header: "Feeling Safe", accessor: (r: WellbeingPulseSurveyRecord) => r.scores.feeling_safe },
    { header: "Feeling Listened To", accessor: (r: WellbeingPulseSurveyRecord) => r.scores.feeling_listened_to },
    { header: "Friendships", accessor: (r: WellbeingPulseSurveyRecord) => r.scores.friendships },
    { header: "School/Activities", accessor: (r: WellbeingPulseSurveyRecord) => r.scores.school_activities },
    { header: "Family/Contact", accessor: (r: WellbeingPulseSurveyRecord) => r.scores.family_contact },
    { header: "Mood Today", accessor: (r: WellbeingPulseSurveyRecord) => r.scores.mood_today },
    { header: "Overall Score", accessor: (r: WellbeingPulseSurveyRecord) => r.overall_score.toFixed(1) },
    { header: "Verbatim Quote", accessor: (r: WellbeingPulseSurveyRecord) => r.verbatim_quote },
    { header: "Key Themes", accessor: (r: WellbeingPulseSurveyRecord) => r.key_themes.join("; ") },
    { header: "Staff Observations", accessor: (r: WellbeingPulseSurveyRecord) => r.staff_observations },
    { header: "Trend", accessor: (r: WellbeingPulseSurveyRecord) => WELLBEING_PULSE_TREND_LABEL[r.trend_vs_last] },
    { header: "Actions Arising", accessor: (r: WellbeingPulseSurveyRecord) => r.actions_arising.join("; ") },
    { header: "Follow-Up Needed", accessor: (r: WellbeingPulseSurveyRecord) => r.follow_up_needed ? "Yes" : "No" },
    { header: "Follow-Up By", accessor: (r: WellbeingPulseSurveyRecord) => r.follow_up_by ? getStaffName(r.follow_up_by) : "" },
  ];

  const scoreColor = (n: number) =>
    n >= 8 ? "text-green-600" :
    n >= 6 ? "text-blue-600" :
    n >= 4 ? "text-amber-600" : "text-red-600";

  const scoreBar = (n: number) =>
    n >= 8 ? "bg-green-500" :
    n >= 6 ? "bg-blue-500" :
    n >= 4 ? "bg-amber-500" : "bg-red-500";

  if (isLoading) {
    return (
      <PageShell title="Wellbeing Pulse Survey" subtitle="Short, frequent check-ins capturing each child's voice — distinct from full assessments">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Wellbeing Pulse Survey"
      subtitle="Short, frequent check-ins capturing each child's voice — distinct from full assessments"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Wellbeing Pulse Survey" />
          <ExportButton data={filtered} columns={exportCols} filename="wellbeing-pulse-survey" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border bg-white p-4 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">This Week</p>
              <p className="text-lg font-bold">{thisWeek}</p>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4 flex items-center gap-3">
            <Smile className={cn("h-5 w-5", scoreColor(avgOverall))} />
            <div>
              <p className="text-xs text-muted-foreground">Avg Overall Score</p>
              <p className={cn("text-lg font-bold", scoreColor(avgOverall))}>
                {avgOverall.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">/10</span>
              </p>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs text-muted-foreground mb-1">Trends</p>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 text-green-600 font-semibold">
                <TrendingUp className="h-3.5 w-3.5" /> {trendUp}
              </span>
              <span className="flex items-center gap-1 text-blue-600 font-semibold">
                <Minus className="h-3.5 w-3.5" /> {trendStable}
              </span>
              <span className="flex items-center gap-1 text-red-600 font-semibold">
                <TrendingDown className="h-3.5 w-3.5" /> {trendDown}
              </span>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4 flex items-center gap-3">
            <AlertTriangle className={cn("h-5 w-5", followUps > 0 ? "text-amber-600" : "text-slate-400")} />
            <div>
              <p className="text-xs text-muted-foreground">Follow-ups Needed</p>
              <p className={cn("text-lg font-bold", followUps > 0 && "text-amber-600")}>{followUps}</p>
            </div>
          </div>
        </div>

        {/* ── alerts ──────────────────────────────────────────────────── */}
        {trendDown > 0 && (
          <div className="rounded-lg border-l-4 border-red-400 bg-red-50 p-4">
            <div className="flex items-start gap-2">
              <TrendingDown className="h-5 w-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800">
                <strong>{trendDown}</strong> survey(s) show a downward trend. Review key work plans and
                consider escalation to wellbeing meeting where wellbeing is declining.
              </p>
            </div>
          </div>
        )}

        {/* ── filters ────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quotes, observations, themes…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterYP} onValueChange={setFilterYP}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Children</SelectItem>
                {ypIds.map((id) => (
                  <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={filterTrend} onValueChange={setFilterTrend}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trends</SelectItem>
              {ALL_TRENDS.map((t) => (
                <SelectItem key={t} value={t}>{WELLBEING_PULSE_TREND_LABEL[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterMethod} onValueChange={setFilterMethod}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              {ALL_METHODS.map((m) => (
                <SelectItem key={m} value={m}>{WELLBEING_PULSE_METHOD_LABEL[m]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Recent)</SelectItem>
                <SelectItem value="yp">Young Person</SelectItem>
                <SelectItem value="score-high">Score (High → Low)</SelectItem>
                <SelectItem value="score-low">Score (Low → High)</SelectItem>
                <SelectItem value="trend">Trend</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── list ───────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No pulse surveys match your filters.</div>
          )}
          {filtered.map((rec) => {
            const isExpanded = expandedId === rec.id;
            const trendCfg = TREND_CONFIG[rec.trend_vs_last];
            const TrendIcon = trendCfg.icon;
            return (
              <div key={rec.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <HeartPulse className={cn("h-5 w-5 shrink-0", scoreColor(rec.overall_score))} />
                    <div className="min-w-0">
                      <p className="font-medium">
                        {getYPName(rec.child_id)} — {rec.date}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {WELLBEING_PULSE_METHOD_LABEL[rec.method]} · {rec.duration_minutes} min · {getStaffName(rec.conducted_by)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-bold tabular-nums", scoreColor(rec.overall_score))}>
                      {rec.overall_score.toFixed(1)}
                    </span>
                    <Badge className={cn("text-xs gap-1", trendCfg.color)}>
                      <TrendIcon className="h-3 w-3" />
                      {WELLBEING_PULSE_TREND_LABEL[rec.trend_vs_last]}
                    </Badge>
                    {rec.follow_up_needed && (
                      <Badge className="bg-amber-100 text-amber-800 text-xs">Follow-up</Badge>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Method:</span>{" "}
                        <Badge className={cn("text-xs", METHOD_COLORS[rec.method])}>{WELLBEING_PULSE_METHOD_LABEL[rec.method]}</Badge>
                      </div>
                      <div><span className="text-muted-foreground">Duration:</span> <span className="font-medium">{rec.duration_minutes} min</span></div>
                      <div><span className="text-muted-foreground">Conducted by:</span> <span className="font-medium">{getStaffName(rec.conducted_by)}</span></div>
                      <div className="flex items-center gap-1">
                        {rec.follow_up_needed ? (
                          <>
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                            <span>Follow-up: <strong>{getStaffName(rec.follow_up_by)}</strong></span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                            <span>No follow-up needed</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* dimension scores */}
                    <div className="rounded-lg bg-white border p-4">
                      <p className="text-xs font-medium text-slate-600 mb-3">Dimension Scores</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {ALL_DIMENSIONS.map((dim) => {
                          const v = rec.scores[dim];
                          return (
                            <div key={dim}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-700">{WELLBEING_PULSE_DIMENSION_LABEL[dim]}</span>
                                <span className={cn("font-bold tabular-nums", scoreColor(v))}>{v}/10</span>
                              </div>
                              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className={cn("h-full rounded-full", scoreBar(v))}
                                  style={{ width: `${v * 10}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* verbatim quote */}
                    <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
                      <div className="flex items-start gap-2">
                        <Quote className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-purple-700 mb-1">Child&apos;s Own Words</p>
                          <p className="text-sm italic text-purple-900">&ldquo;{rec.verbatim_quote}&rdquo;</p>
                        </div>
                      </div>
                    </div>

                    {/* key themes */}
                    {rec.key_themes.length > 0 && (
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs font-medium text-slate-600 mb-2">Key Themes</p>
                        <div className="flex flex-wrap gap-1.5">
                          {rec.key_themes.map((t, i) => (
                            <Badge key={i} className="bg-blue-50 text-blue-700 border border-blue-200 text-xs">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* staff observations */}
                    <div className="rounded-lg bg-white border p-3">
                      <div className="flex items-start gap-2">
                        <MessageCircle className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-slate-600 mb-1">Staff Observations</p>
                          <p className="text-sm">{rec.staff_observations}</p>
                        </div>
                      </div>
                    </div>

                    {/* actions arising */}
                    {rec.actions_arising.length > 0 && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <p className="text-xs font-medium text-amber-800 mb-2">Actions Arising</p>
                        <ul className="text-sm space-y-1">
                          {rec.actions_arising.map((a, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-amber-600 mt-0.5">•</span>
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* smart link panel */}
                    <SmartLinkPanel
                      sourceType="wellbeing-pulse-survey-record"
                      sourceId={rec.id}
                      childId={rec.child_id}
                      compact
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ───────────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Quality Standards 1 &amp; 7:</strong> The Children&apos;s Homes (England) Regulations 2015
          require homes to ensure children are listened to and that their wishes and feelings are
          actively sought. Pulse surveys are short, frequent check-ins distinct from full LAC reviews
          or wellbeing assessments — they capture each child&apos;s voice between formal touchpoints,
          surface emerging concerns early, and demonstrate ongoing engagement to Ofsted, IROs, and
          Reg 44 visitors. Patterns across surveys feed into care plan reviews and key work planning.
        </div>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
