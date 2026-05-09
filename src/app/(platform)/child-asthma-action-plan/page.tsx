"use client";

import { useState, useMemo } from "react";
import type { AsthmaPlan, AsthmaDiagnosis } from "@/types/extended";
import { ASTHMA_DIAGNOSIS_LABEL } from "@/types/extended";
import { useAsthmaPlans } from "@/hooks/use-asthma-plans";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Wind, AlertTriangle, Phone, ChevronUp, ChevronDown, ArrowUpDown, Search, Activity,
} from "lucide-react";
import { cn, todayStr } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── helpers ───────────────────────────────────────────────────────────────── */

function addDays(n: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
}

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function ChildAsthmaActionPlanPage() {
  const { data: resp, isLoading } = useAsthmaPlans();
  const data = resp?.data ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterDiagnosis, setFilterDiagnosis] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        getYPName(r.child_id).toLowerCase().includes(q) ||
        ASTHMA_DIAGNOSIS_LABEL[r.diagnosis].toLowerCase().includes(q) ||
        r.known_triggers.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (filterDiagnosis !== "all") rows = rows.filter((r) => r.diagnosis === filterDiagnosis);
    rows.sort((a, b) =>
      sortBy === "newest"
        ? b.plan_date.localeCompare(a.plan_date)
        : a.plan_date.localeCompare(b.plan_date),
    );
    return rows;
  }, [data, search, filterDiagnosis, sortBy]);

  const total = data.length;
  const recentlyGreen = data.filter((r) => r.peak_flow_best && r.peak_flow_green_zone).length;
  const ytdAdmissions = data.reduce((acc, r) => {
    const yearStart = new Date();
    yearStart.setMonth(0, 1);
    return acc + r.hospital_admissions.filter((a) => new Date(a.date) >= yearStart).length;
  }, 0);
  const today = todayStr();
  const ninetyDays = addDays(90);
  const reviewsDue90 = data.filter((r) => r.review_date >= today && r.review_date <= ninetyDays).length;

  const exportCols: ExportColumn<AsthmaPlan>[] = [
    { header: "Young Person", accessor: (r: AsthmaPlan) => getYPName(r.child_id) },
    { header: "Plan Date", accessor: (r: AsthmaPlan) => r.plan_date },
    { header: "Diagnosis", accessor: (r: AsthmaPlan) => ASTHMA_DIAGNOSIS_LABEL[r.diagnosis] },
    { header: "Known Triggers", accessor: (r: AsthmaPlan) => r.known_triggers.join("; ") },
    { header: "Preventer", accessor: (r: AsthmaPlan) => r.preventer_inhaler ? `${r.preventer_inhaler.name} ${r.preventer_inhaler.dose} ${r.preventer_inhaler.timing}` : "—" },
    { header: "Reliever", accessor: (r: AsthmaPlan) => r.reliever_inhaler ? `${r.reliever_inhaler.name} ${r.reliever_inhaler.dose}` : "—" },
    { header: "Spacer", accessor: (r: AsthmaPlan) => r.spacer_needed ? "Yes" : "No" },
    { header: "Peak Flow Best", accessor: (r: AsthmaPlan) => r.peak_flow_best ? String(r.peak_flow_best) : "—" },
    { header: "Green Zone", accessor: (r: AsthmaPlan) => r.peak_flow_green_zone ?? "—" },
    { header: "Amber Zone", accessor: (r: AsthmaPlan) => r.peak_flow_amber_zone ?? "—" },
    { header: "Red Zone", accessor: (r: AsthmaPlan) => r.peak_flow_red_zone ?? "—" },
    { header: "Hospital Admissions", accessor: (r: AsthmaPlan) => String(r.hospital_admissions.length) },
    { header: "Self-Medicates", accessor: (r: AsthmaPlan) => r.child_can_self_medicate ? "Yes" : "No" },
    { header: "School Has Inhaler", accessor: (r: AsthmaPlan) => r.school_has_inhaler ? "Yes" : "No" },
    { header: "Spare Inhaler Locations", accessor: (r: AsthmaPlan) => r.spare_inhaler_locations.join("; ") },
    { header: "Review Date", accessor: (r: AsthmaPlan) => r.review_date },
    { header: "Key Worker", accessor: (r: AsthmaPlan) => getStaffName(r.key_worker) },
  ];

  if (isLoading) {
    return (
      <PageShell title="Child Asthma Action Plan" subtitle="Personal Asthma Action Plan · BTS/SIGN 158 · NICE NG80 · Quality Standard 8">
        <div className="flex items-center justify-center py-12 text-muted-foreground">Loading…</div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Child Asthma Action Plan"
      subtitle="Personal Asthma Action Plan · BTS/SIGN 158 · NICE NG80 · Quality Standard 8"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Asthma Action Plans" />
          <ExportButton data={data} columns={exportCols} filename="child-asthma-action-plan" />
        </div>
      }
    >
      <div id="print-area">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Active Plans", value: total, icon: Wind, clr: "text-sky-600" },
            { label: "Peak Flow in Green", value: recentlyGreen, icon: Activity, clr: "text-green-600" },
            { label: "Hospital Admissions YTD", value: ytdAdmissions, icon: AlertTriangle, clr: "text-red-600" },
            { label: "Reviews Due 90d", value: reviewsDue90, icon: Phone, clr: "text-amber-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search young person, diagnosis or trigger..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterDiagnosis} onValueChange={setFilterDiagnosis}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Diagnosis" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Diagnoses</SelectItem>
              <SelectItem value="mild_intermittent">{ASTHMA_DIAGNOSIS_LABEL.mild_intermittent}</SelectItem>
              <SelectItem value="mild_persistent">{ASTHMA_DIAGNOSIS_LABEL.mild_persistent}</SelectItem>
              <SelectItem value="moderate_persistent">{ASTHMA_DIAGNOSIS_LABEL.moderate_persistent}</SelectItem>
              <SelectItem value="severe_persistent">{ASTHMA_DIAGNOSIS_LABEL.severe_persistent}</SelectItem>
              <SelectItem value="exercise_induced_only">{ASTHMA_DIAGNOSIS_LABEL.exercise_induced_only}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <ArrowUpDown className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            const borderClr = r.diagnosis === "severe_persistent"
              ? "border-l-red-500"
              : r.diagnosis === "moderate_persistent"
                ? "border-l-amber-500"
                : "border-l-sky-400";
            return (
              <Card key={r.id} className={cn("border-l-4", borderClr)}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getYPName(r.child_id)}
                        <Badge variant="outline" className="bg-sky-100 text-sky-800">{ASTHMA_DIAGNOSIS_LABEL[r.diagnosis]}</Badge>
                        {r.child_can_self_medicate && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">Self-medicates</Badge>
                        )}
                        {r.school_has_inhaler && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">School inhaler held</Badge>
                        )}
                        {r.hospital_admissions.length > 0 && (
                          <Badge variant="outline" className="bg-red-50 text-red-700">Prior admission</Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Plan: {r.plan_date} · Key worker: {getStaffName(r.key_worker)} · Review: {r.review_date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-muted/50">{r.known_triggers.length} triggers</Badge>
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Known Triggers
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {r.known_triggers.map((t, i) => (
                          <Badge key={i} variant="outline" className="bg-amber-50 text-amber-800">{t}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="rounded p-2 border-l-4 border-l-amber-700 bg-amber-50">
                        <p className="text-xs font-semibold text-amber-900">Preventer (BROWN) — daily</p>
                        {r.preventer_inhaler ? (
                          <>
                            <p className="text-xs mt-1">{r.preventer_inhaler.name}</p>
                            <p className="text-xs text-muted-foreground">{r.preventer_inhaler.dose}</p>
                            <p className="text-xs text-muted-foreground">{r.preventer_inhaler.timing}</p>
                          </>
                        ) : (
                          <p className="text-xs italic text-muted-foreground mt-1">Not currently prescribed</p>
                        )}
                        {r.spacer_needed && (
                          <Badge variant="outline" className="mt-1 bg-white">Spacer required</Badge>
                        )}
                      </div>
                      <div className="rounded p-2 border-l-4 border-l-blue-600 bg-blue-50">
                        <p className="text-xs font-semibold text-blue-900">Reliever (BLUE) — as needed</p>
                        {r.reliever_inhaler ? (
                          <>
                            <p className="text-xs mt-1">{r.reliever_inhaler.name}</p>
                            <p className="text-xs text-muted-foreground">{r.reliever_inhaler.dose}</p>
                          </>
                        ) : (
                          <p className="text-xs italic text-muted-foreground mt-1">Not currently prescribed</p>
                        )}
                      </div>
                    </div>

                    {r.peak_flow_best && (
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-xs font-semibold mb-1">Peak Flow — Personal Best: {r.peak_flow_best} L/min</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
                          <div className="rounded p-2 border border-green-300 bg-green-50">
                            <p className="text-xs font-semibold text-green-800">GREEN — Doing well</p>
                            <p className="text-xs text-green-700 mt-0.5">{r.peak_flow_green_zone}</p>
                          </div>
                          <div className="rounded p-2 border border-amber-300 bg-amber-50">
                            <p className="text-xs font-semibold text-amber-800">AMBER — Caution</p>
                            <p className="text-xs text-amber-700 mt-0.5">{r.peak_flow_amber_zone}</p>
                          </div>
                          <div className="rounded p-2 border border-red-300 bg-red-50">
                            <p className="text-xs font-semibold text-red-800">RED — Emergency</p>
                            <p className="text-xs text-red-700 mt-0.5">{r.peak_flow_red_zone}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="rounded p-2 border border-green-300 bg-green-50">
                        <p className="text-xs font-semibold text-green-800 mb-1">Green Zone — Actions</p>
                        <ul className="space-y-1">
                          {r.green_zone_actions.map((a, i) => (
                            <li key={i} className="text-xs text-green-900">• {a}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded p-2 border border-amber-300 bg-amber-50">
                        <p className="text-xs font-semibold text-amber-800 mb-1">Amber Zone — Actions</p>
                        <ul className="space-y-1">
                          {r.amber_zone_actions.map((a, i) => (
                            <li key={i} className="text-xs text-amber-900">• {a}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded p-2 border border-red-300 bg-red-50">
                        <p className="text-xs font-semibold text-red-800 mb-1 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> Red Zone — Dial 999
                        </p>
                        <ul className="space-y-1">
                          {r.red_zone_actions.map((a, i) => (
                            <li key={i} className="text-xs text-red-900">• {a}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {r.hospital_admissions.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Hospital Admission History</p>
                        <div className="space-y-1">
                          {r.hospital_admissions.map((a, i) => (
                            <div key={i} className="border rounded p-2 text-xs">
                              <p className="font-semibold">{a.date}</p>
                              <p><span className="text-muted-foreground">Reason: </span>{a.reason}</p>
                              <p><span className="text-muted-foreground">Outcome: </span>{a.outcome}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="bg-muted/30 rounded p-2">
                        <p className="text-xs font-medium mb-1">Spare Inhaler Locations</p>
                        <ul className="space-y-0.5">
                          {r.spare_inhaler_locations.map((loc, i) => (
                            <li key={i} className="text-xs text-muted-foreground">• {loc}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-muted/30 rounded p-2">
                        <p className="text-xs font-medium mb-1 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> Emergency Contacts
                        </p>
                        <ul className="space-y-0.5">
                          {r.emergency_contacts.map((c, i) => (
                            <li key={i} className="text-xs">
                              <span className="font-medium">{c.name}</span>
                              <span className="text-muted-foreground"> — {c.role}: {c.phone}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded p-2">
                      <p className="font-medium text-xs text-purple-800 mb-1">Child&apos;s Voice</p>
                      <p className="text-xs text-purple-700 italic">&ldquo;{r.child_voice}&rdquo;</p>
                    </div>

                    <div className="bg-sky-50 border border-sky-200 rounded p-2">
                      <p className="font-medium text-xs text-sky-800 mb-1">Staff Observation</p>
                      <p className="text-xs text-sky-700">{r.staff_observation}</p>
                    </div>

                    <div className="text-xs text-muted-foreground border-t pt-2">
                      Plan logged by {getStaffName("staff_darren")} · Reviewed with {getStaffName(r.key_worker)} · Next review: {r.review_date}
                    </div>

                    <SmartLinkPanel sourceType="asthma-plan" sourceId={r.id} childId={r.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework — Personal Asthma Action Plans</p>
          <p>
            Every child with asthma must have a written personal asthma action plan (PAAP) following the format recommended by BTS/SIGN Guideline 158 (British Thoracic Society / Scottish Intercollegiate Guidelines Network, 2019, with 2024 update) and NICE NG80 (Asthma: diagnosis, monitoring and chronic asthma management). The plan must specify daily preventer therapy, reliever use, identified triggers, peak flow zones (green/amber/red) where age-appropriate, and clear actions at each zone including when to dial 999. Children&apos;s Homes (England) Regulations 2015, Quality Standard 8 (Health and wellbeing) requires the registered person to ensure each child receives healthcare that meets their needs and that staff are trained to recognise and respond to acute deterioration. The Asthma + Lung UK personal asthma plan template is the recommended pro-forma. Staff competency in inhaler technique, spacer use and recognition of severe attack must be evidenced through training records. The plan must be reviewed at least annually, after every acute attack, and shared with school under the Supporting Pupils with Medical Conditions statutory guidance (DfE, 2015). The child&apos;s voice and preferences must be central to the plan, in line with UNCRC Article 24 (right to the highest attainable standard of health) and Article 12 (right to be heard).
          </p>
        </div>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
