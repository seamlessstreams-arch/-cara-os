"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  AlertTriangle, ShieldAlert, HeartHandshake, Calendar, Activity,
  Lock, BookOpen, Sparkles, Lightbulb, Eye, Users, ClipboardList,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import type { SubstanceScreening, ScreeningTool, SubstanceRiskLevel } from "@/types/extended";
import { SCREENING_TOOL_LABEL, SUBSTANCE_RISK_LEVEL_LABEL } from "@/types/extended";
import { useSubstanceScreenings } from "@/hooks/use-substance-screenings";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const RISK_CLR: Record<SubstanceRiskLevel, string> = {
  no_identified_risk: "bg-green-100 text-green-800",
  awareness_only: "bg-emerald-100 text-emerald-800",
  low_risk: "bg-yellow-100 text-yellow-800",
  medium_risk: "bg-amber-100 text-amber-800",
  high_risk: "bg-orange-100 text-orange-800",
  active_concern: "bg-red-100 text-red-800",
};
const RISK_BORDER: Record<SubstanceRiskLevel, string> = {
  no_identified_risk: "border-l-green-400",
  awareness_only: "border-l-emerald-400",
  low_risk: "border-l-yellow-400",
  medium_risk: "border-l-amber-500",
  high_risk: "border-l-orange-500",
  active_concern: "border-l-red-600",
};

const RISK_ORDER: SubstanceRiskLevel[] = [
  "active_concern",
  "high_risk",
  "medium_risk",
  "low_risk",
  "awareness_only",
  "no_identified_risk",
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function DrugAndAlcoholScreeningPage() {
  const { data: queryData, isLoading } = useSubstanceScreenings();
  const data = queryData?.data ?? [];
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [filterChild, setFilterChild] = useState("all");
  const [filterTool, setFilterTool] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  /* ── derived ─────────────────────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let rows = data.filter((r) => {
      if (filterRisk !== "all" && r.risk_level !== filterRisk) return false;
      if (filterChild !== "all" && r.child_id !== filterChild) return false;
      if (filterTool !== "all" && r.screening_tool !== filterTool) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          getYPName(r.child_id).toLowerCase().includes(q) ||
          r.context_of_use.toLowerCase().includes(q) ||
          r.peer_influences.toLowerCase().includes(q) ||
          SCREENING_TOOL_LABEL[r.screening_tool].toLowerCase().includes(q)
        );
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return b.screening_date.localeCompare(a.screening_date);
        case "date-asc":
          return a.screening_date.localeCompare(b.screening_date);
        case "risk":
          return RISK_ORDER.indexOf(a.risk_level) - RISK_ORDER.indexOf(b.risk_level);
        case "review":
          return a.next_screening_date.localeCompare(b.next_screening_date);
        default:
          return 0;
      }
    });
    return rows;
  }, [data, search, filterRisk, filterChild, filterTool, sortBy]);

  /* ── stats ───────────────────────────────────────────────────────────────── */

  const today = new Date();
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(today.getDate() - 90);
  const thirtyDaysAhead = new Date();
  thirtyDaysAhead.setDate(today.getDate() + 30);

  const activeScreenings = data.length;
  const atRisk = data.filter((r) =>
    (["low_risk", "medium_risk", "high_risk", "active_concern"] as SubstanceRiskLevel[]).includes(r.risk_level),
  ).length;
  const screenedLast90 = data.filter((r) => new Date(r.screening_date) >= ninetyDaysAgo).length;
  const reviewsDue30 = data.filter((r) => {
    const next = new Date(r.next_screening_date);
    return next >= today && next <= thirtyDaysAhead;
  }).length;

  /* ── export ──────────────────────────────────────────────────────────────── */

  const exportCols: ExportColumn<SubstanceScreening>[] = [
    { header: "Date", accessor: (r: SubstanceScreening) => r.screening_date },
    { header: "Child", accessor: (r: SubstanceScreening) => getYPName(r.child_id) },
    { header: "Screening Tool", accessor: (r: SubstanceScreening) => SCREENING_TOOL_LABEL[r.screening_tool] },
    { header: "Risk Level", accessor: (r: SubstanceScreening) => SUBSTANCE_RISK_LEVEL_LABEL[r.risk_level] },
    {
      header: "Substances Identified",
      accessor: (r: SubstanceScreening) =>
        r.substances_identified.length ? r.substances_identified.join(", ") : "None",
    },
    { header: "Context", accessor: (r: SubstanceScreening) => r.context_of_use },
    { header: "Peer Influences", accessor: (r: SubstanceScreening) => r.peer_influences },
    { header: "Family History", accessor: (r: SubstanceScreening) => r.family_history },
    {
      header: "Education Provided",
      accessor: (r: SubstanceScreening) => r.education_provided.join("; "),
    },
    {
      header: "Harm Reduction",
      accessor: (r: SubstanceScreening) => r.harm_reduction_approach.join("; "),
    },
    {
      header: "Professional Support",
      accessor: (r: SubstanceScreening) => r.professional_support_in_place.join("; "),
    },
    { header: "Child Insight", accessor: (r: SubstanceScreening) => r.child_insight },
    { header: "Child Motivation", accessor: (r: SubstanceScreening) => r.child_motivation },
    {
      header: "Warning Signs",
      accessor: (r: SubstanceScreening) => r.warning_signs_to_watch.join("; "),
    },
    { header: "Review Schedule", accessor: (r: SubstanceScreening) => r.review_schedule },
    {
      header: "Escalation Criteria",
      accessor: (r: SubstanceScreening) => r.escalation_criteria.join("; "),
    },
    { header: "Next Screening", accessor: (r: SubstanceScreening) => r.next_screening_date },
    {
      header: "Confidentiality Framing",
      accessor: (r: SubstanceScreening) => r.confidentiality_framing,
    },
    {
      header: "Shared with SW",
      accessor: (r: SubstanceScreening) => (r.shared_with_social_worker ? "Yes" : "No"),
    },
    {
      header: "Shared with CAMHS",
      accessor: (r: SubstanceScreening) => (r.shared_with_camhs ? "Yes" : "No"),
    },
    {
      header: "Child Authored",
      accessor: (r: SubstanceScreening) => (r.child_authored ? "Yes" : "No"),
    },
    { header: "Conducted By", accessor: (r: SubstanceScreening) => getStaffName(r.conducted_by) },
  ];

  /* ── render ──────────────────────────────────────────────────────────────── */

  return (
    <PageShell
      title="Drug and Alcohol Screening"
      subtitle="Substance use risk screening · Early identification · Harm reduction · Quality Standard 5 · Working Together 2023"
      caraContext={{ pageTitle: "Drug and Alcohol Screening", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Drug and Alcohol Screening" />
          <ExportButton
            data={filtered}
            columns={exportCols}
            filename="drug-and-alcohol-screening"
          />
          <CaraStudioQuickActionButton context={{ record_type: "risk_assessment", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
      <div id="print-area">
        {/* ── stat strip ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Active Screenings",
              value: activeScreenings,
              icon: ClipboardList,
              clr: "text-blue-600",
            },
            {
              label: "At-risk Children",
              value: atRisk,
              icon: AlertTriangle,
              clr: "text-amber-600",
            },
            {
              label: "Screened Last 90 Days",
              value: screenedLast90,
              icon: Activity,
              clr: "text-emerald-600",
            },
            {
              label: "Reviews Due 30d",
              value: reviewsDue30,
              icon: Calendar,
              clr: "text-purple-600",
            },
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

        {/* ── sensitive content notice ────────────────────────────────────── */}
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <HeartHandshake className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-semibold text-rose-900">Sensitive content — handled with care</p>
            <p className="text-rose-800">
              These records discuss substance use in the context of children we look after. The
              approach is non-judgemental, harm-reduction led, and trauma-informed. We do not use
              shaming language. Conversations with children are voluntary, age-appropriate, and
              framed around safety, not surveillance. Information is shared only on a need-to-know
              basis with the social worker and, where clinically relevant, CAMHS. Children are told
              up front what will and will not be shared, and disclosure is never met with
              punishment.
            </p>
          </div>
        </div>

        {/* ── filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search child, context, peer influences…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterRisk} onValueChange={setFilterRisk}>
            <SelectTrigger className="w-[170px]">
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              {(Object.keys(RISK_CLR) as SubstanceRiskLevel[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {SUBSTANCE_RISK_LEVEL_LABEL[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterChild} onValueChange={setFilterChild}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              <SelectItem value="yp_alex">Alex</SelectItem>
              <SelectItem value="yp_jordan">Jordan</SelectItem>
              <SelectItem value="yp_casey">Casey</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterTool} onValueChange={setFilterTool}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tools</SelectItem>
              <SelectItem value="crafft">{SCREENING_TOOL_LABEL.crafft}</SelectItem>
              <SelectItem value="internal_brief_screen">{SCREENING_TOOL_LABEL.internal_brief_screen}</SelectItem>
              <SelectItem value="conversation_based">{SCREENING_TOOL_LABEL.conversation_based}</SelectItem>
              <SelectItem value="audit_c_older">{SCREENING_TOOL_LABEL.audit_c_older}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px]">
              <ArrowUpDown className="h-4 w-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="risk">By Risk Level</SelectItem>
              <SelectItem value="review">By Next Review</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── screening records ────────────────────────────────────────────── */}
        <div className="space-y-4">
          {filtered.map((r) => {
            const open = expandedId === r.id;
            return (
              <Card key={r.id} className={cn("border-l-4", RISK_BORDER[r.risk_level])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getYPName(r.child_id)}
                        <Badge variant="outline" className={RISK_CLR[r.risk_level]}>
                          {SUBSTANCE_RISK_LEVEL_LABEL[r.risk_level]}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-100 text-[var(--cs-navy)]">
                          {SCREENING_TOOL_LABEL[r.screening_tool]}
                        </Badge>
                        {r.child_authored && (
                          <Badge variant="outline" className="bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)]">
                            Child contributed
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Screened: {r.screening_date} · Conducted by: {getStaffName(r.conducted_by)} ·
                        Next review: {r.next_screening_date}
                      </p>
                    </div>
                    {open ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* substances identified */}
                    <div>
                      <p className="font-medium mb-1">Substances Identified</p>
                      {r.substances_identified.length ? (
                        <div className="flex flex-wrap gap-1">
                          {r.substances_identified.map((s, i) => (
                            <Badge key={i} variant="outline" className="bg-amber-50 text-amber-800">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          No substances identified at this screening.
                        </p>
                      )}
                    </div>

                    {/* context */}
                    <div>
                      <p className="font-medium mb-1">Context</p>
                      <p className="text-muted-foreground text-xs">{r.context_of_use}</p>
                    </div>

                    {/* peer & family */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="font-medium text-amber-800 mb-1 flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" /> Peer Influences
                        </p>
                        <p className="text-amber-700 text-xs">{r.peer_influences}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="font-medium text-blue-800 mb-1 flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" /> Family History
                        </p>
                        <p className="text-blue-700 text-xs">{r.family_history}</p>
                      </div>
                    </div>

                    {/* education & harm reduction */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-emerald-50 rounded-lg p-3">
                        <p className="font-medium text-emerald-800 mb-2 flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" /> Education Provided
                        </p>
                        <ul className="space-y-1">
                          {r.education_provided.map((e, i) => (
                            <li
                              key={i}
                              className="text-xs text-emerald-700 flex items-start gap-1"
                            >
                              <span className="shrink-0 mt-0.5">•</span> {e}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-teal-50 rounded-lg p-3">
                        <p className="font-medium text-teal-800 mb-2 flex items-center gap-1">
                          <HeartHandshake className="h-3.5 w-3.5" /> Harm Reduction Approach
                        </p>
                        <ul className="space-y-1">
                          {r.harm_reduction_approach.map((h, i) => (
                            <li key={i} className="text-xs text-teal-700 flex items-start gap-1">
                              <span className="shrink-0 mt-0.5">•</span> {h}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* professional support */}
                    <div>
                      <p className="font-medium mb-2">Professional Support in Place</p>
                      <div className="flex flex-wrap gap-1">
                        {r.professional_support_in_place.map((p, i) => (
                          <Badge key={i} variant="outline" className="bg-muted/40 text-xs">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* child voice */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[var(--cs-cara-gold-bg)] rounded-lg p-3">
                        <p className="font-medium text-[var(--cs-navy)] mb-1 flex items-center gap-1">
                          <Lightbulb className="h-3.5 w-3.5" /> Child&apos;s Insight
                        </p>
                        <p className="text-[var(--cs-cara-gold)] text-xs">{r.child_insight}</p>
                      </div>
                      <div className="bg-fuchsia-50 rounded-lg p-3">
                        <p className="font-medium text-fuchsia-800 mb-1 flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5" /> Child&apos;s Motivation
                        </p>
                        <p className="text-fuchsia-700 text-xs">{r.child_motivation}</p>
                      </div>
                    </div>

                    {/* warning signs */}
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <p className="font-medium text-yellow-800 mb-2 flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> Warning Signs to Watch
                      </p>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
                        {r.warning_signs_to_watch.map((w, i) => (
                          <li key={i} className="text-xs text-yellow-800 flex items-start gap-1">
                            <span className="shrink-0 mt-0.5">•</span> {w}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* review & escalation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium mb-1">Review Schedule</p>
                        <p className="text-muted-foreground text-xs">{r.review_schedule}</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3">
                        <p className="font-medium text-orange-800 mb-2 flex items-center gap-1">
                          <ShieldAlert className="h-3.5 w-3.5" /> Escalation Criteria
                        </p>
                        <ul className="space-y-1">
                          {r.escalation_criteria.map((esc, i) => (
                            <li
                              key={i}
                              className="text-xs text-orange-700 flex items-start gap-1"
                            >
                              <span className="shrink-0 mt-0.5">•</span> {esc}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* confidentiality */}
                    <div className="bg-indigo-50 rounded-lg p-3">
                      <p className="font-medium text-indigo-800 mb-1 flex items-center gap-1">
                        <Lock className="h-3.5 w-3.5" /> Confidentiality Framing
                      </p>
                      <p className="text-indigo-700 text-xs">{r.confidentiality_framing}</p>
                    </div>

                    {/* sharing */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Shared with Social Worker</p>
                        <p className="text-xs text-muted-foreground">
                          {r.shared_with_social_worker ? "Yes" : "No"}
                        </p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Shared with CAMHS</p>
                        <p className="text-xs text-muted-foreground">
                          {r.shared_with_camhs ? "Yes" : "No"}
                        </p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Child Contributed to Record</p>
                        <p className="text-xs text-muted-foreground">
                          {r.child_authored ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>

                    {/* smart link panel */}
                    <SmartLinkPanel sourceType="substance_screening" sourceId={r.id} childId={r.child_id} compact />

                    {/* footer */}
                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                      <span>Conducted by: {getStaffName(r.conducted_by)}</span>
                      <span>Next screening: {r.next_screening_date}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* ── regulatory note ────────────────────────────────────────────── */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>
            Children&apos;s Homes (England) Regulations 2015, Quality Standard 5 (positive
            relationships) and Quality Standard 4 (protection of children) — duty to support
            children&apos;s health, including risks from substance use. Working Together to
            Safeguard Children 2023 — multi-agency response to identified risks. NICE NG87 (drug
            misuse prevention in vulnerable children and young people). Talk to FRANK and CEOP
            resources used to inform age-appropriate education. Approach is harm-reduction led,
            non-judgemental, and trauma-informed — disclosures are met with support, never
            punishment. Information sharing follows GDPR and statutory guidance: only as needed for
            safety, with the child informed in advance.
          </p>
        </div>
      </div>
      )}
      <CareEventsPanel
        title="Care Events — Safeguarding & Behaviour"
        category={["safeguarding", "behaviour"]}
        days={90}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Drug and Alcohol Screening — substance misuse, urine testing, breathalyser, county lines risk, NPS, harm reduction, safeguarding, risk assessment, CAMHS, action plan, care plan"
        recordType="risk_assessment"
        className="mt-6"
      />
    </PageShell>
  );
}
