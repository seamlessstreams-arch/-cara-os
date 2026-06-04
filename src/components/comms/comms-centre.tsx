"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  Megaphone, Users, MoonStar, Pill, ShieldAlert, CalendarClock, HardHat, Wrench,
  GraduationCap, HeartHandshake, Siren, Hash, Send, Check, CheckCheck, Trash2, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuthContext } from "@/contexts/auth-context";
import { isManagerRole } from "@/lib/comms/comms-access";
import {
  useCommsChannels, useChannelMessages, useSendMessage, useMarkReceipt, useDeleteMessage,
} from "@/hooks/use-comms";
import type { CommsChannelType, CommsChannelSummary, CommsMessageEnriched } from "@/types/comms";

const CHANNEL_ICON: Record<CommsChannelType, ComponentType<{ className?: string }>> = {
  home_announcements: Megaphone, shift_handover: Users, managers_seniors: ShieldAlert,
  waking_night: MoonStar, medication_updates: Pill, safeguarding_alerts: ShieldAlert,
  rota_cover: CalendarClock, health_safety: HardHat, maintenance: Wrench,
  training_policy: GraduationCap, keywork_sessions: HeartHandshake, emergency_broadcast: Siren,
};

function timeLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });
}

export function CommsCentre() {
  const { currentUser } = useAuthContext();
  const userId = currentUser?.id ?? "staff_darren";
  const isManager = isManagerRole(currentUser?.role ?? "residential_care_worker");

  const { data: channels = [], isLoading } = useCommsChannels();
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = useMemo(() => channels.find((c) => c.id === activeId) ?? channels[0] ?? null, [channels, activeId]);
  const channelId = active?.id ?? null;

  const { data: messages = [] } = useChannelMessages(channelId);
  const send = useSendMessage();
  const mark = useMarkReceipt();
  const del = useDeleteMessage();

  const [draft, setDraft] = useState("");
  const [priority, setPriority] = useState<"normal" | "urgent" | "emergency">("normal");

  // Auto-mark unread messages as read when a channel is viewed.
  useEffect(() => {
    if (!channelId) return;
    for (const m of messages) {
      if (!m.read_by_me && m.author_id !== userId && !m.is_deleted) {
        mark.mutate({ messageId: m.id, channelId });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, messages.length]);

  const onSend = () => {
    if (!channelId || !draft.trim()) return;
    send.mutate(
      { channel_id: channelId, body: draft.trim(), priority },
      { onSuccess: () => { setDraft(""); setPriority("normal"); } },
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[480px]">
      {/* ── Channel list ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-y-auto">
        <div className="px-4 py-3 border-b border-[var(--cs-border-subtle)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cs-text-muted)]">Channels</p>
        </div>
        {isLoading ? (
          <div className="p-4 text-sm text-[var(--cs-text-muted)]">Loading…</div>
        ) : (
          <div className="p-2 space-y-0.5">
            {channels.map((c: CommsChannelSummary) => {
              const Icon = CHANNEL_ICON[c.type] ?? Hash;
              const isActive = c.id === channelId;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors",
                    isActive ? "bg-[var(--cs-teal-bg)] text-[var(--cs-teal-strong)]" : "hover:bg-[var(--cs-surface)]",
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[var(--cs-teal)]" : "text-[var(--cs-text-muted)]")} />
                  <span className="flex-1 min-w-0 truncate text-sm font-medium text-[var(--cs-navy)]">{c.name}</span>
                  {c.unread_count > 0 && (
                    <span className="shrink-0 rounded-full bg-[var(--cs-avisaar-coral)] text-white text-[10px] font-semibold px-1.5 py-0.5">{c.unread_count}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Thread ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--cs-border)] bg-white flex flex-col overflow-hidden">
        {active ? (
          <>
            <div className="px-4 py-3 border-b border-[var(--cs-border-subtle)] flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[var(--cs-navy)]">{active.name}</p>
                <p className="text-[11px] text-[var(--cs-text-muted)] capitalize">{active.access.replace(/_/g, " ")} · {active.sensitivity.replace(/_/g, " ")}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-sm text-[var(--cs-text-muted)] text-center py-12">No messages yet. Start the conversation below.</p>
              ) : (
                messages.map((m: CommsMessageEnriched) => {
                  const mine = m.author_id === userId;
                  return (
                    <div key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                      <div className={cn(
                        "max-w-[78%] rounded-2xl px-3.5 py-2.5 border",
                        m.priority === "emergency" ? "border-red-300 bg-red-50" :
                        m.priority === "urgent" ? "border-amber-300 bg-amber-50" :
                        mine ? "border-[var(--cs-teal-soft)] bg-[var(--cs-teal-bg)]" : "border-[var(--cs-border-subtle)] bg-[var(--cs-surface)]",
                      )}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-[var(--cs-navy)]">{mine ? "You" : m.author_name}</span>
                          {m.priority !== "normal" && (
                            <Badge variant="outline" className={cn("text-[9px] gap-0.5", m.priority === "emergency" ? "text-red-700 border-red-300" : "text-amber-700 border-amber-300")}>
                              <AlertTriangle className="h-2.5 w-2.5" />{m.priority}
                            </Badge>
                          )}
                          <span className="text-[10px] text-[var(--cs-text-muted)]">{timeLabel(m.created_at)}{m.edited ? " · edited" : ""}</span>
                        </div>
                        <p className={cn("text-sm leading-relaxed whitespace-pre-wrap", m.is_deleted ? "italic text-[var(--cs-text-muted)]" : "text-[var(--cs-text-secondary)]")}>{m.body}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {mine && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--cs-text-muted)]">
                              <CheckCheck className="h-3 w-3" />{m.read_count} read{m.requires_acknowledgement ? ` · ${m.acknowledged_count} ack` : ""}
                            </span>
                          )}
                          {m.requires_acknowledgement && !mine && !m.is_deleted && (
                            m.acknowledged_by_me ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--cs-success)]"><Check className="h-3 w-3" />Acknowledged</span>
                            ) : (
                              <button onClick={() => mark.mutate({ messageId: m.id, channelId: m.channel_id, acknowledge: true })} className="text-[10px] font-semibold text-[var(--cs-teal)] hover:underline">
                                Acknowledge
                              </button>
                            )
                          )}
                          {(mine || isManager) && !m.is_deleted && (
                            <button onClick={() => del.mutate({ messageId: m.id, channelId: m.channel_id })} className="inline-flex items-center gap-0.5 text-[10px] text-[var(--cs-text-muted)] hover:text-red-600">
                              <Trash2 className="h-3 w-3" />Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── Composer ─────────────────────────────────────────── */}
            <div className="border-t border-[var(--cs-border-subtle)] p-3 space-y-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Message ${active.name}…`}
                rows={2}
                className="resize-none"
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSend(); }}
              />
              <div className="flex items-center justify-between gap-2">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as never)}
                  className="text-xs rounded-lg border border-[var(--cs-border)] px-2 py-1.5 bg-white"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent (notifies + needs acknowledgement)</option>
                  {isManager && <option value="emergency">Emergency broadcast</option>}
                </select>
                <Button size="sm" className="gap-1.5" disabled={!draft.trim() || send.isPending} onClick={onSend}>
                  <Send className="h-3.5 w-3.5" />{send.isPending ? "Sending…" : "Send"}
                </Button>
              </div>
              {send.isError && <p className="text-xs text-red-600">{(send.error as Error)?.message ?? "Could not send."}</p>}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-[var(--cs-text-muted)]">Select a channel to start.</div>
        )}
      </div>
    </div>
  );
}
