"use client";

import { useState, useMemo } from "react";
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
  Cigarette, Heart, Activity, ChevronUp, ChevronDown, ArrowUpDown, Search, Shield, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import type {
  SmokingVapingRecord,
  SmokingStatus,
} from "@/types/extended";
import {
  SMOKING_STATUS_LABEL,
  SMOKING_ATTITUDE_LABEL,
  STOP_SMOKING_REFERRAL_STATUS_LABEL,
} from "@/types/extended";
import { useSmokingVapingRecords } from "@/hooks/use-smoking-vaping-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function ChildSmokingVapingTrackerPage() {
  const { data: res, isLoading } = useSmokingVapingRecords();
  const items = res?.data ?? [];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const filtered = useMemo(() => {
    let rows = [...items];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        getYPName(r.child_id).toLowerCase().includes(q) ||
        SMOKING_STATUS_LABEL[r.status].toLowerCase().includes(q) ||
        r.substances_used.some((s) => s.toLowerCase().includes(q)) ||
        r.triggers_identified.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (filterStatus !== "all") rows = rows.filter((r) => r.status === filterStatus);
    rows.sort((a, b) =>
      sortBy === "newest"
        ? b.recorded_date.localeCompare(a.recorded_date)
        : a.recorded_date.localeCompare(b.recorded_date),
    );
    return rows;
  }, [items, search, filterStatus, sortBy]);

  const childrenScreened = items.length;
  const regularUsers = items.filter((r) =>
    r.status === "regular_vape" ||
    r.status === "regular_cigarette" ||
    r.status === "multiple_substances",
  ).length;
  const inStopProgramme = items.filter((r) => r.status === "in_stop_programme").length;
  const yearStart = new Date();
  yearStart.setMonth(0, 1);
  const briefInterventionsYTD = items.filter(
    (r) => r.brief_intervention_delivered && r.brief_intervention_date && new Date(r.brief_intervention_date) >= yearStart,
  ).length;

  const exportCols: ExportColumn<SmokingVapingRecord>[] = [
    { header: "Young Person", accessor: (r: SmokingVapingRecord) => getYPName(r.child_id) },
    { header: "Recorded Date", accessor: (r: SmokingVapingRecord) => r.recorded_date },
    { header: "Status", accessor: (r: SmokingVapingRecord) => SMOKING_STATUS_LABEL[r.status] },
    { header: "Substances Used", accessor: (r: SmokingVapingRecord) => r.substances_used.join("; ") },
    { header: "Estimated Frequency", accessor: (r: SmokingVapingRecord) => r.estimated_frequency ?? "—" },
    { header: "Triggers Identified", accessor: (r: SmokingVapingRecord) => r.triggers_identified.join("; ") },
    { header: "Brief Intervention", accessor: (r: SmokingVapingRecord) => r.brief_intervention_delivered ? "Yes" : "No" },
    { header: "Brief Intervention Date", accessor: (r: SmokingVapingRecord) => r.brief_intervention_date ?? "—" },
    { header: "Stop Smoking Referral", accessor: (r: SmokingVapingRecord) => r.stop_smoking_referral ? `${r.stop_smoking_referral.service} (${STOP_SMOKING_REFERRAL_STATUS_LABEL[r.stop_smoking_referral.status]})` : "—" },
    { header: "Harm Reduction Strategies", accessor: (r: SmokingVapingRecord) => r.harm_reduction_strategies.join("; ") },
    { header: "Home Policy Reinforcement", accessor: (r: SmokingVapingRecord) => r.home_policy_reinforcement },
    { header: "External Support", accessor: (r: SmokingVapingRecord) => r.external_support },
    { header: "Child Attitude", accessor: (r: SmokingVapingRecord) => SMOKING_ATTITUDE_LABEL[r.child_attitude] },
    { header: "Child Voice", accessor: (r: SmokingVapingRecord) => r.child_voice },
    { header: "Staff Observation", accessor: (r: SmokingVapingRecord) => r.staff_observation },
    { header: "Flags / Concerns", accessor: (r: SmokingVapingRecord) => r.flags_concerns.join("; ") },
    { header: "Review Date", accessor: (r: SmokingVapingRecord) => r.review_date },
    { header: "Key Worker", accessor: (r: SmokingVapingRecord) => getStaffName(r.key_worker) },
  ];

  if (isLoading) return <PageShell title="Child Smoking & Vaping Tracker" subtitle="Per-child screening · Brief intervention model · NICE NG209 · Behaviour-first, not punitive"><div /></PageShell>;

  return (
    <PageShell
      title="Child Smoking & Vaping Tracker"
      subtitle="Per-child screening · Brief intervention model · NICE NG209 · Behaviour-first, not punitive"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Smoking & Vaping Tracker" />
          <ExportButton data={items} columns={exportCols} filename="child-smoking-vaping-tracker" />
        </div>
      }
    >
      <div id="print-area">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Children Screened", value: childrenScreened, icon: Shield, clr: "text-sky-600" },
            { label: "Regular Users", value: regularUsers, icon: AlertTriangle, clr: "text-amber-600" },
            { label: "In Stop Programme", value: inStopProgramme, icon: Heart, clr: "text-teal-600" },
            { label: "Brief Interventions YTD", value: briefInterventionsYTD, icon: Activity, clr: "text-sky-600" },
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
              placeholder="Search young person, status, substance or trigger..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {(Object.entries(SMOKING_STATUS_LABEL) as [SmokingStatus, string][]).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
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
            const borderClr =
              r.status === "regular_vape" || r.status === "regular_cigarette" || r.status === "multiple_substances"
                ? "border-l-amber-500"
                : r.status === "in_stop_programme" || r.status === "stopped"
                  ? "border-l-teal-500"
                  : "border-l-sky-400";
            const statusBadgeClr =
              r.status === "regular_vape" || r.status === "regular_cigarette" || r.status === "multiple_substances"
                ? "bg-amber-100 text-amber-800"
                : r.status === "in_stop_programme" || r.status === "stopped"
                  ? "bg-teal-100 text-teal-800"
                  : "bg-sky-100 text-sky-800";
            return (
              <Card key={r.id} className={cn("border-l-4", borderClr)}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getYPName(r.child_id)}
                        <Badge variant="outline" className={statusBadgeClr}>{SMOKING_STATUS_LABEL[r.status]}</Badge>
                        {r.brief_intervention_delivered && (
                          <Badge variant="outline" className="bg-sky-50 text-sky-700">Brief intervention delivered</Badge>
                        )}
                        <Badge variant="outline" className="bg-teal-50 text-teal-700">{SMOKING_ATTITUDE_LABEL[r.child_attitude]}</Badge>
                        {r.stop_smoking_referral && (
                          <Badge variant="outline" className="bg-teal-100 text-teal-800">
                            Stop service: {STOP_SMOKING_REFERRAL_STATUS_LABEL[r.stop_smoking_referral.status]}
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Recorded: {r.recorded_date} · Key worker: {getStaffName(r.key_worker)} · Review: {r.review_date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.flags_concerns.length > 0 && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-800">
                          {r.flags_concerns.length} flag{r.flags_concerns.length === 1 ? "" : "s"}
                        </Badge>
                      )}
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {r.substances_used.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <Cigarette className="h-3.5 w-3.5 text-amber-600" /> Substances Used
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {r.substances_used.map((s, i) => (
                            <Badge key={i} variant="outline" className="bg-amber-50 text-amber-800">{s}</Badge>
                          ))}
                        </div>
                        {r.estimated_frequency && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium">Frequency: </span>{r.estimated_frequency}
                          </p>
                        )}
                      </div>
                    )}

                    {r.triggers_identified.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Triggers Identified
                        </p>
                        <ul className="space-y-0.5">
                          {r.triggers_identified.map((t, i) => (
                            <li key={i} className="text-xs text-muted-foreground">• {t}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="rounded p-2 border border-sky-200 bg-sky-50">
                      <p className="text-xs font-semibold text-sky-900 mb-1 flex items-center gap-1">
                        <Activity className="h-3 w-3" /> Brief Intervention (NICE NG209)
                      </p>
                      {r.brief_intervention_delivered ? (
                        <p className="text-xs text-sky-800">
                          Delivered{r.brief_intervention_date ? ` on ${r.brief_intervention_date}` : ""} —
                          {" "}5-As model: Ask, Advise, Assess, Assist, Arrange follow-up.
                        </p>
                      ) : (
                        <p className="text-xs italic text-sky-800">Not yet delivered — schedule with key worker</p>
                      )}
                    </div>

                    {r.stop_smoking_referral && (
                      <div className="rounded p-2 border border-teal-200 bg-teal-50">
                        <p className="text-xs font-semibold text-teal-900 mb-1">Stop Smoking Service Referral</p>
                        <p className="text-xs text-teal-800">
                          <span className="font-medium">Service: </span>{r.stop_smoking_referral.service}
                        </p>
                        {r.stop_smoking_referral.clinician_name && (
                          <p className="text-xs text-teal-800">
                            <span className="font-medium">Clinician: </span>{r.stop_smoking_referral.clinician_name}
                          </p>
                        )}
                        <p className="text-xs text-teal-800">
                          <span className="font-medium">Status: </span>{STOP_SMOKING_REFERRAL_STATUS_LABEL[r.stop_smoking_referral.status]}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="bg-sky-50 border border-sky-200 rounded p-2">
                        <p className="font-medium text-xs text-sky-900 mb-1 flex items-center gap-1">
                          <Heart className="h-3 w-3" /> Harm Reduction Strategies
                        </p>
                        <ul className="space-y-0.5">
                          {r.harm_reduction_strategies.map((h, i) => (
                            <li key={i} className="text-xs text-sky-800">• {h}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-teal-50 border border-teal-200 rounded p-2">
                        <p className="font-medium text-xs text-teal-900 mb-1 flex items-center gap-1">
                          <Shield className="h-3 w-3" /> Home Policy Reinforcement
                        </p>
                        {r.home_policy_reinforcement && (
                          <p className="text-xs text-teal-800">• {r.home_policy_reinforcement}</p>
                        )}
                      </div>
                    </div>

                    {r.external_support && (
                      <div className="bg-muted/30 rounded p-2">
                        <p className="text-xs font-medium mb-1">External Support</p>
                        <p className="text-xs text-muted-foreground">• {r.external_support}</p>
                      </div>
                    )}

                    <div className="bg-purple-50 border border-purple-200 rounded p-2">
                      <p className="font-medium text-xs text-purple-800 mb-1">Child&apos;s Voice</p>
                      <p className="text-xs text-purple-700 italic">&ldquo;{r.child_voice}&rdquo;</p>
                    </div>

                    <div className="bg-sky-50 border border-sky-200 rounded p-2">
                      <p className="font-medium text-xs text-sky-800 mb-1">Staff Observation</p>
                      <p className="text-xs text-sky-700">{r.staff_observation}</p>
                    </div>

                    {r.flags_concerns.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded p-2">
                        <p className="font-medium text-xs text-amber-900 mb-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Flags &amp; Concerns
                        </p>
                        <ul className="space-y-0.5">
                          {r.flags_concerns.map((f, i) => (
                            <li key={i} className="text-xs text-amber-800">• {f}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <SmartLinkPanel sourceType="smoking-vaping-record" sourceId={r.id} childId={r.child_id} compact />

                    <div className="text-xs text-muted-foreground border-t pt-2">
                      Logged by {getStaffName("staff_darren")} · Reviewed with {getStaffName(r.key_worker)} · Next review: {r.review_date}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework — Smoking, Vaping &amp; Harm Reduction</p>
          <p>
            NICE NG209 (Tobacco: preventing uptake, promoting quitting and treating dependence, 2021) is the controlling guidance and recommends a brief intervention model — Ask, Advise, Assess, Assist, Arrange — at every contact with a young person who uses tobacco or vapes nicotine. Local NHS Stop Smoking services are free at point of use and accept self-referral or professional referral from age 12 upward; behavioural support combined with appropriate nicotine-replacement therapy (where clinically indicated) gives the strongest evidence base for cessation. Children&apos;s Homes (England) Regulations 2015 Quality Standard 8 (Health and wellbeing) requires the registered person to ensure each child receives healthcare that meets their needs, including help to make positive lifestyle choices, and Quality Standard 9 (Positive relationships) underpins a behaviour-first, non-punitive approach which is essential to honest disclosure. The Children and Families Act 2014 sections 91-92 prohibit smoking in private vehicles carrying anyone under 18. The Tobacco and Vapes Bill (in progress through Parliament) is expected to raise the legal age of sale of tobacco progressively and to restrict disposable vape design and marketing aimed at children. UNCRC Article 24 recognises the right of every child to the highest attainable standard of health, and Article 12 the right to be heard — both require that the child&apos;s voice and identity (peer group, faith, sport, sexuality) shape the response, rather than a one-size-fits-all warning. Cannabis vape detection requires a sensitive safeguarding response and may trigger separate substance-misuse referral pathways alongside this record.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
