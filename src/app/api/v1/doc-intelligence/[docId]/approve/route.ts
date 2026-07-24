// POST /api/v1/doc-intelligence/:docId/approve
// Approve AI recommendations — optionally select which tasks to create
import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { createTaskRecord } from "@/lib/supabase/care-records";
import { generateId, todayStr, daysFromNow } from "@/lib/utils";
import { ensureUploadedDocument } from "../../ensure";

export async function POST(req: NextRequest, { params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params;
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const {
    actor_id = "staff_darren",
    approved_task_ids = [] as string[],    // IDs from suggested_tasks to create
    create_evidence_link = false,
    create_chronology = false,
    rejection_reason,
    action = "approve",                    // "approve" | "reject" | "request_review"
  } = body;

  // Rehydrates from the durable documents row when this lambda never saw the
  // upload (live cold start) — the deterministic analysis re-derives with it.
  const doc = await ensureUploadedDocument(docId);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!doc.ai_result) return NextResponse.json({ error: "Document has not been analysed yet" }, { status: 400 });

  const now = new Date().toISOString();
  const createdTaskIds: string[] = [];

  if (action === "approve") {
    // Create approved tasks
    for (const taskId of approved_task_ids) {
      const suggestion = doc.ai_result.suggested_tasks.find((t) => t.id === taskId);
      if (!suggestion) continue;

      // Create task in the main tasks store
      const task = {
        id: generateId("tsk"),
        home_id: doc.linked_home_id,
        title: suggestion.title,
        description: `${suggestion.description}\n\n[Auto-created from document: ${doc.original_file_name}]\n${suggestion.source_quote ? `Source: "${suggestion.source_quote}"` : ""}`,
        status: "not_started" as const,
        priority: suggestion.priority as "low" | "medium" | "high" | "urgent",
        category: "compliance" as const,
        assigned_to: null,
        created_by: actor_id,
        due_date: suggestion.due_date ?? daysFromNow(14),
        completed_at: null,
        linked_document_id: docId,
        linked_child_id: doc.linked_child_id,
        linked_staff_id: doc.linked_staff_id,
        created_at: now,
        updated_at: now,
      };
      // the store regenerates ids on create — record the AUTHORITATIVE id the
      // store returns, or the links here would point at a task that doesn't exist
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const created = createTaskRecord(task) as any;
      const createdId = (created?.id as string) ?? task.id;
      createdTaskIds.push(createdId);

      suggestion.approved = true;
      suggestion.created_task_id = createdId;
    }

    // Update document
    const newStatus = createdTaskIds.length > 0 ? "actioned" : "approved";
    db.uploadedDocuments.patch(docId, {
      document_status: newStatus,
      approved_by: actor_id,
      approved_at: now,
      tasks_created: [...doc.tasks_created, ...createdTaskIds],
      evidence_linked: create_evidence_link || doc.evidence_linked,
      chronology_created: create_chronology || doc.chronology_created,
    });

    db.documentAuditLog.append({
      id: generateId("dal"),
      document_id: docId,
      action: "approved",
      actor_id,
      timestamp: now,
      details: `Approved by ${actor_id}. ${createdTaskIds.length} task(s) created. Evidence link: ${create_evidence_link}. Chronology: ${create_chronology}.`,
      ai_confidence: doc.classification_confidence,
    });

    return NextResponse.json({
      data: db.uploadedDocuments.findById(docId),
      tasks_created: createdTaskIds,
      message: `Document approved. ${createdTaskIds.length} task(s) created.`,
    });
  }

  if (action === "reject") {
    db.uploadedDocuments.patch(docId, {
      document_status: "rejected",
    });
    db.documentAuditLog.append({
      id: generateId("dal"),
      document_id: docId,
      action: "rejected",
      actor_id,
      timestamp: now,
      details: `Rejected by ${actor_id}. Reason: ${rejection_reason ?? "Not specified"}`,
      ai_confidence: null,
    });
    return NextResponse.json({ data: db.uploadedDocuments.findById(docId), message: "Document rejected." });
  }

  if (action === "request_review") {
    db.documentAuditLog.append({
      id: generateId("dal"),
      document_id: docId,
      action: "sent_for_review",
      actor_id,
      timestamp: now,
      details: `Sent for manager review by ${actor_id}.`,
      ai_confidence: null,
    });
    return NextResponse.json({ data: doc, message: "Sent for manager review." });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
