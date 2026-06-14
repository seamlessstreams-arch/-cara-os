"use client";

import {
  FileText,
  Brain,
  Shield,
  Scale,
  Heart,
  FileSearch,
  Mic,
  ClipboardCheck,
  ListTodo,
  Search,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ══════════════════════════════════════════════════════════════════════════════
// CaraAgentBadge — shows which specialist agent handled a query
//
// Each agent type has a distinct icon so staff can understand how Cara routed
// their request and which domain expertise was applied.
// ══════════════════════════════════════════════════════════════════════════════

const AGENT_CONFIG: Record<string, { label: string; icon: typeof Brain }> = {
  admin: { label: "Admin", icon: FileText },
  reasoning: { label: "Reasoning", icon: Brain },
  safeguarding: { label: "Safeguarding", icon: Shield },
  regulatory: { label: "Regulatory", icon: Scale },
  therapeutic: { label: "Therapeutic", icon: Heart },
  document: { label: "Document", icon: FileSearch },
  voice: { label: "Voice", icon: Mic },
  report: { label: "Report", icon: ClipboardCheck },
  task: { label: "Task", icon: ListTodo },
  search: { label: "Search", icon: Search },
};

type CaraAgentBadgeProps = {
  agentUsed: string;
  className?: string;
};

export function CaraAgentBadge({ agentUsed, className }: CaraAgentBadgeProps) {
  const config = AGENT_CONFIG[agentUsed] ?? {
    label: agentUsed,
    icon: Sparkles,
  };
  const Icon = config.icon;

  return (
    <Badge
      variant="cara"
      className={cn("gap-1 capitalize", className)}
    >
      <Icon className="size-3" />
      {config.label}
    </Badge>
  );
}
