"use client";

import React from "react";
import { getStore } from "@/lib/db/store";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Clock, Users, Shield, FileText, CheckSquare, Sparkles } from "lucide-react";

function useIntelligenceSummary() {
  const store = getStore();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);

  const children = (store.youngPeople as any[] || []).filter((yp: any) => yp.status === "current");
  const staff = (store.staff as any[] || []);
  const incidents = (store.incidents as any[] || []).filter((i: any) => i.date >= weekAgo);
  const tasks = (store.tasks as any[] || []).filter((t: any) => t.status !== "completed" && t.status !== "cancelled");
  const overdueTasks = tasks.filter((t: any) => t.due_date && t.due_date < today);
  const todayLogs = (store.dailyLog as any[] || []).filter((l: any) => l.date === today);
  const missingLogs = children.length - new Set(todayLogs.map((l: any) => l.child_id)).size;

  const needsAttention: { icon: string; text: string; level: "red" | "amber" }[] = [];
  const goingWell: string[] = [];
  const overdue: string[] = [];

  // Needs attention
  if (missingLogs > 0) needsAttention.push({ icon: "FileText", text: `${missingLogs} daily log${missingLogs > 1 ? "s" : ""} missing for today`, level: "red" });
  if (overdueTasks.length > 0) needsAttention.push({ icon: "CheckSquare", text: `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? "s" : ""}`, level: "amber" });
  const needsOversight = (store.incidents as any[] || []).filter((i: any) => i.requires_oversight && !i.oversight_by).length;
  if (needsOversight > 0) needsAttention.push({ icon: "Shield", text: `${needsOversight} incident${needsOversight > 1 ? "s" : ""} awaiting manager oversight`, level: "red" });

  // Going well
  if (incidents.length === 0) goingWell.push("No incidents in the last 7 days");
  if (missingLogs === 0) goingWell.push("All daily logs completed today");
  if (overdueTasks.length === 0) goingWell.push("No overdue tasks");
  const welfareChecks = (store.welfareChecks as any[] || []).filter((w: any) => w.date >= weekAgo);
  if (welfareChecks.length >= children.length) goingWell.push("Welfare checks on track this week");

  // Overdue
  const fireDrills = (store.fireDrills as any[] || []);
  const lastDrill = fireDrills.sort((a: any, b: any) => (b.date ?? "").localeCompare(a.date ?? ""))[0];
  if (lastDrill) {
    const daysSince = Math.floor((now.getTime() - new Date(lastDrill.date).getTime()) / 86400000);
    if (daysSince > 30) overdue.push(`Fire drill — last completed ${daysSince} days ago`);
  }

  // Aria says
  const topConcern = needsAttention[0]?.text ?? "";
  const topPositive = goingWell[0] ?? "";
  const ariaSays = topConcern && topPositive
    ? `Focus on ${topConcern.toLowerCase()}. On the positive side, ${topPositive.toLowerCase()}.`
    : topConcern ? `Priority: ${topConcern.toLowerCase()}.`
    : topPositive ? `${topPositive}. Keep it up.`
    : "All looking steady today.";

  return {
    date: now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    homeName: "Chamberlain House",
    stats: { children: children.length, staff: staff.length, incidents: incidents.length, tasks: tasks.length },
    needsAttention,
    goingWell,
    overdue,
    ariaSays,
  };
}

export function IntelligenceSummary() {
  const data = useIntelligenceSummary();

  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white shadow-[var(--cs-shadow-soft)] overflow-hidden">
      {/* Header */}
      <div className="bg-[var(--cs-navy)] text-white px-5 py-4">
        <p className="text-lg font-bold">🏠 {data.homeName}</p>
        <p className="text-sm text-white/60">{data.date}</p>
        <div className="flex gap-4 mt-3">
          <Stat label="needs attention" count={data.needsAttention.length} color="text-red-300" icon="⚡" />
          <Stat label="going well" count={data.goingWell.length} color="text-emerald-300" icon="✅" />
          <Stat label="overdue" count={data.overdue.length} color="text-amber-300" icon="⏰" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 border-b border-[var(--cs-border)]">
        {[
          { label: "Children", value: data.stats.children, icon: Users },
          { label: "Staff", value: data.stats.staff, icon: Users },
          { label: "Incidents", value: data.stats.incidents, icon: Shield },
          { label: "Tasks", value: data.stats.tasks, icon: CheckSquare },
        ].map((s) => (
          <div key={s.label} className="text-center py-3 border-r last:border-r-0 border-[var(--cs-border-subtle)]">
            <p className="text-lg font-bold text-[var(--cs-navy)] tabular-nums">{s.value}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)]">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="p-5 space-y-4">
        {/* Needs attention */}
        {data.needsAttention.length > 0 && (
          <Section title="Needs Attention" items={data.needsAttention.map((a) => ({ text: a.text, level: a.level }))} />
        )}

        {/* Going well */}
        {data.goingWell.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-emerald-700 mb-1.5">Going Well</p>
            {data.goingWell.map((text, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-emerald-700 py-1">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                {text}
              </div>
            ))}
          </div>
        )}

        {/* Overdue */}
        {data.overdue.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-red-700 mb-1.5">Overdue</p>
            {data.overdue.map((text, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-red-700 py-1">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {text}
              </div>
            ))}
          </div>
        )}

        {/* Aria says */}
        <div className="rounded-xl bg-[var(--cs-aria-gold-bg)] border border-[var(--cs-aria-gold-soft)] p-3 flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-[var(--cs-aria-gold)] shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--cs-text-secondary)] italic">{data.ariaSays}</p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, count, color, icon }: { label: string; count: number; color: string; icon: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm">{icon}</span>
      <span className={cn("text-sm font-bold", color)}>{count}</span>
      <span className="text-xs text-white/50">{label}</span>
    </div>
  );
}

function Section({ title, items }: { title: string; items: { text: string; level: "red" | "amber" }[] }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[var(--cs-text-secondary)] mb-1.5">{title}</p>
      {items.map((item, i) => (
        <div key={i} className={cn("flex items-center gap-2 text-xs py-1", item.level === "red" ? "text-red-700" : "text-amber-700")}>
          <span className={cn("h-2 w-2 rounded-full shrink-0", item.level === "red" ? "bg-red-500" : "bg-amber-500")} />
          {item.text}
        </div>
      ))}
    </div>
  );
}
