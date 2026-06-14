"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Star,
  Heart,
  Users,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  ShieldCheck,
  Award,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCulturalReligiousMentors } from "@/hooks/use-cultural-religious-mentors";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type {
  CulturalReligiousMentor,
  CulturalMentorRole,
  MentorContactFrequency,
  MentorRelationshipQuality,
} from "@/types/extended";
import {
  CULTURAL_MENTOR_ROLE_LABEL,
  MENTOR_CONTACT_FREQUENCY_LABEL,
  MENTOR_RELATIONSHIP_QUALITY_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

const exportCols: ExportColumn<CulturalReligiousMentor>[] = [
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Mentor", accessor: (r) => r.mentor_name },
  { header: "Role", accessor: (r) => CULTURAL_MENTOR_ROLE_LABEL[r.mentor_role] },
  { header: "Faith / Culture", accessor: (r) => r.faith_culture },
  { header: "Matched", accessor: (r) => r.matched_date },
  { header: "Frequency", accessor: (r) => MENTOR_CONTACT_FREQUENCY_LABEL[r.contact_frequency] },
  { header: "Quality", accessor: (r) => MENTOR_RELATIONSHIP_QUALITY_LABEL[r.child_relationship_quality] },
  { header: "Settings", accessor: (r) => r.contact_settings.join("; ") },
  { header: "Role Played", accessor: (r) => r.role_played.join("; ") },
  { header: "Safeguarding Checks", accessor: (r) => r.safeguarding_checks_done.map((c) => `${c.check} (${c.date} — ${c.outcome})`).join("; ") },
  { header: "Parent / SW Aware", accessor: (r) => (r.parent_sw_aware ? "Yes" : "No") },
  { header: "Child Voice", accessor: (r) => r.child_voice },
  { header: "Review", accessor: (r) => r.review_date },
  { header: "Key Worker", accessor: (r) => getStaffName(r.key_worker) },
];

const qualityColour: Record<MentorRelationshipQuality, string> = {
  building: "bg-blue-100 text-blue-800 border-blue-200",
  settled: "bg-sky-100 text-sky-800 border-sky-200",
  strong: "bg-emerald-100 text-emerald-800 border-emerald-200",
  central_figure: "bg-purple-100 text-purple-800 border-purple-200",
};

const roleColour: Record<CulturalMentorRole, string> = {
  imam: "bg-emerald-100 text-emerald-800 border-emerald-200",
  pandit: "bg-amber-100 text-amber-800 border-amber-200",
  rabbi: "bg-blue-100 text-blue-800 border-blue-200",
  pastor_minister: "bg-red-100 text-red-800 border-red-200",
  cultural_elder: "bg-orange-100 text-orange-800 border-orange-200",
  community_leader: "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)] border-[var(--cs-cara-gold-soft)]",
  heritage_language_teacher: "bg-teal-100 text-teal-800 border-teal-200",
  faith_aware_therapist: "bg-purple-100 text-purple-800 border-purple-200",
  diaspora_mentor: "bg-pink-100 text-pink-800 border-pink-200",
  other: "bg-slate-100 text-[var(--cs-navy)] border-[var(--cs-border)]",
};

export default function ChildCulturalReligiousMentorPage() {
  const { data: response, isLoading } = useCulturalReligiousMentors();
  const records = response?.data ?? [];

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"matched" | "name" | "quality" | "review">("matched");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        getYPName(rec.child_id).toLowerCase().includes(search.toLowerCase()) ||
        rec.mentor_name.toLowerCase().includes(search.toLowerCase()) ||
        rec.faith_culture.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || rec.mentor_role === roleFilter;
      return matchesSearch && matchesRole;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "name") return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
      if (sortBy === "quality") return a.child_relationship_quality.localeCompare(b.child_relationship_quality);
      if (sortBy === "review") return a.review_date.localeCompare(b.review_date);
      return b.matched_date.localeCompare(a.matched_date);
    });
    return r;
  }, [search, roleFilter, sortBy, records]);

  const stats = useMemo(() => {
    const matched = records.length;
    const central = records.filter((r) => r.child_relationship_quality === "central_figure" || r.child_relationship_quality === "strong").length;
    const safeguardingChecked = records.filter((r) => r.safeguarding_checks_done.length > 0).length;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 90);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const reviewsDue = records.filter((r) => r.review_date <= cutoffStr).length;
    return { matched, central, safeguardingChecked, reviewsDue };
  }, [records]);

  return (
    <PageShell
      title="Cultural & Religious Mentors"
      subtitle="Per-child community-based cultural or religious mentor matching — when staff don't share a child's heritage, identifying an Imam, Pandit, Rabbi, Pastor, elder or community leader for spiritual or cultural guidance. Co-produced with the child, dignifying, never imposed. Distinct from chosen-family-tracker."
      caraContext={{ pageTitle: "Cultural & Religious Mentors", sourceType: "child_record" }}
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="child-cultural-religious-mentor" />
          <PrintButton title="Cultural & Religious Mentors" />
          <CaraStudioQuickActionButton context={{ record_type: "direct_work", record_id: "home_oak", home_id: "home_oak" }} />
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
            <Users className="h-4 w-4" />
            <span>Mentors matched</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.matched}</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <Star className="h-4 w-4" />
            <span>Central / strong</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.central}</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span>Safeguarding checked</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.safeguardingChecked}</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <Award className="h-4 w-4" />
            <span>Reviews due (90d)</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.reviewsDue}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--cs-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search young person, mentor, faith / culture..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--cs-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Mentor role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="imam">{CULTURAL_MENTOR_ROLE_LABEL.imam}</SelectItem>
            <SelectItem value="pandit">{CULTURAL_MENTOR_ROLE_LABEL.pandit}</SelectItem>
            <SelectItem value="rabbi">{CULTURAL_MENTOR_ROLE_LABEL.rabbi}</SelectItem>
            <SelectItem value="pastor_minister">{CULTURAL_MENTOR_ROLE_LABEL.pastor_minister}</SelectItem>
            <SelectItem value="cultural_elder">{CULTURAL_MENTOR_ROLE_LABEL.cultural_elder}</SelectItem>
            <SelectItem value="community_leader">{CULTURAL_MENTOR_ROLE_LABEL.community_leader}</SelectItem>
            <SelectItem value="heritage_language_teacher">{CULTURAL_MENTOR_ROLE_LABEL.heritage_language_teacher}</SelectItem>
            <SelectItem value="faith_aware_therapist">{CULTURAL_MENTOR_ROLE_LABEL.faith_aware_therapist}</SelectItem>
            <SelectItem value="diaspora_mentor">{CULTURAL_MENTOR_ROLE_LABEL.diaspora_mentor}</SelectItem>
            <SelectItem value="other">{CULTURAL_MENTOR_ROLE_LABEL.other}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-48">
            <ArrowUpDown className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="matched">Matched recently</SelectItem>
            <SelectItem value="name">Young person A→Z</SelectItem>
            <SelectItem value="quality">Quality</SelectItem>
            <SelectItem value="review">Review date</SelectItem>
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
                    <span className="text-[var(--cs-text-secondary)]">— {r.mentor_name}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", roleColour[r.mentor_role])}>
                      {CULTURAL_MENTOR_ROLE_LABEL[r.mentor_role]}
                    </span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", qualityColour[r.child_relationship_quality])}>
                      {MENTOR_RELATIONSHIP_QUALITY_LABEL[r.child_relationship_quality]}
                    </span>
                    {r.safeguarding_checks_done.length ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-200">
                        Safeguarded
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-[var(--cs-text-secondary)]">
                    {r.faith_culture} · {MENTOR_CONTACT_FREQUENCY_LABEL[r.contact_frequency]} · {getStaffName(r.key_worker)}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-[var(--cs-text-muted)]" /> : <ChevronDown className="h-5 w-5 text-[var(--cs-text-muted)]" />}
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 border-t border-[var(--cs-border-subtle)] bg-slate-50/50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-amber-700 uppercase mb-2">Child Voice</div>
                      <p className="text-sm text-amber-900 italic">&ldquo;{r.child_voice}&rdquo;</p>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Staff Observation</div>
                      <p className="text-sm text-[var(--cs-text-secondary)]">{r.staff_observation}</p>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">How matched</div>
                      <p className="text-sm text-[var(--cs-text-secondary)]">{r.introduction_method}</p>
                      <div className="text-xs text-[var(--cs-text-muted)] mt-2">Matched {r.matched_date}</div>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Contact settings</div>
                      <ul className="text-sm text-[var(--cs-text-secondary)] space-y-1">
                        {r.contact_settings.map((s, i) => (
                          <li key={i} className="flex gap-2"><span className="text-[var(--cs-text-muted)]">·</span><span>{s}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-emerald-700 uppercase mb-2">Role played</div>
                      <ul className="text-sm text-emerald-900 space-y-1">
                        {r.role_played.map((s, i) => (
                          <li key={i} className="flex gap-2"><span>+</span><span>{s}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Safeguarding checks</div>
                      <ul className="text-sm text-[var(--cs-text-secondary)] space-y-1.5">
                        {r.safeguarding_checks_done.map((c, i) => (
                          <li key={i} className="flex gap-2 justify-between">
                            <span>{c.check}</span>
                            <span className="text-xs text-[var(--cs-text-muted)]">{c.date} · {c.outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Recent meetings</div>
                      <ul className="text-sm text-[var(--cs-text-secondary)] space-y-1.5">
                        {r.meetings_record.map((m, i) => (
                          <li key={i}>
                            <div className="text-xs text-[var(--cs-text-muted)]">{m.date}</div>
                            <div><span className="font-medium">{m.topic}</span> — {m.outcome}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Home awareness</div>
                      <p className="text-sm text-[var(--cs-text-secondary)]">{r.home_awareness}</p>
                      <div className="text-xs text-[var(--cs-text-muted)] mt-2">Parent / SW aware: {r.parent_sw_aware ? "Yes" : "No"}</div>
                    </div>
                    {r.challenges_noted.length ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2">Challenges noted</div>
                        <ul className="text-sm text-amber-900 space-y-1">
                          {r.challenges_noted.map((c, i) => (
                            <li key={i} className="flex gap-2"><span>!</span><span>{c}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                  <SmartLinkPanel sourceType="cultural-religious-mentor" sourceId={r.id} childId={r.child_id} compact />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="font-semibold mb-1">Regulatory framework</div>
        <p>
          Mentor matching is co-produced with the child and never imposed. Practice is grounded in Children&rsquo;s
          Homes Regulations Quality Standards 6 (Enjoyment & Achievement) and 7 (Positive Relationships), the
          Equality Act 2010 (religion or belief), Working Together 2023, NSPCC Faith and Spirituality safeguarding
          guidance, and UNCRC Articles 8 (identity), 14 (thought / conscience / religion), and 30 (cultural
          identity). All mentors hold appropriate safeguarding clearance proportionate to contact, with open-door
          policies for 1:1 meetings.
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
        pageContext="Cultural & Religious Mentors — faith community links, cultural role models, mosque, church, temple, language support, identity development, heritage, LAC cultural plan"
        recordType="direct_work"
        className="mt-6"
      />
    </PageShell>
  );
}
