"use client";

import Link from "next/link";
import { FileText, Users, AlertTriangle, PhoneCall, ClipboardList, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChildQuickActionsProps { childId: string; className?: string }

const ACTIONS = [
  { label: "Daily Log", icon: FileText, href: "/daily-log", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { label: "Key Work", icon: Users, href: "/key-working", color: "text-purple-600 bg-purple-50 border-purple-200" },
  { label: "Incident", icon: AlertTriangle, href: "/incidents", color: "text-red-600 bg-red-50 border-red-200" },
  { label: "Contact", icon: PhoneCall, href: "/family-contact", color: "text-green-600 bg-green-50 border-green-200" },
  { label: "Review", icon: ClipboardList, href: "/reviews", color: "text-amber-600 bg-amber-50 border-amber-200" },
];

export function ChildQuickActions({ childId, className }: ChildQuickActionsProps) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-2", className)}>
      {/* Primary: Universal record entry — "just write what happened" */}
      <Link
        href={`/record/${childId}`}
        className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all hover:shadow-md active:scale-95 min-h-[40px] bg-[var(--cs-navy)] text-white shrink-0"
      >
        <Sparkles className="h-3.5 w-3.5 text-[var(--cs-cara-gold)]" />
        Record anything
      </Link>

      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.label}
            href={`${action.href}?childId=${childId}`}
            className={cn("flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium whitespace-nowrap transition-all hover:shadow-sm active:scale-95 min-h-[40px]", action.color)}
          >
            <Icon className="h-3.5 w-3.5" />
            {action.label}
          </Link>
        );
      })}
    </div>
  );
}
