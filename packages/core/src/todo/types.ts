import { z } from "zod";

// Runtime schema is the single source of truth; the Todo type is inferred from
// it so the two can never drift. Used to validate data loaded from storage.
export const todoSchema = z.object({
	id: z.string(),
	title: z.string(),
	done: z.boolean(),
	createdAt: z.number(),
});

export const todosSchema = z.array(todoSchema);

export type Todo = z.infer<typeof todoSchema>;
