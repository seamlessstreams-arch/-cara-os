"use client";

import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { cn } from "@/lib/utils";
import {
  Activity, FileHeart, HeartPulse, Pill, Smile,
  Eye, Brain, ChevronRight,
} from "lucide-react";

const HEALTH_TILES = [
  {
    href: "/health-monitoring",
    icon: Activity,
    label: "Health Monitoring",
    desc: "Ongoing health observations, tracking, and daily wellbeing records",
    colour: "text-emerald-600 bg-emerald-50 border-emerald-100",
  },
  {
    href: "/health-passports",
    icon: FileHeart,
    label: "Health Passports",
    desc: "Comprehensive health passport documents for each young person",
    colour: "text-blue-600 bg-blue-50 border-blue-100",
  },
  {
    href: "/annual-health-assessment",
    icon: HeartPulse,
    label: "Annual Health Assessment",
    desc: "Statutory annual health assessments and action planning",
    colour: "text-violet-600 bg-violet-50 border-violet-100",
  },
  {
    href: "/medication",
    icon: Pill,
    label: "Medication",
    desc: "Medication administration records, stock management, and audits",
    colour: "text-amber-600 bg-amber-50 border-amber-100",
  },
  {
    href: "/dental-records",
    icon: Smile,
    label: "Dental",
    desc: "Dental appointments, treatment history, and check-up scheduling",
    colour: "text-sky-600 bg-sky-50 border-sky-100",
  },
  {
    href: "/eye-health",
    icon: Eye,
    label: "Eye Health",
    desc: "Optician appointments, prescriptions, and vision monitoring",
    colour: "text-teal-600 bg-teal-50 border-teal-100",
  },
  {
    href: "/mental-health-screening",
    icon: Brain,
    label: "Mental Health",
    desc: "SDQ screening, CAMHS referrals, and emotional wellbeing tracking",
    colour: "text-purple-600 bg-purple-50 border-purple-100",
  },
];

export default function HealthPage() {
  return (
    <PageShell
      title="Health & Wellbeing"
      subtitle="Physical, dental, optical, and mental health management"
      icon={<HeartPulse className="h-5 w-5 text-emerald-600" />}
      showQuickCreate={false}
    >
      {/* Summary banner */}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-800">
        <span className="font-semibold">Health Hub</span> — Oversee every aspect of a young
        person&apos;s health and wellbeing. Each module provides full records, appointment
        scheduling, and evidence trails for inspections.
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {HEALTH_TILES.map((tile) => (
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
        Children&apos;s Homes (England) Regulations 2015: Reg 10 (health and wellbeing
        standard). Promoting the Health and Well-being of Looked-After Children (DfE/DoH
        2015). SDQ and CAMHS referral pathways per local authority protocols.
      </div>
    </PageShell>
  );
}
