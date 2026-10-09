import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// Local-disk storage for logos and receipts. Swap this module for S3 / Azure
// Blob storage when the app moves into the central Broadwing platform.

const ROOT = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = /^(image\/(png|jpe?g|gif|webp|heic|heif|svg\+xml)|application\/pdf)$/;

export interface StoredFile {
  storagePath: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export function isUpload(value: FormDataEntryValue | null): value is File {
  return typeof value === "object" && value !== null && "arrayBuffer" in value && value.size > 0;
}

export async function saveUpload(file: File, folder: string): Promise<StoredFile> {
  if (file.size > MAX_BYTES) throw new Error(`"${file.name}" is larger than 10 MB.`);
  const mimeType = file.type || "application/octet-stream";
  if (!ALLOWED.test(mimeType)) throw new Error(`"${file.name}" must be an image or a PDF.`);

  const ext = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "") || "";
  const storagePath = path.posix.join(folder, `${randomUUID()}${ext}`);
  const abs = resolveSafe(storagePath);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, Buffer.from(await file.arrayBuffer()));
  return { storagePath, fileName: file.name, mimeType, size: file.size };
}

export async function readUpload(storagePath: string): Promise<Buffer> {
  return readFile(resolveSafe(storagePath));
}

export async function deleteUpload(storagePath: string) {
  await unlink(resolveSafe(storagePath)).catch(() => undefined);
}

function resolveSafe(storagePath: string): string {
  const abs = path.resolve(ROOT, storagePath);
  if (!abs.startsWith(ROOT + path.sep)) throw new Error("Invalid storage path");
  return abs;
}
