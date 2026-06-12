import { describe, expect, it, vi } from "vitest";
import type { StorageAdapter } from "../shared/storage/StorageAdapter";
import { createTodoStore } from "./createTodoStore";

// In-memory adapter: lets us drive the store without React or real storage.
// Optionally seeded so we can test loading pre-existing data.
function memoryAdapter(initial: Record<string, unknown> = {}): StorageAdapter {
	const store = new Map<string, unknown>(Object.entries(initial));
	return {
		async get<T>(key: string) {
			return store.has(key) ? (store.get(key) as T) : null;
		},
		async set<T>(key: string, value: T) {
			store.set(key, value as unknown);
		},
		async remove(key: string) {
			store.delete(key);
		},
	};
}

describe("createTodoStore", () => {
	it("adds a todo and persists it through the adapter", async () => {
		const adapter = memoryAdapter();
		const store = createTodoStore(adapter);
		await store.getState().add("buy milk");

		expect(store.getState().todos).toHaveLength(1);
		expect(store.getState().todos[0]?.title).toBe("buy milk");
		const saved = await adapter.get<unknown[]>("todos");
		expect(saved).toHaveLength(1);
	});

	it("toggles the done flag", async () => {
		const store = createTodoStore(memoryAdapter());
		await store.getState().add("x");
		const first = store.getState().todos[0];
		if (!first) throw new Error("expected a todo to exist");

		await store.getState().toggle(first.id);
		expect(store.getState().todos[0]?.done).toBe(true);

		await store.getState().toggle(first.id);
		expect(store.getState().todos[0]?.done).toBe(false);
	});

	it("removes a todo", async () => {
		const store = createTodoStore(memoryAdapter());
		await store.getState().add("x");
		const first = store.getState().todos[0];
		if (!first) throw new Error("expected a todo to exist");

		await store.getState().remove(first.id);
		expect(store.getState().todos).toHaveLength(0);
	});

	it("loads existing valid data from storage", async () => {
		const adapter = memoryAdapter({
			todos: [{ id: "1", title: "seed", done: false, createdAt: 0 }],
		});
		const store = createTodoStore(adapter);
		await store.getState().load();
		expect(store.getState().todos[0]?.title).toBe("seed");
	});

	it("keeps valid todos and discards invalid ones when loading", async () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		const adapter = memoryAdapter({
			todos: [
				{ id: "1", title: "good", done: false, createdAt: 0 },
				{ nope: true },
				"garbage",
			],
		});
		const store = createTodoStore(adapter);
		await store.getState().load();

		expect(store.getState().todos).toHaveLength(1);
		expect(store.getState().todos[0]?.title).toBe("good");
		expect(warnSpy).toHaveBeenCalled();
		warnSpy.mockRestore();
	});

	it("loads an empty list when nothing has been stored yet", async () => {
		const store = createTodoStore(memoryAdapter());
		await store.getState().load();
		expect(store.getState().todos).toEqual([]);
	});

	it("falls back to an empty list when the adapter throws on read", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const adapter: StorageAdapter = {
			async get() {
				throw new Error("disk read error");
			},
			async set() {},
			async remove() {},
		};
		const store = createTodoStore(adapter);
		await store.getState().load();

		expect(store.getState().todos).toEqual([]);
		expect(errorSpy).toHaveBeenCalled();
		errorSpy.mockRestore();
	});

	it("rolls back the in-memory state when a write fails", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const adapter: StorageAdapter = {
			async get() {
				return null;
			},
			async set() {
				throw new Error("quota exceeded");
			},
			async remove() {},
		};
		const store = createTodoStore(adapter);
		await store.getState().add("will fail to save");

		// The optimistic insert is reverted because persistence threw.
		expect(store.getState().todos).toEqual([]);
		expect(errorSpy).toHaveBeenCalled();
		errorSpy.mockRestore();
	});
});
