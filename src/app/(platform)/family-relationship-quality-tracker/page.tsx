"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — FAMILY RELATIONSHIP QUALITY TRACKER
// Children's Homes Regulations 2015 — Quality Standard 9 (Care Planning)
// Tracks the quality of each child's family relationships over time so we can
// see relationship temperature, key indicators, and the impact of intervention.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Heart, Users, TrendingUp, TrendingDown, Minus, AlertTriangle,
  CheckCircle2, ChevronDown, ChevronUp, ArrowUpDown, CalendarDays,
  Sparkles, ShieldAlert, MessageCircle, Activity, Compass,
} from "lucide-react";

// ── Local date helper ─────────────────────────────────────────────────────────

const d = (n: number): string => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

// ── Types ─────────────────────────────────────────────────────────────────────

type RelationshipType =
  | "Mother"
  | "Father"
  | "Grandparent"
  | "Sibling"
  | "Aunt/Uncle"
  | "Cousin"
  | "Step-family"
  | "Adoptive parent";

type CurrentQuality =
  | "Strong"
  | "Stable"
  | "Complicated"
  | "Fragile"
  | "Severed/Restricted";

type Trajectory = "Improving" | "Stable" | "Concerning" | "Declining";

interface RelationshipRecord {
  id:                    string;
  youngPerson:           string;
  assessmentDate:        string;
  familyMember:          string;
  relationshipType:      RelationshipType;
  currentQuality:        CurrentQuality;
  quality1to10:          number;
  contactFrequency:      string;
  contactQuality:        string;
  recentEvents:          string[];
  strengthsObserved:     string[];
  challengesObserved:    string[];
  childPerspective:      string;
  interventionsActive:   string[];
  trajectory:            Trajectory;
  riskFactors:           string[];
  protectiveFactors:     string[];
  childWishesAndFeelings: string;
  nextReview:            string;
  reviewedBy:            string;
}

// ── Seed records ──────────────────────────────────────────────────────────────

const RECORDS: RelationshipRecord[] = [
  {
    id: "frq_001",
    youngPerson: "yp_alex",
    assessmentDate: d(-22),
    familyMember: "Sarah (Mother)",
    relationshipType: "Mother",
    currentQuality: "Stable",
    quality1to10: 7,
    contactFrequency: "Weekly video call + monthly face-to-face",
    contactQuality: "Warm, mostly positive — occasional friction around school topic",
    recentEvents: [
      "Mum attended LAC review and contributed thoughtfully",
      "Joint cinema trip went well — first unsupervised since admission",
      "Argument over phone last fortnight, repaired within 48h",
    ],
    strengthsObserved: [
      "Mum demonstrates consistent emotional availability",
      "Alex initiates contact independently",
      "Both able to repair after conflict",
    ],
    challengesObserved: [
      "Mum's anxiety occasionally projects onto Alex",
      "Conversations about school can escalate",
    ],
    childPerspective: "Alex describes Mum as their 'safe person' and looks forward to calls.",
    interventionsActive: [
      "Family therapy fortnightly (Tavistock pathway)",
      "Pre-call planning with key worker",
    ],
    trajectory: "Improving",
    riskFactors: [
      "Mum's mental health fluctuates",
      "Historic domestic abuse (perpetrator no longer in picture)",
    ],
    protectiveFactors: [
      "Strong attachment baseline",
      "Mum engaged with own therapy",
      "Clear safety plan in place",
    ],
    childWishesAndFeelings:
      "Wants to stay overnight at Mum's during summer holidays — has discussed with social worker.",
    nextReview: d(28),
    reviewedBy: "staff_darren",
  },
  {
    id: "frq_002",
    youngPerson: "yp_alex",
    assessmentDate: d(-22),
    familyMember: "David (Father)",
    relationshipType: "Father",
    currentQuality: "Severed/Restricted",
    quality1to10: 2,
    contactFrequency: "No direct contact — letterbox only (placing LA decision)",
    contactQuality: "Indirect; Alex receives letters quarterly via SW",
    recentEvents: [
      "Dad sent birthday letter — Alex chose not to read it yet",
      "Court-ordered restriction reaffirmed at last review",
    ],
    strengthsObserved: [
      "Alex can name and discuss feelings about Dad in life-story work",
    ],
    challengesObserved: [
      "Significant trauma history",
      "Dad has not engaged with non-molestation conditions",
    ],
    childPerspective: "Alex expresses ambivalence — curiosity mixed with fear.",
    interventionsActive: [
      "Life-story work weekly",
      "Therapeutic letter-writing (held, not sent)",
    ],
    trajectory: "Stable",
    riskFactors: [
      "Re-traumatisation risk on direct contact",
      "Dad's history of coercive behaviour",
    ],
    protectiveFactors: [
      "Robust safeguarding plan",
      "Alex has safe adult to process feelings with",
    ],
    childWishesAndFeelings:
      "Does not want direct contact at this time — wants to keep the option open for future.",
    nextReview: d(60),
    reviewedBy: "staff_anna",
  },
  {
    id: "frq_003",
    youngPerson: "yp_alex",
    assessmentDate: d(-22),
    familyMember: "Nan Pat (Maternal grandmother)",
    relationshipType: "Grandparent",
    currentQuality: "Strong",
    quality1to10: 9,
    contactFrequency: "Twice weekly — phone calls + Sunday visits",
    contactQuality: "Consistently warm, calm, predictable",
    recentEvents: [
      "Nan came to school sports day",
      "Made Alex's favourite shepherd's pie last visit",
    ],
    strengthsObserved: [
      "Stable across all of Alex's life",
      "Provides bridge between Alex and wider maternal family",
      "Models healthy emotional regulation",
    ],
    challengesObserved: [
      "Nan's own mobility declining — may affect future visits",
    ],
    childPerspective: "Alex describes Nan as 'the one who never let me down'.",
    interventionsActive: [
      "Transport support for Sunday visits",
    ],
    trajectory: "Stable",
    riskFactors: [
      "Nan's age and health",
    ],
    protectiveFactors: [
      "Lifelong attachment",
      "Wider extended family network around Nan",
      "Nan named in care plan as significant adult",
    ],
    childWishesAndFeelings:
      "Wants Nan to be 'always part of life' — has asked for photos for bedroom.",
    nextReview: d(45),
    reviewedBy: "staff_darren",
  },
  {
    id: "frq_004",
    youngPerson: "yp_jordan",
    assessmentDate: d(-15),
    familyMember: "Maria (Mother)",
    relationshipType: "Mother",
    currentQuality: "Complicated",
    quality1to10: 5,
    contactFrequency: "Fortnightly supervised in community",
    contactQuality: "Inconsistent — warm when present, but cancellations frequent",
    recentEvents: [
      "Mum cancelled two consecutive sessions citing work",
      "Last session went well — went bowling together",
      "Mum did not attend latest LAC review",
    ],
    strengthsObserved: [
      "Genuine love evident when together",
      "Jordan beams when Mum shows up",
    ],
    challengesObserved: [
      "Pattern of cancellation harms Jordan's trust",
      "Mum's substance misuse not yet stable",
      "Limited follow-through on agreed actions",
    ],
    childPerspective: "Jordan oscillates between hope and guarded disappointment.",
    interventionsActive: [
      "Pre- and post-contact debrief with key worker",
      "Mum offered substance-misuse pathway (engagement variable)",
      "Contact review meeting scheduled with placing LA",
    ],
    trajectory: "Concerning",
    riskFactors: [
      "Mum's relapses",
      "Repeated cancellations affecting Jordan's self-worth",
      "Older sibling dynamic when Mum present",
    ],
    protectiveFactors: [
      "Supervised setting",
      "Strong key-worker scaffolding around contact",
      "Jordan articulates own feelings clearly",
    ],
    childWishesAndFeelings:
      "Wants Mum 'to just turn up when she says she will'. Considering writing a letter to Mum.",
    nextReview: d(14),
    reviewedBy: "staff_chervelle",
  },
  {
    id: "frq_005",
    youngPerson: "yp_jordan",
    assessmentDate: d(-15),
    familyMember: "Tyler (Older brother, age 19)",
    relationshipType: "Sibling",
    currentQuality: "Strong",
    quality1to10: 8,
    contactFrequency: "Weekly — visits home + daily WhatsApp",
    contactQuality: "Genuinely nurturing — Tyler is functionally a parent figure",
    recentEvents: [
      "Tyler took Jordan to football match",
      "Tyler attended LAC review in Mum's place",
      "Daily check-in messages maintained",
    ],
    strengthsObserved: [
      "Tyler is reliable, age-appropriate boundary-setter",
      "Shared history of resilience",
      "Tyler engages constructively with the home",
    ],
    challengesObserved: [
      "Risk of Tyler being parentified — needs protecting",
      "Tyler's own life pressures (uni, work)",
    ],
    childPerspective: "Jordan calls Tyler 'my person'. Visibly regulates around him.",
    interventionsActive: [
      "Sibling-time funded monthly (cinema/meal)",
      "Offered Tyler young-adult support signposting",
    ],
    trajectory: "Stable",
    riskFactors: [
      "Tyler over-burdening himself",
    ],
    protectiveFactors: [
      "Lifelong bond",
      "Tyler in stable accommodation",
      "Home actively nurtures the relationship",
    ],
    childWishesAndFeelings:
      "Wants Tyler at every important meeting and milestone.",
    nextReview: d(40),
    reviewedBy: "staff_darren",
  },
  {
    id: "frq_006",
    youngPerson: "yp_jordan",
    assessmentDate: d(-15),
    familyMember: "Auntie Rose",
    relationshipType: "Aunt/Uncle",
    currentQuality: "Stable",
    quality1to10: 6,
    contactFrequency: "Monthly — Sunday lunch at her home",
    contactQuality: "Warm, low-key, consistent",
    recentEvents: [
      "Family Christmas lunch went well",
      "Auntie Rose offered to be emergency contact",
    ],
    strengthsObserved: [
      "Provides cultural and family continuity",
      "Bridge to maternal family without Mum's instability",
    ],
    challengesObserved: [
      "Lives 90 minutes away — logistics constrain frequency",
    ],
    childPerspective: "Jordan says Auntie's house 'feels like the old days'.",
    interventionsActive: [
      "Travel support to facilitate visits",
    ],
    trajectory: "Improving",
    riskFactors: [
      "Distance",
    ],
    protectiveFactors: [
      "Auntie has capacity and willingness",
      "Wider cousin network at her home",
    ],
    childWishesAndFeelings:
      "Would like to spend a weekend at Auntie's during half-term.",
    nextReview: d(35),
    reviewedBy: "staff_chervelle",
  },
  {
    id: "frq_007",
    youngPerson: "yp_casey",
    assessmentDate: d(-9),
    familyMember: "Grandad Peter",
    relationshipType: "Grandparent",
    currentQuality: "Fragile",
    quality1to10: 4,
    contactFrequency: "Monthly phone call + occasional visits",
    contactQuality: "Affectionate but Grandad's health and grief make contact unpredictable",
    recentEvents: [
      "Grandad's recent bereavement (Casey's grandmother)",
      "Last phone call cut short — Grandad upset",
      "Casey wrote and sent a card",
    ],
    strengthsObserved: [
      "Mutual love evident",
      "Casey shows compassion toward Grandad",
    ],
    challengesObserved: [
      "Grandad in acute grief — limited capacity right now",
      "Casey at risk of taking on emotional weight",
    ],
    childPerspective: "Casey worried about Grandad — wants to help but doesn't know how.",
    interventionsActive: [
      "Bereavement-aware contact planning",
      "Therapeutic key work focused on grief",
      "Liaising with Grandad's local authority adult-services worker",
    ],
    trajectory: "Concerning",
    riskFactors: [
      "Grandad's mental health post-bereavement",
      "Casey absorbing adult emotional load",
    ],
    protectiveFactors: [
      "Strong baseline relationship",
      "Casey has therapeutic support",
      "Wider family providing wraparound to Grandad",
    ],
    childWishesAndFeelings:
      "Wants to visit Grandad in person and 'just sit with him'. Has asked to bake him a cake.",
    nextReview: d(10),
    reviewedBy: "staff_anna",
  },
  {
    id: "frq_008",
    youngPerson: "yp_casey",
    assessmentDate: d(-9),
    familyMember: "Lewis (Younger brother, age 8 — in foster care)",
    relationshipType: "Sibling",
    currentQuality: "Stable",
    quality1to10: 7,
    contactFrequency: "Fortnightly supervised sibling contact at family centre",
    contactQuality: "Joyful, playful, sometimes emotionally charged at goodbyes",
    recentEvents: [
      "Joint trip to soft-play with foster carers — went very well",
      "Lewis sent a drawing — now on Casey's bedroom wall",
      "Goodbye at last contact difficult — both tearful",
    ],
    strengthsObserved: [
      "Strong attuned sibling bond",
      "Casey gentle and protective toward Lewis",
      "Foster carers proactively supportive of contact",
    ],
    challengesObserved: [
      "Endings consistently difficult",
      "Different placement plans creating uncertainty",
    ],
    childPerspective: "Casey says Lewis is 'the most important person in the whole world'.",
    interventionsActive: [
      "Joint life-story book in progress",
      "Sibling-contact transition planning",
      "Co-working with Lewis's foster carers' supervising SW",
    ],
    trajectory: "Improving",
    riskFactors: [
      "Placement plans diverging",
      "Goodbye distress affecting Casey for ~24h after",
    ],
    protectiveFactors: [
      "Both placements committed to maintaining contact",
      "Sibling assessment recognises bond as significant",
      "Skilled supervisor at the family centre",
    ],
    childWishesAndFeelings:
      "Wants more frequent contact and a regular sleepover. Has asked if Lewis can come to next birthday.",
    nextReview: d(20),
    reviewedBy: "staff_darren",
  },
];

// ── Style helpers ─────────────────────────────────────────────────────────────

const QUALITY_TONE: Record<CurrentQuality, string> = {
  "Strong":             "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Stable":             "bg-sky-50 text-sky-700 border-sky-200",
  "Complicated":        "bg-amber-50 text-amber-700 border-amber-200",
  "Fragile":            "bg-orange-50 text-orange-700 border-orange-200",
  "Severed/Restricted": "bg-rose-50 text-rose-700 border-rose-200",
};

const TRAJECTORY_TONE: Record<Trajectory, string> = {
  "Improving":  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Stable":     "bg-sky-50 text-sky-700 border-sky-200",
  "Concerning": "bg-amber-50 text-amber-700 border-amber-200",
  "Declining":  "bg-rose-50 text-rose-700 border-rose-200",
};

function TrajectoryIcon({ t }: { t: Trajectory }) {
  if (t === "Improving") return <TrendingUp className="h-3.5 w-3.5" />;
  if (t === "Declining") return <TrendingDown className="h-3.5 w-3.5" />;
  if (t === "Concerning") return <AlertTriangle className="h-3.5 w-3.5" />;
  return <Minus className="h-3.5 w-3.5" />;
}

// ── Page ──────────────────────────────────────────────────────────────────────

type SortKey = "date" | "quality" | "review" | "child";

export default function FamilyRelationshipQualityTrackerPage() {
  const [filterChild, setFilterChild]       = useState<string>("all");
  const [filterQuality, setFilterQuality]   = useState<string>("all");
  const [filterTrajectory, setFilterTraj]   = useState<string>("all");
  const [sortKey, setSortKey]               = useState<SortKey>("review");
  const [expandedId, setExpandedId]         = useState<string | null>(null);

  // ── Stats ───────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = RECORDS.length;
    const strongOrImproving = RECORDS.filter(
      (r) => r.currentQuality === "Strong" || r.trajectory === "Improving",
    ).length;
    const pct = total === 0 ? 0 : Math.round((strongOrImproving / total) * 100);

    const today = new Date().toISOString().slice(0, 10);
    const in30 = d(30);
    const reviewsDue = RECORDS.filter(
      (r) => r.nextReview >= today && r.nextReview <= in30,
    ).length;

    const childrenWithWork = new Set(
      RECORDS.filter((r) => r.interventionsActive.length > 0).map((r) => r.youngPerson),
    ).size;

    return { total, pct, reviewsDue, childrenWithWork };
  }, []);

  // ── Filter + sort ───────────────────────────────────────────────────────────

  const visible = useMemo(() => {
    let rows = RECORDS.slice();
    if (filterChild !== "all")     rows = rows.filter((r) => r.youngPerson === filterChild);
    if (filterQuality !== "all")   rows = rows.filter((r) => r.currentQuality === filterQuality);
    if (filterTrajectory !== "all") rows = rows.filter((r) => r.trajectory === filterTrajectory);

    rows.sort((a, b) => {
      switch (sortKey) {
        case "date":    return b.assessmentDate.localeCompare(a.assessmentDate);
        case "quality": return b.quality1to10 - a.quality1to10;
        case "review":  return a.nextReview.localeCompare(b.nextReview);
        case "child":   return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
      }
    });
    return rows;
  }, [filterChild, filterQuality, filterTrajectory, sortKey]);

  // ── Export columns ──────────────────────────────────────────────────────────

  const exportColumns: ExportColumn<RelationshipRecord>[] = [
    { header: "ID",                accessor: (r: RelationshipRecord) => r.id },
    { header: "Young person",      accessor: (r: RelationshipRecord) => getYPName(r.youngPerson) },
    { header: "Assessment date",   accessor: (r: RelationshipRecord) => r.assessmentDate },
    { header: "Family member",     accessor: (r: RelationshipRecord) => r.familyMember },
    { header: "Relationship type", accessor: (r: RelationshipRecord) => r.relationshipType },
    { header: "Current quality",   accessor: (r: RelationshipRecord) => r.currentQuality },
    { header: "Score (1–10)",      accessor: (r: RelationshipRecord) => r.quality1to10 },
    { header: "Contact frequency", accessor: (r: RelationshipRecord) => r.contactFrequency },
    { header: "Contact quality",   accessor: (r: RelationshipRecord) => r.contactQuality },
    { header: "Trajectory",        accessor: (r: RelationshipRecord) => r.trajectory },
    { header: "Strengths",         accessor: (r: RelationshipRecord) => r.strengthsObserved.join("; ") },
    { header: "Challenges",        accessor: (r: RelationshipRecord) => r.challengesObserved.join("; ") },
    { header: "Recent events",     accessor: (r: RelationshipRecord) => r.recentEvents.join("; ") },
    { header: "Interventions",     accessor: (r: RelationshipRecord) => r.interventionsActive.join("; ") },
    { header: "Risk factors",      accessor: (r: RelationshipRecord) => r.riskFactors.join("; ") },
    { header: "Protective factors", accessor: (r: RelationshipRecord) => r.protectiveFactors.join("; ") },
    { header: "Child perspective", accessor: (r: RelationshipRecord) => r.childPerspective },
    { header: "Wishes & feelings", accessor: (r: RelationshipRecord) => r.childWishesAndFeelings },
    { header: "Next review",       accessor: (r: RelationshipRecord) => r.nextReview },
    { header: "Reviewed by",       accessor: (r: RelationshipRecord) => getStaffName(r.reviewedBy) },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <PageShell
      title="Family Relationship Quality Tracker"
      subtitle="Quarterly assessments of each child's key family relationships — temperature, indicators, and the impact of our interventions. Quality Standard 9."
      actions={
        <div className="flex items-center gap-2">
          <ExportButton
            data={visible}
            columns={exportColumns}
            filename="family-relationship-quality"
          />
          <PrintButton title="Family Relationship Quality Tracker" />
        </div>
      }
    >
      {/* ── Summary stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Relationships tracked"
          value={String(stats.total)}
          tone="sky"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Strong / improving"
          value={`${stats.pct}%`}
          tone="emerald"
        />
        <StatCard
          icon={<CalendarDays className="h-4 w-4" />}
          label="Reviews due (30d)"
          value={String(stats.reviewsDue)}
          tone="amber"
        />
        <StatCard
          icon={<Sparkles className="h-4 w-4" />}
          label="Children with active family work"
          value={String(stats.childrenWithWork)}
          tone="violet"
        />
      </div>

      {/* ── Tender banner ─────────────────────────────────────────────────── */}
      <div className="mt-5 rounded-xl border border-rose-100 bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 p-4">
        <div className="flex items-start gap-3">
          <Heart className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
          <div className="text-sm leading-relaxed text-rose-900">
            <p className="font-semibold">Relationships are the work.</p>
            <p className="mt-1 text-rose-800/90">
              Every entry here represents a real person who matters deeply to one of our
              children. We track quality not to grade families, but to notice early when a
              connection needs holding more carefully — and to celebrate the threads that
              are growing stronger. Be honest, be kind, and remember that ambivalence,
              grief, and hope can all live in the same relationship.
            </p>
          </div>
        </div>
      </div>

      {/* ── Filters & sort ────────────────────────────────────────────────── */}
      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Child</span>
          <Select value={filterChild} onValueChange={setFilterChild}>
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <SelectValue placeholder="All children" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All children</SelectItem>
              <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
              <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
              <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Quality</span>
          <Select value={filterQuality} onValueChange={setFilterQuality}>
            <SelectTrigger className="h-8 w-[170px] text-xs">
              <SelectValue placeholder="All qualities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All qualities</SelectItem>
              <SelectItem value="Strong">Strong</SelectItem>
              <SelectItem value="Stable">Stable</SelectItem>
              <SelectItem value="Complicated">Complicated</SelectItem>
              <SelectItem value="Fragile">Fragile</SelectItem>
              <SelectItem value="Severed/Restricted">Severed/Restricted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Trajectory</span>
          <Select value={filterTrajectory} onValueChange={setFilterTraj}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All trajectories</SelectItem>
              <SelectItem value="Improving">Improving</SelectItem>
              <SelectItem value="Stable">Stable</SelectItem>
              <SelectItem value="Concerning">Concerning</SelectItem>
              <SelectItem value="Declining">Declining</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-slate-400" />
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="h-8 w-[200px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="review">Sort: next review (soonest)</SelectItem>
              <SelectItem value="date">Sort: assessment date</SelectItem>
              <SelectItem value="quality">Sort: score (highest)</SelectItem>
              <SelectItem value="child">Sort: child A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Records ───────────────────────────────────────────────────────── */}
      <div className="mt-4 space-y-3">
        {visible.map((r) => {
          const open = expandedId === r.id;
          return (
            <div
              key={r.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              {/* header row */}
              <button
                type="button"
                onClick={() => setExpandedId(open ? null : r.id)}
                className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-slate-50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                  <Heart className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {r.familyMember}
                    </span>
                    <span className="text-xs text-slate-500">·</span>
                    <span className="text-xs font-medium text-slate-600">
                      {getYPName(r.youngPerson)}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-[11px] uppercase tracking-wide text-slate-500">
                      {r.relationshipType}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        QUALITY_TONE[r.currentQuality],
                      )}
                    >
                      {r.currentQuality}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        TRAJECTORY_TONE[r.trajectory],
                      )}
                    >
                      <TrajectoryIcon t={r.trajectory} />
                      {r.trajectory}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      <Activity className="h-3 w-3" />
                      {r.quality1to10}/10
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                      <CalendarDays className="h-3 w-3" />
                      Review {r.nextReview}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 self-center text-slate-400">
                  {open ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              {/* expanded body */}
              {open && (
                <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Section title="Contact pattern" icon={<MessageCircle className="h-3.5 w-3.5" />}>
                      <p className="text-xs text-slate-700">
                        <span className="font-medium text-slate-900">Frequency:</span>{" "}
                        {r.contactFrequency}
                      </p>
                      <p className="mt-1 text-xs text-slate-700">
                        <span className="font-medium text-slate-900">Quality:</span>{" "}
                        {r.contactQuality}
                      </p>
                    </Section>

                    <Section title="Recent events" icon={<CalendarDays className="h-3.5 w-3.5" />}>
                      <ul className="list-disc pl-4 text-xs text-slate-700">
                        {r.recentEvents.map((e, i) => (
                          <li key={i} className="mt-0.5">{e}</li>
                        ))}
                      </ul>
                    </Section>

                    <Section title="Strengths observed" icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}>
                      <ul className="list-disc pl-4 text-xs text-slate-700">
                        {r.strengthsObserved.map((s, i) => (
                          <li key={i} className="mt-0.5">{s}</li>
                        ))}
                      </ul>
                    </Section>

                    <Section title="Challenges observed" icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}>
                      <ul className="list-disc pl-4 text-xs text-slate-700">
                        {r.challengesObserved.map((c, i) => (
                          <li key={i} className="mt-0.5">{c}</li>
                        ))}
                      </ul>
                    </Section>

                    <Section title="Active interventions" icon={<Sparkles className="h-3.5 w-3.5 text-violet-600" />}>
                      {r.interventionsActive.length === 0 ? (
                        <p className="text-xs italic text-slate-500">None currently.</p>
                      ) : (
                        <ul className="list-disc pl-4 text-xs text-slate-700">
                          {r.interventionsActive.map((iv, i) => (
                            <li key={i} className="mt-0.5">{iv}</li>
                          ))}
                        </ul>
                      )}
                    </Section>

                    <Section title="Risk & protective factors" icon={<ShieldAlert className="h-3.5 w-3.5 text-rose-600" />}>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-600">
                        Risks
                      </p>
                      <ul className="list-disc pl-4 text-xs text-slate-700">
                        {r.riskFactors.map((rf, i) => (
                          <li key={i} className="mt-0.5">{rf}</li>
                        ))}
                      </ul>
                      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                        Protective
                      </p>
                      <ul className="list-disc pl-4 text-xs text-slate-700">
                        {r.protectiveFactors.map((pf, i) => (
                          <li key={i} className="mt-0.5">{pf}</li>
                        ))}
                      </ul>
                    </Section>

                    <Section
                      title="Child's perspective"
                      icon={<Compass className="h-3.5 w-3.5 text-sky-600" />}
                      span2
                    >
                      <p className="text-xs italic text-slate-700">
                        &ldquo;{r.childPerspective}&rdquo;
                      </p>
                    </Section>

                    <Section
                      title="Wishes & feelings"
                      icon={<Heart className="h-3.5 w-3.5 text-rose-500" />}
                      span2
                    >
                      <p className="text-xs text-slate-700">{r.childWishesAndFeelings}</p>
                    </Section>
                  </div>

                  {/* footer meta */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 text-[11px] text-slate-500">
                    <span>
                      Assessed {r.assessmentDate} · Reviewed by{" "}
                      <span className="font-medium text-slate-700">
                        {getStaffName(r.reviewedBy)}
                      </span>
                    </span>
                    <span>
                      Next review:{" "}
                      <span className="font-medium text-slate-700">{r.nextReview}</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {visible.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No relationships match the current filters.
          </div>
        )}
      </div>

      {/* ── Regulatory note ───────────────────────────────────────────────── */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          <div className="text-xs leading-relaxed text-slate-600">
            <p className="font-semibold text-slate-800">
              Children&apos;s Homes (England) Regulations 2015 — Quality Standard 9
            </p>
            <p className="mt-1">
              The registered person must ensure that staff help children to develop and
              maintain positive relationships with the people who matter to them, where it
              is consistent with the child&apos;s wishes, feelings, and welfare. Quality of
              relationship is reviewed at least quarterly and informs care planning,
              contact decisions, and therapeutic intervention. Records here support
              evidence to Ofsted, IRO, and placing local authority reviews.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// ── Local components ─────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon:  React.ReactNode;
  label: string;
  value: string;
  tone:  "sky" | "emerald" | "amber" | "violet";
}) {
  const tones: Record<string, string> = {
    sky:     "bg-sky-50 text-sky-700 border-sky-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber:   "bg-amber-50 text-amber-700 border-amber-100",
    violet:  "bg-violet-50 text-violet-700 border-violet-100",
  };
  return (
    <div className={cn("rounded-xl border bg-white p-3", "border-slate-200")}>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-lg border",
            tones[tone],
          )}
        >
          {icon}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {label}
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
  span2,
}: {
  title:    string;
  icon:     React.ReactNode;
  children: React.ReactNode;
  span2?:   boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 bg-white p-3",
        span2 && "md:col-span-2",
      )}
    >
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}
