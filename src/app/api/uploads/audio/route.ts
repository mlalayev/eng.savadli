import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireUser } from "@/lib/api/authz";

const MAX_BYTES = 100 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "audio/mpeg", // mp3
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/mp4", // some m4a
  "audio/x-m4a",
]);

function extensionForMime(mime: string): string {
  if (mime === "audio/mpeg") return ".mp3";
  if (mime === "audio/wav" || mime === "audio/x-wav") return ".wav";
  if (mime === "audio/ogg") return ".ogg";
  if (mime === "audio/mp4" || mime === "audio/x-m4a") return ".m4a";
  return ".audio";
}

export async function POST(req: Request) {
  const guard = await requireUser(["creator", "admin", "teacher"]);
  if (!guard.ok) return guard.response;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const entry = form.get("file");
  if (!entry || typeof entry === "string") {
    return Response.json({ error: "Missing file" }, { status: 400 });
  }

  const file = entry as File;
  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json({ error: "Only MP3, WAV, M4A, or OGG audio is allowed." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Audio must be 100MB or smaller." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const name = `${randomUUID()}${extensionForMime(file.type)}`;
  const dir = path.join(process.cwd(), "public", "uploads", "exams-audio");
  await mkdir(dir, { recursive: true });
  const fullPath = path.join(dir, name);
  await writeFile(fullPath, buffer);

  const url = `/uploads/exams-audio/${name}`;
  return Response.json({ url }, { status: 201 });
}

