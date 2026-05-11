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
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { useFamilyRelationshipRecords } from "@/hooks/use-family-relationship-records";
import type { FamilyRelationshipRecord, FamilyRelationshipQuality, FamilyRelationshipTrajectory } from "@/types/extended";
import {
  FAMILY_RELATIONSHIP_TYPE_LABEL,
  FAMILY_RELATIONSHIP_QUALITY_LABEL,
  FAMILY_RELATIONSHIP_TRAJECTORY_LABEL,
} from "@/types/extended";
import {
  Heart, Users, TrendingUp, TrendingDown, Minus, AlertTriangle,
  CheckCircle2, ChevronDown, ChevronUp, ArrowUpDown, CalendarDays,
  Sparkles, ShieldAlert, MessageCircle, Activity, Compass, Loader2,
} from "lucide-react";

// ── Style helpers ─────────────────────────────────────────────────────────────

const QUALITY_TONE: Record<FamilyRelationshipQuality, string> = {
  strong:             "bg-emerald-50 text-emerald-700 border-emerald-200",
  stable:             "bg-sky-50 text-sky-700 border-sky-200",
  complicated:        "bg-amber-50 text-amber-700 border-amber-200",
  fragile:            "bg-orange-50 text-orange-700 border-orange-200",
  severed_restricted: "bg-rose-50 text-rose-700 border-rose-200",
};

const TRAJECTORY_TONE: Record<FamilyRelationshipTrajectory, string> = {
  improving:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  stable:     "bg-sky-50 text-sky-700 border-sky-200",
  concerning: "bg-amber-50 text-amber-700 border-amber-200",
  declining:  "bg-rose-50 text-rose-700 border-rose-200",
};

function TrajectoryIcon({ t }: { t: FamilyRelationshipTrajectory }) {
  if (t === "improving") return <TrendingUp className="h-3.5 w-3.5" />;
  if (t === "declining") return <TrendingDown className="h-3.5 w-3.5" />;
  if (t === "concerning") return <AlertTriangle className="h-3.5 w-3.5" />;
  return <Minus className="h-3.5 w-3.5" />;
}

// ── Page ──────────────────────────────────────────────────────────────────────

type SortKey = "date" | "quality" | "review" | "child";

export default function FamilyRelationshipQualityTrackerPage() {
  const { data: res, isLoading } = useFamilyRelationshipRecords();
  const records = useMemo(() => res?.data ?? [], [res]);

  const [filterChild, setFilterChild]       = useState<string>("all");
  const [filterQuality, setFilterQuality]   = useState<string>("all");
  const [filterTrajectory, setFilterTraj]   = useState<string>("all");
  const [sortKey, setSortKey]               = useState<SortKey>("review");
  const [expandedId, setExpandedId]         = useState<string | null>(null);

  // ── Stats ───────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = records.length;
    const strongOrImproving = records.filter(
      (r) => r.current_quality === "strong" || r.trajectory === "improving",
    ).length;
    const pct = total === 0 ? 0 : Math.round((strongOrImproving / total) * 100);

    const today = new Date().toISOString().slice(0, 10);
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    const in30Str = in30.toISOString().slice(0, 10);
    const reviewsDue = records.filter(
      (r) => r.next_review >= today && r.next_review <= in30Str,
    ).length;

    const childrenWithWork = new Set(
      records.filter((r) => r.interventions_active.length > 0).map((r) => r.child_id),
    ).size;

    return { total, pct, reviewsDue, childrenWithWork };
  }, [records]);

  // ── Filter + sort ───────────────────────────────────────────────────────────

  const visible = useMemo(() => {
    let rows = records.slice();
    if (filterChild !== "all")     rows = rows.filter((r) => r.child_id === filterChild);
    if (filterQuality !== "all")   rows = rows.filter((r) => r.current_quality === filterQuality);
    if (filterTrajectory !== "all") rows = rows.filter((r) => r.trajectory === filterTrajectory);

    rows.sort((a, b) => {
      switch (sortKey) {
        case "date":    return b.assessment_date.localeCompare(a.assessment_date);
        case "quality": return b.quality_1_to_10 - a.quality_1_to_10;
        case "review":  return a.next_review.localeCompare(b.next_review);
        case "child":   return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
      }
    });
    return rows;
  }, [records, filterChild, filterQuality, filterTrajectory, sortKey]);

  // ── Export columns ──────────────────────────────────────────────────────────

  const exportColumns: ExportColumn<FamilyRelationshipRecord>[] = [
    { header: "ID",                accessor: (r) => r.id },
    { header: "Young person",      accessor: (r) => getYPName(r.child_id) },
    { header: "Assessment date",   accessor: (r) => r.assessment_date },
    { header: "Family member",     accessor: (r) => r.family_member },
    { header: "Relationship type", accessor: (r) => FAMILY_RELATIONSHIP_TYPE_LABEL[r.relationship_type] },
    { header: "Current quality",   accessor: (r) => FAMILY_RELATIONSHIP_QUALITY_LABEL[r.current_quality] },
    { header: "Score (1–10)",      accessor: (r) => r.quality_1_to_10 },
    { header: "Contact frequency", accessor: (r) => r.contact_frequency },
    { header: "Contact quality",   accessor: (r) => r.contact_quality },
    { header: "Trajectory",        accessor: (r) => FAMILY_RELATIONSHIP_TRAJECTORY_LABEL[r.trajectory] },
    { header: "Strengths",         accessor: (r) => r.strengths_observed.join("; ") },
    { header: "Challenges",        accessor: (r) => r.challenges_observed.join("; ") },
    { header: "Recent events",     accessor: (r) => r.recent_events.join("; ") },
    { header: "Interventions",     accessor: (r) => r.interventions_active.join("; ") },
    { header: "Risk factors",      accessor: (r) => r.risk_factors.join("; ") },
    { header: "Protective factors", accessor: (r) => r.protective_factors.join("; ") },
    { header: "Child perspective", accessor: (r) => r.child_perspective },
    { header: "Wishes & feelings", accessor: (r) => r.child_wishes_and_feelings },
    { header: "Next review",       accessor: (r) => r.next_review },
    { header: "Reviewed by",       accessor: (r) => getStaffName(r.reviewed_by) },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <PageShell title="Family Relationship Quality Tracker" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--cs-text-muted)]" />
        </div>
      </PageShell>
    );
  }

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
      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--cs-border)] bg-white p-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--cs-text-muted)]">Child</span>
          <Select value={filterChild} onValueChange={setFilterChild}>
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <SelectValue placeholder="All children" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All children</SelectItem>
              {[...new Set(records.map((r) => r.child_id))].map((id) => (
                <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--cs-text-muted)]">Quality</span>
          <Select value={filterQuality} onValueChange={setFilterQuality}>
            <SelectTrigger className="h-8 w-[170px] text-xs">
              <SelectValue placeholder="All qualities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All qualities</SelectItem>
              {Object.entries(FAMILY_RELATIONSHIP_QUALITY_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--cs-text-muted)]">Trajectory</span>
          <Select value={filterTrajectory} onValueChange={setFilterTraj}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All trajectories</SelectItem>
              {Object.entries(FAMILY_RELATIONSHIP_TRAJECTORY_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-[var(--cs-text-muted)]" />
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
              className="overflow-hidden rounded-xl border border-[var(--cs-border)] bg-white"
            >
              {/* header row */}
              <button
                type="button"
                onClick={() => setExpandedId(open ? null : r.id)}
                className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-[var(--cs-surface)]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                  <Heart className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--cs-navy)]">
                      {r.family_member}
                    </span>
                    <span className="text-xs text-[var(--cs-text-muted)]">·</span>
                    <span className="text-xs font-medium text-[var(--cs-text-secondary)]">
                      {getYPName(r.child_id)}
                    </span>
                    <span className="text-xs text-[var(--cs-text-muted)]">·</span>
                    <span className="text-[11px] uppercase tracking-wide text-[var(--cs-text-muted)]">
                      {FAMILY_RELATIONSHIP_TYPE_LABEL[r.relationship_type]}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        QUALITY_TONE[r.current_quality],
                      )}
                    >
                      {FAMILY_RELATIONSHIP_QUALITY_LABEL[r.current_quality]}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        TRAJECTORY_TONE[r.trajectory],
                      )}
                    >
                      <TrajectoryIcon t={r.trajectory} />
                      {FAMILY_RELATIONSHIP_TRAJECTORY_LABEL[r.trajectory]}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--cs-border)] bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-[var(--cs-text-secondary)]">
                      <Activity className="h-3 w-3" />
                      {r.quality_1_to_10}/10
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--cs-border)] bg-slate-50 px-2 py-0.5 text-[11px] text-[var(--cs-text-secondary)]">
                      <CalendarDays className="h-3 w-3" />
                      Review {r.next_review}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 self-center text-[var(--cs-text-muted)]">
                  {open ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              {/* expanded body */}
              {open && (
                <div className="border-t border-[var(--cs-border-subtle)] bg-slate-50/50 px-4 py-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Section title="Contact pattern" icon={<MessageCircle className="h-3.5 w-3.5" />}>
                      <p className="text-xs text-[var(--cs-text-secondary)]">
                        <span className="font-medium text-[var(--cs-navy)]">Frequency:</span>{" "}
                        {r.contact_frequency}
                      </p>
                      <p className="mt-1 text-xs text-[var(--cs-text-secondary)]">
                        <span className="font-medium text-[var(--cs-navy)]">Quality:</span>{" "}
                        {r.contact_quality}
                      </p>
                    </Section>

                    <Section title="Recent events" icon={<CalendarDays className="h-3.5 w-3.5" />}>
                      <ul className="list-disc pl-4 text-xs text-[var(--cs-text-secondary)]">
                        {r.recent_events.map((e, i) => (
                          <li key={i} className="mt-0.5">{e}</li>
                        ))}
                      </ul>
                    </Section>

                    <Section title="Strengths observed" icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}>
                      <ul className="list-disc pl-4 text-xs text-[var(--cs-text-secondary)]">
                        {r.strengths_observed.map((s, i) => (
                          <li key={i} className="mt-0.5">{s}</li>
                        ))}
                      </ul>
                    </Section>

                    <Section title="Challenges observed" icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}>
                      <ul className="list-disc pl-4 text-xs text-[var(--cs-text-secondary)]">
                        {r.challenges_observed.map((c, i) => (
                          <li key={i} className="mt-0.5">{c}</li>
                        ))}
                      </ul>
                    </Section>

                    <Section title="Active interventions" icon={<Sparkles className="h-3.5 w-3.5 text-[var(--cs-aria-gold)]" />}>
                      {r.interventions_active.length === 0 ? (
                        <p className="text-xs italic text-[var(--cs-text-muted)]">None currently.</p>
                      ) : (
                        <ul className="list-disc pl-4 text-xs text-[var(--cs-text-secondary)]">
                          {r.interventions_active.map((iv, i) => (
                            <li key={i} className="mt-0.5">{iv}</li>
                          ))}
                        </ul>
                      )}
                    </Section>

                    <Section title="Risk & protective factors" icon={<ShieldAlert className="h-3.5 w-3.5 text-rose-600" />}>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-600">
                        Risks
                      </p>
                      <ul className="list-disc pl-4 text-xs text-[var(--cs-text-secondary)]">
                        {r.risk_factors.map((rf, i) => (
                          <li key={i} className="mt-0.5">{rf}</li>
                        ))}
                      </ul>
                      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                        Protective
                      </p>
                      <ul className="list-disc pl-4 text-xs text-[var(--cs-text-secondary)]">
                        {r.protective_factors.map((pf, i) => (
                          <li key={i} className="mt-0.5">{pf}</li>
                        ))}
                      </ul>
                    </Section>

                    <Section
                      title="Child's perspective"
                      icon={<Compass className="h-3.5 w-3.5 text-sky-600" />}
                      span2
                    >
                      <p className="text-xs italic text-[var(--cs-text-secondary)]">
                        &ldquo;{r.child_perspective}&rdquo;
                      </p>
                    </Section>

                    <Section
                      title="Wishes & feelings"
                      icon={<Heart className="h-3.5 w-3.5 text-rose-500" />}
                      span2
                    >
                      <p className="text-xs text-[var(--cs-text-secondary)]">{r.child_wishes_and_feelings}</p>
                    </Section>
                  </div>

                  {/* footer meta */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--cs-border)] pt-3 text-[11px] text-[var(--cs-text-muted)]">
                    <span>
                      Assessed {r.assessment_date} · Reviewed by{" "}
                      <span className="font-medium text-[var(--cs-text-secondary)]">
                        {getStaffName(r.reviewed_by)}
                      </span>
                    </span>
                    <span>
                      Next review:{" "}
                      <span className="font-medium text-[var(--cs-text-secondary)]">{r.next_review}</span>
                    </span>
                  </div>

                  {/* smart link panel */}
                  <div className="mt-4">
                    <SmartLinkPanel sourceType="family-relationship-records" sourceId={r.id} childId={r.child_id} compact />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {visible.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-[var(--cs-text-muted)]">
            No relationships match the current filters.
          </div>
        )}
      </div>

      {/* ── Regulatory note ───────────────────────────────────────────────── */}
      <div className="mt-6 rounded-xl border border-[var(--cs-border)] bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-text-muted)]" />
          <div className="text-xs leading-relaxed text-[var(--cs-text-secondary)]">
            <p className="font-semibold text-[var(--cs-navy)]">
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
    violet:  "bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)] border-[var(--cs-aria-gold-soft)]",
  };
  return (
    <div className={cn("rounded-xl border bg-white p-3", "border-[var(--cs-border)]")}>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-lg border",
            tones[tone],
          )}
        >
          {icon}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--cs-text-muted)]">
          {label}
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold text-[var(--cs-navy)]">{value}</div>
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
        "rounded-lg border border-[var(--cs-border)] bg-white p-3",
        span2 && "md:col-span-2",
      )}
    >
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-text-secondary)]">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}
