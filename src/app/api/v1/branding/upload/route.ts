// ── POST /api/v1/branding/upload ─────────────────────────────────────────────
// Logo upload endpoint. Validates file type and size, then stores the file.
//
// Security rules:
//   - Accepted MIME types: image/png, image/jpeg, image/svg+xml, image/webp
//   - Max size: 5 MB
//   - Content-type is validated server-side (not just the extension)
//   - Filenames are sanitised before writing

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
]);

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "branding");

function sanitiseFilename(name: string): string {
  // Remove path separators and null bytes, keep only safe characters
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.{2,}/g, ".");
}

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate MIME type (server-side, not just extension)
  const mimeType = file.type;
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return NextResponse.json(
      { error: `File type not allowed. Accepted: PNG, JPG, SVG, WebP` },
      { status: 415 }
    );
  }

  // Validate size
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File exceeds 5 MB limit" },
      { status: 413 }
    );
  }

  // Generate safe unique filename
  const originalName = (file as File).name ?? "upload";
  const ext = path.extname(sanitiseFilename(originalName)) || ".bin";
  const uniqueName = `${crypto.randomUUID()}${ext}`;

  // Ensure upload directory exists
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  const filePath = path.join(UPLOAD_DIR, uniqueName);

  // Write file
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  // Return the public URL
  const publicUrl = `/uploads/branding/${uniqueName}`;

  return NextResponse.json({
    data: {
      url: publicUrl,
      file_name: uniqueName,
      size_bytes: file.size,
      mime_type: mimeType,
      uploaded_at: new Date().toISOString(),
    },
  });
}
