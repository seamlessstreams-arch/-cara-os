"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useEvidenceItems, useCreateEvidence } from "@/hooks/use-intelligence-layer";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Search,
  FileText,
  Users,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Link2,
  Eye,
  PackagePlus,
  FileDown,
  BarChart3,
  Calendar,
  BookOpen,
  CircleDot,
  TrendingUp,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  EvidenceCategory,
  JudgementArea,
  InspectionEvidenceItem,
  EvidenceGap,
  Urgency,
} from "@/types/intelligence.layer";

/* ══════════════════════════════════════════════════════════════════════════════
   CORNERSTONE — OFSTED EVIDENCE ROOM
   Organised evidence for inspection readiness. Calm, professional interface.
   ══════════════════════════════════════════════════════════════════════════════ */

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const fmt = (iso: string) => {
  const [y, m, day] = iso.split("-");
  return `${day}/${m}/${y}`;
};

/* ── category labels ───────────────────────────────────────────────────────── */

const CATEGORY_LABELS: Record<EvidenceCategory, string> = {
  overall_experiences: "Overall experiences and progress",
  help_and_protection: "Help and protection",
  leaders_and_managers: "Leaders and managers",
  quality_of_care: "Quality of care",
  education: "Education",
  health: "Health",
  emotional_wellbeing: "Emotional wellbeing",
  safeguarding: "Safeguarding",
  missing_from_care: "Missing from care",
  behaviour_support: "Behaviour support",
  restraint: "Restraint",
  medication: "Medication",
  complaints: "Complaints",
  staff_supervision: "Staff supervision",
  training: "Training",
  safer_recruitment: "Safer recruitment",
  regulation_44: "Regulation 44",
  regulation_45: "Regulation 45",
  wishes_and_feelings: "Wishes and feelings",
  family_time: "Family time",
  independence: "Independence",
  placement_planning: "Placement planning",
  risk_assessment: "Risk assessment",
  management_oversight: "Management oversight",
  ri_oversight: "RI oversight",
  notifications: "Notifications",
  patterns_and_learning: "Patterns, themes and learning",
};

const JUDGEMENT_LABELS: Record<JudgementArea, string> = {
  overall_experiences_and_progress: "Overall experiences and progress of children",
  help_and_protection: "How well children are helped and protected",
  effectiveness_of_leaders: "Effectiveness of leaders and managers",
};

const JUDGEMENT_COLOURS: Record<JudgementArea, string> = {
  overall_experiences_and_progress: "bg-blue-100 text-blue-800",
  help_and_protection: "bg-amber-100 text-amber-800",
  effectiveness_of_leaders: "bg-[var(--cs-aria-gold-bg)] text-[var(--cs-navy)]",
};

const CONFIDENCE_DOT: Record<string, string> = {
  high: "bg-emerald-500",
  medium: "bg-amber-400",
  low: "bg-red-400",
};

const CONFIDENCE_LABEL: Record<string, string> = {
  high: "Strong",
  medium: "Moderate",
  low: "Limited",
};

const SEVERITY_VARIANT: Record<Urgency, "destructive" | "warning" | "info" | "secondary"> = {
  critical: "destructive",
  high: "destructive",
  medium: "warning",
  low: "info",
};

const SEVERITY_LABEL: Record<Urgency, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

/* ── category groups for the filter dropdown ───────────────────────────────── */

interface CategoryGroup {
  label: string;
  categories: EvidenceCategory[];
}

const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    label: "Judgement areas",
    categories: ["overall_experiences", "help_and_protection", "leaders_and_managers"],
  },
  {
    label: "Quality and wellbeing",
    categories: ["quality_of_care", "education", "health", "emotional_wellbeing"],
  },
  {
    label: "Safety and incidents",
    categories: ["safeguarding", "missing_from_care", "behaviour_support", "restraint"],
  },
  {
    label: "Operations",
    categories: ["medication", "complaints", "staff_supervision", "training", "safer_recruitment"],
  },
  {
    label: "Regulatory",
    categories: ["regulation_44", "regulation_45"],
  },
  {
    label: "Child-centred",
    categories: ["wishes_and_feelings", "family_time", "independence"],
  },
  {
    label: "Planning and oversight",
    categories: [
      "placement_planning",
      "risk_assessment",
      "management_oversight",
      "ri_oversight",
    ],
  },
  {
    label: "Analysis",
    categories: ["notifications", "patterns_and_learning"],
  },
];

/* ── source type helpers ───────────────────────────────────────────────────── */

type SourceType =
  | "daily_log"
  | "incident"
  | "key_work"
  | "reg44_report"
  | "reg45_report"
  | "risk_assessment"
  | "child_voice"
  | "supervision"
  | "placement_plan"
  | "medication_record"
  | "complaint"
  | "training_record";

const SOURCE_LABELS: Record<SourceType, string> = {
  daily_log: "Daily Log",
  incident: "Incident Report",
  key_work: "Key Work Session",
  reg44_report: "Reg 44 Report",
  reg45_report: "Reg 45 Report",
  risk_assessment: "Risk Assessment",
  child_voice: "Child Voice",
  supervision: "Supervision Record",
  placement_plan: "Placement Plan",
  medication_record: "Medication Record",
  complaint: "Complaint",
  training_record: "Training Record",
};

/* ── confidence helper ─────────────────────────────────────────────────────── */

function confidenceLevel(score: number | undefined): "high" | "medium" | "low" {
  if (!score || score < 50) return "low";
  if (score < 75) return "medium";
  return "high";
}

/* ── demo children ─────────────────────────────────────────────────────────── */

const CHILDREN = [
  { id: "c1", name: "Jordan M" },
  { id: "c2", name: "Casey R" },
  { id: "c3", name: "Reece T" },
];

/* ── demo evidence ─────────────────────────────────────────────────────────── */

const DEMO_EVIDENCE: (InspectionEvidenceItem & { sourceLabel: SourceType })[] = [
  {
    id: "ev_01",
    homeId: "h1",
    childId: "c1",
    sourceType: "key_work",
    sourceLabel: "key_work",
    sourceId: "kw_221",
    title: "Jordan expresses feeling settled and safe",
    summary:
      "In key work session, Jordan shared that he feels safe at the home and has positive relationships with staff. He identified two staff members he would approach if worried.",
    evidenceCategory: "wishes_and_feelings",
    judgementArea: "overall_experiences_and_progress",
    confidenceScore: 92,
    evidenceDate: d(-3),
    createdBy: "Sarah Mitchell",
    createdAt: d(-3),
    updatedAt: d(-3),
  },
  {
    id: "ev_02",
    homeId: "h1",
    childId: "c2",
    sourceType: "incident",
    sourceLabel: "incident",
    sourceId: "inc_145",
    title: "Casey supported through emotional crisis with de-escalation",
    summary:
      "Staff used TCI de-escalation techniques when Casey became distressed. Physical intervention was avoided. Casey was offered a debrief and engaged well. Manager oversight completed within 24 hours.",
    evidenceCategory: "behaviour_support",
    judgementArea: "help_and_protection",
    confidenceScore: 88,
    evidenceDate: d(-5),
    createdBy: "Darren Laville",
    createdAt: d(-5),
    updatedAt: d(-4),
  },
  {
    id: "ev_03",
    homeId: "h1",
    sourceType: "supervision",
    sourceLabel: "supervision",
    sourceId: "sup_098",
    title: "Staff supervision cycle completed on time",
    summary:
      "All staff supervisions completed within the 6-week cycle. Reflective practice was evident in each record, with clear action points and follow-up from previous sessions.",
    evidenceCategory: "staff_supervision",
    judgementArea: "effectiveness_of_leaders",
    confidenceScore: 95,
    evidenceDate: d(-7),
    createdBy: "Darren Laville",
    createdAt: d(-7),
    updatedAt: d(-7),
  },
  {
    id: "ev_04",
    homeId: "h1",
    childId: "c3",
    sourceType: "daily_log",
    sourceLabel: "daily_log",
    sourceId: "dl_1892",
    title: "Reece attends first full week of school",
    summary:
      "Reece completed a full week of school attendance for the first time since placement. Staff provided consistent morning routines and positive reinforcement. School feedback was excellent.",
    evidenceCategory: "education",
    judgementArea: "overall_experiences_and_progress",
    confidenceScore: 90,
    evidenceDate: d(-10),
    createdBy: "James Connor",
    createdAt: d(-10),
    updatedAt: d(-10),
  },
  {
    id: "ev_05",
    homeId: "h1",
    childId: "c1",
    sourceType: "risk_assessment",
    sourceLabel: "risk_assessment",
    sourceId: "ra_034",
    title: "Jordan's risk assessment reviewed following community incident",
    summary:
      "Risk assessment updated promptly after Jordan was involved in a community incident. New control measures added, and Jordan was involved in reviewing the document. Social worker informed.",
    evidenceCategory: "risk_assessment",
    judgementArea: "help_and_protection",
    confidenceScore: 85,
    evidenceDate: d(-12),
    createdBy: "Darren Laville",
    createdAt: d(-12),
    updatedAt: d(-11),
  },
  {
    id: "ev_06",
    homeId: "h1",
    sourceType: "reg44_report",
    sourceLabel: "reg44_report",
    sourceId: "r44_012",
    title: "Regulation 44 visit completed with positive findings",
    summary:
      "Independent visitor completed quarterly visit. All children spoken to, records reviewed, environment inspected. Two recommendations made, both acknowledged and actioned by Registered Manager.",
    evidenceCategory: "regulation_44",
    judgementArea: "effectiveness_of_leaders",
    confidenceScore: 96,
    evidenceDate: d(-14),
    createdBy: "Margaret Thompson",
    createdAt: d(-14),
    updatedAt: d(-13),
  },
  {
    id: "ev_07",
    homeId: "h1",
    childId: "c2",
    sourceType: "child_voice",
    sourceLabel: "child_voice",
    sourceId: "cv_067",
    title: "Casey contributes ideas for house improvements",
    summary:
      "During house meeting, Casey suggested changes to the communal lounge layout and new activity ideas. Suggestions were recorded and two were implemented within the week.",
    evidenceCategory: "wishes_and_feelings",
    judgementArea: "overall_experiences_and_progress",
    confidenceScore: 80,
    evidenceDate: d(-16),
    createdBy: "Sarah Mitchell",
    createdAt: d(-16),
    updatedAt: d(-16),
  },
  {
    id: "ev_08",
    homeId: "h1",
    sourceType: "training_record",
    sourceLabel: "training_record",
    sourceId: "tr_088",
    title: "Team completes refresher safeguarding training",
    summary:
      "All permanent staff completed Level 3 safeguarding refresher within required timeframe. Agency staff completed induction-level safeguarding before shifts. Training matrix updated.",
    evidenceCategory: "safeguarding",
    judgementArea: "help_and_protection",
    confidenceScore: 94,
    evidenceDate: d(-18),
    createdBy: "Darren Laville",
    createdAt: d(-18),
    updatedAt: d(-18),
  },
  {
    id: "ev_09",
    homeId: "h1",
    childId: "c3",
    sourceType: "placement_plan",
    sourceLabel: "placement_plan",
    sourceId: "pp_019",
    title: "Reece's placement plan reviewed with positive trajectory",
    summary:
      "Six-monthly placement plan review completed on time. Reece participated in the review and identified independence goals. Social worker and IRO attended. All actions from previous review completed.",
    evidenceCategory: "placement_planning",
    judgementArea: "effectiveness_of_leaders",
    confidenceScore: 91,
    evidenceDate: d(-21),
    createdBy: "Darren Laville",
    createdAt: d(-21),
    updatedAt: d(-20),
  },
  {
    id: "ev_10",
    homeId: "h1",
    childId: "c1",
    sourceType: "medication_record",
    sourceLabel: "medication_record",
    sourceId: "med_340",
    title: "Medication administration records — zero errors this month",
    summary:
      "Monthly medication audit completed. Zero administration errors, all records double-signed, stock reconciliation accurate. GP review appointments attended on time for all children.",
    evidenceCategory: "medication",
    judgementArea: "help_and_protection",
    confidenceScore: 97,
    evidenceDate: d(-4),
    createdBy: "Darren Laville",
    createdAt: d(-4),
    updatedAt: d(-4),
  },
  {
    id: "ev_11",
    homeId: "h1",
    childId: "c2",
    sourceType: "key_work",
    sourceLabel: "key_work",
    sourceId: "kw_225",
    title: "Casey discusses family contact and makes positive plans",
    summary:
      "Casey and key worker discussed family time arrangements. Casey identified she would like more phone contact with her grandmother. Plan agreed and social worker informed.",
    evidenceCategory: "family_time",
    judgementArea: "overall_experiences_and_progress",
    confidenceScore: 82,
    evidenceDate: d(-8),
    createdBy: "Sarah Mitchell",
    createdAt: d(-8),
    updatedAt: d(-8),
  },
  {
    id: "ev_12",
    homeId: "h1",
    sourceType: "complaint",
    sourceLabel: "complaint",
    sourceId: "cmp_011",
    title: "Complaint resolved within timescale with positive outcome",
    summary:
      "Complaint from placing authority regarding communication about a medical appointment was investigated and resolved within 10 working days. Outcome letter sent. Process improvements identified and implemented.",
    evidenceCategory: "complaints",
    judgementArea: "effectiveness_of_leaders",
    confidenceScore: 78,
    evidenceDate: d(-25),
    createdBy: "Darren Laville",
    createdAt: d(-25),
    updatedAt: d(-22),
  },
];

/* ── demo evidence gaps ────────────────────────────────────────────────────── */

const DEMO_GAPS: EvidenceGap[] = [
  {
    type: "no_recent_key_work",
    title: "No key work session recorded for Reece in 3 weeks",
    description:
      "Reece has not had a documented key work session since the placement plan review. The expected frequency is weekly.",
    severity: "high",
    childId: "c3",
    sourceRecordType: "key_work",
    recommendation:
      "Schedule a key work session with Reece this week and ensure it is recorded in the system. Consider whether the gap was due to staffing or oversight.",
  },
  {
    type: "no_child_voice",
    title: "No child voice entry for Jordan this month",
    description:
      "Jordan's voice has not been captured through any formal mechanism (key work, house meeting, or wishes and feelings) this month.",
    severity: "medium",
    childId: "c1",
    sourceRecordType: "child_voice",
    recommendation:
      "Capture Jordan's views in the next key work session or through an informal check-in. Record in the child voice log.",
  },
  {
    type: "incident_no_oversight",
    title: "Two incidents awaiting manager oversight",
    description:
      "Two low-level incidents from the past week have not yet received manager oversight or analysis. Oversight should be completed within 48 hours.",
    severity: "high",
    sourceRecordType: "incident",
    recommendation:
      "Complete manager oversight for both outstanding incidents today. Review whether the 48-hour standard is being communicated to deputies.",
  },
  {
    type: "reg44_overdue",
    title: "Reg 44 action response overdue by 5 days",
    description:
      "One action from the last Regulation 44 visit has not yet received a manager response. The expected response window is 14 days.",
    severity: "medium",
    sourceRecordType: "reg44_report",
    sourceRecordId: "r44_012",
    recommendation:
      "Draft and submit the manager response to the outstanding Reg 44 action. Ensure all future actions are responded to within the 14-day window.",
  },
  {
    type: "risk_not_reviewed",
    title: "Casey's risk assessment not reviewed since last incident",
    description:
      "Casey was involved in a behaviour incident 10 days ago but her risk assessment has not been updated to reflect any changes or new control measures.",
    severity: "high",
    childId: "c2",
    sourceRecordType: "risk_assessment",
    recommendation:
      "Review and update Casey's risk assessment in light of the recent incident. Involve Casey in the review process where appropriate.",
  },
  {
    type: "supervision_overdue",
    title: "One staff member due supervision in 3 days",
    description:
      "James Connor's supervision is due within 3 days. If not completed, it will breach the 6-weekly cycle.",
    severity: "low",
    staffId: "s3",
    sourceRecordType: "supervision",
    recommendation:
      "Confirm the scheduled supervision date with James. If the RM is unavailable, arrange for the deputy to cover.",
  },
];

/* ── period options ────────────────────────────────────────────────────────── */

const PERIOD_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 3 months" },
  { value: "180", label: "Last 6 months" },
  { value: "365", label: "Last 12 months" },
  { value: "all", label: "All time" },
];

/* ══════════════════════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ══════════════════════════════════════════════════════════════════════════════ */

export default function OfstedEvidenceRoomPage() {
  /* ── API hooks ─────────────────────────────────────────────────────────── */
  const { data: apiData } = useEvidenceItems();
  const createEvidence = useCreateEvidence();

  const [evidenceItems, setEvidenceItems] = useState<(InspectionEvidenceItem & { sourceLabel: SourceType })[]>(DEMO_EVIDENCE);
  const [gaps, setGaps] = useState<EvidenceGap[]>(DEMO_GAPS);

  useEffect(() => {
    if (apiData?.persisted && apiData.items.length > 0) {
      setEvidenceItems((apiData.items as Record<string, unknown>[]).map((row) => ({
        id: row.id as string,
        homeId: (row.home_id as string) ?? "",
        childId: (row.child_id as string) ?? undefined,
        staffId: (row.staff_id as string) ?? undefined,
        sourceType: (row.source_record_type as string) ?? "",
        sourceLabel: (row.source_record_type as SourceType) ?? "daily_log",
        sourceId: (row.source_record_id as string) ?? undefined,
        title: (row.title as string) ?? "",
        summary: (row.description as string) ?? undefined,
        evidenceCategory: (row.category as EvidenceCategory) ?? "overall_experiences",
        judgementArea: (row.judgement_area as JudgementArea) ?? undefined,
        regulationReference: undefined,
        confidenceScore: (row.quality_indicator as number) ?? undefined,
        evidenceDate: (row.evidence_date as string) ?? undefined,
        createdBy: (row.created_at as string) ?? undefined,
        createdAt: row.created_at as string,
        updatedAt: row.created_at as string,
      })));
    }
  }, [apiData]);

  /* ── filter state ──────────────────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("90");
  const [strengthFilter, setStrengthFilter] = useState<string>("all");
  const [childFilter, setChildFilter] = useState<string>("all");
  const [showGapsOnly, setShowGapsOnly] = useState(false);
  const [gapPanelOpen, setGapPanelOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [packItems, setPackItems] = useState<string[]>([]);
  const [showPack, setShowPack] = useState(false);

  /* ── ILACS evidence pack builder ────────────────────────────────────────── */

  const generatedPack = useMemo(() => {
    if (!showPack || packItems.length === 0) return null;

    const selected = evidenceItems.filter((e) => packItems.includes(e.id));

    const judgementAreas: JudgementArea[] = [
      "overall_experiences_and_progress",
      "help_and_protection",
      "effectiveness_of_leaders",
    ];

    const byArea = judgementAreas.map((area) => {
      const areaItems = selected.filter((e) => e.judgementArea === area);
      const categories = new Set(areaItems.map((e) => e.evidenceCategory));
      const avgConfidence = areaItems.length > 0
        ? Math.round(areaItems.reduce((s, e) => s + (e.confidenceScore ?? 0), 0) / areaItems.length)
        : 0;

      return {
        area,
        label: JUDGEMENT_LABELS[area],
        colour: JUDGEMENT_COLOURS[area],
        items: areaItems,
        categoryCount: categories.size,
        avgConfidence,
      };
    });

    const uncategorised = selected.filter((e) => !e.judgementArea);

    const totalConfidence = selected.length > 0
      ? Math.round(selected.reduce((s, e) => s + (e.confidenceScore ?? 0), 0) / selected.length)
      : 0;

    const categoryCoverage = new Set(selected.map((e) => e.evidenceCategory)).size;
    const totalCategories = Object.keys(CATEGORY_LABELS).length;
    const coveragePercent = Math.round((categoryCoverage / totalCategories) * 100);

    return {
      generatedAt: new Date().toISOString(),
      homeName: "Oak House",
      totalItems: selected.length,
      totalConfidence,
      categoryCoverage,
      totalCategories,
      coveragePercent,
      byArea,
      uncategorised,
    };
  }, [showPack, packItems, evidenceItems]);

  /* ── derived data ──────────────────────────────────────────────────────── */

  const filteredEvidence = useMemo(() => {
    if (showGapsOnly) return [];

    return evidenceItems.filter((ev) => {
      // judgement area tab
      if (activeTab !== "all" && ev.judgementArea !== activeTab) return false;

      // category
      if (categoryFilter !== "all" && ev.evidenceCategory !== categoryFilter) return false;

      // confidence strength
      if (strengthFilter !== "all") {
        const level = confidenceLevel(ev.confidenceScore);
        if (level !== strengthFilter) return false;
      }

      // child
      if (childFilter !== "all" && ev.childId !== childFilter) return false;

      // period
      if (periodFilter !== "all") {
        const days = parseInt(periodFilter, 10);
        const cutoff = d(-days);
        if (ev.evidenceDate && ev.evidenceDate < cutoff) return false;
      }

      // search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const haystack = `${ev.title} ${ev.summary ?? ""} ${CATEGORY_LABELS[ev.evidenceCategory]}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [activeTab, categoryFilter, periodFilter, strengthFilter, childFilter, showGapsOnly, searchQuery, evidenceItems]);

  /* ── category counts for the filter ────────────────────────────────────── */

  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<EvidenceCategory, number>> = {};
    for (const ev of evidenceItems) {
      counts[ev.evidenceCategory] = (counts[ev.evidenceCategory] ?? 0) + 1;
    }
    return counts;
  }, [evidenceItems]);

  /* ── stats ─────────────────────────────────────────────────────────────── */

  const totalItems = evidenceItems.length;
  const itemsThisMonth = evidenceItems.filter((ev) => {
    const cutoff = d(-30);
    return ev.evidenceDate && ev.evidenceDate >= cutoff;
  }).length;
  const gapCount = gaps.length;

  const togglePackItem = (id: string) => {
    setPackItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  /* ── child name helper ─────────────────────────────────────────────────── */

  const childName = (childId?: string) => {
    if (!childId) return null;
    return CHILDREN.find((c) => c.id === childId)?.name ?? childId;
  };

  /* ══════════════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════════════ */

  return (
    <PageShell
      title="Ofsted Evidence Room"
      subtitle="Organised evidence for inspection readiness"
      actions={
        <Button
          size="sm"
          className="gap-1.5"
          disabled={createEvidence.isPending}
          onClick={() => createEvidence.mutate({
            homeId: "oak-house",
            title: "New Evidence Item",
            category: "general",
            sourceType: "manual",
          })}
        >
          <Plus className="h-3.5 w-3.5" />
          {createEvidence.isPending ? "Adding..." : "Add Evidence"}
        </Button>
      }
    >
      {/* ── summary stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-[var(--cs-navy)]">{totalItems}</p>
                <p className="text-xs text-[var(--cs-text-muted)]">Total evidence items</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-[var(--cs-navy)]">{itemsThisMonth}</p>
                <p className="text-xs text-[var(--cs-text-muted)]">Items this month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-[var(--cs-navy)]">{gapCount}</p>
                <p className="text-xs text-[var(--cs-text-muted)]">Gaps found</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-aria-gold-bg)]">
                <BookOpen className="h-5 w-5 text-[var(--cs-aria-gold)]" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-[var(--cs-navy)]">{packItems.length > 0 ? 1 : 0}</p>
                <p className="text-xs text-[var(--cs-text-muted)]">Evidence packs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── judgement area tabs ─────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            All Areas
          </TabsTrigger>
          <TabsTrigger value="overall_experiences_and_progress" className="text-xs sm:text-sm">
            Overall Experiences
          </TabsTrigger>
          <TabsTrigger value="help_and_protection" className="text-xs sm:text-sm">
            Help &amp; Protection
          </TabsTrigger>
          <TabsTrigger value="effectiveness_of_leaders" className="text-xs sm:text-sm">
            Leaders &amp; Managers
          </TabsTrigger>
        </TabsList>

        {/* Tab content is rendered below the filters for all tabs */}
      </Tabs>

      {/* ── filters ────────────────────────────────────────────────────────── */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--cs-text-muted)]" />
              <input
                type="text"
                placeholder="Search evidence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-[var(--cs-border)] bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>

            {/* category */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORY_GROUPS.map((group) => (
                  <React.Fragment key={group.label}>
                    {group.categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                        {categoryCounts[cat] ? ` (${categoryCounts[cat]})` : ""}
                      </SelectItem>
                    ))}
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>

            {/* period */}
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* confidence / strength */}
            <Select value={strengthFilter} onValueChange={setStrengthFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Strength" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All strength</SelectItem>
                <SelectItem value="high">Strong</SelectItem>
                <SelectItem value="medium">Moderate</SelectItem>
                <SelectItem value="low">Limited</SelectItem>
              </SelectContent>
            </Select>

            {/* child */}
            <Select value={childFilter} onValueChange={setChildFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Child" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All children</SelectItem>
                {CHILDREN.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* show gaps only toggle */}
            <button
              type="button"
              onClick={() => setShowGapsOnly(!showGapsOnly)}
              className={cn(
                "flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors",
                showGapsOnly
                  ? "border-amber-300 bg-amber-50 text-amber-800"
                  : "border-[var(--cs-border)] bg-white text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)]",
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Show gaps only
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ── main content grid ──────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── evidence list (2 cols) ─────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-[var(--cs-text-secondary)]">
              {showGapsOnly
                ? "Evidence Gaps"
                : `Evidence Items (${filteredEvidence.length})`}
            </h2>
            {filteredEvidence.length > 0 && !showGapsOnly && (
              <p className="text-xs text-[var(--cs-text-muted)]">
                Sorted by date, most recent first
              </p>
            )}
          </div>

          {/* ── show gaps only view ────────────────────────────────────── */}
          {showGapsOnly && (
            <div className="space-y-3">
              {gaps.map((gap, i) => (
                <GapCard key={i} gap={gap} childName={childName(gap.childId)} />
              ))}
            </div>
          )}

          {/* ── evidence items ─────────────────────────────────────────── */}
          {!showGapsOnly && filteredEvidence.length === 0 && (
            <EmptyState
              icon={FileText}
              title="No evidence found"
              description="Adjust your filters or add new evidence to this area."
              actions={[
                {
                  label: "Clear filters",
                  variant: "outline",
                  onClick: () => {
                    setCategoryFilter("all");
                    setStrengthFilter("all");
                    setChildFilter("all");
                    setPeriodFilter("90");
                    setSearchQuery("");
                    setActiveTab("all");
                  },
                },
              ]}
            />
          )}

          {!showGapsOnly &&
            filteredEvidence.map((ev) => (
              <EvidenceCard
                key={ev.id}
                item={ev}
                childName={childName(ev.childId)}
                inPack={packItems.includes(ev.id)}
                onTogglePack={() => togglePackItem(ev.id)}
              />
            ))}
        </div>

        {/* ── sidebar (1 col) ────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* ── evidence pack ──────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-[var(--cs-aria-gold)]" />
                Evidence Pack
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {packItems.length === 0 ? (
                <p className="text-sm text-[var(--cs-text-muted)]">
                  No items added yet. Use the &quot;Add to Pack&quot; button on
                  evidence items to build an inspection evidence pack.
                </p>
              ) : (
                <>
                  <div className="rounded-lg border border-[var(--cs-border)] bg-slate-50 p-3">
                    <p className="text-sm font-medium text-[var(--cs-text-secondary)]">
                      {packItems.length} item{packItems.length !== 1 ? "s" : ""} selected
                    </p>
                    <p className="text-xs text-[var(--cs-text-muted)] mt-1">
                      Covering{" "}
                      {new Set(
                        evidenceItems.filter((e) => packItems.includes(e.id)).map(
                          (e) => e.judgementArea,
                        ),
                      ).size}{" "}
                      judgement area
                      {new Set(
                        evidenceItems.filter((e) => packItems.includes(e.id)).map(
                          (e) => e.judgementArea,
                        ),
                      ).size !== 1
                        ? "s"
                        : ""}
                    </p>
                  </div>

                  <ul className="space-y-1.5">
                    {evidenceItems.filter((e) => packItems.includes(e.id)).map(
                      (ev) => (
                        <li
                          key={ev.id}
                          className="flex items-start gap-2 text-xs text-[var(--cs-text-secondary)]"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-emerald-500 shrink-0" />
                          <span className="line-clamp-1">{ev.title}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5"
                disabled={packItems.length === 0}
                onClick={() => setShowPack(true)}
              >
                <FileDown className="h-3.5 w-3.5" />
                Generate Evidence Pack
              </Button>

              {packItems.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-[var(--cs-text-muted)]"
                  onClick={() => setPackItems([])}
                >
                  Clear selection
                </Button>
              )}
            </CardContent>
          </Card>

          {/* ── evidence gap scanner ────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <button
                type="button"
                onClick={() => setGapPanelOpen(!gapPanelOpen)}
                className="flex w-full items-center justify-between"
              >
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Evidence Gap Scanner
                  <Badge variant="warning" className="ml-1">
                    {gapCount}
                  </Badge>
                </CardTitle>
                {gapPanelOpen ? (
                  <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted)]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted)]" />
                )}
              </button>
            </CardHeader>

            {gapPanelOpen && (
              <CardContent className="space-y-3 pt-0">
                <p className="text-xs text-[var(--cs-text-muted)]">
                  Areas where evidence is missing, overdue, or insufficient for
                  inspection readiness.
                </p>
                {gaps.map((gap, i) => (
                  <GapCardCompact key={i} gap={gap} childName={childName(gap.childId)} />
                ))}
              </CardContent>
            )}
          </Card>

          {/* ── category coverage ──────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4 text-[var(--cs-text-muted)]" />
                Category Coverage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {CATEGORY_GROUPS.map((group) => {
                  const count = group.categories.reduce(
                    (sum, cat) => sum + (categoryCounts[cat] ?? 0),
                    0,
                  );
                  return (
                    <div key={group.label} className="flex items-center justify-between">
                      <span className="text-xs text-[var(--cs-text-secondary)] truncate mr-2">
                        {group.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              count > 0 ? "bg-emerald-400" : "bg-slate-200",
                            )}
                            style={{ width: `${Math.min((count / 3) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-[var(--cs-text-muted)] w-5 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* ── ILACS Evidence Pack View ──────────────────────────────────────── */}
      {showPack && generatedPack && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-[var(--cs-shadow-elevated)] w-full max-w-3xl mx-4 mb-10">
            {/* Pack Header */}
            <div className="border-b p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--cs-navy)] flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-[var(--cs-aria-gold)]" />
                    Inspection Evidence Pack
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {generatedPack.homeName} — Generated {new Date(generatedPack.generatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowPack(false)}>
                  Close
                </Button>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-3 mt-4">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-[var(--cs-navy)]">{generatedPack.totalItems}</p>
                  <p className="text-xs text-muted-foreground">Evidence Items</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-[var(--cs-navy)]">{generatedPack.coveragePercent}%</p>
                  <p className="text-xs text-muted-foreground">Category Coverage</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className={cn("text-2xl font-bold", generatedPack.totalConfidence >= 75 ? "text-green-600" : generatedPack.totalConfidence >= 50 ? "text-amber-600" : "text-red-600")}>
                    {generatedPack.totalConfidence}%
                  </p>
                  <p className="text-xs text-muted-foreground">Avg Confidence</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-[var(--cs-navy)]">{generatedPack.byArea.filter((a) => a.items.length > 0).length}/3</p>
                  <p className="text-xs text-muted-foreground">ILACS Areas Covered</p>
                </div>
              </div>
            </div>

            {/* Pack Body — By Judgement Area */}
            <div className="p-6 space-y-6">
              {generatedPack.byArea.map((area) => (
                <div key={area.area}>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={cn("text-xs", area.colour)}>
                      {area.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {area.items.length} item{area.items.length !== 1 ? "s" : ""} · {area.categoryCount} categor{area.categoryCount !== 1 ? "ies" : "y"} · Avg confidence {area.avgConfidence}%
                    </span>
                  </div>

                  {area.items.length === 0 ? (
                    <div className="border border-dashed border-[var(--cs-border)] rounded-lg p-4 text-center">
                      <p className="text-sm text-[var(--cs-text-muted)]">No evidence selected for this judgement area</p>
                      <p className="text-xs text-[var(--cs-text-muted)] mt-1">Consider adding evidence that demonstrates quality in this area</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {area.items.map((ev) => (
                        <div key={ev.id} className="border border-[var(--cs-border)] rounded-lg p-3 flex items-start gap-3">
                          <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", CONFIDENCE_DOT[confidenceLevel(ev.confidenceScore)])} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--cs-navy)] line-clamp-1">{ev.title}</p>
                            {ev.summary && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ev.summary}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge variant="outline" className="text-[10px]">
                                {CATEGORY_LABELS[ev.evidenceCategory]}
                              </Badge>
                              {ev.evidenceDate && (
                                <span className="text-[10px] text-muted-foreground">{fmt(ev.evidenceDate)}</span>
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                {SOURCE_LABELS[ev.sourceType as SourceType] ?? ev.sourceType}
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {ev.confidenceScore ?? 0}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Uncategorised */}
              {generatedPack.uncategorised.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">Uncategorised</Badge>
                    <span className="text-xs text-muted-foreground">
                      {generatedPack.uncategorised.length} item{generatedPack.uncategorised.length !== 1 ? "s" : ""} not mapped to a judgement area
                    </span>
                  </div>
                  <div className="space-y-2">
                    {generatedPack.uncategorised.map((ev) => (
                      <div key={ev.id} className="border border-[var(--cs-border)] rounded-lg p-3 flex items-start gap-3">
                        <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", CONFIDENCE_DOT[confidenceLevel(ev.confidenceScore)])} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--cs-navy)] line-clamp-1">{ev.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px]">
                              {CATEGORY_LABELS[ev.evidenceCategory]}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Readiness Assessment */}
              <div className="bg-slate-50 rounded-lg p-4 border border-[var(--cs-border)]">
                <h3 className="text-sm font-semibold text-[var(--cs-navy)] mb-2 flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                  Readiness Assessment
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {generatedPack.byArea.map((area) => (
                    <div key={area.area}>
                      <p className={cn("text-lg font-bold", area.items.length >= 3 ? "text-green-600" : area.items.length >= 1 ? "text-amber-600" : "text-red-600")}>
                        {area.items.length >= 3 ? "Strong" : area.items.length >= 1 ? "Partial" : "Gap"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{area.label.split(" ").slice(0, 3).join(" ")}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pack Footer */}
            <div className="border-t p-4 flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                {generatedPack.categoryCoverage}/{generatedPack.totalCategories} evidence categories represented
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowPack(false)}>
                  Close
                </Button>
                <Button size="sm" className="gap-1.5">
                  <FileDown className="h-3.5 w-3.5" />
                  Export as PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════════════════════════════════════════════ */

/* ── EvidenceCard ──────────────────────────────────────────────────────────── */

interface EvidenceCardProps {
  item: InspectionEvidenceItem & { sourceLabel: SourceType };
  childName: string | null;
  inPack: boolean;
  onTogglePack: () => void;
}

function EvidenceCard({ item, childName, inPack, onTogglePack }: EvidenceCardProps) {
  const level = confidenceLevel(item.confidenceScore);

  return (
    <Card className={cn("transition-colors", inPack && "ring-1 ring-[var(--cs-aria-gold-soft)] bg-[var(--cs-aria-gold-bg)]/30")}>
      <CardContent className="p-4">
        {/* top row: title + confidence */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-sm font-semibold text-[var(--cs-navy)] leading-snug">
            {item.title}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0" title={`Confidence: ${CONFIDENCE_LABEL[level]}`}>
            <span
              className={cn("h-2.5 w-2.5 rounded-full shrink-0", CONFIDENCE_DOT[level])}
            />
            <span className="text-xs text-[var(--cs-text-muted)]">{item.confidenceScore}%</span>
          </div>
        </div>

        {/* summary */}
        {item.summary && (
          <p className="text-sm text-[var(--cs-text-secondary)] leading-relaxed mb-3">{item.summary}</p>
        )}

        {/* badges row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <Badge variant="secondary" className="text-[11px]">
            {CATEGORY_LABELS[item.evidenceCategory]}
          </Badge>
          {item.judgementArea && (
            <Badge className={cn("text-[11px]", JUDGEMENT_COLOURS[item.judgementArea])}>
              {JUDGEMENT_LABELS[item.judgementArea]}
            </Badge>
          )}
          {childName && (
            <Badge variant="outline" className="text-[11px]">
              <Users className="h-3 w-3 mr-0.5" />
              {childName}
            </Badge>
          )}
        </div>

        {/* meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--cs-text-muted)] mb-3">
          <span className="flex items-center gap-1">
            <CircleDot className="h-3 w-3" />
            {SOURCE_LABELS[item.sourceLabel]}
          </span>
          {item.evidenceDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {fmt(item.evidenceDate)}
            </span>
          )}
          {item.createdBy && (
            <span>Recorded by {item.createdBy}</span>
          )}
        </div>

        {/* actions row */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1 text-xs h-7">
            <Link2 className="h-3 w-3" />
            Link Record
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs h-7">
            <Eye className="h-3 w-3" />
            View Source
          </Button>
          <Button
            variant={inPack ? "secondary" : "outline"}
            size="sm"
            className={cn(
              "gap-1 text-xs h-7",
              inPack && "bg-[var(--cs-aria-gold-bg)] text-[var(--cs-navy)] hover:bg-[var(--cs-aria-gold-soft)]",
            )}
            onClick={onTogglePack}
          >
            {inPack ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <PackagePlus className="h-3 w-3" />
            )}
            {inPack ? "In Pack" : "Add to Pack"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── GapCard (full, for "show gaps only" view) ─────────────────────────────── */

interface GapCardProps {
  gap: EvidenceGap;
  childName: string | null;
}

function GapCard({ gap, childName }: GapCardProps) {
  return (
    <Card className="border-amber-200 bg-amber-50/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 mt-0.5">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-sm font-semibold text-[var(--cs-navy)]">{gap.title}</h3>
              <Badge variant={SEVERITY_VARIANT[gap.severity]} className="shrink-0 text-[11px]">
                {SEVERITY_LABEL[gap.severity]}
              </Badge>
            </div>

            <p className="text-sm text-[var(--cs-text-secondary)] mb-2">{gap.description}</p>

            {childName && (
              <Badge variant="outline" className="text-[11px] mb-2">
                <Users className="h-3 w-3 mr-0.5" />
                {childName}
              </Badge>
            )}

            <div className="rounded-lg bg-white border border-amber-200 p-3 mt-2">
              <p className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 flex items-center gap-1">
                <ClipboardCheck className="h-3 w-3 text-amber-600" />
                Recommendation
              </p>
              <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">
                {gap.recommendation}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── GapCardCompact (for sidebar scanner) ──────────────────────────────────── */

function GapCardCompact({ gap, childName }: GapCardProps) {
  return (
    <div className="rounded-lg border border-[var(--cs-border)] bg-white p-3">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h4 className="text-xs font-semibold text-[var(--cs-text-secondary)] leading-snug">{gap.title}</h4>
        <Badge variant={SEVERITY_VARIANT[gap.severity]} className="shrink-0 text-[10px] px-1.5">
          {SEVERITY_LABEL[gap.severity]}
        </Badge>
      </div>
      {childName && (
        <span className="text-[11px] text-[var(--cs-text-muted)]">{childName}</span>
      )}
      <p className="text-[11px] text-[var(--cs-text-muted)] mt-1 leading-relaxed line-clamp-2">
        {gap.recommendation}
      </p>
    </div>
  );
}
