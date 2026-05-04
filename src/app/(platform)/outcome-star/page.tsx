"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type Domain = "safety" | "emotional_wellbeing" | "physical_health" | "education" | "relationships" | "identity" | "independence" | "social_presentation" | "self_care" | "community";

interface OutcomeStarAssessment {
  id: string;
  youngPersonId: string;
  assessedById: string;
  date: string;
  scores: Record<Domain, number>;
  previousScores: Record<Domain, number> | null;
  childViews: string;
  staffViews: string;
  actionPlan: { domain: Domain; action: string }[];
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const DOMAIN_LABEL: Record<Domain, string> = {
  safety: "Safety & Stability", emotional_wellbeing: "Emotional Wellbeing", physical_health: "Physical Health",
  education: "Education & Learning", relationships: "Relationships", identity: "Identity & Self-Esteem",
  independence: "Independence", social_presentation: "Social Presentation", self_care: "Self-Care Skills",
  community: "Community & Belonging",
};

const DOMAINS: Domain[] = ["safety", "emotional_wellbeing", "physical_health", "education", "relationships", "identity", "independence", "social_presentation", "self_care", "community"];

function scoreColor(score: number): string {
  if (score >= 8) return "text-green-700 bg-green-100";
  if (score >= 6) return "text-blue-700 bg-blue-100";
  if (score >= 4) return "text-amber-700 bg-amber-100";
  return "text-red-700 bg-red-100";
}

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: OutcomeStarAssessment[] = [
  {
    id: "os_001", youngPersonId: "yp_alex", assessedById: "staff_ryan", date: d(-14),
    scores: { safety: 8, emotional_wellbeing: 7, physical_health: 9, education: 7, relationships: 6, identity: 7, independence: 6, social_presentation: 8, self_care: 8, community: 7 },
    previousScores: { safety: 7, emotional_wellbeing: 6, physical_health: 8, education: 6, relationships: 5, identity: 6, independence: 5, social_presentation: 7, self_care: 7, community: 6 },
    childViews: "Alex said he feels 'pretty good about things' at the moment. He's enjoying football and feels settled at school. He scored himself slightly lower on relationships because he misses his mum and wishes he could see his dad more. Alex scored himself high on physical health because of his fitness and football.",
    staffViews: "Alex has made strong progress across all domains since the last assessment 3 months ago. His sense of safety has improved since the placement stabilised. Education scores are up following consistent school attendance (91%). Relationships remains the area for growth — Alex is building positive peer relationships but family contact is a source of both comfort and anxiety.",
    actionPlan: [
      { domain: "relationships", action: "Increase contact with dad to fortnightly (discuss with SW)" },
      { domain: "independence", action: "Begin cooking skills sessions weekly with key worker" },
      { domain: "education", action: "Support Alex to attend after-school revision club for maths" },
    ],
  },
  {
    id: "os_002", youngPersonId: "yp_jordan", assessedById: "staff_anna", date: d(-10),
    scores: { safety: 7, emotional_wellbeing: 5, physical_health: 7, education: 5, relationships: 4, identity: 6, independence: 4, social_presentation: 6, self_care: 5, community: 4 },
    previousScores: { safety: 6, emotional_wellbeing: 5, physical_health: 7, education: 4, relationships: 4, identity: 5, independence: 4, social_presentation: 5, self_care: 5, community: 3 },
    childViews: "Jordan found the assessment challenging to complete verbally (ASD communication needs). Used a visual scale (1-10 faces) instead. Jordan pointed to 'happy face' for physical health and safety. Jordan pointed to 'worried face' for education (part-time timetable causing stress) and community (doesn't feel they belong anywhere outside the home). Jordan's advocate supported the process.",
    staffViews: "Jordan's scores reflect the ongoing challenges with education (part-time timetable) and social integration. Safety has improved as Jordan feels more secure in the placement. Independence skills remain limited — Jordan relies heavily on staff for daily routines but this is linked to ASD needs rather than capability. Community is the key growth area — Jordan has limited activities outside the home beyond school.",
    actionPlan: [
      { domain: "community", action: "Explore local ASD-friendly activity groups (swimming, Lego club)" },
      { domain: "education", action: "Work with school to increase timetable hours incrementally" },
      { domain: "independence", action: "Visual schedule for morning routine — build independent completion" },
      { domain: "emotional_wellbeing", action: "CAMHS review — discuss anxiety management strategies" },
    ],
  },
  {
    id: "os_003", youngPersonId: "yp_casey", assessedById: "staff_chervelle", date: d(-7),
    scores: { safety: 3, emotional_wellbeing: 3, physical_health: 6, education: 4, relationships: 3, identity: 4, independence: 5, social_presentation: 7, self_care: 7, community: 3 },
    previousScores: { safety: 4, emotional_wellbeing: 4, physical_health: 6, education: 5, relationships: 4, identity: 4, independence: 5, social_presentation: 7, self_care: 7, community: 4 },
    childViews: "Casey was reluctant to engage initially but opened up with Chervelle. Casey scored safety low because 'people keep accusing my friends of stuff' (referring to exploitation concerns about Marcus). Emotional wellbeing is low because of the LADO investigation. Casey scored herself high on self-care and social presentation — 'I can look after myself, I'm not a baby.' Casey became upset when discussing relationships and said 'nobody trusts me.'",
    staffViews: "Casey's scores have declined across several domains since the last assessment. Safety has dropped due to ongoing exploitation concerns and the contact restriction with Marcus. Emotional wellbeing is significantly impacted by the LADO investigation. Education has dropped following 3 weeks of non-attendance at college. Relationships are strained — Casey feels adults don't trust her. Self-care and social presentation remain strengths. This assessment highlights the need for intensive therapeutic support.",
    actionPlan: [
      { domain: "safety", action: "Continue exploitation-focused direct work — build understanding of healthy relationships" },
      { domain: "emotional_wellbeing", action: "CAMHS urgent review — update safety plan following self-harm incident" },
      { domain: "education", action: "Reintegration plan with college — gradual return with keyworker support" },
      { domain: "relationships", action: "Restorative approaches — help Casey understand that restrictions are about safety, not trust" },
      { domain: "community", action: "Identify safe community activities Casey can engage with independently" },
    ],
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function OutcomeStarPage() {
  const [data] = useState(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const exportData = useMemo(() => {
    return data.flatMap((a) =>
      DOMAINS.map((dom) => ({
        youngPerson: getYPName(a.youngPersonId),
        date: a.date,
        domain: DOMAIN_LABEL[dom],
        score: a.scores[dom],
        previousScore: a.previousScores ? a.previousScores[dom] : null,
        change: a.previousScores ? a.scores[dom] - a.previousScores[dom] : null,
      }))
    );
  }, [data]);

  type ExportRow = (typeof exportData)[number];

  const exportCols: ExportColumn<ExportRow>[] = [
    { header: "Young Person", accessor: (r: ExportRow) => r.youngPerson },
    { header: "Date", accessor: (r: ExportRow) => r.date },
    { header: "Domain", accessor: (r: ExportRow) => r.domain },
    { header: "Score", accessor: (r: ExportRow) => String(r.score) },
    { header: "Previous", accessor: (r: ExportRow) => r.previousScore !== null ? String(r.previousScore) : "N/A" },
    { header: "Change", accessor: (r: ExportRow) => r.change !== null ? String(r.change) : "N/A" },
  ];

  return (
    <PageShell
      title="Outcome Star Assessments"
      subtitle="Outcomes Framework · Child-Centred Progress · 10-Domain Model"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Outcome Star Assessments" />
          <ExportButton data={exportData} columns={exportCols} filename="outcome-star" />
        </div>
      }
    >
      <div id="print-area">
        {/* per-child summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {data.map((a) => {
            const avg = Math.round((Object.values(a.scores).reduce((s, v) => s + v, 0) / DOMAINS.length) * 10) / 10;
            const prevAvg = a.previousScores ? Math.round((Object.values(a.previousScores).reduce((s, v) => s + v, 0) / DOMAINS.length) * 10) / 10 : null;
            const trend = prevAvg !== null ? avg - prevAvg : 0;
            return (
              <Card key={a.id}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold">{getYPName(a.youngPersonId)}</p>
                    <div className="flex items-center gap-1">
                      {trend > 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : trend < 0 ? <TrendingDown className="h-4 w-4 text-red-600" /> : <Minus className="h-4 w-4 text-slate-400" />}
                      <span className={cn("text-xs font-medium", trend > 0 ? "text-green-700" : trend < 0 ? "text-red-700" : "text-slate-500")}>
                        {trend > 0 ? "+" : ""}{trend.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{avg.toFixed(1)}<span className="text-sm text-muted-foreground font-normal">/10</span></p>
                  <p className="text-xs text-muted-foreground">Average score · {a.date}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {DOMAINS.map((dom) => (
                      <span key={dom} className={cn("inline-block rounded px-1.5 py-0.5 text-[10px] font-medium", scoreColor(a.scores[dom]))}>
                        {a.scores[dom]}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* detailed assessments */}
        <div className="space-y-3">
          {data.map((a) => {
            const isOpen = expandedId === a.id;
            const avg = Math.round((Object.values(a.scores).reduce((s, v) => s + v, 0) / DOMAINS.length) * 10) / 10;
            return (
              <Card key={a.id} className="border-l-4 border-l-blue-400">
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : a.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-500" />
                        {getYPName(a.youngPersonId)} — Outcome Star
                        <Badge variant="outline" className={scoreColor(avg)}>{avg.toFixed(1)}/10 avg</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Assessed: {a.date} · By: {getStaffName(a.assessedById)} · {a.actionPlan.length} action(s)
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* domain scores grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {DOMAINS.map((dom) => {
                        const score = a.scores[dom];
                        const prev = a.previousScores ? a.previousScores[dom] : null;
                        const change = prev !== null ? score - prev : null;
                        return (
                          <div key={dom} className="bg-muted/40 rounded p-2 text-center">
                            <p className="font-medium text-[10px] text-muted-foreground mb-0.5">{DOMAIN_LABEL[dom]}</p>
                            <p className={cn("text-lg font-bold", scoreColor(score).split(" ")[0])}>{score}</p>
                            {change !== null && (
                              <div className="flex items-center justify-center gap-0.5 text-[10px]">
                                {change > 0 ? <TrendingUp className="h-3 w-3 text-green-600" /> : change < 0 ? <TrendingDown className="h-3 w-3 text-red-600" /> : <Minus className="h-3 w-3 text-slate-400" />}
                                <span className={change > 0 ? "text-green-700" : change < 0 ? "text-red-700" : "text-slate-500"}>
                                  {change > 0 ? "+" : ""}{change} from {prev}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* child views */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="font-medium text-xs text-blue-800 mb-1">Child&apos;s Views</p>
                      <p className="text-xs text-blue-700">{a.childViews}</p>
                    </div>

                    {/* staff views */}
                    <div>
                      <p className="font-medium mb-1">Staff Assessment</p>
                      <p className="text-muted-foreground text-xs">{a.staffViews}</p>
                    </div>

                    {/* action plan */}
                    <div>
                      <p className="font-medium mb-1">Action Plan</p>
                      {a.actionPlan.map((ap, i) => (
                        <div key={i} className="bg-muted/40 rounded p-2 mb-1 flex items-start gap-2">
                          <Badge variant="outline" className="bg-muted/50 text-[10px] shrink-0">{DOMAIN_LABEL[ap.domain]}</Badge>
                          <p className="text-xs">{ap.action}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* key */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-2">
          {DOMAINS.map((dom) => (
            <div key={dom} className="text-xs text-center bg-muted/20 rounded p-1.5">
              <p className="font-medium">{DOMAIN_LABEL[dom]}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Outcomes Framework</p>
          <p>The Outcome Star is a collaborative assessment tool completed with the young person. Each domain is scored 1-10, where 1 indicates significant concern and 10 indicates the young person is thriving. Assessments should be completed quarterly and at key transition points. The child&apos;s voice is central — scores should reflect both the professional assessment and the child&apos;s own perception. Progress (and regression) across domains informs care planning, LAC reviews, and Reg 45 quality reporting. Trends over time are more meaningful than individual scores.</p>
        </div>
      </div>
    </PageShell>
  );
}
