import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db/mongodb";
import type { UserProgramCategory } from "@/lib/users/types";

export type ProfileRole = "creator" | "admin" | "teacher" | "student" | "parent";

export type DbUser = {
  _id: ObjectId;
  email: string;
  /** Full display name (typically "FirstName Surname"). */
  name: string;
  firstName?: string;
  surname?: string;
  phone?: string;
  dateOfBirth?: Date;
  category?: UserProgramCategory;
  role: ProfileRole;
  passwordHash: string;
  status: "active" | "disabled";
  createdAt: Date;
  updatedAt: Date;
};

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function findUserByEmail(email: string): Promise<DbUser | null> {
  const db = await getDb();
  return await db.collection<DbUser>("users").findOne({ email: email.toLowerCase().trim() });
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    // Keep users logged in for 30 days
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await findUserByEmail(parsed.data.email);
        if (!user) return null;
        if (user.status === "disabled") return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user._id.toHexString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const role = (user as unknown as { role?: ProfileRole }).role;
        if (role) token.role = role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role ?? "student";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

// NextAuth v4 (used here) returns a route handler function.
export const nextAuthHandler = NextAuth(authOptions);

