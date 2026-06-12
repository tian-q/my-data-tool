import type { StorageAdapter } from "@app/core";
import { BaseDirectory } from "@tauri-apps/api/path";
import {
	exists,
	mkdir,
	readTextFile,
	remove,
	writeTextFile,
} from "@tauri-apps/plugin-fs";

// Desktop implementation of the storage contract, backed by the file system.
// Data lives under $APPDATA/data/<key>.json.
const opts = { baseDir: BaseDirectory.AppData };
const DATA_DIR = "data";
const filePath = (key: string) => `${DATA_DIR}/${key}.json`;

export const tauriStorage: StorageAdapter = {
	async get<T>(key: string): Promise<T | null> {
		const path = filePath(key);
		if (!(await exists(path, opts))) return null;
		return JSON.parse(await readTextFile(path, opts)) as T;
	},
	async set<T>(key: string, value: T): Promise<void> {
		// recursive mkdir is idempotent; on first run it creates $APPDATA/data.
		await mkdir(DATA_DIR, { baseDir: BaseDirectory.AppData, recursive: true });
		await writeTextFile(filePath(key), JSON.stringify(value), opts);
	},
	async remove(key: string): Promise<void> {
		const path = filePath(key);
		if (await exists(path, opts)) await remove(path, opts);
	},
};
