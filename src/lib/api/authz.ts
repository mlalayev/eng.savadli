import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import type { ProfileRole } from "@/lib/auth";

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  role: ProfileRole;
};

export async function requireUser(allow?: readonly ProfileRole[]) {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user) {
    return { ok: false as const, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (allow && !allow.includes(user.role)) {
    return { ok: false as const, response: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return {
    ok: true as const,
    user: {
      id: user.id,
      email: user.email ?? "",
      name: user.name,
      role: user.role,
    } satisfies SessionUser,
  };
}

