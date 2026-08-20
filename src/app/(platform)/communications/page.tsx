"use client";

import React, { useState, useMemo, useId } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, londonDisplay } from "@/lib/utils";
import {
  FileText, Send, CheckCircle2, Clock, Edit3,
  Sparkles, AlertTriangle, ChevronRight, Plus,
  Mail, Clipboard, Shield, Stethoscope,
  GraduationCap, Users, BookOpen, Archive,
  Eye, Copy, MessageSquare,
} from "lucide-react";
import {
  COMMUNICATION_TEMPLATES,
  type CommunicationType, type CommunicationStatus,
} from "@/lib/services/communication-intelligence";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import { useAuthContext } from "@/contexts/auth-context";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";

/** The row shape the store returns — CommunicationDraft, over the wire. */
interface DraftRow {
  id: string;
  communication_type: CommunicationType;
  title: string;
  content: string;
  status: CommunicationStatus;
  child_id: string | null;
  cara_generated: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
// ── Config ─────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<CommunicationType, React.ElementType> = {
  handover_summary: BookOpen,
  social_worker_update: Mail,
  reg44_section: Clipboard,
  reg45_section: Clipboard,
  incident_notification: AlertTriangle,
  missing_notification: AlertTriangle,
  placement_update: FileText,
  multi_agency_brief: Users,
  shift_briefing: Clock,
  professional_update: Send,
  management_summary: Eye,
  ofsted_notification: Shield,
};

const STATUS_STYLES: Record<CommunicationStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  review: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  sent: "bg-emerald-100 text-emerald-700",
  archived: "bg-slate-100 text-slate-500",
};

const STATUS_LABELS: Record<CommunicationStatus, string> = {
  draft: "Draft",
  review: "In Review",
  approved: "Approved",
  sent: "Sent",
  archived: "Archived",
};


// ── Main page ──────────────────────────────────────────────────────────────

type FilterTab = "all" | "draft" | "review" | "approved" | "sent";

/** The drafts this page shows, from the store that now exists behind it. */
function useDrafts(homeId: string) {
  return useQuery({
    queryKey: ["communications", homeId],
    queryFn: () =>
      api.get<{ ok: boolean; data: DraftRow[] }>(`/api/operations/communications?homeId=${homeId}`),
  });
}

/** One mutation for every action on a draft — the route dispatches on `action`,
 *  and each returns the updated row, so the list refetches once and agrees. */
function useDraftAction(homeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post("/api/operations/communications", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["communications", homeId] }),
  });
}

export default function CommunicationsPage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const author = currentUser?.full_name ?? "";
  const [filter, setFilter] = useState<FilterTab>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [composing, setComposing] = useState<CommunicationType | null>(null);
  const [editing, setEditing] = useState<DraftRow | null>(null);

  const { data, isLoading, isError, refetch } = useDrafts(homeId);
  const act = useDraftAction(homeId);
  const drafts: DraftRow[] = useMemo(() => data?.data ?? [], [data]);

  const filtered = useMemo(
    () => (filter === "all" ? drafts : drafts.filter((d) => d.status === filter)),
    [drafts, filter],
  );

  const selected = selectedId ? drafts.find((d) => d.id === selectedId) ?? null : null;

  const stats = {
    total: drafts.length,
    drafts: drafts.filter((d) => d.status === "draft").length,
    inReview: drafts.filter((d) => d.status === "review").length,
    sent: drafts.filter((d) => d.status === "sent").length,
    caraGenerated: drafts.filter((d) => d.cara_generated).length,
  };

  return (
    <PageShell title="Communications Centre" subtitle="Professional communication drafts with Cara writing support">
      <div className="space-y-6">
        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard label="Total Drafts" value={stats.total} icon={FileText} />
          <StatCard label="In Progress" value={stats.drafts} icon={Edit3} color="text-gray-600 bg-gray-50" />
          <StatCard label="In Review" value={stats.inReview} icon={Eye} color="text-amber-600 bg-amber-50" />
          <StatCard label="Sent" value={stats.sent} icon={Send} color="text-emerald-600 bg-emerald-50" />
          <StatCard label="Cara-Generated" value={stats.caraGenerated} icon={Sparkles} color="text-violet-600 bg-violet-50" />
        </div>

        {/* Actions bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "draft", "review", "approved", "sent"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                filter === tab ? "bg-[var(--cs-primary)] text-white" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200",
              )}
            >
              {tab === "all" ? "All" : STATUS_LABELS[tab as CommunicationStatus]}
            </button>
          ))}
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={() => setShowTemplates(!showTemplates)} className="gap-1.5">
            <Clipboard className="h-4 w-4" /> Templates
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setShowTemplates(true)}>
            <Plus className="h-4 w-4" /> New Draft
          </Button>
        </div>


        {/* Template picker */}
        {showTemplates && (
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" /> Cara Communication Templates
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(Object.entries(COMMUNICATION_TEMPLATES) as [CommunicationType, typeof COMMUNICATION_TEMPLATES[CommunicationType]][]).map(([key, tmpl]) => {
                  const Icon = TYPE_ICONS[key] ?? FileText;
                  return (
                    <button
                      key={key}
                      onClick={() => { setComposing(key); setShowTemplates(false); }}
                      className="text-left p-3 rounded-xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <Icon className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{tmpl.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{tmpl.description}</p>
                          {tmpl.regulationRef && (
                            <p className="text-[10px] text-violet-600 mt-1">{tmpl.regulationRef}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-6">
          {/* Draft list */}
          <div className={cn("space-y-3 transition-all", selected ? "w-1/2" : "w-full")}>
            {/* The list is a store read now, not a constant — so it has the two
                states a constant never had. An empty list must say WHY it is
                empty: nothing written yet, or nothing at this status. */}
            {isLoading && (
              <Card>
                <CardContent className="py-10 text-center text-sm text-[var(--cs-text-muted)]">
                  Loading drafts…
                </CardContent>
              </Card>
            )}

            {/* A failed read is NOT an empty store. If the list could not be
                loaded, saying "no drafts yet" is the fabricate-on-empty bug in
                its quietest form — it reports an absence Cara did not verify,
                about letters that may well exist. Say what actually happened. */}
            {!isLoading && isError && (
              <EmptyState
                icon={AlertTriangle}
                title="Drafts could not be loaded"
                description="This is not the same as having none — Cara could not reach the store, so it cannot say what is in it. Nothing has been lost; try again, and if it keeps failing the store needs looking at."
                actions={[{ label: "Try again", onClick: () => { void refetch(); } }]}
              />
            )}

            {!isLoading && !isError && filtered.length === 0 && (
              <EmptyState
                icon={filter === "all" ? Mail : Clock}
                title={
                  filter === "all"
                    ? "No communication drafts yet"
                    : `Nothing at “${STATUS_LABELS[filter]}”`
                }
                description={
                  filter === "all"
                    ? "Drafts written here — social worker updates, Reg 44 responses, Ofsted notifications — are saved and stay saved, so someone else can review them before they go out."
                    : `${drafts.length === 0 ? "No drafts have been written yet." : `${drafts.length} draft${drafts.length === 1 ? " is" : "s are"} at another status.`}`
                }
                actions={
                  filter === "all"
                    ? [{ label: "New draft", onClick: () => setShowTemplates(true), icon: Plus }]
                    : [{ label: "Show all drafts", onClick: () => setFilter("all"), variant: "outline" }]
                }
              />
            )}

            {filtered.map((draft) => {
              const Icon = TYPE_ICONS[draft.communication_type] ?? FileText;
              const template = COMMUNICATION_TEMPLATES[draft.communication_type];
              const isActive = draft.id === selectedId;

              return (
                <Card
                  key={draft.id}
                  className={cn(
                    "cursor-pointer transition-all",
                    isActive ? "ring-2 ring-[var(--cs-primary)] shadow-md" : "hover:shadow-sm",
                  )}
                  onClick={() => setSelectedId(isActive ? null : draft.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">{draft.title}</h4>
                          <Badge className={cn("text-[10px] shrink-0", STATUS_STYLES[draft.status])}>
                            {STATUS_LABELS[draft.status]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{template?.label ?? draft.communication_type}</span>
                          <span className="text-gray-300">|</span>
                          <span>By {draft.created_by}</span>
                          <span className="text-gray-300">|</span>
                          <span>{new Date(draft.created_at).toLocaleDateString("en-GB")}</span>
                          {draft.cara_generated && (
                            <>
                              <span className="text-gray-300">|</span>
                              <span className="flex items-center gap-1 text-violet-600">
                                <Sparkles className="h-3 w-3" /> Cara
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Preview panel */}
          {selected && (
            <div className="w-1/2 sticky top-4">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-900">{selected.title}</h3>
                    <Badge className={cn(STATUS_STYLES[selected.status])}>{STATUS_LABELS[selected.status]}</Badge>
                  </div>

                  {/* All four state changes work now. They were disabled in
                      #936/#938 because cs_communication_drafts did not exist,
                      so a status move would not have survived the next load —
                      the table is created and the service is dual-mode. */}
                  <div className="flex gap-2 mb-4">
                    {selected.status === "draft" && (
                      <>
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setEditing(selected)}>
                          <Edit3 className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs"
                          disabled={act.isPending}
                          onClick={() => act.mutate({ action: "submit_for_review", id: selected.id, userId: author })}
                        >
                          <Eye className="h-3.5 w-3.5" /> Submit for Review
                        </Button>
                      </>
                    )}
                    {selected.status === "review" && (
                      <Button
                        size="sm"
                        className="gap-1.5 text-xs"
                        disabled={act.isPending || !author}
                        title={author ? undefined : "Approving records who approved it — sign in first"}
                        onClick={() => act.mutate({ action: "approve", id: selected.id, userId: author })}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </Button>
                    )}
                    {selected.status === "approved" && (
                      <Button
                        size="sm"
                        className="gap-1.5 text-xs"
                        disabled={act.isPending}
                        onClick={() => act.mutate({ action: "mark_sent", id: selected.id })}
                      >
                        <Send className="h-3.5 w-3.5" /> Mark as Sent
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={() => {
                        void navigator.clipboard.writeText(selected.content);
                        setCopiedId(selected.id);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" /> {copiedId === selected.id ? "Copied" : "Copy"}
                    </Button>
                  </div>

                  {/* Content preview */}
                  <div className="bg-gray-50 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap text-xs leading-relaxed font-mono">
                      {selected.content}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
                    <span>Created by {selected.created_by}</span>
                    <span>|</span>
                    <span>{new Date(selected.created_at).toLocaleString("en-GB")}</span>
                    {selected.cara_generated && (
                      <>
                        <span>|</span>
                        <span className="flex items-center gap-1 text-violet-600">
                          <Sparkles className="h-3 w-3" /> Cara-generated draft
                        </span>
                      </>
                    )}
                  </div>

                  {/* Regulation reference */}
                  {COMMUNICATION_TEMPLATES[selected.communication_type]?.regulationRef && (
                    <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100">
                      <Shield className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-blue-700">
                        {COMMUNICATION_TEMPLATES[selected.communication_type].regulationRef}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Mounted only while open, keyed by subject, so each open session
          starts from a fresh seed via useState initializers — no reset effect. */}
      {composing && (
        <ComposeDraftDialog
          key={composing}
          type={composing}
          onClose={() => setComposing(null)}
          author={author}
          homeId={homeId}
          pending={act.isPending}
          error={act.isError ? (act.error as Error).message : ""}
          onSave={(title, content) =>
            act.mutate(
              { action: "create", homeId, type: composing, title, content, createdBy: author },
              { onSuccess: () => setComposing(null) },
            )
          }
        />
      )}

      {editing && (
        <EditDraftDialog
          key={editing.id}
          draft={editing}
          onClose={() => setEditing(null)}
          pending={act.isPending}
          error={act.isError ? (act.error as Error).message : ""}
          onSave={(title, content) =>
            act.mutate(
              { action: "update", id: editing.id, title, content, editedBy: author },
              { onSuccess: () => setEditing(null) },
            )
          }
        />
      )}
    </PageShell>
  );
}

/* ── Compose ───────────────────────────────────────────────────────────────
 *
 * The template supplies the SHAPE — its section headings — and nothing else.
 * Cara's four deterministic generators (handover, social-worker update, shift
 * briefing, management summary) need a context object built from records this
 * page does not load, so offering them here would be a button that half-works.
 * The scaffold is honest about being a scaffold: headings to write under, and
 * no sentences nobody wrote. */
function ComposeDraftDialog({
  type, onClose, author, homeId, pending, error, onSave,
}: {
  type: CommunicationType;
  onClose: () => void;
  author: string;
  homeId: string;
  pending: boolean;
  error: string;
  onSave: (title: string, content: string) => void;
}) {
  const uid = useId();
  // Mounted per open session (parent keys by type), so the template seed is
  // the initial state — reopening or switching template remounts fresh.
  const tmpl = COMMUNICATION_TEMPLATES[type];
  const [title, setTitle] = useState(
    () => `${tmpl.label} — ${londonDisplay({ day: "numeric", month: "long", year: "numeric" })}`,
  );
  const [content, setContent] = useState(
    () => (tmpl.sections ?? []).map((s: string) => `## ${s}\n\n`).join(""),
  );

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New {tmpl.label}</DialogTitle></DialogHeader>
        <p className="-mt-2 text-xs text-[var(--cs-text-muted)]">
          {tmpl.description}
          {tmpl.regulationRef && <span className="ml-1 text-violet-600">{tmpl.regulationRef}</span>}
        </p>

        <div className="space-y-4 py-2">
          <div>
            <label htmlFor={`${uid}-title`} className="mb-1 block text-sm font-medium">Title *</label>
            <Input id={`${uid}-title`} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label htmlFor={`${uid}-content`} className="mb-1 block text-sm font-medium">Content *</label>
            <Textarea
              id={`${uid}-content`}
              rows={14}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="font-mono text-xs"
              placeholder="The headings are the template's. The words are yours."
            />
          </div>
          <p className="text-xs text-[var(--cs-text-muted)]">
            Saved as a draft against {homeId}, created by {author || "not signed in"}. Someone else
            reviews and approves it before it is marked sent.
          </p>
        </div>

        {error && <p className="text-sm text-red-600">Nothing was saved — {error}. Your text is still here.</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(title.trim(), content.trim())} disabled={!title.trim() || !content.trim() || !author || pending}>
            {pending ? "Saving…" : "Save draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Edit ──────────────────────────────────────────────────────────────── */
function EditDraftDialog({
  draft, onClose, pending, error, onSave,
}: {
  draft: DraftRow;
  onClose: () => void;
  pending: boolean;
  error: string;
  onSave: (title: string, content: string) => void;
}) {
  const uid = useId();
  // Mounted per open session (parent keys by draft id), so the draft is the
  // initial state — a background refetch can no longer clobber mid-edit text.
  const [title, setTitle] = useState(draft.title);
  const [content, setContent] = useState(draft.content);

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit draft</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label htmlFor={`${uid}-etitle`} className="mb-1 block text-sm font-medium">Title *</label>
            <Input id={`${uid}-etitle`} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label htmlFor={`${uid}-econtent`} className="mb-1 block text-sm font-medium">Content *</label>
            <Textarea id={`${uid}-econtent`} rows={14} value={content} onChange={(e) => setContent(e.target.value)} className="font-mono text-xs" />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">Nothing was saved — {error}. Your edits are still here.</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(title.trim(), content.trim())} disabled={!title.trim() || !content.trim() || pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color?: string }) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", color ?? "text-blue-600 bg-blue-50")}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900">{value}</p>
          <p className="text-[10px] text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
