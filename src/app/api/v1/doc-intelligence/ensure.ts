// Shared by the doc-intelligence detail/approve/audit routes.
//
// The smart record lives in the in-memory store, so on a live serverless
// tenant it exists only on the lambda that handled the upload. Any other
// instance (cold start, or simply a different lambda taking the follow-up
// request) must rebuild it from the durable documents row — safe because the
// analysis is deterministic: same stored text, same ai_result, same id.

import { dal } from "@/lib/db/dal";
import { db } from "@/lib/db/store";
import { todayStr } from "@/lib/utils";
import { deriveUploadedDocument } from "@/lib/compliance/uploaded-document-bridge";
import type { Document } from "@/types";
import type { UploadedDocument } from "@/types/documents";

export async function ensureUploadedDocument(docId: string): Promise<UploadedDocument | null> {
  const existing = db.uploadedDocuments.findById(docId);
  if (existing) return existing;

  let dalDoc: Document | null = null;
  try {
    dalDoc = (await dal.documents.findById(docId)) as Document | null;
  } catch {
    dalDoc = null;
  }
  if (!dalDoc) return null;

  return db.uploadedDocuments.create(deriveUploadedDocument(dalDoc, todayStr()));
}
