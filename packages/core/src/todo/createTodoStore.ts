import { createStore } from "zustand/vanilla";
import type { StorageAdapter } from "../shared/storage/StorageAdapter";
import { type Todo, todosSchema } from "./types";

const STORAGE_KEY = "todos";

export interface TodoState {
	todos: Todo[];
	load: () => Promise<void>;
	add: (title: string) => Promise<void>;
	toggle: (id: string) => Promise<void>;
	remove: (id: string) => Promise<void>;
}

// Factory: the storage adapter is injected, so the store never knows
// whether data lives in localStorage, a file, or an in-memory test double.
export function createTodoStore(storage: StorageAdapter) {
	return createStore<TodoState>((set, get) => {
		// Optimistic update with rollback: change memory first for an instant UI,
		// then persist. If the write fails, roll the in-memory state back so what
		// the user sees always matches what is actually stored.
		const persist = async (next: Todo[]) => {
			const prev = get().todos;
			set({ todos: next });
			try {
				await storage.set(STORAGE_KEY, next);
			} catch (err) {
				set({ todos: prev });
				console.error("Failed to persist todos:", err);
			}
		};

		return {
			todos: [],

			load: async () => {
				// Storage is an untrusted source: the file or localStorage value may be
				// corrupt or written by an older version. Validate at runtime and fall
				// back to an empty list instead of crashing on bad data.
				try {
					const raw = await storage.get<unknown>(STORAGE_KEY);
					const parsed = todosSchema.safeParse(raw ?? []);
					set({ todos: parsed.success ? parsed.data : [] });
				} catch (err) {
					console.error("Failed to load todos:", err);
					set({ todos: [] });
				}
			},

			add: async (title: string) => {
				const todo: Todo = {
					id: crypto.randomUUID(),
					title,
					done: false,
					createdAt: Date.now(),
				};
				await persist([...get().todos, todo]);
			},

			toggle: async (id: string) => {
				await persist(
					get().todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
				);
			},

			remove: async (id: string) => {
				await persist(get().todos.filter((t) => t.id !== id));
			},
		};
	});
}

export type TodoStore = ReturnType<typeof createTodoStore>;
