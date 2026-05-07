import { ObjectId } from "mongodb";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/api/authz";
import type { DbUser } from "@/lib/auth";

const patchSchema = z
  .object({
    name: z.string().min(1).max(80).optional(),
    imageUrl: z.string().min(1).max(400).optional(),
    currentPassword: z.string().min(1).optional(),
    newPassword: z.string().min(6).max(200).optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, { message: "No changes provided" })
  .refine((obj) => !(obj.newPassword && !obj.currentPassword), {
    message: "Current password is required to set a new password",
  });

export async function GET() {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const db = await getDb();
  const _id = new ObjectId(guard.user.id);
  const user = await db.collection<DbUser>("users").findOne({ _id });
  if (!user) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({
    user: {
      id: user._id.toHexString(),
      email: user.email,
      name: user.name,
      role: user.role,
      imageUrl: user.imageUrl ?? "",
    },
  });
}

export async function PATCH(req: Request) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const db = await getDb();
  const users = db.collection<DbUser>("users");
  const _id = new ObjectId(guard.user.id);
  const current = await users.findOne({ _id });
  if (!current) return Response.json({ error: "Not found" }, { status: 404 });

  const update: Partial<Omit<DbUser, "_id">> & { passwordHash?: string } = {
    updatedAt: new Date(),
  };

  if (parsed.data.name !== undefined) {
    update.name = parsed.data.name.trim();
  }
  if (parsed.data.imageUrl !== undefined) {
    const url = parsed.data.imageUrl.trim();
    // Hard-scope to our own public uploads to avoid external tracking links.
    if (!url.startsWith("/uploads/")) {
      return Response.json({ error: "Invalid image URL" }, { status: 400 });
    }
    update.imageUrl = url;
  }

  if (parsed.data.newPassword) {
    const ok = await bcrypt.compare(parsed.data.currentPassword ?? "", current.passwordHash);
    if (!ok) return Response.json({ error: "Current password is incorrect" }, { status: 400 });
    update.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  }

  await users.updateOne({ _id }, { $set: update });
  const next = await users.findOne({ _id });
  if (!next) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({
    user: {
      id: next._id.toHexString(),
      email: next.email,
      name: next.name,
      role: next.role,
      imageUrl: next.imageUrl ?? "",
    },
  });
}

