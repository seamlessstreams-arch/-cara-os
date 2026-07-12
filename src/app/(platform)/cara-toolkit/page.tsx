"use client";

import Link from "next/link";
import type { ToolCategory } from "@/lib/cara-visual-toolkit/types";

// ── Tool catalogue ────────────────────────────────────────────────────────────

type ToolEntry = {
  id: string;
  title: string;
  subtitle: string;
  category: ToolCategory;
  href: string;
  description: string;
  regulatoryRef?: string;
};

const TOOLS: ToolEntry[] = [
  {
    id: "incident-timing",
    title: "Incident Timing Intelligence",
    subtitle: "When do incidents cluster?",
    category: "incident_behaviour",
    href: "/cara-toolkit/incident-timing",
    description:
      "Time-of-day distribution, peak risk windows, severity by period, type breakdown, and deterministic prevention insights derived from your incident records.",
    regulatoryRef: "Reg 36, Reg 40",
  },
  {
    id: "workforce-risk",
    title: "Workforce Burnout & Risk Dashboard",
    subtitle: "Is the team under pressure?",
    category: "workforce_development",
    href: "/cara-toolkit/workforce-risk",
    description:
      "Staffing stability, supervision quality, training compliance, burnout signals, and overall workforce risk level — all from your seeded workforce records.",
    regulatoryRef: "Reg 32, Reg 33, Reg 34",
  },
  {
    id: "lessons-learned",
    title: "Lessons Learned Tracker",
    subtitle: "Did learning lead to change?",
    category: "lessons_learned",
    href: "/cara-toolkit/lessons-learned",
    description:
      "Captures learning from incidents, Reg 44 visits, and supervision. Tracks whether each lesson generated an action, and whether the action was completed.",
    regulatoryRef: "Reg 45, Reg 37",
  },
  {
    id: "post-incident-reflection",
    title: "Post-Incident Reflection Tool",
    subtitle: "What happened and what will change?",
    category: "incident_behaviour",
    href: "/cara-toolkit/post-incident-reflection",
    description:
      "Debrief tracker: shows every incident, whether a reflection was completed, days to debrief, child's perspective, staff wellbeing, and follow-up actions.",
    regulatoryRef: "Reg 34",
  },
  {
    id: "missing-absconding",
    title: "Missing / Absconding Review Tool",
    subtitle: "Pattern, response and prevention",
    category: "missing_safeguarding",
    href: "/cara-toolkit/missing-absconding",
    description:
      "All missing episodes with risk level, duration, return home interview status, police reporting, and live alerts for currently missing children.",
    regulatoryRef: "Philomena protocol, Reg 40",
  },
  {
    id: "contextual-exploitation",
    title: "Contextual Exploitation Mapping",
    subtitle: "Places, people, routes, risks",
    category: "contextual_exploitation",
    href: "/cara-toolkit/contextual-exploitation",
    description:
      "Cross-references risk assessments, high-risk missing episodes, and exploitation-linked incidents to surface children at contextual risk across multiple domains.",
  },
  {
    id: "safety-plan",
    title: "My Safety Plan",
    subtitle: "Risk domains, key work, overdue reviews",
    category: "child_voice_safety",
    href: "/cara-toolkit/my-safety-plan",
    description:
      "Per-child safety overview: active risk domains with levels and trends, overdue risk assessment reviews, key worker assignment, and last key work date.",
    regulatoryRef: "Reg 13, Reg 7",
  },
  {
    id: "behaviour-support-plan",
    title: "Behaviour Support Plan",
    subtitle: "Understanding behaviour as communication",
    category: "behaviour_support",
    href: "/cara-toolkit/behaviour-support",
    description:
      "Home-level trigger and strategy analysis with per-child profiles — frequency, high-intensity count, strategy effectiveness rate, and linked incidents.",
    regulatoryRef: "Reg 7, Reg 20",
  },
  {
    id: "staff-skills-confidence",
    title: "Staff Skills & Confidence Tracker",
    subtitle: "Individual and team confidence",
    category: "workforce_development",
    href: "/cara-toolkit/staff-skills",
    description:
      "Training compliance rate, overdue mandatory training, supervision wellbeing scores, confidence levels, and development areas per staff member.",
    regulatoryRef: "Reg 32, Reg 33, Reg 34",
  },
  {
    id: "quality-evaluation",
    title: "Quality of Care Evaluation",
    subtitle: "Beyond activity — what has changed?",
    category: "quality_assurance",
    href: "/cara-toolkit/quality-evaluation",
    description:
      "Five scored dimensions — relationships, safety, reflective practice, staff development, and regulatory compliance — each with evidence, gaps, and an overall score.",
    regulatoryRef: "Reg 45, SCCIF",
  },
  {
    id: "showing-impact",
    title: "Showing Impact — Evidence Summary",
    subtitle: "Baseline → Action → Voice → Change → Evidence",
    category: "showing_impact",
    href: "/cara-toolkit/showing-impact",
    description:
      "Per-child impact dashboard: incident trend, voice recorded, key work count, risk trend, and recent observations — showing what changed, not just what was done.",
  },
  {
    id: "inspection-evidence",
    title: "Inspection Evidence Pack",
    subtitle: "Reg 44 · Reg 45 · Ofsted",
    category: "inspection_evidence",
    href: "/cara-toolkit/inspection-evidence",
    description:
      "Five Ofsted-mapped evidence sections — outcomes, safeguarding, quality, leadership, wishes and feelings — with strengths, gaps, and priority actions before inspection.",
    regulatoryRef: "Reg 44, Reg 45, Ofsted SCCIF",
  },
];

const CATEGORY_META: Record<
  ToolCategory,
  { label: string; colour: string; dot: string }
> = {
  incident_behaviour:    { label: "Incident & Behaviour",      colour: "bg-red-50 border-red-200 text-red-700",    dot: "bg-red-400"    },
  missing_safeguarding:  { label: "Missing & Safeguarding",    colour: "bg-orange-50 border-orange-200 text-orange-700", dot: "bg-orange-400" },
  contextual_exploitation:{ label: "Contextual Safeguarding",  colour: "bg-amber-50 border-amber-200 text-amber-700", dot: "bg-amber-400"  },
  child_voice_safety:    { label: "Child Voice & Safety",      colour: "bg-sky-50 border-sky-200 text-sky-700",    dot: "bg-sky-400"    },
  behaviour_support:     { label: "Behaviour Support",         colour: "bg-violet-50 border-violet-200 text-violet-700", dot: "bg-violet-400" },
  staff_reflection:      { label: "Staff Reflection",          colour: "bg-teal-50 border-teal-200 text-teal-700", dot: "bg-teal-400"   },
  workforce_development: { label: "Workforce Development",     colour: "bg-blue-50 border-blue-200 text-blue-700", dot: "bg-blue-400"   },
  safer_recruitment:     { label: "Safer Recruitment",         colour: "bg-indigo-50 border-indigo-200 text-indigo-700", dot: "bg-indigo-400" },
  manager_oversight:     { label: "Manager Oversight",         colour: "bg-slate-50 border-slate-200 text-slate-700", dot: "bg-slate-400" },
  quality_assurance:     { label: "Quality Assurance",         colour: "bg-emerald-50 border-emerald-200 text-emerald-700", dot: "bg-emerald-400" },
  lessons_learned:       { label: "Lessons Learned",           colour: "bg-yellow-50 border-yellow-200 text-yellow-700", dot: "bg-yellow-500" },
  showing_impact:        { label: "Showing Impact",            colour: "bg-green-50 border-green-200 text-green-700", dot: "bg-green-400" },
  inspection_evidence:   { label: "Inspection Evidence",       colour: "bg-pink-50 border-pink-200 text-pink-700", dot: "bg-pink-400"   },
};

function CategoryPill({ category }: { category: ToolCategory }) {
  const meta = CATEGORY_META[category];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.colour}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function ToolCard({ tool }: { tool: ToolEntry }) {
  return (
    <Link href={tool.href}>
      <div className="h-full rounded-2xl border p-5 flex flex-col gap-3 transition-all border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <CategoryPill category={tool.category} />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm leading-snug">
              {tool.title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{tool.subtitle}</p>
          </div>
          <span className="shrink-0 w-2 h-2 rounded-full bg-green-400 mt-1" />
        </div>

        <p className="text-xs text-slate-600 leading-relaxed flex-1">
          {tool.description}
        </p>

        <div className="flex items-center justify-between gap-2">
          {tool.regulatoryRef ? (
            <span className="text-xs text-slate-400">{tool.regulatoryRef}</span>
          ) : (
            <span />
          )}
          <span className="text-xs font-medium text-blue-600">
            Open →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function CaraToolkitPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Cara Visual Practice Toolkit</h1>
          <span className="rounded-full bg-green-100 border border-green-200 px-2.5 py-0.5 text-xs font-semibold text-green-700">
            {TOOLS.length} live
          </span>
        </div>
        <p className="text-sm text-slate-600 max-w-2xl">
          Visual tools, dashboards and evidence builders for residential childcare practice. Each tool turns raw records into meaning, meaning into action, and action into evidence.
        </p>
      </div>

      {/* Impact chain */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-blue-800">
          {["Baseline", "Action", "Voice", "Change", "Evidence", "Impact"].map(
            (step, i, arr) => (
              <span key={step} className="flex items-center gap-2">
                <span className="rounded-full bg-blue-100 border border-blue-200 px-3 py-0.5 text-xs">
                  {step}
                </span>
                {i < arr.length - 1 && (
                  <span className="text-blue-400">→</span>
                )}
              </span>
            )
          )}
        </div>
        <p className="mt-2 text-xs text-blue-700">
          Every tool in this library is designed to help you move from activity to impact — showing not just what the home does, but how care is making a measurable difference to children&apos;s lives.
        </p>
      </div>

      {/* Professional reminder */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <span className="font-semibold">Professional accountability: </span>
        All outputs from Cara tools are decision-support. Staff and managers remain professionally accountable for all decisions, actions, and records. Safeguarding concerns always take priority over any visual presentation.
      </div>

      {/* Tool grid */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-slate-700 uppercase tracking-wide">
          {TOOLS.length} tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>

      {/* Footer note */}
      <p className="text-xs text-slate-400 text-center pb-4">
        Cara Visual Practice Toolkit — purpose-built for residential childcare. British English throughout. Uses original design.
      </p>
    </div>
  );
}
