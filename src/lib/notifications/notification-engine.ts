import { getStore } from "@/lib/db/store";

export interface CornerstoneNotification {
  id: string;
  type: string;
  priority: "urgent" | "high" | "normal" | "low";
  title: string;
  body: string;
  icon: string;
  action_url?: string;
  child_id?: string;
  created_at: string;
  read: boolean;
  dismissed: boolean;
}

const notificationState: Map<string, { read: boolean; dismissed: boolean }> = new Map();

export function generateNotifications(staffId: string): CornerstoneNotification[] {
  const store = getStore();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const notifications: CornerstoneNotification[] = [];

  // Overdue tasks
  const tasks = (store.tasks as any[] || []);
  const overdue = tasks.filter((t: any) => t.status === "pending" && t.due_date && t.due_date < today);
  for (const task of overdue.slice(0, 5)) {
    const id = `notif_task_${task.id}`;
    const state = notificationState.get(id) ?? { read: false, dismissed: false };
    if (!state.dismissed) {
      notifications.push({ id, type: "task_overdue", priority: "high", title: "Task overdue", body: task.title?.slice(0, 80) ?? "Unnamed task", icon: "CheckSquare", action_url: "/tasks", created_at: task.due_date, ...state });
    }
  }

  // Incidents needing oversight
  const incidents = (store.incidents as any[] || []);
  const needsOversight = incidents.filter((i: any) => i.requires_oversight && !i.oversight_by);
  for (const inc of needsOversight.slice(0, 3)) {
    const id = `notif_oversight_${inc.id}`;
    const state = notificationState.get(id) ?? { read: false, dismissed: false };
    if (!state.dismissed) {
      notifications.push({ id, type: "oversight_needed", priority: "urgent", title: "Oversight needed", body: `${inc.reference ?? "Incident"}: ${(inc.type ?? "").replace(/_/g, " ")}`, icon: "Shield", action_url: `/incidents/${inc.id}`, child_id: inc.child_id, created_at: inc.created_at ?? today, ...state });
    }
  }

  // Missing daily logs
  const children = (store.youngPeople as any[] || []).filter((yp: any) => yp.status === "current");
  const todayLogs = (store.dailyLog as any[] || []).filter((l: any) => l.date === today);
  const loggedChildren = new Set(todayLogs.map((l: any) => l.child_id));
  const missing = children.filter((c: any) => !loggedChildren.has(c.id));
  if (missing.length > 0) {
    const id = `notif_missing_logs_${today}`;
    const state = notificationState.get(id) ?? { read: false, dismissed: false };
    if (!state.dismissed) {
      notifications.push({ id, type: "missing_log", priority: "normal", title: "Daily logs missing", body: `${missing.length} child${missing.length > 1 ? "ren" : ""} without a daily log today`, icon: "FileText", action_url: "/daily-log", created_at: now.toISOString(), ...state });
    }
  }

  return notifications.sort((a, b) => {
    const p = { urgent: 0, high: 1, normal: 2, low: 3 };
    return (p[a.priority] ?? 4) - (p[b.priority] ?? 4);
  });
}

export function getUnreadCount(staffId: string): number {
  return generateNotifications(staffId).filter((n) => !n.read).length;
}

export function markAsRead(notificationId: string): void {
  const state = notificationState.get(notificationId) ?? { read: false, dismissed: false };
  notificationState.set(notificationId, { ...state, read: true });
}

export function dismissNotification(notificationId: string): void {
  const state = notificationState.get(notificationId) ?? { read: false, dismissed: false };
  notificationState.set(notificationId, { ...state, dismissed: true });
}
