import { ObjectId } from "mongodb";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/api/authz";
import type { DbUser } from "@/lib/auth";
import { publicUser } from "@/lib/users/public";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const patchSchema = z
  .object({
    status: z.enum(["active", "disabled"]).optional(),
    resetPassword: z.string().min(6).optional(),
    name: z.string().min(1).optional(),
    firstName: z.string().min(1).optional(),
    surname: z.string().min(1).optional(),
    phone: z.string().min(6).max(40).optional(),
    dateOfBirth: isoDate.optional(),
    category: z.enum(["dsat", "ielts", "general"]).optional(),
    role: z.enum(["creator", "admin", "teacher", "student", "parent"]).optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, { message: "No changes provided" });

function parseDobUtc(iso: string): Date {
  return new Date(`${iso}T12:00:00.000Z`);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireUser(["creator", "admin"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) {
    return Response.json({ error: "Invalid user id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const db = await getDb();
  const users = db.collection<DbUser>("users");
  const _id = new ObjectId(id);
  const current = await users.findOne({ _id });
  if (!current) return Response.json({ error: "Not found" }, { status: 404 });

  const update: Partial<Omit<DbUser, "_id">> & { passwordHash?: string } = {
    updatedAt: new Date(),
  };
  if (parsed.data.status) update.status = parsed.data.status;
  if (parsed.data.resetPassword) {
    update.passwordHash = await bcrypt.hash(parsed.data.resetPassword, 12);
  }
  if (parsed.data.role) {
    if (parsed.data.role === "creator" && guard.user.role !== "creator") {
      return Response.json({ error: "Only creator can assign creator role" }, { status: 403 });
    }
    update.role = parsed.data.role;
  }
  if (parsed.data.phone !== undefined) update.phone = parsed.data.phone.trim();

  const nextFirst =
    parsed.data.firstName !== undefined ? parsed.data.firstName.trim() : (current.firstName ?? "");
  const nextSurname =
    parsed.data.surname !== undefined ? parsed.data.surname.trim() : (current.surname ?? "");

  if (parsed.data.firstName !== undefined) update.firstName = parsed.data.firstName.trim();
  if (parsed.data.surname !== undefined) update.surname = parsed.data.surname.trim();

  if (parsed.data.name !== undefined) {
    update.name = parsed.data.name.trim();
  } else if (parsed.data.firstName !== undefined || parsed.data.surname !== undefined) {
    const composed = `${nextFirst} ${nextSurname}`.trim();
    if (composed) update.name = composed;
  }

  if (parsed.data.dateOfBirth !== undefined) {
    update.dateOfBirth = parseDobUtc(parsed.data.dateOfBirth);
  }
  if (parsed.data.category !== undefined) {
    update.category = parsed.data.category;
  }

  await users.updateOne({ _id }, { $set: update });
  const row = await users.findOne({ _id });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ user: publicUser(row) });
}
