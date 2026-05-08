"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD ALLERGIES & ANAPHYLAXIS (AAI / EPIPEN) PLAN
// Per-child BSACI-format allergy and anaphylaxis management plan covering known
// allergens, severity grading, antihistamine, AAI/EpiPen brand + dose +
// locations + expiry, staff trained to administer, school provision, hospital
// plan, child voice and review cycle.
// Quality Standard 8 (Care Planning) + QS7 (Health). BSACI 2023, Resus
// Council UK 2021, MHRA AAI advice, Anaphylaxis Campaign / Allergy UK,
// UNCRC Article 24.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
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
import { cn, todayStr } from "@/lib/utils";
import {
  Syringe,
  AlertTriangle,
  ShieldAlert,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Phone,
} from "lucide-react";
import type { AllergyPlan, AllergySeverity } from "@/types/extended";
import { ALLERGY_SEVERITY_LABEL, AAI_BRAND_LABEL } from "@/types/extended";
import { useAllergyPlans } from "@/hooks/use-allergy-plans";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";

// ── Helpers ───────────────────────────────────────────────────────────────────

const SEVERITY_COLOURS: Record<AllergySeverity, string> = {
  mild: "bg-emerald-100 text-emerald-800 border-emerald-200",
  moderate: "bg-amber-100 text-amber-800 border-amber-200",
  severe: "bg-orange-100 text-orange-800 border-orange-200",
  anaphylactic: "bg-red-100 text-red-800 border-red-200",
  life_threatening: "bg-red-100 text-red-800 border-red-200",
};

const SEVERITY_RING: Record<AllergySeverity, string> = {
  mild: "border-l-4 border-l-emerald-400",
  moderate: "border-l-4 border-l-amber-400",
  severe: "border-l-4 border-l-orange-500",
  anaphylactic: "border-l-4 border-l-red-600",
  life_threatening: "border-l-4 border-l-red-600",
};

const expiryStatus = (expiry: string) => {
  const today = todayStr();
  const in60 = (() => {
    const dt = new Date();
    dt.setDate(dt.getDate() + 60);
    return dt.toISOString().slice(0, 10);
  })();
  if (expiry < today) return { label: "Expired", colour: "bg-red-100 text-red-800" };
  if (expiry < in60)
    return { label: "Expiring soon", colour: "bg-amber-100 text-amber-800" };
  return { label: "In date", colour: "bg-emerald-100 text-emerald-800" };
};

const highestSeverity = (plan: AllergyPlan): AllergySeverity | null => {
  if (plan.allergens.length === 0) return null;
  const order: AllergySeverity[] = ["mild", "moderate", "severe", "anaphylactic"];
  return plan.allergens.reduce<AllergySeverity>((acc, a) => {
    return order.indexOf(a.severity) > order.indexOf(acc) ? a.severity : acc;
  }, "mild");
};

// ── Page Component ────────────────────────────────────────────────────────────

export default function ChildAllergiesEpipenPlanPage() {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("severity");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: resp, isLoading } = useAllergyPlans();
  const records = resp?.data ?? [];

  // ── Stats ───────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const today = todayStr();
    const in60 = (() => {
      const dt = new Date();
      dt.setDate(dt.getDate() + 60);
      return dt.toISOString().slice(0, 10);
    })();
    const in30 = (() => {
      const dt = new Date();
      dt.setDate(dt.getDate() + 30);
      return dt.toISOString().slice(0, 10);
    })();

    const anaphylactic = records.filter((p) =>
      p.allergens.some((a) => a.severity === "anaphylactic")
    ).length;

    const allAaiExpiries = records.flatMap((p) => p.aai_expiry_dates);
    const aaisInDate = allAaiExpiries.filter((e) => e.expiry >= in60).length;

    const staffTrainedSet = new Set(records.flatMap((p) => p.staff_trained_names));
    const staffTrained = staffTrainedSet.size;

    const reviewsDue = records.filter((p) => p.review_date <= in30).length;

    return { anaphylactic, aaisInDate, staffTrained, reviewsDue };
  }, [records]);

  // ── Filtering & Sorting ─────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...records];

    if (severityFilter !== "all") {
      list = list.filter((p) =>
        p.allergens.some((a) => a.severity === severityFilter)
      );
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          getYPName(p.child_id).toLowerCase().includes(q) ||
          p.allergens.some((a) => a.allergen.toLowerCase().includes(q)) ||
          (p.antihistamine?.name.toLowerCase().includes(q) ?? false) ||
          (p.aai_brand ? AAI_BRAND_LABEL[p.aai_brand].toLowerCase().includes(q) : false)
      );
    }

    const order: AllergySeverity[] = ["mild", "moderate", "severe", "anaphylactic"];
    list.sort((a, b) => {
      switch (sortBy) {
        case "severity": {
          const aMax = highestSeverity(a);
          const bMax = highestSeverity(b);
          return (
            (bMax ? order.indexOf(bMax) : -1) -
            (aMax ? order.indexOf(aMax) : -1)
          );
        }
        case "review_due":
          return a.review_date.localeCompare(b.review_date);
        case "young_person":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        default:
          return 0;
      }
    });

    return list;
  }, [records, search, severityFilter, sortBy]);

  // ── Export columns ──────────────────────────────────────────────────────────

  const exportColumns: ExportColumn<AllergyPlan>[] = [
    {
      header: "Young Person",
      accessor: (r: AllergyPlan) => getYPName(r.child_id),
    },
    { header: "Plan Date", accessor: (r: AllergyPlan) => r.plan_date },
    {
      header: "Allergens",
      accessor: (r: AllergyPlan) =>
        r.allergens
          .map((a) => `${a.allergen} (${ALLERGY_SEVERITY_LABEL[a.severity]})`)
          .join("; "),
    },
    {
      header: "Antihistamine",
      accessor: (r: AllergyPlan) =>
        r.antihistamine
          ? `${r.antihistamine.name} ${r.antihistamine.dose} ${r.antihistamine.route}`
          : "None",
    },
    {
      header: "AAI Prescribed",
      accessor: (r: AllergyPlan) => (r.aai_prescribed ? "Yes" : "No"),
    },
    { header: "AAI Brand", accessor: (r: AllergyPlan) => r.aai_brand ? AAI_BRAND_LABEL[r.aai_brand] : "" },
    { header: "AAI Dose", accessor: (r: AllergyPlan) => r.aai_dose ?? "" },
    {
      header: "AAI Locations",
      accessor: (r: AllergyPlan) => r.aai_locations.join("; "),
    },
    {
      header: "AAI Expiry Dates",
      accessor: (r: AllergyPlan) =>
        r.aai_expiry_dates.map((e) => `${e.location}: ${e.expiry}`).join("; "),
    },
    {
      header: "Staff Trained",
      accessor: (r: AllergyPlan) =>
        r.staff_trained_names.map(getStaffName).join(", "),
    },
    {
      header: "Staff Training Expires",
      accessor: (r: AllergyPlan) => r.staff_training_expires ?? "",
    },
    {
      header: "Emergency Protocol",
      accessor: (r: AllergyPlan) =>
        r.emergency_protocol.map((s, i) => `${i + 1}. ${s}`).join(" | "),
    },
    {
      header: "Hospital Admissions",
      accessor: (r: AllergyPlan) =>
        r.hospital_admissions
          .map((h) => `${h.date} — ${h.reason} → ${h.outcome}`)
          .join(" | "),
    },
    {
      header: "School Has Plan",
      accessor: (r: AllergyPlan) => (r.school_has_plan ? "Yes" : "No"),
    },
    {
      header: "School Has AAI",
      accessor: (r: AllergyPlan) => (r.school_has_aai ? "Yes" : "No"),
    },
    {
      header: "Child Self-Administers",
      accessor: (r: AllergyPlan) => (r.child_can_self_administer ? "Yes" : "No"),
    },
    {
      header: "Wears Medical Alert",
      accessor: (r: AllergyPlan) => (r.child_wears_medical_alert ? "Yes" : "No"),
    },
    {
      header: "Emergency Contacts",
      accessor: (r: AllergyPlan) =>
        r.emergency_contacts
          .map((c) => `${c.name} (${c.role}) ${c.phone}`)
          .join("; "),
    },
    { header: "Child Voice", accessor: (r: AllergyPlan) => r.child_voice },
    {
      header: "Staff Observation",
      accessor: (r: AllergyPlan) => r.staff_observation,
    },
    { header: "Review Date", accessor: (r: AllergyPlan) => r.review_date },
    {
      header: "Key Worker",
      accessor: (r: AllergyPlan) => getStaffName(r.key_worker),
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <PageShell
        title="Allergies & Anaphylaxis Plans"
        subtitle="Per-child BSACI allergy management — AAI/EpiPen protocol, training register and hospital plan"
      >
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Allergies & Anaphylaxis Plans"
      subtitle="Per-child BSACI allergy management — AAI/EpiPen protocol, training register and hospital plan"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Allergies & Anaphylaxis Plans" />
          <ExportButton<AllergyPlan>
            data={filtered}
            columns={exportColumns}
            filename="child-allergies-epipen-plans"
          />
        </div>
      }
    >
      {/* ── Summary Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Anaphylaxis Plans",
            value: stats.anaphylactic,
            icon: ShieldAlert,
            colour: stats.anaphylactic > 0 ? "text-red-600" : "text-slate-500",
          },
          {
            label: "AAIs In-Date",
            value: stats.aaisInDate,
            icon: Syringe,
            colour: "text-emerald-600",
          },
          {
            label: "Staff AAI-Trained",
            value: stats.staffTrained,
            icon: ShieldAlert,
            colour: "text-blue-600",
          },
          {
            label: "Reviews Due (30d)",
            value: stats.reviewsDue,
            icon: AlertTriangle,
            colour: stats.reviewsDue > 0 ? "text-amber-600" : "text-slate-500",
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

      {/* ── Anaphylaxis Banner ─────────────────────────────────────────────── */}
      <div className="mb-6 rounded-lg border-2 border-red-300 bg-red-50 p-4 flex items-start gap-3">
        <ShieldAlert className="h-6 w-6 text-red-600 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="font-bold text-red-900 uppercase tracking-wide text-sm">
            BSACI rule: if in doubt, give the AAI and call 999
          </p>
          <p className="mt-1 text-sm text-red-800">
            Adrenaline auto-injectors are safe. Hesitation kills, AAI does not.
            Administer into the outer mid-thigh, hold for 10 seconds, call 999
            stating &quot;anaphylaxis, AAI given&quot;. Repeat dose after 5
            minutes if no improvement. Always transport to hospital — biphasic
            reactions can occur up to 6 hours after the first.
          </p>
        </div>
      </div>

      {/* ── Filters & Sort ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search young person, allergen, AAI brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm"
          />
        </div>

        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="mild">{ALLERGY_SEVERITY_LABEL.mild}</SelectItem>
            <SelectItem value="moderate">{ALLERGY_SEVERITY_LABEL.moderate}</SelectItem>
            <SelectItem value="severe">{ALLERGY_SEVERITY_LABEL.severe}</SelectItem>
            <SelectItem value="anaphylactic">{ALLERGY_SEVERITY_LABEL.anaphylactic}</SelectItem>
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
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Allergy Plan Cards ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No plans match your filters.
          </p>
        )}

        {filtered.map((plan) => {
          const expanded = expandedId === plan.id;
          const peakSeverity = highestSeverity(plan);
          const reviewOverdue = plan.review_date < todayStr();

          // Worst expiry among AAI locations
          const expiries = plan.aai_expiry_dates.map((e) => e.expiry).sort();
          const worstExpiry = expiries[0];
          const worstExpiryStatus = worstExpiry
            ? expiryStatus(worstExpiry)
            : null;

          return (
            <div
              key={plan.id}
              className={cn(
                "rounded-lg border bg-card overflow-hidden",
                peakSeverity && SEVERITY_RING[peakSeverity]
              )}
            >
              {/* Card Header */}
              <button
                onClick={() => setExpandedId(expanded ? null : plan.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Syringe className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">
                        {getYPName(plan.child_id)}
                      </span>

                      {peakSeverity ? (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
                            SEVERITY_COLOURS[peakSeverity]
                          )}
                        >
                          {ALLERGY_SEVERITY_LABEL[peakSeverity]}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600">
                          No known allergies
                        </span>
                      )}

                      {plan.aai_prescribed && worstExpiryStatus && (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            worstExpiryStatus.colour
                          )}
                        >
                          AAI {worstExpiryStatus.label.toLowerCase()}
                        </span>
                      )}

                      {plan.child_can_self_administer && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700">
                          Self-administer competent
                        </span>
                      )}

                      {plan.child_wears_medical_alert && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700">
                          Medical alert worn
                        </span>
                      )}

                      {reviewOverdue && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Review overdue
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {plan.allergens.length > 0
                        ? plan.allergens.map((a) => a.allergen).join(", ")
                        : "No documented allergens — annual screening only"}
                      {plan.aai_prescribed && plan.aai_brand &&
                        ` — ${AAI_BRAND_LABEL[plan.aai_brand]} ${plan.aai_dose}`}
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
                  {/* Allergen list */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">
                      Known Allergens
                    </h4>
                    {plan.allergens.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No documented allergens. Screening recorded on plan
                        date {plan.plan_date}.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {plan.allergens.map((a, i) => (
                          <li
                            key={i}
                            className={cn(
                              "rounded-md border p-2.5 text-sm",
                              SEVERITY_COLOURS[a.severity]
                            )}
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="font-semibold">
                                {a.allergen}
                              </span>
                              <span className="text-xs font-medium uppercase tracking-wide">
                                {ALLERGY_SEVERITY_LABEL[a.severity]}
                              </span>
                            </div>
                            {a.last_reaction && (
                              <p className="mt-1 text-xs opacity-90">
                                <strong>Last reaction:</strong> {a.last_reaction}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Antihistamine */}
                  {plan.antihistamine && (
                    <div className="rounded-md border bg-muted/40 p-3">
                      <h4 className="text-sm font-semibold mb-1">
                        Antihistamine (first-line for mild reactions)
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        <strong>{plan.antihistamine.name}</strong> —{" "}
                        {plan.antihistamine.dose} —{" "}
                        {plan.antihistamine.route}
                      </p>
                    </div>
                  )}

                  {/* AAI block */}
                  {plan.aai_prescribed ? (
                    <div className="rounded-md border-2 border-red-200 bg-red-50/60 p-3 space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-1 text-red-900">
                        <Syringe className="h-4 w-4" /> Adrenaline Auto-Injector
                        (AAI)
                      </h4>
                      <p className="text-sm text-red-900">
                        <strong>Brand:</strong> {plan.aai_brand ? AAI_BRAND_LABEL[plan.aai_brand] : "—"} —{" "}
                        <strong>Dose:</strong> {plan.aai_dose}
                      </p>

                      <div>
                        <h5 className="text-xs font-semibold uppercase tracking-wide text-red-900 mt-2 mb-1">
                          AAI Locations
                        </h5>
                        <ul className="list-disc list-inside text-sm text-red-900 space-y-0.5">
                          {plan.aai_locations.map((loc, i) => (
                            <li key={i}>{loc}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h5 className="text-xs font-semibold uppercase tracking-wide text-red-900 mt-2 mb-1">
                          AAI Expiry Dates
                        </h5>
                        <ul className="space-y-1">
                          {plan.aai_expiry_dates.map((e, i) => {
                            const s = expiryStatus(e.expiry);
                            return (
                              <li
                                key={i}
                                className="flex items-center justify-between text-sm gap-2"
                              >
                                <span className="text-red-900">
                                  {e.location}
                                </span>
                                <span className="flex items-center gap-2">
                                  <span className="font-mono text-xs text-red-900">
                                    {e.expiry}
                                  </span>
                                  <span
                                    className={cn(
                                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                      s.colour
                                    )}
                                  >
                                    {s.label}
                                  </span>
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border bg-muted/40 p-3">
                      <h4 className="text-sm font-semibold mb-1">
                        Adrenaline Auto-Injector
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        No AAI prescribed for this child. Reactions managed with
                        antihistamine and avoidance. Reassess at any new
                        reaction or change in severity.
                      </p>
                    </div>
                  )}

                  {/* Staff trained */}
                  <div>
                    <h4 className="text-sm font-semibold mb-1">
                      Staff Trained to Administer
                    </h4>
                    {plan.staff_trained_names.length > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {plan.staff_trained_names.map(getStaffName).join(", ")}
                        {plan.staff_training_expires && (
                          <>
                            {" "}— BSACI training valid until{" "}
                            <strong>{plan.staff_training_expires}</strong>
                          </>
                        )}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No AAI training required (no AAI prescribed).
                      </p>
                    )}
                  </div>

                  {/* Emergency Protocol */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">
                      Emergency Protocol — Step by Step
                    </h4>
                    <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1.5 marker:font-semibold marker:text-foreground">
                      {plan.emergency_protocol.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Hospital admissions */}
                  {plan.hospital_admissions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">
                        Hospital Admissions History
                      </h4>
                      <ul className="space-y-1.5">
                        {plan.hospital_admissions.map((h, i) => (
                          <li
                            key={i}
                            className="rounded-md border bg-muted/30 p-2 text-sm"
                          >
                            <p className="font-medium">
                              {h.date} — {h.reason}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {h.outcome}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* School & self-care row */}
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="rounded-md border bg-muted/40 p-3">
                      <h4 className="text-sm font-semibold mb-1">
                        School Provision
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-0.5">
                        <li>
                          School holds plan:{" "}
                          <strong>{plan.school_has_plan ? "Yes" : "No"}</strong>
                        </li>
                        <li>
                          School holds AAI:{" "}
                          <strong>{plan.school_has_aai ? "Yes" : "No"}</strong>
                        </li>
                      </ul>
                    </div>
                    <div className="rounded-md border bg-muted/40 p-3">
                      <h4 className="text-sm font-semibold mb-1">
                        Child&apos;s Self-Care
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-0.5">
                        <li>
                          Self-administer competent:{" "}
                          <strong>
                            {plan.child_can_self_administer ? "Yes" : "No"}
                          </strong>
                        </li>
                        <li>
                          Wears medical alert:{" "}
                          <strong>
                            {plan.child_wears_medical_alert ? "Yes" : "No"}
                          </strong>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Emergency contacts */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <Phone className="h-4 w-4" /> Emergency Contacts
                    </h4>
                    <ul className="space-y-1">
                      {plan.emergency_contacts.map((c, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between text-sm border-b last:border-b-0 py-1"
                        >
                          <span>
                            <strong>{c.name}</strong>{" "}
                            <span className="text-muted-foreground">
                              — {c.role}
                            </span>
                          </span>
                          <span className="font-mono text-xs">{c.phone}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Child voice */}
                  <div className="rounded-md border-l-4 border-l-blue-400 bg-blue-50/60 p-3">
                    <h4 className="text-sm font-semibold mb-1 text-blue-900">
                      Child&apos;s Voice
                    </h4>
                    <p className="text-sm italic text-blue-900">
                      &ldquo;{plan.child_voice}&rdquo;
                    </p>
                  </div>

                  {/* Staff observation */}
                  <div>
                    <h4 className="text-sm font-semibold mb-1">
                      Staff Observation
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {plan.staff_observation}
                    </p>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>
                      <strong>Plan Date:</strong> {plan.plan_date}
                    </span>
                    <span
                      className={cn(
                        reviewOverdue && "text-red-700 font-semibold"
                      )}
                    >
                      <strong>Next Review:</strong> {plan.review_date}
                    </span>
                    <span>
                      <strong>Key Worker:</strong>{" "}
                      {getStaffName(plan.key_worker)}
                    </span>
                  </div>

                  {/* Smart Link Panel */}
                  <SmartLinkPanel sourceType="allergy-plan" sourceId={plan.id} childId={plan.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Regulatory Note ────────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">Regulatory Context</p>
        <p>
          Per-child allergy and anaphylaxis plans use the British Society for
          Allergy &amp; Clinical Immunology (BSACI) Anaphylaxis Plan template,
          aligned with Resuscitation Council UK Guidelines (2021), MHRA Drug
          Safety Update advice on adrenaline auto-injectors, and guidance from
          Allergy UK and the Anaphylaxis Campaign. Plans support compliance
          with Quality Standard 8 (Care Planning) and Quality Standard 7
          (Health and Wellbeing) under The Children&apos;s Homes (England)
          Regulations 2015, and uphold the child&apos;s right to the highest
          attainable standard of health (UNCRC Article 24). Plans must be
          reviewed annually, after every reaction, on placement transition,
          and whenever an AAI is replaced.
        </p>
      </div>
    </PageShell>
  );
}
