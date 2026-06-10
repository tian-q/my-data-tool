import { createStore } from "zustand/vanilla";
import type { StorageAdapter } from "../storage/StorageAdapter";
import type { Todo } from "../types";

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
	return createStore<TodoState>((set, get) => ({
		todos: [],

		load: async () => {
			const saved = await storage.get<Todo[]>(STORAGE_KEY);
			set({ todos: saved ?? [] });
		},

		add: async (title: string) => {
			const todo: Todo = {
				id: crypto.randomUUID(),
				title,
				done: false,
				createdAt: Date.now(),
			};
			const next = [...get().todos, todo];
			set({ todos: next });
			await storage.set(STORAGE_KEY, next);
		},

		toggle: async (id: string) => {
			const next = get().todos.map((t) =>
				t.id === id ? { ...t, done: !t.done } : t,
			);
			set({ todos: next });
			await storage.set(STORAGE_KEY, next);
		},

		remove: async (id: string) => {
			const next = get().todos.filter((t) => t.id !== id);
			set({ todos: next });
			await storage.set(STORAGE_KEY, next);
		},
	}));
}

export type TodoStore = ReturnType<typeof createTodoStore>;
