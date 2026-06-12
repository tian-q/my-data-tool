import type { StorageAdapter } from "@app/core";

// Browser implementation of the storage contract, backed by localStorage.
export const webStorage: StorageAdapter = {
	async get<T>(key: string): Promise<T | null> {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : null;
	},
	async set<T>(key: string, value: T): Promise<void> {
		localStorage.setItem(key, JSON.stringify(value));
	},
	async remove(key: string): Promise<void> {
		localStorage.removeItem(key);
	},
};
