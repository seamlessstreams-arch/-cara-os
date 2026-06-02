"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  CheckCircle2,
  Users,
  Clock,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

import type {
  ContactSupervisionSession,
  ContactSessionType,
  SupervisionLevel,
  ContactSessionOutcome,
  ContactSessionPerson,
} from "@/types/extended";
import {
  CONTACT_SESSION_TYPE_LABEL,
  SUPERVISION_LEVEL_LABEL,
  CONTACT_SESSION_OUTCOME_LABEL,
  CONTACT_SESSION_PERSON_LABEL,
} from "@/types/extended";

import {
  useContactSupervisionSessions,
  useCreateContactSupervisionSession,
} from "@/hooks/use-contact-supervision-sessions";

import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── local colour maps ────────────────────────────────────────────────── */

const OUTCOME_COLOURS: Record<ContactSessionOutcome, string> = {
  positive: "bg-green-100 text-green-800", mixed: "bg-amber-100 text-amber-800",
  concerning: "bg-red-100 text-red-800", did_not_attend: "bg-gray-100 text-gray-700",
  cancelled_by_family: "bg-orange-100 text-orange-800", cancelled_by_sw: "bg-purple-100 text-purple-800",
};

const LEVEL_COLOURS: Record<SupervisionLevel, string> = {
  supervised: "bg-red-100 text-red-800", supported: "bg-amber-100 text-amber-800",
  monitored: "bg-blue-100 text-blue-800", unsupervised: "bg-green-100 text-green-800",
};

/* ── flat row for export ─────────────────────────────────────────────── */

interface FlatRow {
  youngPerson: string; date: string; time: string; contactType: string;
  supervisionLevel: string; contactPerson: string; contactName: string;
  venue: string; supervisedBy: string; outcome: string;
  concerns: string; positives: string; childViews: string; notes: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Young Person",     accessor: (r: FlatRow) => r.youngPerson },
  { header: "Date",             accessor: (r: FlatRow) => r.date },
  { header: "Time",             accessor: (r: FlatRow) => r.time },
  { header: "Type",             accessor: (r: FlatRow) => r.contactType },
  { header: "Supervision",      accessor: (r: FlatRow) => r.supervisionLevel },
  { header: "Contact Person",   accessor: (r: FlatRow) => r.contactPerson },
  { header: "Contact Name",     accessor: (r: FlatRow) => r.contactName },
  { header: "Venue",            accessor: (r: FlatRow) => r.venue },
  { header: "Supervised By",    accessor: (r: FlatRow) => r.supervisedBy },
  { header: "Outcome",          accessor: (r: FlatRow) => r.outcome },
  { header: "Concerns",         accessor: (r: FlatRow) => r.concerns },
  { header: "Positives",        accessor: (r: FlatRow) => r.positives },
  { header: "Child Views",      accessor: (r: FlatRow) => r.childViews },
  { header: "Notes",            accessor: (r: FlatRow) => r.notes },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function ContactSupervisionPage() {
  const { data, isLoading } = useContactSupervisionSessions();
  const sessions = data?.data ?? [];
  const createSession = useCreateContactSupervisionSession();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterOutcome, setFilterOutcome] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [dialogOpen, setDialogOpen] = useState(false);

  /* ── dialog form state ───────────────────────────────────────────── */
  const [formChildId, setFormChildId] = useState("");
  const [formContactType, setFormContactType] = useState("");
  const [formContactPersonName, setFormContactPersonName] = useState("");
  const [formContactPerson, setFormContactPerson] = useState("");
  const [formVenue, setFormVenue] = useState("");
  const [formOutcome, setFormOutcome] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const resetForm = () => {
    setFormChildId("");
    setFormContactType("");
    setFormContactPersonName("");
    setFormContactPerson("");
    setFormVenue("");
    setFormOutcome("");
    setFormNotes("");
  };

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  if (isLoading) return <PageShell title="Contact Supervision" subtitle="Supervised and supported contact session records — family, siblings and significant others"><div /></PageShell>;

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = (() => {
    const total = sessions.length;
    const positive = sessions.filter((s) => s.outcome === "positive").length;
    const dna = sessions.filter((s) => s.outcome === "did_not_attend").length;
    const safeguarding = sessions.filter((s) => s.safeguarding_concerns).length;
    return { total, positive, dna, safeguarding };
  })();

  /* ── filtered / sorted ────────────────────────────────────────────── */
  const filtered = (() => {
    let list: ContactSupervisionSession[] = sessions;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        getYPName(s.child_id).toLowerCase().includes(q) ||
        s.contact_person_name.toLowerCase().includes(q)
      );
    }
    if (filterOutcome !== "all") list = list.filter((s) => s.outcome === filterOutcome);
    const out = [...list];
    switch (sortBy) {
      case "date": out.sort((a, b) => b.date.localeCompare(a.date)); break;
      case "child": out.sort((a, b) => getYPName(a.child_id).localeCompare(getYPName(b.child_id))); break;
      case "outcome": out.sort((a, b) => a.outcome.localeCompare(b.outcome)); break;
    }
    return out;
  })();

  /* ── export ───────────────────────────────────────────────────────── */
  const exportData: FlatRow[] = sessions.map((s) => ({
    youngPerson: getYPName(s.child_id),
    date: s.date,
    time: `${s.start_time}–${s.end_time}`,
    contactType: CONTACT_SESSION_TYPE_LABEL[s.contact_type],
    supervisionLevel: SUPERVISION_LEVEL_LABEL[s.supervision_level],
    contactPerson: CONTACT_SESSION_PERSON_LABEL[s.contact_person],
    contactName: s.contact_person_name,
    venue: s.venue,
    supervisedBy: getStaffName(s.supervising_staff),
    outcome: CONTACT_SESSION_OUTCOME_LABEL[s.outcome],
    concerns: (s.concerns ?? []).join("; "),
    positives: s.positives.join("; "),
    childViews: s.child_views,
    notes: s.notes,
  }));

  /* ── save handler ─────────────────────────────────────────────────── */
  const handleSave = () => {
    createSession.mutate({
      child_id: formChildId,
      contact_type: formContactType as ContactSessionType,
      contact_person_name: formContactPersonName,
      contact_person: formContactPerson as ContactSessionPerson,
      venue: formVenue,
      outcome: formOutcome as ContactSessionOutcome,
      notes: formNotes,
    } as Partial<ContactSupervisionSession>, {
      onSuccess: () => {
        toast.success("Contact session saved");
        setDialogOpen(false);
        resetForm();
      },
      onError: () => toast.error("Failed to save session"),
    });
  };

  return (
    <PageShell
      title="Contact Supervision"
      subtitle="Supervised and supported contact session records — family, siblings and significant others"
      ariaContext={{ pageTitle: "Contact Supervision", sourceType: "contact_log" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Contact Supervision Records" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="contact-supervision" />
          <button onClick={() => setDialogOpen(true)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Record Session
          </button>
          <AriaStudioQuickActionButton context={{ record_type: "supervision", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Sessions", value: stats.total, icon: Users, colour: "text-blue-600" },
          { label: "Positive", value: stats.positive, icon: CheckCircle2, colour: "text-green-600" },
          { label: "Did Not Attend", value: stats.dna, icon: Clock, colour: stats.dna > 0 ? "text-amber-600" : "text-gray-400" },
          { label: "Safeguarding Flags", value: stats.safeguarding, icon: AlertTriangle, colour: stats.safeguarding > 0 ? "text-red-600" : "text-gray-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-white p-4 flex items-center gap-3">
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── per-child summary ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {["yp_alex", "yp_jordan", "yp_casey"].map((ypId) => {
          const ypSessions = sessions.filter((s) => s.child_id === ypId);
          const pos = ypSessions.filter((s) => s.outcome === "positive").length;
          const nextDate = ypSessions.map((s) => s.next_contact_date).filter(Boolean).sort()[0];
          return (
            <div key={ypId} className="rounded-lg border bg-white p-4">
              <h3 className="font-semibold">{getYPName(ypId)}</h3>
              <p className="text-xs text-gray-500 mt-1">{ypSessions.length} sessions recorded</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Positive:</span> <span className="font-medium text-green-600">{pos}/{ypSessions.length}</span></div>
                <div><span className="text-gray-500">Next:</span> <span className="font-medium">{nextDate ?? "—"}</span></div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {[...new Set(ypSessions.map((s) => s.contact_person_name))].map((name) => (
                  <span key={name} className="px-2 py-0.5 bg-gray-100 rounded text-xs">{name}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── filters ────────────────────────────────────────────────── */}
      <div id="sessions-list" className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search children or contacts…" className="w-full rounded-md border py-2 pl-9 pr-3 text-sm" />
        </div>
        <Select value={filterOutcome} onValueChange={setFilterOutcome}>
          <SelectTrigger className="w-[170px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Outcomes</SelectItem>
            {Object.entries(CONTACT_SESSION_OUTCOME_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="child">Child</SelectItem>
              <SelectItem value="outcome">Outcome</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── cards ──────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((s) => {
          const open = expanded[s.id] ?? false;
          return (
            <div key={s.id} className="rounded-lg border bg-white">
              <button onClick={() => toggle(s.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Eye className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold">{getYPName(s.child_id)} — {s.contact_person_name}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", OUTCOME_COLOURS[s.outcome])}>{CONTACT_SESSION_OUTCOME_LABEL[s.outcome]}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", LEVEL_COLOURS[s.supervision_level])}>{SUPERVISION_LEVEL_LABEL[s.supervision_level]}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{s.date} · {s.start_time}–{s.end_time} · {CONTACT_SESSION_TYPE_LABEL[s.contact_type]} · {s.venue}</p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  {/* key details */}
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-gray-500">Contact:</span> <span className="font-medium">{CONTACT_SESSION_PERSON_LABEL[s.contact_person]}</span></div>
                    <div><span className="text-gray-500">Supervised by:</span> <span className="font-medium">{getStaffName(s.supervising_staff)}</span></div>
                    {s.court_order_ref && <div><span className="text-gray-500">Court Ref:</span> <span className="font-medium">{s.court_order_ref}</span></div>}
                    <div><span className="text-gray-500">Next Contact:</span> <span className="font-medium">{s.next_contact_date}</span></div>
                  </div>

                  {/* child presentation — before/during/after */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Child Presentation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-md bg-gray-50 p-3">
                        <p className="text-xs font-medium text-gray-600 mb-1">Before</p>
                        <p className="text-sm">{s.child_presentation_before}</p>
                      </div>
                      <div className="rounded-md bg-gray-50 p-3">
                        <p className="text-xs font-medium text-gray-600 mb-1">During</p>
                        <p className="text-sm">{s.child_presentation_during}</p>
                      </div>
                      <div className="rounded-md bg-gray-50 p-3">
                        <p className="text-xs font-medium text-gray-600 mb-1">After</p>
                        <p className="text-sm">{s.child_presentation_after}</p>
                      </div>
                    </div>
                  </div>

                  {/* interaction quality */}
                  {s.interaction_quality && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Interaction Quality</h4>
                      <p className="text-sm">{s.interaction_quality}</p>
                    </div>
                  )}

                  {/* positives / concerns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {s.positives.length > 0 && (
                      <div className="rounded-md bg-green-50 p-3">
                        <h4 className="text-xs font-semibold text-green-700 mb-1">Positives</h4>
                        <ul className="list-disc list-inside text-sm text-green-800 space-y-0.5">
                          {s.positives.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      </div>
                    )}
                    {(s.concerns?.length ?? 0) > 0 && (
                      <div className="rounded-md bg-amber-50 p-3">
                        <h4 className="text-xs font-semibold text-amber-700 mb-1">Concerns</h4>
                        <ul className="list-disc list-inside text-sm text-amber-800 space-y-0.5">
                          {(s.concerns ?? []).map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* safeguarding */}
                  {s.safeguarding_concerns && (
                    <div className="rounded-md bg-red-50 border border-red-200 p-3">
                      <h4 className="text-xs font-semibold text-red-700 mb-1">Safeguarding Concern Raised</h4>
                      <p className="text-sm text-red-800">{s.safeguarding_details}</p>
                    </div>
                  )}

                  {/* agreement breaches */}
                  {s.agreement_breaches.length > 0 && (
                    <div className="rounded-md bg-orange-50 border border-orange-200 p-3">
                      <h4 className="text-xs font-semibold text-orange-700 mb-1">Contact Agreement Breaches</h4>
                      <ul className="list-disc list-inside text-sm text-orange-800 space-y-0.5">
                        {s.agreement_breaches.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* gifts */}
                  {s.gifts_brought && (
                    <div className="text-sm"><span className="text-gray-500 font-medium">Gifts/Items Brought:</span> {s.gifts_brought}</div>
                  )}

                  {/* child's view */}
                  {s.child_views && (
                    <div className="rounded-md bg-pink-50 border border-pink-200 p-3">
                      <h4 className="text-xs font-semibold text-pink-700 mb-1">Child&apos;s Views</h4>
                      <p className="text-sm text-pink-800">{s.child_views}</p>
                    </div>
                  )}

                  {/* notes */}
                  {s.notes && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Notes</h4>
                      <p className="text-sm text-gray-700">{s.notes}</p>
                    </div>
                  )}

                  {/* smart link panel */}
                  <SmartLinkPanel sourceType="contact-supervision" sourceId={s.id} childId={s.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Contact &amp; Supervision:</strong> Reg 8 requires that children are supported to maintain relationships with family and significant people, consistent with their safety and welfare. Contact arrangements must follow court orders and care plans. Supervised contact sessions must record child presentation before, during and after contact, interaction quality, and any safeguarding concerns. The child&apos;s voice must be central to all contact decisions.
      </div>

      {/* ── dialog ─────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Record Contact Session</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Young Person</label>
                <Select value={formChildId} onValueChange={setFormChildId}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{["yp_alex","yp_jordan","yp_casey"].map((id) => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Contact Type</label>
                <Select value={formContactType} onValueChange={setFormContactType}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(CONTACT_SESSION_TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Contact Person Name</label>
                <input value={formContactPersonName} onChange={(e) => setFormContactPersonName(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g. Michelle Thompson" />
              </div>
              <div>
                <label className="text-sm font-medium">Relationship</label>
                <Select value={formContactPerson} onValueChange={setFormContactPerson}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(CONTACT_SESSION_PERSON_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Venue</label>
              <input value={formVenue} onChange={(e) => setFormVenue(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g. Contact Centre, Oak House" />
            </div>
            <div>
              <label className="text-sm font-medium">Outcome</label>
              <Select value={formOutcome} onValueChange={setFormOutcome}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{Object.entries(CONTACT_SESSION_OUTCOME_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea rows={3} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Session observations…" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => { setDialogOpen(false); resetForm(); }} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
            <button onClick={handleSave} disabled={createSession.isPending} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
              {createSession.isPending ? "Saving…" : "Save Session"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Family Contact"
        category="family_contact"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
