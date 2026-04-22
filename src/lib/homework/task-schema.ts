import { z } from "zod";

const taskId = z.string().min(1).max(80);

const paragraph = z.object({
  id: taskId,
  kind: z.literal("paragraph"),
  text: z.string().min(1).max(20_000),
});

const image = z.object({
  id: taskId,
  kind: z.literal("image"),
  url: z
    .string()
    .min(1)
    .max(2_000_000)
    .refine(
      (s) =>
        /^https?:\/\//i.test(s) ||
        /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i.test(s),
      "Image must be an http(s) URL or a small data:image base64 string",
    ),
  caption: z.string().max(500).optional(),
});

const essay = z.object({
  id: taskId,
  kind: z.literal("essay"),
  prompt: z.string().min(1).max(5000),
});

const choice = z
  .object({
    id: taskId,
    kind: z.literal("choice"),
    prompt: z.string().min(1).max(5000),
    options: z.array(z.string().min(1).max(500)).min(2).max(12),
    correctIndex: z.number().int().min(0),
  })
  .refine((d) => d.correctIndex < d.options.length, {
    message: "correctIndex must refer to an option",
  });

const fill = z
  .object({
    id: taskId,
    kind: z.literal("fill"),
    prompt: z.string().min(1).max(5000),
    blanks: z.array(z.array(z.string().min(1).max(200)).min(1)).min(1).max(20),
  })
  .refine(
    (d) => {
      const count = (d.prompt.match(/\[input\]/g) ?? []).length;
      return count === d.blanks.length && count > 0;
    },
    { message: "Number of [input] markers must match blanks (at least one)" },
  );

const wordOrder = z
  .object({
    id: taskId,
    kind: z.literal("wordOrder"),
    sentence: z.string().min(1).max(500),
  })
  .refine((d) => d.sentence.trim().split(/\s+/).filter(Boolean).length >= 2, {
    message: "Word order needs at least two words",
  });

export const homeworkTaskSchema = z.discriminatedUnion("kind", [
  paragraph,
  image,
  essay,
  choice,
  fill,
  wordOrder,
]);

export const homeworkTasksSchema = z.array(homeworkTaskSchema).max(40);

export type HomeworkTaskInput = z.infer<typeof homeworkTaskSchema>;
