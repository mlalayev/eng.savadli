import { ObjectId } from "mongodb";
import type { DbUser } from "@/lib/auth";
import type { getDb } from "@/lib/db/mongodb";

type Db = Awaited<ReturnType<typeof getDb>>;

export async function assertAllStudents(db: Db, ids: string[]) {
  if (ids.length === 0) return true;
  const users = db.collection<DbUser>("users");
  const objectIds = ids.filter((x) => ObjectId.isValid(x)).map((x) => new ObjectId(x));
  if (objectIds.length !== ids.length) return false;
  const rows = await users
    .find({ _id: { $in: objectIds }, role: "student", status: "active" })
    .project({ _id: 1 })
    .toArray();
  return rows.length === ids.length;
}

export async function assertAllTeachersOrCreators(db: Db, ids: string[]) {
  if (ids.length === 0) return false;
  const users = db.collection<DbUser>("users");
  const objectIds = ids.filter((x) => ObjectId.isValid(x)).map((x) => new ObjectId(x));
  if (objectIds.length !== ids.length) return false;
  const rows = await users
    .find({
      _id: { $in: objectIds },
      role: { $in: ["teacher", "creator"] },
      status: "active",
    })
    .project({ _id: 1 })
    .toArray();
  return rows.length === ids.length;
}
