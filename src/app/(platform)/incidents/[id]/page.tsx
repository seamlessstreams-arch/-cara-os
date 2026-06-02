"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — INCIDENT DETAIL PAGE
// Full record for a single incident: description, immediate action, notifications,
// oversight, linked tasks, body map, outcome and lessons learned.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  AlertTriangle, ArrowLeft, Calendar, Clock, MapPin, User,
  CheckCircle2, XCircle, Bell, FileText, Shield, ClipboardCheck,
  Loader2, AlertCircle, ChevronRight, Heart, BookOpen,
  Brain, Sparkles, Library,
} from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";
import { useIncident, useUpdateIncident } from "@/hooks/use-incidents";
import { usePermissions } from "@/hooks/use-permissions";
import { useCurrentUser } from "@/hooks/use-auth";
import { PERMISSIONS } from "@/lib/permissions";
import { INCIDENT_TYPE_LABELS } from "@/lib/constants";
import { getStaffName, getYPName, getYPById } from "@/lib/seed-data";
import { cn, formatDate, formatRelative } from "@/lib/utils";
import { AriaQuickActions } from "@/components/intelligence/aria-quick-actions";
import { AriaUsageBadge } from "@/components/aria/aria-usage-badge";
import { AriaContextLinker } from "@/components/aria/aria-context-linker";
import { AriaWriteToChild } from "@/components/aria/aria-write-to-child";
import { AriaOversightQuality } from "@/components/aria/aria-oversight-quality";
import { StudioQuickActions } from "@/components/aria-studio/studio-quick-actions";
import { PrintButton } from "@/components/common/print-button";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { useDocumentIntelligence } from "@/hooks/use-doc-intelligence";
import { useCreateTrainingNeed } from "@/hooks/use-ri-learning";
import { DOCUMENT_CATEGORY_LABELS } from "@/types/documents";
import Link from "next/link";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

// ── Severity config ───────────────────────────────────────────────────────────
const SEV_CONFIG: Record<string, { label: string; color: string; bg: string; badge: string; border: string }> = {
  low:      { label: "Low",      color: "text-[var(--cs-text-secondary)]",   bg: "bg-slate-100",   badge: "bg-slate-100 text-[var(--cs-text-secondary)]",   border: "border-l-slate-400"  },
  medium:   { label: "Medium",   color: "text-amber-600",   bg: "bg-amber-50",    badge: "bg-amber-100 text-amber-800",   border: "border-l-amber-500"  },
  high:     { label: "High",     color: "text-orange-600",  bg: "bg-orange-50",   badge: "bg-orange-100 text-orange-800", border: "border-l-orange-500" },
  critical: { label: "Critical", color: "text-red-600",     bg: "bg-red-50",      badge: "bg-red-100 text-red-800",       border: "border-l-red-600"    },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open:         { label: "Open",         color: "text-red-600",     bg: "bg-red-50 border-red-200"     },
  under_review: { label: "Under Review", color: "text-amber-600",   bg: "bg-amber-50 border-amber-200" },
  closed:       { label: "Closed",       color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
};

// ── Oversight Panel ───────────────────────────────────────────────────────────
interface OversightPanelProps {
  incidentId: string;
  onSaved: () => void;
}

function OversightPanel({ incidentId, onSaved }: OversightPanelProps) {
  const currentUser = useCurrentUser();
  const updateIncident = useUpdateIncident();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  function handleSave() {
    if (!note.trim()) { setError("Please enter oversight notes"); return; }
    setError("");
    updateIncident.mutate(
      { id: incidentId, action: "oversight", oversight_note: note.trim(), oversight_by: currentUser?.id ?? "staff_darren" },
      {
        onSuccess: () => onSaved(),
        onError: (e) => setError(e.message),
      }
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-semibold text-amber-800">Record Manager Oversight</span>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="Record your oversight comments — review of response, lessons, any further actions required…"
        className="w-full rounded-xl border border-amber-200 bg-white px-3.5 py-3 text-sm text-[var(--cs-text-secondary)] resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-[var(--cs-text-muted)]"
      />
      {error && (
        <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />{error}
        </p>
      )}
      <Button size="sm" onClick={handleSave} disabled={updateIncident.isPending} className="gap-1.5">
        {updateIncident.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
        Save Oversight
      </Button>
    </div>
  );
}

// ── Outcome Panel ─────────────────────────────────────────────────────────────
interface OutcomePanelProps {
  incidentId: string;
  currentOutcome: string | null;
  currentLessons: string | null;
  onSaved: () => void;
}

function OutcomePanel({ incidentId, currentOutcome, currentLessons, onSaved }: OutcomePanelProps) {
  const currentUser = useCurrentUser();
  const updateIncident = useUpdateIncident();
  const [outcome, setOutcome] = useState(currentOutcome ?? "");
  const [lessons, setLessons] = useState(currentLessons ?? "");
  const [error, setError] = useState("");

  function handleClose() {
    if (!outcome.trim()) { setError("Outcome is required to close an incident"); return; }
    setError("");
    updateIncident.mutate(
      {
        id: incidentId,
        status: "closed",
        outcome: outcome.trim(),
        lessons_learned: lessons.trim() || null,
        updated_by: currentUser?.id ?? "staff_darren",
      },
      {
        onSuccess: () => onSaved(),
        onError: (e) => setError(e.message),
      }
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4 space-y-3">
      <h4 className="text-sm font-semibold text-[var(--cs-navy)]">Close Incident</h4>
      <div>
        <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Outcome <span className="text-red-500">*</span></label>
        <textarea
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          rows={2}
          placeholder="Summarise the outcome and resolution…"
          className="w-full rounded-xl border border-[var(--cs-border)] bg-slate-50 px-3.5 py-3 text-sm text-[var(--cs-text-secondary)] resize-none focus:outline-none focus:ring-2 focus:ring-slate-400 placeholder:text-[var(--cs-text-muted)]"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Lessons Learned</label>
        <textarea
          value={lessons}
          onChange={(e) => setLessons(e.target.value)}
          rows={2}
          placeholder="What could be done differently? What will change as a result?"
          className="w-full rounded-xl border border-[var(--cs-border)] bg-slate-50 px-3.5 py-3 text-sm text-[var(--cs-text-secondary)] resize-none focus:outline-none focus:ring-2 focus:ring-slate-400 placeholder:text-[var(--cs-text-muted)]"
        />
      </div>
      {error && (
        <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />{error}
        </p>
      )}
      <Button size="sm" onClick={handleClose} disabled={updateIncident.isPending} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
        {updateIncident.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
        Close Incident
      </Button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { can } = usePermissions();

  const canManage    = can(PERMISSIONS.MANAGE_INCIDENTS);
  const canOversight = can(PERMISSIONS.MANAGE_SAFEGUARDING) || canManage;

  const incidentQ = useIncident(id);
  const incident  = incidentQ.data?.data;

  const [showOversight, setShowOversight] = useState(false);
  const [showOutcome,   setShowOutcome]   = useState(false);
  const [needCreated,   setNeedCreated]   = useState(false);

  const { currentUser } = useAuthContext();
  const docsQuery   = useDocumentIntelligence();
  const createNeed  = useCreateTrainingNeed();

  function handleSaved() {
    incidentQ.refetch();
    setShowOversight(false);
    setShowOutcome(false);
  }

  function handleCreateTrainingNeed() {
    if (!incident) return;
    const priority = incident.severity === "critical" ? "urgent"
      : incident.severity === "high" ? "high"
      : incident.severity === "medium" ? "medium" : "low";
    createNeed.mutate(
      {
        home_id: incident.home_id,
        identified_by: "incident",
        need_type: "safeguarding",
        title: `Training need from incident: ${incident.reference}`,
        description: `Identified from ${INCIDENT_TYPE_LABELS[incident.type]} incident. ${incident.description.slice(0, 200)}…`,
        priority,
        status: "identified",
        aria_evidence: `Linked to incident ${incident.reference} (${incident.severity} severity).`,
        created_by: currentUser?.id ?? "staff_darren",
      },
      { onSuccess: () => setNeedCreated(true) }
    );
  }

  if (incidentQ.isLoading) {
    return (
      <PageShell title="Incident" showQuickCreate={false}>
        <div className="flex items-center justify-center py-24 gap-2 text-[var(--cs-text-muted)]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading incident…</span>
        </div>
      </PageShell>
    );
  }

  if (incidentQ.isError || !incident) {
    return (
      <PageShell title="Incident" showQuickCreate={false}>
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="text-sm font-medium text-[var(--cs-text-secondary)]">Incident not found</p>
          <Button size="sm" variant="outline" onClick={() => router.push("/incidents")}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />Back to Incidents
          </Button>
        </div>
      </PageShell>
    );
  }

  const sev  = SEV_CONFIG[incident.severity] ?? SEV_CONFIG.low;
  const stat = STATUS_CONFIG[incident.status] ?? STATUS_CONFIG.open;
  const yp   = getYPById(incident.child_id);
  const ypName = getYPName(incident.child_id);
  const needsOversight = incident.requires_oversight && !incident.oversight_by;
  const linkedDocs = (docsQuery.data?.data ?? []).filter((d) => d.linked_incident_id === id);

  return (
    <PageShell
      title={incident.reference}
      subtitle={`${INCIDENT_TYPE_LABELS[incident.type]} · ${formatDate(incident.date)}`}
      ariaContext={{ pageTitle: "Incident Record", sourceType: "incident" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Incident Report" subtitle="Oak House — Incident Record" targetId="incident-detail-content" />
          <SmartUploadButton
            variant="icon"
            linkedIncidentId={id}
            uploadContext={`Incident ${incident.reference} — evidence upload`}
          />
          <Button variant="outline" size="sm" onClick={() => router.push("/incidents")}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />All Incidents
          </Button>
          <AriaStudioQuickActionButton context={{ record_type: "incident", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="incident-detail-content" className="max-w-3xl space-y-5 animate-fade-in">

        {/* ── Status banner ─────────────────────────────────────────────────── */}
        <div className={cn("rounded-2xl border p-4 flex items-center justify-between gap-3", stat.bg)}>
          <div className="flex items-center gap-3">
            <div className={cn("rounded-full p-2", sev.bg)}>
              <AlertTriangle className={cn("h-5 w-5", sev.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", sev.badge)}>
                  {sev.label}
                </span>
                <Badge className={cn("text-[10px] rounded-full border", stat.bg, stat.color)}>
                  {stat.label}
                </Badge>
                {incident.aria_oversight_used && (
                  <AriaUsageBadge
                    ariaAssisted
                    sourceTable="incidents"
                    recordId={incident.id}
                    size="sm"
                  />
                )}
              </div>
              <div className="text-xs text-[var(--cs-text-secondary)] mt-0.5">
                {INCIDENT_TYPE_LABELS[incident.type]} · {formatDate(incident.date)} at {incident.time}
                {incident.location && ` · ${incident.location}`}
              </div>
            </div>
          </div>
          {needsOversight && canOversight && !showOversight && (
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 shrink-0" onClick={() => setShowOversight(true)}>
              <Shield className="h-3.5 w-3.5 mr-1" />Add Oversight
            </Button>
          )}
          {incident.status === "open" && canManage && !showOutcome && (
            <Button size="sm" variant="outline" className="shrink-0" onClick={() => setShowOutcome(true)}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Close Incident
            </Button>
          )}
        </div>

        {/* ── Oversight needed alert ────────────────────────────────────────── */}
        {needsOversight && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-2 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span><strong>Manager oversight required</strong> — this incident has not yet been reviewed by a manager.</span>
          </div>
        )}

        {/* ── ARIA Intelligence Strip ──────────────────────────────────────── */}
        {canOversight && (
          <div className="rounded-2xl border border-[var(--cs-aria-gold-soft)] bg-[var(--cs-aria-gold-bg)]/50 px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-[var(--cs-navy)]">
              <Sparkles className="h-4 w-4 shrink-0 text-[var(--cs-aria-gold)]" />
              <span><strong>ARIA Intelligence</strong> — generate suggestions and oversight drafts for this incident</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href={`/aria/review?related_record_id=${incident.id}`}>
                <Button size="sm" variant="outline" className="text-[var(--cs-aria-gold)] border-[var(--cs-aria-gold-soft)] hover:bg-[var(--cs-aria-gold-bg)] gap-1.5">
                  <ClipboardCheck className="h-3.5 w-3.5" />Review with ARIA
                </Button>
              </Link>
              <Link href={`/intelligence/aria/management-oversight?incidentId=${incident.id}&severity=${incident.severity}&type=${incident.type}`}>
                <Button size="sm" className="bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 gap-1.5">
                  <Brain className="h-3.5 w-3.5" />Draft with ARIA
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* ── Oversight panel ───────────────────────────────────────────────── */}
        {showOversight && (
          <OversightPanel incidentId={incident.id} onSaved={handleSaved} />
        )}

        {/* ── Outcome / close panel ─────────────────────────────────────────── */}
        {showOutcome && (
          <OutcomePanel
            incidentId={incident.id}
            currentOutcome={incident.outcome}
            currentLessons={incident.lessons_learned}
            onSaved={handleSaved}
          />
        )}

        {/* ── Young person ──────────────────────────────────────────────────── */}
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Heart className="h-3.5 w-3.5 text-[var(--cs-aria-gold)]" />Young Person
          </h3>
          <div className="flex items-center gap-3">
            <Avatar name={ypName} size="md" className="bg-[var(--cs-aria-gold-bg)]" />
            <div>
              <div className="text-sm font-semibold text-[var(--cs-navy)]">{ypName}</div>
              {yp && (
                <div className="text-xs text-[var(--cs-text-muted)]">
                  Age {Math.floor((new Date().getTime() - new Date(yp.date_of_birth).getTime()) / (365.25 * 86400000))} · {yp.legal_status} · {yp.local_authority}
                </div>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto text-xs"
              onClick={() => router.push(`/young-people`)}
            >
              View Profile <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
          {yp && (yp.risk_flags?.length ?? 0) > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(yp.risk_flags ?? []).map((flag) => (
                <Badge key={flag} variant="warning" className="text-[9px] rounded-full gap-0.5">
                  <AlertTriangle className="h-2.5 w-2.5 shrink-0" />{flag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* ── Incident description ──────────────────────────────────────────── */}
        <div className="rounded-2xl border bg-white p-5 space-y-4">
          <h3 className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" />Incident Record
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-[var(--cs-text-muted)] mb-0.5">Reported by</div>
              <div className="font-semibold text-[var(--cs-navy)]">{getStaffName(incident.reported_by)}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-[var(--cs-text-muted)] mb-0.5">Date &amp; Time</div>
              <div className="font-semibold text-[var(--cs-navy)]">{formatDate(incident.date)} · {incident.time}</div>
            </div>
            {incident.location && (
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-[var(--cs-text-muted)] mb-0.5 flex items-center gap-1"><MapPin className="h-3 w-3" />Location</div>
                <div className="font-semibold text-[var(--cs-navy)]">{incident.location}</div>
              </div>
            )}
            {incident.witnesses.length > 0 && (
              <div className="rounded-xl bg-slate-50 p-3 col-span-2 sm:col-span-1">
                <div className="text-[var(--cs-text-muted)] mb-0.5 flex items-center gap-1"><User className="h-3 w-3" />Witnesses</div>
                <div className="font-semibold text-[var(--cs-navy)]">{incident.witnesses.join(", ")}</div>
              </div>
            )}
          </div>

          <div>
            <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-2">Description</div>
            <p className="text-sm text-[var(--cs-text-secondary)] leading-relaxed whitespace-pre-line">{incident.description}</p>
          </div>

          {incident.immediate_action && (
            <div>
              <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-2">Immediate Action Taken</div>
              <p className="text-sm text-[var(--cs-text-secondary)] leading-relaxed whitespace-pre-line">{incident.immediate_action}</p>
            </div>
          )}
        </div>

        {/* ── Notifications ─────────────────────────────────────────────────── */}
        {incident.notifications.length > 0 && (
          <div className="rounded-2xl border bg-white p-5">
            <h3 className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Bell className="h-3.5 w-3.5" />Notifications Made ({incident.notifications.length})
            </h3>
            <div className="space-y-2">
              {incident.notifications.map((n, i) => (
                <div key={i} className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-2.5 border text-xs",
                  n.acknowledged ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-[var(--cs-border)]"
                )}>
                  <div>
                    <span className="font-semibold text-[var(--cs-navy)]">{n.role}:</span>
                    <span className="text-[var(--cs-text-secondary)] ml-1">{n.name} — {n.method}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[var(--cs-text-muted)]">{formatRelative(n.notified_at.slice(0, 10))}</span>
                    {n.acknowledged
                      ? <span className="flex items-center gap-0.5 text-emerald-600 font-medium"><CheckCircle2 className="h-3.5 w-3.5" />Acknowledged</span>
                      : <span className="flex items-center gap-0.5 text-amber-600"><Clock className="h-3.5 w-3.5" />Awaiting</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Manager oversight ─────────────────────────────────────────────── */}
        {incident.oversight_by && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <h3 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5" />Manager Oversight Completed
            </h3>
            <div className="text-xs text-[var(--cs-text-muted)] mb-2">
              By <strong className="text-[var(--cs-text-secondary)]">{getStaffName(incident.oversight_by)}</strong>
              {incident.oversight_at && <span className="ml-1">· {formatRelative(incident.oversight_at.slice(0, 10))}</span>}
            </div>
            <p className="text-sm text-[var(--cs-text-secondary)] leading-relaxed whitespace-pre-line">{incident.oversight_note}</p>

            {/* ARIA Oversight Quality Check */}
            {incident.oversight_note && (
              <AriaOversightQuality
                oversightText={incident.oversight_note}
                recordType="incident"
                recordReference={incident.reference}
                className="mt-3"
              />
            )}
          </div>
        )}

        {/* ── Outcome & lessons ─────────────────────────────────────────────── */}
        {incident.status === "closed" && (
          <div className="rounded-2xl border bg-white p-5 space-y-3">
            <h3 className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider flex items-center gap-2">
              <ClipboardCheck className="h-3.5 w-3.5" />Outcome &amp; Closure
            </h3>
            {incident.outcome && (
              <div>
                <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-1.5">Outcome</div>
                <p className="text-sm text-[var(--cs-text-secondary)] whitespace-pre-line">{incident.outcome}</p>
              </div>
            )}
            {incident.lessons_learned && (
              <div>
                <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-1.5">Lessons Learned</div>
                <p className="text-sm text-[var(--cs-text-secondary)] whitespace-pre-line">{incident.lessons_learned}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Body map ──────────────────────────────────────────────────────── */}
        {incident.body_map_required && (
          <div className={cn(
            "rounded-2xl border p-4 flex items-center gap-3 text-sm",
            incident.body_map_completed ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
          )}>
            <User className={cn("h-4 w-4 shrink-0", incident.body_map_completed ? "text-emerald-600" : "text-amber-600")} />
            <span className={incident.body_map_completed ? "text-emerald-800" : "text-amber-800"}>
              <strong>Body map {incident.body_map_completed ? "completed" : "required but not yet completed"}</strong>
              {incident.body_map_completed && " — attached to incident record"}
            </span>
            {!incident.body_map_completed && (
              <Badge variant="warning" className="ml-auto text-[9px] rounded-full shrink-0">Action required</Badge>
            )}
          </div>
        )}

        {/* ── Linked items ──────────────────────────────────────────────────── */}
        {incident.linked_task_ids.length > 0 && (
          <div className="rounded-2xl border bg-white p-4">
            <h3 className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5" />Linked Tasks ({incident.linked_task_ids.length})
            </h3>
            <div className="space-y-1.5">
              {incident.linked_task_ids.map((taskId) => (
                <button
                  key={taskId}
                  onClick={() => router.push(`/tasks/${taskId}`)}
                  className="w-full flex items-center gap-2 rounded-xl bg-slate-50 hover:bg-[var(--cs-surface)] px-3 py-2 text-xs text-left transition-colors"
                >
                  <ClipboardCheck className="h-3.5 w-3.5 text-[var(--cs-text-muted)] shrink-0" />
                  <span className="flex-1 text-[var(--cs-text-secondary)] font-medium">{taskId}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Training Need ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[var(--cs-aria-gold-soft)] bg-[var(--cs-aria-gold-bg)]/40 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-[var(--cs-aria-gold)]" />
            <span className="text-sm font-semibold text-[var(--cs-navy)]">Training Intelligence Loop</span>
          </div>
          <p className="text-xs text-[var(--cs-aria-gold)]">
            Create a training need linked to this incident. ARIA will generate learning resources
            to address the underlying risk and close the loop from incident to evidence.
          </p>
          {!needCreated ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-[var(--cs-aria-gold)] border-[var(--cs-aria-gold-soft)] hover:bg-[var(--cs-aria-gold-bg)]"
              onClick={handleCreateTrainingNeed}
              disabled={createNeed.isPending}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {createNeed.isPending ? "Creating…" : "Create Training Need from this Incident"}
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-emerald-700 font-medium">Training need created</span>
              <Link href="/learning/training-needs" className="ml-auto text-xs text-[var(--cs-aria-gold)] underline hover:text-[var(--cs-navy)]">
                View in Learning Studio →
              </Link>
            </div>
          )}
        </div>

        {/* ── Linked Documents ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border bg-white p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider flex items-center gap-2">
              <Library className="h-3.5 w-3.5" />Linked Documents ({linkedDocs.length})
            </h3>
            <SmartUploadButton
              variant="inline"
              label="Upload Evidence"
              linkedIncidentId={id}
              uploadContext={`Incident ${incident.reference} — evidence upload`}
            />
          </div>
          {linkedDocs.length === 0 ? (
            <p className="text-xs text-[var(--cs-text-muted)] py-2">
              No documents linked yet. Upload evidence, body maps, or external reports using the button above.
            </p>
          ) : (
            <div className="space-y-2">
              {linkedDocs.map((doc) => (
                <div key={doc.id} className={cn(
                  "flex items-start gap-3 rounded-xl border px-3 py-2.5",
                  doc.ai_risk_level === "high" ? "border-red-200 bg-red-50/40"
                  : doc.ai_risk_level === "medium" ? "border-amber-200 bg-amber-50/40"
                  : "border-[var(--cs-border-subtle)] bg-slate-50"
                )}>
                  <FileText className="h-3.5 w-3.5 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--cs-navy)] truncate">{doc.original_file_name}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      {doc.document_category && DOCUMENT_CATEGORY_LABELS[doc.document_category] && (
                        <span className="text-[10px] text-[var(--cs-text-muted)]">{DOCUMENT_CATEGORY_LABELS[doc.document_category]}</span>
                      )}
                      {doc.ai_risk_level && doc.ai_risk_level !== "low" && (
                        <Badge className={cn("text-[9px] h-3.5 px-1 rounded-full",
                          doc.ai_risk_level === "high" ? "bg-red-100 text-red-700"
                          : doc.ai_risk_level === "medium" ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-[var(--cs-text-secondary)]"
                        )}>{doc.ai_risk_level} risk</Badge>
                      )}
                      <span className="text-[10px] text-[var(--cs-text-muted)] capitalize">{doc.document_status?.replace("_", " ")}</span>
                    </div>
                    {doc.ai_summary && (
                      <p className="text-[11px] text-[var(--cs-text-muted)] mt-1 leading-relaxed line-clamp-2">{doc.ai_summary}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Writing to the Child ──────────────────────────────────────── */}
        <AriaWriteToChild
          source="incident"
          sourceText={incident.oversight_note || incident.description}
          sourceRecordId={incident.id}
          childName={getYPName(incident.child_id)}
          mode="post_save"
        />

        {/* ── ARIA Context Links ─────────────────────────────────────────── */}
        <AriaContextLinker
          sourceTable="incidents"
          recordId={incident.id}
        />

        {/* ── ARIA Quick Actions ────────────────────────────────────────────── */}
        <AriaQuickActions
          childId={incident.child_id}
          sourceType="incident"
          sourceId={incident.id}
        />
        <StudioQuickActions
          childId={incident.child_id}
          sourceType="incident"
          sourceId={incident.id}
        />

        <CareEventsPanel
          title="Related Care Events"
          childId={incident.child_id ?? undefined}
          days={14}
          defaultCollapsed
          className="mt-6"
        />
        <AriaPanel
          mode="assist"
          pageContext="Incident Record — incident detail, witness statements, body map, Reg 40 notification, police referral, safeguarding, debrief, follow-up actions, Reg 45 evidence"
          recordType="incident"
          className="mt-6"
        />
      </div>
    </PageShell>
  );
}
