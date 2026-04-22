import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireUser } from "@/lib/api/authz";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

function extensionForMime(mime: string): string {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/gif") return ".gif";
  if (mime === "image/webp") return ".webp";
  return ".img";
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
    return Response.json({ error: "Only JPEG, PNG, GIF, or WebP images are allowed." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Image must be 5MB or smaller." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const name = `${randomUUID()}${extensionForMime(file.type)}`;
  const dir = path.join(process.cwd(), "public", "uploads", "exams");
  await mkdir(dir, { recursive: true });
  const fullPath = path.join(dir, name);
  await writeFile(fullPath, buffer);

  const url = `/uploads/exams/${name}`;
  return Response.json({ url }, { status: 201 });
}
