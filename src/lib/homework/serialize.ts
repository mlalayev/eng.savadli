import type { DbHomework } from "./types";

export function publicHomeworkFields(h: DbHomework) {
  return {
    id: h._id.toHexString(),
    classId: h.classId.toHexString(),
    title: h.title,
    instructions: h.instructions,
    tasks: h.tasks && h.tasks.length > 0 ? h.tasks : undefined,
    dueAt: h.dueAt ? h.dueAt.toISOString() : null,
    createdBy: h.createdBy,
    createdAt: h.createdAt.toISOString(),
    updatedAt: h.updatedAt.toISOString(),
  };
}
