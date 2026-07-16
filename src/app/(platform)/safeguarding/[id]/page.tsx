"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — SAFEGUARDING CONCERN DETAIL
// Full record for a single safeguarding concern: disclosure, notifications,
// multi-agency actions, oversight, linked documents, and training loop.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EntryAssist } from "@/components/forms/entry-assist";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  Shield, ArrowLeft, AlertTriangle, Bell, FileText, CheckCircle2,
  Clock, User, MapPin, Loader2, AlertCircle, ChevronRight,
  Brain, Sparkles, Heart, Library, Phone, UserCheck, Gavel,
} from "lucide-react";
import { useIncident, useUpdateIncident } from "@/hooks/use-incidents";
import { usePermissions } from "@/hooks/use-permissions";
import { useCurrentUser } from "@/hooks/use-auth";
import { useAuthContext } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/lib/permissions";
import { INCIDENT_TYPE_LABELS } from "@/lib/constants";
import { getStaffName, getYPName, getYPById } from "@/lib/seed-data";
import { cn, formatDate, formatRelative } from "@/lib/utils";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraUsageBadge } from "@/components/cara/cara-usage-badge";
import { CaraContextLinker } from "@/components/cara/cara-context-linker";
import { CaraWriteToChild } from "@/components/cara/cara-write-to-child";
import { CaraOversightQuality } from "@/components/cara/cara-oversight-quality";
import { PrintButton } from "@/components/common/print-button";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { useDocumentIntelligence } from "@/hooks/use-doc-intelligence";
import { useCreateTrainingNeed } from "@/hooks/use-ri-learning";
import { DOCUMENT_CATEGORY_LABELS } from "@/types/documents";
import type { DocumentIntelRisk } from "@/types/documents";

// ── Severity config ───────────────────────────────────────────────────────────

const SEV_CONFIG: Record<string, {
  label: string; color: string; bg: string; badge: string; border: string; ring: string;
}> = {
  low:      { label: "Low",      color: "text-[var(--cs-text-secondary)]",  bg: "bg-slate-100",  badge: "bg-slate-100 text-[var(--cs-text-secondary)]",   border: "border-l-slate-400",  ring: "ring-slate-200"  },
  medium:   { label: "Medium",   color: "text-amber-700",  bg: "bg-amber-50",   badge: "bg-amber-100 text-amber-800",   border: "border-l-amber-500",  ring: "ring-[var(--cs-warning-soft)]"  },
  high:     { label: "High",     color: "text-orange-700", bg: "bg-orange-50",  badge: "bg-orange-100 text-orange-800", border: "border-l-orange-500", ring: "ring-orange-200" },
  critical: { label: "Critical", color: "text-red-700",    bg: "bg-red-50",     badge: "bg-red-100 text-red-800",       border: "border-l-red-600",    ring: "ring-[var(--cs-risk-soft)]"    },
};

const SG_SEV_PRIORITY: Record<string, "urgent" | "high" | "medium" | "low"> = {
  critical: "urgent", high: "high", medium: "medium", low: "low",
};

// ── Notification row ──────────────────────────────────────────────────────────

function NotificationRow({ n }: { n: { role: string; name: string; method: string; notified_at: string; acknowledged: boolean } }) {
  const icon =
    n.role.toLowerCase().includes("police") ? <Phone className="h-3 w-3 text-blue-500" /> :
    n.role.toLowerCase().includes("social") ? <UserCheck className="h-3 w-3 text-[var(--cs-cara-gold)]" /> :
    n.role.toLowerCase().includes("lado") || n.role.toLowerCase().includes("manager") ? <Gavel className="h-3 w-3 text-amber-500" /> :
    <Bell className="h-3 w-3 text-[var(--cs-text-muted)]" />;

  return (
    <div className={cn(
      "flex items-center justify-between rounded-xl px-3 py-2.5 border text-xs",
      n.acknowledged ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-[var(--cs-border)]"
    )}>
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <span className="font-semibold text-[var(--cs-navy)]">{n.role}:</span>
          <span className="text-[var(--cs-text-secondary)] ml-1">{n.name} — {n.method}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[var(--cs-text-muted)]">{formatRelative(n.notified_at.slice(0, 10))}</span>
        {n.acknowledged
          ? <span className="flex items-center gap-0.5 text-emerald-600 font-medium"><CheckCircle2 className="h-3.5 w-3.5" />Confirmed</span>
          : <span className="flex items-center gap-0.5 text-amber-600"><Clock className="h-3.5 w-3.5" />Awaiting</span>
        }
      </div>
    </div>
  );
}

// ── Oversight panel ───────────────────────────────────────────────────────────

function OversightPanel({ concernId, onSaved }: { concernId: string; onSaved: () => void }) {
  const currentUser = useCurrentUser();
  const updateIncident = useUpdateIncident();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  function handleSave() {
    if (!note.trim()) { setError("Please enter oversight notes"); return; }
    setError("");
    updateIncident.mutate(
      { id: concernId, action: "oversight", oversight_note: note.trim(), oversight_by: currentUser?.id ?? "staff_darren" },
      { onSuccess: () => onSaved(), onError: (e) => setError(e.message) }
    );
  }

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-rose-600" />
        <span className="text-sm font-semibold text-rose-900">Record Manager Oversight</span>
      </div>
      <p className="text-xs text-rose-700">
        Record your oversight of this safeguarding concern — review of response, referrals made,
        lessons for practice, and any outstanding actions.
      </p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="Oversight comments — referrals, strategy discussions, lessons, further actions…"
        className="w-full rounded-xl border border-rose-200 bg-white px-3.5 py-3 text-sm text-[var(--cs-text-secondary)] resize-none focus:outline-none focus:ring-2 focus:ring-rose-300 placeholder:text-[var(--cs-text-muted)]"
      />
      <EntryAssist value={note} onChange={setNote} sourceRecordType="safeguarding" className="mt-1" />
      {error && (
        <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />{error}
        </p>
      )}
      <Button size="sm" onClick={handleSave} disabled={updateIncident.isPending} className="gap-1.5 bg-rose-600 hover:bg-rose-700">
        {updateIncident.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
        Save Oversight
      </Button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SafeguardingConcernPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { can } = usePermissions();
  const { currentUser } = useAuthContext();

  const canManage    = can(PERMISSIONS.MANAGE_INCIDENTS);
  const canOversight = can(PERMISSIONS.MANAGE_SAFEGUARDING) || canManage;

  const incidentQ   = useIncident(id);
  const concern     = incidentQ.data?.data;
  const docsQuery   = useDocumentIntelligence();
  const createNeed  = useCreateTrainingNeed();

  const [showOversight, setShowOversight] = useState(false);
  const [showCara,      setShowCara]      = useState(false);
  const [needCreated,   setNeedCreated]   = useState(false);

  function handleSaved() {
    incidentQ.refetch();
    setShowOversight(false);
  }

  function handleCreateTrainingNeed() {
    if (!concern) return;
    createNeed.mutate(
      {
        home_id: concern.home_id,
        identified_by: "incident",
        need_type: "safeguarding",
        title: `Safeguarding training: ${INCIDENT_TYPE_LABELS[concern.type] || concern.type} — ${concern.reference}`,
        description: `Identified from safeguarding concern ${concern.reference}. ${concern.description.slice(0, 200)}…`,
        priority: SG_SEV_PRIORITY[concern.severity] ?? "high",
        status: "identified",
        cara_evidence: `Linked to safeguarding concern ${concern.reference} (${concern.severity} severity, type: ${concern.type}).`,
        created_by: currentUser?.id ?? "staff_darren",
      },
      { onSuccess: () => setNeedCreated(true) }
    );
  }

  // ── Loading / error states ────────────────────────────────────────────────

  if (incidentQ.isLoading) {
    return (
      <PageShell title="Safeguarding Concern" showQuickCreate={false}>
        <div className="flex items-center justify-center py-24 gap-2 text-[var(--cs-text-muted)]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading concern…</span>
        </div>
      </PageShell>
    );
  }

  if (incidentQ.isError || !concern) {
    return (
      <PageShell title="Safeguarding Concern" showQuickCreate={false}>
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="text-sm font-medium text-[var(--cs-text-secondary)]">Concern record not found</p>
          <Button size="sm" variant="outline" onClick={() => router.push("/safeguarding")}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />Back to Safeguarding
          </Button>
        </div>
      </PageShell>
    );
  }

  const sev  = SEV_CONFIG[concern.severity] ?? SEV_CONFIG.medium;
  const yp   = getYPById(concern.child_id);
  const ypName = getYPName(concern.child_id);
  const needsOversight = concern.requires_oversight && !concern.oversight_by;
  const linkedDocs = (docsQuery.data?.data ?? []).filter((d) => d.linked_incident_id === id);

  const caraContext = [
    `Safeguarding concern: ${concern.reference}`,
    `Type: ${INCIDENT_TYPE_LABELS[concern.type] || concern.type}`,
    `Severity: ${concern.severity}`,
    `Young person: ${ypName}`,
    `Date: ${formatDate(concern.date)} at ${concern.time}`,
    concern.location ? `Location: ${concern.location}` : null,
    `Description: ${concern.description}`,
    concern.immediate_action ? `Immediate action: ${concern.immediate_action}` : null,
    concern.notifications.length > 0
      ? `Notifications: ${concern.notifications.map((n) => `${n.role} (${n.acknowledged ? "acknowledged" : "awaiting"})`).join(", ")}`
      : null,
    concern.oversight_by
      ? `Oversight recorded by ${getStaffName(concern.oversight_by)}: ${concern.oversight_note}`
      : "No manager oversight recorded yet.",
  ].filter(Boolean).join("\n");

  return (
    <PageShell
      title={concern.reference}
      subtitle={`${INCIDENT_TYPE_LABELS[concern.type] || concern.type} · ${formatDate(concern.date)}`}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Safeguarding Referral" subtitle="Safeguarding Record" targetId="safeguarding-detail-content" />
          <SmartUploadButton
            variant="icon"
            linkedIncidentId={id}
            uploadContext={`Safeguarding ${concern.reference} — evidence upload`}
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowCara((p) => !p)}
          >
            <Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" />
            Cara Analysis
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push("/safeguarding")}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />All Concerns
          </Button>
        </div>
      }
    >
      <div id="safeguarding-detail-content" className="max-w-3xl space-y-5 animate-fade-in">

        {/* ── Cara Panel ────────────────────────────────────────────────────── */}
        {showCara && (
          <div className="relative">
            <button
              onClick={() => setShowCara(false)}
              className="absolute top-3 right-3 z-10 text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] text-xs"
            >✕ Close</button>
            <CaraPanel
              mode="safeguarding_scan"
              pageContext={`Safeguarding concern — ${concern.reference}`}
              recordType="safeguarding"
              sourceContent={caraContext}
            />
          </div>
        )}

        {/* ── Cara Context Links ─────────────────────────────────────────── */}
        <CaraContextLinker sourceTable="safeguarding_concerns" recordId={concern.id} className="mb-4" />

        {/* ── Write to Child — safeguarding ────────────────────────────────── */}
        <CaraWriteToChild
          source="incident"
          sourceText={concern.oversight_note || concern.description}
          sourceRecordId={concern.id}
          childName={ypName}
          childAge={yp?.date_of_birth ? Math.floor((Date.now() - new Date(yp.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : undefined}
          mode="post_save"
          className="mb-4"
        />

        {/* ── Severity banner ───────────────────────────────────────────────── */}
        <div className={cn(
          "rounded-2xl border border-l-4 p-4 flex items-center justify-between gap-3",
          sev.bg, sev.border
        )}>
          <div className="flex items-center gap-3">
            <div className={cn("rounded-full p-2 shrink-0", sev.bg)}>
              <Shield className={cn("h-5 w-5", sev.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", sev.badge)}>
                  {sev.label} severity
                </span>
                <Badge variant="outline" className="text-[10px] rounded-full">
                  {INCIDENT_TYPE_LABELS[concern.type] || concern.type}
                </Badge>
                {concern.status !== "open" && (
                  <Badge className={cn(
                    "text-[10px] rounded-full",
                    concern.status === "closed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {concern.status.replace("_", " ")}
                  </Badge>
                )}
                {concern.cara_oversight_used && (
                  <CaraUsageBadge caraAssisted sourceTable="incidents" recordId={concern.id} size="sm" />
                )}
              </div>
              <div className="text-xs text-[var(--cs-text-secondary)] mt-0.5">
                {formatDate(concern.date)} at {concern.time}
                {concern.location && ` · ${concern.location}`}
              </div>
            </div>
          </div>
          {needsOversight && canOversight && !showOversight && (
            <Button size="sm" className="bg-rose-600 hover:bg-rose-700 shrink-0" onClick={() => setShowOversight(true)}>
              <Shield className="h-3.5 w-3.5 mr-1" />Record Oversight
            </Button>
          )}
        </div>

        {/* ── Oversight required alert ──────────────────────────────────────── */}
        {needsOversight && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 flex items-center gap-2 text-sm text-rose-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span><strong>Manager oversight required</strong> — this safeguarding concern has not yet been reviewed by a manager.</span>
          </div>
        )}

        {/* ── Oversight panel ───────────────────────────────────────────────── */}
        {showOversight && (
          <OversightPanel concernId={concern.id} onSaved={handleSaved} />
        )}

        {/* ── Young person ──────────────────────────────────────────────────── */}
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Heart className="h-3.5 w-3.5 text-[var(--cs-cara-gold)]" />Young Person
          </h3>
          <div className="flex items-center gap-3">
            <Avatar name={ypName} size="md" className="bg-[var(--cs-cara-gold-bg)]" />
            <div>
              <div className="text-sm font-semibold text-[var(--cs-navy)]">{ypName}</div>
              {yp && (
                <div className="text-xs text-[var(--cs-text-muted)]">
                  Age {Math.floor((new Date().getTime() - new Date(yp.date_of_birth).getTime()) / (365.25 * 86400000))}
                  {" · "}{yp.legal_status}{" · "}{yp.local_authority}
                </div>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto text-xs"
              onClick={() => router.push(`/young-people/${concern.child_id}`)}
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

        {/* ── Concern detail ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl border bg-white p-5 space-y-4">
          <h3 className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" />Concern Record
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-[var(--cs-text-muted)] mb-0.5">Reported by</div>
              <div className="font-semibold text-[var(--cs-navy)]">{getStaffName(concern.reported_by)}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-[var(--cs-text-muted)] mb-0.5">Date &amp; Time</div>
              <div className="font-semibold text-[var(--cs-navy)]">{formatDate(concern.date)} · {concern.time}</div>
            </div>
            {concern.location && (
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-[var(--cs-text-muted)] mb-0.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />Location
                </div>
                <div className="font-semibold text-[var(--cs-navy)]">{concern.location}</div>
              </div>
            )}
            {concern.witnesses.length > 0 && (
              <div className="rounded-xl bg-slate-50 p-3 col-span-2 sm:col-span-1">
                <div className="text-[var(--cs-text-muted)] mb-0.5 flex items-center gap-1">
                  <User className="h-3 w-3" />Witnesses
                </div>
                <div className="font-semibold text-[var(--cs-navy)]">{concern.witnesses.join(", ")}</div>
              </div>
            )}
          </div>

          <div>
            <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-2">Disclosure / Description</div>
            <p className="text-sm text-[var(--cs-text-secondary)] leading-relaxed whitespace-pre-line">{concern.description}</p>
          </div>

          {concern.immediate_action && (
            <div>
              <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-2">Immediate Action Taken</div>
              <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
                <p className="text-sm text-[var(--cs-text-secondary)] leading-relaxed whitespace-pre-line">{concern.immediate_action}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Notifications ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl border bg-white p-5 space-y-3">
          <h3 className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider flex items-center gap-2">
            <Bell className="h-3.5 w-3.5" />
            Notifications & Referrals
            {concern.notifications.length > 0 && (
              <span className="ml-auto text-[10px] text-[var(--cs-text-muted)] font-normal">{concern.notifications.length} made</span>
            )}
          </h3>
          {concern.notifications.length === 0 ? (
            <p className="text-xs text-[var(--cs-text-muted)] py-2">
              No notifications recorded. Add notifications via the incident record if referrals have been made.
            </p>
          ) : (
            <div className="space-y-2">
              {concern.notifications.map((n, i) => <NotificationRow key={i} n={n} />)}
            </div>
          )}
        </div>

        {/* ── Manager oversight record ──────────────────────────────────────── */}
        {concern.oversight_by && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <h3 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5" />Manager Oversight Recorded
            </h3>
            <div className="text-xs text-[var(--cs-text-muted)] mb-2">
              By <strong className="text-[var(--cs-text-secondary)]">{getStaffName(concern.oversight_by)}</strong>
              {concern.oversight_at && <span className="ml-1">· {formatRelative(concern.oversight_at.slice(0, 10))}</span>}
            </div>
            <p className="text-sm text-[var(--cs-text-secondary)] leading-relaxed whitespace-pre-line">{concern.oversight_note}</p>

            {/* Cara Oversight Quality Check */}
            {concern.oversight_note && (
              <CaraOversightQuality
                oversightText={concern.oversight_note}
                recordType="safeguarding"
                recordReference={concern.reference}
                className="mt-3"
              />
            )}
          </div>
        )}

        {/* ── Outcome / closure ─────────────────────────────────────────────── */}
        {concern.status === "closed" && concern.outcome && (
          <div className="rounded-2xl border bg-white p-5 space-y-3">
            <h3 className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />Outcome &amp; Closure
            </h3>
            <div>
              <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-1.5">Outcome</div>
              <p className="text-sm text-[var(--cs-text-secondary)] whitespace-pre-line">{concern.outcome}</p>
            </div>
            {concern.lessons_learned && (
              <div>
                <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-1.5">Lessons Learned</div>
                <p className="text-sm text-[var(--cs-text-secondary)] whitespace-pre-line">{concern.lessons_learned}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Training Intelligence Loop ────────────────────────────────────── */}
        <div className="rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)]/40 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-[var(--cs-cara-gold)]" />
            <span className="text-sm font-semibold text-[var(--cs-navy)]">Training Intelligence Loop</span>
          </div>
          <p className="text-xs text-[var(--cs-cara-gold)]">
            Create a safeguarding training need from this concern. Cara will generate targeted
            learning resources and the evidence feeds directly into your Reg 45 and governance loop.
          </p>
          {!needCreated ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-[var(--cs-cara-gold)] border-[var(--cs-cara-gold-soft)] hover:bg-[var(--cs-cara-gold-bg)]"
              onClick={handleCreateTrainingNeed}
              disabled={createNeed.isPending}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {createNeed.isPending ? "Creating…" : "Create Safeguarding Training Need"}
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-emerald-700 font-medium">Training need created</span>
              <Link href="/learning/training-needs" className="ml-auto text-xs text-[var(--cs-cara-gold)] underline hover:text-[var(--cs-navy)]">
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
              uploadContext={`Safeguarding ${concern.reference} — evidence upload`}
            />
          </div>
          {linkedDocs.length === 0 ? (
            <p className="text-xs text-[var(--cs-text-muted)] py-2">
              No documents linked yet. Upload risk assessments, referral letters, or strategy discussion notes using the button above.
            </p>
          ) : (
            <div className="space-y-2">
              {linkedDocs.map((doc) => (
                <div key={doc.id} className={cn(
                  "flex items-start gap-3 rounded-xl border px-3 py-2.5",
                  doc.ai_risk_level === "high" || doc.ai_risk_level === "critical" ? "border-red-200 bg-red-50/40"
                  : doc.ai_risk_level === "medium" ? "border-amber-200 bg-amber-50/40"
                  : "border-[var(--cs-border-subtle)] bg-slate-50"
                )}>
                  <FileText className="h-3.5 w-3.5 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--cs-navy)] truncate">{doc.original_file_name}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      {doc.document_category && DOCUMENT_CATEGORY_LABELS[doc.document_category] && (
                        <span className="text-[10px] text-[var(--cs-text-muted)]">
                          {DOCUMENT_CATEGORY_LABELS[doc.document_category]}
                        </span>
                      )}
                      {doc.ai_risk_level && doc.ai_risk_level !== "low" && (
                        <Badge className={cn(
                          "text-[9px] h-3.5 px-1 rounded-full",
                          doc.ai_risk_level === "high" || doc.ai_risk_level === "critical"
                            ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                        )}>{doc.ai_risk_level} risk</Badge>
                      )}
                      <span className="text-[10px] text-[var(--cs-text-muted)] capitalize">
                        {doc.document_status?.replace("_", " ")}
                      </span>
                    </div>
                    {doc.ai_summary && (
                      <p className="text-[11px] text-[var(--cs-text-muted)] mt-1 leading-relaxed line-clamp-2">
                        {doc.ai_summary}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Regulatory note ───────────────────────────────────────────────── */}
        <div className="rounded-xl border border-[var(--cs-border)] bg-slate-50 p-4">
          <div className="flex items-start gap-2.5">
            <Shield className="h-3.5 w-3.5 text-[var(--cs-text-muted)] mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-1">
                Regulatory Framework — Safeguarding
              </p>
              <p className="text-[10px] text-[var(--cs-text-muted)] leading-relaxed">
                This record is subject to Working Together to Safeguard Children 2023, Children Act 1989 s47,
                and local authority safeguarding procedures. Manager oversight is required within 24 hours of
                a critical or high-severity concern. Records may be inspected by Ofsted (ILACS framework).
              </p>
            </div>
          </div>
        </div>

      </div>
    </PageShell>
  );
}
