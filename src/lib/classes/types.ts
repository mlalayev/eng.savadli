import type { ObjectId } from "mongodb";
import type { UserProgramCategory } from "@/lib/users/types";

export type DbClass = {
  _id: ObjectId;
  title: string;
  category?: UserProgramCategory | null;
  /** Teachers (and optionally creator) who manage this class. */
  teacherIds: string[];
  studentIds: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};
