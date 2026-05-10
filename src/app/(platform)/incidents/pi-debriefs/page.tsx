"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PHYSICAL INTERVENTION DEBRIEF REGISTER
// Reg 20, Children's Homes (England) Regulations 2015
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { cn, formatDate } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { usePIDebriefs, useUpdatePIDebrief } from "@/hooks/use-incidents";
import { useIncidents } from "@/hooks/use-incidents";
import { getStaffName, getYPName } from "@/lib/seed-data";
import type { PIDebrief, PIDebriefStatus, PITechnique } from "@/types/extended";
import type { Incident } from "@/types";
import {
  ShieldAlert, CheckCircle2, Clock, AlertTriangle, ChevronDown, ChevronUp,
  Sparkles, Users, User, AlertOctagon, ClipboardList, FileText, Flag,
  ArrowLeft, Search, Filter, ArrowUpDown,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/hooks/use-api";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";

const PI_DEBRIEF_EXPORT_COLS: ExportColumn<PIDebrief>[] = [
  { header: "Incident", accessor: (d) => d.incident_id },
  { header: "Technique", accessor: (d) => d.technique_used },
  { header: "Duration (min)", accessor: (d) => String(d.duration_minutes) },
  { header: "Status", accessor: (d) => d.status },
  { header: "Staff Involved", accessor: (d) => d.staff_involved.map(getStaffName).join(", ") },
  { header: "De-escalation Attempted", accessor: (d) => d.de_escalation_attempted ? "Yes" : "No" },
  { header: "Ofsted Notified", accessor: (d) => d.ofsted_notification_required ? (d.ofsted_notified_at ? `Yes — ${d.ofsted_reference ?? ""}` : "Required") : "No" },
  { header: "YP Debrief", accessor: (d) => d.yp_debrief_completed ? "Done" : "Pending" },
  { header: "Staff Debrief", accessor: (d) => d.staff_debrief_completed ? "Done" : "Pending" },
  { header: "Trigger", accessor: (d) => d.trigger_identified ?? "" },
  { header: "Created", accessor: (d) => d.created_at },
];

// ── Constants ──────────────────────────────────────────────────────────────────

const TECHNIQUE_LABELS: Record<PITechnique, string> = {
  team_teach_holding:  "Team Teach — Holding",
  team_teach_wrap:     "Team Teach — Wrap",
  price_standing:      "PRICE — Standing",
  price_seated:        "PRICE — Seated",
  price_supine:        "PRICE — Supine",
  mapa_holding:        "MAPA — Holding",
  restrictive_escort:  "Restrictive Escort",
  other:               "Other",
};

const STATUS_LABELS: Record<PIDebriefStatus, string> = {
  pending:              "Pending",
  yp_debrief_done:      "YP Debriefed",
  staff_debrief_done:   "Staff Debriefed",
  complete:             "Complete",
  rm_signed_off:        "RM Signed Off",
};

const STATUS_COLOUR: Record<PIDebriefStatus, string> = {
  pending:              "bg-red-50 text-red-700 border-red-200",
  yp_debrief_done:      "bg-amber-50 text-amber-700 border-amber-200",
  staff_debrief_done:   "bg-amber-50 text-amber-700 border-amber-200",
  complete:             "bg-blue-50 text-blue-700 border-blue-200",
  rm_signed_off:        "bg-emerald-50 text-emerald-700 border-emerald-200",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function debriefOverdue(debrief: PIDebrief) {
  return daysSince(debrief.created_at) > 2 && debrief.status !== "rm_signed_off";
}

// ── Debrief Card ──────────────────────────────────────────────────────────────

function PIDebriefCard({
  debrief,
  incident,
  onUpdateDebrief,
  onSignOff,
  onAriaAnalysis,
  ariaBusy,
}: {
  debrief: PIDebrief;
  incident: Incident | undefined;
  onUpdateDebrief: (id: string, data: Partial<PIDebrief>) => void;
  onSignOff: (debrief: PIDebrief) => void;
  onAriaAnalysis: (debrief: PIDebrief, incident: Incident | undefined) => void;
  ariaBusy: string | null;
}) {
  const [expanded, setExpanded] = useState(debrief.status !== "rm_signed_off");
  const overdue = debriefOverdue(debrief);
  const days    = daysSince(debrief.created_at);

  const incidentRef  = incident?.reference ?? debrief.incident_id;
  const incidentDate = incident?.date ?? "";
  const ypName       = incident ? getYPName(incident.child_id) : "Unknown";

  return (
    <div className={cn(
      "rounded-2xl border bg-white overflow-hidden",
      overdue ? "border-red-200" : debrief.status === "rm_signed_off" ? "border-emerald-200" : "border-slate-200",
    )}>
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        {/* Status indicator */}
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          debrief.status === "rm_signed_off" ? "bg-emerald-100" : overdue ? "bg-red-100" : "bg-amber-100",
        )}>
          {debrief.status === "rm_signed_off" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : overdue ? (
            <AlertOctagon className="h-5 w-5 text-red-600" />
          ) : (
            <Clock className="h-5 w-5 text-amber-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-slate-800">{incidentRef}</span>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", STATUS_COLOUR[debrief.status])}>
              {STATUS_LABELS[debrief.status]}
            </Badge>
            {overdue && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-red-50 text-red-700 border-red-200">
                ⚠ {days}d — debrief overdue
              </Badge>
            )}
            {debrief.ofsted_notification_required && !debrief.ofsted_notified_at && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-rose-50 text-rose-700 border-rose-200">
                Ofsted notification required
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />{ypName}
            </span>
            <span>·</span>
            <span>{incidentDate ? formatDate(incidentDate) : "—"}</span>
            <span>·</span>
            <span className="font-medium">{TECHNIQUE_LABELS[debrief.technique_used]}</span>
            <span>·</span>
            <span>{debrief.duration_minutes} min</span>
          </div>

          {/* Staff involved */}
          {debrief.staff_involved.length > 0 && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
              <Users className="h-3 w-3" />
              {debrief.staff_involved.map((id) => getStaffName(id)).join(", ")}
            </div>
          )}
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-4">
          {/* Debrief checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* YP Debrief */}
            <div className={cn(
              "rounded-xl border p-3",
              debrief.yp_debrief_completed ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100",
            )}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  {debrief.yp_debrief_completed
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    : <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                  <span className="text-xs font-semibold text-slate-700">YP Debrief</span>
                </div>
                {!debrief.yp_debrief_completed && (
                  <button
                    onClick={() =>
                      onUpdateDebrief(debrief.id, {
                        yp_debrief_completed: true,
                        yp_debrief_date: new Date().toISOString(),
                        status: debrief.staff_debrief_completed ? "complete" : "yp_debrief_done",
                      })
                    }
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Mark complete →
                  </button>
                )}
              </div>
              {debrief.yp_debrief_completed ? (
                <div className="text-[10px] text-emerald-700 space-y-0.5">
                  <p>{debrief.yp_debrief_date ? formatDate(debrief.yp_debrief_date) : ""}</p>
                  {debrief.yp_debrief_by && <p>By: {getStaffName(debrief.yp_debrief_by)}</p>}
                  {debrief.yp_debrief_feelings && (
                    <p className="text-slate-600 italic mt-1">"{debrief.yp_debrief_feelings}"</p>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-red-600">Must be completed within 24 hours of incident</p>
              )}
            </div>

            {/* Staff Debrief */}
            <div className={cn(
              "rounded-xl border p-3",
              debrief.staff_debrief_completed ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100",
            )}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  {debrief.staff_debrief_completed
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    : <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                  <span className="text-xs font-semibold text-slate-700">Staff Debrief</span>
                </div>
                {!debrief.staff_debrief_completed && (
                  <button
                    onClick={() =>
                      onUpdateDebrief(debrief.id, {
                        staff_debrief_completed: true,
                        staff_debrief_date: new Date().toISOString(),
                        status: debrief.yp_debrief_completed ? "complete" : "staff_debrief_done",
                      })
                    }
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Mark complete →
                  </button>
                )}
              </div>
              {debrief.staff_debrief_completed ? (
                <div className="text-[10px] text-emerald-700 space-y-0.5">
                  <p>{debrief.staff_debrief_date ? formatDate(debrief.staff_debrief_date) : ""}</p>
                  {debrief.staff_debrief_by && <p>By: {getStaffName(debrief.staff_debrief_by)}</p>}
                  {debrief.staff_debrief_notes && (
                    <p className="text-slate-600 mt-1 line-clamp-2">{debrief.staff_debrief_notes}</p>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-red-600">Must be completed before next shift</p>
              )}
            </div>
          </div>

          {/* Notification requirements */}
          {(debrief.ofsted_notification_required || debrief.riddor_reportable || debrief.la_notification_required) && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3">
              <p className="text-[10px] font-semibold text-rose-700 uppercase tracking-widest mb-2">
                Statutory Notifications Required
              </p>
              <div className="space-y-1.5">
                {debrief.ofsted_notification_required && (
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {debrief.ofsted_notified_at
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        : <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                      <span className="font-medium text-slate-700">Ofsted notification</span>
                    </div>
                    {debrief.ofsted_notified_at ? (
                      <span className="text-[10px] text-emerald-600">{formatDate(debrief.ofsted_notified_at)}</span>
                    ) : (
                      <button
                        onClick={() =>
                          onUpdateDebrief(debrief.id, { ofsted_notified_at: new Date().toISOString() })
                        }
                        className="text-[10px] text-rose-600 hover:text-rose-800 font-medium"
                      >
                        Record notification →
                      </button>
                    )}
                  </div>
                )}
                {debrief.la_notification_required && (
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {debrief.la_notified_at
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        : <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                      <span className="font-medium text-slate-700">Local Authority notification</span>
                    </div>
                    {debrief.la_notified_at ? (
                      <span className="text-[10px] text-emerald-600">{formatDate(debrief.la_notified_at)}</span>
                    ) : (
                      <button
                        onClick={() =>
                          onUpdateDebrief(debrief.id, { la_notified_at: new Date().toISOString() })
                        }
                        className="text-[10px] text-rose-600 hover:text-rose-800 font-medium"
                      >
                        Record notification →
                      </button>
                    )}
                  </div>
                )}
                {debrief.riddor_reportable && (
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {debrief.riddor_reported_at
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        : <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                      <span className="font-medium text-slate-700">RIDDOR report</span>
                    </div>
                    {debrief.riddor_reported_at ? (
                      <span className="text-[10px] text-emerald-600">{formatDate(debrief.riddor_reported_at)}</span>
                    ) : (
                      <button
                        onClick={() =>
                          onUpdateDebrief(debrief.id, { riddor_reported_at: new Date().toISOString() })
                        }
                        className="text-[10px] text-rose-600 hover:text-rose-800 font-medium"
                      >
                        Record RIDDOR →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Injuries */}
          {debrief.injuries.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3">
              <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-widest mb-2">
                Injuries Recorded
              </p>
              {debrief.injuries.map((injury, i) => (
                <div key={i} className="text-xs text-slate-700">
                  <span className="font-medium capitalize">{injury.person_type.replace("_", " ")} — </span>
                  {injury.description}
                  {injury.medical_attention_required && (
                    <span className="ml-1 text-[10px] text-amber-600 font-medium">
                      · Medical attention: {injury.medical_attention_detail}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Trigger & learning */}
          {debrief.trigger_identified && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Trigger Identified</p>
              <p className="text-xs text-slate-700">{debrief.trigger_identified}</p>
              {debrief.preventative_measures && (
                <div className="mt-2">
                  <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest mb-0.5">Preventative Measures</p>
                  <p className="text-xs text-slate-700">{debrief.preventative_measures}</p>
                </div>
              )}
            </div>
          )}

          {/* ARIA analysis */}
          {debrief.aria_analysis ? (
            <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                <p className="text-[10px] font-semibold text-teal-700 uppercase tracking-widest">ARIA Analysis</p>
              </div>
              <p className="text-xs text-slate-700">{debrief.aria_analysis}</p>
            </div>
          ) : (
            <button
              onClick={() => onAriaAnalysis(debrief, incident)}
              disabled={ariaBusy === debrief.id}
              className="inline-flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-800 disabled:opacity-50"
            >
              {ariaBusy === debrief.id ? (
                <><Sparkles className="h-3.5 w-3.5 animate-spin" />ARIA analysing…</>
              ) : (
                <><Sparkles className="h-3.5 w-3.5" />Generate ARIA analysis</>
              )}
            </button>
          )}

          {/* RM Sign-off */}
          {debrief.status === "rm_signed_off" ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
              <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-widest mb-1">
                RM Sign-off · {debrief.rm_sign_off_date ? formatDate(debrief.rm_sign_off_date) : ""}
              </p>
              {debrief.rm_comments && (
                <p className="text-xs text-slate-700">{debrief.rm_comments}</p>
              )}
            </div>
          ) : (
            debrief.yp_debrief_completed && debrief.staff_debrief_completed && (
              <Button
                size="sm"
                onClick={() => onSignOff(debrief)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-8 text-xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                RM Sign Off
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PIDebriefsPage() {
  const { currentUser } = useAuthContext();
  const debriefsQuery   = usePIDebriefs({ homeId: "home_oak" });
  const incidentsQuery  = useIncidents();
  const updateDebrief   = useUpdatePIDebrief();

  const debriefs  = debriefsQuery.data?.data ?? [];
  const incidents = incidentsQuery.data?.data ?? [];
  const meta      = debriefsQuery.data?.meta;

  const getIncident = (incidentId: string) =>
    incidents.find((i: Incident) => i.id === incidentId);

  // Sign-off modal
  const [signingOff, setSigningOff] = useState<PIDebrief | null>(null);
  const [rmComments, setRmComments] = useState("");
  const [saving, setSaving]         = useState(false);

  // Filters
  const [search, setSearch]       = useState("");
  const [viewTab, setViewTab]     = useState<"pending" | "completed" | "all">("pending");
  const [sortBy, setSortBy]       = useState<"date" | "duration" | "technique" | "status">("date");

  // ARIA analysis
  const [ariaBusy, setAriaBusy]   = useState<string | null>(null);
  const [ariaError, setAriaError] = useState<string | null>(null);

  const handleUpdateDebrief = async (id: string, data: Partial<PIDebrief>) => {
    await updateDebrief.mutateAsync({ id, data });
  };

  const handleSignOff = async () => {
    if (!signingOff) return;
    setSaving(true);
    try {
      await updateDebrief.mutateAsync({
        id: signingOff.id,
        data: {
          status: "rm_signed_off",
          rm_sign_off_date: new Date().toISOString(),
          rm_sign_off_by: currentUser?.id ?? "staff_darren",
          rm_comments: rmComments.trim() || null,
        },
      });
      setSigningOff(null);
      setRmComments("");
    } finally {
      setSaving(false);
    }
  };

  const handleAriaAnalysis = async (debrief: PIDebrief, incident: Incident | undefined) => {
    setAriaBusy(debrief.id);
    setAriaError(null);
    try {
      const injurySummary = debrief.injuries.length > 0
        ? debrief.injuries.map((i) => `${i.person_type}: ${i.description}${i.riddor_reportable ? " (RIDDOR reportable)" : ""}`).join("; ")
        : "None";

      const prompt = `You are ARIA, a regulatory compliance AI for a children's residential home. Analyse this physical intervention debrief and provide a concise 2–3 sentence regulatory assessment covering: proportionality of the intervention, completeness of the debrief process, any outstanding compliance concerns, and any patterns or learning identified. Be precise and focused on Reg 20 compliance.

Incident: ${incident?.reference ?? debrief.incident_id} — ${incident?.date ?? "unknown date"}
Young Person: ${incident ? getYPName(incident.child_id) : "unknown"}
Technique: ${TECHNIQUE_LABELS[debrief.technique_used]}
Duration: ${debrief.duration_minutes} minutes
De-escalation attempted: ${debrief.de_escalation_attempted ? "Yes" : "No"}
${debrief.de_escalation_description ? `De-escalation detail: ${debrief.de_escalation_description}` : ""}
Injuries: ${injurySummary}
YP debrief completed: ${debrief.yp_debrief_completed ? "Yes" : "No — OUTSTANDING"}
Staff debrief completed: ${debrief.staff_debrief_completed ? "Yes" : "No — OUTSTANDING"}
Trigger: ${debrief.trigger_identified ?? "Not yet identified"}
Ofsted notification required: ${debrief.ofsted_notification_required ? "Yes" : "No"}`;

      const response = await api.post<{ choices: { message: { content: string } }[] }>(
        "/aria/chat",
        { messages: [{ role: "user", content: prompt }], context: "pi_debrief_analysis" },
      );

      const analysis =
        response?.choices?.[0]?.message?.content ??
        `${incident?.reference ?? debrief.incident_id} — ${TECHNIQUE_LABELS[debrief.technique_used]} for ${debrief.duration_minutes} min. ${debrief.yp_debrief_completed && debrief.staff_debrief_completed ? "Both YP and staff debriefs completed." : `Outstanding debriefs: ${!debrief.yp_debrief_completed ? "YP" : ""}${!debrief.yp_debrief_completed && !debrief.staff_debrief_completed ? " and " : ""}${!debrief.staff_debrief_completed ? "Staff" : ""}.`} Trigger: ${debrief.trigger_identified ?? "not yet identified"}.`;

      await updateDebrief.mutateAsync({ id: debrief.id, data: { aria_analysis: analysis } });
    } catch {
      setAriaError("ARIA analysis failed — please try again");
    } finally {
      setAriaBusy(null);
    }
  };

  const pendingDebriefs  = debriefs.filter((d) => d.status !== "rm_signed_off");
  const completedDebriefs = debriefs.filter((d) => d.status === "rm_signed_off");

  // Filtered debriefs
  const filtered = useMemo(() => {
    let list = debriefs;

    // Tab filter
    if (viewTab === "pending") list = list.filter((d) => d.status !== "rm_signed_off");
    else if (viewTab === "completed") list = list.filter((d) => d.status === "rm_signed_off");

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((d) => {
        const inc = getIncident(d.incident_id);
        return (
          d.incident_id.toLowerCase().includes(q) ||
          TECHNIQUE_LABELS[d.technique_used].toLowerCase().includes(q) ||
          (d.trigger_identified ?? "").toLowerCase().includes(q) ||
          (inc ? getYPName(inc.child_id).toLowerCase().includes(q) : false) ||
          d.staff_involved.some((s) => getStaffName(s).toLowerCase().includes(q))
        );
      });
    }

    // Sort
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "duration":
          return b.duration_minutes - a.duration_minutes;
        case "technique":
          return (TECHNIQUE_LABELS[a.technique_used] ?? "").localeCompare(TECHNIQUE_LABELS[b.technique_used] ?? "");
        case "status": {
          const statusOrder: Record<string, number> = { pending_debrief: 0, debrief_in_progress: 1, pending_rm_review: 2, rm_signed_off: 3 };
          return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
        }
        case "date":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return list;
  }, [debriefs, viewTab, search, sortBy]);

  // Technique breakdown
  const techniqueCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of debriefs) {
      counts[d.technique_used] = (counts[d.technique_used] || 0) + 1;
    }
    return counts;
  }, [debriefs]);

  // Injury/RIDDOR count
  const injuryStats = useMemo(() => {
    let totalInjuries = 0;
    let riddorCount = 0;
    for (const d of debriefs) {
      totalInjuries += d.injuries.length;
      riddorCount += d.injuries.filter((i) => i.riddor_reportable).length;
    }
    return { totalInjuries, riddorCount };
  }, [debriefs]);

  return (
    <PageShell
      title="PI Debrief Register"
      subtitle="Physical intervention debrief tracking — Reg 20 compliance"
      ariaContext={{ pageTitle: "PI Debrief Register", sourceType: "pi_debrief" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={PI_DEBRIEF_EXPORT_COLS} filename="pi-debriefs" />
          <PrintButton title="PI Debrief Register" subtitle="Oak House — Reg 20 Compliance" targetId="pi-debriefs-content" />
          <SmartUploadButton
            variant="inline"
            label="Upload PI Record"
            uploadContext="Physical Intervention — debrief record, body map or evidence document upload"
          />
          <Link href="/incidents">
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              Incidents
            </button>
          </Link>
          <AriaStudioQuickActionButton context={{ record_type: "incident", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="pi-debriefs-content" className="space-y-0">
      {/* ── Summary stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total PIs", value: debriefs.length, icon: ShieldAlert, colour: "text-indigo-600", bg: "bg-indigo-50 border-indigo-100" },
          { label: "Pending Debrief", value: meta?.pending ?? 0, icon: Clock, colour: (meta?.pending ?? 0) > 0 ? "text-red-600" : "text-emerald-600", bg: (meta?.pending ?? 0) > 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100" },
          { label: "Overdue (>48h)", value: meta?.overdue ?? 0, icon: AlertTriangle, colour: (meta?.overdue ?? 0) > 0 ? "text-red-600" : "text-emerald-600", bg: (meta?.overdue ?? 0) > 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100" },
          { label: "RM Signed Off", value: completedDebriefs.length, icon: CheckCircle2, colour: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
          { label: "Injuries Recorded", value: injuryStats.totalInjuries, icon: AlertOctagon, colour: injuryStats.totalInjuries > 0 ? "text-orange-600" : "text-slate-500", bg: injuryStats.totalInjuries > 0 ? "bg-orange-50 border-orange-100" : "bg-slate-50 border-slate-100" },
          { label: "RIDDOR Reports", value: injuryStats.riddorCount, icon: Flag, colour: injuryStats.riddorCount > 0 ? "text-red-600" : "text-slate-500", bg: injuryStats.riddorCount > 0 ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100" },
        ].map(({ label, value, icon: Icon, colour, bg }) => (
          <div key={label} className={cn("rounded-xl border p-3", bg)}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={cn("h-3.5 w-3.5 shrink-0", colour)} />
              <span className="text-[10px] text-slate-500 font-medium">{label}</span>
            </div>
            <p className={cn("text-lg font-bold tabular-nums", colour)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Technique distribution */}
      {Object.keys(techniqueCounts).length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-medium text-slate-500">Techniques used:</span>
          {Object.entries(techniqueCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([tech, count]) => (
              <Badge key={tech} variant="outline" className="text-[10px] h-5 px-2">
                {TECHNIQUE_LABELS[tech as PITechnique] ?? tech} ({count})
              </Badge>
            ))}
        </div>
      )}

      {/* ── Search + filter toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by young person, staff, technique, trigger…"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
          <ArrowUpDown className="h-3.5 w-3.5" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="bg-white border rounded-md px-2 py-1.5 text-xs">
            <option value="date">Newest first</option>
            <option value="duration">Duration (longest)</option>
            <option value="technique">Technique A–Z</option>
            <option value="status">Status (pending → signed off)</option>
          </select>
        </div>
        <div className="flex gap-2 shrink-0">
          {(["pending", "completed", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setViewTab(t)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                viewTab === t
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {t === "pending" ? `Pending (${pendingDebriefs.length})` : t === "completed" ? `Signed Off (${completedDebriefs.length})` : `All (${debriefs.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {(search || viewTab === "all") && (
        <p className="text-xs text-slate-500">
          Showing {filtered.length} of {debriefs.length} debrief{debriefs.length !== 1 ? "s" : ""}
          {search && <span className="text-slate-400"> matching &ldquo;{search}&rdquo;</span>}
        </p>
      )}

      {/* ── Debriefs list ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <ShieldAlert className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium">
            {search ? `No debriefs match "${search}"` : "No debriefs in this view"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => (
            <PIDebriefCard
              key={d.id}
              debrief={d}
              incident={getIncident(d.incident_id)}
              onUpdateDebrief={handleUpdateDebrief}
              onSignOff={setSigningOff}
              onAriaAnalysis={handleAriaAnalysis}
              ariaBusy={ariaBusy}
            />
          ))}
          {ariaError && (
            <p className="text-xs text-red-600 text-right">{ariaError}</p>
          )}
        </div>
      )}

      {/* ── Regulatory note ── */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-600">Regulatory Basis — </span>
        Children&apos;s Homes (England) Regulations 2015, Regulation 20: Use of restraint and measures of
        control, physical restraint or discipline. A record must be made of every use of restraint;
        post-incident debrief with the young person must occur within 24 hours; staff debrief before
        the next shift. Ofsted must be notified of any serious incident involving physical restraint.
        All PI records are primary evidence for ILACS inspection — a pattern of incomplete debriefs
        constitutes a regulatory risk and will be raised under Quality Standard 3 (Children&apos;s Rights).
      </div>

      {/* ── RM Sign-off Modal ── */}
      <Dialog open={!!signingOff} onOpenChange={(o) => { if (!o) { setSigningOff(null); setRmComments(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              RM Sign-off — {signingOff?.incident_id}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Confirm that both debriefs have been completed, notifications made, and learning has been documented.
              This sign-off will close the debrief record.
            </p>
            <Textarea
              value={rmComments}
              onChange={(e) => setRmComments(e.target.value)}
              placeholder="RM comments — confirm debriefs completed, technique was proportionate, any learning to note…"
              rows={4}
              className="text-sm"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSigningOff(null); setRmComments(""); }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSignOff}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? "Saving…" : "Sign Off"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>{/* close #pi-debriefs-content */}
      <AriaPanel
        mode="assist"
        pageContext="PI Debrief Register — physical intervention debriefs, Reg 20 compliance, restraint records, body map, staff debrief, child debrief, follow-up actions, Ofsted evidence"
        recordType="incident"
        className="mt-6"
      />
    </PageShell>
  );
}
