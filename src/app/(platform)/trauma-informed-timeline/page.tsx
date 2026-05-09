"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Heart,
  AlertTriangle,
  Home,
  Users,
  GraduationCap,
  Shield,
  Star,
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

// ── types ───────────────────────────────────────────────────────────────────
interface TimelineEvent {
  id: string;
  youngPerson: string;
  date: string;
  ageAtEvent: number;
  category: "Loss" | "Trauma" | "Placement" | "Positive" | "Health" | "Education" | "Family" | "Legal";
  title: string;
  description: string;
  impact: "High" | "Medium" | "Low";
  therapeuticRelevance: string;
  linkedInterventions: string[];
  source: string;
  addedBy: string;
  addedDate: string;
}

// ── seed data ───────────────────────────────────────────────────────────────
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: TimelineEvent[] = [
  {
    id: "tte-001",
    youngPerson: "yp_alex",
    date: "2018-03-15",
    ageAtEvent: 7,
    category: "Loss",
    title: "Parental separation",
    description: "Parents separated following domestic violence. Alex witnessed multiple incidents prior to separation. Mother obtained non-molestation order.",
    impact: "High",
    therapeuticRelevance: "Core attachment disruption. Triggers around raised voices and conflict between adults. Key therapeutic focus for EMDR sessions.",
    linkedInterventions: ["EMDR therapy", "Key working - trust building"],
    source: "Social worker referral documents",
    addedBy: "staff_darren",
    addedDate: d(-120),
  },
  {
    id: "tte-002",
    youngPerson: "yp_alex",
    date: "2019-06-20",
    ageAtEvent: 8,
    category: "Placement",
    title: "First foster placement",
    description: "Placed with foster carers Mr & Mrs Hughes following Section 20 agreement. Initially settled but placement disrupted after 4 months due to allegations.",
    impact: "High",
    therapeuticRelevance: "Reinforced belief that adults cannot be trusted. Placement disruption pattern began here. Hypervigilance around new adults.",
    linkedInterventions: ["Life story work", "Therapeutic parenting approach"],
    source: "Placement history records",
    addedBy: "staff_darren",
    addedDate: d(-120),
  },
  {
    id: "tte-003",
    youngPerson: "yp_alex",
    date: "2020-09-01",
    ageAtEvent: 9,
    category: "Education",
    title: "Permanent exclusion from primary school",
    description: "Excluded following escalating behaviour incidents. Three fixed-term exclusions preceded permanent. Linked to undiagnosed ADHD and trauma responses.",
    impact: "Medium",
    therapeuticRelevance: "Education rejection linked to shame narrative. Feels 'not good enough' in academic settings. ADHD diagnosis followed 6 months later.",
    linkedInterventions: ["Educational psychology input", "Sensory regulation strategies"],
    source: "Education records",
    addedBy: "staff_anna",
    addedDate: d(-90),
  },
  {
    id: "tte-004",
    youngPerson: "yp_alex",
    date: "2022-01-10",
    ageAtEvent: 11,
    category: "Positive",
    title: "Arrived at Oak House",
    description: "Placed at Oak House following breakdown of third foster placement. Responded well to consistent boundaries and relational approach within first month.",
    impact: "Medium",
    therapeuticRelevance: "Beginning of stable placement. Key turning point in trusting adults. Relational security framework applied from day one.",
    linkedInterventions: ["PACE approach", "Relational security framework"],
    source: "Admission records",
    addedBy: "staff_darren",
    addedDate: d(-100),
  },
  {
    id: "tte-005",
    youngPerson: "yp_jordan",
    date: "2017-11-05",
    ageAtEvent: 6,
    category: "Trauma",
    title: "Witnessed house fire",
    description: "Family home destroyed in accidental fire. Jordan and siblings rescued by emergency services. Mother hospitalised with burns for 3 weeks.",
    impact: "High",
    therapeuticRelevance: "PTSD symptoms around fire, smoke, loud alarms. Fire drill adaptations required. Nightmares persist around anniversary dates.",
    linkedInterventions: ["CAMHS trauma therapy", "Fire drill reasonable adjustments"],
    source: "CAMHS referral history",
    addedBy: "staff_ryan",
    addedDate: d(-80),
  },
  {
    id: "tte-006",
    youngPerson: "yp_jordan",
    date: "2019-04-12",
    ageAtEvent: 8,
    category: "Family",
    title: "Mother's prison sentence",
    description: "Mother received 18-month custodial sentence for drug supply offences. Jordan placed with maternal grandmother who could not manage behaviour.",
    impact: "High",
    therapeuticRelevance: "Abandonment schema activated. 'Everyone leaves' core belief. Contact with mother complex and triggering. Careful contact plan needed.",
    linkedInterventions: ["Life story work", "Contact support", "Therapeutic letters"],
    source: "Court documents and SW reports",
    addedBy: "staff_ryan",
    addedDate: d(-80),
  },
  {
    id: "tte-007",
    youngPerson: "yp_jordan",
    date: "2023-06-15",
    ageAtEvent: 12,
    category: "Positive",
    title: "Football team captain",
    description: "Selected as captain of local football team. First sustained positive peer activity. Coach reports excellent leadership and commitment.",
    impact: "Low",
    therapeuticRelevance: "Positive identity building outside care system. Sense of belonging and competence. Use as anchor in low moments.",
    linkedInterventions: ["Strengths-based key working", "Positive achievements log"],
    source: "Activity records",
    addedBy: "staff_edward",
    addedDate: d(-60),
  },
  {
    id: "tte-008",
    youngPerson: "yp_casey",
    date: "2016-08-20",
    ageAtEvent: 5,
    category: "Trauma",
    title: "Neglect identified by health visitor",
    description: "Health visitor identified chronic neglect during routine visit. Children underweight, home conditions dangerous. Child protection investigation initiated.",
    impact: "High",
    therapeuticRelevance: "Early neglect affects self-worth and basic needs awareness. Food-related anxieties persist. Hoarding behaviours around belongings linked to scarcity.",
    linkedInterventions: ["DDP therapy", "Nurture-based approach", "Sensory integration"],
    source: "CP conference minutes",
    addedBy: "staff_darren",
    addedDate: d(-110),
  },
  {
    id: "tte-009",
    youngPerson: "yp_casey",
    date: "2020-03-01",
    ageAtEvent: 9,
    category: "Health",
    title: "Autism spectrum diagnosis",
    description: "Formal ASD diagnosis following 18-month assessment. Explained many behaviours previously attributed to trauma alone. Combined ACES and neurodevelopmental profile.",
    impact: "Medium",
    therapeuticRelevance: "Dual pathway understanding — trauma AND neurodevelopment. Sensory needs integral to care. Communication adaptations essential.",
    linkedInterventions: ["Sensory diet implementation", "Visual timetables", "SALT input"],
    source: "Paediatric assessment report",
    addedBy: "staff_anna",
    addedDate: d(-95),
  },
  {
    id: "tte-010",
    youngPerson: "yp_casey",
    date: "2021-07-10",
    ageAtEvent: 10,
    category: "Legal",
    title: "Full care order granted",
    description: "Court granted full care order (Section 31) following failed rehabilitation attempt. Birth parents did not contest final hearing.",
    impact: "Medium",
    therapeuticRelevance: "Permanence established legally but emotional sense of rejection. Identity questions around 'why didn't they fight for me'. Life story work critical.",
    linkedInterventions: ["Life story work", "Identity work", "Letterbox contact"],
    source: "Court order",
    addedBy: "staff_darren",
    addedDate: d(-100),
  },
  {
    id: "tte-011",
    youngPerson: "yp_casey",
    date: "2023-12-01",
    ageAtEvent: 12,
    category: "Positive",
    title: "Won art competition",
    description: "Regional art competition winner — piece about 'finding home'. Selected for exhibition. Casey described it as 'showing how I feel inside'.",
    impact: "Low",
    therapeuticRelevance: "Creative expression as therapeutic outlet. Art identified as primary coping mechanism. Positive identity beyond 'looked after child'.",
    linkedInterventions: ["Art therapy", "Strengths-based planning"],
    source: "Activity records",
    addedBy: "staff_chervelle",
    addedDate: d(-30),
  },
];

// ── category config ─────────────────────────────────────────────────────────
const categoryConfig: Record<TimelineEvent["category"], { icon: typeof Heart; colour: string }> = {
  Loss: { icon: Heart, colour: "text-purple-600 bg-purple-50" },
  Trauma: { icon: AlertTriangle, colour: "text-red-600 bg-red-50" },
  Placement: { icon: Home, colour: "text-blue-600 bg-blue-50" },
  Positive: { icon: Star, colour: "text-green-600 bg-green-50" },
  Health: { icon: Shield, colour: "text-cyan-600 bg-cyan-50" },
  Education: { icon: GraduationCap, colour: "text-amber-600 bg-amber-50" },
  Family: { icon: Users, colour: "text-pink-600 bg-pink-50" },
  Legal: { icon: Shield, colour: "text-slate-600 bg-slate-50" },
};

const impactColour: Record<string, string> = {
  High: "bg-red-100 text-red-800",
  Medium: "bg-amber-100 text-amber-800",
  Low: "bg-green-100 text-green-800",
};

// ── export columns ──────────────────────────────────────────────────────────
const exportCols: ExportColumn<TimelineEvent>[] = [
  { header: "Young Person", accessor: (r: TimelineEvent) => getYPName(r.youngPerson) },
  { header: "Date", accessor: (r: TimelineEvent) => r.date },
  { header: "Age", accessor: (r: TimelineEvent) => String(r.ageAtEvent) },
  { header: "Category", accessor: (r: TimelineEvent) => r.category },
  { header: "Title", accessor: (r: TimelineEvent) => r.title },
  { header: "Impact", accessor: (r: TimelineEvent) => r.impact },
  { header: "Therapeutic Relevance", accessor: (r: TimelineEvent) => r.therapeuticRelevance },
  { header: "Linked Interventions", accessor: (r: TimelineEvent) => r.linkedInterventions.join("; ") },
];

// ── component ───────────────────────────────────────────────────────────────
export default function TraumaInformedTimelinePage() {
  const [filterYP, setFilterYP] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date-asc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((e) => e.youngPerson === filterYP);
    if (filterCategory !== "all") items = items.filter((e) => e.category === filterCategory);

    items.sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return a.date.localeCompare(b.date);
        case "date-desc":
          return b.date.localeCompare(a.date);
        case "impact":
          const impOrd = { High: 0, Medium: 1, Low: 2 };
          return impOrd[a.impact] - impOrd[b.impact];
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, filterCategory, sortBy]);

  // ── stats ─────────────────────────────────────────────────────────────────
  const highImpact = data.filter((e) => e.impact === "High").length;
  const positiveEvents = data.filter((e) => e.category === "Positive").length;
  const uniqueYP = new Set(data.map((e) => e.youngPerson)).size;

  return (
    <PageShell
      title="Trauma-Informed Timeline"
      subtitle="Life event chronology for therapeutic understanding — supporting TIAR and trauma-informed care"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="trauma-informed-timeline" />
          <PrintButton title="Trauma-Informed Timeline" />
        </div>
      }
    >
      {/* ── summary stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{data.length}</p>
          <p className="text-xs text-muted-foreground">Total Events</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{highImpact}</p>
          <p className="text-xs text-muted-foreground">High Impact</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{positiveEvents}</p>
          <p className="text-xs text-muted-foreground">Positive Events</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{uniqueYP}</p>
          <p className="text-xs text-muted-foreground">Children Mapped</p>
        </div>
      </div>

      {/* ── info banner ────────────────────────────────────────────────── */}
      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 mb-6 flex items-start gap-2">
        <Heart className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
        <p className="text-sm text-purple-800">
          This timeline informs trauma-informed practice. Events are used therapeutically — never punitively.
          Share only with professionals on a need-to-know basis per data protection requirements.
        </p>
      </div>

      {/* ── filters/sort ───────────────────────────────────────────────── */}
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
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Loss">Loss</SelectItem>
            <SelectItem value="Trauma">Trauma</SelectItem>
            <SelectItem value="Placement">Placement</SelectItem>
            <SelectItem value="Positive">Positive</SelectItem>
            <SelectItem value="Health">Health</SelectItem>
            <SelectItem value="Education">Education</SelectItem>
            <SelectItem value="Family">Family</SelectItem>
            <SelectItem value="Legal">Legal</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="date-desc">Most Recent</SelectItem>
              <SelectItem value="impact">Impact (High→Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── timeline cards ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No timeline events match your filters.</div>
        )}
        {filtered.map((evt) => {
          const isExpanded = expandedId === evt.id;
          const cfg = categoryConfig[evt.category];
          const CatIcon = cfg.icon;

          return (
            <div key={evt.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : evt.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn("p-2 rounded-lg shrink-0", cfg.colour)}>
                    <CatIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{evt.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {evt.date} &middot; Age {evt.ageAtEvent} &middot; {getYPName(evt.youngPerson)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", impactColour[evt.impact])}>
                    {evt.impact}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Description</p>
                    <p className="text-sm">{evt.description}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Therapeutic Relevance</p>
                    <p className="text-sm text-purple-800 bg-purple-50 rounded-lg p-3">{evt.therapeuticRelevance}</p>
                  </div>
                  {evt.linkedInterventions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Linked Interventions</p>
                      <div className="flex flex-wrap gap-2">
                        {evt.linkedInterventions.map((int, i) => (
                          <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{int}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Clock className="h-3 w-3 inline mr-1" />Added: {evt.addedDate}</span>
                    <span>Source: {evt.source}</span>
                    <span>Category: {evt.category}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Trauma-informed timelines support Quality Standard 2 (quality of care),
          the TIAR (Trauma-Informed Assessment & Response) model, and NICE guidelines on attachment and trauma.
          Information is handled in accordance with GDPR Article 9 (special category data) and shared only on a
          need-to-know basis per the child&apos;s care plan.
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
