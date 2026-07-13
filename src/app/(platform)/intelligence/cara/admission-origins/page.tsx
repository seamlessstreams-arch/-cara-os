"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAdmissionOrigins, useEmergencyFollowUps } from "@/hooks/use-admission-origins";
import type { OriginStory, EmergencyFollowUps } from "@/hooks/use-admission-origins";
import type { MatchConfidence } from "@/lib/admission-retro-link/admission-retro-link-engine";
// Design tokens used below: --cs-text (primary), --cs-text-secondary,
// --cs-text-gentle (tertiary), --cs-surface-subtle, --cs-navy (accent),
// --cs-border, --cs-risk(-bg), --cs-success, --cs-warning.
import type { FollowUpStatus } from "@/lib/admission-retro-link/emergency-followups-engine";
import {
  Siren, CheckCircle2, Clock, AlertTriangle, Search, Link2,
  CalendarClock, ShieldAlert, FileText, Loader2, Info,
} from "lucide-react";

// ── Presentation maps ───────────────────────────────────────────────────────

const CONFIDENCE: Record<MatchConfidence, { variant: "success" | "secondary" | "warning" | "outline"; label: string }> = {
  exact:  { variant: "success",   label: "Name + DOB" },
  strong: { variant: "secondary", label: "Name match" },
  weak:   { variant: "warning",   label: "DOB conflict" },
  none:   { variant: "outline",   label: "No match" },
};

const STATUS: Record<FollowUpStatus, { variant: "success" | "due" | "destructive"; Icon: typeof Clock; label: string }> = {
  done:    { variant: "success",     Icon: CheckCircle2,  label: "Done" },
  due:     { variant: "due",         Icon: Clock,         label: "Due" },
  overdue: { variant: "destructive", Icon: AlertTriangle, label: "Overdue" },
};

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

// ── Emergency follow-up board (safeguarding-critical, read-only) ─────────────

function FollowUpRow({ f }: { f: EmergencyFollowUps["followups"][number] }) {
  const s = STATUS[f.status];
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[var(--cs-text)]">{f.label}</p>
        <p className="text-xs text-[var(--cs-text-secondary)]">
          <CalendarClock className="mr-1 inline h-3 w-3 align-[-2px]" />
          Due by {fmtDate(f.deadline_date)}
          {f.status === "done" && f.completed_on ? ` · recorded ${fmtDate(f.completed_on)}` : ""}
        </p>
      </div>
      <Badge variant={s.variant} className="shrink-0 gap-1">
        <s.Icon className="h-3 w-3" />
        {s.label}
      </Badge>
    </div>
  );
}

function EmergencyBoardCard({ board }: { board: EmergencyFollowUps }) {
  const hasOverdue = board.overdue_count > 0;
  return (
    <Card className={cn("border-l-4", hasOverdue ? "border-l-[var(--cs-risk)]" : "border-l-[var(--cs-success)]")}>
      <CardContent className="space-y-1 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/young-people/${board.child.id}`}
              className="truncate text-sm font-semibold text-[var(--cs-text)] hover:underline"
            >
              {board.child.name}
            </Link>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--cs-text-secondary)]">
              <Siren className="h-3 w-3 text-[var(--cs-risk)]" />
              {board.child.emergency_basis}
            </p>
            <p className="text-xs text-[var(--cs-text-secondary)]">Placed {fmtDate(board.child.placement_start)}</p>
          </div>
          {hasOverdue ? (
            <Badge variant="destructive" className="shrink-0 gap-1">
              <AlertTriangle className="h-3 w-3" />
              {board.overdue_count} overdue
            </Badge>
          ) : (
            <Badge variant="success" className="shrink-0 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              On track
            </Badge>
          )}
        </div>
        <div className="divide-y divide-[var(--cs-border)] border-t border-[var(--cs-border)] pt-1">
          {board.followups.map((f) => (
            <FollowUpRow key={f.key} f={f} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Origin story (retro-linked pre-placement narrative, honest confidence) ───

function Chips({ items, tone }: { items: string[]; tone: "need" | "risk" }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((x) => (
        <span
          key={x}
          className={cn(
            "rounded-md px-2 py-0.5 text-xs",
            tone === "risk"
              ? "bg-[var(--cs-risk-bg)] text-[var(--cs-risk)]"
              : "bg-[var(--cs-surface-subtle)] text-[var(--cs-text-secondary)]",
          )}
        >
          {x}
        </span>
      ))}
    </div>
  );
}

function OriginCard({ story }: { story: OriginStory }) {
  const c = CONFIDENCE[story.match_confidence];
  const models = [
    story.admission_referral ? "Admission referral" : null,
    story.matching_referral ? "Matching" : null,
    story.placement_referral ? "Commissioning" : null,
  ].filter(Boolean) as string[];

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/young-people/${story.child_id}`}
              className="truncate text-sm font-semibold text-[var(--cs-text)] hover:underline"
            >
              {story.child_name}
            </Link>
            <p className="mt-0.5 text-xs text-[var(--cs-text-secondary)]">
              {[story.referral_source, story.local_authority].filter(Boolean).join(" · ") || "Referral origin"}
              {story.referral_date ? ` · referred ${fmtDate(story.referral_date)}` : ""}
            </p>
          </div>
          <Badge variant={c.variant} className="shrink-0 gap-1">
            <Link2 className="h-3 w-3" />
            {c.label}
          </Badge>
        </div>

        {/* Honest match basis — a weak link is never presented as certain. */}
        <p className="flex items-start gap-1.5 rounded-md bg-[var(--cs-surface-subtle)] px-2 py-1.5 text-xs text-[var(--cs-text-secondary)]">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          {story.match_basis}
        </p>

        {story.presenting_needs.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-[var(--cs-text-secondary)]">Presenting needs</p>
            <Chips items={story.presenting_needs} tone="need" />
          </div>
        )}
        {story.risk_factors.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-[var(--cs-text-secondary)]">Risk factors at referral</p>
            <Chips items={story.risk_factors} tone="risk" />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-[var(--cs-text-gentle)]">Sources:</span>
          {models.map((m) => (
            <Badge key={m} variant="outline" className="gap-1 text-[11px]">
              <FileText className="h-3 w-3" />
              {m}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Section scaffolding ──────────────────────────────────────────────────────

function SectionHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <h2 className="text-sm font-semibold text-[var(--cs-text)]">{title}</h2>
        <p className="text-xs text-[var(--cs-text-secondary)]">{sub}</p>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center gap-2 py-8 text-sm text-[var(--cs-text-secondary)]">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading…
    </div>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
        {icon}
        <p className="max-w-md text-sm text-[var(--cs-text-secondary)]">{text}</p>
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════════

export default function AdmissionOriginsPage() {
  const emergency = useEmergencyFollowUps();
  const origins = useAdmissionOrigins();
  const [search, setSearch] = useState("");

  const boards = emergency.data?.data.boards ?? [];
  const totalOverdue = emergency.data?.data.total_overdue ?? 0;
  const emergencyCount = emergency.data?.data.emergency_admissions ?? 0;

  const stories = origins.data?.data.stories ?? [];
  const linked = origins.data?.data.linked ?? 0;
  const ypTotal = origins.data?.data.young_people_total ?? 0;

  const filteredStories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stories;
    return stories.filter((s) => s.child_name.toLowerCase().includes(q));
  }, [stories, search]);

  // Boards ordered so anything slipping is at the top.
  const orderedBoards = useMemo(
    () => [...boards].sort((a, b) => b.overdue_count - a.overdue_count),
    [boards],
  );

  return (
    <PageShell
      title="Origins & Emergency Follow-ups"
      description="How each child came to us — their referral origin retro-linked from the admissions models — and the statutory follow-ups that follow an emergency admission. Read-only: nothing here changes a record."
    >
      <div className="space-y-8">
        {/* ── Summary tiles ── */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className={cn("border-l-4", totalOverdue > 0 ? "border-l-[var(--cs-risk)]" : "border-l-[var(--cs-success)]")}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-[var(--cs-text-secondary)]">Follow-ups overdue</p>
              <p className={cn("mt-1 text-2xl font-semibold tabular-nums", totalOverdue > 0 ? "text-[var(--cs-risk)]" : "text-[var(--cs-success)]")}>
                {totalOverdue}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-[var(--cs-text-secondary)]">Emergency admissions</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--cs-text)]">{emergencyCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-[var(--cs-text-secondary)]">Origins retro-linked</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--cs-text)]">
                {linked}
                <span className="ml-1 text-sm font-normal text-[var(--cs-text-gentle)]">/ {ypTotal}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Emergency follow-up board ── */}
        <section className="space-y-3">
          <SectionHeader
            icon={<Siren className="h-4 w-4 text-[var(--cs-risk)]" />}
            title="Emergency-admission follow-ups"
            sub="Statutory deadlines counted from placement start. Completion is read straight off the record collections — never assumed."
          />
          {emergency.isLoading ? (
            <Loading />
          ) : orderedBoards.length === 0 ? (
            <Empty
              icon={<ShieldAlert className="h-6 w-6 text-[var(--cs-text-gentle)]" />}
              text="No children are currently flagged as emergency admissions. This board populates when a placed referral is marked an emergency, or a commissioning referral arrives with emergency urgency."
            />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {orderedBoards.map((b) => (
                <EmergencyBoardCard key={b.child.id} board={b} />
              ))}
            </div>
          )}
        </section>

        {/* ── Origin stories ── */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeader
              icon={<Link2 className="h-4 w-4 text-[var(--cs-navy)]" />}
              title="Referral origins"
              sub="Each child reconnected to their pre-placement story. Match confidence is shown honestly — a name-only link is never presented as certain."
            />
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--cs-text-gentle)]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name…"
                className="h-8 w-56 pl-8 text-sm"
              />
            </div>
          </div>
          {origins.isLoading ? (
            <Loading />
          ) : stories.length === 0 ? (
            <Empty
              icon={<Link2 className="h-6 w-6 text-[var(--cs-text-gentle)]" />}
              text="No current young person could be retro-linked to a referral. Origins appear once a child's name (and date of birth, where recorded) matches an admission, matching or commissioning referral."
            />
          ) : filteredStories.length === 0 ? (
            <Empty
              icon={<Search className="h-6 w-6 text-[var(--cs-text-gentle)]" />}
              text={`No origin matches “${search}”.`}
            />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {filteredStories.map((s) => (
                <OriginCard key={s.child_id} story={s} />
              ))}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
