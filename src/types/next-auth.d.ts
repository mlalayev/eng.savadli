import type { DefaultSession } from "next-auth";
import type { ProfileRole } from "@/lib/auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: ProfileRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: ProfileRole;
  }
}

