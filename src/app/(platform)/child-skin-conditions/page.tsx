"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD SKIN CONDITIONS
// Per-child skin condition management — eczema, acne, psoriasis, vitiligo,
// scarring and related conditions. Captures treatment plan, emollients and
// topicals, dermatology referral pathway, school PE / swimming considerations,
// body confidence support and sun safety. Aligned with NICE NG198 (atopic
// eczema), British Association of Dermatologists (BAD) acne guidance, MHRA
// isotretinoin pregnancy prevention programme, Children's Homes (England)
// Regulations 2015 Quality Standard 8 (Care Planning) and UNCRC Article 24.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn, formatDate } from "@/lib/utils";
import {
  Sparkles,
  Heart,
  Sun,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Pill,
} from "lucide-react";
import type {
  SkinConditionPlan,
  SkinConditionType,
  SkinSeverity,
  SteroidPotency,
} from "@/types/extended";
import {
  SKIN_CONDITION_TYPE_LABEL,
  SKIN_SEVERITY_LABEL,
  STEROID_POTENCY_LABEL,
  DERM_REFERRAL_STATUS_LABEL,
} from "@/types/extended";
import { useSkinConditionPlans } from "@/hooks/use-skin-condition-plans";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

// ── Colour Maps ──────────────────────────────────────────────────────────────

const SEVERITY_COLOURS: Record<SkinSeverity, string> = {
  settled: "bg-emerald-100 text-emerald-800 border-emerald-200",
  mild: "bg-sky-100 text-sky-800 border-sky-200",
  moderate: "bg-amber-100 text-amber-800 border-amber-200",
  severe: "bg-orange-100 text-orange-800 border-orange-200",
  flaring: "bg-rose-100 text-rose-800 border-rose-200",
};

const SEVERITY_RING: Record<SkinSeverity, string> = {
  settled: "border-l-4 border-l-emerald-400",
  mild: "border-l-4 border-l-sky-400",
  moderate: "border-l-4 border-l-amber-400",
  severe: "border-l-4 border-l-orange-500",
  flaring: "border-l-4 border-l-rose-500",
};

const POTENCY_COLOUR: Record<SteroidPotency, string> = {
  mild: "bg-emerald-50 text-emerald-700",
  moderate: "bg-sky-50 text-sky-700",
  potent: "bg-amber-50 text-amber-700",
  very_potent: "bg-rose-50 text-rose-700",
};

// ── Page Component ────────────────────────────────────────────────────────────

export default function ChildSkinConditionsPage() {
  const [search, setSearch] = useState("");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [sortBy, setSortBy] = useState("severity");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: res, isLoading } = useSkinConditionPlans();
  const items = res?.data ?? [];

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading)
    return (
      <PageShell
        title="Skin Condition Plans"
        subtitle="Per-child dermatology care — emollients, topicals, dermatology referrals, school provision, body confidence and sun safety"
      >
        <div />
      </PageShell>
    );

  // ── Stats ───────────────────────────────────────────────────────────────────

  const today = new Date().toISOString().slice(0, 10);
  const in90 = (() => {
    const dt = new Date();
    dt.setDate(dt.getDate() + 90);
    return dt.toISOString().slice(0, 10);
  })();

  const stats = (() => {
    const activePlans = items.length;
    const dermActive = items.filter(
      (r) => r.dermatology_referral?.status === "active"
    ).length;
    const severeFlaring = items.filter(
      (r) => r.severity_now === "severe" || r.severity_now === "flaring"
    ).length;
    const reviewsDue = items.filter((r) => r.review_date <= in90).length;
    return { activePlans, dermActive, severeFlaring, reviewsDue };
  })();

  // ── Filtering & Sorting ─────────────────────────────────────────────────────

  const filtered = (() => {
    let list = [...items];

    if (conditionFilter !== "all") {
      list = list.filter((r) => r.condition === conditionFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          getYPName(r.child_id).toLowerCase().includes(q) ||
          (SKIN_CONDITION_TYPE_LABEL[r.condition] ?? "").toLowerCase().includes(q) ||
          r.body_areas_affected.some((a) => a.toLowerCase().includes(q)) ||
          (r.emollient_name?.toLowerCase().includes(q) ?? false) ||
          (r.topical_steroid?.name.toLowerCase().includes(q) ?? false)
      );
    }

    const order: SkinSeverity[] = ["settled", "mild", "moderate", "severe", "flaring"];
    list.sort((a, b) => {
      switch (sortBy) {
        case "severity":
          return order.indexOf(b.severity_now) - order.indexOf(a.severity_now);
        case "review_due":
          return a.review_date.localeCompare(b.review_date);
        case "young_person":
          return getYPName(a.child_id).localeCompare(
            getYPName(b.child_id)
          );
        case "condition":
          return a.condition.localeCompare(b.condition);
        default:
          return 0;
      }
    });

    return list;
  })();

  // ── Export columns ──────────────────────────────────────────────────────────

  const exportColumns: ExportColumn<SkinConditionPlan>[] = [
    {
      header: "Young Person",
      accessor: (r: SkinConditionPlan) => getYPName(r.child_id),
    },
    { header: "Plan Date", accessor: (r: SkinConditionPlan) => r.plan_date },
    { header: "Condition", accessor: (r: SkinConditionPlan) => SKIN_CONDITION_TYPE_LABEL[r.condition] },
    {
      header: "Body Areas Affected",
      accessor: (r: SkinConditionPlan) => r.body_areas_affected.join("; "),
    },
    { header: "Severity Now", accessor: (r: SkinConditionPlan) => SKIN_SEVERITY_LABEL[r.severity_now] },
    {
      header: "Triggers",
      accessor: (r: SkinConditionPlan) => r.triggers.join("; "),
    },
    {
      header: "Daily Routine",
      accessor: (r: SkinConditionPlan) => r.daily_routine,
    },
    {
      header: "Emollient",
      accessor: (r: SkinConditionPlan) =>
        r.emollient_name
          ? `${r.emollient_name} — ${r.emollient_frequency ?? ""}`
          : "",
    },
    {
      header: "Topical Steroid",
      accessor: (r: SkinConditionPlan) =>
        r.topical_steroid
          ? `${r.topical_steroid.name} (${STEROID_POTENCY_LABEL[r.topical_steroid.potency]}) — ${r.topical_steroid.frequency} — ${r.topical_steroid.body_area}`
          : "",
    },
    {
      header: "Systemic Treatment",
      accessor: (r: SkinConditionPlan) => r.systemic_treatment ?? "",
    },
    {
      header: "Dermatology Referral",
      accessor: (r: SkinConditionPlan) =>
        r.dermatology_referral
          ? `${r.dermatology_referral.service} — ${DERM_REFERRAL_STATUS_LABEL[r.dermatology_referral.status]} — ${r.dermatology_referral.consultant ?? ""}`
          : "None",
    },
    {
      header: "School Considerations",
      accessor: (r: SkinConditionPlan) => r.school_considerations,
    },
    {
      header: "Swimming Safe",
      accessor: (r: SkinConditionPlan) => (r.swimming_safe ? "Yes" : "No"),
    },
    {
      header: "Body Confidence Work",
      accessor: (r: SkinConditionPlan) => r.body_confidence_work,
    },
    {
      header: "Sun Safety Plan",
      accessor: (r: SkinConditionPlan) => r.sun_safety_plan,
    },
    {
      header: "Products Avoided",
      accessor: (r: SkinConditionPlan) => r.products_avoided.join("; "),
    },
    { header: "Child Voice", accessor: (r: SkinConditionPlan) => r.child_voice },
    {
      header: "Staff Observation",
      accessor: (r: SkinConditionPlan) => r.staff_observation,
    },
    {
      header: "Flags / Concerns",
      accessor: (r: SkinConditionPlan) => r.flags_concerns.join("; "),
    },
    { header: "Review Date", accessor: (r: SkinConditionPlan) => r.review_date },
    {
      header: "Key Worker",
      accessor: (r: SkinConditionPlan) => getStaffName(r.key_worker),
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <PageShell
      title="Skin Condition Plans"
      subtitle="Per-child dermatology care — emollients, topicals, dermatology referrals, school provision, body confidence and sun safety"
      ariaContext={{ pageTitle: "Skin Condition Plans", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Skin Condition Plans" />
          <ExportButton<SkinConditionPlan>
            data={filtered}
            columns={exportColumns}
            filename="child-skin-conditions"
          />
          <AriaStudioQuickActionButton context={{ record_type: "health", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ── Summary Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Active Plans",
            value: stats.activePlans,
            icon: Sparkles,
            colour: "text-rose-500",
          },
          {
            label: "Dermatology Referrals Active",
            value: stats.dermActive,
            icon: Pill,
            colour: stats.dermActive > 0 ? "text-sky-600" : "text-[var(--cs-text-muted)]",
          },
          {
            label: "Severe / Flaring",
            value: stats.severeFlaring,
            icon: Heart,
            colour:
              stats.severeFlaring > 0 ? "text-rose-600" : "text-[var(--cs-text-muted)]",
          },
          {
            label: "Reviews Due (90d)",
            value: stats.reviewsDue,
            icon: Sun,
            colour: stats.reviewsDue > 0 ? "text-amber-600" : "text-[var(--cs-text-muted)]",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border bg-card p-3 flex items-center gap-3"
          >
            <s.icon className={cn("h-5 w-5", s.colour)} />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters & Sort ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search young person, condition, body area, treatment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm"
          />
        </div>

        <Select value={conditionFilter} onValueChange={setConditionFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Conditions</SelectItem>
            {(Object.entries(SKIN_CONDITION_TYPE_LABEL) as [SkinConditionType, string][]).map(
              ([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="severity">Severity (highest first)</SelectItem>
              <SelectItem value="review_due">Review Due</SelectItem>
              <SelectItem value="young_person">Young Person (A–Z)</SelectItem>
              <SelectItem value="condition">Condition (A–Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Skin Plan Cards ────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No skin plans match your filters.
          </p>
        )}

        {filtered.map((rec) => {
          const expanded = expandedId === rec.id;
          const reviewOverdue = rec.review_date < today;

          return (
            <div
              key={rec.id}
              className={cn(
                "rounded-lg border bg-card overflow-hidden",
                SEVERITY_RING[rec.severity_now]
              )}
            >
              {/* Card Header */}
              <button
                onClick={() => setExpandedId(expanded ? null : rec.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Sparkles className="h-5 w-5 text-rose-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">
                        {getYPName(rec.child_id)}
                      </span>

                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-sky-50 text-sky-700 border border-sky-100">
                        {SKIN_CONDITION_TYPE_LABEL[rec.condition]}
                      </span>

                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
                          SEVERITY_COLOURS[rec.severity_now]
                        )}
                      >
                        {SKIN_SEVERITY_LABEL[rec.severity_now]}
                      </span>

                      {rec.dermatology_referral && (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            rec.dermatology_referral.status === "active"
                              ? "bg-sky-100 text-sky-800"
                              : rec.dermatology_referral.status === "awaiting"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                          )}
                        >
                          Derm: {DERM_REFERRAL_STATUS_LABEL[rec.dermatology_referral.status]}
                        </span>
                      )}

                      {rec.swimming_safe && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700">
                          Swimming OK
                        </span>
                      )}

                      {reviewOverdue && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-rose-100 text-rose-700">
                          Review overdue
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {rec.body_areas_affected.join(" • ")}
                      {rec.emollient_name && ` — ${rec.emollient_name}`}
                    </p>
                  </div>
                </div>
                {expanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
              </button>

              {/* Expanded Content */}
              {expanded && (
                <div className="border-t px-4 py-4 space-y-5">
                  {/* Body areas affected */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">
                      Body Areas Affected
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {rec.body_areas_affected.map((a, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-rose-50 text-rose-800 border border-rose-100"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Triggers */}
                  {rec.triggers.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Triggers</h4>
                      <div className="flex flex-wrap gap-2">
                        {rec.triggers.map((t, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-800 border border-amber-100"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Daily routine */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">
                      Daily Skincare Routine
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {rec.daily_routine}
                    </p>
                  </div>

                  {/* Treatments grid */}
                  <div className="grid md:grid-cols-2 gap-3">
                    {/* Emollient */}
                    {rec.emollient_name && (
                      <div className="rounded-md border bg-sky-50/40 p-3">
                        <h4 className="text-sm font-semibold mb-1 flex items-center gap-1 text-sky-900">
                          <Sparkles className="h-4 w-4" /> Emollient
                        </h4>
                        <p className="text-sm text-sky-900">
                          <strong>{rec.emollient_name}</strong>
                        </p>
                        {rec.emollient_frequency && (
                          <p className="text-xs text-sky-800 mt-1">
                            {rec.emollient_frequency}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Topical steroid */}
                    {rec.topical_steroid && (
                      <div className="rounded-md border bg-rose-50/40 p-3">
                        <h4 className="text-sm font-semibold mb-1 flex items-center gap-1 text-rose-900">
                          <Pill className="h-4 w-4" /> Topical Steroid
                        </h4>
                        <p className="text-sm text-rose-900">
                          <strong>{rec.topical_steroid.name}</strong>
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                              POTENCY_COLOUR[rec.topical_steroid.potency]
                            )}
                          >
                            {STEROID_POTENCY_LABEL[rec.topical_steroid.potency]}
                          </span>
                        </div>
                        <p className="text-xs text-rose-800 mt-1.5">
                          {rec.topical_steroid.frequency}
                        </p>
                        <p className="text-xs text-rose-800">
                          Apply to: {rec.topical_steroid.body_area}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Systemic treatment */}
                  {rec.systemic_treatment && (
                    <div className="rounded-md border-l-4 border-l-amber-400 bg-amber-50/60 p-3">
                      <h4 className="text-sm font-semibold mb-1 text-amber-900">
                        Systemic Treatment
                      </h4>
                      <p className="text-sm text-amber-900">
                        {rec.systemic_treatment}
                      </p>
                    </div>
                  )}

                  {/* Dermatology referral */}
                  {rec.dermatology_referral ? (
                    <div className="rounded-md border bg-muted/40 p-3">
                      <h4 className="text-sm font-semibold mb-1">
                        Dermatology Referral
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        <strong>{rec.dermatology_referral.service}</strong> —{" "}
                        {rec.dermatology_referral.consultant ?? ""} —{" "}
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ml-1",
                            rec.dermatology_referral.status === "active"
                              ? "bg-sky-100 text-sky-800"
                              : rec.dermatology_referral.status === "awaiting"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                          )}
                        >
                          {DERM_REFERRAL_STATUS_LABEL[rec.dermatology_referral.status]}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md border bg-muted/40 p-3">
                      <h4 className="text-sm font-semibold mb-1">
                        Dermatology Referral
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        No active dermatology referral — managed in primary
                        care. Re-refer if condition worsens, fails to settle, or
                        psychosocial impact escalates.
                      </p>
                    </div>
                  )}

                  {/* School considerations */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">
                      School &amp; PE / Swimming Considerations
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {rec.school_considerations}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Swimming:{" "}
                      <strong>
                        {rec.swimming_safe
                          ? "Safe with skincare prep"
                          : "Not currently advised — see plan"}
                      </strong>
                    </p>
                  </div>

                  {/* Body confidence work */}
                  {rec.body_confidence_work && (
                    <div className="rounded-md border-l-4 border-l-rose-300 bg-rose-50/40 p-3">
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-1 text-rose-900">
                        <Heart className="h-4 w-4" /> Body Confidence Support
                      </h4>
                      <p className="text-sm text-rose-900">
                        {rec.body_confidence_work}
                      </p>
                    </div>
                  )}

                  {/* Sun safety */}
                  <div className="rounded-md border bg-amber-50/40 p-3">
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1 text-amber-900">
                      <Sun className="h-4 w-4" /> Sun Safety Plan
                    </h4>
                    <p className="text-sm text-amber-900">
                      {rec.sun_safety_plan}
                    </p>
                  </div>

                  {/* Products avoided */}
                  {rec.products_avoided.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">
                        Products Avoided
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {rec.products_avoided.map((p, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-slate-100 text-[var(--cs-text-secondary)] border"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Flags */}
                  {rec.flags_concerns.length > 0 && (
                    <div className="rounded-md border-2 border-rose-200 bg-rose-50/60 p-3">
                      <h4 className="text-sm font-semibold mb-1 text-rose-900">
                        Flags &amp; Concerns
                      </h4>
                      <ul className="list-disc list-inside text-sm text-rose-900 space-y-1">
                        {rec.flags_concerns.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Child voice */}
                  <div className="rounded-md border-l-4 border-l-sky-400 bg-sky-50/60 p-3">
                    <h4 className="text-sm font-semibold mb-1 text-sky-900">
                      Child&apos;s Voice
                    </h4>
                    <p className="text-sm italic text-sky-900">
                      &ldquo;{rec.child_voice}&rdquo;
                    </p>
                  </div>

                  {/* Staff observation */}
                  <div>
                    <h4 className="text-sm font-semibold mb-1">
                      Staff Observation
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {rec.staff_observation}
                    </p>
                  </div>

                  {/* Smart link panel */}
                  <SmartLinkPanel sourceType="skin-condition-plan" sourceId={rec.id} childId={rec.child_id} compact />

                  {/* Meta row */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>
                      <strong>Plan Date:</strong> {formatDate(rec.plan_date)}
                    </span>
                    <span
                      className={cn(
                        reviewOverdue && "text-rose-700 font-semibold"
                      )}
                    >
                      <strong>Next Review:</strong> {formatDate(rec.review_date)}
                    </span>
                    <span>
                      <strong>Key Worker:</strong>{" "}
                      {getStaffName(rec.key_worker)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Regulatory Note ────────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
        <p className="font-semibold mb-1">Regulatory Context</p>
        <p>
          Per-child skin condition plans align with NICE NG198 (atopic eczema in
          under-12s, with sibling guidance applied for older children),
          guidance from the British Association of Dermatologists (BAD)
          including BAD acne treatment standards, and the MHRA
          isotretinoin pregnancy prevention programme where systemic retinoid
          treatment is being considered. Plans support compliance with Quality
          Standard 8 (Care Planning) under The Children&apos;s Homes (England)
          Regulations 2015 and uphold the child&apos;s right to the highest
          attainable standard of health (UNCRC Article 24). Language is
          dignified and body-positive: skin conditions are framed as medical,
          not as a hygiene or identity failure. Plans are reviewed at every
          flare, on commencement of new treatment, and at minimum every 6
          months.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Health"
        category="health"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Skin Condition Plans — eczema, psoriasis, acne, dermatitis, cream and emollient routine, GP or dermatology referral, AHA, allergy links, care plan, daily care, self-care"
        recordType="health"
        className="mt-6"
      />
    </PageShell>
  );
}
