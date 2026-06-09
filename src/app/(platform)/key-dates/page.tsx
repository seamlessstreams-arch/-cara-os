"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — KEY DATES
// Unified statutory & operational deadline timeline — next 90 days.
// Sources: LAC reviews · Reg 44 visits · Supervisions · Appraisals ·
//          Training/qualification renewals
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import {
  Calendar, ClipboardList, Users, GraduationCap, Eye,
  CheckCircle2, AlertTriangle, Clock, ChevronRight,
  Filter, Loader2, CalendarDays, Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCarePlans } from "@/hooks/use-care-plans";
import { useStaff } from "@/hooks/use-staff";
import { useQualifications } from "@/hooks/use-workforce";
import { useReg44Visits } from "@/hooks/use-ri-learning";
import { useAuthContext } from "@/contexts/auth-context";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn, formatDate } from "@/lib/utils";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

// ── Types ─────────────────────────────────────────────────────────────────────

type EventCategory = "lac_review" | "reg44" | "supervision" | "appraisal" | "training" | "qualification";

interface KeyDateItem {
  id:       string;
  date:     string;       // ISO yyyy-mm-dd
  days:     number;       // signed days from today
  category: EventCategory;
  title:    string;
  subtitle: string;
  href:     string;
  overdue:  boolean;
}

const KEY_DATE_EXPORT_COLS: ExportColumn<KeyDateItem>[] = [
  { header: "Date", accessor: (d) => d.date },
  { header: "Days From Now", accessor: (d) => String(d.days) },
  { header: "Category", accessor: (d) => d.category.replace(/_/g, " ") },
  { header: "Title", accessor: (d) => d.title },
  { header: "Detail", accessor: (d) => d.subtitle },
  { header: "Overdue", accessor: (d) => d.overdue ? "Yes" : "No" },
];

const CAT_CONFIG: Record<EventCategory, {
  label: string;
  icon:  React.ElementType;
  color: string;
  bg:    string;
  border:string;
}> = {
  lac_review:   { label: "LAC Review",       icon: ClipboardList, color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-200" },
  reg44:        { label: "Reg 44 Visit",      icon: Eye,           color: "text-[var(--cs-aria-gold)]",  bg: "bg-[var(--cs-aria-gold-bg)]",  border: "border-[var(--cs-aria-gold-soft)]" },
  supervision:  { label: "Supervision",       icon: Users,         color: "text-teal-600",    bg: "bg-teal-50",    border: "border-teal-200"   },
  appraisal:    { label: "Appraisal",         icon: CheckCircle2,  color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200"},
  training:     { label: "Training Renewal",  icon: GraduationCap, color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200"  },
  qualification:{ label: "Qualification",     icon: GraduationCap, color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200"  },
};

// ── Day bucket labels ─────────────────────────────────────────────────────────

type Bucket = "overdue" | "week" | "fortnight" | "month" | "quarter";

function getBucket(days: number): Bucket {
  if (days < 0)  return "overdue";
  if (days <= 7) return "week";
  if (days <= 14) return "fortnight";
  if (days <= 30) return "month";
  return "quarter";
}

const BUCKET_CONFIG: Record<Bucket, { label: string; badgeClass: string; bg: string; border: string }> = {
  overdue:   { label: "Overdue",        badgeClass: "bg-red-100 text-red-700 border-red-200",       bg: "bg-red-50",     border: "border-red-200"    },
  week:      { label: "This Week",      badgeClass: "bg-amber-100 text-amber-700 border-amber-200",  bg: "bg-amber-50",   border: "border-amber-200"  },
  fortnight: { label: "Next 2 Weeks",   badgeClass: "bg-blue-100 text-blue-700 border-blue-200",     bg: "bg-blue-50",    border: "border-blue-200"   },
  month:     { label: "This Month",     badgeClass: "bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]",  bg: "bg-slate-50",   border: "border-[var(--cs-border)]"  },
  quarter:   { label: "Next 90 Days",   badgeClass: "bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]",  bg: "bg-white",      border: "border-[var(--cs-border-subtle)]"  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function daysBadge(days: number): string {
  if (days < 0)   return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days}d`;
}

// ── Event row ─────────────────────────────────────────────────────────────────

function EventRow({ item }: { item: KeyDateItem }) {
  const cfg = CAT_CONFIG[item.category];
  const Icon = cfg.icon;
  const badgeCls =
    item.overdue           ? "bg-red-100 text-red-700 border-red-200"     :
    item.days === 0        ? "bg-amber-100 text-amber-700 border-amber-200":
    item.days <= 7         ? "bg-amber-100 text-amber-700 border-amber-200":
    item.days <= 14        ? "bg-blue-100 text-blue-700 border-blue-200"  :
                             "bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]";

  return (
    <Link href={item.href} className="group">
      <div className={cn(
        "flex items-start gap-3 rounded-2xl border bg-white p-4 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
        item.overdue ? "border-l-4 border-l-red-500" : "",
      )}>
        {/* Category icon */}
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", cfg.bg)}>
          <Icon className={cn("h-4 w-4", cfg.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-[var(--cs-navy)] leading-snug">{item.title}</p>
              <p className="text-xs text-[var(--cs-text-muted)] mt-0.5">{item.subtitle}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className={cn("text-[9px] px-2 py-0.5 rounded-full border font-semibold", cfg.border, cfg.bg, cfg.color)}>
                {cfg.label}
              </Badge>
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", badgeCls)}>
                {daysBadge(item.days)}
              </span>
              <ChevronRight className="h-4 w-4 text-[var(--cs-text-gentle)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <p className="text-[10px] text-[var(--cs-text-muted)] mt-1">{formatDate(item.date)}</p>
        </div>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function KeyDatesPage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";

  const carePlansQuery = useCarePlans({ homeId });
  const staffQuery = useStaff();
  const qualsQuery = useQualifications({ expiringDays: 90 });
  const reg44Query = useReg44Visits({ homeId });

  const isLoading =
    carePlansQuery.isPending ||
    staffQuery.isPending ||
    qualsQuery.isPending ||
    reg44Query.isPending;

  const [activeCategories, setActiveCategories] = useState<EventCategory[]>(
    Object.keys(CAT_CONFIG) as EventCategory[]
  );
  const [search, setSearch] = useState("");

  const toggleCategory = (cat: EventCategory) => {
    setActiveCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // ── Build event list ────────────────────────────────────────────────────────
  const events = useMemo<KeyDateItem[]>(() => {
    const items: KeyDateItem[] = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const limit = new Date(today); limit.setDate(limit.getDate() + 90);

    const inWindow = (dateStr: string | null | undefined): boolean => {
      if (!dateStr) return false;
      const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
      // include overdue (any past date) + next 90 days
      return d <= limit;
    };

    // 1. LAC Reviews
    (carePlansQuery.data?.data ?? []).forEach((plan) => {
      if (!inWindow(plan.next_lac_review)) return;
      const days = daysUntil(plan.next_lac_review!);
      items.push({
        id:       `lac-${plan.id}`,
        date:     plan.next_lac_review!,
        days,
        category: "lac_review",
        title:    `LAC Review — ${getYPName(plan.child_id)}`,
        subtitle: `${plan.legal_status} · v${plan.version} care plan`,
        href:     `/care-plans/${plan.id}`,
        overdue:  days < 0,
      });
    });

    // 2. Reg 44 Visits (scheduled only)
    (reg44Query.data?.data ?? [])
      .filter((v) => v.status === "scheduled" && v.scheduled_date)
      .forEach((visit) => {
        if (!inWindow(visit.scheduled_date)) return;
        const days = daysUntil(visit.scheduled_date!);
        items.push({
          id:       `reg44-${visit.id}`,
          date:     visit.scheduled_date!,
          days,
          category: "reg44",
          title:    `Reg 44 Independent Visit`,
          subtitle: `Scheduled visit — ${visit.visitor_name ?? "visitor TBC"}`,
          href:     "/ri/reg44",
          overdue:  days < 0,
        });
      });

    // 3. Staff: Supervision & Appraisal due dates
    (staffQuery.data?.data ?? [])
      .filter((s) => s.is_active && s.role !== "responsible_individual")
      .forEach((s) => {
        if (inWindow(s.next_supervision_due)) {
          const days = daysUntil(s.next_supervision_due!);
          items.push({
            id:       `sup-${s.id}`,
            date:     s.next_supervision_due!,
            days,
            category: "supervision",
            title:    `Supervision — ${s.full_name}`,
            subtitle: `${s.job_title}`,
            href:     "/supervision",
            overdue:  days < 0,
          });
        }
        if (inWindow(s.next_appraisal_due)) {
          const days = daysUntil(s.next_appraisal_due!);
          items.push({
            id:       `apr-${s.id}`,
            date:     s.next_appraisal_due!,
            days,
            category: "appraisal",
            title:    `Appraisal — ${s.full_name}`,
            subtitle: `${s.job_title}`,
            href:     "/workforce/appraisals",
            overdue:  days < 0,
          });
        }
      });

    // 4. Qualification / training renewals
    (qualsQuery.data?.data ?? [])
      .filter((q) => q.expiry_date && inWindow(q.expiry_date))
      .forEach((q) => {
        const days = daysUntil(q.expiry_date!);
        items.push({
          id:       `qual-${q.id}`,
          date:     q.expiry_date!,
          days,
          category: q.mandatory ? "training" : "qualification",
          title:    `${q.qualification_name} renewal`,
          subtitle: `${getStaffName(q.staff_id)}${q.awarding_body ? ` · ${q.awarding_body}` : ""}`,
          href:     `/workforce/staff/${q.staff_id}`,
          overdue:  days < 0,
        });
      });

    // Sort by date ascending (overdue first — most negative first)
    return items.sort((a, b) => a.days - b.days);
  }, [carePlansQuery.data, reg44Query.data, staffQuery.data, qualsQuery.data]);

  // Filtered + grouped
  const filtered = useMemo(() => {
    let list = events.filter((e) => activeCategories.includes(e.category));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => {
        const hay = [e.title, e.subtitle, CAT_CONFIG[e.category].label, formatDate(e.date)].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }, [events, activeCategories, search]);

  const grouped = useMemo(() => {
    const map = new Map<Bucket, KeyDateItem[]>();
    (["overdue", "week", "fortnight", "month", "quarter"] as Bucket[]).forEach((b) => map.set(b, []));
    filtered.forEach((item) => map.get(getBucket(item.days))!.push(item));
    return map;
  }, [filtered]);

  const overdueCount   = grouped.get("overdue")!.length;
  const thisWeekCount  = grouped.get("week")!.length;
  const upcomingCount  = filtered.length - overdueCount;

  return (
    <PageShell
      title="Key Dates"
      subtitle="Statutory deadlines, review dates, and operational milestones — next 90 days"
      ariaContext={{ pageTitle: "Key Dates & Deadlines", sourceType: "general" }}
      quickCreateContext={{ module: "compliance", defaultTaskCategory: "compliance" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={KEY_DATE_EXPORT_COLS} filename="key-dates" />
          <PrintButton title="Key Dates" subtitle="Chamberlain House — Key Dates & Deadlines" targetId="key-dates-content" />
          <AriaStudioQuickActionButton context={{ record_type: "task", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="key-dates-content" className="space-y-5">

        {/* ── Summary strip ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Overdue",          value: overdueCount,  color: overdueCount  > 0 ? "text-red-600"  : "text-emerald-600", bg: overdueCount  > 0 ? "bg-red-50 border-red-100"  : "bg-emerald-50 border-emerald-100" },
            { label: "This Week",        value: thisWeekCount, color: thisWeekCount > 0 ? "text-amber-600": "text-emerald-600", bg: thisWeekCount > 0 ? "bg-amber-50 border-amber-100": "bg-emerald-50 border-emerald-100" },
            { label: "Next 90 Days",     value: upcomingCount, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-100" },
            { label: "Types Tracked",    value: Object.keys(CAT_CONFIG).length, color: "text-[var(--cs-text-secondary)]", bg: "bg-slate-50 border-[var(--cs-border-subtle)]" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={cn("rounded-2xl border p-4 text-center", bg)}>
              <div className={cn("text-2xl font-bold tabular-nums", color)}>{value}</div>
              <div className="text-[10px] text-[var(--cs-text-muted)] mt-0.5 font-medium">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Category filters ────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--cs-text-muted)] mr-1">
            <Filter className="h-3.5 w-3.5" />Filter:
          </div>
          {(Object.entries(CAT_CONFIG) as [EventCategory, typeof CAT_CONFIG[EventCategory]][]).map(([cat, cfg]) => {
            const Icon = cfg.icon;
            const active = activeCategories.includes(cat);
            const count = events.filter((e) => e.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  active
                    ? cn(cfg.bg, cfg.border, cfg.color)
                    : "bg-white border-[var(--cs-border)] text-[var(--cs-text-muted)] hover:border-slate-300 hover:text-[var(--cs-text-secondary)]",
                )}
              >
                <Icon className="h-3 w-3" />
                {cfg.label}
                {count > 0 && (
                  <span className={cn("rounded-full text-[9px] font-bold px-1.5 py-0.5",
                    active ? "bg-white/60" : "bg-slate-100",
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Search ──────────────────────────────────────────────────────────── */}
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
          <Input
            placeholder="Search events, staff, young people…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs rounded-lg"
          />
        </div>

        {search && (
          <p className="text-xs text-[var(--cs-text-muted)]">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} matching &quot;{search}&quot;
          </p>
        )}

        {/* ── Loading ─────────────────────────────────────────────────────────── */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--cs-text-muted)]" />
            <span className="ml-2 text-sm text-[var(--cs-text-muted)]">Loading your key dates…</span>
          </div>
        )}

        {/* ── Timeline groups ─────────────────────────────────────────────────── */}
        {!isLoading && (
          <div className="space-y-6">
            {(["overdue", "week", "fortnight", "month", "quarter"] as Bucket[]).map((bucket) => {
              const bucketItems = grouped.get(bucket)!;
              if (bucketItems.length === 0) return null;
              const bcfg = BUCKET_CONFIG[bucket];
              return (
                <div key={bucket}>
                  {/* Bucket header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1",
                      bcfg.badgeClass,
                    )}>
                      {bucket === "overdue" ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : (
                        <CalendarDays className="h-3 w-3" />
                      )}
                      <span className="text-xs font-semibold">{bcfg.label}</span>
                      <span className="text-[10px] font-normal opacity-70">({bucketItems.length})</span>
                    </div>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>

                  {/* Events in this bucket */}
                  <div className="space-y-2">
                    {bucketItems.map((item) => (
                      <EventRow key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && !isLoading && (
              <div className="text-center py-16">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-[var(--cs-text-secondary)]">No upcoming dates in the selected categories</p>
                <p className="text-xs text-[var(--cs-text-muted)] mt-1">Try enabling more category filters or check back later</p>
              </div>
            )}
          </div>
        )}

        {/* ── Regulatory basis note ────────────────────────────────────────────── */}
        <div className="rounded-xl border border-[var(--cs-border-subtle)] bg-slate-50 px-4 py-3 text-xs text-[var(--cs-text-muted)]">
          <span className="font-semibold text-[var(--cs-text-secondary)]">Regulatory Basis — </span>
          LAC reviews: Children Act 1989 (minimum every 6 months, first within 20 days of placement).
          Reg 44 visits: Children&apos;s Homes Regulations 2015 Reg 44 (every 28 days, unannounced).
          Supervisions: Standard 6 Quality Standards — minimum 6-weekly for care staff.
          DBS/training renewals: Standard 5 &amp; 6 Quality Standards.
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Key Dates & Deadlines — LAC reviews, care plan reviews, Reg 44 visits, Reg 45 reports, court dates, placement anniversary, key worker meetings, court hearings, statutory deadlines"
        recordType="task"
        className="mt-6"
      />
    </PageShell>
  );
}
