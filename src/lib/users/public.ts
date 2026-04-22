import type { DbUser } from "@/lib/auth";
import type { UserProgramCategory } from "@/lib/users/types";

export function publicUser(u: DbUser) {
  return {
    id: u._id.toHexString(),
    email: u.email,
    name: u.name,
    firstName: u.firstName ?? "",
    surname: u.surname ?? "",
    phone: u.phone ?? "",
    dateOfBirth: u.dateOfBirth ? u.dateOfBirth.toISOString().slice(0, 10) : "",
    category: (u.category ?? null) as UserProgramCategory | null,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt.toISOString(),
  };
}
