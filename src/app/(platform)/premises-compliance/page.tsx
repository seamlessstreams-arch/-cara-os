"use client";

import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Loader2, RefreshCw, ShieldCheck, AlertOctagon, AlertTriangle, Clock, CheckCircle2,
  FileQuestion, ChevronRight, Building2,
} from "lucide-react";
import { usePremisesCompliance } from "@/hooks/use-premises-compliance";
import type { ComplianceStatus, ComplianceItem, PremisesComplianceResult } from "@/lib/engines/premises-compliance-engine";

const STATUS_META: Record<ComplianceStatus, { label: string; pill: string; rag: string; Icon: typeof Clock }> = {
  overdue: { label: "Overdue", pill: "bg-red-100 text-red-700", rag: "cs-rag-red", Icon: AlertOctagon },
  action: { label: "Action needed", pill: "bg-orange-100 text-orange-700", rag: "cs-rag-red", Icon: AlertTriangle },
  due_soon: { label: "Due soon", pill: "bg-amber-100 text-amber-700", rag: "cs-rag-amber", Icon: Clock },
  current: { label: "In date", pill: "bg-green-100 text-green-700", rag: "cs-rag-green", Icon: CheckCircle2 },
  no_record: { label: "No record", pill: "bg-slate-100 text-slate-500", rag: "cs-rag-slate", Icon: FileQuestion },
};

function Stat({ value, label, tone, Icon }: { value: number | string; label: string; tone: string; Icon: typeof Clock }) {
  return (
    <div className={cn("flex items-center gap-2.5 rounded-xl border px-3 py-2", tone)}>
      <Icon className="h-4.5 w-4.5 shrink-0 opacity-80" />
      <div className="leading-none">
        <div className="text-lg font-extrabold tabular-nums">{value}</div>
        <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{label}</div>
      </div>
    </div>
  );
}

function dueText(item: ComplianceItem): string {
  if (item.status === "no_record") return "No record on file";
  if (item.status === "action") return item.detail || "Outstanding action / failed check";
  if (item.due_date == null) return item.detail || "";
  const d = item.days_to_due ?? 0;
  if (item.status === "overdue") return `${Math.abs(d)}d overdue · was due ${item.due_date}`;
  if (item.status === "due_soon") return d === 0 ? `Due today` : `Due in ${d}d · ${item.due_date}`;
  return `In date · next ${item.due_date}`;
}

function ItemRow({ item }: { item: ComplianceItem }) {
  const m = STATUS_META[item.status];
  const inner = (
    <div className={cn("flex items-center gap-3 rounded-lg border-l-4 px-3 py-2", m.rag,
      item.status === "current" ? "bg-white" : item.status === "no_record" ? "bg-slate-50/50" : item.status === "due_soon" ? "bg-amber-50/40" : "bg-red-50/40")}>
      <m.Icon className={cn("h-4 w-4 shrink-0",
        item.status === "overdue" || item.status === "action" ? "text-red-500" : item.status === "due_soon" ? "text-amber-500" : item.status === "current" ? "text-green-600" : "text-slate-400")} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-[var(--cs-navy)]">{item.label}</div>
        <div className="truncate text-[11px] text-[var(--cs-text-muted)]">{dueText(item)}</div>
      </div>
      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", m.pill)}>{m.label}</span>
      {item.source_href && <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 print:hidden" />}
    </div>
  );
  return item.source_href ? <Link href={item.source_href} className="block transition-opacity hover:opacity-80">{inner}</Link> : inner;
}

function CategoryBlock({ data, category }: { data: PremisesComplianceResult; category: string }) {
  const items = data.items.filter((i) => i.category === category);
  if (items.length === 0) return null;
  const roll = data.by_category.find((c) => c.category === category);
  return (
    <Card>
      <CardContent className="py-4">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-sm font-bold text-[var(--cs-navy)]">{category}</h2>
          {roll && (roll.overdue + roll.action > 0
            ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">{roll.overdue + roll.action} need action</span>
            : roll.due_soon > 0
              ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">{roll.due_soon} due soon</span>
              : roll.no_record > 0
                ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">{roll.no_record} no record</span>
                : <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">all in date</span>)}
        </div>
        <div className="space-y-1.5">
          {items.map((i) => <ItemRow key={i.key} item={i} />)}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PremisesCompliancePage() {
  const { data, isLoading, isFetching, refetch } = usePremisesCompliance();
  const s = data?.summary;
  const categories = data ? Array.from(new Set(data.items.map((i) => i.category))) : [];

  return (
    <PageShell
      title="Premises & Safety Compliance"
      subtitle="Are all our statutory building-safety checks and certificates in date? Gas, electrical, fire risk assessment, routine safety checks, drills and servicing — one RAG currency board (CHR 2015 Reg 31 / health & safety)."
      caraContext={{ pageTitle: "Premises & Safety Compliance", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 print:hidden">
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} /> Refresh
          </button>
          <PrintButton title="Premises & Safety Compliance" />
        </div>
      }
    >
      <div className="cs-print-color mx-auto max-w-3xl space-y-4">
        {isLoading && <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

        {!isLoading && data && s && (
          <>
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--cs-navy)]"><Building2 className="h-4 w-4 text-[var(--cs-teal-strong)]" /> Chamberlain House — premises compliance</div>
                <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">{data.headline}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  <Stat value={s.compliance_rate != null ? `${s.compliance_rate}%` : "—"} label="In date" tone="bg-green-50 border-green-200 text-green-800" Icon={ShieldCheck} />
                  <Stat value={s.overdue} label="Overdue" tone="bg-red-50 border-red-200 text-red-800" Icon={AlertOctagon} />
                  <Stat value={s.action} label="Action needed" tone="bg-orange-50 border-orange-200 text-orange-800" Icon={AlertTriangle} />
                  <Stat value={s.due_soon} label="Due soon" tone="bg-amber-50 border-amber-200 text-amber-800" Icon={Clock} />
                  <Stat value={s.no_record} label="No record" tone="bg-[var(--cs-bg)] border-[var(--cs-border)] text-[var(--cs-navy)]" Icon={FileQuestion} />
                </div>
              </CardContent>
            </Card>

            {/* Attention — overdue / failed / due-soon, ranked */}
            {data.attention.length > 0 && (
              <Card className="border-2 border-red-200">
                <CardContent className="py-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold text-red-700"><AlertTriangle className="h-4 w-4" /> Needs attention <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px]">{data.attention.length}</span></div>
                  <div className="space-y-1.5">
                    {data.attention.map((i) => <ItemRow key={i.key} item={i} />)}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All checks, grouped by category */}
            {categories.map((c) => <CategoryBlock key={c} data={data} category={c} />)}

            <p className="px-1 text-center text-[11px] text-[var(--cs-text-muted)]">
              "No record" flags a statutory check with nothing on file — record it on the linked page to bring it into the compliance picture.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
