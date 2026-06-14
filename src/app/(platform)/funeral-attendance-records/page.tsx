"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Flower,
  Calendar,
  Heart,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Users,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  FuneralRecord,
  FuneralAttendanceDecision,
} from "@/types/extended";
import {
  FUNERAL_TYPE_LABEL,
  FUNERAL_ATTENDANCE_DECISION_LABEL,
  FUNERAL_DECISION_MAKER_LABEL,
} from "@/types/extended";
import { useFuneralRecords } from "@/hooks/use-funeral-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

const exportCols: ExportColumn<FuneralRecord>[] = [
  { header: "Young Person", accessor: (r: FuneralRecord) => getYPName(r.child_id) },
  { header: "Recorded", accessor: (r: FuneralRecord) => r.recorded_date },
  { header: "Deceased", accessor: (r: FuneralRecord) => r.deceased_name },
  { header: "Relationship", accessor: (r: FuneralRecord) => r.relationship_to_child },
  { header: "Date of Death", accessor: (r: FuneralRecord) => r.date_of_death },
  { header: "Funeral Date", accessor: (r: FuneralRecord) => r.funeral_date },
  { header: "Funeral Type", accessor: (r: FuneralRecord) => FUNERAL_TYPE_LABEL[r.funeral_type] },
  { header: "Faith Tradition", accessor: (r: FuneralRecord) => r.faith_tradition ?? "—" },
  { header: "Attendance", accessor: (r: FuneralRecord) => FUNERAL_ATTENDANCE_DECISION_LABEL[r.attendance_decision] },
  { header: "Decision Maker", accessor: (r: FuneralRecord) => FUNERAL_DECISION_MAKER_LABEL[r.decision_maker] },
  { header: "Attended With", accessor: (r: FuneralRecord) => r.who_attended_with_child.join("; ") },
  { header: "SW Informed", accessor: (r: FuneralRecord) => (r.social_worker_informed ? "Yes" : "No") },
  { header: "Child Voice", accessor: (r: FuneralRecord) => r.child_voice },
  { header: "Follow-up", accessor: (r: FuneralRecord) => r.follow_up_date },
  { header: "Key Worker", accessor: (r: FuneralRecord) => getStaffName(r.key_worker) },
];

const decisionColour: Record<FuneralAttendanceDecision, string> = {
  attended: "bg-emerald-100 text-emerald-800 border-emerald-200",
  did_not_attend_chose: "bg-blue-100 text-blue-800 border-blue-200",
  did_not_attend_not_invited: "bg-slate-100 text-[var(--cs-navy)] border-[var(--cs-border)]",
  attended_remotely: "bg-purple-100 text-purple-800 border-purple-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
};

export default function FuneralAttendanceRecordsPage() {
  const { data: res, isLoading } = useFuneralRecords();
  const records = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [decisionFilter, setDecisionFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "funeral">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        getYPName(rec.child_id).toLowerCase().includes(search.toLowerCase()) ||
        rec.deceased_name.toLowerCase().includes(search.toLowerCase()) ||
        rec.relationship_to_child.toLowerCase().includes(search.toLowerCase());
      const matchesDecision = decisionFilter === "all" || rec.attendance_decision === decisionFilter;
      return matchesSearch && matchesDecision;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "name") return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
      if (sortBy === "funeral") return b.funeral_date.localeCompare(a.funeral_date);
      return b.recorded_date.localeCompare(a.recorded_date);
    });
    return r;
  }, [records, search, decisionFilter, sortBy]);

  const stats = useMemo(() => {
    const attended = records.filter((r) => r.attendance_decision === "attended" || r.attendance_decision === "attended_remotely").length;
    const childLed = records.filter((r) => r.decision_maker === "child_led").length;
    const flagged = records.filter((r) => r.flags_concerns.length > 0).length;
    const now = new Date();
    const in60 = new Date(now); in60.setDate(in60.getDate() + 60);
    const ago7 = new Date(now); ago7.setDate(ago7.getDate() - 7);
    const in60Str = in60.toISOString().slice(0, 10);
    const ago7Str = ago7.toISOString().slice(0, 10);
    const followUpsDue = records.filter((r) => r.follow_up_date <= in60Str && r.follow_up_date >= ago7Str).length;
    return { attended, childLed, flagged, followUpsDue };
  }, [records]);

  return (
    <PageShell
      title="Funeral Attendance Records"
      subtitle="Sensitive record of children's involvement in funerals — child-led decision-making, preparation, ritual, faith tradition, post-funeral support. Honours dignity, grief, and the right to say goodbye in the way that's right for each child."
      caraContext={{ pageTitle: "Funeral Attendance Records", sourceType: "child_record" }}
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="funeral-attendance-records" />
          <PrintButton title="Funeral Attendance Records" />
          <CaraStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
      <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <Flower className="h-4 w-4" />
            <span>Funerals attended</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.attended}</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <Heart className="h-4 w-4" />
            <span>Child-led decisions</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.childLed}</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <Users className="h-4 w-4" />
            <span>Flagged for follow-up</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.flagged}</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <Calendar className="h-4 w-4" />
            <span>Follow-ups due (60d)</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.followUpsDue}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--cs-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search young person, deceased, relationship..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--cs-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Select value={decisionFilter} onValueChange={setDecisionFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Attendance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All decisions</SelectItem>
            <SelectItem value="attended">Attended</SelectItem>
            <SelectItem value="attended_remotely">Attended remotely</SelectItem>
            <SelectItem value="did_not_attend_chose">Chose not to</SelectItem>
            <SelectItem value="did_not_attend_not_invited">Not invited</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-48">
            <ArrowUpDown className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Most recent recorded</SelectItem>
            <SelectItem value="funeral">Funeral date</SelectItem>
            <SelectItem value="name">Young person A→Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isOpen = expandedId === r.id;
          return (
            <div key={r.id} className="rounded-lg border border-[var(--cs-border)] bg-white overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : r.id)}
                className="w-full p-4 flex items-start justify-between gap-3 hover:bg-[var(--cs-surface)] text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-[var(--cs-navy)]">{getYPName(r.child_id)}</span>
                    <span className="text-[var(--cs-text-secondary)]">— {r.deceased_name}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", decisionColour[r.attendance_decision])}>
                      {FUNERAL_ATTENDANCE_DECISION_LABEL[r.attendance_decision]}
                    </span>
                    {r.decision_maker === "child_led" ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-pink-100 text-pink-800 border-pink-200">
                        Child-led
                      </span>
                    ) : null}
                    {r.faith_tradition ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-100 text-amber-800 border-amber-200">
                        {r.faith_tradition}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-[var(--cs-text-secondary)]">
                    {r.relationship_to_child} · Funeral {r.funeral_date} · {getStaffName(r.key_worker)}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-[var(--cs-text-muted)]" /> : <ChevronDown className="h-5 w-5 text-[var(--cs-text-muted)]" />}
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 border-t border-[var(--cs-border-subtle)] bg-slate-50/50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-rose-200 bg-rose-50 p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-rose-700 uppercase mb-2">Child Voice</div>
                      <p className="text-sm text-rose-900 italic">&ldquo;{r.child_voice}&rdquo;</p>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Staff Observation</div>
                      <p className="text-sm text-[var(--cs-text-secondary)]">{r.staff_observation}</p>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Pre-funeral preparation</div>
                      <ul className="text-sm text-[var(--cs-text-secondary)] space-y-1">
                        {r.pre_funeral_preparation.map((t, i) => (
                          <li key={i} className="flex gap-2"><span className="text-[var(--cs-text-muted)]">·</span><span>{t}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Rituals observed</div>
                      <ul className="text-sm text-[var(--cs-text-secondary)] space-y-1">
                        {r.rituals_observed.map((t, i) => (
                          <li key={i} className="flex gap-2"><span className="text-emerald-500">·</span><span>{t}</span></li>
                        ))}
                      </ul>
                    </div>
                    {r.who_attended_with_child.length ? (
                      <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                        <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Who attended with child</div>
                        <ul className="text-sm text-[var(--cs-text-secondary)] space-y-1">
                          {r.who_attended_with_child.map((t, i) => (
                            <li key={i} className="flex gap-2"><span className="text-[var(--cs-text-muted)]">·</span><span>{t}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                      <div className="text-xs font-semibold text-blue-800 uppercase mb-2">Post-funeral support</div>
                      <ul className="text-sm text-blue-900 space-y-1">
                        {r.post_funeral_support.map((t, i) => (
                          <li key={i} className="flex gap-2"><span>·</span><span>{t}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Context</div>
                      <div className="grid grid-cols-2 gap-3 text-sm text-[var(--cs-text-secondary)]">
                        <div><span className="text-[var(--cs-text-muted)]">Informed by:</span> {r.child_was_informed_by}</div>
                        <div><span className="text-[var(--cs-text-muted)]">Decision-maker:</span> {FUNERAL_DECISION_MAKER_LABEL[r.decision_maker]}</div>
                        <div><span className="text-[var(--cs-text-muted)]">Date of death:</span> {r.date_of_death}</div>
                        <div><span className="text-[var(--cs-text-muted)]">Funeral type:</span> {FUNERAL_TYPE_LABEL[r.funeral_type]}</div>
                        {r.travel_arrangements ? (
                          <div className="col-span-2"><span className="text-[var(--cs-text-muted)]">Travel:</span> {r.travel_arrangements}</div>
                        ) : null}
                        {r.child_role_at_funeral ? (
                          <div className="col-span-2"><span className="text-[var(--cs-text-muted)]">Child&rsquo;s role:</span> {r.child_role_at_funeral}</div>
                        ) : null}
                        {r.birth_family_contact ? (
                          <div className="col-span-2"><span className="text-[var(--cs-text-muted)]">Birth family:</span> {r.birth_family_contact}</div>
                        ) : null}
                        <div><span className="text-[var(--cs-text-muted)]">SW informed:</span> {r.social_worker_informed ? "Yes" : "No"}</div>
                        <div><span className="text-[var(--cs-text-muted)]">Follow-up:</span> {r.follow_up_date}</div>
                      </div>
                    </div>
                    {r.flags_concerns.length ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2">Flags / concerns</div>
                        <ul className="text-sm text-amber-900 space-y-1">
                          {r.flags_concerns.map((f, i) => (
                            <li key={i} className="flex gap-2"><span>!</span><span>{f}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="lg:col-span-2">
                      <SmartLinkPanel sourceType="funeral-attendance-record" sourceId={r.id} childId={r.child_id} compact />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
        <div className="font-semibold mb-1">Regulatory framework</div>
        <p>
          A child&rsquo;s right to say goodbye is a right, not a permission. Decisions about funeral attendance are
          child-led and supported, not imposed. Practice is grounded in Quality Standards 6 (Enjoyment & Achievement)
          and 7 (Positive Relationships), Working Together 2023, UNCRC Articles 12 (voice), 14 (freedom of religion)
          and 30 (cultural identity), and NICE NG196 bereavement guidance. Faith tradition is observed where the child
          wishes. Risks of attendance (unsafe family contact, identity disrespect, safeguarding) are weighed honestly
          with the child. Where the child cannot or chooses not to attend, alternative ritual is supported.
          Bereavement support continues afterwards in the bereavement-loss-support record.
        </p>
      </div>
      </>
      )}
      <CareEventsPanel
        title="Care Events — Wellbeing"
        category="wellbeing"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Funeral Attendance Records — bereavement, death of family member, funeral attendance consent, transport, support plan, emotional impact, grief, therapeutic follow-up"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
