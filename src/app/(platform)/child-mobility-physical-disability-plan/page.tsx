"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Accessibility,
  Heart,
  Home,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Activity,
  Car,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  MobilityDisabilityPlan,
  MobilityStatus,
} from "@/types/extended";
import {
  MOBILITY_STATUS_LABEL,
  ENERGY_ENVELOPE_STATUS_LABEL,
} from "@/types/extended";
import { useMobilityDisabilityPlans } from "@/hooks/use-mobility-disability-plans";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── helpers ─────────────────────────────────────────────────────────────────
function statusColour(s: MobilityStatus): string {
  switch (s) {
    case "independently_mobile":
      return "bg-emerald-100 text-emerald-800";
    case "mobile_with_aid":
      return "bg-sky-100 text-sky-800";
    case "wheelchair_part_time":
      return "bg-teal-100 text-teal-800";
    case "wheelchair_full_time":
      return "bg-cyan-100 text-cyan-800";
    case "bed_rest_periods":
      return "bg-purple-100 text-purple-800";
    case "variable_fluctuating":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

// ── export columns ──────────────────────────────────────────────────────────
const exportCols: ExportColumn<MobilityDisabilityPlan>[] = [
  { header: "Young Person", accessor: (r: MobilityDisabilityPlan) => getYPName(r.child_id) || r.child_id },
  { header: "Plan Date", accessor: (r: MobilityDisabilityPlan) => r.plan_date },
  { header: "Primary Condition", accessor: (r: MobilityDisabilityPlan) => r.primary_condition },
  { header: "Diagnosed", accessor: (r: MobilityDisabilityPlan) => r.diagnosis_year ?? "—" },
  { header: "Mobility Status", accessor: (r: MobilityDisabilityPlan) => MOBILITY_STATUS_LABEL[r.mobility_status] },
  { header: "Mobility Aids", accessor: (r: MobilityDisabilityPlan) => r.mobility_aids.join("; ") },
  { header: "Energy Envelope", accessor: (r: MobilityDisabilityPlan) => r.energy_envelope ? ENERGY_ENVELOPE_STATUS_LABEL[r.energy_envelope] : "—" },
  { header: "Home Adaptations", accessor: (r: MobilityDisabilityPlan) => r.home_adaptations.join("; ") },
  { header: "School Accessibility Plan", accessor: (r: MobilityDisabilityPlan) => (r.school_accessibility_plan ? "Yes" : "No") },
  { header: "Badges & Entitlements", accessor: (r: MobilityDisabilityPlan) => r.badges_entitlements.join("; ") },
  { header: "Key Worker", accessor: (r: MobilityDisabilityPlan) => getStaffName(r.key_worker) || r.key_worker },
  { header: "Review Date", accessor: (r: MobilityDisabilityPlan) => r.review_date },
];

// ── component ───────────────────────────────────────────────────────────────
export default function ChildMobilityPhysicalDisabilityPlanPage() {
  const { data: raw, isLoading } = useMobilityDisabilityPlans();
  const items = raw?.data ?? [];

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("review");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...items];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          (getYPName(r.child_id) || r.child_id).toLowerCase().includes(q) ||
          r.primary_condition.toLowerCase().includes(q) ||
          r.mobility_aids.some((a) => a.toLowerCase().includes(q))
      );
    }
    if (filterStatus !== "all") list = list.filter((r) => r.mobility_status === filterStatus);

    list.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (getYPName(a.child_id) || a.child_id).localeCompare(
            getYPName(b.child_id) || b.child_id
          );
        case "review":
          return a.review_date.localeCompare(b.review_date);
        case "status":
          return a.mobility_status.localeCompare(b.mobility_status);
        default:
          return 0;
      }
    });
    return list;
  }, [items, search, filterStatus, sortBy]);

  if (isLoading) {
    return <PageShell title="Mobility & Physical Disability Plans">Loading…</PageShell>;
  }

  // ── stats ─────────────────────────────────────────────────────────────────
  const activePlans = items.length;
  const wheelchairUsers = items.filter(
    (r) => r.mobility_status === "wheelchair_part_time" || r.mobility_status === "wheelchair_full_time"
  ).length;
  const homeAdaptationsMade = items.reduce((sum, r) => sum + r.home_adaptations.length, 0);
  const in90 = new Date();
  in90.setDate(in90.getDate() + 90);
  const cutoff90 = in90.toISOString().slice(0, 10);
  const reviewsDue90 = items.filter((r) => r.review_date <= cutoff90).length;

  return (
    <PageShell
      title="Mobility & Physical Disability Plans"
      subtitle="Per-child plans removing environmental barriers — social model framing, child-led, PT/OT linked"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={items} columns={exportCols} filename="mobility-physical-disability-plans" />
          <PrintButton title="Mobility & Physical Disability Plans" />
        </div>
      }
    >
      {/* ── summary stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-sky-700">{activePlans}</p>
          <p className="text-xs text-muted-foreground">Active Plans</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-teal-700">{wheelchairUsers}</p>
          <p className="text-xs text-muted-foreground">Wheelchair Users</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-cyan-700">{homeAdaptationsMade}</p>
          <p className="text-xs text-muted-foreground">Home Adaptations Made</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{reviewsDue90}</p>
          <p className="text-xs text-muted-foreground">Reviews Due (90d)</p>
        </div>
      </div>

      {/* ── philosophy banner ──────────────────────────────────────────── */}
      <div className="rounded-lg bg-sky-50 border border-sky-200 p-3 mb-6 flex items-start gap-2">
        <Accessibility className="h-4 w-4 text-sky-700 mt-0.5 shrink-0" />
        <p className="text-sm text-sky-900">
          Social model of disability: the home is the thing that needs adapting, not the child. Plans are co-produced with each young person, their PT/OT, and (where relevant) specialist clinics. Pacing decisions are clinical, not behavioural. We do not push through fatigue, and we never make ability assumptions on a child's behalf.
        </p>
      </div>

      {/* ── filters/sort ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, condition, aid…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Mobility Statuses</SelectItem>
            {Object.entries(MOBILITY_STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="review">By Review Date</SelectItem>
              <SelectItem value="name">By Child</SelectItem>
              <SelectItem value="status">By Mobility Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── plan cards ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No mobility plans match your filters.</div>
        )}
        {filtered.map((plan) => {
          const isExpanded = expandedId === plan.id;
          const ypLabel = getYPName(plan.child_id) || (plan.child_id === "yp_incoming_sam" ? "Sam (incoming placement template)" : plan.child_id);

          return (
            <div key={plan.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : plan.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Accessibility className="h-5 w-5 text-sky-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{ypLabel}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {plan.primary_condition}
                      {plan.diagnosis_year ? ` · since ${plan.diagnosis_year}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3 flex-wrap justify-end">
                  <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium", statusColour(plan.mobility_status))}>
                    {MOBILITY_STATUS_LABEL[plan.mobility_status]}
                  </span>
                  {plan.school_accessibility_plan && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-teal-100 text-teal-800">
                      School plan in place
                    </span>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {/* mobility aids */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <Activity className="h-3 w-3 inline mr-1" />Mobility Aids
                    </p>
                    <ul className="bg-white rounded-lg p-3 border text-sm space-y-1 list-disc list-inside">
                      {plan.mobility_aids.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>

                  {/* energy + pain side by side */}
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        <Heart className="h-3 w-3 inline mr-1" />Energy Envelope (Pacing)
                      </p>
                      <div className="bg-white rounded-lg p-3 border text-sm">
                        <p className="font-medium text-sky-800">{plan.energy_envelope ? ENERGY_ENVELOPE_STATUS_LABEL[plan.energy_envelope] : "Not applicable"}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Chronic illness aware. Pacing is a clinical decision — staff support, never override.
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Pain Management
                      </p>
                      <ul className="bg-white rounded-lg p-3 border text-sm space-y-1 list-disc list-inside">
                        {plan.pain_management.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* home accessibility */}
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        <Home className="h-3 w-3 inline mr-1" />Accessible Rooms at Home
                      </p>
                      <ul className="bg-white rounded-lg p-3 border text-sm space-y-1 list-disc list-inside">
                        {plan.accessible_rooms_at_home.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Home Adaptations Completed
                      </p>
                      <ul className="bg-white rounded-lg p-3 border text-sm space-y-1 list-disc list-inside">
                        {plan.home_adaptations.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* school */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      School Accessibility & Exam Access
                    </p>
                    <div className="bg-white rounded-lg p-3 border text-sm">
                      <p className="mb-2">
                        <span className="font-medium">Accessibility plan in place: </span>
                        <span className={plan.school_accessibility_plan ? "text-emerald-700" : "text-amber-700"}>
                          {plan.school_accessibility_plan ? "Yes" : "Not yet — action required"}
                        </span>
                      </p>
                      {plan.exam_access_arrangements.length > 0 && (
                        <>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Exam access arrangements:</p>
                          <ul className="space-y-1 list-disc list-inside">
                            {plan.exam_access_arrangements.map((e, i) => (
                              <li key={i}>{e}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>

                  {/* transport */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <Car className="h-3 w-3 inline mr-1" />Transport Arrangements
                    </p>
                    <ul className="bg-white rounded-lg p-3 border text-sm space-y-1 list-disc list-inside">
                      {plan.transport_arrangements.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  {/* external support */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      External Support (PT / OT / Consultant)
                    </p>
                    <div className="space-y-1.5">
                      {plan.external_support.map((s, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border flex items-start gap-3 text-sm">
                          <span className="font-medium text-sky-800 shrink-0 w-44 truncate">{s.agency}</span>
                          <span className="flex-1">{s.role}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-teal-100 text-teal-800 shrink-0">
                            {s.frequency}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* identity framing — highlighted */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Identity & Framing Notes
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
                      {plan.identity_framing_notes}
                    </div>
                  </div>

                  {/* badges/entitlements */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Badges & Entitlements (DLA / PIP / Blue Badge / Other)
                    </p>
                    <ul className="bg-white rounded-lg p-3 border text-sm space-y-1 list-disc list-inside">
                      {plan.badges_entitlements.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>

                  {/* voices */}
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Child Voice
                      </p>
                      <div className="bg-white rounded-lg p-3 border text-sm italic text-slate-700">
                        &ldquo;{plan.child_voice}&rdquo;
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Staff Observation
                      </p>
                      <div className="bg-white rounded-lg p-3 border text-sm text-slate-700">
                        {plan.staff_observation}
                      </div>
                    </div>
                  </div>

                  {/* flags + meta */}
                  {plan.flags_for_review.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Flags for Review
                      </p>
                      <ul className="bg-white rounded-lg p-3 border text-sm space-y-1 list-disc list-inside">
                        {plan.flags_for_review.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* smart link panel */}
                  <SmartLinkPanel sourceType="mobility-disability-plan" sourceId={plan.id} childId={plan.child_id} compact />

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground border-t pt-3">
                    <span>Plan dated {plan.plan_date} · Key worker {getStaffName(plan.key_worker) || plan.key_worker}</span>
                    <span>Next review {plan.review_date}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory footer ──────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg bg-teal-50 border border-teal-200 p-3 text-xs text-teal-900 space-y-1">
        <p className="font-semibold">Regulatory framework</p>
        <p>
          Equality Act 2010 (disability) · Care Act 2014 (under-18 carers, transition) · SEND Code of Practice 2015 · Social model of disability (Oliver) · Children&rsquo;s Homes (England) Regulations 2015 — Quality Standards 6, 8 and 9 · NICE NG217 (Long Covid) and NG104 (chronic pain) where relevant · Disabled Children&rsquo;s Charter · UNCRC Articles 23, 24 and 31.
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
