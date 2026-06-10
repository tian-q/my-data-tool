// Abstract contract for "storage ability".
// Business code depends only on this interface, never on a concrete store
// (localStorage / file system). The shells inject a concrete implementation.
export interface StorageAdapter {
	get<T>(key: string): Promise<T | null>;
	set<T>(key: string, value: T): Promise<void>;
	remove(key: string): Promise<void>;
}
