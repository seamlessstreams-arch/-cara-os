// CARA — POST /api/v1/compliance-documents/[id]/track  { taskIds?: string[] }
// Turn a document's suggested actions into real, tracked compliance tasks — so
// they get a due date, surface in the calendar, and trigger reminders instead of
// being forgotten in a folder. Default: track all not-yet-created suggestions.
import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import type { Task } from "@/types";
import type { DocumentSuggestedTask, UploadedDocument } from "@/types/documents";
import { readJsonBody } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const actor = req.headers.get("x-user-id") || req.headers.get("cs_user_id") || "system";
  let body: any = {};
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  try { body = __parsed.data; } catch { body = {}; }
  const only: string[] | null = Array.isArray(body.taskIds) ? body.taskIds.map(String) : null;

  const doc = db.uploadedDocuments.findById(id) as UploadedDocument | undefined;
  if (!doc || !doc.ai_result) return NextResponse.json({ error: "Compliance document not found." }, { status: 404 });

  const suggestions = doc.ai_result.suggested_tasks.filter(
    (s) => !s.created_task_id && (!only || only.includes(s.id)),
  );
  if (suggestions.length === 0) {
    return NextResponse.json({ error: "No untracked actions to create." }, { status: 400 });
  }

  const created: Task[] = [];
  const idMap = new Map<string, string>(); // suggestion id → created task id
  for (const s of suggestions) {
    const task = db.tasks.create({
      title: s.title,
      description: s.description || s.title,
      category: "compliance",
      priority: s.priority,
      status: "not_started",
      assigned_to: null,
      assigned_role: null,
      due_date: s.due_date,
      start_date: null,
      completed_at: null,
      completed_by: null,
      recurring: false,
      recurring_schedule: null,
      requires_sign_off: false,
      signed_off_by: null,
      signed_off_at: null,
      evidence_note: null,
      evidence_files: [],
      escalated: false,
      escalated_to: null,
      escalation_reason: null,
      linked_child_id: null,
      linked_incident_id: null,
      linked_document_id: doc.id,
      parent_task_id: null,
      home_id: doc.linked_home_id,
      tags: ["compliance", doc.document_category ?? "document"],
      created_by: actor,
      updated_by: actor,
    });
    created.push(task);
    idMap.set(s.id, task.id);
  }

  // Stamp the suggestions as tracked and advance the document lifecycle.
  const updatedSuggestions: DocumentSuggestedTask[] = doc.ai_result.suggested_tasks.map((s) =>
    idMap.has(s.id) ? { ...s, approved: true, created_task_id: idMap.get(s.id)! } : s,
  );
  const allTracked = updatedSuggestions.every((s) => !!s.created_task_id);
  db.uploadedDocuments.patch(id, {
    ai_result: { ...doc.ai_result, suggested_tasks: updatedSuggestions },
    tasks_created: [...doc.tasks_created, ...created.map((t) => t.id)],
    document_status: allTracked ? "actioned" : doc.document_status,
  });

  return NextResponse.json({ data: { created_count: created.length, created_task_ids: created.map((t) => t.id), all_tracked: allTracked } }, { status: 201 });
}
