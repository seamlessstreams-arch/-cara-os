// ══════════════════════════════════════════════════════════════════════════════
// CARA — INSPECTION EVIDENCE PACK VIEW
// Full-page evidence pack renderer with expandable sections, traffic light
// indicators, print-friendly layout, section navigation, and overall scoring.
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useState, useRef } from "react";
import { useInspectionEvidencePack } from "@/hooks/use-inspection-evidence-pack";
import type {
  InspectionEvidencePack,
  EvidenceSection,
  EvidenceItem,
} from "@/lib/evidence/types";

// ── Rating Styles ──────────────────────────────────────────────────────────

const RATING_STYLES: Record<string, string> = {
  outstanding:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  good: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  adequate:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  inadequate:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  not_assessed:
    "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400",
};

const RATING_LABELS: Record<string, string> = {
  outstanding: "Outstanding",
  good: "Good",
  adequate: "Adequate",
  inadequate: "Inadequate",
  not_assessed: "Not Assessed",
};

function trafficLightColor(score: number | undefined): string {
  if (score === undefined) return "bg-gray-400";
  if (score >= 85) return "bg-emerald-500";
  if (score >= 65) return "bg-blue-500";
  if (score >= 45) return "bg-amber-500";
  return "bg-red-500";
}

function scoreBarColor(score: number | undefined): string {
  if (score === undefined) return "bg-gray-400";
  if (score >= 85) return "bg-emerald-500";
  if (score >= 65) return "bg-blue-500";
  if (score >= 45) return "bg-amber-500";
  return "bg-red-500";
}

// ── Main Component ─────────────────────────────────────────────────────────

export function InspectionEvidencePackView() {
  const { data, isLoading, error } = useInspectionEvidencePack();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !data?.data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 p-8 text-center">
        <p className="text-sm text-red-700 dark:text-red-400">
          Failed to load evidence pack. Please try again.
        </p>
      </div>
    );
  }

  const pack = data.data;

  function toggleSection(id: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function scrollToSection(id: string) {
    const el = sectionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setExpandedSections((prev) => new Set([...prev, id]));
    }
  }

  function expandAll() {
    setExpandedSections(new Set(pack.sections.map((s) => s.id)));
  }

  function collapseAll() {
    setExpandedSections(new Set());
  }

  return (
    <div className="flex gap-6 print:block">
      {/* Sidebar Navigation */}
      <aside className="hidden lg:block w-64 shrink-0 print:hidden">
        <div className="sticky top-4">
          <SectionNavigation
            sections={pack.sections}
            onNavigate={scrollToSection}
            activeSections={expandedSections}
          />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Header */}
        <PackHeader pack={pack} />

        {/* Overall Score */}
        <OverallScoreCard pack={pack} />

        {/* Strengths & Areas for Improvement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StrengthsCard strengths={pack.strengths} />
          <AreasForImprovementCard areas={pack.areas_for_improvement} />
        </div>

        {/* Outstanding Actions */}
        {pack.outstanding_actions.length > 0 && (
          <OutstandingActionsCard actions={pack.outstanding_actions} />
        )}

        {/* Section Controls */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Evidence Sections ({pack.sections.length})
          </h2>
          <div className="flex gap-2 print:hidden">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-card hover:bg-muted transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-card hover:bg-muted transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Evidence Sections */}
        {pack.sections.map((section, index) => (
          <div
            key={section.id}
            ref={(el) => {
              sectionRefs.current[section.id] = el;
            }}
          >
            <SectionCard
              section={section}
              index={index + 1}
              isExpanded={expandedSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
            />
          </div>
        ))}

        {/* Footer */}
        <PackFooter pack={pack} />
      </div>
    </div>
  );
}

// ── Pack Header ────────────────────────────────────────────────────────────

function PackHeader({ pack }: { pack: InspectionEvidencePack }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 print:border-0 print:p-0">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inspection Evidence Pack</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pack.home_name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Period: {pack.period_from} to {pack.period_to}
          </p>
          <p className="text-xs text-muted-foreground">
            Generated: {pack.generated_at}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Children</p>
            <p className="text-lg font-bold">{pack.children_count}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Staff</p>
            <p className="text-lg font-bold">{pack.staff_count}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Evidence Items</p>
            <p className="text-lg font-bold">{pack.total_evidence_items}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Overall Score Card ─────────────────────────────────────────────────────

function OverallScoreCard({ pack }: { pack: InspectionEvidencePack }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Overall Assessment</h2>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${RATING_STYLES[pack.overall_rating] ?? RATING_STYLES.not_assessed}`}
        >
          {RATING_LABELS[pack.overall_rating] ?? pack.overall_rating}
        </span>
      </div>

      {/* Score display */}
      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(pack.overall_score ?? 0) * 2.64} 264`}
              className={
                pack.overall_score === null
                  ? "text-muted"
                  : pack.overall_score >= 85
                    ? "text-emerald-500"
                    : pack.overall_score >= 65
                      ? "text-blue-500"
                      : pack.overall_score >= 45
                        ? "text-amber-500"
                        : "text-red-500"
              }
              stroke="currentColor"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold">{pack.overall_score ?? "—"}</span>
          </div>
        </div>

        {/* Section score summary */}
        <div className="flex-1 grid grid-cols-3 sm:grid-cols-5 gap-2">
          {pack.sections.slice(0, 10).map((section) => (
            <div key={section.id} className="text-center">
              <div
                className={`w-3 h-3 rounded-full mx-auto mb-1 ${trafficLightColor(section.score)}`}
              />
              <p className="text-[10px] text-muted-foreground leading-tight truncate">
                {section.title.split(" ").slice(0, 2).join(" ")}
              </p>
              <p className="text-xs font-semibold">{section.score === undefined ? "—" : `${section.score}%`}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Section Navigation ─────────────────────────────────────────────────────

function SectionNavigation({
  sections,
  onNavigate,
  activeSections,
}: {
  sections: EvidenceSection[];
  onNavigate: (id: string) => void;
  activeSections: Set<string>;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3">Sections</h3>
      <nav className="space-y-1">
        {sections.map((section, index) => (
          <button
            key={section.id}
            onClick={() => onNavigate(section.id)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-colors hover:bg-muted ${
              activeSections.has(section.id)
                ? "bg-muted font-medium"
                : ""
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${trafficLightColor(section.score)}`}
            />
            <span className="text-muted-foreground w-4">{index + 1}.</span>
            <span className="truncate">{section.title}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ── Strengths Card ─────────────────────────────────────────────────────────

function StrengthsCard({ strengths }: { strengths: string[] }) {
  return (
    <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10 p-4">
      <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-2">
        Strengths
      </h3>
      {strengths.length > 0 ? (
        <ul className="space-y-1.5">
          {strengths.map((s, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-400"
            >
              <span className="mt-0.5 shrink-0">+</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-emerald-600 dark:text-emerald-500">
          No outstanding strengths identified in this period.
        </p>
      )}
    </div>
  );
}

// ── Areas for Improvement Card ─────────────────────────────────────────────

function AreasForImprovementCard({ areas }: { areas: string[] }) {
  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-4">
      <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
        Areas for Improvement
      </h3>
      {areas.length > 0 ? (
        <ul className="space-y-1.5">
          {areas.map((a, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400"
            >
              <span className="mt-0.5 shrink-0">!</span>
              <span>{a}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-amber-600 dark:text-amber-500">
          No specific areas requiring improvement identified.
        </p>
      )}
    </div>
  );
}

// ── Outstanding Actions Card ───────────────────────────────────────────────

function OutstandingActionsCard({ actions }: { actions: EvidenceItem[] }) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? actions : actions.slice(0, 5);

  return (
    <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
          Outstanding Actions ({actions.length})
        </h3>
        {actions.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-red-600 dark:text-red-400 hover:underline print:hidden"
          >
            {showAll ? "Show fewer" : `Show all ${actions.length}`}
          </button>
        )}
      </div>
      <div className="space-y-2">
        {displayed.map((action) => (
          <div
            key={action.id}
            className="flex items-start gap-3 p-2 rounded bg-white/60 dark:bg-gray-900/30"
          >
            <div
              className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                action.risk_level === "critical"
                  ? "bg-red-600"
                  : action.risk_level === "high"
                    ? "bg-red-500"
                    : "bg-amber-500"
              }`}
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-red-800 dark:text-red-300 truncate">
                {action.title}
              </p>
              <p className="text-[10px] text-red-600 dark:text-red-400 mt-0.5">
                {action.summary}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Due: {action.date}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section Card ───────────────────────────────────────────────────────────

function SectionCard({
  section,
  index,
  isExpanded,
  onToggle,
}: {
  section: EvidenceSection;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden print:break-inside-avoid">
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors print:hover:bg-transparent"
      >
        {/* Traffic Light */}
        <div
          className={`w-3.5 h-3.5 rounded-full shrink-0 ${trafficLightColor(section.score)}`}
        />

        {/* Section Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">
              {String(index).padStart(2, "0")}
            </span>
            <h3 className="text-sm font-semibold truncate">{section.title}</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {section.description}
          </p>
        </div>

        {/* Score & Rating */}
        <div className="flex items-center gap-3 shrink-0">
          {section.score !== undefined && (
            <div className="text-right">
              <p className="text-lg font-bold">{section.score}%</p>
            </div>
          )}
          {section.rating && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${RATING_STYLES[section.rating] ?? RATING_STYLES.not_assessed}`}
            >
              {RATING_LABELS[section.rating] ?? section.rating}
            </span>
          )}

          {/* Expand/Collapse Indicator */}
          <svg
            className={`w-4 h-4 text-muted-foreground transition-transform print:hidden ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Score Bar */}
      {section.score !== undefined && (
        <div className="px-4 pb-2">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${scoreBarColor(section.score)}`}
              style={{ width: `${section.score}%` }}
            />
          </div>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border print:border-t-0">
          {/* Summary & Metadata */}
          <div className="p-4 bg-muted/30">
            <p className="text-xs">{section.summary}</p>
            {section.ofsted_reference && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Ofsted Reference: {section.ofsted_reference}
              </p>
            )}
            <div className="flex flex-wrap gap-1 mt-2">
              {section.data_sources.map((ds) => (
                <span
                  key={ds}
                  className="inline-flex px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground"
                >
                  {ds}
                </span>
              ))}
            </div>
          </div>

          {/* Evidence Items */}
          {section.items.length > 0 ? (
            <EvidenceItemsList items={section.items} />
          ) : (
            <div className="p-4 text-center">
              <p className="text-xs text-muted-foreground">
                No evidence items in this section for the selected period.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Evidence Items List ────────────────────────────────────────────────────

function EvidenceItemsList({ items }: { items: EvidenceItem[] }) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? items : items.slice(0, 10);

  return (
    <div>
      <div className="divide-y divide-border">
        {displayed.map((item) => (
          <div
            key={item.id}
            className="px-4 py-2.5 flex items-start gap-3 hover:bg-muted/30"
          >
            {/* Risk/Type Indicator */}
            {item.risk_level && (
              <div
                className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                  item.risk_level === "critical"
                    ? "bg-red-600"
                    : item.risk_level === "high"
                      ? "bg-red-500"
                      : item.risk_level === "medium"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                }`}
              />
            )}
            {!item.risk_level && (
              <div className="w-2 h-2 mt-1.5 rounded-full shrink-0 bg-blue-400" />
            )}

            {/* Item Content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{item.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                {item.summary}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-muted-foreground">
                  {item.date}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {item.type.replace(/_/g, " ")}
                </span>
                {(item.tags ?? []).slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex px-1 py-0 rounded text-[9px] bg-muted text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length > 10 && (
        <div className="p-3 text-center border-t border-border print:hidden">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-primary font-medium hover:underline"
          >
            {showAll
              ? "Show fewer"
              : `Show all ${items.length} items`}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Pack Footer ────────────────────────────────────────────────────────────

function PackFooter({ pack }: { pack: InspectionEvidencePack }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-center print:mt-8">
      <p className="text-xs text-muted-foreground">
        Evidence Pack generated on {pack.generated_at} for {pack.home_name}.
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {pack.total_evidence_items} evidence items across {pack.sections.length}{" "}
        sections. {pack.children_count} children, {pack.staff_count} staff.
      </p>
      <p className="text-[10px] text-muted-foreground mt-1">
        This pack is auto-generated from live data and should be reviewed before
        submission.
      </p>
    </div>
  );
}

// ── Loading Skeleton ───────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6 animate-pulse">
        <div className="h-6 w-64 bg-muted rounded mb-2" />
        <div className="h-4 w-40 bg-muted rounded mb-1" />
        <div className="h-3 w-48 bg-muted rounded" />
      </div>
      <div className="rounded-lg border border-border bg-card p-6 animate-pulse">
        <div className="h-5 w-40 bg-muted rounded mb-4" />
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-muted" />
          <div className="flex-1 grid grid-cols-5 gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="text-center">
                <div className="w-3 h-3 rounded-full bg-muted mx-auto mb-1" />
                <div className="h-2 w-10 bg-muted rounded mx-auto mb-1" />
                <div className="h-3 w-6 bg-muted rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-card p-4 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-muted" />
            <div className="flex-1">
              <div className="h-4 w-48 bg-muted rounded mb-1" />
              <div className="h-3 w-64 bg-muted rounded" />
            </div>
            <div className="h-6 w-12 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
