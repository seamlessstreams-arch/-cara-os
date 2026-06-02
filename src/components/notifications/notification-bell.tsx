"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateNotifications, markAsRead, dismissNotification, type CornerstoneNotification } from "@/lib/notifications/notification-engine";

export function NotificationBell({ staffId = "staff_darren" }: { staffId?: string }) {
  const [notifications, setNotifications] = useState<CornerstoneNotification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const poll = () => setNotifications(generateNotifications(staffId));
    poll();
    const t = setInterval(poll, 30000);
    return () => clearInterval(t);
  }, [staffId]);

  useEffect(() => {
    function handle(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const unread = notifications.filter((n) => !n.read).length;
  const hasUrgent = notifications.some((n) => n.priority === "urgent" && !n.read);

  const handleMarkRead = (id: string) => { markAsRead(id); setNotifications(generateNotifications(staffId)); };
  const handleDismiss = (id: string) => { dismissNotification(id); setNotifications(generateNotifications(staffId)); };

  const PRIORITY_COLORS: Record<string, string> = {
    urgent: "border-l-red-500 bg-red-50",
    high: "border-l-amber-500 bg-amber-50",
    normal: "border-l-blue-500 bg-blue-50",
    low: "border-l-slate-300 bg-slate-50",
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn("relative p-2 rounded-xl transition-colors", open ? "bg-slate-100" : "hover:bg-slate-100")}
        aria-label={`Notifications (${unread} unread)`}
      >
        <Bell className={cn("h-5 w-5 text-slate-600", hasUrgent && "animate-bounce text-red-500")} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-1">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-[var(--cs-border)] bg-white shadow-[var(--cs-shadow-elevated)] z-50 overflow-hidden animate-in fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--cs-border)]">
            <span className="text-sm font-bold text-[var(--cs-navy)]">Notifications</span>
            {unread > 0 && (
              <button
                onClick={() => { notifications.forEach((n) => markAsRead(n.id)); setNotifications(generateNotifications(staffId)); }}
                className="text-xs text-[var(--cs-aria-gold)] hover:underline"
              >Mark all read</button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-[var(--cs-border-subtle)]">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[var(--cs-text-muted)]">All clear — no notifications</div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div key={n.id} className={cn("flex items-start gap-3 px-4 py-3 border-l-4 transition-colors", PRIORITY_COLORS[n.priority] ?? PRIORITY_COLORS.normal, n.read && "opacity-60")}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--cs-text)]">{n.title}</p>
                    <p className="text-xs text-[var(--cs-text-muted)] truncate">{n.body}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.read && <button onClick={() => handleMarkRead(n.id)} className="p-1 rounded hover:bg-white/50"><Check className="h-3 w-3 text-emerald-600" /></button>}
                    <button onClick={() => handleDismiss(n.id)} className="p-1 rounded hover:bg-white/50"><X className="h-3 w-3 text-slate-400" /></button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="px-4 py-2 border-t border-[var(--cs-border)]">
            <Link href="/notifications" className="text-xs text-[var(--cs-aria-gold)] hover:underline" onClick={() => setOpen(false)}>View all notifications</Link>
          </div>
        </div>
      )}
    </div>
  );
}
