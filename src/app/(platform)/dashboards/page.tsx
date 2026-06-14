"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — NAMED DASHBOARDS INDEX
// The 8 role dashboards, each composed entirely from the event spine.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import {
  LayoutDashboard, Building2, HeartHandshake, Users, ClipboardCheck, ShieldAlert, FileCheck2, Gauge, ChevronRight, Activity,
} from "lucide-react";

const DASHBOARDS = [
  { href: "/dashboards/manager", title: "Manager", icon: LayoutDashboard, desc: "Decisions to make, risks rising, and what automation has done — the daily command centre." },
  { href: "/dashboards/ri", title: "Responsible Individual", icon: Building2, desc: "Organisational oversight: evidence, compliance posture and improvement trajectory." },
  { href: "/dashboards/child-progress", title: "Child Progress", icon: HeartHandshake, desc: "Each child's outcomes, placement stability, behaviour patterns and relationships." },
  { href: "/dashboards/workforce", title: "Staff Workforce", icon: Users, desc: "Team continuity, recording practice and the tasks assigned across the staff team." },
  { href: "/dashboards/compliance", title: "Home Compliance", icon: ClipboardCheck, desc: "Fixed-rule checks, evidence coverage, record quality and data integrity." },
  { href: "/dashboards/risk-safeguarding", title: "Risk & Safeguarding", icon: ShieldAlert, desc: "Where risk is concentrating, why, and what's escalated to keep children safe." },
  { href: "/dashboards/reg45", title: "Regulation 45", icon: FileCheck2, desc: "The independent-monitoring picture: evidence, quality and improvement to test." },
  { href: "/dashboards/productivity", title: "Productivity & Overdue", icon: Gauge, desc: "Outstanding and overdue actions, owners and bottlenecks across the home." },
];

export default function DashboardsIndexPage() {
  return (
    <PageShell
      title="Dashboards"
      subtitle="Eight role-specific views, each calculated live from the event spine — capture once, surface everywhere"
      icon={<Activity className="h-5 w-5" />}
      showQuickCreate={false}
      caraContext={{ pageTitle: "Dashboards", sourceType: "general" }}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DASHBOARDS.map((d) => {
          const Icon = d.icon;
          return (
            <Link key={d.href} href={d.href} className="group">
              <Card className="h-full transition-colors hover:border-brand/50">
                <CardContent className="p-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand"><Icon className="h-4 w-4" /></div>
                    <ChevronRight className="h-4 w-4 text-[var(--cs-text-muted)] group-hover:text-brand transition-colors" />
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--cs-text-primary)]">{d.title}</h3>
                  <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{d.desc}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </PageShell>
  );
}
