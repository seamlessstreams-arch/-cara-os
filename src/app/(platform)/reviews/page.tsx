"use client";

import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { cn } from "@/lib/utils";
import {
  ClipboardList, Calendar, HeartPulse, AlertOctagon,
  Home, FileSearch, BookCheck, ChevronRight,
} from "lucide-react";

const REVIEW_TILES = [
  {
    href: "/lac-reviews",
    icon: ClipboardList,
    label: "LAC Reviews",
    desc: "Looked-after child statutory reviews and IRO oversight",
    colour: "text-blue-600 bg-blue-50 border-blue-100",
  },
  {
    href: "/annual-development-reviews",
    icon: Calendar,
    label: "Annual Development Reviews",
    desc: "Yearly progress and outcomes review for each young person",
    colour: "text-violet-600 bg-violet-50 border-violet-100",
  },
  {
    href: "/annual-health-assessment",
    icon: HeartPulse,
    label: "Health Assessments",
    desc: "Annual health assessments and action plans",
    colour: "text-emerald-600 bg-emerald-50 border-emerald-100",
  },
  {
    href: "/serious-incident-reviews",
    icon: AlertOctagon,
    label: "Serious Incident Reviews",
    desc: "Post-incident analysis, lessons learned, and corrective actions",
    colour: "text-red-600 bg-red-50 border-red-100",
  },
  {
    href: "/placement-reviews",
    icon: Home,
    label: "Placement Reviews",
    desc: "Placement stability, suitability, and matching reviews",
    colour: "text-amber-600 bg-amber-50 border-amber-100",
  },
  {
    href: "/ri/reg44",
    icon: FileSearch,
    label: "Reg 44 Reports",
    desc: "Independent monthly monitoring visit reports",
    colour: "text-sky-600 bg-sky-50 border-sky-100",
  },
  {
    href: "/ri/reg45",
    icon: BookCheck,
    label: "Reg 45 Reviews",
    desc: "Six-monthly quality of care reviews by the Responsible Individual",
    colour: "text-teal-600 bg-teal-50 border-teal-100",
  },
];

export default function ReviewsPage() {
  return (
    <PageShell
      title="Reviews"
      subtitle="Manage and track all review types"
      icon={<ClipboardList className="h-5 w-5 text-blue-600" />}
      showQuickCreate={false}
    >
      {/* Summary banner */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm text-blue-800">
        <span className="font-semibold">Reviews Hub</span> — Access all statutory and internal review
        processes from one place. Each review type links to its full module with records,
        scheduling, and evidence.
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {REVIEW_TILES.map((tile) => (
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
                  <p className="text-sm font-semibold truncate">{tile.label}</p>
                  <p className="text-xs opacity-70 mt-0.5 line-clamp-2">{tile.desc}</p>
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
        Care Planning, Placement and Case Review (England) Regulations 2010: reviews of
        placement plans. Children&apos;s Homes (England) Regulations 2015: Reg 44 (independent
        monitoring), Reg 45 (quality of care review). IRO Handbook (2010) and Looked After
        Children statutory guidance.
      </div>
    </PageShell>
  );
}
