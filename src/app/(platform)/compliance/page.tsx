"use client";

import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ShieldCheck, FileSearch, BookCheck, Bell, ClipboardCheck,
  FileText, ScrollText, Award, ChevronRight,
} from "lucide-react";

// ── Tile data ────────────────────────────────────────────────────────────────

interface ComplianceTile {
  href: string;
  icon: React.ElementType;
  label: string;
  desc: string;
  colour: string;
  status?: "up_to_date" | "action_needed" | "overdue" | null;
}

const STATUS_BADGE: Record<string, { label: string; colour: string }> = {
  up_to_date:    { label: "Up to Date",    colour: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  action_needed: { label: "Action Needed", colour: "bg-amber-50 text-amber-700 border-amber-200" },
  overdue:       { label: "Overdue",       colour: "bg-red-50 text-red-700 border-red-200" },
};

const COMPLIANCE_TILES: ComplianceTile[] = [
  {
    href: "/ri/reg44",
    icon: FileSearch,
    label: "Reg 44 Reports",
    desc: "Independent monthly monitoring visit reports and action tracking",
    colour: "text-blue-600 bg-blue-50 border-blue-100",
    status: "up_to_date",
  },
  {
    href: "/ri/reg45",
    icon: BookCheck,
    label: "Reg 45 Reviews",
    desc: "Six-monthly quality of care reviews by the Responsible Individual",
    colour: "text-violet-600 bg-violet-50 border-violet-100",
    status: "action_needed",
  },
  {
    href: "/regulation-40",
    icon: Bell,
    label: "Ofsted Notifications",
    desc: "Regulation 40 notifications, submission tracking, and audit trail",
    colour: "text-amber-600 bg-amber-50 border-amber-100",
    status: "up_to_date",
  },
  {
    href: "/inspection-readiness",
    icon: ClipboardCheck,
    label: "Inspection Readiness",
    desc: "Annex A evidence mapping, readiness scores, and gap analysis",
    colour: "text-emerald-600 bg-emerald-50 border-emerald-100",
    status: "action_needed",
  },
  {
    href: "/policy-reviews",
    icon: FileText,
    label: "Policy Reviews",
    desc: "Statement of purpose, policies, procedures, and review scheduling",
    colour: "text-sky-600 bg-sky-50 border-sky-100",
    status: "up_to_date",
  },
  {
    href: "/audit-trail",
    icon: ScrollText,
    label: "Audit Trail",
    desc: "System-wide activity log, data access records, and change history",
    colour: "text-slate-600 bg-slate-50 border-slate-100",
    status: null,
  },
  {
    href: "/quality-assurance",
    icon: Award,
    label: "Quality Assurance",
    desc: "QA framework, case audits, practice standards, and improvement plans",
    colour: "text-teal-600 bg-teal-50 border-teal-100",
    status: "action_needed",
  },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function CompliancePage() {
  const upToDate    = COMPLIANCE_TILES.filter((t) => t.status === "up_to_date").length;
  const needsAction = COMPLIANCE_TILES.filter((t) => t.status === "action_needed").length;
  const overdue     = COMPLIANCE_TILES.filter((t) => t.status === "overdue").length;

  return (
    <PageShell
      title="Compliance & Regulatory"
      subtitle="Regulatory monitoring, inspection readiness, and quality assurance"
      icon={<ShieldCheck className="h-5 w-5 text-emerald-600" />}
      showQuickCreate={false}
    >
      {/* Summary banner */}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-800">
        <span className="font-semibold">Compliance Hub</span> — Central overview of all
        regulatory and quality assurance modules. Stay on top of Ofsted requirements,
        Reg 44/45 cycles, and inspection evidence.
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
          <p className="text-2xl font-bold text-emerald-600">{upToDate}</p>
          <p className="text-xs text-emerald-600/70">Up to Date</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
          <p className="text-2xl font-bold text-amber-600">{needsAction}</p>
          <p className="text-xs text-amber-600/70">Action Needed</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50/40 p-4">
          <p className="text-2xl font-bold text-red-600">{overdue}</p>
          <p className="text-xs text-red-600/70">Overdue</p>
        </div>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {COMPLIANCE_TILES.map((tile) => (
          <Link key={tile.href} href={tile.href}>
            <div
              className={cn(
                "rounded-2xl border p-4 hover:shadow-sm transition-all cursor-pointer h-full",
                tile.colour,
              )}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-white/60 shrink-0">
                  <tile.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold truncate">{tile.label}</p>
                    {tile.status && (
                      <Badge
                        variant="outline"
                        className={cn("text-[9px] px-1.5 py-0 border shrink-0", STATUS_BADGE[tile.status].colour)}
                      >
                        {STATUS_BADGE[tile.status].label}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs opacity-70 line-clamp-2">{tile.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 opacity-40 shrink-0 mt-0.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Regulatory note */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-600">Regulatory Basis — </span>
        Children&apos;s Homes (England) Regulations 2015: Reg 40 (notifiable events),
        Reg 44 (independent person&apos;s report), Reg 45 (review of quality of care).
        Guide to the Quality Standards. Social Care Common Inspection Framework (SCCIF).
        Ofsted Annex A evidence requirements.
      </div>
    </PageShell>
  );
}
