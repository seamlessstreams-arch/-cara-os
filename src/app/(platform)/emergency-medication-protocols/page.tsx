"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EMERGENCY MEDICATION PROTOCOLS
// Per-child emergency medication protocols (EpiPen, asthma rescue inhaler,
// rectal diazepam, glucagon, etc.) with step-by-step staff procedures, 999/GP
// trigger thresholds, training register, and review sign-off.
// Required under Quality Standard 7 (Health & Wellbeing) & Regulation 23.
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
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn, todayStr } from "@/lib/utils";
import { useEmergencyMedicationProtocols } from "@/hooks/use-emergency-medication-protocols";
import type { EmergencyMedicationProtocol } from "@/types/extended";
import { EMERGENCY_MED_TRIGGER_LABEL } from "@/types/extended";
import type { EmergencyMedTrigger } from "@/types/extended";
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Heart,
  Loader2,
  MapPin,
  Phone,
  Pill,
  Search,
  ShieldCheck,
  Stethoscope,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── Helpers ──────────────────────────────────────────────────────────────────

const TRIGGER_COLOURS: Record<EmergencyMedTrigger, string> = {
  asthma_attack: "bg-sky-100 text-sky-700",
  anaphylaxis: "bg-red-100 text-red-700",
  seizure: "bg-purple-100 text-purple-700",
  hypoglycaemia: "bg-amber-100 text-amber-700",
  severe_allergic_reaction: "bg-orange-100 text-orange-700",
  mental_health_crisis: "bg-pink-100 text-pink-700",
};

// ── Page Component ────────────────────────────────────────────────────────────

export default function EmergencyMedicationProtocolsPage() {
  const { data: queryData, isLoading } = useEmergencyMedicationProtocols();
  const records = queryData?.data ?? [];

  const [search, setSearch] = useState("");
  const [triggerFilter, setTriggerFilter] = useState("all");
  const [ypFilter, setYpFilter] = useState("all");
  const [sortBy, setSortBy] = useState("review_due");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Stats ───────────────────────────────────────────────────────────────────

  const today = todayStr();

  const stats = useMemo(() => {
    const active = records.length;
    const gpSigned = records.filter((r) => r.signed_off_by_gp).length;
    const avgTrained =
      records.length > 0
        ? Math.round(
            records.reduce((acc, r) => acc + r.staff_trained_to_administer.length, 0) /
              records.length
          )
        : 0;
    const fourteenDaysFromNow = new Date();
    fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);
    const cutoff = fourteenDaysFromNow.toISOString().slice(0, 10);
    const reviewsDue = records.filter(
      (r) => r.next_review_due <= cutoff
    ).length;
    return { active, gpSigned, avgTrained, reviewsDue };
  }, [records]);

  // ── Filtering & Sorting ─────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...records];

    if (triggerFilter !== "all") {
      list = list.filter((r) => r.trigger === triggerFilter);
    }
    if (ypFilter !== "all") {
      list = list.filter((r) => r.child_id === ypFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.condition.toLowerCase().includes(q) ||
          r.emergency_medication.toLowerCase().includes(q) ||
          EMERGENCY_MED_TRIGGER_LABEL[r.trigger].toLowerCase().includes(q) ||
          getYPName(r.child_id).toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case "review_due":
          return a.next_review_due.localeCompare(b.next_review_due);
        case "review_recent":
          return b.last_review_date.localeCompare(a.last_review_date);
        case "young_person":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "trigger":
          return a.trigger.localeCompare(b.trigger);
        default:
          return 0;
      }
    });

    return list;
  }, [records, search, triggerFilter, ypFilter, sortBy]);

  // ── Export columns ──────────────────────────────────────────────────────────

  const exportColumns: ExportColumn<EmergencyMedicationProtocol>[] = [
    {
      header: "Young Person",
      accessor: (r: EmergencyMedicationProtocol) => getYPName(r.child_id),
    },
    { header: "Condition", accessor: (r: EmergencyMedicationProtocol) => r.condition },
    { header: "Trigger", accessor: (r: EmergencyMedicationProtocol) => EMERGENCY_MED_TRIGGER_LABEL[r.trigger] },
    {
      header: "Emergency Medication",
      accessor: (r: EmergencyMedicationProtocol) => r.emergency_medication,
    },
    {
      header: "Spare EpiPen Locations",
      accessor: (r: EmergencyMedicationProtocol) => r.spare_epi_pen_locations.join("; "),
    },
    {
      header: "Recognise Symptoms",
      accessor: (r: EmergencyMedicationProtocol) => r.recognise_symptoms.join("; "),
    },
    {
      header: "Step-by-Step Procedure",
      accessor: (r: EmergencyMedicationProtocol) =>
        r.step_by_step_procedure.map((s, i) => `${i + 1}. ${s}`).join(" | "),
    },
    { header: "When to Call 999", accessor: (r: EmergencyMedicationProtocol) => r.when_to_call_999 },
    { header: "When to Call GP", accessor: (r: EmergencyMedicationProtocol) => r.when_to_call_gp },
    {
      header: "Position of Patient",
      accessor: (r: EmergencyMedicationProtocol) => r.position_of_patient,
    },
    {
      header: "Aftercare",
      accessor: (r: EmergencyMedicationProtocol) => r.aftercare.join("; "),
    },
    {
      header: "Staff Trained",
      accessor: (r: EmergencyMedicationProtocol) =>
        r.staff_trained_to_administer.map(getStaffName).join(", "),
    },
    {
      header: "Child Can Self-Administer",
      accessor: (r: EmergencyMedicationProtocol) => (r.child_can_self_administer ? "Yes" : "No"),
    },
    {
      header: "Child Recognises Symptoms",
      accessor: (r: EmergencyMedicationProtocol) => (r.child_recognises_symptoms ? "Yes" : "No"),
    },
    {
      header: "School & Community Provision",
      accessor: (r: EmergencyMedicationProtocol) => r.school_and_community_provision,
    },
    {
      header: "Medication Locations",
      accessor: (r: EmergencyMedicationProtocol) => r.medication_locations.join("; "),
    },
    {
      header: "Expiry Check Schedule",
      accessor: (r: EmergencyMedicationProtocol) => r.expiry_check_schedule,
    },
    {
      header: "Last Review Date",
      accessor: (r: EmergencyMedicationProtocol) => r.last_review_date,
    },
    {
      header: "Reviewed By",
      accessor: (r: EmergencyMedicationProtocol) => getStaffName(r.reviewed_by),
    },
    {
      header: "Next Review Due",
      accessor: (r: EmergencyMedicationProtocol) => r.next_review_due,
    },
    {
      header: "Signed Off By GP",
      accessor: (r: EmergencyMedicationProtocol) => (r.signed_off_by_gp ? "Yes" : "No"),
    },
    {
      header: "Child Informed",
      accessor: (r: EmergencyMedicationProtocol) => (r.child_informed ? "Yes" : "No"),
    },
  ];

  // ── Loading state ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <PageShell
        title="Emergency Medication Protocols"
        subtitle="Per-child emergency response procedures — QS7 (Health) & Regulation 23"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageShell>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <PageShell
      title="Emergency Medication Protocols"
      subtitle="Per-child emergency response procedures — QS7 (Health) & Regulation 23"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Emergency Medication Protocols" />
          <ExportButton<EmergencyMedicationProtocol>
            data={filtered}
            columns={exportColumns}
            filename="emergency-medication-protocols"
          />
        </div>
      }
    >
      {/* ── Summary Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Active Protocols",
            value: stats.active,
            icon: ShieldCheck,
            colour: "text-blue-600",
          },
          {
            label: "GP Signed-Off",
            value: `${stats.gpSigned}/${stats.active}`,
            icon: CheckCircle2,
            colour: "text-green-600",
          },
          {
            label: "Staff Trained (avg)",
            value: stats.avgTrained,
            icon: Users,
            colour: "text-purple-600",
          },
          {
            label: "Reviews Due (14d)",
            value: stats.reviewsDue,
            icon: Clock,
            colour: stats.reviewsDue > 0 ? "text-red-600" : "text-slate-500",
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

      {/* ── Strong Red Emergency Banner ────────────────────────────────────── */}
      <div className="mb-6 rounded-lg border-2 border-red-300 bg-red-50 p-4 flex items-start gap-3">
        <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="font-bold text-red-900 uppercase tracking-wide text-sm">
            Emergency procedures must be printed and posted
          </p>
          <p className="mt-1 text-sm text-red-800">
            A laminated copy of every active emergency medication protocol must be
            displayed in the staff office <strong>and</strong> kitchen, with each
            child&apos;s photo, condition, medication location, and 999 trigger
            criteria. In an emergency there is no time to navigate a system —{" "}
            <strong>look, recognise, act</strong>. All staff confirm visual
            familiarity with each child&apos;s protocol on shift handover.
          </p>
        </div>
      </div>

      {/* ── Filters & Sort ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search protocols, conditions, medications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm"
          />
        </div>

        <Select value={ypFilter} onValueChange={setYpFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Young Person" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Young People</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={triggerFilter} onValueChange={setTriggerFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Trigger" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Triggers</SelectItem>
            <SelectItem value="asthma_attack">Asthma Attack</SelectItem>
            <SelectItem value="anaphylaxis">Anaphylaxis</SelectItem>
            <SelectItem value="seizure">Seizure</SelectItem>
            <SelectItem value="hypoglycaemia">Hypoglycaemia</SelectItem>
            <SelectItem value="severe_allergic_reaction">
              Severe Allergic Reaction
            </SelectItem>
            <SelectItem value="mental_health_crisis">Mental Health Crisis</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="review_due">Next Review Due</SelectItem>
              <SelectItem value="review_recent">Most Recently Reviewed</SelectItem>
              <SelectItem value="young_person">Young Person (A-Z)</SelectItem>
              <SelectItem value="trigger">Trigger Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Protocol Cards ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No protocols match your filters.
          </p>
        )}

        {filtered.map((protocol) => {
          const expanded = expandedId === protocol.id;
          const triggerColour = TRIGGER_COLOURS[protocol.trigger];
          const reviewOverdue = protocol.next_review_due < today;

          return (
            <div
              key={protocol.id}
              className="rounded-lg border bg-card overflow-hidden"
            >
              {/* Card Header */}
              <button
                onClick={() => setExpandedId(expanded ? null : protocol.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Pill className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">
                        {getYPName(protocol.child_id)}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          triggerColour
                        )}
                      >
                        {EMERGENCY_MED_TRIGGER_LABEL[protocol.trigger]}
                      </span>
                      {protocol.signed_off_by_gp ? (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          GP signed-off
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700">
                          <XCircle className="h-3 w-3 mr-1" />
                          Awaiting GP sign-off
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
                      {protocol.emergency_medication} — {protocol.condition}
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
                  {/* Condition & Medication */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-1 flex items-center gap-1">
                        <Stethoscope className="h-4 w-4" /> Condition
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {protocol.condition}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1 flex items-center gap-1">
                        <Pill className="h-4 w-4" /> Emergency Medication
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {protocol.emergency_medication}
                      </p>
                    </div>
                  </div>

                  {/* Recognise Symptoms */}
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1 text-amber-900">
                      <Zap className="h-4 w-4" /> Recognise the Symptoms
                    </h4>
                    <ul className="list-disc list-inside text-sm text-amber-900 space-y-1">
                      {protocol.recognise_symptoms.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Step-by-step procedure */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">
                      Step-by-Step Procedure
                    </h4>
                    <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1.5 marker:font-semibold marker:text-foreground">
                      {protocol.step_by_step_procedure.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  {/* 999 / GP / Position */}
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="rounded-md border border-red-200 bg-red-50 p-3">
                      <h4 className="text-sm font-semibold mb-1 flex items-center gap-1 text-red-800">
                        <Phone className="h-4 w-4" /> When to Call 999
                      </h4>
                      <p className="text-sm text-red-800">{protocol.when_to_call_999}</p>
                    </div>
                    <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                      <h4 className="text-sm font-semibold mb-1 flex items-center gap-1 text-blue-800">
                        <Stethoscope className="h-4 w-4" /> When to Call GP
                      </h4>
                      <p className="text-sm text-blue-800">{protocol.when_to_call_gp}</p>
                    </div>
                    <div className="rounded-md border bg-muted/40 p-3">
                      <h4 className="text-sm font-semibold mb-1 flex items-center gap-1">
                        <Heart className="h-4 w-4" /> Position of Patient
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {protocol.position_of_patient}
                      </p>
                    </div>
                  </div>

                  {/* Aftercare */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Aftercare</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {protocol.aftercare.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Medication Locations & Spare EpiPens */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-1 flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> Medication Locations
                      </h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {protocol.medication_locations.map((loc, i) => (
                          <li key={i}>{loc}</li>
                        ))}
                      </ul>
                    </div>
                    {protocol.spare_epi_pen_locations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-1 flex items-center gap-1">
                          <MapPin className="h-4 w-4" /> Spare EpiPen Locations
                        </h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          {protocol.spare_epi_pen_locations.map((loc, i) => (
                            <li key={i}>{loc}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Staff trained / Child capability */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-1 flex items-center gap-1">
                        <Users className="h-4 w-4" /> Staff Trained to Administer
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {protocol.staff_trained_to_administer
                          .map(getStaffName)
                          .join(", ")}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1">
                        Child&apos;s Awareness
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>
                          Can self-administer:{" "}
                          <strong>
                            {protocol.child_can_self_administer ? "Yes" : "No"}
                          </strong>
                        </li>
                        <li>
                          Recognises own symptoms:{" "}
                          <strong>
                            {protocol.child_recognises_symptoms ? "Yes" : "No"}
                          </strong>
                        </li>
                        <li>
                          Informed of protocol:{" "}
                          <strong>{protocol.child_informed ? "Yes" : "No"}</strong>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* School / community provision */}
                  <div>
                    <h4 className="text-sm font-semibold mb-1">
                      School &amp; Community Provision
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {protocol.school_and_community_provision}
                    </p>
                  </div>

                  {/* Expiry schedule */}
                  <div>
                    <h4 className="text-sm font-semibold mb-1">
                      Expiry Check Schedule
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {protocol.expiry_check_schedule}
                    </p>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>
                      <strong>Last Review:</strong> {protocol.last_review_date} (by{" "}
                      {getStaffName(protocol.reviewed_by)})
                    </span>
                    <span
                      className={cn(
                        reviewOverdue && "text-red-700 font-semibold"
                      )}
                    >
                      <strong>Next Review Due:</strong> {protocol.next_review_due}
                    </span>
                    <span>
                      <strong>GP Sign-off:</strong>{" "}
                      {protocol.signed_off_by_gp ? "Yes" : "No"}
                    </span>
                  </div>

                  {/* Smart Links */}
                  <SmartLinkPanel sourceType="emergency-medication-protocol" sourceId={protocol.id} childId={protocol.child_id} compact />
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
          Emergency medication protocols are required under Quality Standard 7
          (Health and wellbeing) and Regulation 23 of The Children&apos;s Homes
          (England) Regulations 2015. Each child with a condition requiring
          emergency response must have an individualised, GP-signed protocol
          identifying triggers, recognition criteria, step-by-step staff actions,
          999/GP escalation thresholds, medication storage, staff training and
          school/community provision. Protocols must be reviewed at least every 12
          months, after any incident, and on every placement transition. Care plan,
          health passport and risk assessment must reference the active protocol.
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
