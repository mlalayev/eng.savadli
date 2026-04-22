import { z } from "zod";
import bcrypt from "bcryptjs";
import type { OptionalId } from "mongodb";
import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/api/authz";
import type { ProfileRole, DbUser } from "@/lib/auth";
import { publicUser } from "@/lib/users/public";

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const createUserSchema = z.object({
  firstName: z.string().min(1),
  surname: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(6).max(40),
  dateOfBirth: isoDate,
  category: z.enum(["dsat", "ielts", "general"]),
  role: z.enum(["creator", "admin", "teacher", "student", "parent"]),
  password: z.string().min(6),
});

function parseDobUtc(iso: string): Date {
  return new Date(`${iso}T12:00:00.000Z`);
}

export async function GET(req: Request) {
  const guard = await requireUser(["creator", "admin", "teacher"]);
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim() ?? "";

  const db = await getDb();

  if (search.length > 0) {
    if (search.length > 80) {
      return Response.json({ error: "Search text is too long" }, { status: 400 });
    }
    const escaped = escapeRegex(search);
    const q = {
      role: "student" as const,
      status: "active" as const,
      $or: [
        { email: { $regex: escaped, $options: "i" } },
        { name: { $regex: escaped, $options: "i" } },
        { firstName: { $regex: escaped, $options: "i" } },
        { surname: { $regex: escaped, $options: "i" } },
      ],
    };
    const rows = await db.collection<DbUser>("users").find(q).sort({ email: 1 }).limit(20).toArray();
    return Response.json({ users: rows.map(publicUser) });
  }

  const q =
    guard.user.role === "teacher"
      ? { role: "student" as const, status: "active" as const }
      : {};

  const rows = await db
    .collection<DbUser>("users")
    .find(q)
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray();

  return Response.json({ users: rows.map(publicUser) });
}

export async function POST(req: Request) {
  const guard = await requireUser(["creator", "admin"]);
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const role: ProfileRole = parsed.data.role;
  if (role === "creator" && guard.user.role !== "creator") {
    return Response.json({ error: "Only creator can create creator accounts" }, { status: 403 });
  }

  const db = await getDb();
  const users = db.collection<OptionalId<DbUser>>("users");

  const existing = await users.findOne({ email });
  if (existing) {
    return Response.json({ error: "Email already exists" }, { status: 409 });
  }

  const now = new Date();
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const firstName = parsed.data.firstName.trim();
  const surname = parsed.data.surname.trim();
  const name = `${firstName} ${surname}`.trim();
  const doc: OptionalId<DbUser> = {
    email,
    name,
    firstName,
    surname,
    phone: parsed.data.phone.trim(),
    dateOfBirth: parseDobUtc(parsed.data.dateOfBirth),
    category: parsed.data.category,
    role,
    status: "active",
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };
  const result = await users.insertOne(doc);

  const created = await users.findOne({ _id: result.insertedId });
  return Response.json({ user: created ? publicUser(created) : null }, { status: 201 });
}
