import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireUser } from "@/lib/api/authz";

const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function extensionForMime(mime: string): string {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  return ".img";
}

export async function POST(req: Request) {
  const guard = await requireUser();
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
    return Response.json({ error: "Only JPEG, PNG, or WebP images are allowed." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Avatar must be 3MB or smaller." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const name = `${randomUUID()}${extensionForMime(file.type)}`;
  const dir = path.join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buffer);

  return Response.json({ url: `/uploads/avatars/${name}` }, { status: 201 });
}

