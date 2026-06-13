"use client";

// CARA — CALENDAR event editor (create / edit slide-over)

import React, { useEffect, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { useYoungPeople } from "@/hooks/use-young-people";
import { useStaff } from "@/hooks/use-staff";
import { useCreateCalendarEvent, useUpdateCalendarEvent, type CreateEventBody } from "@/hooks/use-calendar";
import type { CalendarEvent } from "@/lib/calendar/calendar-types";

const inputCls =
  "w-full rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] px-3 py-2 text-sm text-[var(--cs-navy)] outline-none focus-visible:border-[var(--cs-teal)]";
const labelCls = "mb-1 block text-xs font-semibold text-[var(--cs-text-secondary)]";

const EVENT_TYPES = ["meeting", "appointment", "review", "training", "visit", "deadline", "other"];
const REMINDERS: { label: string; value: number | null }[] = [
  { label: "No reminder", value: null },
  { label: "15 minutes before", value: 15 },
  { label: "30 minutes before", value: 30 },
  { label: "1 hour before", value: 60 },
  { label: "1 day before", value: 1440 },
];

interface ExternalRow {
  name: string;
  email: string;
}
interface TaskRow {
  title: string;
  due_date: string;
}

export function EventEditor({
  open,
  onClose,
  defaultDate,
  editing,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
  editing?: CalendarEvent | null;
  onSaved?: (id: string) => void;
}) {
  const yp = useYoungPeople();
  const staff = useStaff();
  const create = useCreateCalendarEvent();
  const update = useUpdateCalendarEvent(editing?.id ?? "");

  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("meeting");
  const [date, setDate] = useState(defaultDate ?? "");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [childId, setChildId] = useState("");
  const [description, setDescription] = useState("");
  const [staffIds, setStaffIds] = useState<string[]>([]);
  const [externals, setExternals] = useState<ExternalRow[]>([]);
  const [reminder, setReminder] = useState<number | null>(60);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Reset/seed when opening
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitle(editing.title);
      setEventType(editing.event_type);
      setDate(editing.start.slice(0, 10));
      setStartTime(editing.start.slice(11, 16) || "10:00");
      setEndTime(editing.end?.slice(11, 16) || "11:00");
      setAllDay(editing.all_day);
      setLocation(editing.location ?? "");
      setChildId(editing.child_id ?? "");
      setDescription(editing.description ?? "");
      setStaffIds(editing.attendees.filter((a) => a.kind === "staff" && a.staff_id).map((a) => a.staff_id as string));
      setExternals(editing.attendees.filter((a) => a.kind === "external").map((a) => ({ name: a.name, email: a.email ?? "" })));
      setReminder(editing.reminder_minutes_before);
      setTasks([]);
    } else {
      setTitle("");
      setEventType("meeting");
      setDate(defaultDate ?? "");
      setStartTime("10:00");
      setEndTime("11:00");
      setAllDay(false);
      setLocation("");
      setChildId("");
      setDescription("");
      setStaffIds([]);
      setExternals([]);
      setReminder(60);
      setTasks([]);
    }
    setError(null);
  }, [open, editing, defaultDate]);

  if (!open) return null;

  const youngPeople = yp.data?.data ?? [];
  const staffList = staff.data?.data ?? [];

  const toggleStaff = (id: string) =>
    setStaffIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("A title is required.");
    if (!date) return setError("A date is required.");

    const start = allDay ? `${date}T00:00:00` : `${date}T${startTime}:00`;
    const end = allDay ? null : `${date}T${endTime}:00`;

    const staffAttendees = staffIds.map((id) => {
      const s = staffList.find((m) => m.id === id);
      return { kind: "staff" as const, name: s?.full_name ?? "Staff", email: null, staff_id: id };
    });
    const extAttendees = externals
      .filter((x) => x.name.trim())
      .map((x) => ({ kind: "external" as const, name: x.name.trim(), email: x.email.trim() || null, staff_id: null }));

    const body: CreateEventBody = {
      title: title.trim(),
      description: description.trim(),
      event_type: eventType,
      start,
      end,
      all_day: allDay,
      location: location.trim() || null,
      child_id: childId || null,
      attendees: [...staffAttendees, ...extAttendees],
      reminder_minutes_before: reminder,
      tasks: tasks.filter((t) => t.title.trim()).map((t) => ({ title: t.title.trim(), due_date: t.due_date || null })),
    };

    if (editing) {
      update.mutate(
        { title: body.title, description: body.description, event_type: body.event_type, start, end, all_day: allDay, location: body.location, child_id: body.child_id, reminder_minutes_before: reminder },
        { onSuccess: (d) => { onSaved?.(d.event.id); onClose(); } },
      );
    } else {
      create.mutate(body, { onSuccess: (d) => { onSaved?.(d.event.id); onClose(); } });
    }
  };

  const pending = create.isPending || update.isPending;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-[var(--cs-surface-elevated)] shadow-[var(--cs-shadow-card)]">
        <div className="sticky top-0 flex items-center justify-between border-b border-[var(--cs-border-subtle)] bg-[var(--cs-surface-elevated)] px-5 py-3">
          <h2 className="text-sm font-bold text-[var(--cs-navy)]">{editing ? "Edit event" : "New event"}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-[var(--cs-text-muted)] hover:bg-[var(--cs-surface)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-5 py-4">
          <div>
            <label className={labelCls}>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Placement planning meeting" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Type</label>
              <select value={eventType} onChange={(e) => setEventType(e.target.value)} className={`${inputCls} capitalize`}>
                {EVENT_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-[var(--cs-text-secondary)]">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            All-day
          </label>

          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Start</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>End</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} />
              </div>
            </div>
          )}

          <div>
            <label className={labelCls}>Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} placeholder="Room, address or video link" />
          </div>

          <div>
            <label className={labelCls}>Linked young person (optional)</label>
            <select value={childId} onChange={(e) => setChildId(e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {youngPeople.map((c) => (
                <option key={c.id} value={c.id}>{c.preferred_name || c.first_name} {c.last_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Staff attendees</label>
            <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-[var(--cs-border-subtle)] p-2">
              {staffList.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm text-[var(--cs-text-secondary)]">
                  <input type="checkbox" checked={staffIds.includes(s.id)} onChange={() => toggleStaff(s.id)} />
                  {s.full_name}
                </label>
              ))}
              {staffList.length === 0 && <p className="text-xs text-[var(--cs-text-gentle)]">No staff loaded.</p>}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className={labelCls + " mb-0"}>External attendees</label>
              <button type="button" onClick={() => setExternals((p) => [...p, { name: "", email: "" }])} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--cs-teal)]">
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {externals.map((x, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={x.name} onChange={(e) => setExternals((p) => p.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))} className={inputCls} placeholder="Name / role" />
                  <input value={x.email} onChange={(e) => setExternals((p) => p.map((r, j) => (j === i ? { ...r, email: e.target.value } : r)))} className={inputCls} placeholder="email (optional)" />
                  <button type="button" onClick={() => setExternals((p) => p.filter((_, j) => j !== i))} className="shrink-0 text-[var(--cs-text-muted)]">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Reminder</label>
            <select value={reminder ?? ""} onChange={(e) => setReminder(e.target.value === "" ? null : Number(e.target.value))} className={inputCls}>
              {REMINDERS.map((r) => <option key={r.label} value={r.value ?? ""}>{r.label}</option>)}
            </select>
          </div>

          {!editing && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className={labelCls + " mb-0"}>Associated tasks</label>
                <button type="button" onClick={() => setTasks((p) => [...p, { title: "", due_date: "" }])} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--cs-teal)]">
                  <Plus className="h-3 w-3" /> Add task
                </button>
              </div>
              <div className="space-y-2">
                {tasks.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={t.title} onChange={(e) => setTasks((p) => p.map((r, j) => (j === i ? { ...r, title: e.target.value } : r)))} className={inputCls} placeholder="Task to prepare" />
                    <input type="date" value={t.due_date} onChange={(e) => setTasks((p) => p.map((r, j) => (j === i ? { ...r, due_date: e.target.value } : r)))} className={`${inputCls} w-36`} />
                    <button type="button" onClick={() => setTasks((p) => p.filter((_, j) => j !== i))} className="shrink-0 text-[var(--cs-text-muted)]">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {tasks.length === 0 && <p className="text-[11px] text-[var(--cs-text-gentle)]">Real tasks — they appear in Tasks and on the calendar, captured once.</p>}
              </div>
            </div>
          )}

          <div>
            <label className={labelCls}>Notes</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls} placeholder="Agenda, purpose, anything useful…" />
          </div>

          {error && <p className="text-sm text-[var(--cs-warning)]">{error}</p>}

          <div className="flex gap-2 pb-6">
            <button type="submit" disabled={pending} className="rounded-xl bg-[var(--cs-navy)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
              {pending ? "Saving…" : editing ? "Save changes" : "Create event"}
            </button>
            <button type="button" onClick={onClose} className="rounded-xl border border-[var(--cs-border)] px-4 py-2 text-sm font-semibold text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)]">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
