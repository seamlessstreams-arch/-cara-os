"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Flame,
  AlertTriangle,
  CheckCircle,
  Heart,
  MapPin,
  Phone,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EvacuationPlan, EvacuationScenarioType } from "@/types/extended";
import { EVACUATION_SCENARIO_TYPE_LABEL } from "@/types/extended";
import { useEvacuationPlans } from "@/hooks/use-evacuation-plans";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

const exportCols: ExportColumn<EvacuationPlan>[] = [
  { header: "Scenario", accessor: (r: EvacuationPlan) => r.scenario_name },
  { header: "Type", accessor: (r: EvacuationPlan) => EVACUATION_SCENARIO_TYPE_LABEL[r.scenario_type] },
  { header: "Primary Route", accessor: (r: EvacuationPlan) => r.primary_evacuation_route },
  { header: "Assembly Point", accessor: (r: EvacuationPlan) => r.assembly_point },
  { header: "Last Drill", accessor: (r: EvacuationPlan) => r.last_drill_date },
  { header: "Next Drill", accessor: (r: EvacuationPlan) => r.next_drill_due },
  { header: "Fire Officer Approved", accessor: (r: EvacuationPlan) => r.approved_by_fire_officer ? "Yes" : "N/A" },
];

export default function EmergencyEvacuationPlanPage() {
  const { data: queryData, isLoading } = useEvacuationPlans();
  const data = queryData?.data ?? [];

  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("type");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterType !== "all") items = items.filter((p) => p.scenario_type === filterType);
    items.sort((a, b) => {
      switch (sortBy) {
        case "type":
          return a.scenario_type.localeCompare(b.scenario_type);
        case "drill":
          return a.next_drill_due.localeCompare(b.next_drill_due);
        default:
          return 0;
      }
    });
    return items;
  }, [data, filterType, sortBy]);

  if (isLoading) {
    return (
      <PageShell
        title="Emergency Evacuation Plan"
        subtitle="Building emergency response plans — fire, gas leak, lockdown — with child-specific considerations"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageShell>
    );
  }

  const now = new Date().toISOString().slice(0, 10);
  const future60 = new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10);

  const total = data.length;
  const dueDrills = data.filter((p) => p.next_drill_due <= future60).length;
  const allApproved = data.filter((p) => p.approved_by_fire_officer).length;

  return (
    <PageShell
      title="Emergency Evacuation Plan"
      subtitle="Building emergency response plans — fire, gas leak, lockdown — with child-specific considerations"
      caraContext={{ pageTitle: "Emergency Evacuation Plan", sourceType: "home_check" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="emergency-evacuation-plan" />
          <PrintButton title="Emergency Evacuation Plan" />
          <CaraStudioQuickActionButton context={{ record_type: "policy", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Active Plans</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", dueDrills > 0 ? "text-amber-600" : "text-green-600")}>{dueDrills}</p>
          <p className="text-xs text-muted-foreground">Drills Due 60d</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{allApproved}</p>
          <p className="text-xs text-muted-foreground">Fire Officer Approved</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">100%</p>
          <p className="text-xs text-muted-foreground">Child-Briefed</p>
        </div>
      </div>

      <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-6 flex items-start gap-2">
        <Flame className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
        <p className="text-sm text-red-800">
          Plans printed and posted in office, kitchen, and hallway. All staff briefed on first day. All children
          briefed in age- and need-appropriate ways. Drills run quarterly minimum. Child-specific considerations
          (sensory, trauma, ADHD) integral to every scenario.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scenario Types</SelectItem>
            <SelectItem value="fire">Fire</SelectItem>
            <SelectItem value="gas_leak">Gas Leak</SelectItem>
            <SelectItem value="water_leak_flood">Water/Flood</SelectItem>
            <SelectItem value="power_failure">Power Failure</SelectItem>
            <SelectItem value="intruder_lockdown">Intruder/Lockdown</SelectItem>
            <SelectItem value="bomb_threat">Bomb Threat</SelectItem>
            <SelectItem value="carbon_monoxide">Carbon Monoxide</SelectItem>
            <SelectItem value="structural_collapse">Structural</SelectItem>
            <SelectItem value="severe_weather">Severe Weather</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="type">By Type</SelectItem>
              <SelectItem value="drill">Earliest Drill</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((p) => {
          const isExpanded = expandedId === p.id;

          return (
            <div key={p.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : p.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Flame className="h-5 w-5 text-red-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.scenario_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Last drill {p.last_drill_date} &middot; Next due {p.next_drill_due} &middot; Assembly: {p.assembly_point.slice(0, 50)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {p.approved_by_fire_officer && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">FO Approved</span>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />Trigger Criteria
                    </p>
                    <ul className="space-y-1">
                      {p.trigger_criteria.map((t, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <span className="text-red-600 mt-0.5">•</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                        <MapPin className="h-3 w-3 inline mr-1" />Primary Route
                      </p>
                      <p className="text-sm">{p.primary_evacuation_route}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Secondary Route</p>
                      <p className="text-sm">{p.secondary_evacuation_route}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">Assembly Point</p>
                      <p className="text-sm">{p.assembly_point}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Alternative</p>
                      <p className="text-sm">{p.alternative_assembly_point}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Roles &amp; Tasks</p>
                    <div className="space-y-2">
                      {p.roles_by_staff.map((r, i) => (
                        <div key={i} className="bg-white rounded-lg p-3 border">
                          <p className="text-sm font-medium">{r.role} ({r.staff_position})</p>
                          <ul className="space-y-1 mt-1">
                            {r.tasks.map((t, ti) => (
                              <li key={ti} className="text-xs flex items-start gap-1">
                                <CheckCircle className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />
                                <span>{t}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {p.child_specific_considerations.length > 0 && (
                    <div className="bg-pink-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">
                        <Heart className="h-3 w-3 inline mr-1" />Child-Specific Considerations
                      </p>
                      <div className="space-y-1">
                        {p.child_specific_considerations.map((c, i) => (
                          <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                            <p className="font-medium">{getYPName(c.young_person)}</p>
                            <p className="text-xs text-muted-foreground">{c.special_needs}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <Phone className="h-3 w-3 inline mr-1" />Emergency Contacts
                    </p>
                    <div className="space-y-1">
                      {p.emergency_contacts.map((c, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                          <p className="font-medium">{c.contact} — {c.number}</p>
                          <p className="text-xs text-muted-foreground">{c.when}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Documents to Take</p>
                    <ul className="space-y-1">
                      {p.documents_to_take.map((doc, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <CheckCircle className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                          <span>{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Roll Call Procedure</p>
                    <p className="text-sm">{p.roll_call_procedure}</p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Re-entry</p>
                    <p className="text-sm">{p.reentry_process}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Post-Incident Care</p>
                    <ul className="space-y-1">
                      {p.post_incident_care.map((c, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Heart className="h-3 w-3 text-pink-500 mt-1 shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Child Preparation</p>
                    <p className="text-sm">{p.child_preparation}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Drill freq: {p.drill_frequency}</span>
                    <span>Last drill: {p.last_drill_date}</span>
                    <span>Next drill: {p.next_drill_due}</span>
                    <span>Reviewed: {p.reviewed_date} by {getStaffName(p.reviewed_by)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Evacuation plans support Regulatory Reform (Fire Safety) Order
          2005, Children&apos;s Homes Regulations 2015 Reg 23 (premises and accommodation), Quality Standard 25
          (protection of children), and statutory drill requirements. Plans approved by local fire officer
          where required. Linked to Fire Safety Equipment Checks, Fire Drills, Emergency Plans, and Protocol
          Drills.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Health & Safety"
        category="general"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Emergency Evacuation Plan — fire evacuation, assembly point, PEEP for mobility needs, drill records, fire warden, alarm tests, building safety, Ofsted, Annex A evidence"
        recordType="policy"
        className="mt-6"
      />
    </PageShell>
  );
}
